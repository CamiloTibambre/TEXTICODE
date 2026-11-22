// ═══════════════════════════════════════════════════════════════
// PRUEBA EN EL SERVIDOR AWS · RF-037 Ver tendencia de rendimiento
// Integrante: Andrés Lancheros
//
// Le habla al backend que corre en el servidor AWS, conectado a Supabase.
// Solo lee datos (no crea, edita ni borra nada).
//
// Antes de correrla (PowerShell, en la carpeta BACKEND del servidor):
//   $env:API_URL = 'http://localhost:3001'
//   $env:TEST_USUARIO = 'usuario_admin_real'
//   $env:TEST_CONTRASENA = 'su_contraseña'
//   npm run test:jest:aws -- eficiencia
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll } from '@jest/globals'
import os from 'node:os'

const API = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
let token, operario

async function get(ruta) {
  const res = await fetch(`${API}${ruta}`, { headers: { Authorization: `Bearer ${token}` } })
  return { status: res.status, body: await res.json() }
}

describe(`RF-037 · Ver tendencia de rendimiento — integración real en AWS (${os.hostname()})`, () => {
  beforeAll(async () => {
    if (!process.env.TEST_USUARIO || !process.env.TEST_CONTRASENA) {
      throw new Error('Define TEST_USUARIO y TEST_CONTRASENA (un administrador real) antes de correr la prueba.')
    }
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: process.env.TEST_USUARIO, contrasena: process.env.TEST_CONTRASENA }),
    })
    const body = await res.json()
    if (res.status !== 200) throw new Error(`No se pudo iniciar sesión (${res.status}): ${body.error}`)
    if (!['admin', 'administrador'].includes(String(body.usuario.Rol).toLowerCase())) {
      throw new Error('TEST_USUARIO debe ser un administrador de empresa.')
    }
    token = body.token
  })

  test('el ranking de eficiencia responde con datos reales de Supabase', async () => {
    const { status, body } = await get('/api/eficiencia/operarios')
    expect(status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)            // la empresa debe tener al menos un operario activo
    operario = body.data[0]
    expect(operario).toEqual(expect.objectContaining({ Id_Usuario: expect.any(Number), rendimiento: expect.stringMatching(/Alto|Medio|Bajo/) }))
  })

  test('el detalle del operario responde con sus órdenes', async () => {
    const { status, body } = await get(`/api/eficiencia/operarios/${operario.Id_Usuario}`)
    expect(status).toBe(200)
    expect(Array.isArray(body.data.ordenes_detalle)).toBe(true)
  })

  test.each(['semana', 'mes', 'trimestre'])('el historial del operario compara el periodo actual con el anterior (%s)', async (periodo) => {
    const { status, body } = await get(`/api/eficiencia/operarios/${operario.Id_Usuario}/historial?periodo=${periodo}`)
    expect(status).toBe(200)
    expect(body.data).toEqual(expect.objectContaining({
      periodo, tendencia: expect.stringMatching(/subiendo|bajando|estable/),
      actual: expect.any(Object), anterior: expect.any(Object), diferencia_prendas: expect.any(Number),
    }))
  })
})
