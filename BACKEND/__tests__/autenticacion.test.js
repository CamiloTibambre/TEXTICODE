// ═══════════════════════════════════════════════════════════════
// MÓDULO 1 · AUTENTICACIÓN  (RF-001 a RF-007) — pruebas del BACKEND
// Se prueba la API real (rutas, middlewares y servicios) con Supertest.
// La base de datos está simulada, así que no se modifica nada real.
// ═══════════════════════════════════════════════════════════════
import { jest, describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cargarApp } from './helpers/app.js'
import { iniciarSesionComo, iniciarSesionSuperadmin } from './helpers/sesiones.js'

let app, db, sendgrid
const CLAVE = 'Texticode#2026'
let HASH

// Usuario tal como lo devuelve la consulta de login
const usuarioBD = (rol, idRol) => ({
  Id_Usuario: 10, Nombre_Completo: 'Kevin Wagner', Nombre_Usuario: 'kevin', Correo: 'kevin@demo.com',
  Contrasena: HASH, Estado: 'activo', Id_Rol: idRol, Rol: rol,
})
const membresia = (rol, idRol) => ({
  Id_Empresa: 1, Nombre_Empresa: 'Demo', Empresa_Estado: 'activa', Id_Rol: idRol, Rol: rol,
  Membresia_Estado: 'activo', Es_Principal: true, Rol_Estado: null,
})
function prepararLogin(rol, idRol) {
  db.cuando('WHERE u."Correo" = $1 OR u."Nombre_Usuario" = $1', [usuarioBD(rol, idRol)])
  db.cuando('ue."Es_Principal" DESC', rol === 'superadmin' ? [] : [membresia(rol, idRol)])
}

beforeAll(async () => {
  HASH = await bcrypt.hash(CLAVE, 4)
  ;({ app, db, sendgrid } = await cargarApp())
})
beforeEach(() => db.reiniciar())
afterEach(() => jest.restoreAllMocks())

// ─────────────────────────────────────────────────────────────
describe('RF-001 · Iniciar sesión', () => {
  test('inicia sesión con nombre de usuario y contraseña correctos y recibe un token', async () => {
    prepararLogin('admin', 1)
    const res = await request(app).post('/api/auth/login').send({ usuario: 'kevin', contrasena: CLAVE })

    expect(res.status).toBe(200)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.usuario.Nombre_Usuario).toBe('kevin')
  })

  test('la respuesta del login nunca devuelve la contraseña', async () => {
    prepararLogin('admin', 1)
    const res = await request(app).post('/api/auth/login').send({ usuario: 'kevin', contrasena: CLAVE })
    expect(res.body.usuario).not.toHaveProperty('Contrasena')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-002 · Iniciar sesión con Google', () => {
  test('la URL de Google exige el nonce del navegador que inicia el login', async () => {
    const res = await request(app).get('/api/google/auth-url?action=login')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/nonce/i)
  })

  test('con nonce, devuelve la URL de OAuth2 de Google y el nonce viaja firmado en el state', async () => {
    const nonce = 'a1b2c3d4e5f6a7b8c9d0e1f2'
    const res = await request(app).get(`/api/google/auth-url?action=login&nonce=${nonce}`)

    expect(res.status).toBe(200)
    const url = new URL(res.body.url)
    expect(url.hostname).toBe('accounts.google.com')
    const state = jwt.verify(url.searchParams.get('state'), process.env.JWT_SECRET)
    expect(state.nonce).toBe(nonce)
  })

  test('rechaza un idToken de Google emitido para otra aplicación', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'kevin@demo.com', iss: 'accounts.google.com', email_verified: 'true', aud: 'otra-app' }),
    })
    const res = await request(app).post('/api/auth/google/mobile').send({ idToken: 'token-falso' })
    expect(res.status).toBe(401)
  })

  test('acepta un idToken válido de Google y entrega la sesión del usuario', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'kevin@demo.com', iss: 'accounts.google.com', email_verified: 'true', aud: process.env.GOOGLE_CLIENT_ID, sub: 'g-1' }),
    })
    db.cuando('WHERE LOWER(u."Correo") = LOWER($1)', [usuarioBD('admin', 1)])
    db.cuando('ue."Es_Principal" DESC', [membresia('admin', 1)])

    const res = await request(app).post('/api/auth/google/mobile').send({ idToken: 'token-valido' })
    expect(res.status).toBe(200)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.usuario.Correo).toBe('kevin@demo.com')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-003 · Validar credenciales', () => {
  test('exige completar usuario y contraseña', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'kevin' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Completa todos los campos.')
  })

  test('muestra error si la contraseña es incorrecta', async () => {
    prepararLogin('admin', 1)
    const res = await request(app).post('/api/auth/login').send({ usuario: 'kevin', contrasena: 'Otra#Clave1' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Credenciales incorrectas.')
  })

  test('muestra el mismo error si el usuario no existe (no revela qué cuentas existen)', async () => {
    db.cuando('WHERE u."Correo" = $1 OR u."Nombre_Usuario" = $1', [])
    const res = await request(app).post('/api/auth/login').send({ usuario: 'noexiste', contrasena: CLAVE })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Credenciales incorrectas.')
  })

  test('un usuario inactivo no puede ingresar', async () => {
    db.cuando('WHERE u."Correo" = $1 OR u."Nombre_Usuario" = $1', [{ ...usuarioBD('admin', 1), Estado: 'inactivo' }])
    const res = await request(app).post('/api/auth/login').send({ usuario: 'kevin', contrasena: CLAVE })
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-004 · Redirigir según rol', () => {
  test.each([
    ['superadmin', 90],
    ['admin', 1],
    ['operario', 2],
    ['cliente', 3],
  ])('el login de un %s devuelve su rol para llevarlo a su panel', async (rol, idRol) => {
    prepararLogin(rol, idRol)
    const res = await request(app).post('/api/auth/login').send({ usuario: 'kevin', contrasena: CLAVE })

    expect(res.status).toBe(200)
    expect(res.body.usuario.Rol).toBe(rol)
    const payload = jwt.decode(res.body.token)
    expect(payload.rol).toBe(idRol)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-005 · Controlar acceso por rol', () => {
  test('sin sesión, la API responde 401', async () => {
    const res = await request(app).get('/api/usuarios')
    expect(res.status).toBe(401)
  })

  test('con un token falso o alterado, la API responde 401', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', 'Bearer token.falso.123')
    expect(res.status).toBe(401)
  })

  test('un operario no puede abrir la gestión de usuarios del administrador (403)', async () => {
    const token = iniciarSesionComo(db, 'operario')
    const res = await request(app).get('/api/usuarios').set('Authorization', token)
    expect(res.status).toBe(403)
  })

  test('un cliente no puede abrir el inventario del administrador (403)', async () => {
    const token = iniciarSesionComo(db, 'cliente')
    const res = await request(app).get('/api/materiales').set('Authorization', token)
    expect(res.status).toBe(403)
  })

  test('un administrador no puede entrar a las pantallas del superadmin (403)', async () => {
    const token = iniciarSesionComo(db, 'admin')
    db.cuando('AS "Tiene_Membresias"', [{ Id_Usuario: 1, Estado: 'activo', Rol: 'admin', Tiene_Membresias: true }])
    const res = await request(app).get('/api/empresas').set('Authorization', token)
    expect(res.status).toBe(403)
  })

  test('el superadmin sí entra a sus pantallas', async () => {
    const token = iniciarSesionSuperadmin(db)
    db.cuando('FROM empresa e', [])
    const res = await request(app).get('/api/empresas').set('Authorization', token)
    expect(res.status).toBe(200)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-006 · Recuperar contraseña', () => {
  test('envía por correo un enlace con token cuando el correo existe', async () => {
    db.cuando('WHERE u."Correo" = $1', [{ Id_Usuario: 10, Nombre_Completo: 'Kevin Wagner', Correo: 'kevin@demo.com' }])
    const res = await request(app).post('/api/auth/recuperar-contrasena').send({ email: 'kevin@demo.com' })

    expect(res.status).toBe(200)
    expect(db.ejecuto('INSERT INTO tokens_recuperacion')).toBe(true)
    expect(sendgrid.send).toHaveBeenCalledTimes(1)
    const correo = sendgrid.send.mock.calls[0][0]
    expect(correo.to).toBe('kevin@demo.com')
    expect(correo.html).toMatch(/cambiar-contrasena\?token=[a-f0-9]{64}/)
  })

  test('valida el enlace antes de mostrar el formulario (token vencido o usado = inválido)', async () => {
    db.cuando('FROM tokens_recuperacion', [])
    const malo = await request(app).get('/api/auth/validar-token?token=abc')
    expect(malo.status).toBe(400)

    db.cuando('FROM tokens_recuperacion', [{ id: 5 }])
    const bueno = await request(app).get('/api/auth/validar-token?token=abc')
    expect(bueno.status).toBe(200)
    expect(bueno.body.valido).toBe(true)
  })

  test.each([
    ['Ab#1', 'al menos 8 caracteres'],
    ['texticode#2026', 'mayúscula'],
    ['Texticode#', 'número'],
    ['Texticode2026', 'carácter especial'],
  ])('rechaza la contraseña débil "%s" (falta: %s)', async (clave, regla) => {
    const res = await request(app).post('/api/auth/cambiar-contrasena').send({ token: 'abc', nuevaPassword: clave })
    expect(res.status).toBe(400)
    expect(res.body.mensaje).toContain(regla)
  })

  test('con un token válido y contraseña segura, guarda la nueva contraseña cifrada', async () => {
    db.cuando('FROM tokens_recuperacion', [{ id: 5, Id_Usuario: 10 }])
    const res = await request(app).post('/api/auth/cambiar-contrasena').send({ token: 'abc', nuevaPassword: 'Nueva#Clave2026' })

    expect(res.status).toBe(200)
    const [hash] = db.paramsDe('UPDATE usuario SET "Contrasena"')
    expect(hash).toMatch(/^\$2/)                       // se guarda con bcrypt, no en texto plano
    expect(db.ejecuto('UPDATE tokens_recuperacion SET usado = true')).toBe(true) // el enlace queda usado
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-007 · Cerrar sesión', () => {
  test('al cerrar sesión el token se descarta y, sin él, la API ya no da acceso', async () => {
    // El cierre de sesión borra el token en el navegador (se prueba en el FRONTEND).
    // Aquí se comprueba el efecto: una petición sin token queda bloqueada.
    const token = iniciarSesionComo(db, 'admin')
    db.cuando('INNER JOIN usuario_empresa ue ON', [])
    const conSesion = await request(app).get('/api/usuarios').set('Authorization', token)
    expect(conSesion.status).toBe(200)

    const sinSesion = await request(app).get('/api/usuarios')
    expect(sinSesion.status).toBe(401)
  })
})
