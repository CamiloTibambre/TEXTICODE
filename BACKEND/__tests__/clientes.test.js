// ═══════════════════════════════════════════════════════════════
// MÓDULO 3 · ADMINISTRADOR – GESTIÓN DE CLIENTES (RF-015 a RF-018)
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { cargarApp } from './helpers/app.js'
import { iniciarSesionComo } from './helpers/sesiones.js'

let app, db, tokenAdmin

const comprobante = {
  Id_Comprobante: 12, Id_Orden: 40, Estado: 'Entregado', Fecha_Limite: '2026-11-20T00:00:00.000Z',
  Usuario: 'Ana Admin', Orden_Producto: 'Camisa polo', Orden_Descripcion: 'Camisa polo bordada',
  Orden_Estado: 'Completada', Orden_Cantidad: 150, Id_Cliente: 3, Cliente: 'Carla Cliente',
}

beforeAll(async () => { ({ app, db } = await cargarApp()) })
beforeEach(() => {
  db.reiniciar()
  tokenAdmin = iniciarSesionComo(db, 'admin')
})

// ─────────────────────────────────────────────────────────────
describe('RF-015 · Consultar listado de clientes', () => {
  test('entrega los clientes con nombre, correo, teléfono y estado', async () => {
    db.cuando('INNER JOIN usuario_empresa ue ON', [
      { Id_Usuario: 3, Nombre_Completo: 'Carla Cliente', Correo: 'carla@demo.com', Telefono: '+57 300 111 2222', Rol: 'cliente', Estado: 'activo' },
      { Id_Usuario: 4, Nombre_Completo: 'Bruno Cliente', Correo: 'bruno@demo.com', Telefono: '+57 300 333 4444', Rol: 'cliente', Estado: 'inactivo' },
    ])
    const res = await request(app).get('/api/usuarios').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    const activos = res.body.filter(u => u.Rol === 'cliente' && u.Estado === 'activo')
    expect(activos).toHaveLength(1)
    expect(activos[0]).toEqual(expect.objectContaining({ Nombre_Completo: 'Carla Cliente', Correo: 'carla@demo.com', Telefono: '+57 300 111 2222' }))
  })

  test('un cliente no puede ver el listado de clientes del administrador (403)', async () => {
    const token = iniciarSesionComo(db, 'cliente')
    const res = await request(app).get('/api/usuarios').set('Authorization', token)
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-016 · Consultar comprobantes por cliente', () => {
  test('devuelve los comprobantes del cliente con número, fecha y estado', async () => {
    db.cuando('WHERE op."Id_Cliente" = $1', [comprobante])
    const res = await request(app).get('/api/comprobantes/cliente/3').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body[0]).toEqual(expect.objectContaining({ Id_Comprobante: 12, Fecha_Limite: expect.any(String), Estado: 'Entregado' }))
    expect(db.paramsDe('WHERE op."Id_Cliente" = $1')).toEqual(['3', 1]) // cliente 3 de la empresa 1
  })

  test('un cliente no puede consultar los comprobantes de otro cliente (403)', async () => {
    const token = iniciarSesionComo(db, 'cliente')          // el cliente en sesión es el 3
    const res = await request(app).get('/api/comprobantes/cliente/8').set('Authorization', token)
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-017 · Ver detalle del comprobante', () => {
  test('entrega todos los datos del formato oficial (cliente, fecha, producto, cantidad y estado)', async () => {
    db.cuando('WHERE c."Id_Comprobante" = $1', [comprobante])
    const res = await request(app).get('/api/comprobantes/12').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(expect.objectContaining({
      Cliente: 'Carla Cliente', Fecha_Limite: expect.any(String), Orden_Producto: 'Camisa polo',
      Orden_Cantidad: 150, Orden_Estado: 'Completada', Orden_Descripcion: 'Camisa polo bordada',
    }))
  })

  test('responde 404 si el comprobante no existe o es de otra empresa', async () => {
    db.cuando('WHERE c."Id_Comprobante" = $1', [])
    const res = await request(app).get('/api/comprobantes/999').set('Authorization', tokenAdmin)
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-018 · Descargar comprobante en PDF', () => {
  test('el comprobante trae los datos que se imprimen en el PDF', async () => {
    // El PDF se genera en el navegador con jsPDF (se prueba en el FRONTEND).
    // El backend debe entregar completos los datos que van impresos.
    db.cuando('WHERE c."Id_Comprobante" = $1', [comprobante])
    const res = await request(app).get('/api/comprobantes/12').set('Authorization', tokenAdmin)
    for (const campo of ['Id_Comprobante', 'Cliente', 'Orden_Producto', 'Orden_Cantidad', 'Estado', 'Fecha_Limite']) {
      expect(res.body[campo]).toBeDefined()
    }
  })

  test('el cliente dueño también puede obtener su comprobante para descargarlo', async () => {
    const token = iniciarSesionComo(db, 'cliente')
    db.cuando('WHERE c."Id_Comprobante" = $1', [comprobante]) // Id_Cliente 3 = cliente en sesión
    const res = await request(app).get('/api/comprobantes/12').set('Authorization', token)
    expect(res.status).toBe(200)
  })

  test('un cliente no puede descargar el comprobante de otro cliente (403)', async () => {
    const token = iniciarSesionComo(db, 'cliente')
    db.cuando('WHERE c."Id_Comprobante" = $1', [{ ...comprobante, Id_Cliente: 8 }])
    const res = await request(app).get('/api/comprobantes/12').set('Authorization', token)
    expect(res.status).toBe(403)
  })
})
