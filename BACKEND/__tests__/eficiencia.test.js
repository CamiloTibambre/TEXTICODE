// ═══════════════════════════════════════════════════════════════
// MÓDULO 6 · ADMINISTRADOR – EFICIENCIA Y CARGA DE TRABAJO (RF-035 a RF-040)
// Integrante: Andrés Lancheros
// ═══════════════════════════════════════════════════════════════
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { cargarApp } from './helpers/app.js'
import { iniciarSesionComo } from './helpers/sesiones.js'
import { crearDbFalsa } from './helpers/dbFalsa.js'

let app, db, tokenAdmin, calcularRendimiento

const DIA = 86400000
const haceDias = d => new Date(Date.now() - d * DIA).toISOString()
// Fases completadas: ventana actual = últimos 30 días; las 3 anteriores = línea base
const fila = (op, dias, unidades) => ({ Id_Operario: op, Fecha_Completada: haceDias(dias), unidades, peso: 1.25 })
const FASES_COMPLETADAS = [
  fila(2, 5, 300), fila(2, 40, 100), fila(2, 70, 100), fila(2, 100, 100),   // Oscar: mejora mucho
  fila(3, 5, 10),  fila(3, 40, 100), fila(3, 70, 100), fila(3, 100, 100),   // Olga: baja
  fila(4, 5, 100), fila(4, 40, 100), fila(4, 70, 100), fila(4, 100, 100),   // Iván: se mantiene
]
const operarioRanking = (id, nombre) => ({
  Id_Usuario: id, Nombre_Completo: nombre, Nombre_Usuario: nombre.split(' ')[0].toLowerCase(),
  total_unidades_producidas: '300', ordenes_en_retraso: '1', ordenes_completadas: '4', ordenes_en_proceso: '2', ordenes_retrasadas: '1',
})
const RANKING = [operarioRanking(3, 'Olga Operaria'), operarioRanking(4, 'Iván Operario'), operarioRanking(2, 'Oscar Operario')]

beforeAll(async () => {
  ({ app, db } = await cargarApp())
  ;({ calcularRendimiento } = await import('../services/rendimiento.js'))
})
beforeEach(() => {
  db.reiniciar()
  tokenAdmin = iniciarSesionComo(db, 'admin')
})

// ─────────────────────────────────────────────────────────────
describe('RF-035 · Consultar ranking de eficiencia', () => {
  beforeEach(() => {
    db.cuando('$1::date IS NULL', RANKING)
    db.cuando('WITH fases AS', FASES_COMPLETADAS)
  })

  test('ordena a los operarios por prendas por día, con totales, retrasos, completadas y rendimiento', async () => {
    const res = await request(app).get('/api/eficiencia/operarios').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body.data.map(o => o.Nombre_Completo)).toEqual(['Oscar Operario', 'Iván Operario', 'Olga Operaria'])
    expect(res.body.data[0]).toEqual(expect.objectContaining({
      prendas_por_dia: 10, total_unidades_producidas: '300', ordenes_en_retraso: '1', ordenes_completadas: '4', rendimiento: 'Alto',
    }))
  })

  test('clasifica el rendimiento en Alto, Medio o Bajo', async () => {
    const res = await request(app).get('/api/eficiencia/operarios').set('Authorization', tokenAdmin)
    expect(Object.fromEntries(res.body.data.map(o => [o.Nombre_Completo, o.rendimiento])))
      .toEqual({ 'Oscar Operario': 'Alto', 'Iván Operario': 'Medio', 'Olga Operaria': 'Bajo' })
  })

  test('filtra por rendimiento', async () => {
    const res = await request(app).get('/api/eficiencia/operarios?rendimiento=Bajo').set('Authorization', tokenAdmin)
    expect(res.body.data.map(o => o.Nombre_Completo)).toEqual(['Olga Operaria'])
  })

  test('rechaza un filtro de rendimiento inválido', async () => {
    const res = await request(app).get('/api/eficiencia/operarios?rendimiento=Excelente').set('Authorization', tokenAdmin)
    expect(res.status).toBe(400)
  })

  test('limita la cantidad de resultados (top N)', async () => {
    const res = await request(app).get('/api/eficiencia/operarios?limite=2').set('Authorization', tokenAdmin)
    expect(res.body.data).toHaveLength(2)
  })

  test('solo el administrador ve el ranking (403 para operario)', async () => {
    const token = iniciarSesionComo(db, 'operario')
    const res = await request(app).get('/api/eficiencia/operarios').set('Authorization', token)
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-036 · Ver avance por operario', () => {
  test('muestra el avance de cada orden con prioridad, dificultad y fecha límite, marcando las vencidas', async () => {
    db.cuando('u."Correo", u."Telefono"\n', [{ ...operarioRanking(2, 'Oscar Operario'), Correo: 'oscar@demo.com' }])
    db.cuando('WITH fases AS', [])
    db.cuando('AS tiene_problema', [
      { Id_Orden: 40, Producto: 'Camisa polo', Prioridad: 'Alta', Dificultad: 'Alta', Unidades_Realizadas: 30, Unidades: 75, Fecha_Limite: '2020-01-10', vencida: true, tiene_problema: false },
      { Id_Orden: 41, Producto: 'Pantalón', Prioridad: 'Media', Dificultad: 'Baja', Unidades_Realizadas: 10, Unidades: 10, Fecha_Limite: '2099-01-10', vencida: false, tiene_problema: true },
    ])
    db.cuando('WHERE ob."Id_Operario" = $1 AND ob."Id_Orden" = $2', [])
    const res = await request(app).get('/api/eficiencia/operarios/2').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    const [o1, o2] = res.body.data.ordenes_detalle
    expect(o1).toEqual(expect.objectContaining({ Unidades_Realizadas: 30, Unidades: 75, Prioridad: 'Alta', Dificultad: 'Alta', vencida: true }))
    expect(o2.vencida).toBe(false)
    expect(o1.observaciones).toEqual([])
  })

  test('responde 404 si el operario no existe en la empresa', async () => {
    db.cuando('u."Correo", u."Telefono"\n', [])
    const res = await request(app).get('/api/eficiencia/operarios/99').set('Authorization', tokenAdmin)
    expect(res.status).toBe(404)
  })

  test('rechaza un id que no es número', async () => {
    const res = await request(app).get('/api/eficiencia/operarios/abc').set('Authorization', tokenAdmin)
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-037 · Ver tendencia de rendimiento', () => {
  test('compara el periodo actual con los anteriores: mejora = "subiendo", baja = "bajando", igual = "estable"', async () => {
    const pool = crearDbFalsa().cuando('WITH fases AS', FASES_COMPLETADAS)
    const mapa = await calcularRendimiento(pool, { empresaId: 1 })

    expect(mapa.get(2)).toEqual(expect.objectContaining({ tendencia: 'subiendo', rendimiento: 'Alto', prendas_por_dia: 10, anterior_por_dia: 3.3 }))
    expect(mapa.get(3)).toEqual(expect.objectContaining({ tendencia: 'bajando', rendimiento: 'Bajo' }))
    expect(mapa.get(4)).toEqual(expect.objectContaining({ tendencia: 'estable', rendimiento: 'Medio' }))
  })

  test.each([['semana', 7], ['mes', 30], ['trimestre', 90]])('el periodo "%s" usa ventanas de %i días', async (periodo, dias) => {
    const pool = crearDbFalsa().cuando('WITH fases AS', [])
    await calcularRendimiento(pool, { dias, empresaId: 1 })
    const [desde, hasta] = pool.paramsDe('WITH fases AS')
    expect(Math.round((hasta - desde) / DIA)).toBe(dias * 4)          // periodo actual + 3 anteriores
  })

  test('no calcula nada sin empresa (aislamiento multiempresa)', async () => {
    await expect(calcularRendimiento(crearDbFalsa(), {})).rejects.toThrow('requiere empresaId')
  })

  test('el historial del operario entrega periodo actual, anterior, tendencia y diferencia', async () => {
    db.cuando('u."Nombre_Usuario"\n       FROM usuario u', [{ Id_Usuario: 2, Nombre_Completo: 'Oscar Operario', Nombre_Usuario: 'oscar' }])
    db.cuando('AS con_problema', [{ total_unidades: 300, completadas: 3, en_curso: 1, retrasos: 0, con_problema: 0 }])
    db.cuando('WITH fases AS', FASES_COMPLETADAS)
    const res = await request(app).get('/api/eficiencia/operarios/2/historial?periodo=mes').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual(expect.objectContaining({ periodo: 'mes', dias: 30, tendencia: 'subiendo', diferencia_prendas: 6.7 }))
    expect(res.body.data.actual.rendimiento).toBe('Alto')
  })

  test('rechaza un periodo distinto de semana, mes o trimestre', async () => {
    const res = await request(app).get('/api/eficiencia/operarios/2/historial?periodo=anio').set('Authorization', tokenAdmin)
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-038 · Registrar observaciones sobre operarios', () => {
  const obs = { Id_Operario: 2, Id_Admin: 1, Id_Orden: 40, Observacion: 'Revisar costuras del lote' }
  function prepararValidaciones() {
    db.cuando(`r."Nombre_Rol" = 'operario' AND u."Estado" = 'activo'`, [{ Id_Usuario: 2 }])
    db.cuando('WHERE x."Id_Orden" = $1 AND x."Id_Operario" = $2', [{ Id_Orden: 40 }])
  }

  test('agrega una observación a una orden del operario (201)', async () => {
    prepararValidaciones()
    db.cuando('INSERT INTO observacion_operario', [{ Id_Observacion: 5 }])
    const res = await request(app).post('/api/eficiencia/observaciones').set('Authorization', tokenAdmin).send(obs)

    expect(res.status).toBe(201)
    expect(db.paramsDe('INSERT INTO observacion_operario')).toEqual([2, 40, 1, 'Revisar costuras del lote', 1])
  })

  test('no deja observar una orden que no es de ese operario', async () => {
    prepararValidaciones()
    db.cuando('WHERE x."Id_Orden" = $1 AND x."Id_Operario" = $2', [])
    const res = await request(app).post('/api/eficiencia/observaciones').set('Authorization', tokenAdmin).send(obs)
    expect(res.status).toBe(400)
  })

  test('limita la observación a 500 caracteres y exige todos los datos', async () => {
    const larga = await request(app).post('/api/eficiencia/observaciones').set('Authorization', tokenAdmin).send({ ...obs, Observacion: 'x'.repeat(501) })
    expect(larga.status).toBe(400)
    const vacia = await request(app).post('/api/eficiencia/observaciones').set('Authorization', tokenAdmin).send({ ...obs, Observacion: '' })
    expect(vacia.status).toBe(400)
  })

  test('consulta las observaciones de una orden', async () => {
    db.cuando('ORDER BY ob."Fecha" DESC', [{ Id_Observacion: 5, Id_Orden: 40, Observacion: 'Revisar costuras del lote', Admin: 'Ana Admin' }])
    const res = await request(app).get('/api/eficiencia/observaciones/2?Id_Orden=40').set('Authorization', tokenAdmin)
    expect(res.body.data[0].Observacion).toBe('Revisar costuras del lote')
    expect(db.paramsDe('ORDER BY ob."Fecha" DESC')).toEqual(['2', 1, '40'])
  })

  test('elimina una observación', async () => {
    db.cuando('SELECT "Id_Observacion" FROM observacion_operario', [{ Id_Observacion: 5 }])
    const res = await request(app).delete('/api/eficiencia/observaciones/5').set('Authorization', tokenAdmin)
    expect(res.status).toBe(200)
    expect(db.paramsDe('DELETE FROM observacion_operario')).toEqual(['5', 1])
  })

  test('responde 404 al eliminar una observación inexistente', async () => {
    db.cuando('SELECT "Id_Observacion" FROM observacion_operario', [])
    const res = await request(app).delete('/api/eficiencia/observaciones/999').set('Authorization', tokenAdmin)
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────
const cargaOp = (id, nombre, activas) => ({ Id_Usuario: id, Nombre_Completo: nombre, Nombre_Usuario: nombre.toLowerCase(), ordenes_activas: activas, fases_activas: activas, ordenes_vencidas: 0, ordenes_alta_prioridad: 0 })
const CARGA = [cargaOp(2, 'Oscar', 9), cargaOp(5, 'Nora', 6), cargaOp(4, 'Iván', 1), cargaOp(3, 'Olga', 3)]

describe('RF-039 · Consultar carga de trabajo', () => {
  test('clasifica a cada operario como sobrecargado (≥ 8), normal o disponible (≤ 4) y resume los totales', async () => {
    db.cuando('AS ordenes_alta_prioridad', CARGA)
    const res = await request(app).get('/api/carga-trabajo').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(Object.fromEntries(res.body.data.map(o => [o.Nombre_Completo, o.estado_carga])))
      .toEqual({ Oscar: 'sobrecargado', Nora: 'normal', Iván: 'disponible', Olga: 'disponible' })
    expect(res.body.resumen).toEqual({ total_operarios: 4, sobrecargados: 1, normales: 1, disponibles: 2 })
  })

  test('filtra por estado de carga', async () => {
    db.cuando('AS ordenes_alta_prioridad', CARGA)
    const res = await request(app).get('/api/carga-trabajo?estado=disponible').set('Authorization', tokenAdmin)
    expect(res.body.data.map(o => o.Nombre_Completo)).toEqual(['Iván', 'Olga'])
  })

  test('rechaza un estado de carga inválido', async () => {
    const res = await request(app).get('/api/carga-trabajo?estado=libre').set('Authorization', tokenAdmin)
    expect(res.status).toBe(400)
  })

  test('muestra el detalle de las órdenes activas del operario', async () => {
    db.cuando('AS ordenes_alta_prioridad', [CARGA[0]])
    db.cuando('WHERE "Id_Operario" = $2', [{ tipo: 'fase', Id_Orden: 40, Numero_Fase: 1, Producto: 'Camisa polo', Prioridad: 'Alta', vencida: true }])
    const res = await request(app).get('/api/carga-trabajo/operarios/2').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    expect(res.body.data.estado_carga).toBe('sobrecargado')
    expect(res.body.data.ordenes_activas_detalle[0]).toEqual(expect.objectContaining({ Id_Orden: 40, Producto: 'Camisa polo' }))
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-040 · Reasignar órdenes', () => {
  const destino = 'SELECT u."Id_Usuario", u."Nombre_Completo"\n    FROM usuario u'

  test('sugiere mover las órdenes sobrantes del sobrecargado al operario con menos carga', async () => {
    db.cuando('AS ordenes_alta_prioridad', CARGA)
    db.cuando('= ANY($2::int[])', [
      { tipo: 'fase', Id_Orden_Operario: 11, Id_Orden: 40, Id_Operario: 2, Producto: 'A', vencida: true },
      { tipo: 'fase', Id_Orden_Operario: 12, Id_Orden: 41, Id_Operario: 2, Producto: 'B', vencida: false },
      { tipo: 'fase', Id_Orden_Operario: 13, Id_Orden: 42, Id_Operario: 2, Producto: 'C', vencida: false },
    ])
    const res = await request(app).get('/api/carga-trabajo/sugerencias').set('Authorization', tokenAdmin)

    expect(res.status).toBe(200)
    const s = res.body.sugerencias[0]
    expect(s.operario_sobrecargado.nombre).toBe('Oscar')
    expect(s.exceso_ordenes).toBe(2)                                  // 9 activas → bajar a 7 (límite 8)
    expect(s.movimientos.map(m => m.hacia_operario.nombre)).toEqual(['Iván', 'Iván'])  // el de menor carga
  })

  test('reasigna todas las fases activas de una orden al operario elegido', async () => {
    db.cuando(destino, [{ Id_Usuario: 4, Nombre_Completo: 'Iván' }])
    db.cuando('SELECT "Id_Orden", "Id_Operario", "Producto"', [{ Id_Orden: 40, Id_Operario: 2, Producto: 'Camisa polo' }])
    db.cuando('SELECT "Id_Orden_Operario", "Id_Operario"\n    FROM orden_operario', [{ Id_Orden_Operario: 11, Id_Operario: 2 }, { Id_Orden_Operario: 12, Id_Operario: 2 }])
    const res = await request(app).post('/api/carga-trabajo/reasignar').set('Authorization', tokenAdmin).send({ Id_Orden: 40, Id_Operario_Destino: 4 })

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('2 fase(s) de la orden #40 reasignadas a Iván')
    expect(db.paramsDe('SET "Id_Operario" = $1, updated_at = NOW()\n      WHERE "Id_Orden" = $2')).toEqual([4, 40, 1])
  })

  test('reasigna una fase puntual', async () => {
    db.cuando(destino, [{ Id_Usuario: 4, Nombre_Completo: 'Iván' }])
    db.cuando('WHERE oo."Id_Orden_Operario" = $1', [{ Id_Orden_Operario: 11, Id_Orden: 40, Id_Operario: 2, Numero_Fase: 1, Producto: 'Camisa polo' }])
    const res = await request(app).post('/api/carga-trabajo/reasignar').set('Authorization', tokenAdmin).send({ Id_Orden_Operario: 11, Id_Operario_Destino: 4 })
    expect(res.status).toBe(200)
    expect(res.body.data.operario_nuevo).toEqual({ id: 4, nombre: 'Iván' })
  })

  test('no reasigna a alguien que no es operario activo de la empresa (404)', async () => {
    db.cuando(destino, [])
    const res = await request(app).post('/api/carga-trabajo/reasignar').set('Authorization', tokenAdmin).send({ Id_Orden: 40, Id_Operario_Destino: 77 })
    expect(res.status).toBe(404)
  })

  test('exige la orden (o fase) y el operario destino', async () => {
    const res = await request(app).post('/api/carga-trabajo/reasignar').set('Authorization', tokenAdmin).send({ Id_Orden: 40 })
    expect(res.status).toBe(400)
  })
})
