import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/texticode_test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-enough-length'

const { signAuthToken, verifyAuthToken } = await import('../middleware/auth.js')
const { hasRole, requireRoles, requireSelfParamOrRoles } = await import('../middleware/roles.js')

test('firma y valida tokens de sesión compatibles', () => {
  const token = signAuthToken({
    Id_Usuario: 10,
    Id_Rol: 1,
    Nombre_Usuario: 'admin_test',
  })

  const payload = verifyAuthToken(token)
  assert.equal(payload.id, 10)
  assert.equal(payload.rol, 1)
  assert.equal(payload.usuario, 'admin_test')
})

test('rechaza tokens con estructura incompleta', () => {
  const token = signAuthToken({
    Id_Usuario: 10,
    Nombre_Usuario: 'sin_rol',
  })

  assert.throws(() => verifyAuthToken(token), /estructura/)
})

test('mapea roles por id y nombre', () => {
  assert.equal(hasRole({ rol: 1, rolNombre: 'Administrador' }, ['admin']), true)
  assert.equal(hasRole({ rol: 2, rolNombre: 'Operario' }, ['operario']), true)
  assert.equal(hasRole({ rol: 3, rolNombre: 'Cliente' }, ['cliente']), true)
  assert.equal(hasRole({ rol: 3, rolNombre: 'Cliente' }, ['admin']), false)
})

test('rechaza token expirado', async () => {
  const jwt = await import('jsonwebtoken')
  const token = jwt.default.sign(
    { id: 10, rol: 1, usuario: 'admin_test' },
    process.env.JWT_SECRET,
    { expiresIn: '-1s' }
  )

  assert.throws(() => verifyAuthToken(token), { name: 'TokenExpiredError' })
})

test('middleware de roles rechaza rol no autorizado', () => {
  const req = { auth: { rol: 3, rolNombre: 'Cliente' } }
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  let nextCalled = false

  requireRoles('admin')(req, res, () => { nextCalled = true })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
  assert.match(res.body.error, /permisos/)
})

test('middleware self-or-role permite recurso propio y rechaza ajeno', () => {
  const makeRes = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  })

  const ownReq = { auth: { id: 33, rol: 3, rolNombre: 'Cliente' }, params: { id: '33' } }
  const ownRes = makeRes()
  let ownNext = false
  requireSelfParamOrRoles('id', 'admin')(ownReq, ownRes, () => { ownNext = true })
  assert.equal(ownNext, true)

  const otherReq = { auth: { id: 33, rol: 3, rolNombre: 'Cliente' }, params: { id: '44' } }
  const otherRes = makeRes()
  let otherNext = false
  requireSelfParamOrRoles('id', 'admin')(otherReq, otherRes, () => { otherNext = true })
  assert.equal(otherNext, false)
  assert.equal(otherRes.statusCode, 403)
  assert.match(otherRes.body.error, /recurso/)
})
