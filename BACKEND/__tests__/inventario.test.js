// ═══════════════════════════════════════════════════════════════
// MÓDULO 4 · ADMINISTRADOR – GESTIÓN DE INVENTARIO (RF-019 a RF-023)
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { cargarApp } from './helpers/app.js'
import { errorPg } from './helpers/dbFalsa.js'
import { iniciarSesionComo } from './helpers/sesiones.js'

let app, db, tokenAdmin

const material = {
  Nombre_Material: 'Tela Oxford azul', Categoria: 'Telas', Stock_Actual: 120, Unidad: 'metros',
  Stock_Minimo: 30, Stock_Maximo: 300, Id_Cliente: 3,
}

beforeAll(async () => { ({ app, db } = await cargarApp()) })
beforeEach(() => {
  db.reiniciar()
  tokenAdmin = iniciarSesionComo(db, 'admin')
})

// ─────────────────────────────────────────────────────────────
describe('RF-019 · Registrar material', () => {
  test('registra un material con todos sus datos y cliente asociado (201)', async () => {
    db.cuando('INSERT INTO material (', [{ Id_Material: 7 }])
    const res = await request(app).post('/api/materiales').set('Authorization', tokenAdmin).send(material)

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ mensaje: 'Material creado', Id_Material: 7 })
    expect(db.paramsDe('INSERT INTO material (')).toEqual(['Tela Oxford azul', 'Telas', 120, 'metros', 30, 300, 3, 1])
  })

  test('el cliente asociado es opcional', async () => {
    db.cuando('INSERT INTO material (', [{ Id_Material: 8 }])
    const { Id_Cliente, ...sinCliente } = material
    const res = await request(app).post('/api/materiales').set('Authorization', tokenAdmin).send(sinCliente)
    expect(res.status).toBe(201)
    expect(db.paramsDe('INSERT INTO material (')[6]).toBeNull()
  })

  test('deja registrado el saldo inicial en el historial de movimientos', async () => {
    db.cuando('INSERT INTO material (', [{ Id_Material: 7 }])
    await request(app).post('/api/materiales').set('Authorization', tokenAdmin).send(material)
    expect(db.paramsDe('INSERT INTO material_movimiento')).toEqual([7, 120, 1])
  })

  test('exige nombre, categoría y unidad', async () => {
    const res = await request(app).post('/api/materiales').set('Authorization', tokenAdmin).send({ Stock_Actual: 5 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Faltan campos obligatorios')
  })

  test('no permite dos materiales con el mismo nombre (409)', async () => {
    db.cuando('INSERT INTO material (', errorPg('23505'))
    const res = await request(app).post('/api/materiales').set('Authorization', tokenAdmin).send(material)
    expect(res.status).toBe(409)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-020 · Editar material', () => {
  test('actualiza los datos del material y registra la diferencia de stock', async () => {
    db.cuando('FOR UPDATE', [{ Stock_Actual: 120 }])
    db.cuando('UPDATE material\n', { rowCount: 1, rows: [] })
    const res = await request(app).put('/api/materiales/7').set('Authorization', tokenAdmin)
      .send({ ...material, Stock_Actual: 100 })

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Material actualizado')
    const mov = db.paramsDe('INSERT INTO material_movimiento')
    expect(mov[1]).toBe('Salida')   // bajó de 120 a 100
    expect(mov[2]).toBe(-20)
  })

  test('responde 404 si el material no existe o es de otra empresa', async () => {
    db.cuando('FOR UPDATE', [])
    const res = await request(app).put('/api/materiales/999').set('Authorization', tokenAdmin).send(material)
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-021 · Eliminar material', () => {
  test('elimina el material (baja lógica: queda inactivo y con stock 0)', async () => {
    db.cuando('FOR UPDATE', [{ Stock_Actual: 50 }])
    db.cuando('SET "Activo" = false', { rowCount: 1, rows: [] })
    const res = await request(app).delete('/api/materiales/7').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Material eliminado')
    expect(db.paramsDe('INSERT INTO material_movimiento')).toEqual(['7', -50, 1])
  })

  test('responde 404 si el material ya fue eliminado', async () => {
    db.cuando('FOR UPDATE', [])
    const res = await request(app).delete('/api/materiales/7').set('Authorization', tokenAdmin)
    expect(res.status).toBe(404)
  })

  test('solo el administrador puede eliminar materiales (403 para operario)', async () => {
    const token = iniciarSesionComo(db, 'operario')
    const res = await request(app).delete('/api/materiales/7').set('Authorization', token)
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-022 · Buscar, filtrar y ordenar materiales', () => {
  test('lista los materiales activos de la empresa con los campos para buscar, filtrar y ordenar', async () => {
    db.cuando('WHERE m."Activo" = true AND m."Id_Empresa" = $1', [
      { Id_Material: 1, Nombre_Material: 'Botones', Categoria: 'Accesorios', Stock_Actual: 0, Stock_Minimo: 10, Stock_Maximo: 100, Fecha: '2026-10-01' },
      { Id_Material: 2, Nombre_Material: 'Hilo negro', Categoria: 'Hilos', Stock_Actual: 40, Stock_Minimo: 10, Stock_Maximo: 80, Fecha: '2026-10-02' },
    ])
    const res = await request(app).get('/api/materiales').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    for (const m of res.body) {
      expect(m).toEqual(expect.objectContaining({ Nombre_Material: expect.any(String), Categoria: expect.any(String), Stock_Actual: expect.any(Number), Fecha: expect.any(String) }))
    }
    expect(db.paramsDe('WHERE m."Activo" = true AND m."Id_Empresa" = $1')).toEqual([1])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-023 · Ver niveles y alertas de stock', () => {
  test('la alerta de stock bajo trae los materiales en o bajo el mínimo, con su cliente', async () => {
    db.cuando('m."Stock_Actual" <= m."Stock_Minimo"', [
      { Id_Material: 1, Nombre_Material: 'Botones', Stock_Actual: 0, Stock_Minimo: 10, Nombre_Cliente: 'Carla Cliente' },
    ])
    const res = await request(app).get('/api/materiales/alertas/stock-bajo').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body[0]).toEqual(expect.objectContaining({ Nombre_Material: 'Botones', Nombre_Cliente: 'Carla Cliente' }))
    expect(db.ejecuto('m."Stock_Actual" <= m."Stock_Minimo"')).toBe(true)
  })

  test('el cliente consulta las alertas de sus propios materiales', async () => {
    const token = iniciarSesionComo(db, 'cliente')
    db.cuando('m."Id_Cliente" = $1', [{ Id_Material: 1, Nombre_Material: 'Botones', Stock_Actual: 2, Stock_Minimo: 10 }])
    const res = await request(app).get('/api/materiales/cliente/3').set('Authorization', token)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})
