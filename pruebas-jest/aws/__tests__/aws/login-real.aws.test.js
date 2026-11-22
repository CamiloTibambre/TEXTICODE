import { test, expect } from '@jest/globals'

// UN SOLO caso de integración. Ejecutarlo dentro de la instancia EC2.
test('RF-001 AWS inicio de sesión real devuelve token y usuario sin contraseña', async () => {
  const { API_URL, TEST_USUARIO, TEST_CONTRASENA } = process.env
  if (!API_URL || !TEST_USUARIO || !TEST_CONTRASENA) {
    throw new Error('Define API_URL, TEST_USUARIO y TEST_CONTRASENA dentro del servidor AWS antes de ejecutar.')
  }
  const url = new URL('/api/auth/login', API_URL)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Usa API_URL=http://localhost:3001 y ejecuta esta prueba dentro de EC2.')
  }
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: TEST_USUARIO, contrasena: TEST_CONTRASENA }),
    signal: AbortSignal.timeout(20000),
  })
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.token).toEqual(expect.any(String))
  expect(data.token.split('.')).toHaveLength(3)
  expect(data.usuario.Id_Usuario).toBeDefined()
  for (const campo of ['Contrasena', 'contrasena', 'password']) expect(data.usuario).not.toHaveProperty(campo)
})
