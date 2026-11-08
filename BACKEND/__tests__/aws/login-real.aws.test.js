// ═══════════════════════════════════════════════════════════════
// PRUEBA EN EL SERVIDOR AWS · RF-001 Iniciar sesión (integración real)
//
// A diferencia de las demás, esta prueba NO simula nada: le habla al
// backend que está corriendo en el servidor AWS, conectado a Supabase.
// Solo lee datos (no crea, edita ni borra nada).
//
// Antes de correrla (PowerShell, en la carpeta BACKEND del servidor):
//   $env:API_URL = "http://localhost:3001"
//   $env:TEST_USUARIO = "usuario_o_correo_real"
//   $env:TEST_CONTRASENA = "su_contraseña"
//   npm run test:jest:aws
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll } from '@jest/globals'
import os from 'node:os'

const API = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
const USUARIO = process.env.TEST_USUARIO
const CONTRASENA = process.env.TEST_CONTRASENA

async function login(usuario, contrasena) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contrasena }),
  })
  return { status: res.status, body: await res.json() }
}

describe(`RF-001 · Iniciar sesión — integración real en AWS (${os.hostname()})`, () => {
  beforeAll(() => {
    if (!USUARIO || !CONTRASENA) {
      throw new Error('Define TEST_USUARIO y TEST_CONTRASENA antes de correr la prueba (ver encabezado del archivo).')
    }
  })

  test('el backend está encendido en el servidor y responde /health', async () => {
    const res = await fetch(`${API}/health`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, service: 'texticode-api' })
  })

  test('un usuario real inicia sesión contra la base de datos de Supabase y recibe su token', async () => {
    const { status, body } = await login(USUARIO, CONTRASENA)
    expect(status).toBe(200)
    expect(body.token).toEqual(expect.any(String))
    expect(body.usuario).toEqual(expect.objectContaining({ Id_Usuario: expect.any(Number), Rol: expect.any(String) }))
    expect(body.usuario).not.toHaveProperty('Contrasena')
  })

  test('con una contraseña incorrecta el servidor rechaza el acceso (401)', async () => {
    const { status, body } = await login(USUARIO, 'Incorrecta#0000')
    expect(status).toBe(401)
    expect(body.error).toBe('Credenciales incorrectas.')
  })

  test('el token recibido abre una ruta protegida (perfil propio)', async () => {
    const { body } = await login(USUARIO, CONTRASENA)
    if (String(body.usuario.Rol).toLowerCase() === 'superadmin') {
      // el superadmin no tiene perfil de empresa: se valida con su listado de empresas
      const r = await fetch(`${API}/api/empresas`, { headers: { Authorization: `Bearer ${body.token}` } })
      expect(r.status).toBe(200)
      return
    }
    const r = await fetch(`${API}/api/usuarios/${body.usuario.Id_Usuario}`, { headers: { Authorization: `Bearer ${body.token}` } })
    expect(r.status).toBe(200)
    expect((await r.json()).Id_Usuario).toBe(body.usuario.Id_Usuario)
  })
})
