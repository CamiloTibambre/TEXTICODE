// ═══════════════════════════════════════════════════════════════
// MÓDULOS 9, 10 y 12 · SUPERADMIN
//   RF-048 Gestionar empresas · RF-049 Gestionar administradores
//   RF-051 Consultar estadísticas de correo
// ═══════════════════════════════════════════════════════════════
import { jest, describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import { cargarApp } from './helpers/app.js'
import { errorPg } from './helpers/dbFalsa.js'
import { iniciarSesionSuperadmin, iniciarSesionComo } from './helpers/sesiones.js'

let app, db, tokenSuper

const nuevaEmpresa = {
  empresa: { Nombre_Empresa: 'Confecciones Andinas', Slug: 'confecciones-andinas' },
  administrador: { Nombre_Completo: 'Pedro Pérez', Nombre_Usuario: 'pperez', Correo: 'pedro@andinas.com', Telefono: '3001234567', Contrasena: 'Andinas#2026' },
}

beforeAll(async () => { ({ app, db } = await cargarApp()) })
beforeEach(() => {
  db.reiniciar()
  tokenSuper = iniciarSesionSuperadmin(db)
})
afterEach(() => jest.restoreAllMocks())

// ─────────────────────────────────────────────────────────────
describe('RF-048 · Gestionar empresas', () => {
  test('crea una empresa junto con su administrador (201)', async () => {
    db.cuando(`IN ('admin', 'administrador')`, [{ Id_Rol: 1 }])
    db.cuando('INSERT INTO empresa (', [{ Id_Empresa: 5, Nombre_Empresa: 'Confecciones Andinas', Slug: 'confecciones-andinas', Estado: 'activa' }])
    db.cuando('INSERT INTO usuario (', [{ Id_Usuario: 50, Nombre_Completo: 'Pedro Pérez', Nombre_Usuario: 'pperez', Correo: 'pedro@andinas.com', Estado: 'activo' }])
    const res = await request(app).post('/api/empresas').set('Authorization', tokenSuper).send(nuevaEmpresa)

    expect(res.status).toBe(201)
    expect(res.body.empresa.Nombre_Empresa).toBe('Confecciones Andinas')
    expect(res.body.administrador).toEqual(expect.objectContaining({ Nombre_Usuario: 'pperez', Rol: 'admin' }))
    expect(db.paramsDe('INSERT INTO usuario_empresa')).toEqual([50, 5, 1]) // admin unido a su empresa
  })

  test('no permite dos empresas con el mismo nombre (409)', async () => {
    db.cuando(`lower(trim("Nombre_Empresa"))`, [{ ok: 1 }])
    const res = await request(app).post('/api/empresas').set('Authorization', tokenSuper).send(nuevaEmpresa)
    expect(res.status).toBe(409)
  })

  test('exige una contraseña segura para el administrador de la empresa', async () => {
    const res = await request(app).post('/api/empresas').set('Authorization', tokenSuper)
      .send({ ...nuevaEmpresa, administrador: { ...nuevaEmpresa.administrador, Contrasena: 'andinas' } })
    expect(res.status).toBe(400)
  })

  test('edita nombre, slug, nombre comercial y correo de respuestas', async () => {
    db.cuando('UPDATE empresa SET "Nombre_Empresa"', { rowCount: 1, rows: [] })
    db.cuando('WHERE e."Id_Empresa" = $1', [{ Id_Empresa: 5, Nombre_Empresa: 'Andinas SAS', Slug: 'andinas-sas', Nombre_Comercial: 'Andinas', Email_Notificaciones: 'respuestas@andinas.com' }])
    const res = await request(app).put('/api/empresas/5').set('Authorization', tokenSuper).send({
      Nombre_Empresa: 'Andinas SAS', Slug: 'Andinas-SAS', Nombre_Comercial: 'Andinas', Email_Notificaciones: 'respuestas@andinas.com',
    })

    expect(res.status).toBe(200)
    expect(db.paramsDe('UPDATE empresa SET "Nombre_Empresa"')).toEqual(['Andinas SAS', 'andinas-sas', '5']) // slug en minúsculas
    expect(db.paramsDe('INSERT INTO empresa_config').slice(1, 3)).toEqual(['Andinas', 'respuestas@andinas.com'])
  })

  test('rechaza un correo de respuestas inválido', async () => {
    const res = await request(app).put('/api/empresas/5').set('Authorization', tokenSuper)
      .send({ Nombre_Empresa: 'Andinas', Slug: 'andinas', Email_Notificaciones: 'esto-no-es-correo' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('El correo de notificaciones no es válido.')
  })

  test('desactiva la empresa y con ella las membresías de sus usuarios', async () => {
    db.cuando(`SET "Estado" = 'inactiva'`, { rowCount: 1, rows: [] })
    const res = await request(app).delete('/api/empresas/5').set('Authorization', tokenSuper)
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Empresa desactivada.')
    expect(db.ejecuto(`UPDATE usuario_empresa SET "Estado" = 'inactivo' WHERE "Id_Empresa"`)).toBe(true)
  })

  test('vuelve a activar la empresa', async () => {
    db.cuando(`UPDATE empresa SET "Estado" = 'activa'`, { rowCount: 1, rows: [] })
    const res = await request(app).patch('/api/empresas/5/activar').set('Authorization', tokenSuper)
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Empresa activada.')
  })

  test('lista las empresas con su estado para buscar y filtrar', async () => {
    db.cuando('FROM empresa e', [
      { Id_Empresa: 1, Nombre_Empresa: 'Demo', Slug: 'demo', Estado: 'activa' },
      { Id_Empresa: 5, Nombre_Empresa: 'Andinas', Slug: 'andinas', Estado: 'inactiva' },
    ])
    const res = await request(app).get('/api/empresas').set('Authorization', tokenSuper)
    expect(res.status).toBe(200)
    expect(res.body.map(e => e.Estado)).toEqual(['activa', 'inactiva'])
  })

  test('solo el superadmin puede gestionar empresas (403 para un admin)', async () => {
    db.reiniciar()
    const tokenAdmin = iniciarSesionComo(db, 'admin')
    db.cuando('AS "Tiene_Membresias"', [{ Id_Usuario: 1, Estado: 'activo', Rol: 'admin', Tiene_Membresias: true }])
    const res = await request(app).post('/api/empresas').set('Authorization', tokenAdmin).send(nuevaEmpresa)
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-049 · Gestionar administradores de empresa', () => {
  test('consulta los administradores de una empresa', async () => {
    db.cuando('ORDER BY u."Id_Usuario"', [{ Id_Usuario: 50, Nombre_Completo: 'Pedro Pérez', Rol: 'admin', Estado: 'activo' }])
    const res = await request(app).get('/api/empresas/5/administradores').set('Authorization', tokenSuper)
    expect(res.status).toBe(200)
    expect(res.body[0].Nombre_Completo).toBe('Pedro Pérez')
    expect(db.paramsDe('ORDER BY u."Id_Usuario"')).toEqual(['5'])
  })

  test('edita los datos de un administrador', async () => {
    db.cuando('UPDATE usuario u SET', [{ Id_Usuario: 50, Nombre_Completo: 'Pedro A. Pérez', Correo: 'pedro.a@andinas.com' }])
    const res = await request(app).put('/api/empresas/5/administradores/50').set('Authorization', tokenSuper)
      .send({ Nombre_Completo: 'Pedro A. Pérez', Nombre_Usuario: 'pperez', Correo: 'pedro.a@andinas.com' })
    expect(res.status).toBe(200)
    expect(res.body.Nombre_Completo).toBe('Pedro A. Pérez')
  })

  test('responde 404 si el usuario no es administrador de esa empresa', async () => {
    db.cuando('UPDATE usuario u SET', [])
    const res = await request(app).put('/api/empresas/5/administradores/77').set('Authorization', tokenSuper)
      .send({ Nombre_Completo: 'Otro', Nombre_Usuario: 'otro', Correo: 'otro@x.com' })
    expect(res.status).toBe(404)
  })

  test('desactiva un administrador', async () => {
    db.cuando(`UPDATE usuario_empresa ue SET "Estado" = 'inactivo'`, [{ Id_Usuario: 50 }])
    const res = await request(app).patch('/api/empresas/5/administradores/50/inactivar').set('Authorization', tokenSuper)
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Administrador desactivado.')
  })

  test('activa un administrador cuando su empresa está activa', async () => {
    db.cuando('SELECT "Estado" FROM empresa', [{ Estado: 'activa' }])
    db.cuando(`UPDATE usuario_empresa ue SET "Estado" = 'activo'`, [{ Id_Usuario: 50 }])
    const res = await request(app).patch('/api/empresas/5/administradores/50/activar').set('Authorization', tokenSuper)
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Administrador activado.')
  })

  test('no activa al administrador si la empresa está inactiva (409)', async () => {
    db.cuando('SELECT "Estado" FROM empresa', [{ Estado: 'inactiva' }])
    const res = await request(app).patch('/api/empresas/5/administradores/50/activar').set('Authorization', tokenSuper)
    expect(res.status).toBe(409)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-051 · Consultar estadísticas de correo', () => {
  const statsSendGrid = [{ stats: [{ metrics: { requests: 42, delivered: 40, opens: 18, clicks: 5, bounces: 1, spam_reports: 0 } }] }]

  test('muestra los correos del día en SendGrid y los enviados por cada empresa', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => statsSendGrid })
    db.cuando('FROM empresa e\n       LEFT JOIN email_envio', [
      { Id_Empresa: 1, Nombre_Empresa: 'Demo', enviados: 30, errores: 1 },
      { Id_Empresa: 5, Nombre_Empresa: 'Andinas', enviados: 12, errores: 0 },
    ])
    const res = await request(app).get('/api/empresas/correos/estadisticas?fecha=2026-11-08').set('Authorization', tokenSuper)

    expect(res.status).toBe(200)
    expect(res.body.fecha).toBe('2026-11-08')
    expect(res.body.global).toEqual(expect.objectContaining({ enviados: 42, entregados: 40, abiertos: 18 }))
    expect(res.body.empresas).toHaveLength(2)
    expect(res.body.empresas[1]).toEqual(expect.objectContaining({ Nombre_Empresa: 'Andinas', enviados: 12 }))
    expect(global.fetch.mock.calls[0][0]).toContain('start_date=2026-11-08')
  })

  test('si SendGrid no responde, igual muestra los envíos por empresa', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 503, text: async () => 'caído' })
    db.cuando('LEFT JOIN email_envio', [{ Id_Empresa: 1, Nombre_Empresa: 'Demo', enviados: 3, errores: 0 }])
    const res = await request(app).get('/api/empresas/correos/estadisticas?fecha=2026-11-08').set('Authorization', tokenSuper)

    expect(res.status).toBe(200)
    expect(res.body.global).toBeNull()
    expect(res.body.errorGlobal).toMatch(/SendGrid/)
    expect(res.body.empresas).toHaveLength(1)
  })

  test('rechaza una fecha con formato inválido', async () => {
    const res = await request(app).get('/api/empresas/correos/estadisticas?fecha=08/11/2026').set('Authorization', tokenSuper)
    expect(res.status).toBe(400)
  })
})
