import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/texticode_test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-enough-length'

const {
  assertEmpresaActiva: assertEmpresaMateriales,
  listarMateriales,
  obtenerMaterialPorId,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial,
} = await import('../services/materiales.service.js')

const {
  assertEmpresaActiva: assertEmpresaOrdenes,
  listarOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  actualizarOrden,
  eliminarOrden,
} = await import('../services/ordenes.service.js')

const { requireEmpresa } = await import('../middleware/empresa.js')

// Helper para crear un mock DB que captura queries y retorna datos según filtros
function createMockDb(handlers = {}) {
  const executedQueries = []
  return {
    executedQueries,
    async query(sql, params = []) {
      executedQueries.push({ sql, params })
      const lower = sql.toLowerCase()

      if (handlers.custom) {
        const customResult = await handlers.custom(sql, params)
        if (customResult !== undefined) return customResult
      }

      if (lower.startsWith('begin') || lower.startsWith('commit') || lower.startsWith('rollback')) {
        return { rows: [] }
      }

      return { rows: [], rowCount: 0 }
    },
  }
}

// ─────────────────────────────────────────────────────────
// PRUEBA 1: Una solicitud sin empresa activa no puede acceder a las rutas protegidas
// ─────────────────────────────────────────────────────────
test('1. Solicitud sin empresa activa es rechazada en middleware y servicios con 403 TENANT_REQUIRED', async () => {
  const authSinEmpresa = { id: 10, rol: 1, rolNombre: 'Administrador', empresaId: null }

  // En middleware requireEmpresa
  const makeRes = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  })
  const res = makeRes()
  let nextLlamado = false
  requireEmpresa({ auth: authSinEmpresa }, res, () => { nextLlamado = true })
  assert.equal(nextLlamado, false)
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.code, 'TENANT_REQUIRED')

  // En servicio de materiales
  const mockDb = createMockDb()
  await assert.rejects(
    () => listarMateriales(mockDb, { auth: authSinEmpresa }),
    err => err.statusCode === 403 && err.code === 'TENANT_REQUIRED'
  )

  // En servicio de órdenes
  await assert.rejects(
    () => listarOrdenes(mockDb, { auth: authSinEmpresa }),
    err => err.statusCode === 403 && err.code === 'TENANT_REQUIRED'
  )
})

// ─────────────────────────────────────────────────────────
// PRUEBA 2: Empresa A solo consulta sus propios materiales
// ─────────────────────────────────────────────────────────
test('2. Empresa A solo consulta sus propios materiales y la consulta filtra por Id_Empresa', async () => {
  const authEmpresaA = { id: 10, rol: 1, rolNombre: 'Administrador', empresaId: 1 }

  const materialesEmpresaA = [
    { Id_Material: 101, Nombre_Material: 'Hilo Azul', Id_Empresa: 1, Activo: true },
    { Id_Material: 102, Nombre_Material: 'Tela Denim', Id_Empresa: 1, Activo: true },
  ]

  const mockDb = createMockDb({
    custom: async (sql, params) => {
      if (sql.includes('FROM material') && params[0] === 1) {
        return { rows: materialesEmpresaA }
      }
      return { rows: [] }
    },
  })

  const materiales = await listarMateriales(mockDb, { auth: authEmpresaA })
  assert.equal(materiales.length, 2)
  assert.equal(materiales[0].Nombre_Material, 'Hilo Azul')
  assert.equal(materiales[0].Id_Empresa, 1)

  // Comprobar que la consulta ejecutó el filtro por Id_Empresa = 1
  const lastQuery = mockDb.executedQueries.find(q => q.sql.includes('FROM material'))
  assert.ok(lastQuery)
  assert.match(lastQuery.sql, /m\."Id_Empresa" = \$1/)
  assert.deepEqual(lastQuery.params, [1])
})

// ─────────────────────────────────────────────────────────
// PRUEBA 3: Empresa A no puede leer, modificar ni eliminar materiales de Empresa B
// ─────────────────────────────────────────────────────────
test('3. Empresa A no puede leer, modificar ni eliminar materiales de Empresa B (404 controlado sin revelar existencia)', async () => {
  const authEmpresaA = { id: 10, rol: 1, rolNombre: 'Administrador', empresaId: 1 }

  // El material 201 pertenece a Empresa B (Id_Empresa = 2)
  const mockDb = createMockDb({
    custom: async (sql, params) => {
      // Simula que la consulta WHERE Id_Material = $1 AND Id_Empresa = $2 no encuentra filas para Empresa 1
      if (sql.includes('FROM material') && params[0] === 201 && params[1] === 1) {
        return { rows: [] } // Vacío porque pertenece a Empresa 2
      }
      return { rows: [] }
    },
  })

  // Lectura por ID de material ajeno
  await assert.rejects(
    () => obtenerMaterialPorId(mockDb, { idMaterial: 201, auth: authEmpresaA }),
    err => err.statusCode === 404 && /no encontrado/.test(err.message)
  )

  // Modificación de material ajeno
  await assert.rejects(
    () => actualizarMaterial(mockDb, {
      idMaterial: 201,
      materialData: { Nombre_Material: 'Hackeado', Categoria: 'Telas', Unidad: 'Mtrs', Stock_Actual: 5 },
      auth: authEmpresaA,
    }),
    err => err.statusCode === 404
  )

  // Eliminación de material ajeno
  await assert.rejects(
    () => eliminarMaterial(mockDb, { idMaterial: 201, auth: authEmpresaA }),
    err => err.statusCode === 404
  )
})

// ─────────────────────────────────────────────────────────
// PRUEBA 4: Una orden de Empresa A no puede asociarse a un material de Empresa B
// ─────────────────────────────────────────────────────────
test('4. Una orden de Empresa A no puede asociarse a un material de Empresa B', async () => {
  const authEmpresaA = { id: 10, rol: 1, rolNombre: 'Administrador', empresaId: 1 }

  const mockDb = createMockDb({
    custom: async (sql, params) => {
      // Validar material en empresa activa
      if (sql.includes('FROM material') && sql.includes('"Id_Empresa" = $2')) {
        const [idMat, idEmpresa] = params
        // Material 99 pertenece a Empresa 2, no a Empresa 1
        if (idMat === 99 && idEmpresa === 1) {
          return { rows: [] } // No pertenece
        }
      }
      return undefined
    },
  })

  await assert.rejects(
    () => crearOrden(mockDb, {
      ordenData: {
        Id_Cliente: 5,
        Id_Material: 99, // Material de Empresa B
        Descripcion: 'Corte de camisas',
        Cantidad: 100,
        Fecha_Limite: '2026-12-01',
      },
      auth: authEmpresaA,
    }),
    err => err.statusCode === 400 && err.code === 'CROSS_TENANT_RELATION' && /material/.test(err.message)
  )
})

// ─────────────────────────────────────────────────────────
// PRUEBA 5: Una orden de Empresa A no puede utilizar un cliente u operario de Empresa B
// ─────────────────────────────────────────────────────────
test('5. Una orden de Empresa A no puede utilizar un cliente u operario de Empresa B', async () => {
  const authEmpresaA = { id: 10, rol: 1, rolNombre: 'Administrador', empresaId: 1 }

  const mockDb = createMockDb({
    custom: async (sql, params) => {
      // Material 10 pertenece a Empresa 1
      if (sql.includes('FROM material') && params[0] === 10 && params[1] === 1) {
        return { rows: [{ Id_Material: 10 }] }
      }
      // Pertenencia en usuario_empresa
      if (sql.includes('FROM usuario_empresa')) {
        const [idUsuario, idEmpresa] = params
        // Cliente 88 pertenece solo a Empresa 2, no a Empresa 1
        if (idUsuario === 88 && idEmpresa === 1) {
          return { rows: [] }
        }
        // Operario 77 pertenece solo a Empresa 2, no a Empresa 1
        if (idUsuario === 77 && idEmpresa === 1) {
          return { rows: [] }
        }
        // Cliente 5 sí pertenece a Empresa 1
        if (idUsuario === 5 && idEmpresa === 1) {
          return { rows: [{ 1: 1 }] }
        }
      }
      return undefined
    },
  })

  // 5a. Cliente no pertenece a Empresa A
  await assert.rejects(
    () => crearOrden(mockDb, {
      ordenData: {
        Id_Cliente: 88, // Cliente ajeno
        Id_Material: 10,
        Descripcion: 'Lote pantalones',
        Cantidad: 50,
        Fecha_Limite: '2026-12-01',
      },
      auth: authEmpresaA,
    }),
    err => err.statusCode === 400 && err.code === 'CROSS_TENANT_RELATION' && /cliente/.test(err.message)
  )

  // 5b. Operario no pertenece a Empresa A
  await assert.rejects(
    () => crearOrden(mockDb, {
      ordenData: {
        Id_Cliente: 5,
        Id_Material: 10,
        Id_Operario: 77, // Operario ajeno
        Descripcion: 'Lote pantalones',
        Cantidad: 50,
        Fecha_Limite: '2026-12-01',
      },
      auth: authEmpresaA,
    }),
    err => err.statusCode === 400 && err.code === 'CROSS_TENANT_RELATION' && /operario/.test(err.message)
  )
})

// ─────────────────────────────────────────────────────────
// PRUEBA 6: Manipular Id_Empresa en el body no cambia el contexto autorizado
// ─────────────────────────────────────────────────────────
test('6. Manipular Id_Empresa en el body no altera la empresa activa asignada en inserciones', async () => {
  const authEmpresaA = { id: 10, rol: 1, rolNombre: 'Administrador', empresaId: 1 }

  const mockDb = createMockDb({
    custom: async (sql, params) => {
      if (sql.includes('INSERT INTO material')) {
        return { rows: [{ Id_Material: 501 }] }
      }
      if (sql.includes('FROM material')) {
        return { rows: [{ Id_Material: 10 }] }
      }
      if (sql.includes('FROM usuario_empresa')) {
        return { rows: [{ 1: 1 }] }
      }
      if (sql.includes('INSERT INTO orden_produccion')) {
        return { rows: [{ Id_Orden: 701 }] }
      }
      return undefined
    },
  })

  // Intento malicioso de inyectar Id_Empresa: 999 en el body al crear material
  await crearMaterial(mockDb, {
    materialData: {
      Nombre_Material: 'Tela Maliciosa',
      Categoria: 'Telas',
      Unidad: 'Metros',
      Stock_Actual: 10,
      Id_Empresa: 999, // Intentando suplantar a Empresa 999
    },
    auth: authEmpresaA,
  })

  const insertMaterialQuery = mockDb.executedQueries.find(q => q.sql.includes('INSERT INTO material'))
  assert.ok(insertMaterialQuery)
  // El parámetro Id_Empresa (posición 8 en VALUES) debe ser 1 (de auth), NUNCA 999
  assert.equal(insertMaterialQuery.params[7], 1)

  // Intento malicioso de inyectar Id_Empresa: 888 en el body al crear orden
  await crearOrden(mockDb, {
    ordenData: {
      Id_Cliente: 5,
      Id_Material: 10,
      Descripcion: 'Pedido inyectado',
      Cantidad: 20,
      Fecha_Limite: '2026-12-01',
      Id_Empresa: 888, // Intentando suplantar a Empresa 888
    },
    auth: authEmpresaA,
  })

  const insertOrdenQuery = mockDb.executedQueries.find(q => q.sql.includes('INSERT INTO orden_produccion'))
  assert.ok(insertOrdenQuery)
  // El parámetro Id_Empresa (último en VALUES) debe ser 1 (de auth), NUNCA 888
  assert.equal(insertOrdenQuery.params[10], 1)
})

// ─────────────────────────────────────────────────────────
// PRUEBA 7: Las funciones existentes siguen funcionando en los casos compatibles
// ─────────────────────────────────────────────────────────
test('7. Consulta y actualización exitosa dentro de la misma empresa activa', async () => {
  const authEmpresaA = { id: 10, rol: 1, rolNombre: 'Administrador', empresaId: 1 }

  const mockDb = createMockDb({
    custom: async (sql, params) => {
      if (sql.includes('FROM material') && sql.includes('FOR UPDATE')) {
        return { rows: [{ Stock_Actual: 50 }] }
      }
      if (sql.includes('UPDATE material')) {
        return { rowCount: 1 }
      }
      if (sql.includes('FROM orden_produccion') && sql.includes('"Id_Orden" = $1')) {
        return { rows: [{ Id_Orden: 10, Id_Cliente: 5, Id_Material: 2, Id_Empresa: 1, Estado: 'En Proceso' }] }
      }
      if (sql.includes('DELETE FROM orden_produccion')) {
        return { rowCount: 1 }
      }
      return undefined
    },
  })

  // Actualización legítima de material dentro de la misma empresa
  const actMat = await actualizarMaterial(mockDb, {
    idMaterial: 101,
    materialData: {
      Nombre_Material: 'Tela Denim Actualizada',
      Categoria: 'Telas',
      Stock_Actual: 60,
      Unidad: 'Metros',
      Stock_Minimo: 10,
      Stock_Maximo: 100,
    },
    auth: authEmpresaA,
  })
  assert.equal(actMat.ok, true)

  // Eliminación legítima de orden dentro de la misma empresa
  const elimOrd = await eliminarOrden(mockDb, { idOrden: 10, auth: authEmpresaA })
  assert.equal(elimOrd.ok, true)
})
