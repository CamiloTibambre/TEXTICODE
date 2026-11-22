// ═══════════════════════════════════════════════════════════════
// ROL CLIENTE · RF-066 a RF-075 — pruebas del BACKEND
// Supertest contra la API real, con BD y SendGrid simulados.
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { cargarApp } from './helpers/app.js'
import { iniciarSesionComo } from './helpers/sesiones.js'

let app, db, sendgrid, tokenCliente

const orden = {
  Id_Orden: 40, Id_Cliente: 3, Producto: 'Camisa polo', Descripcion: 'Camisa polo bordada',
  NombreMaterial: 'Tela Oxford', Cantidad: 100, Unidades_Realizadas: 40, Prioridad: 'Alta',
  Estado: 'En Proceso', Fecha_Limite: '2026-12-01', Operario: 'Oscar Operario',
}
const comprobante = {
  Id_Comprobante: 12, Id_Orden: 40, Estado: 'Entregado', Fecha_Limite: '2026-11-20',
  Orden_Producto: 'Camisa polo', Orden_Cantidad: 100, Orden_Estado: 'Completada',
  Id_Cliente: 3, Cliente: 'Carla Cliente',
}
const material = {
  Id_Material: 1, Nombre_Material: 'Tela Oxford', Categoria: 'Telas', Unidad: 'metros',
  Stock_Actual: 5, Stock_Minimo: 10, Stock_Maximo: 100, Id_Cliente: 3,
}

const esperar = async (cond, ms = 1000) => {
  const fin = Date.now() + ms
  while (Date.now() < fin) { if (cond()) return true; await new Promise(r => setTimeout(r, 20)) }
  return cond()
}

beforeAll(async () => { ({ app, db, sendgrid } = await cargarApp()) })
beforeEach(() => {
  db.reiniciar()
  sendgrid.send.mockClear()
  tokenCliente = iniciarSesionComo(db, 'cliente')
})

describe('RF-066 · Listado de pedidos', () => {
  test('RF-066 B01 devuelve las órdenes del cliente autenticado con sus datos', async () => {
    db.cuando('WHERE op."Id_Cliente" = $1 AND op."Id_Empresa" = $2', [orden])
    const res = await request(app).get('/api/ordenes/cliente/3').set('Authorization', tokenCliente)

    expect(res.status).toBe(200)
    expect(res.body[0]).toEqual(expect.objectContaining({
      Producto: 'Camisa polo', NombreMaterial: 'Tela Oxford', Cantidad: 100,
      Fecha_Limite: expect.any(String), Prioridad: 'Alta', Estado: 'En Proceso',
    }))
    expect(db.paramsDe('WHERE op."Id_Cliente" = $1 AND op."Id_Empresa" = $2')).toEqual(['3', 1])
  })

  test('RF-066 B02 un cliente no puede consultar las órdenes de otro cliente (403)', async () => {
    const res = await request(app).get('/api/ordenes/cliente/8').set('Authorization', tokenCliente)
    expect(res.status).toBe(403)
    expect(db.ejecuto('WHERE op."Id_Cliente" = $1')).toBe(false)
  })

  test('RF-066 B03 rechaza la petición sin sesión (401)', async () => {
    const res = await request(app).get('/api/ordenes/cliente/3')
    expect(res.status).toBe(401)
  })

  test('RF-066 B04 el cliente no puede abrir el listado general de órdenes (403)', async () => {
    const res = await request(app).get('/api/ordenes').set('Authorization', tokenCliente)
    expect(res.status).toBe(403)
  })

  test('RF-066 B05 el cliente ve el detalle de su orden, pero no el de otro cliente', async () => {
    db.cuando('WHERE op."Id_Orden" = $1 AND op."Id_Empresa" = $2', [orden])
    const propia = await request(app).get('/api/ordenes/40').set('Authorization', tokenCliente)
    expect(propia.status).toBe(200)

    db.cuando('WHERE op."Id_Orden" = $1 AND op."Id_Empresa" = $2', [{ ...orden, Id_Cliente: 8, Id_Operario: null }])
    const ajena = await request(app).get('/api/ordenes/40').set('Authorization', tokenCliente)
    expect(ajena.status).toBe(403)
  })
})

describe('RF-070 · Comprobante', () => {
  test('RF-070 B01 devuelve el comprobante de una orden propia con los datos del PDF', async () => {
    db.cuando('WHERE c."Id_Comprobante" = $1', [comprobante])
    const res = await request(app).get('/api/comprobantes/12').set('Authorization', tokenCliente)

    expect(res.status).toBe(200)
    for (const campo of ['Id_Comprobante', 'Cliente', 'Orden_Producto', 'Orden_Cantidad', 'Estado', 'Fecha_Limite']) {
      expect(res.body[campo]).toBeDefined()
    }
  })

  test('RF-070 B02 impide ver el comprobante de otro cliente (403)', async () => {
    db.cuando('WHERE c."Id_Comprobante" = $1', [{ ...comprobante, Id_Cliente: 8 }])
    const res = await request(app).get('/api/comprobantes/12').set('Authorization', tokenCliente)
    expect(res.status).toBe(403)
  })

  test('RF-070 B03 lista los comprobantes propios y bloquea los de otro cliente', async () => {
    db.cuando('WHERE op."Id_Cliente" = $1', [comprobante])
    const propios = await request(app).get('/api/comprobantes/cliente/3').set('Authorization', tokenCliente)
    expect(propios.status).toBe(200)
    expect(db.paramsDe('WHERE op."Id_Cliente" = $1')).toEqual(['3', 1])

    const ajenos = await request(app).get('/api/comprobantes/cliente/8').set('Authorization', tokenCliente)
    expect(ajenos.status).toBe(403)
  })

  test('RF-070 B04 comprobante inexistente o de otra empresa responde 404', async () => {
    db.cuando('WHERE c."Id_Comprobante" = $1', [])
    const res = await request(app).get('/api/comprobantes/999').set('Authorization', tokenCliente)
    expect(res.status).toBe(404)
  })

  test('RF-070 B05 el cliente no puede ver el listado general de comprobantes (403)', async () => {
    const res = await request(app).get('/api/comprobantes').set('Authorization', tokenCliente)
    expect(res.status).toBe(403)
  })
})

describe('RF-071 · Notificación por correo', () => {
  function prepararCompletarFase(estadoPrevio) {
    db.cuando('SELECT oo.*, op."Cantidad"', [{ Id_Orden_Operario: 10, Id_Orden: 40, Id_Operario: 2, Numero_Fase: 1, Cantidad: 10 }])
    db.cuando('ORDER BY "Id_Orden_Operario" ASC', [{ Id_Orden_Operario: 10 }])
    db.cuando('SELECT "Estado" FROM orden_produccion', [{ Estado: estadoPrevio }])
    db.cuando('"Vencida"', [{ Cantidad: 10, Vencida: false }])
    db.cuando('WITH base AS', [{ Total_Fases: 1, Progreso: 1, Avance_Min: 1 }])
    db.cuando('SELECT u."Correo", u."Nombre_Completo"', [{ Correo: 'carla@demo.com', Nombre_Completo: 'Carla Cliente', Productos: 'Camisa polo' }])
  }

  test('RF-071 B01 al completarse la orden se envía el correo al cliente', async () => {
    prepararCompletarFase('En Proceso')
    const token = iniciarSesionComo(db, 'operario')
    const res = await request(app).patch('/api/orden-operario/10/completar').set('Authorization', token).send({})

    expect(res.status).toBe(200)
    expect(res.body.orden.estado).toBe('Completada')
    expect(await esperar(() => sendgrid.send.mock.calls.length > 0)).toBe(true)
    const correo = sendgrid.send.mock.calls[0][0]
    expect(correo.to.email).toBe('carla@demo.com')
    expect(correo.subject).toMatch(/Orden #40/)
    expect(db.ejecuto('INSERT INTO email_envio')).toBe(true)
  })

  test('RF-071 B02 no reenvía el correo si la orden ya estaba completada', async () => {
    prepararCompletarFase('Completada')
    const token = iniciarSesionComo(db, 'operario')
    const res = await request(app).patch('/api/orden-operario/10/completar').set('Authorization', token).send({})

    expect(res.status).toBe(200)
    await new Promise(r => setTimeout(r, 150))
    expect(sendgrid.send).not.toHaveBeenCalled()
  })

  test('RF-071 B03 el cliente no puede disparar notificaciones por la API (403)', async () => {
    const res = await request(app).post('/api/notificaciones/estado').set('Authorization', tokenCliente)
      .send({ ordenId: 40, estado: 'Completada', productos: 'Camisa polo' })
    expect(res.status).toBe(403)
    expect(sendgrid.send).not.toHaveBeenCalled()
  })
})

describe('RF-072 · Alertas de materiales', () => {
  test('RF-072 B01 devuelve solo los materiales del cliente autenticado', async () => {
    db.cuando('m."Id_Cliente" = $1', [material])
    const res = await request(app).get('/api/materiales/cliente/3').set('Authorization', tokenCliente)

    expect(res.status).toBe(200)
    expect(res.body[0]).toEqual(expect.objectContaining({
      Nombre_Material: 'Tela Oxford', Stock_Actual: 5, Stock_Minimo: 10, Stock_Maximo: 100,
    }))
    expect(db.paramsDe('m."Id_Cliente" = $1')).toEqual(['3', 1])
  })

  test('RF-072 B02 un cliente no puede consultar los materiales de otro cliente (403)', async () => {
    const res = await request(app).get('/api/materiales/cliente/8').set('Authorization', tokenCliente)
    expect(res.status).toBe(403)
  })

  test('RF-072 B03 no puede abrir el material de otro cliente por id (403)', async () => {
    db.cuando('WHERE m."Id_Material" = $1 AND m."Id_Empresa" = $2', [{ ...material, Id_Cliente: 8 }])
    const res = await request(app).get('/api/materiales/1').set('Authorization', tokenCliente)
    expect(res.status).toBe(403)
  })

  test('RF-072 B04 el cliente no accede al inventario ni a las alertas del administrador (403)', async () => {
    const inventario = await request(app).get('/api/materiales').set('Authorization', tokenCliente)
    const alertas = await request(app).get('/api/materiales/alertas/stock-bajo').set('Authorization', tokenCliente)
    expect(inventario.status).toBe(403)
    expect(alertas.status).toBe(403)
  })
})
