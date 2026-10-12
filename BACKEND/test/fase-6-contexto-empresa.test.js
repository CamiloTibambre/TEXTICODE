import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const state = {
  user: {
    Id_Usuario: 7,
    Nombre_Completo: 'Usuario de prueba',
    Nombre_Usuario: 'usuario_fase6',
    Correo: 'fase6@example.invalid',
    Contrasena: 'clave-local',
    Estado: 'activo',
    Id_Rol: 1,
    Rol: 'Administrador',
  },
  memberships: [],
  requestMembershipActive: true,
  membershipTablesMissing: false,
  queryLog: [],
  tokens: new Map(),
  tokenSequence: 0,
  routes: new Map(),
}

function activeMembership(id = 4) {
  return {
    Id_Empresa: id,
    Nombre_Empresa: `Empresa ${id}`,
    Empresa_Estado: 'activa',
    Id_Rol: 1,
    Rol: 'Administrador',
    Membresia_Estado: 'activo',
    Es_Principal: true,
  }
}

const database = {
  async query(sql, params = []) {
    state.queryLog.push({ sql, params })

    if (sql.includes('LEFT JOIN usuario_empresa')) {
      if (state.membershipTablesMissing) {
        const error = new Error('relation usuario_empresa does not exist')
        error.code = '42P01'
        throw error
      }
      const member = state.requestMembershipActive
        ? state.memberships.find(item => Number(item.Id_Empresa) === Number(params[1]) && item.Membresia_Estado === 'activo' && item.Empresa_Estado === 'activa')
        : null
      return {
        rows: state.user ? [{
          ...state.user,
          Membresia_Id_Empresa: member?.Id_Empresa ?? null,
          Nombre_Empresa: member?.Nombre_Empresa ?? null,
        }] : [],
      }
    }

    if (sql.includes('FROM usuario_empresa ue')) {
      return {
        rows: state.memberships.filter(item => item.Membresia_Estado === 'activo' && item.Empresa_Estado === 'activa'),
      }
    }

    if (sql.includes('FROM usuario u')) return { rows: state.user ? [{ ...state.user }] : [] }
    return { rows: [] }
  },
}

const jwt = {
  sign(payload) {
    const token = `mock-token-${++state.tokenSequence}`
    state.tokens.set(token, structuredClone(payload))
    return token
  },
  verify(token) {
    if (token === 'expired-token') {
      const error = new Error('expired')
      error.name = 'TokenExpiredError'
      throw error
    }
    if (!state.tokens.has(token)) {
      const error = new Error('invalid')
      error.name = 'JsonWebTokenError'
      throw error
    }
    return structuredClone(state.tokens.get(token))
  },
}

const express = {
  Router() {
    return {
      post(path, handler) { state.routes.set(`POST ${path}`, handler) },
      get(path, handler) { state.routes.set(`GET ${path}`, handler) },
    }
  },
}

globalThis.__fase61Mocks = {
  database,
  env: { jwtSecret: 'mock-secret', jwtExpires: '1h', sendgridApiKey: '' },
  express,
  jwt,
  sgMail: { setApiKey() {}, async send() { return [{}] } },
  google: { async exchangeMobileAuthCode() {}, async upsertGoogleTokens() {} },
  bcrypt: { async compare() { return false }, async hash() { return 'mock-hash' } },
  auth: null,
  service: null,
}

function replaceOnce(source, target, replacement, label) {
  assert.ok(source.includes(target), `No se encontró el import que debía simularse: ${label}`)
  return source.replace(target, replacement)
}

async function importSourceAsMockedModule(source) {
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)
}

let auth
let service

await test('prepara módulos con dobles: no importa env.js, db.js ni módulos externos de red', async () => {
  let middleware = await readFile(new URL('../middleware/auth.js', import.meta.url), 'utf8')
  middleware = replaceOnce(middleware, "import jwt from 'jsonwebtoken'", 'const jwt = globalThis.__fase61Mocks.jwt', 'jsonwebtoken')
  middleware = replaceOnce(middleware, "import { env } from '../config/env.js'", 'const { env } = globalThis.__fase61Mocks', 'config/env.js')
  middleware = replaceOnce(middleware, "const { default: db } = await import('../db.js')", 'const db = globalThis.__fase61Mocks.database', 'db.js')
  auth = await importSourceAsMockedModule(middleware)
  globalThis.__fase61Mocks.auth = auth

  let authService = await readFile(new URL('../services/auth.service.js', import.meta.url), 'utf8')
  authService = replaceOnce(authService, "import bcrypt from 'bcryptjs'", 'const bcrypt = globalThis.__fase61Mocks.bcrypt', 'bcryptjs')
  authService = replaceOnce(
    authService,
    "import { signAuthToken, verifySelectionToken } from '../middleware/auth.js'",
    'const { signAuthToken, verifySelectionToken } = globalThis.__fase61Mocks.auth',
    'middleware/auth.js'
  )
  service = await importSourceAsMockedModule(authService)
  globalThis.__fase61Mocks.service = service

  let route = await readFile(new URL('../routes/auth.route.js', import.meta.url), 'utf8')
  route = replaceOnce(route, "import { exchangeMobileAuthCode, upsertGoogleTokens } from './googleCalendar.js'", 'const { exchangeMobileAuthCode, upsertGoogleTokens } = globalThis.__fase61Mocks.google', 'googleCalendar.js')
  route = route.replace(/^import express\s+from 'express'$/m, 'const express = globalThis.__fase61Mocks.express')
  route = replaceOnce(route, "import crypto   from 'crypto'", "import crypto from 'node:crypto'", 'node:crypto')
  route = replaceOnce(route, "import sgMail   from '@sendgrid/mail'", 'const sgMail = globalThis.__fase61Mocks.sgMail', '@sendgrid/mail')
  route = replaceOnce(route, "import db       from '../db.js'", 'const db = globalThis.__fase61Mocks.database', 'db.js')
  route = replaceOnce(route, "import bcrypt   from 'bcryptjs'", 'const bcrypt = globalThis.__fase61Mocks.bcrypt', 'bcryptjs')
  route = replaceOnce(route, "import { env } from '../config/env.js'", 'const { env } = globalThis.__fase61Mocks', 'config/env.js')
  route = replaceOnce(route, "import { signAuthToken } from '../middleware/auth.js'", 'const { signAuthToken } = globalThis.__fase61Mocks.auth', 'middleware/auth.js')
  route = replaceOnce(route, "import { getUserMemberships, processLogin, selectEmpresa } from '../services/auth.service.js'", 'const { getUserMemberships, processLogin, selectEmpresa } = globalThis.__fase61Mocks.service', 'auth.service.js')
  await importSourceAsMockedModule(route)

  assert.equal(state.routes.has('POST /login'), true)
  assert.equal(state.routes.has('POST /select-empresa'), true)
})

function resetState() {
  state.user = {
    Id_Usuario: 7,
    Nombre_Completo: 'Usuario de prueba',
    Nombre_Usuario: 'usuario_fase6',
    Correo: 'fase6@example.invalid',
    Contrasena: 'clave-local',
    Estado: 'activo',
    Id_Rol: 1,
    Rol: 'Administrador',
  }
  state.memberships = [activeMembership()]
  state.requestMembershipActive = true
  state.membershipTablesMissing = false
  state.queryLog = []
  state.tokens = new Map()
  state.tokenSequence = 0
}

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
}

function signedRequest(payload, extra = {}) {
  const token = `request-${++state.tokenSequence}`
  state.tokens.set(token, payload)
  return {
    headers: { authorization: `Bearer ${token}` },
    body: {},
    query: {},
    params: {},
    ...extra,
  }
}

test('P1: login deriva la empresa única e ignora la empresa del cliente; select-empresa queda deprecado e ignora su empresa', async () => {
  resetState()
  const loginReq = {
    body: { correo: 'fase6@example.invalid', contrasena: 'clave-local', empresaId: 99, idEmpresa: 88, Id_Empresa: 77 },
    headers: {},
  }
  const loginRes = makeResponse()
  await state.routes.get('POST /login')(loginReq, loginRes)

  assert.equal(loginRes.statusCode, 200)
  assert.equal(loginRes.body.empresaActiva.Id_Empresa, 4)
  const issuedToken = state.tokens.get(loginRes.body.token)
  assert.equal(issuedToken.empresa, 4)
  assert.equal(state.queryLog.some(query => query.params?.includes(99) || query.params?.includes(88) || query.params?.includes(77)), false)

  const selectionToken = auth.signSelectionToken(state.user)
  const selectionReq = { body: { token: selectionToken, idEmpresa: 99, Id_Empresa: 88 }, headers: {} }
  const selectionRes = makeResponse()
  await state.routes.get('POST /select-empresa')(selectionReq, selectionRes)
  assert.equal(selectionRes.statusCode, 200)
  assert.equal(state.tokens.get(selectionRes.body.token).empresa, 4)

  const previousFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: true, async json() { return { email: state.user.Correo, sub: 'mock-google-sub' } } })
  try {
    const googleRes = makeResponse()
    await state.routes.get('POST /google/mobile')({ body: { idToken: 'mock-google-id-token' }, headers: {} }, googleRes)
    assert.equal(googleRes.statusCode, 200)
    assert.equal(state.tokens.get(googleRes.body.token).empresa, 4)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('P2: login sin membresía activa responde HTTP 403', async () => {
  resetState()
  state.memberships = []
  const res = makeResponse()
  await state.routes.get('POST /login')({ body: { correo: 'fase6@example.invalid', contrasena: 'clave-local' }, headers: {} }, res)
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.code, 'NO_MEMBERSHIPS')
})

test('P3: login con membresía inactiva responde HTTP 403', async () => {
  resetState()
  state.memberships = [{ ...activeMembership(), Membresia_Estado: 'inactivo' }]
  const res = makeResponse()
  await state.routes.get('POST /login')({ body: { correo: 'fase6@example.invalid', contrasena: 'clave-local' }, headers: {} }, res)
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.code, 'NO_MEMBERSHIPS')
})

test('P4: requireAuth devuelve 403 si se desactiva la membresía después de emitir el token', async () => {
  resetState()
  state.requestMembershipActive = false
  const req = signedRequest({ id: 7, rol: 1, usuario: 'usuario_fase6', empresa: 4 })
  const res = makeResponse()
  let nextCalled = false
  await auth.requireAuth(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
  assert.equal(state.queryLog.length, 1)
})

test('P5: requireAuth devuelve 403 si la empresa del token no coincide con la membresía', async () => {
  resetState()
  const req = signedRequest({ id: 7, rol: 1, usuario: 'usuario_fase6', empresa: 9 })
  const res = makeResponse()
  let nextCalled = false
  await auth.requireAuth(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
  assert.equal(state.queryLog.length, 1)
})

test('P6: requireAuth conserva empresaId del token aunque body, query y params indiquen otra', async () => {
  resetState()
  const req = signedRequest(
    { id: 7, rol: 1, usuario: 'usuario_fase6', empresa: 4 },
    { body: { empresaId: 99 }, query: { empresaId: 88 }, params: { empresaId: '77' } }
  )
  const res = makeResponse()
  let nextCalled = false
  await auth.requireAuth(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
  assert.equal(req.auth.empresaId, 4)
  assert.equal(state.queryLog.at(-1).params[1], 4)
})

test('P7: token ausente, vencido e con firma inválida mantienen rechazo HTTP 401', async () => {
  resetState()
  const cases = [
    { req: { headers: {}, body: {}, query: {}, params: {} }, message: /Sesi.n requerida/ },
    { req: { headers: { authorization: 'Bearer expired-token' }, body: {}, query: {}, params: {} }, message: /Sesi.n expirada/ },
    { req: { headers: { authorization: 'Bearer invalid-token' }, body: {}, query: {}, params: {} }, message: /Sesi.n inv.lida/ },
  ]

  for (const item of cases) {
    const res = makeResponse()
    let nextCalled = false
    await auth.requireAuth(item.req, res, () => { nextCalled = true })
    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 401)
    assert.match(res.body.error, item.message)
  }
})

test('P8: usuario inactivo sigue en 403 y un rol distinto conserva el rol del token como antes', async () => {
  resetState()
  state.user.Estado = 'inactivo'
  const inactiveReq = signedRequest({ id: 7, rol: 1, usuario: 'usuario_fase6', empresa: 4 })
  const inactiveRes = makeResponse()
  let inactiveNext = false
  await auth.requireAuth(inactiveReq, inactiveRes, () => { inactiveNext = true })
  assert.equal(inactiveNext, false)
  assert.equal(inactiveRes.statusCode, 403)

  resetState()
  const roleReq = signedRequest({ id: 7, rol: 2, usuario: 'usuario_fase6', empresa: 4 })
  const roleRes = makeResponse()
  let roleNext = false
  await auth.requireAuth(roleReq, roleRes, () => { roleNext = true })
  assert.equal(roleNext, true)
  assert.equal(roleReq.auth.rol, 2)

  resetState()
  state.membershipTablesMissing = true
  const legacyReq = signedRequest({ id: 7, rol: 1, usuario: 'usuario_fase6' })
  const legacyRes = makeResponse()
  let legacyNext = false
  await auth.requireAuth(legacyReq, legacyRes, () => { legacyNext = true })
  assert.equal(legacyNext, true)
  assert.equal(legacyReq.auth.empresaId, null)
})
