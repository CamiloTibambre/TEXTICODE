import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import jwt from 'jsonwebtoken'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/texticode_test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-enough-length'
process.env.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'SG.test-key-for-local-tests'
process.env.SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'tests@example.com'

const { app } = await import('../index.js')

async function withServer(fn) {
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  try {
    return await fn(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

test('healthcheck público responde sin token', async () => {
  await withServer(async baseUrl => {
    const res = await fetch(`${baseUrl}/health`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { ok: true, service: 'texticode-api' })
  })
})

test('ruta privada rechaza solicitudes sin token', async () => {
  await withServer(async baseUrl => {
    const res = await fetch(`${baseUrl}/api/materiales`)
    assert.equal(res.status, 401)
    assert.match((await res.json()).error, /Sesión requerida/)
  })
})

test('ruta privada rechaza token inválido sin consultar recursos', async () => {
  await withServer(async baseUrl => {
    const res = await fetch(`${baseUrl}/api/materiales`, {
      headers: { Authorization: 'Bearer token-invalido' },
    })
    assert.equal(res.status, 401)
    assert.match((await res.json()).error, /Sesión inválida/)
  })
})

test('ruta privada rechaza token expirado', async () => {
  const token = jwt.sign(
    { id: 10, rol: 1, usuario: 'admin_test' },
    process.env.JWT_SECRET,
    { expiresIn: '-1s' }
  )

  await withServer(async baseUrl => {
    const res = await fetch(`${baseUrl}/api/materiales`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(res.status, 401)
    assert.match((await res.json()).error, /Sesión expirada/)
  })
})
