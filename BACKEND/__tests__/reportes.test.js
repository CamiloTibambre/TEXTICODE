// ═══════════════════════════════════════════════════════════════
// MÓDULO 7 · ADMINISTRADOR – REPORTES (RF-041 a RF-043)
// Integrante: Andrés Lancheros
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { cargarApp } from './helpers/app.js'
import { iniciarSesionComo } from './helpers/sesiones.js'

let app, db, tokenAdmin

beforeAll(async () => { ({ app, db } = await cargarApp()) })
beforeEach(() => {
  db.reiniciar()
  tokenAdmin = iniciarSesionComo(db, 'admin')
})

// ─────────────────────────────────────────────────────────────
describe('RF-041 · Ver indicadores de pedidos', () => {
  test('entrega todas las órdenes de la empresa con su estado y fecha límite para los indicadores y el gráfico', async () => {
    db.cuando('ORDER BY op."Fecha_Limite" ASC', [
      { Id_Orden: 1, Estado: 'Completada', Fecha_Limite: '2026-10-15T00:00:00.000Z' },
      { Id_Orden: 2, Estado: 'En Proceso', Fecha_Limite: '2026-11-15T00:00:00.000Z' },
    ])
    const res = await request(app).get('/api/ordenes').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    for (const o of res.body) expect(o).toEqual(expect.objectContaining({ Estado: expect.any(String), Fecha_Limite: expect.any(String) }))
    expect(db.paramsDe('ORDER BY op."Fecha_Limite" ASC')).toEqual([1])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-042 · Listar reportes por tipo y período', () => {
  test('reconstruye el inventario de un mes desde el historial de movimientos', async () => {
    db.cuando('INNER JOIN material_movimiento mv', [
      { Id_Material: 1, Nombre_Material: 'Tela Oxford azul', Categoria: 'Telas', Unidad: 'metros', Stock_Actual: '90', Nombre_Cliente: 'Carla Cliente' },
    ])
    const res = await request(app).get('/api/materiales/reportes/historial?periodo=2026-10').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body[0]).toEqual(expect.objectContaining({ Nombre_Material: 'Tela Oxford azul', Stock_Actual: '90' }))
    expect(db.paramsDe('INNER JOIN material_movimiento mv')).toEqual(['2026-10-01', 1])        // hasta el final de octubre
    expect(db.consultas.find(c => c.sql.includes('material_movimiento mv')).sql).toContain('SUM(mv."Cantidad")')
  })

  test('rechaza un período con formato distinto de AAAA-MM', async () => {
    const res = await request(app).get('/api/materiales/reportes/historial?periodo=octubre').set('Authorization', tokenAdmin)
    expect(res.status).toBe(400)
  })

  test('la eficiencia operaria se puede pedir por mes', async () => {
    db.cuando('$1::date IS NULL', [])
    const res = await request(app).get('/api/eficiencia/operarios?periodo=2026-10').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(res.body.filtros_aplicados.periodo).toBe('2026-10')
    expect(db.paramsDe('$1::date IS NULL')).toEqual(['2026-10-01', 1])
  })

  test('rechaza un mes con formato inválido en la eficiencia', async () => {
    const res = await request(app).get('/api/eficiencia/operarios?periodo=10-2026').set('Authorization', tokenAdmin)
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-043 · Visualizar y exportar reportes', () => {
  // El PDF y el Excel se generan en el navegador (se prueba en el FRONTEND).
  // Aquí se comprueba que solo el administrador obtiene los datos que se exportan.
  test.each([
    ['pedidos', '/api/ordenes'],
    ['eficiencia', '/api/eficiencia/operarios'],
    ['inventario por mes', '/api/materiales/reportes/historial?periodo=2026-10'],
  ])('un operario no puede obtener los datos del reporte de %s (403)', async (_, ruta) => {
    const token = iniciarSesionComo(db, 'operario')
    const res = await request(app).get(ruta).set('Authorization', token)
    expect(res.status).toBe(403)
  })
})
