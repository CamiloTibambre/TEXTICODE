// ═══════════════════════════════════════════════════════════════
// MÓDULO 5 · ADMINISTRADOR – GESTIÓN DE PRODUCCIÓN (RF-024 a RF-034)
// Integrante: Andrés Lancheros
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { cargarApp } from './helpers/app.js'
import { errorPg } from './helpers/dbFalsa.js'
import { iniciarSesionComo } from './helpers/sesiones.js'

let app, db, sendgrid, tokenAdmin

const nuevaOrden = {
  Id_Cliente: 3, Id_Material: 1, Producto: 'Camisa polo', Descripcion: 'Camisa polo bordada',
  Cantidad: 150, Prioridad: 'Alta', Dificultad: 'Alta', Fecha_Limite: '2099-12-20', Estado: 'En Proceso',
}
const ordenBD = {
  Id_Orden: 40, Id_Cliente: 3, Cliente: 'Carla Cliente', Id_Material: 1, NombreMaterial: 'Tela Oxford azul',
  Producto: 'Camisa polo', Descripcion: 'Camisa polo bordada', Cantidad: 150, Unidades_Realizadas: 60,
  Prioridad: 'Alta', Dificultad: 'Alta', Estado: 'En Proceso', Fecha_Limite: '2099-12-20T00:00:00.000Z',
  Fecha_Creacion: '2026-11-01T00:00:00.000Z',
}

beforeAll(async () => { ({ app, db, sendgrid } = await cargarApp()) })
beforeEach(() => {
  db.reiniciar()
  sendgrid.send.mockClear()
  tokenAdmin = iniciarSesionComo(db, 'admin')
})

// ─────────────────────────────────────────────────────────────
describe('RF-024 · Crear orden de producción', () => {
  test('registra la orden con cliente, material, producto, descripción, cantidad, prioridad, dificultad y fecha límite (201)', async () => {
    db.cuando('INSERT INTO orden_produccion', [{ Id_Orden: 40 }])
    const res = await request(app).post('/api/ordenes').set('Authorization', tokenAdmin).send(nuevaOrden)

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ mensaje: 'Orden creada', Id_Orden: 40 })
    expect(db.paramsDe('INSERT INTO orden_produccion')).toEqual(
      [3, 1, null, 'Camisa polo', 'Camisa polo bordada', 150, 'Alta', '2099-12-20', 'En Proceso', 'Alta', 1])
  })

  test('asocia materiales con su cantidad a la orden', async () => {
    db.cuando('FOR UPDATE', [{ Stock_Actual: 120 }])
    const res = await request(app).post('/api/orden-material').set('Authorization', tokenAdmin)
      .send({ Id_Orden: 40, Id_Producto: 1, Cantidad_Usada: 30 })
    expect(res.status).toBe(201)
    expect(db.paramsDe('INSERT INTO orden_material')).toEqual([40, 1, 30, 1])
  })

  test('exige cliente, material, descripción, cantidad y fecha límite', async () => {
    const { Descripcion, ...incompleta } = nuevaOrden
    const res = await request(app).post('/api/ordenes').set('Authorization', tokenAdmin).send(incompleta)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Faltan campos obligatorios')
  })

  test('si la fecha límite ya pasó, la orden nace como "Retrasada"', async () => {
    db.cuando('INSERT INTO orden_produccion', [{ Id_Orden: 41 }])
    await request(app).post('/api/ordenes').set('Authorization', tokenAdmin).send({ ...nuevaOrden, Fecha_Limite: '2020-01-10' })
    expect(db.paramsDe('INSERT INTO orden_produccion')[8]).toBe('Retrasada')
  })

  test('rechaza un cliente o material que no es de la empresa (400)', async () => {
    db.cuando('INSERT INTO orden_produccion', errorPg('23503'))
    const res = await request(app).post('/api/ordenes').set('Authorization', tokenAdmin).send(nuevaOrden)
    expect(res.status).toBe(400)
  })

  test('solo el administrador crea órdenes (403 para operario)', async () => {
    const token = iniciarSesionComo(db, 'operario')
    const res = await request(app).post('/api/ordenes').set('Authorization', token).send(nuevaOrden)
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-025 · Editar orden de producción', () => {
  test.each(['En Proceso', 'Completada', 'Retrasada'])('cambia los datos y el estado a "%s"', async (estado) => {
    db.cuando('UPDATE orden_produccion\n      SET "Id_Cliente"', { rowCount: 1, rows: [] })
    const res = await request(app).put('/api/ordenes/40').set('Authorization', tokenAdmin)
      .send({ ...nuevaOrden, Cantidad: 200, Estado: estado })

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Orden actualizada')
    const p = db.paramsDe('UPDATE orden_produccion\n      SET "Id_Cliente"')
    expect(p[5]).toBe(200)
    expect(p[8]).toBe(estado)
  })

  test('responde 404 si la orden no existe o es de otra empresa', async () => {
    db.cuando('UPDATE orden_produccion\n      SET "Id_Cliente"', { rowCount: 0, rows: [] })
    const res = await request(app).put('/api/ordenes/999').set('Authorization', tokenAdmin).send(nuevaOrden)
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-026 · Eliminar orden de producción', () => {
  test('elimina la orden de la empresa', async () => {
    db.cuando('DELETE FROM orden_produccion', { rowCount: 1, rows: [] })
    const res = await request(app).delete('/api/ordenes/40').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Orden eliminada')
    expect(db.paramsDe('DELETE FROM orden_produccion')).toEqual(['40', 1])
  })

  test('responde 404 si la orden no existe', async () => {
    db.cuando('DELETE FROM orden_produccion', { rowCount: 0, rows: [] })
    const res = await request(app).delete('/api/ordenes/999').set('Authorization', tokenAdmin)
    expect(res.status).toBe(404)
  })

  test('avisa si la orden tiene registros asociados que impiden borrarla (409)', async () => {
    db.cuando('DELETE FROM orden_produccion', errorPg('23503'))
    const res = await request(app).delete('/api/ordenes/40').set('Authorization', tokenAdmin)
    expect(res.status).toBe(409)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-027 · Ver detalle de la orden', () => {
  test('entrega cliente, material principal, dificultad, fechas, descripción y avance', async () => {
    db.cuando('WHERE op."Id_Orden" = $1 AND op."Id_Empresa" = $2', [ordenBD])
    const res = await request(app).get('/api/ordenes/40').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(expect.objectContaining({
      Cliente: 'Carla Cliente', NombreMaterial: 'Tela Oxford azul', Dificultad: 'Alta',
      Fecha_Creacion: expect.any(String), Fecha_Limite: expect.any(String), Descripcion: 'Camisa polo bordada',
      Cantidad: 150, Unidades_Realizadas: 60,
    }))
  })

  test('entrega las fases con su operario responsable', async () => {
    db.cuando('ORDER BY oo."Numero_Fase" ASC', [
      { Id_Orden_Operario: 1, Numero_Fase: 1, Descripcion_Fase: 'Corte', Nombre_Operario: 'Oscar Operario', Estado_Fase: 'Completada' },
      { Id_Orden_Operario: 2, Numero_Fase: 2, Descripcion_Fase: 'Costura', Nombre_Operario: 'Olga Operaria', Estado_Fase: 'Pendiente' },
    ])
    const res = await request(app).get('/api/orden-operario/orden/40').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(res.body.map(f => `${f.Numero_Fase}-${f.Descripcion_Fase}-${f.Nombre_Operario}`)).toEqual(['1-Corte-Oscar Operario', '2-Costura-Olga Operaria'])
  })

  test('entrega los materiales de la orden con su cantidad', async () => {
    db.cuando('FROM orden_material om', [{ Id_Producto: 1, Nombre_Material: 'Tela Oxford azul', Cantidad_Usada: 30, Unidad: 'metros' }])
    const res = await request(app).get('/api/orden-material/orden/40').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(res.body[0]).toEqual(expect.objectContaining({ Nombre_Material: 'Tela Oxford azul', Cantidad_Usada: 30 }))
  })

  test('responde 404 si la orden no existe', async () => {
    db.cuando('WHERE op."Id_Orden" = $1 AND op."Id_Empresa" = $2', [])
    const res = await request(app).get('/api/ordenes/999').set('Authorization', tokenAdmin)
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-028 · Ver tareas asignadas a operarios', () => {
  test('el listado trae número, producto, cliente, estado, prioridad, fecha límite, cantidad y avance', async () => {
    db.cuando('ORDER BY op."Fecha_Limite" ASC', [ordenBD])
    const res = await request(app).get('/api/ordenes').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(res.body[0]).toEqual(expect.objectContaining({
      Id_Orden: 40, Producto: 'Camisa polo', Cliente: 'Carla Cliente', Estado: 'En Proceso',
      Prioridad: 'Alta', Fecha_Limite: expect.any(String), Cantidad: 150, Unidades_Realizadas: 60,
    }))
  })

  test('un operario no puede ver el listado general de órdenes (403)', async () => {
    const token = iniciarSesionComo(db, 'operario')
    const res = await request(app).get('/api/ordenes').set('Authorization', token)
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-029 · Filtrar órdenes', () => {
  test('el listado sale ordenado por fecha límite y solo de la empresa', async () => {
    db.cuando('ORDER BY op."Fecha_Limite" ASC', [])
    await request(app).get('/api/ordenes').set('Authorization', tokenAdmin)
    expect(db.paramsDe('ORDER BY op."Fecha_Limite" ASC')).toEqual([1])
  })

  test('filtra por estado válido', async () => {
    db.cuando('WHERE op."Estado" = $1 AND op."Id_Empresa" = $2', [{ ...ordenBD, Estado: 'Completada' }])
    const res = await request(app).get('/api/ordenes/estado/Completada').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(db.paramsDe('WHERE op."Estado" = $1 AND op."Id_Empresa" = $2')).toEqual(['Completada', 1])
  })

  test('rechaza un estado inexistente', async () => {
    const res = await request(app).get('/api/ordenes/estado/Pausada').set('Authorization', tokenAdmin)
    expect(res.status).toBe(400)
  })

  test('filtra por cliente', async () => {
    db.cuando('WHERE op."Id_Cliente" = $1 AND op."Id_Empresa" = $2', [ordenBD])
    const res = await request(app).get('/api/ordenes/cliente/3').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(db.paramsDe('WHERE op."Id_Cliente" = $1 AND op."Id_Empresa" = $2')).toEqual(['3', 1])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-030 · Asignar operarios por fases', () => {
  test('agrega una fase numerada con descripción y operario responsable (201)', async () => {
    db.cuando('INSERT INTO orden_operario', [{ Id_Orden_Operario: 9, Id_Orden: 40, Id_Operario: 2, Numero_Fase: 1, Descripcion_Fase: 'Corte' }])
    db.cuando('SELECT "Cantidad", ("Fecha_Limite"', [{ Cantidad: 150, Vencida: false }])
    db.cuando('WITH base AS', [{ Total_Fases: 1, Progreso: 0, Avance_Min: 0 }])
    const res = await request(app).post('/api/orden-operario').set('Authorization', tokenAdmin)
      .send({ Id_Orden: 40, Id_Operario: 2, Numero_Fase: 1, Descripcion_Fase: 'Corte' })

    expect(res.status).toBe(201)
    expect(db.paramsDe('INSERT INTO orden_operario')).toEqual([40, 2, 1, 'Corte', 1])
  })

  test('exige orden, operario y número de fase válidos', async () => {
    const res = await request(app).post('/api/orden-operario').set('Authorization', tokenAdmin)
      .send({ Id_Orden: 40, Numero_Fase: 0 })
    expect(res.status).toBe(400)
  })

  test('no repite el mismo operario en la misma fase (409)', async () => {
    db.cuando('INSERT INTO orden_operario', errorPg('23505'))
    const res = await request(app).post('/api/orden-operario').set('Authorization', tokenAdmin)
      .send({ Id_Orden: 40, Id_Operario: 2, Numero_Fase: 1 })
    expect(res.status).toBe(409)
  })

  test('quita una fase y recalcula el avance de la orden', async () => {
    db.cuando('DELETE FROM orden_operario', [{ Id_Orden: 40 }])
    db.cuando('SELECT "Cantidad", ("Fecha_Limite"', [{ Cantidad: 150, Vencida: false }])
    db.cuando('WITH base AS', [{ Total_Fases: 0, Progreso: 0, Avance_Min: 0 }])
    const res = await request(app).delete('/api/orden-operario/9').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(db.ejecuto('SET "Unidades_Realizadas" = $1, "Estado" = $2')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-031 · Validar stock al asignar materiales', () => {
  test('no deja asignar más cantidad de la disponible y no descuenta nada', async () => {
    db.cuando('FOR UPDATE', [{ Stock_Actual: 20 }])
    const res = await request(app).post('/api/orden-material').set('Authorization', tokenAdmin)
      .send({ Id_Orden: 40, Id_Producto: 1, Cantidad_Usada: 25 })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Stock insuficiente: hay 20 y se necesitan 25')
    expect(db.ejecuto('INSERT INTO orden_material')).toBe(false)
    expect(db.ejecuto('ROLLBACK')).toBe(true)
  })

  test('con stock suficiente descuenta el inventario y registra la salida', async () => {
    db.cuando('FOR UPDATE', [{ Stock_Actual: 120 }])
    await request(app).post('/api/orden-material').set('Authorization', tokenAdmin).send({ Id_Orden: 40, Id_Producto: 1, Cantidad_Usada: 30 })
    expect(db.paramsDe('UPDATE material SET "Stock_Actual" = "Stock_Actual" - $1')).toEqual([30, 1, 1])
    expect(db.paramsDe('INSERT INTO material_movimiento')).toEqual([1, -30, 40, 1])
  })

  test('al editar, solo exige stock para lo que aumenta (lo ya reservado cuenta como disponible)', async () => {
    db.cuando('SELECT "Cantidad_Usada" FROM orden_material', [{ Cantidad_Usada: 30 }])
    db.cuando('SELECT "Stock_Actual" FROM material', [{ Stock_Actual: 5 }])
    db.cuando('UPDATE orden_material SET', { rowCount: 1, rows: [] })
    // la orden tenía 30 reservados; pasa a 35 → solo necesita 5 más, y hay 5
    const res = await request(app).put('/api/orden-material/40/1').set('Authorization', tokenAdmin).send({ Cantidad_Usada: 35 })
    expect(res.status).toBe(200)
    expect(db.paramsDe('UPDATE material SET "Stock_Actual" = "Stock_Actual" - $1')[0]).toBe(5)
  })

  test('al editar, rechaza el aumento si no alcanza el stock', async () => {
    db.cuando('SELECT "Cantidad_Usada" FROM orden_material', [{ Cantidad_Usada: 30 }])
    db.cuando('SELECT "Stock_Actual" FROM material', [{ Stock_Actual: 4 }])
    const res = await request(app).put('/api/orden-material/40/1').set('Authorization', tokenAdmin).send({ Cantidad_Usada: 35 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Stock insuficiente/)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-032 · Generar comprobante al crear la orden', () => {
  test('crea el comprobante de la orden en estado Pendiente (201)', async () => {
    db.cuando('SELECT "Id_Comprobante" FROM comprobantes', [])
    db.cuando('INSERT INTO comprobantes', [{ Id_Comprobante: 77 }])
    const res = await request(app).post('/api/comprobantes').set('Authorization', tokenAdmin)
      .send({ Id_Usuario: 1, Id_Orden: 40, Fecha_Limite: '2099-12-20' })

    expect(res.status).toBe(201)
    expect(res.body.Id_Comprobante).toBe(77)
    expect(db.paramsDe('INSERT INTO comprobantes')).toEqual([1, 40, 'Pendiente', '2099-12-20', 1])
  })

  test('no duplica el comprobante si la orden ya tiene uno', async () => {
    db.cuando('SELECT "Id_Comprobante" FROM comprobantes', [{ Id_Comprobante: 77 }])
    const res = await request(app).post('/api/comprobantes').set('Authorization', tokenAdmin).send({ Id_Usuario: 1, Id_Orden: 40 })
    expect(res.status).toBe(200)
    expect(db.ejecuto('INSERT INTO comprobantes')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-033 · Notificar la tarea al operario por correo', () => {
  const tarea = { operarioEmail: 'oscar@demo.com', tarea: 'F1 — Corte', ordenId: 40, prioridad: 'Alta', fechaLimite: '2099-12-20' }

  test('envía al operario un correo con la tarea, la prioridad y la fecha límite', async () => {
    db.cuando('SELECT 1 FROM orden_produccion', [{ '?column?': 1 }])
    db.cuando('WHERE lower(trim(u."Correo")) = lower(trim($1))', [{ Correo: 'oscar@demo.com', Nombre_Completo: 'Oscar Operario' }])
    const res = await request(app).post('/api/notificaciones/tarea').set('Authorization', tokenAdmin).send(tarea)

    expect(res.status).toBe(200)
    expect(sendgrid.send).toHaveBeenCalledTimes(1)
    const correo = sendgrid.send.mock.calls[0][0]
    expect(correo.to).toEqual({ email: 'oscar@demo.com', name: 'Oscar Operario' })
    expect(correo.subject).toContain('Nueva tarea asignada')
    for (const dato of ['F1 — Corte', '#40', 'Alta', '2099-12-20']) expect(correo.html).toContain(dato)
  })

  test('no envía correos a personas que no son de la empresa (404)', async () => {
    db.cuando('SELECT 1 FROM orden_produccion', [{ '?column?': 1 }])
    db.cuando('WHERE lower(trim(u."Correo")) = lower(trim($1))', [])
    const res = await request(app).post('/api/notificaciones/tarea').set('Authorization', tokenAdmin).send({ ...tarea, operarioEmail: 'externo@gmail.com' })
    expect(res.status).toBe(404)
    expect(sendgrid.send).not.toHaveBeenCalled()
  })

  test('exige correo del operario, tarea y orden', async () => {
    const res = await request(app).post('/api/notificaciones/tarea').set('Authorization', tokenAdmin).send({ tarea: 'Corte' })
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-034 · Ver estadísticas de producción', () => {
  test('antes de listar, marca como Retrasadas las órdenes vencidas (para que las tarjetas cuenten bien)', async () => {
    db.cuando('ORDER BY op."Fecha_Limite" ASC', [])
    await request(app).get('/api/ordenes').set('Authorization', tokenAdmin)
    const i = db.consultas.findIndex(c => c.sql.includes(`SET "Estado" = 'Retrasada'`))
    const j = db.consultas.findIndex(c => c.sql.includes('ORDER BY op."Fecha_Limite" ASC'))
    expect(i).toBeGreaterThanOrEqual(0)
    expect(i).toBeLessThan(j)
  })

  test('entrega el estado de cada orden para contar en proceso, completadas y retrasadas', async () => {
    db.cuando('ORDER BY op."Fecha_Limite" ASC', [
      { ...ordenBD, Id_Orden: 1, Estado: 'En Proceso' }, { ...ordenBD, Id_Orden: 2, Estado: 'Completada' },
      { ...ordenBD, Id_Orden: 3, Estado: 'Retrasada' }, { ...ordenBD, Id_Orden: 4, Estado: 'Completada' },
    ])
    const res = await request(app).get('/api/ordenes').set('Authorization', tokenAdmin)
    const conteo = res.body.reduce((a, o) => ({ ...a, [o.Estado]: (a[o.Estado] || 0) + 1 }), {})
    expect(conteo).toEqual({ 'En Proceso': 1, Completada: 2, Retrasada: 1 })
  })
})
