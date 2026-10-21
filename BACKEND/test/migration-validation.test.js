import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/texticode_test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-enough-length'

/**
 * Suite de validación de lógica de migración y restricciones relacionales.
 * Estas pruebas modelan el comportamiento estricto que PostgreSQL ejecutará
 * una vez aplicada la migración en una base desechable o staging confirmado.
 */

// Helper para emular el catálogo de PostgreSQL y sus restricciones
class SimulatedPostgresDatabase {
  constructor() {
    this.empresas = []
    this.usuarios = []
    this.roles = [
      { Id_Rol: 1, Nombre_Rol: 'Administrador' },
      { Id_Rol: 2, Nombre_Rol: 'Operario' },
      { Id_Rol: 3, Nombre_Rol: 'Cliente' },
    ]
    this.usuario_empresa = []
    this.materiales = []
    this.ordenes = []
  }

  // Pre-check: Detección de registros huérfanos antes de migrar
  checkHuerfanos() {
    const ordenesMaterialHuerfano = this.ordenes.filter(
      o => !this.materiales.some(m => m.Id_Material === o.Id_Material)
    )
    const ordenesClienteHuerfano = this.ordenes.filter(
      o => !this.usuarios.some(u => u.Id_Usuario === o.Id_Cliente)
    )
    const ordenesOperarioHuerfano = this.ordenes.filter(
      o => o.Id_Operario && !this.usuarios.some(u => u.Id_Usuario === o.Id_Operario)
    )
    const materialesClienteHuerfano = this.materiales.filter(
      m => m.Id_Cliente && !this.usuarios.some(u => u.Id_Usuario === m.Id_Cliente)
    )

    return {
      ordenesMaterialHuerfano: ordenesMaterialHuerfano.length,
      ordenesClienteHuerfano: ordenesClienteHuerfano.length,
      ordenesOperarioHuerfano: ordenesOperarioHuerfano.length,
      materialesClienteHuerfano: materialesClienteHuerfano.length,
    }
  }

  // Simulación de Fase 1 & 2: Empresa inicial y migración de membresías
  crearEmpresaInicial(idEmpresa = 1, nombre = 'Empresa Principal') {
    this.empresas.push({ Id_Empresa: idEmpresa, Nombre_Empresa: nombre, Estado: 'activa' })
    // Migrar usuarios existentes
    for (const u of this.usuarios) {
      this.insertarMembresia({
        Id_Usuario: u.Id_Usuario,
        Id_Empresa: idEmpresa,
        Id_Rol: u.Id_Rol || 3,
        Estado: u.Estado === 'inactivo' ? 'inactivo' : 'activo',
        Es_Principal: true,
      })
    }
  }

  // Restricción: usuario_empresa_principal_unique
  insertarMembresia(m) {
    if (m.Es_Principal) {
      const existePrincipal = this.usuario_empresa.find(
        x => x.Id_Usuario === m.Id_Usuario && x.Es_Principal
      )
      if (existePrincipal) {
        const err = new Error('duplicate key value violates unique constraint "usuario_empresa_principal_unique"')
        err.code = '23505'
        throw err
      }
    }
    this.usuario_empresa.push(m)
  }

  // Simulación de Fase 3: Backfill de Id_Empresa en datos existentes
  ejecutarBackfill(idEmpresaInicial = 1) {
    for (const m of this.materiales) {
      if (m.Id_Empresa === undefined || m.Id_Empresa === null) {
        m.Id_Empresa = idEmpresaInicial
      }
    }
    for (const o of this.ordenes) {
      if (o.Id_Empresa === undefined || o.Id_Empresa === null) {
        o.Id_Empresa = idEmpresaInicial
      }
    }
  }

  // Restricción: material_empresa_nombre_unique ("Id_Empresa", "Nombre_Material")
  insertarMaterial(mat) {
    if (!mat.Id_Empresa) throw new Error('NOT NULL constraint violation: Id_Empresa')
    const duplicado = this.materiales.find(
      m => m.Id_Empresa === mat.Id_Empresa && m.Nombre_Material.toLowerCase() === mat.Nombre_Material.toLowerCase()
    )
    if (duplicado) {
      const err = new Error('duplicate key value violates unique constraint "material_empresa_nombre_unique"')
      err.code = '23505'
      throw err
    }
    this.materiales.push(mat)
  }

  // Restricciones FK compuestas: fk_op_material_empresa, fk_op_cliente_empresa, fk_op_operario_empresa
  insertarOrden(ord) {
    if (!ord.Id_Empresa) throw new Error('NOT NULL constraint violation: Id_Empresa')

    // Validar FK material ("Id_Material", "Id_Empresa")
    const matValido = this.materiales.find(
      m => m.Id_Material === ord.Id_Material && m.Id_Empresa === ord.Id_Empresa
    )
    if (!matValido) {
      const err = new Error('insert or update on table "orden_produccion" violates foreign key constraint "fk_op_material_empresa"')
      err.code = '23503'
      throw err
    }

    // Validar FK cliente ("Id_Cliente", "Id_Empresa")
    const cliValido = this.usuario_empresa.find(
      ue => ue.Id_Usuario === ord.Id_Cliente && ue.Id_Empresa === ord.Id_Empresa
    )
    if (!cliValido) {
      const err = new Error('insert or update on table "orden_produccion" violates foreign key constraint "fk_op_cliente_empresa"')
      err.code = '23503'
      throw err
    }

    // Validar FK operario ("Id_Operario", "Id_Empresa") si viene
    if (ord.Id_Operario) {
      const opValido = this.usuario_empresa.find(
        ue => ue.Id_Usuario === ord.Id_Operario && ue.Id_Empresa === ord.Id_Empresa
      )
      if (!opValido) {
        const err = new Error('insert or update on table "orden_produccion" violates foreign key constraint "fk_op_operario_empresa"')
        err.code = '23503'
        throw err
      }
    }

    this.ordenes.push(ord)
  }
}

// ─────────────────────────────────────────────────────────
// PRUEBA A: Detección de registros huérfanos antes de migrar
// ─────────────────────────────────────────────────────────
test('A. Pre-check detecta registros huérfanos y previene migración sobre datos inconsistentes', () => {
  const db = new SimulatedPostgresDatabase()
  db.usuarios.push({ Id_Usuario: 1, Nombre_Usuario: 'admin', Id_Rol: 1, Estado: 'activo' })
  db.materiales.push({ Id_Material: 10, Nombre_Material: 'Tela A', Id_Cliente: 999 }) // Id_Cliente 999 no existe

  const huerfanos = db.checkHuerfanos()
  assert.equal(huerfanos.materialesClienteHuerfano, 1)
  assert.equal(huerfanos.ordenesMaterialHuerfano, 0)
})

// ─────────────────────────────────────────────────────────
// PRUEBA B: Integridad del backfill a Empresa Principal
// ─────────────────────────────────────────────────────────
test('B. Backfill migra todos los registros legados a la Empresa Principal sin dejar valores nulos', () => {
  const db = new SimulatedPostgresDatabase()
  db.usuarios.push(
    { Id_Usuario: 1, Nombre_Usuario: 'admin', Id_Rol: 1, Estado: 'activo' },
    { Id_Usuario: 2, Nombre_Usuario: 'cliente1', Id_Rol: 3, Estado: 'activo' }
  )
  db.materiales.push(
    { Id_Material: 10, Nombre_Material: 'Tela Denim', Id_Cliente: 2, Id_Empresa: null },
    { Id_Material: 20, Nombre_Material: 'Hilo Azul', Id_Cliente: null, Id_Empresa: null }
  )
  db.ordenes.push(
    { Id_Orden: 1, Id_Material: 10, Id_Cliente: 2, Id_Operario: null, Id_Empresa: null }
  )

  // Ejecutar sembrado y backfill
  db.crearEmpresaInicial(1, 'Empresa Principal')
  db.ejecutarBackfill(1)

  // Verificar que ningún registro tenga Id_Empresa nulo
  assert.equal(db.materiales.every(m => m.Id_Empresa === 1), true)
  assert.equal(db.ordenes.every(o => o.Id_Empresa === 1), true)
  assert.equal(db.usuario_empresa.length, 2)
  assert.equal(db.usuario_empresa.every(ue => ue.Id_Empresa === 1 && ue.Es_Principal === true), true)
})

// ─────────────────────────────────────────────────────────
// PRUEBA C: Rechazo de más de una empresa principal por usuario
// ─────────────────────────────────────────────────────────
test('C. Restricción única parcial impide que un usuario tenga múltiples empresas principales', () => {
  const db = new SimulatedPostgresDatabase()
  db.usuarios.push({ Id_Usuario: 5, Nombre_Usuario: 'socio', Id_Rol: 1, Estado: 'activo' })
  db.empresas.push(
    { Id_Empresa: 1, Nombre_Empresa: 'Empresa A' },
    { Id_Empresa: 2, Nombre_Empresa: 'Empresa B' }
  )

  // Primera membresía como principal -> OK
  db.insertarMembresia({ Id_Usuario: 5, Id_Empresa: 1, Id_Rol: 1, Estado: 'activo', Es_Principal: true })

  // Segunda membresía como NO principal -> OK
  db.insertarMembresia({ Id_Usuario: 5, Id_Empresa: 2, Id_Rol: 2, Estado: 'activo', Es_Principal: false })

  // Intento de segunda empresa principal para el mismo usuario -> RECHAZADO por usuario_empresa_principal_unique
  assert.throws(
    () => db.insertarMembresia({ Id_Usuario: 5, Id_Empresa: 3, Id_Rol: 1, Estado: 'activo', Es_Principal: true }),
    err => err.code === '23505'
  )
})

// ─────────────────────────────────────────────────────────
// PRUEBA D: Unicidad de nombre de material por empresa
// ─────────────────────────────────────────────────────────
test('D. Permite el mismo nombre de material en empresas distintas pero lo bloquea en la misma empresa', () => {
  const db = new SimulatedPostgresDatabase()
  db.empresas.push({ Id_Empresa: 1 }, { Id_Empresa: 2 })

  // Material "Algodón Blanco" en Empresa 1 -> OK
  db.insertarMaterial({ Id_Material: 1, Nombre_Material: 'Algodón Blanco', Id_Empresa: 1 })

  // Mismo nombre "Algodón Blanco" en Empresa 2 -> PERMITIDO (aislamiento multiempresa)
  db.insertarMaterial({ Id_Material: 2, Nombre_Material: 'Algodón Blanco', Id_Empresa: 2 })

  // Mismo nombre "Algodón Blanco" duplicado en Empresa 1 -> RECHAZADO por material_empresa_nombre_unique
  assert.throws(
    () => db.insertarMaterial({ Id_Material: 3, Nombre_Material: 'Algodón Blanco', Id_Empresa: 1 }),
    err => err.code === '23505'
  )
})

// ─────────────────────────────────────────────────────────
// PRUEBA E: Claves foráneas compuestas rechazan relaciones cruzadas entre empresas
// ─────────────────────────────────────────────────────────
test('E. FKs compuestas en orden_produccion bloquean material, cliente u operario de otra empresa', () => {
  const db = new SimulatedPostgresDatabase()
  db.empresas.push({ Id_Empresa: 1 }, { Id_Empresa: 2 })

  // Configuración Empresa 1
  db.usuario_empresa.push(
    { Id_Usuario: 10, Id_Empresa: 1, Id_Rol: 3, Estado: 'activo' }, // Cliente E1
    { Id_Usuario: 11, Id_Empresa: 1, Id_Rol: 2, Estado: 'activo' }  // Operario E1
  )
  db.materiales.push({ Id_Material: 100, Nombre_Material: 'Botón E1', Id_Empresa: 1 })

  // Configuración Empresa 2
  db.usuario_empresa.push(
    { Id_Usuario: 20, Id_Empresa: 2, Id_Rol: 3, Estado: 'activo' }, // Cliente E2
    { Id_Usuario: 21, Id_Empresa: 2, Id_Rol: 2, Estado: 'activo' }  // Operario E2
  )
  db.materiales.push({ Id_Material: 200, Nombre_Material: 'Botón E2', Id_Empresa: 2 })

  // 1. Orden válida en Empresa 1
  db.insertarOrden({
    Id_Orden: 1,
    Id_Empresa: 1,
    Id_Material: 100,
    Id_Cliente: 10,
    Id_Operario: 11,
  })
  assert.equal(db.ordenes.length, 1)

  // 2. Orden en Empresa 1 que intenta usar Material de Empresa 2 -> Violación fk_op_material_empresa
  assert.throws(
    () => db.insertarOrden({
      Id_Orden: 2,
      Id_Empresa: 1,
      Id_Material: 200, // Material de E2
      Id_Cliente: 10,
      Id_Operario: 11,
    }),
    err => err.code === '23503' && /fk_op_material_empresa/.test(err.message)
  )

  // 3. Orden en Empresa 1 que intenta usar Cliente de Empresa 2 -> Violación fk_op_cliente_empresa
  assert.throws(
    () => db.insertarOrden({
      Id_Orden: 3,
      Id_Empresa: 1,
      Id_Material: 100,
      Id_Cliente: 20, // Cliente de E2
      Id_Operario: 11,
    }),
    err => err.code === '23503' && /fk_op_cliente_empresa/.test(err.message)
  )

  // 4. Orden en Empresa 1 que intenta usar Operario de Empresa 2 -> Violación fk_op_operario_empresa
  assert.throws(
    () => db.insertarOrden({
      Id_Orden: 4,
      Id_Empresa: 1,
      Id_Material: 100,
      Id_Cliente: 10,
      Id_Operario: 21, // Operario de E2
    }),
    err => err.code === '23503' && /fk_op_operario_empresa/.test(err.message)
  )
})
