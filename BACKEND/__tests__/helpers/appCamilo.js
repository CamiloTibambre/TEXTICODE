import { jest } from '@jest/globals'
import express from 'express'
import request from 'supertest'
import bcrypt from 'bcryptjs'

export const db = { query: jest.fn(), connect: jest.fn() }
export const correo = { setApiKey: jest.fn(), send: jest.fn(async () => [{ statusCode: 202 }]) }
jest.unstable_mockModule('../../db.js', () => ({ default: db }))
jest.unstable_mockModule('@sendgrid/mail', () => ({ default: correo }))
jest.unstable_mockModule('../../services/emailService.js', () => ({ notificarCambioEstado: jest.fn() }))
const { signAuthToken, requireAuth } = await import('../../middleware/auth.js')
const { default: auth } = await import('../../routes/auth.route.js')
export const google = await import('../../routes/googleCalendar.js')
const { default: operario } = await import('../../routes/orden_operario.js')

export const app = express()
app.use(express.json())
app.use('/api/auth', auth)
app.use('/api/google', google.default)
app.use('/api/orden-operario', requireAuth, operario)
app.use((err, req, res, next) => res.status(500).json({ error: err.message }))
export const http = request(app)
export const clave = 'Texticode2026!'
const hash = await bcrypt.hash(clave, 4)
export const usuario = (rol = 2) => ({
  Id_Usuario: rol, Id_Rol: rol, Rol: { 1: 'Administrador', 2: 'Operario', 3: 'Cliente', 4: 'superadmin' }[rol],
  Nombre_Usuario: `usuario${rol}`, Nombre_Completo: `Usuario ${rol}`, Correo: `usuario${rol}@example.test`,
  Contrasena: hash, Estado: 'activo', Id_Empresa: 7, Nombre_Empresa: 'Empresa de prueba',
  Membresia_Id_Empresa: 7, Membresia_Id_Rol: rol,
  Membresia_Rol: { 1: 'Administrador', 2: 'Operario', 3: 'Cliente' }[rol],
})
export const token = (rol = 2) => signAuthToken(usuario(rol))
export const sesion = (method, path, rol = 2) => http[method](path).set('Authorization', `Bearer ${token(rol)}`)
export function preparar(handler = () => { throw new Error('Consulta no prevista en la prueba') }) {
  db.query.mockReset().mockImplementation(async (sql, params = []) => {
    if (sql.includes('LEFT JOIN usuario_empresa ue')) return { rows: [usuario(Number(params[0]))] }
    return handler(sql, params)
  })
  db.connect.mockReset().mockImplementation(async () => ({ query: db.query, release: jest.fn() }))
  correo.send.mockClear()
}
export const respuestaGoogle = data => ({ ok: true, json: async () => data })
