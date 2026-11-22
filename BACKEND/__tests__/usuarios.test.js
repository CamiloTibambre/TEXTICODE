// ═══════════════════════════════════════════════════════════════
// MÓDULO 2 · ADMINISTRADOR – GESTIÓN DE USUARIOS (RF-008 a RF-014)
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { cargarApp } from './helpers/app.js'
import { errorPg } from './helpers/dbFalsa.js'
import { iniciarSesionComo, USUARIOS_SESION } from './helpers/sesiones.js'

let app, db, tokenAdmin

const nuevoUsuario = {
  Nombre_Completo: 'Laura Gómez', Nombre_Usuario: 'laura.gomez', Correo: 'laura@demo.com',
  Telefono: '+57 300 123 4567', Id_Rol: 2, Contrasena: 'Operaria#2026', Estado: 'activo',
}

const listaUsuarios = [
  { Id_Usuario: 1, Nombre_Completo: 'Ana Admin', Correo: 'ana@demo.com', Rol: 'admin', Id_Rol: 1, Estado: 'activo', Fecha_Registro: '2026-01-10' },
  { Id_Usuario: 2, Nombre_Completo: 'Oscar Operario', Correo: 'oscar@demo.com', Rol: 'operario', Id_Rol: 2, Estado: 'activo', Fecha_Registro: '2026-02-11' },
  { Id_Usuario: 3, Nombre_Completo: 'Carla Cliente', Correo: 'carla@demo.com', Rol: 'cliente', Id_Rol: 3, Estado: 'activo', Fecha_Registro: '2026-03-12' },
]

beforeAll(async () => { ({ app, db } = await cargarApp()) })
beforeEach(() => {
  db.reiniciar()
  tokenAdmin = iniciarSesionComo(db, 'admin')
})

// ─────────────────────────────────────────────────────────────
describe('RF-008 · Crear usuario', () => {
  test('el administrador registra un usuario con todos sus datos (201)', async () => {
    db.cuando('INSERT INTO usuario (', [{ Id_Usuario: 25 }])
    const res = await request(app).post('/api/usuarios').set('Authorization', tokenAdmin).send(nuevoUsuario)

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ mensaje: 'Usuario creado', Id_Usuario: 25 })
    const params = db.paramsDe('INSERT INTO usuario (')
    expect(params.slice(0, 5)).toEqual([2, 'Laura Gómez', 'laura.gomez', 'laura@demo.com', '+57 300 123 4567'])
  })

  test('la contraseña se guarda cifrada con bcrypt, nunca en texto plano', async () => {
    db.cuando('INSERT INTO usuario (', [{ Id_Usuario: 25 }])
    await request(app).post('/api/usuarios').set('Authorization', tokenAdmin).send(nuevoUsuario)
    const hash = db.paramsDe('INSERT INTO usuario (')[6]
    expect(hash).not.toBe(nuevoUsuario.Contrasena)
    expect(hash).toMatch(/^\$2[aby]\$/)
  })

  test('el usuario queda asociado a la empresa del administrador', async () => {
    db.cuando('INSERT INTO usuario (', [{ Id_Usuario: 25 }])
    await request(app).post('/api/usuarios').set('Authorization', tokenAdmin).send(nuevoUsuario)
    const [idUsuario, idEmpresa] = db.paramsDe('INSERT INTO usuario_empresa')
    expect(idUsuario).toBe(25)
    expect(idEmpresa).toBe(1)
  })

  test('rechaza el registro si faltan campos obligatorios', async () => {
    const { Correo, ...incompleto } = nuevoUsuario
    const res = await request(app).post('/api/usuarios').set('Authorization', tokenAdmin).send(incompleto)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Faltan campos obligatorios')
  })

  test('rechaza una contraseña que no es segura', async () => {
    const res = await request(app).post('/api/usuarios').set('Authorization', tokenAdmin)
      .send({ ...nuevoUsuario, Contrasena: 'clave123' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/mayúscula/)
  })

  test('rechaza un nombre completo con números', async () => {
    const res = await request(app).post('/api/usuarios').set('Authorization', tokenAdmin)
      .send({ ...nuevoUsuario, Nombre_Completo: 'Laura 123' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('El nombre no puede contener números.')
  })

  test('avisa si el correo o el nombre de usuario ya existen (409)', async () => {
    db.cuando('INSERT INTO usuario (', errorPg('23505'))
    const res = await request(app).post('/api/usuarios').set('Authorization', tokenAdmin).send(nuevoUsuario)
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('El correo o nombre de usuario ya existe')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-009 · Editar usuario', () => {
  test('el administrador modifica nombre, usuario, correo, teléfono y rol', async () => {
    db.cuando('SELECT u."Id_Rol", u."Estado"', [{ Id_Rol: 2, Estado: 'activo' }])
    const cambios = { Nombre_Completo: 'Laura Gómez Ruiz', Nombre_Usuario: 'lgomez', Correo: 'lgomez@demo.com', Telefono: '+57 311 000 0000', Id_Rol: 3 }
    const res = await request(app).put('/api/usuarios/25').set('Authorization', tokenAdmin).send(cambios)

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Usuario actualizado')
    const params = db.paramsDe('UPDATE usuario\n')
    expect(params.slice(0, 5)).toEqual([3, 'Laura Gómez Ruiz', 'lgomez', 'lgomez@demo.com', '+57 311 000 0000'])
  })

  test('no permite editar un usuario de otra empresa (404)', async () => {
    db.cuando('SELECT u."Id_Rol", u."Estado"', [])
    const res = await request(app).put('/api/usuarios/999').set('Authorization', tokenAdmin)
      .send({ Nombre_Completo: 'Otro Usuario', Nombre_Usuario: 'otro', Correo: 'otro@x.com' })
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-010 · Asignar rol', () => {
  test('lista los roles disponibles para asignar, incluido administrador', async () => {
    db.cuando('SELECT * FROM rol', [
      { Id_Rol: 1, Nombre_Rol: 'admin' }, { Id_Rol: 2, Nombre_Rol: 'operario' }, { Id_Rol: 3, Nombre_Rol: 'cliente' },
    ])
    const res = await request(app).get('/api/roles').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(res.body.map(r => r.Nombre_Rol)).toEqual(['admin', 'operario', 'cliente'])
  })

  test('puede crear un usuario con rol administrador', async () => {
    db.cuando('INSERT INTO usuario (', [{ Id_Usuario: 26 }])
    const res = await request(app).post('/api/usuarios').set('Authorization', tokenAdmin).send({ ...nuevoUsuario, Id_Rol: 1 })
    expect(res.status).toBe(201)
    expect(db.paramsDe('INSERT INTO usuario_empresa')[2]).toBe(1) // la membresía queda con el rol admin
  })

  test('no puede asignar el rol superadmin (403)', async () => {
    db.cuando(`lower(trim("Nombre_Rol")) = 'superadmin'`, [{ ok: 1 }])
    const res = await request(app).post('/api/usuarios').set('Authorization', tokenAdmin).send({ ...nuevoUsuario, Id_Rol: 90 })
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-011 · Desactivar usuario', () => {
  test('al desactivar, el usuario y su membresía quedan en estado inactivo', async () => {
    db.cuando('SELECT u."Id_Rol", u."Estado"', [{ Id_Rol: 2, Estado: 'activo' }])
    const res = await request(app).put('/api/usuarios/25').set('Authorization', tokenAdmin)
      .send({ Nombre_Completo: 'Laura Gómez', Nombre_Usuario: 'laura.gomez', Correo: 'laura@demo.com', Id_Rol: 2, Estado: 'inactivo' })

    expect(res.status).toBe(200)
    expect(db.paramsDe('UPDATE usuario\n')[5]).toBe('inactivo')
    expect(db.paramsDe('UPDATE usuario_empresa SET')).toEqual([2, 'inactivo', '25', 1])
  })

  test('también se puede desactivar por la ruta PATCH /inactivar', async () => {
    db.cuando(`UPDATE usuario_empresa SET "Estado" = 'inactivo'`, { rowCount: 1, rows: [] })
    const res = await request(app).patch('/api/usuarios/25/inactivar').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Usuario inactivado')
  })

  test('un usuario desactivado ya no puede usar el sistema (403)', async () => {
    const token = iniciarSesionComo(db, 'operario')
    db.cuando('LEFT JOIN usuario_empresa', [{ ...USUARIOS_SESION.operario, Estado: 'inactivo' }])
    const res = await request(app).get('/api/usuarios/2').set('Authorization', token)
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Usuario inactivo.')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-012 · Buscar, filtrar y ordenar usuarios', () => {
  test('la API entrega los datos que la vista usa para buscar, filtrar y ordenar', async () => {
    db.cuando('INNER JOIN usuario_empresa ue ON', listaUsuarios)
    const res = await request(app).get('/api/usuarios').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    for (const u of res.body) {
      expect(u).toEqual(expect.objectContaining({
        Nombre_Completo: expect.any(String), Correo: expect.any(String),   // búsqueda
        Rol: expect.any(String),                                         // filtro por rol
        Fecha_Registro: expect.any(String),                              // orden por fecha
      }))
    }
  })

  test('solo consulta usuarios de la empresa del administrador', async () => {
    db.cuando('INNER JOIN usuario_empresa ue ON', listaUsuarios)
    await request(app).get('/api/usuarios').set('Authorization', tokenAdmin)
    expect(db.paramsDe('WHERE ue."Id_Empresa" = $1')).toEqual([1])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-013 · Ver estadísticas de usuarios', () => {
  test('devuelve usuarios de los tres roles para calcular las tarjetas', async () => {
    db.cuando('INNER JOIN usuario_empresa ue ON', listaUsuarios)
    const res = await request(app).get('/api/usuarios').set('Authorization', tokenAdmin)
    const porRol = res.body.reduce((acc, u) => ({ ...acc, [u.Rol]: (acc[u.Rol] || 0) + 1 }), {})
    expect(res.body).toHaveLength(3)
    expect(porRol).toEqual({ admin: 1, operario: 1, cliente: 1 })
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-014 · Editar perfil propio del administrador', () => {
  test('el administrador consulta su propio perfil', async () => {
    db.cuando('WHERE u."Id_Usuario" = $1 AND ue."Id_Empresa" = $2', [listaUsuarios[0]])
    const res = await request(app).get('/api/usuarios/1').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(res.body.Correo).toBe('ana@demo.com')
  })

  test('el administrador cambia sus datos y su contraseña (se guarda cifrada)', async () => {
    db.cuando('SELECT u."Id_Rol", u."Estado"', [{ Id_Rol: 1, Estado: 'activo' }])
    const res = await request(app).put('/api/usuarios/1').set('Authorization', tokenAdmin).send({
      Nombre_Completo: 'Ana María Admin', Nombre_Usuario: 'ana', Correo: 'ana.maria@demo.com',
      Telefono: '+57 300 999 8888', Contrasena: 'Perfil#2026',
    })
    expect(res.status).toBe(200)
    const params = db.paramsDe('"Contrasena"=$7')
    expect(params[1]).toBe('Ana María Admin')
    expect(params[6]).toMatch(/^\$2[aby]\$/)
  })

  test('rechaza una contraseña nueva que no es segura', async () => {
    db.cuando('SELECT u."Id_Rol", u."Estado"', [{ Id_Rol: 1, Estado: 'activo' }])
    const res = await request(app).put('/api/usuarios/1').set('Authorization', tokenAdmin).send({
      Nombre_Completo: 'Ana Admin', Nombre_Usuario: 'ana', Correo: 'ana@demo.com', Contrasena: 'corta',
    })
    expect(res.status).toBe(400)
  })
})
