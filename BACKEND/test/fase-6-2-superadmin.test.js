import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const state = {
  loginUser: null,
  memberships: [],
  guardUser: null,
  operationalUser: null,
  roleSuperadmin: false,
  targetUserSuperadmin: false,
  duplicateName: false,
  failMembershipInsert: false,
  companyActive: false,
  created: [],
  rolledBack: false,
  tokens: new Map(),
  routes: new Map(),
  queryLog: [],
}

function reset() {
  Object.assign(state, {
    loginUser: {
      Id_Usuario: 8, Nombre_Completo: 'Global', Nombre_Usuario: 'global',
      Correo: 'global@example.invalid', Contrasena: '$2b$10$local-fixture', Estado: 'activo',
      Id_Rol: 90, Rol: 'superadmin',
    },
    memberships: [],
    guardUser: { Id_Usuario: 8, Estado: 'activo', Rol: 'superadmin', Tiene_Membresias: false },
    operationalUser: { Id_Usuario: 8, Nombre_Usuario: 'global', Nombre_Completo: 'Global',
      Correo: 'global@example.invalid', Estado: 'activo', Id_Rol: 90, Rol: 'superadmin',
      Membresia_Id_Empresa: null, Nombre_Empresa: null },
    roleSuperadmin: false,
    targetUserSuperadmin: false,
    duplicateName: false,
    failMembershipInsert: false,
    companyActive: false,
    created: [],
    rolledBack: false,
    tokens: new Map(),
    routes: new Map(),
    queryLog: [],
  })
}

function makeRouter() {
  return {
    use(...middleware) { state.routes.set('USE', middleware) },
    get(path, ...handlers) { state.routes.set(`GET ${path}`, handlers.at(-1)) },
    post(path, ...handlers) { state.routes.set(`POST ${path}`, handlers.at(-1)) },
    put(path, ...handlers) { state.routes.set(`PUT ${path}`, handlers.at(-1)) },
    patch(path, ...handlers) { state.routes.set(`PATCH ${path}`, handlers.at(-1)) },
    delete(path, ...handlers) { state.routes.set(`DELETE ${path}`, handlers.at(-1)) },
  }
}

function response() {
  return { statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }, }
}

const pool = {
  async query(sql, params = []) {
    state.queryLog.push({ sql, params })
    if (sql.includes('LEFT JOIN usuario_empresa')) return { rows: [state.operationalUser] }
    if (sql.includes('AS "Tiene_Membresias"')) return { rows: [state.guardUser] }
    if (sql.includes('FROM usuario_empresa ue')) return { rows: state.memberships }
    if (sql.includes('FROM usuario u') && sql.includes('WHERE u."Correo"')) return { rows: [state.loginUser] }
    if (sql.includes('lower(trim(r."Nombre_Rol")) = \'superadmin\'')) return { rows: state.targetUserSuperadmin ? [{ ok: 1 }] : [] }
    if (sql.includes('lower(trim("Nombre_Rol")) = \'superadmin\'')) return { rows: state.roleSuperadmin ? [{ ok: 1 }] : [] }
    if (sql.includes('lower(trim("Nombre_Empresa"))')) return { rows: state.duplicateName ? [{ ok: 1 }] : [] }
    if (sql.includes('FROM rol') && sql.includes("IN ('admin', 'administrador')")) return { rows: [{ Id_Rol: 1 }] }
    return { rows: [], rowCount: 0 }
  },
  async connect() {
    return {
      async query(sql, params = []) {
        state.queryLog.push({ sql, params })
        if (sql === 'BEGIN') return { rows: [] }
        if (sql === 'COMMIT') return { rows: [] }
        if (sql === 'ROLLBACK') { state.rolledBack = true; state.created = []; return { rows: [] } }
        if (sql.includes('lower(trim("Nombre_Empresa"))')) return { rows: state.duplicateName ? [{ ok: 1 }] : [] }
        if (sql.includes('FROM rol') && sql.includes("IN ('admin', 'administrador')")) return { rows: [{ Id_Rol: 1 }] }
        if (sql.includes('INSERT INTO empresa (')) {
          const row = { Id_Empresa: 20, Nombre_Empresa: params[0], Slug: params[1], Estado: 'activa' }
          state.created.push({ kind: 'empresa', row })
          return { rows: [row] }
        }
        if (sql.includes('INSERT INTO empresa_config')) { state.created.push({ kind: 'config' }); return { rows: [] } }
        if (sql.includes('INSERT INTO usuario (')) {
          const row = { Id_Usuario: 30, Nombre_Completo: params[0], Nombre_Usuario: params[1], Correo: params[2], Telefono: params[4], Estado: 'activo' }
          state.created.push({ kind: 'usuario', row })
          return { rows: [row] }
        }
        if (sql.includes('INSERT INTO usuario_empresa')) {
          if (state.failMembershipInsert) throw new Error('mock failure at membership insert')
          state.created.push({ kind: 'membresia' })
          return { rows: [] }
        }
        if (sql.includes('UPDATE empresa SET "Estado"')) { state.companyActive = true; return { rowCount: 1, rows: [] } }
        if (sql.includes('UPDATE usuario_empresa SET "Estado"')) return { rowCount: 2, rows: [] }
        return { rows: [], rowCount: 0 }
      },
      release() {},
    }
  },
}

const jwt = {
  sign(payload) { const token = `signed-${state.tokens.size + 1}`; state.tokens.set(token, structuredClone(payload)); return token },
  verify(token) {
    if (!state.tokens.has(token)) { const err = new Error('invalid'); err.name = 'JsonWebTokenError'; throw err }
    return structuredClone(state.tokens.get(token))
  },
}

globalThis.__fase62 = {
  pool,
  bcrypt: { async compare() { return true }, async hash() { return 'bcrypt-hash-fixture' } },
  jwt,
  env: { jwtSecret: 'mock-only', jwtExpires: '1h' },
  express: { Router: makeRouter },
  auth: null,
  service: null,
  requireAuth: (_req, _res, next) => next(),
  requireRoles: () => (_req, _res, next) => next(),
  requireSelfParamOrRoles: () => (_req, _res, next) => next(),
}

function replace(source, target, value) {
  assert.ok(source.includes(target), `Import esperado no encontrado: ${target}`)
  return source.replace(target, value)
}

async function importMocked(source) {
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)
}

let service
let auth
let companies
let users
let roles

{
  let source = await readFile(new URL('../middleware/auth.js', import.meta.url), 'utf8')
  source = replace(source, "import jwt from 'jsonwebtoken'", 'const jwt = globalThis.__fase62.jwt')
  source = replace(source, "import { env } from '../config/env.js'", 'const { env } = globalThis.__fase62')
  source = replace(source, "const { default: db } = await import('../db.js')", 'const db = globalThis.__fase62.pool')
  auth = await importMocked(source)
  globalThis.__fase62.auth = auth

  source = await readFile(new URL('../services/auth.service.js', import.meta.url), 'utf8')
  source = replace(source, "import bcrypt from 'bcryptjs'", 'const bcrypt = globalThis.__fase62.bcrypt')
  source = replace(source, "import { signAuthToken, verifySelectionToken } from '../middleware/auth.js'", 'const { signAuthToken, verifySelectionToken } = globalThis.__fase62.auth')
  service = await importMocked(source)
  globalThis.__fase62.service = service

  source = await readFile(new URL('../routes/empresas.js', import.meta.url), 'utf8')
  source = replace(source, "import { Router } from 'express'", 'const { Router } = globalThis.__fase62.express')
  source = replace(source, "import bcrypt from 'bcryptjs'", 'const bcrypt = globalThis.__fase62.bcrypt')
  source = replace(source, "import pool from '../db.js'", 'const pool = globalThis.__fase62.pool')
  source = replace(source, "import { requireSuperadmin } from '../middleware/auth.js'", 'const { requireSuperadmin } = globalThis.__fase62.auth')
  await importMocked(source)
  companies = new Map(state.routes)

  source = await readFile(new URL('../routes/usuarios.js', import.meta.url), 'utf8')
  source = replace(source, "import { Router } from 'express'", 'const { Router } = globalThis.__fase62.express')
  source = replace(source, "import pool from '../db.js'", 'const pool = globalThis.__fase62.pool')
  source = replace(source, "import bcrypt from 'bcryptjs'", 'const bcrypt = globalThis.__fase62.bcrypt')
  source = replace(source, "import { requireAuth } from '../middleware/auth.js'", 'const { requireAuth } = globalThis.__fase62')
  source = replace(source, "import { requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'", 'const { requireRoles, requireSelfParamOrRoles } = globalThis.__fase62')
  source = replace(source, "import { signAuthToken } from '../middleware/auth.js'", 'const { signAuthToken } = globalThis.__fase62.auth')
  source = replace(source, "import { processLogin } from '../services/auth.service.js'", 'const { processLogin } = globalThis.__fase62.service')
  await importMocked(source)
  users = new Map(state.routes)

  source = await readFile(new URL('../routes/roles.js', import.meta.url), 'utf8')
  source = replace(source, "import { Router } from 'express'", 'const { Router } = globalThis.__fase62.express')
  source = replace(source, "import pool from '../db.js'", 'const pool = globalThis.__fase62.pool')
  await importMocked(source)
  roles = new Map(state.routes)
}

test('preparación usa dobles en memoria y no importa env.js, db.js ni procesos externos', () => {
  assert.equal(typeof service.processLogin, 'function')
  assert.equal(typeof auth.requireSuperadmin, 'function')
  assert.equal(companies.has('POST /'), true)
})

test('S1: superadmin global sin membresía obtiene token sin empresa', async () => {
  reset()
  const result = await service.processLogin(pool, { identificador: state.loginUser.Correo, contrasena: 'local-fixture' })
  assert.equal(result.type, 'authenticated')
  const payload = state.tokens.get(result.token)
  assert.equal(payload.rol, 90)
  assert.equal(payload.rolNombre, 'superadmin')
  assert.equal(Object.hasOwn(payload, 'empresa'), false)
})

test('S2: superadmin consultado en BD recibe 403 en requireAuth operativo', async () => {
  reset()
  const token = auth.signAuthToken(state.loginUser)
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = response()
  let next = false
  await auth.requireAuth(req, res, () => { next = true })
  assert.equal(next, false)
  assert.equal(res.statusCode, 403)
})

test('S3: admin de empresa recibe 403 en requireSuperadmin', async () => {
  reset()
  state.guardUser = { ...state.guardUser, Rol: 'admin' }
  const token = auth.signAuthToken(state.loginUser)
  const res = response()
  await auth.requireSuperadmin({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail('no debe pasar'))
  assert.equal(res.statusCode, 403)
})

test('S4: falta de token recibe 401 en requireSuperadmin', async () => {
  reset()
  const res = response()
  await auth.requireSuperadmin({ headers: {} }, res, () => assert.fail('no debe pasar'))
  assert.equal(res.statusCode, 401)
})

test('S5: claim superadmin con rol distinto en BD recibe 403', async () => {
  reset()
  state.guardUser = { ...state.guardUser, Rol: 'admin' }
  const token = auth.signAuthToken(state.loginUser)
  const res = response()
  await auth.requireSuperadmin({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail('no debe pasar'))
  assert.equal(res.statusCode, 403)
})

function createCompanyRequest() {
  return { body: {
    empresa: { Nombre_Empresa: 'Empresa Nueva', Slug: 'empresa-nueva' },
    administrador: { Nombre_Completo: 'Admin Nuevo', Nombre_Usuario: 'admin_nuevo',
      Correo: 'admin-nuevo@example.invalid', Telefono: '3000000000', Contrasena: 'ClaveLocal9!' },
  } }
}

test('S6: crea empresa, configuración, admin y membresía en transacción; no devuelve hash', async () => {
  reset()
  const res = response()
  await companies.get('POST /')(createCompanyRequest(), res)
  assert.equal(res.statusCode, 201)
  assert.deepEqual(state.created.map(item => item.kind), ['empresa', 'config', 'usuario', 'membresia'])
  assert.ok(state.queryLog.some(item => item.sql === 'BEGIN'))
  assert.ok(state.queryLog.some(item => item.sql === 'COMMIT'))
  assert.equal(Object.hasOwn(res.body.administrador, 'Contrasena'), false)
  assert.equal(Object.values(res.body.administrador).includes('bcrypt-hash-fixture'), false)
})

test('S7: error a mitad de creación ejecuta rollback y no conserva filas simuladas', async () => {
  reset()
  state.failMembershipInsert = true
  const res = response()
  await companies.get('POST /')(createCompanyRequest(), res)
  assert.equal(res.statusCode, 500)
  assert.equal(state.rolledBack, true)
  assert.deepEqual(state.created, [])
})

test('S8: nombre duplicado y slug duplicado responden 409', async () => {
  reset()
  state.duplicateName = true
  const byName = response()
  await companies.get('POST /')(createCompanyRequest(), byName)
  assert.equal(byName.statusCode, 409)

  reset()
  const originalConnect = pool.connect
  pool.connect = async () => {
    const client = await originalConnect()
    const query = client.query.bind(client)
    client.query = async (sql, params) => {
      if (sql.includes('INSERT INTO empresa (')) { const err = new Error('duplicate slug'); err.code = '23505'; throw err }
      return query(sql, params)
    }
    return client
  }
  const bySlug = response()
  await companies.get('POST /')(createCompanyRequest(), bySlug)
  pool.connect = originalConnect
  assert.equal(bySlug.statusCode, 409)
})

test('S9: baja de empresa con datos es desactivación y no DELETE físico', async () => {
  reset()
  const res = response()
  await companies.get('DELETE /:id')({ params: { id: '20' } }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(state.companyActive, true)
  assert.equal(state.queryLog.some(item => item.sql.startsWith('DELETE FROM empresa')), false)
  assert.ok(state.queryLog.some(item => item.sql.includes('UPDATE usuario_empresa SET "Estado" = \'inactivo\'')))
})

test('S10: admin no puede asignar rol superadmin por /api/usuarios', async () => {
  reset()
  state.roleSuperadmin = true
  const res = response()
  await users.get('POST /')({ body: { Id_Rol: 90, Nombre_Completo: 'X', Nombre_Usuario: 'x', Correo: 'x@example.invalid', Contrasena: 'ClaveLocal9!' } }, res)
  assert.equal(res.statusCode, 403)
})

test('S11: no superadmin no puede gestionar rol superadmin ni modificar ese usuario', async () => {
  reset()
  const postRole = response()
  await roles.get('POST /')({ body: { Nombre_Rol: 'superadmin' } }, postRole)
  assert.equal(postRole.statusCode, 403)

  state.roleSuperadmin = true
  const putRole = response()
  await roles.get('PUT /:id')({ params: { id: 90 }, body: { Nombre_Rol: 'administrador' } }, putRole)
  assert.equal(putRole.statusCode, 403)
  const delRole = response()
  await roles.get('DELETE /:id')({ params: { id: 90 } }, delRole)
  assert.equal(delRole.statusCode, 403)

  state.targetUserSuperadmin = true
  const putUser = response()
  await users.get('PUT /:id')({ params: { id: 8 }, body: { Nombre_Completo: 'Global', Id_Rol: 90 } }, putUser)
  assert.equal(putUser.statusCode, 403)
  const inactivateUser = response()
  await users.get('PATCH /:id/inactivar')({ params: { id: 8 } }, inactivateUser)
  assert.equal(inactivateUser.statusCode, 403)
  const deleteUser = response()
  await users.get('DELETE /:id')({ params: { id: 8 } }, deleteUser)
  assert.equal(deleteUser.statusCode, 403)
})
