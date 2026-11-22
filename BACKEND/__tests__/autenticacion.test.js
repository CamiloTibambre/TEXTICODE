import { jest, beforeEach, afterEach, describe, test, expect } from '@jest/globals'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db, correo, http, sesion, preparar, usuario, clave, respuestaGoogle } from './helpers/app.js'

function loginDB(user = usuario(2)) {
  preparar((sql) => {
    if (sql.includes('FROM usuario_empresa')) return { rows: user?.Id_Rol === 4 ? [] : [{ Id_Empresa: 7, Nombre_Empresa: 'Empresa de prueba', Id_Rol: user?.Id_Rol, Rol: user?.Rol }] }
    if (sql.includes('FROM usuario u')) return { rows: user ? [user] : [] }
    throw new Error('SQL inesperado')
  })
}
beforeEach(() => loginDB())
afterEach(() => jest.restoreAllMocks())

describe('RF-001 Iniciar sesión', () => {
  test('acepta nombre de usuario y contraseña y devuelve un JWT verificable', async () => {
    const r = await http.post('/api/auth/login').send({ usuario: 'usuario2', contrasena: clave })
    expect(r.status).toBe(200)
    expect(jwt.verify(r.body.token, process.env.JWT_SECRET)).toMatchObject({ id: 2, empresa: 7 })
    expect(db.query.mock.calls[0][1]).toEqual(['usuario2'])
  })
  test('no devuelve contraseñas en la sesión', async () => {
    const r = await http.post('/api/auth/login').send({ correo: 'usuario2@example.test', contrasena: clave })
    expect(r.status).toBe(200)
    expect(r.body.usuario).not.toHaveProperty('Contrasena')
    expect(JSON.stringify(r.body)).not.toContain(usuario().Contrasena)
  })
})
describe('RF-002 Iniciar sesión con Google', () => {
  test('exige el nonce del navegador para generar la autorización', async () => {
    expect((await http.get('/api/google/auth-url?action=login')).status).toBe(400)
  })
  test('firma el nonce en state y solicita OAuth2 de Google', async () => {
    const nonce = 'nonce_del_navegador_123456'
    const r = await http.get('/api/google/auth-url').query({ action: 'login', nonce })
    expect(r.status).toBe(200)
    const url = new URL(r.body.url)
    expect(url.hostname).toBe('accounts.google.com')
    expect(jwt.verify(url.searchParams.get('state'), process.env.JWT_SECRET)).toMatchObject({ nonce, action: 'login' })
  })
  test('rechaza un token de Google destinado a otra aplicación', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(respuestaGoogle({ email: 'usuario2@example.test', iss: 'https://accounts.google.com', email_verified: true, aud: 'otra-app' }))
    expect((await http.post('/api/auth/google/mobile').send({ idToken: 'falso' })).status).toBe(401)
  })
  test('un token válido de Google abre la sesión del usuario registrado', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(respuestaGoogle({ email: 'usuario2@example.test', iss: 'https://accounts.google.com', email_verified: true, aud: process.env.GOOGLE_CLIENT_ID }))
    const r = await http.post('/api/auth/google/mobile').send({ idToken: 'simulado' })
    expect(r.status).toBe(200)
    expect(r.body.usuario.Id_Usuario).toBe(2)
    expect(r.body.token).toEqual(expect.any(String))
  })
})
describe('RF-003 Validar credenciales', () => {
  test.each([{ correo: 'usuario2' }, { contrasena: clave }, {}])('exige los campos obligatorios %j', async body => {
    expect((await http.post('/api/auth/login').send(body)).status).toBe(400)
  })
  test('rechaza contraseña incorrecta con 401', async () => {
    expect((await http.post('/api/auth/login').send({ correo: 'usuario2', contrasena: 'incorrecta' })).status).toBe(401)
  })
  test('no revela si la cuenta no existe', async () => {
    loginDB(null)
    const r = await http.post('/api/auth/login').send({ correo: 'inexistente', contrasena: clave })
    expect(r.status).toBe(401)
    expect(r.body.error).toBe('Credenciales incorrectas.')
  })
  test('rechaza usuario inactivo aunque su contraseña sea correcta', async () => {
    loginDB({ ...usuario(), Estado: 'inactivo' })
    expect((await http.post('/api/auth/login').send({ correo: 'usuario2', contrasena: clave })).status).toBe(403)
  })
})
describe('RF-004 Rol de la sesión para redirigir', () => {
  test.each([1, 2, 3, 4])('entrega el rol real del usuario con Id_Rol %i', async rol => {
    loginDB(usuario(rol))
    const r = await http.post('/api/auth/login').send({ correo: `usuario${rol}`, contrasena: clave })
    expect(r.status).toBe(200)
    expect(r.body.usuario.Rol).toBe(usuario(rol).Rol)
  })
})
describe('RF-005 Control de acceso', () => {
  test('rechaza petición sin sesión', async () => {
    expect((await http.get('/api/google/status')).status).toBe(401)
  })
  test('rechaza un JWT alterado', async () => {
    expect((await http.get('/api/google/status').set('Authorization', 'Bearer token-falso')).status).toBe(401)
  })
  test.each([2, 3])('el rol %i no administra vinculaciones de otros usuarios', async rol => {
    expect((await sesion('get', '/api/google/connected-users', rol)).status).toBe(403)
  })
})
describe('RF-006 Recuperar contraseña', () => {
  test('rechaza correo sin formato válido', async () => {
    expect((await http.post('/api/auth/recuperar-contrasena').send({ email: 'invalido' })).status).toBe(400)
    expect(correo.send).not.toHaveBeenCalled()
  })
  test('genera token con vencimiento de una hora y prepara correo con enlace', async () => {
    preparar(sql => ({ rows: sql.includes('SELECT u.') ? [usuario()] : [] }))
    const inicio = Date.now()
    const r = await http.post('/api/auth/recuperar-contrasena').send({ email: usuario().Correo })
    expect(r.status).toBe(200)
    const insercion = db.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO tokens_recuperacion'))
    expect(insercion[1][1]).toMatch(/^[a-f0-9]{64}$/)
    expect(new Date(insercion[1][2]).getTime() - inicio).toBeGreaterThanOrEqual(3599000)
    expect(correo.send).toHaveBeenCalledWith(expect.objectContaining({ to: usuario().Correo, html: expect.stringContaining(insercion[1][1]) }))
  })
  test('correo inexistente recibe respuesta genérica sin envío', async () => {
    preparar(() => ({ rows: [] }))
    expect((await http.post('/api/auth/recuperar-contrasena').send({ email: 'nadie@example.test' })).status).toBe(200)
    expect(correo.send).not.toHaveBeenCalled()
  })
  test.each([{ rows: [] }, { rows: [{ id: 1 }] }])('valida el enlace según los registros vigentes %j', async ({ rows }) => {
    preparar(() => ({ rows }))
    const r = await http.get('/api/auth/validar-token?token=prueba')
    expect(r.status).toBe(rows.length ? 200 : 400)
    expect(db.query.mock.calls[0][0]).toContain('usado = false AND expiracion > NOW()')
  })
  test.each(['Ab#1', 'texticode#2026', 'Texticode#', 'Texticode2026'])('rechaza contraseña débil %s', async nuevaPassword => {
    expect((await http.post('/api/auth/cambiar-contrasena').send({ token: 'prueba', nuevaPassword })).status).toBe(400)
  })
  test('guarda hash bcrypt y marca usado el token válido', async () => {
    preparar(sql => ({ rows: sql.includes('SELECT id,') ? [{ id: 10, Id_Usuario: 2 }] : [] }))
    const r = await http.post('/api/auth/cambiar-contrasena').send({ token: 'prueba', nuevaPassword: clave })
    expect(r.status).toBe(200)
    const cambio = db.query.mock.calls.find(([sql]) => sql.includes('UPDATE usuario'))
    expect(await bcrypt.compare(clave, cambio[1][0])).toBe(true)
    expect(db.query.mock.calls.some(([sql]) => sql.includes('SET usado = true'))).toBe(true)
  })
})
describe('RF-007 Cerrar sesión', () => {
  test('al descartar el token una nueva petición vuelve a exigir sesión', async () => {
    preparar(() => ({ rows: [] }))
    expect((await sesion('get', '/api/google/status')).status).toBe(200)
    expect((await http.get('/api/google/status')).status).toBe(401)
  })
})
