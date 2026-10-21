import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/texticode_test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-enough-length'

const {
  processLogin,
  selectEmpresa,
  authenticateCredentials,
  getUserMemberships,
} = await import('../services/auth.service.js')

const {
  signAuthToken,
  verifyAuthToken,
  signSelectionToken,
  verifySelectionToken,
} = await import('../middleware/auth.js')

const { requireEmpresa, isSameEmpresa } = await import('../middleware/empresa.js')
const { hasRole, requireRoles } = await import('../middleware/roles.js')

// Helper para crear un mock de dbClient
function createMockDb({ userRows = [], membershipRows = [], throwTableMissing = false }) {
  return {
    async query(sql, params = []) {
      const lower = sql.toLowerCase()
      if (throwTableMissing && lower.includes('usuario_empresa')) {
        const err = new Error('relation "usuario_empresa" does not exist')
        err.code = '42P01'
        throw err
      }

      if (lower.includes('from usuario_empresa')) {
        return { rows: membershipRows }
      }

      if (lower.includes('from usuario u') || lower.includes('from usuario ')) {
        return { rows: userRows }
      }

      return { rows: [] }
    },
  }
}

test('autenticación rechaza credenciales inexistentes o contraseña errónea', async () => {
  const hash = await bcrypt.hash('Correcta123!', 10)
  const user = {
    Id_Usuario: 1,
    Nombre_Completo: 'Usuario Test',
    Nombre_Usuario: 'usertest',
    Correo: 'test@example.com',
    Contrasena: hash,
    Estado: 'activo',
    Id_Rol: 3,
    Rol: 'Cliente',
  }

  // Usuario inexistente
  const dbVacio = createMockDb({ userRows: [] })
  await assert.rejects(
    () => authenticateCredentials(dbVacio, { identificador: 'noexiste', contrasena: '123' }),
    /Credenciales incorrectas/
  )

  // Contraseña incorrecta
  const dbConUsuario = createMockDb({ userRows: [user] })
  await assert.rejects(
    () => authenticateCredentials(dbConUsuario, { identificador: 'usertest', contrasena: 'Erronea!' }),
    /Credenciales incorrectas/
  )
})

test('autenticación rechaza usuarios inactivos con 403', async () => {
  const hash = await bcrypt.hash('Pass123!', 10)
  const userInactivo = {
    Id_Usuario: 2,
    Nombre_Completo: 'Inactivo',
    Nombre_Usuario: 'inactivo',
    Correo: 'inactivo@example.com',
    Contrasena: hash,
    Estado: 'inactivo',
    Id_Rol: 2,
    Rol: 'Operario',
  }

  const db = createMockDb({ userRows: [userInactivo] })
  await assert.rejects(
    () => authenticateCredentials(db, { identificador: 'inactivo', contrasena: 'Pass123!' }),
    /inactiva/
  )
})

test('usuario sin membresías activas devuelve estado no_memberships', async () => {
  const hash = await bcrypt.hash('Clave123!', 10)
  const user = {
    Id_Usuario: 10,
    Nombre_Completo: 'Sin Empresa',
    Nombre_Usuario: 'sin_empresa',
    Correo: 'sin@empresa.com',
    Contrasena: hash,
    Estado: 'activo',
    Id_Rol: 3,
    Rol: 'Cliente',
  }

  const db = createMockDb({
    userRows: [user],
    membershipRows: [], // 0 membresías
  })

  const result = await processLogin(db, { identificador: 'sin_empresa', contrasena: 'Clave123!' })
  assert.equal(result.status, 'no_memberships')
  assert.equal(result.type, 'no_memberships')
  assert.match(result.error, /no tiene membresías/i)
})

test('usuario con 1 empresa activa obtiene sesión directa con empresa y rol de membresía', async () => {
  const hash = await bcrypt.hash('Clave123!', 10)
  const user = {
    Id_Usuario: 20,
    Nombre_Completo: 'Ana Costura',
    Nombre_Usuario: 'anac',
    Correo: 'ana@taller.com',
    Contrasena: hash,
    Estado: 'activo',
    Id_Rol: 3, // Rol legado global en usuario
    Rol: 'Cliente',
  }

  const singleMembership = [
    {
      Id_Empresa: 1,
      Nombre_Empresa: 'Confecciones del Norte',
      Empresa_Estado: 'activa',
      Id_Rol: 2, // Rol real en la membresía de la empresa: Operario
      Rol: 'Operario',
      Membresia_Estado: 'activo',
      Es_Principal: true,
    },
  ]

  const db = createMockDb({
    userRows: [user],
    membershipRows: singleMembership,
  })

  const result = await processLogin(db, { identificador: 'anac', contrasena: 'Clave123!' })
  assert.equal(result.status, 'success')
  assert.equal(result.type, 'authenticated')
  assert.ok(result.token)
  assert.equal(result.empresaActiva.Id_Empresa, 1)
  assert.equal(result.empresaActiva.Nombre_Empresa, 'Confecciones del Norte')
  assert.equal(result.empresaActiva.Id_Rol, 2)
  assert.equal(result.empresaActiva.Rol, 'Operario')

  // Verificar que el JWT contiene empresa y rol de membresía
  const payload = verifyAuthToken(result.token)
  assert.equal(payload.id, 20)
  assert.equal(payload.empresa, 1)
  assert.equal(payload.rol, 2)
  assert.equal(payload.rolNombre, 'Operario')
})

test('usuario con múltiples empresas requiere selección y emite selectionToken temporal', async () => {
  const hash = await bcrypt.hash('Clave123!', 10)
  const user = {
    Id_Usuario: 30,
    Nombre_Completo: 'Carlos Gerente',
    Nombre_Usuario: 'carlosg',
    Correo: 'carlos@holding.com',
    Contrasena: hash,
    Estado: 'activo',
    Id_Rol: 1,
    Rol: 'Administrador',
  }

  const multipleMemberships = [
    {
      Id_Empresa: 1,
      Nombre_Empresa: 'Textiles Alfa',
      Empresa_Estado: 'activa',
      Id_Rol: 1,
      Rol: 'Administrador',
      Membresia_Estado: 'activo',
      Es_Principal: true,
    },
    {
      Id_Empresa: 2,
      Nombre_Empresa: 'Bordados Beta',
      Empresa_Estado: 'activa',
      Id_Rol: 2,
      Rol: 'Operario',
      Membresia_Estado: 'activo',
      Es_Principal: false,
    },
  ]

  const db = createMockDb({
    userRows: [user],
    membershipRows: multipleMemberships,
  })

  const result = await processLogin(db, { identificador: 'carlosg', contrasena: 'Clave123!' })
  assert.equal(result.status, 'requires_selection')
  assert.equal(result.requiresEmpresaSelection, true)
  assert.ok(result.selectionToken)
  assert.equal(result.empresas.length, 2)
  assert.equal(result.empresas[0].Id_Empresa, 1)
  assert.equal(result.empresas[1].Id_Empresa, 2)

  // Verificar que el selectionToken tiene purpose de selección y no autoriza API empresarial
  const selPayload = verifySelectionToken(result.selectionToken)
  assert.equal(selPayload.id, 30)
  assert.equal(selPayload.purpose, 'empresa_selection')
})

test('selección de empresa autorizada emite sesión para la empresa solicitada', async () => {
  const user = {
    Id_Usuario: 30,
    Nombre_Completo: 'Carlos Gerente',
    Nombre_Usuario: 'carlosg',
    Correo: 'carlos@holding.com',
    Estado: 'activo',
    Id_Rol: 1,
    Rol: 'Administrador',
  }

  const multipleMemberships = [
    {
      Id_Empresa: 1,
      Nombre_Empresa: 'Textiles Alfa',
      Empresa_Estado: 'activa',
      Id_Rol: 1,
      Rol: 'Administrador',
      Membresia_Estado: 'activo',
      Es_Principal: true,
    },
    {
      Id_Empresa: 2,
      Nombre_Empresa: 'Bordados Beta',
      Empresa_Estado: 'activa',
      Id_Rol: 2,
      Rol: 'Operario',
      Membresia_Estado: 'activo',
      Es_Principal: false,
    },
  ]

  const db = createMockDb({
    userRows: [user],
    membershipRows: multipleMemberships,
  })

  const selectionToken = signSelectionToken(user)

  // Seleccionar la Empresa 2 (donde su rol es Operario)
  const result = await selectEmpresa(db, {
    selectionToken,
    idEmpresa: 2,
  })

  assert.equal(result.status, 'success')
  assert.equal(result.empresaActiva.Id_Empresa, 2)
  assert.equal(result.empresaActiva.Nombre_Empresa, 'Bordados Beta')
  assert.equal(result.empresaActiva.Id_Rol, 2)
  assert.equal(result.empresaActiva.Rol, 'Operario')

  const sessionPayload = verifyAuthToken(result.token)
  assert.equal(sessionPayload.empresa, 2)
  assert.equal(sessionPayload.rol, 2)
  assert.equal(sessionPayload.rolNombre, 'Operario')
})

test('selección de empresa no autorizada es rechazada con 403', async () => {
  const user = {
    Id_Usuario: 30,
    Nombre_Usuario: 'carlosg',
    Correo: 'carlos@holding.com',
    Estado: 'activo',
    Id_Rol: 1,
    Rol: 'Administrador',
  }

  const memberships = [
    {
      Id_Empresa: 1,
      Nombre_Empresa: 'Textiles Alfa',
      Empresa_Estado: 'activa',
      Id_Rol: 1,
      Rol: 'Administrador',
      Membresia_Estado: 'activo',
      Es_Principal: true,
    },
  ]

  const db = createMockDb({
    userRows: [user],
    membershipRows: memberships,
  })

  const selectionToken = signSelectionToken(user)

  // Intenta seleccionar Empresa 99 a la que no pertenece
  await assert.rejects(
    () => selectEmpresa(db, { selectionToken, idEmpresa: 99 }),
    /No tienes acceso a la empresa solicitada/
  )
})

test('login directo con idEmpresaDeseada no autorizada devuelve unauthorized_tenant', async () => {
  const hash = await bcrypt.hash('Clave123!', 10)
  const user = {
    Id_Usuario: 40,
    Nombre_Usuario: 'usuario40',
    Correo: 'u40@empresa.com',
    Contrasena: hash,
    Estado: 'activo',
    Id_Rol: 2,
    Rol: 'Operario',
  }

  const db = createMockDb({
    userRows: [user],
    membershipRows: [
      {
        Id_Empresa: 5,
        Nombre_Empresa: 'Empresa 5',
        Empresa_Estado: 'activa',
        Id_Rol: 2,
        Rol: 'Operario',
        Membresia_Estado: 'activo',
        Es_Principal: true,
      },
    ],
  })

  const result = await processLogin(db, {
    identificador: 'usuario40',
    contrasena: 'Clave123!',
    idEmpresaDeseada: 88, // No autorizada
  })

  assert.equal(result.status, 'unauthorized_tenant')
  assert.match(result.error, /No tienes acceso/)
})

test('modo legacy: cuando usuario_empresa no existe (42P01), degrada graciosamente a sesión compatible', async () => {
  const hash = await bcrypt.hash('Clave123!', 10)
  const user = {
    Id_Usuario: 50,
    Nombre_Usuario: 'usuario_legado',
    Correo: 'legado@empresa.com',
    Contrasena: hash,
    Estado: 'activo',
    Id_Rol: 1,
    Rol: 'Administrador',
  }

  const db = createMockDb({
    userRows: [user],
    throwTableMissing: true, // Simula tabla usuario_empresa aún no creada en Postgres
  })

  const result = await processLogin(db, { identificador: 'usuario_legado', contrasena: 'Clave123!' })
  assert.equal(result.status, 'success')
  assert.equal(result.type, 'legacy')
  assert.ok(result.token)

  const payload = verifyAuthToken(result.token)
  assert.equal(payload.id, 50)
  assert.equal(payload.rol, 1)
  assert.equal(payload.empresa, undefined) // No hay empresa en modo legado
})

test('middleware requireEmpresa rechaza solicitudes sin empresaId y permite con empresaId', () => {
  const makeRes = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  })

  // 1. Sin req.auth
  const reqSinAuth = {}
  const resSinAuth = makeRes()
  let nextLlamado1 = false
  requireEmpresa(reqSinAuth, resSinAuth, () => { nextLlamado1 = true })
  assert.equal(nextLlamado1, false)
  assert.equal(resSinAuth.statusCode, 401)

  // 2. Con req.auth pero sin empresaId
  const reqSinEmpresa = { auth: { id: 1, rol: 1 } }
  const resSinEmpresa = makeRes()
  let nextLlamado2 = false
  requireEmpresa(reqSinEmpresa, resSinEmpresa, () => { nextLlamado2 = true })
  assert.equal(nextLlamado2, false)
  assert.equal(resSinEmpresa.statusCode, 403)
  assert.equal(resSinEmpresa.body.code, 'TENANT_REQUIRED')

  // 3. Con req.auth y empresaId válido
  const reqConEmpresa = { auth: { id: 1, rol: 1, empresaId: 4 } }
  const resConEmpresa = makeRes()
  let nextLlamado3 = false
  requireEmpresa(reqConEmpresa, resConEmpresa, () => { nextLlamado3 = true })
  assert.equal(nextLlamado3, true)

  // Helper isSameEmpresa
  assert.equal(isSameEmpresa(4, reqConEmpresa.auth), true)
  assert.equal(isSameEmpresa(5, reqConEmpresa.auth), false)
  assert.equal(isSameEmpresa(4, reqSinEmpresa.auth), false)
})

test('autorización requireRoles evalúa el rol de la membresía activa en la empresa', () => {
  const makeRes = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  })

  // Sesión en Empresa A donde el usuario es Admin (rol: 1)
  const authAdminEmpresaA = {
    id: 10,
    empresaId: 1,
    rol: 1,
    rolNombre: 'Administrador',
  }
  const reqAdmin = { auth: authAdminEmpresaA }
  const resAdmin = makeRes()
  let nextAdmin = false
  requireRoles('admin')(reqAdmin, resAdmin, () => { nextAdmin = true })
  assert.equal(nextAdmin, true)

  // Sesión en Empresa B donde el mismo usuario es Operario (rol: 2)
  const authOperarioEmpresaB = {
    id: 10,
    empresaId: 2,
    rol: 2,
    rolNombre: 'Operario',
  }
  const reqOperario = { auth: authOperarioEmpresaB }
  const resOperario = makeRes()
  let nextOperario = false
  requireRoles('admin')(reqOperario, resOperario, () => { nextOperario = true })
  assert.equal(nextOperario, false)
  assert.equal(resOperario.statusCode, 403)

  // Pero para 'operario', sí debe ser permitido
  let nextOperarioPermitido = false
  requireRoles('operario')(reqOperario, resOperario, () => { nextOperarioPermitido = true })
  assert.equal(nextOperarioPermitido, true)
})
