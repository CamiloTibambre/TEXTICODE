import express from 'express'
import db from '../db.js'
import verificarApiKey from '../apiKey.js'
import { actualizarOrdenesRetrasadas } from './ordenes.js'

const router = express.Router()

router.use(verificarApiKey)

// ─────────────────────────────────────────────────────────────
// Configuración de carga
// ─────────────────────────────────────────────────────────────
// Estados de ORDEN que cuentan como activos (solo para órdenes antiguas sin fases)
const ESTADOS_ACTIVOS = ['En Proceso', 'Retrasada']
const ESTADOS_ACTIVOS_SQL = ESTADOS_ACTIVOS.map(e => `'${e}'`).join(', ')

// Estados de FASE que ya NO cuentan como carga.
// Si tienes otros estados finales (ej. 'Cancelada'), agrégalos aquí.
const ESTADOS_FASE_FINALIZADOS = ['Completada']
const ESTADOS_FASE_FINALIZADOS_SQL = ESTADOS_FASE_FINALIZADOS.map(e => `'${e}'`).join(', ')

// true  => una orden antigua sin fases cuenta como 1 unidad de carga
// false => solo cuentan las fases
const INCLUIR_ORDENES_SIN_FASES = true

// Umbrales (modificables en memoria con PATCH /umbrales)
// sobrecargado  => carga >= limite_sobrecarga
// disponible    => carga <= limite_disponible
const umbrales = {
  limite_sobrecarga: 8,
  limite_disponible: 2,
}

function clasificarCarga(carga) {
  const n = Number(carga)
  if (n >= umbrales.limite_sobrecarga) return 'sobrecargado'
  if (n <= umbrales.limite_disponible) return 'disponible'
  return 'normal'
}

// Cuántas unidades hay que mover para que el operario quede por debajo del límite
// Ej: límite 5, carga 5 => 1 | carga 7 => 3
function calcularExceso(carga) {
  return Math.max(0, Number(carga) - (umbrales.limite_sobrecarga - 1))
}

// ─────────────────────────────────────────────────────────────
// Unidades de carga: cada FASE activa + órdenes antiguas sin fases
// ─────────────────────────────────────────────────────────────
const ITEMS_CARGA_SQL = `
  SELECT
    oo."Id_Orden_Operario"                          AS "Id_Orden_Operario",
    'fase'::text                                    AS tipo,
    oo."Id_Orden"                                   AS "Id_Orden",
    oo."Id_Operario"                                AS "Id_Operario",
    oo."Numero_Fase"                                AS "Numero_Fase",
    oo."Descripcion_Fase"                           AS "Descripcion_Fase",
    oo."Estado_Fase"                                AS estado_item,
    p."Producto"                                    AS "Producto",
    p."Prioridad"                                   AS "Prioridad",
    p."Fecha_Limite"                                AS "Fecha_Limite",
    (p."Estado"::text = 'Retrasada' OR CURRENT_DATE > p."Fecha_Limite") AS vencida
  FROM orden_operario oo
  INNER JOIN orden_produccion p ON p."Id_Orden" = oo."Id_Orden"
  WHERE oo."Estado_Fase" NOT IN (${ESTADOS_FASE_FINALIZADOS_SQL})
    AND p."Estado"::text <> 'Completada'
  ${INCLUIR_ORDENES_SIN_FASES ? `
  UNION ALL
  SELECT
    NULL::int,
    'orden'::text,
    p."Id_Orden",
    p."Id_Operario",
    NULL::int,
    NULL::text,
    p."Estado"::text,
    p."Producto",
    p."Prioridad",
    p."Fecha_Limite",
    (p."Estado"::text = 'Retrasada' OR CURRENT_DATE > p."Fecha_Limite")
  FROM orden_produccion p
  WHERE p."Id_Operario" IS NOT NULL
    AND p."Estado"::text IN (${ESTADOS_ACTIVOS_SQL})
    AND NOT EXISTS (SELECT 1 FROM orden_operario x WHERE x."Id_Orden" = p."Id_Orden")
  ` : ''}
`

// Orden en que se reasignan: vencidas primero, luego prioridad y fecha límite
const ORDEN_ITEMS_SQL = `
  vencida DESC,
  CASE "Prioridad"::text WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 WHEN 'Baja' THEN 3 ELSE 4 END ASC,
  "Fecha_Limite" ASC,
  "Numero_Fase" ASC NULLS LAST
`

// Operarios activos con su carga (opcionalmente uno solo)
async function obtenerOperarios(idOperario = null) {
  const params = []
  let filtro = ''
  if (idOperario !== null) {
    params.push(idOperario)
    filtro = `AND u."Id_Usuario" = $1`
  }

  const { rows } = await db.query(`
    WITH items AS (${ITEMS_CARGA_SQL})
    SELECT
      u."Id_Usuario",
      u."Nombre_Completo",
      u."Nombre_Usuario",
      u."Correo",
      u."Telefono",
      COUNT(i."Id_Operario")::int                                     AS ordenes_activas,
      COUNT(i."Id_Operario") FILTER (WHERE i.tipo = 'fase')::int      AS fases_activas,
      COUNT(i."Id_Operario") FILTER (WHERE i.vencida)::int            AS ordenes_vencidas,
      COUNT(i."Id_Operario") FILTER (WHERE i."Prioridad"::text = 'Alta')::int AS ordenes_alta_prioridad
    FROM usuario u
    INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
    LEFT JOIN items i ON i."Id_Operario" = u."Id_Usuario"
    WHERE u."Estado" = 'activo' ${filtro}
    GROUP BY u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo", u."Telefono"
    ORDER BY ordenes_activas DESC, u."Nombre_Completo"
  `, params)

  return rows.map(o => ({ ...o, estado_carga: clasificarCarga(o.ordenes_activas) }))
}

// Calcula las sugerencias de reasignación (por fase)
async function calcularSugerencias() {
  const operarios = await obtenerOperarios()
  const sobrecargados = operarios.filter(o => o.estado_carga === 'sobrecargado')
  const disponibles   = operarios.filter(o => o.estado_carga === 'disponible')

  if (sobrecargados.length === 0 || disponibles.length === 0) {
    return { sobrecargados, disponibles, sugerencias: [] }
  }

  const { rows: items } = await db.query(`
    WITH items AS (${ITEMS_CARGA_SQL})
    SELECT * FROM items
    WHERE "Id_Operario" = ANY($1::int[])
    ORDER BY "Id_Operario", ${ORDEN_ITEMS_SQL}
  `, [sobrecargados.map(o => o.Id_Usuario)])

  // Carga proyectada de cada disponible, para repartir sin sobrecargarlos
  const cargaProyectada = new Map(disponibles.map(d => [d.Id_Usuario, d.ordenes_activas]))
  const sugerencias = []

  for (const operario of sobrecargados) {
    const exceso = calcularExceso(operario.ordenes_activas)
    const aMover = items.filter(i => i.Id_Operario === operario.Id_Usuario).slice(0, exceso)
    const movimientos = []

    for (const item of aMover) {
      // Disponible con menos carga proyectada
      const destino = [...disponibles].sort(
        (a, b) => cargaProyectada.get(a.Id_Usuario) - cargaProyectada.get(b.Id_Usuario)
      )[0]

      // Si el destino ya llegaría al límite, no hay más capacidad
      if (cargaProyectada.get(destino.Id_Usuario) + 1 >= umbrales.limite_sobrecarga) break
      cargaProyectada.set(destino.Id_Usuario, cargaProyectada.get(destino.Id_Usuario) + 1)

      movimientos.push({
        tipo:               item.tipo,
        Id_Orden_Operario:  item.Id_Orden_Operario,
        Id_Orden:           item.Id_Orden,
        Numero_Fase:        item.Numero_Fase,
        Descripcion_Fase:   item.Descripcion_Fase,
        Producto:           item.Producto,
        Prioridad:          item.Prioridad,
        vencida:            Boolean(item.vencida),
        Fecha_Limite:       item.Fecha_Limite,
        desde_operario:     { id: operario.Id_Usuario, nombre: operario.Nombre_Completo },
        hacia_operario:     { id: destino.Id_Usuario,  nombre: destino.Nombre_Completo },
      })
    }

    if (movimientos.length > 0) {
      sugerencias.push({
        operario_sobrecargado: {
          id:              operario.Id_Usuario,
          nombre:          operario.Nombre_Completo,
          ordenes_activas: operario.ordenes_activas,
        },
        exceso_ordenes: exceso,
        movimientos,
      })
    }
  }

  return { sobrecargados, disponibles, sugerencias }
}

// Mueve UNA fase (o una orden antigua sin fases) a otro operario
async function reasignarItem({ Id_Orden_Operario, Id_Orden, Id_Operario_Destino }) {
  if (!Id_Operario_Destino || (!Id_Orden_Operario && !Id_Orden)) {
    return { status: 400, error: 'Se requiere Id_Orden_Operario (fase) o Id_Orden, y Id_Operario_Destino' }
  }

  const { rows: destino } = await db.query(`
    SELECT u."Id_Usuario", u."Nombre_Completo"
    FROM usuario u
    INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
    WHERE u."Id_Usuario" = $1 AND u."Estado" = 'activo'
  `, [Id_Operario_Destino])

  if (destino.length === 0) {
    return { status: 404, error: `No se encontró un operario activo con id ${Id_Operario_Destino}` }
  }

  // Reasignar una FASE
  if (Id_Orden_Operario) {
    const { rows: fase } = await db.query(`
      SELECT oo."Id_Orden_Operario", oo."Id_Orden", oo."Id_Operario", oo."Numero_Fase", oo."Descripcion_Fase", p."Producto"
      FROM orden_operario oo
      INNER JOIN orden_produccion p ON p."Id_Orden" = oo."Id_Orden"
      WHERE oo."Id_Orden_Operario" = $1
        AND oo."Estado_Fase" NOT IN (${ESTADOS_FASE_FINALIZADOS_SQL})
    `, [Id_Orden_Operario])

    if (fase.length === 0) {
      return { status: 404, error: `No se encontró una fase activa con id ${Id_Orden_Operario}` }
    }

    await db.query(
      `UPDATE orden_operario SET "Id_Operario" = $1, updated_at = NOW() WHERE "Id_Orden_Operario" = $2`,
      [Id_Operario_Destino, Id_Orden_Operario]
    )

    return {
      status: 200,
      mensaje: `Fase ${fase[0].Numero_Fase} de la orden #${fase[0].Id_Orden} reasignada a ${destino[0].Nombre_Completo}`,
      data: {
        tipo:              'fase',
        Id_Orden_Operario: Number(Id_Orden_Operario),
        Id_Orden:          fase[0].Id_Orden,
        Numero_Fase:       fase[0].Numero_Fase,
        Producto:          fase[0].Producto,
        operario_anterior: fase[0].Id_Operario,
        operario_nuevo:    { id: destino[0].Id_Usuario, nombre: destino[0].Nombre_Completo },
      }
    }
  }

  // Reasignar una ORDEN antigua sin fases
  const { rows: orden } = await db.query(`
    SELECT "Id_Orden", "Id_Operario", "Producto"
    FROM orden_produccion
    WHERE "Id_Orden" = $1 AND "Estado"::text IN (${ESTADOS_ACTIVOS_SQL})
  `, [Id_Orden])

  if (orden.length === 0) {
    return { status: 404, error: `No se encontró una orden activa con id ${Id_Orden}` }
  }

  await db.query(
    `UPDATE orden_produccion SET "Id_Operario" = $1 WHERE "Id_Orden" = $2`,
    [Id_Operario_Destino, Id_Orden]
  )

  return {
    status: 200,
    mensaje: `Orden #${Id_Orden} reasignada a ${destino[0].Nombre_Completo}`,
    data: {
      tipo:              'orden',
      Id_Orden:          Number(Id_Orden),
      Producto:          orden[0].Producto,
      operario_anterior: orden[0].Id_Operario,
      operario_nuevo:    { id: destino[0].Id_Usuario, nombre: destino[0].Nombre_Completo },
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/carga-trabajo
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    await actualizarOrdenesRetrasadas()

    const { estado } = req.query

    const estadosValidos = ['sobrecargado', 'normal', 'disponible']
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        mensaje: `estado inválido. Usa: ${estadosValidos.join(', ')}`
      })
    }

    let data = await obtenerOperarios()

    if (estado) {
      data = data.filter(o => o.estado_carga === estado)
    }

    const resumen = {
      total_operarios: data.length,
      sobrecargados:   data.filter(o => o.estado_carga === 'sobrecargado').length,
      normales:        data.filter(o => o.estado_carga === 'normal').length,
      disponibles:     data.filter(o => o.estado_carga === 'disponible').length,
    }

    res.json({ ok: true, filtro_aplicado: estado || null, resumen, data })
  } catch (error) {
    console.error('[carga-trabajo] GET /', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la carga de trabajo' })
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/carga-trabajo/sugerencias
// ─────────────────────────────────────────────────────────────
router.get('/sugerencias', async (req, res) => {
  try {
    await actualizarOrdenesRetrasadas()

    const { sobrecargados, disponibles, sugerencias } = await calcularSugerencias()

    if (sobrecargados.length === 0) {
      return res.json({ ok: true, mensaje: 'No hay operarios sobrecargados en este momento', sugerencias: [] })
    }
    if (disponibles.length === 0) {
      return res.json({ ok: true, mensaje: 'Hay operarios sobrecargados pero ninguno tiene capacidad disponible', sugerencias: [] })
    }

    res.json({
      ok: true,
      total_sugerencias: sugerencias.reduce((acc, s) => acc + s.movimientos.length, 0),
      sugerencias,
    })
  } catch (error) {
    console.error('[carga-trabajo] GET /sugerencias', error)
    res.status(500).json({ ok: false, mensaje: 'Error al generar sugerencias de reasignación' })
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/carga-trabajo/operarios/:id
// ─────────────────────────────────────────────────────────────
router.get('/operarios/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'El id debe ser un número válido' })
    }

    await actualizarOrdenesRetrasadas()

    const operarios = await obtenerOperarios(Number(id))
    if (operarios.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró operario con id ${id}` })
    }

    const { rows: detalle } = await db.query(`
      WITH items AS (${ITEMS_CARGA_SQL})
      SELECT * FROM items
      WHERE "Id_Operario" = $1
      ORDER BY ${ORDEN_ITEMS_SQL}
    `, [Number(id)])

    res.json({
      ok: true,
      data: { ...operarios[0], ordenes_activas_detalle: detalle }
    })
  } catch (error) {
    console.error('[carga-trabajo] GET /operarios/:id', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la carga del operario' })
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/carga-trabajo/reasignar
// Body: { Id_Orden_Operario, Id_Operario_Destino }   (fase)
//   o   { Id_Orden, Id_Operario_Destino }            (orden antigua sin fases)
// ─────────────────────────────────────────────────────────────
router.post('/reasignar', async (req, res) => {
  try {
    const r = await reasignarItem(req.body)
    if (r.error) return res.status(r.status).json({ ok: false, mensaje: r.error })
    res.json({ ok: true, mensaje: r.mensaje, data: r.data })
  } catch (error) {
    console.error('[carga-trabajo] POST /reasignar', error)
    res.status(500).json({ ok: false, mensaje: 'Error al reasignar' })
  }
})

// PATCH /api/carga-trabajo/fases/:id/operario  (reasignar una fase por su id)
router.patch('/fases/:id/operario', async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'El id de la fase debe ser un número válido' })
    }

    const r = await reasignarItem({
      Id_Orden_Operario:   Number(id),
      Id_Operario_Destino: req.body.Id_Operario_Destino
    })
    if (r.error) return res.status(r.status).json({ ok: false, mensaje: r.error })
    res.json({ ok: true, mensaje: r.mensaje, data: r.data })
  } catch (error) {
    console.error('[carga-trabajo] PATCH /fases/:id/operario', error)
    res.status(500).json({ ok: false, mensaje: 'Error al reasignar la fase' })
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/carga-trabajo/reasignar-multiple
// Body: { movimientos: [{ Id_Orden_Operario | Id_Orden, Id_Operario_Destino }] }
// ─────────────────────────────────────────────────────────────
router.post('/reasignar-multiple', async (req, res) => {
  try {
    const { movimientos } = req.body

    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return res.status(400).json({ ok: false, mensaje: 'Se requiere un array de movimientos con al menos un elemento' })
    }

    const resultados = []
    const errores    = []

    for (const mov of movimientos) {
      try {
        const r = await reasignarItem(mov)
        if (r.error) {
          errores.push({ Id_Orden_Operario: mov.Id_Orden_Operario, Id_Orden: mov.Id_Orden, error: r.error })
        } else {
          resultados.push({ ...r.data, ok: true })
        }
      } catch {
        errores.push({ Id_Orden_Operario: mov.Id_Orden_Operario, Id_Orden: mov.Id_Orden, error: 'Error al procesar este movimiento' })
      }
    }

    res.json({
      ok: true,
      total_procesados: resultados.length,
      total_errores:    errores.length,
      resultados,
      errores
    })
  } catch (error) {
    console.error('[carga-trabajo] POST /reasignar-multiple', error)
    res.status(500).json({ ok: false, mensaje: 'Error al procesar reasignaciones' })
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/carga-trabajo/aplicar-sugerencias
// ─────────────────────────────────────────────────────────────
router.post('/aplicar-sugerencias', async (req, res) => {
  try {
    await actualizarOrdenesRetrasadas()

    const { sobrecargados, disponibles, sugerencias } = await calcularSugerencias()

    if (sobrecargados.length === 0) {
      return res.json({ ok: true, mensaje: 'No hay operarios sobrecargados', aplicados: 0 })
    }
    if (disponibles.length === 0) {
      return res.json({ ok: true, mensaje: 'No hay operarios disponibles para reasignar', aplicados: 0 })
    }

    let aplicados = 0
    const movimientos = []

    for (const sugerencia of sugerencias) {
      for (const mov of sugerencia.movimientos) {
        const r = await reasignarItem({
          Id_Orden_Operario:   mov.tipo === 'fase' ? mov.Id_Orden_Operario : undefined,
          Id_Orden:            mov.tipo === 'orden' ? mov.Id_Orden : undefined,
          Id_Operario_Destino: mov.hacia_operario.id,
        })
        if (r.error) continue

        movimientos.push({
          tipo:              mov.tipo,
          Id_Orden_Operario: mov.Id_Orden_Operario,
          Id_Orden:          mov.Id_Orden,
          Numero_Fase:       mov.Numero_Fase,
          Producto:          mov.Producto,
          desde_operario:    mov.desde_operario.nombre,
          hacia_operario:    mov.hacia_operario.nombre,
        })
        aplicados++
      }
    }

    res.json({ ok: true, mensaje: `Se aplicaron ${aplicados} reasignaciones`, aplicados, movimientos })
  } catch (error) {
    console.error('[carga-trabajo] POST /aplicar-sugerencias', error)
    res.status(500).json({ ok: false, mensaje: 'Error al aplicar sugerencias' })
  }
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/carga-trabajo/umbrales
// ─────────────────────────────────────────────────────────────
router.patch('/umbrales', async (req, res) => {
  try {
    const { limite_sobrecarga, limite_disponible } = req.body

    const nuevoSobrecarga = limite_sobrecarga !== undefined ? limite_sobrecarga : umbrales.limite_sobrecarga
    const nuevoDisponible = limite_disponible !== undefined ? limite_disponible : umbrales.limite_disponible

    if (!Number.isInteger(nuevoSobrecarga) || nuevoSobrecarga < 1) {
      return res.status(400).json({ ok: false, mensaje: 'limite_sobrecarga debe ser un entero positivo' })
    }
    if (!Number.isInteger(nuevoDisponible) || nuevoDisponible < 0) {
      return res.status(400).json({ ok: false, mensaje: 'limite_disponible debe ser un entero >= 0' })
    }
    if (nuevoDisponible >= nuevoSobrecarga) {
      return res.status(400).json({ ok: false, mensaje: 'limite_disponible debe ser menor que limite_sobrecarga' })
    }

    umbrales.limite_sobrecarga = nuevoSobrecarga
    umbrales.limite_disponible = nuevoDisponible

    res.json({ ok: true, mensaje: 'Umbrales actualizados', umbrales })
  } catch (error) {
    console.error('[carga-trabajo] PATCH /umbrales', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar umbrales' })
  }
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/carga-trabajo/ordenes/:id/operario
// (reasigna la orden completa; se mantiene por compatibilidad)
// ─────────────────────────────────────────────────────────────
router.patch('/ordenes/:id/operario', async (req, res) => {
  try {
    const { id } = req.params
    const { Id_Operario_Destino } = req.body

    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'El id de la orden debe ser un número válido' })
    }
    if (!Id_Operario_Destino) {
      return res.status(400).json({ ok: false, mensaje: 'Se requiere Id_Operario_Destino' })
    }

    const { rows: orden } = await db.query(
      `SELECT "Id_Orden", "Id_Operario", "Producto", "Estado" FROM orden_produccion WHERE "Id_Orden" = $1`,
      [id]
    )
    if (orden.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró la orden #${id}` })
    }

    const { rows: operario } = await db.query(`
      SELECT u."Id_Usuario", u."Nombre_Completo"
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      WHERE u."Id_Usuario" = $1 AND u."Estado" = 'activo'
    `, [Id_Operario_Destino])

    if (operario.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró el operario con id ${Id_Operario_Destino}` })
    }

    await db.query(
      `UPDATE orden_produccion SET "Id_Operario" = $1 WHERE "Id_Orden" = $2`,
      [Id_Operario_Destino, id]
    )

    res.json({
      ok: true,
      mensaje: `Orden #${id} reasignada a ${operario[0].Nombre_Completo}`,
      data: {
        Id_Orden:          Number(id),
        Producto:          orden[0].Producto,
        operario_anterior: orden[0].Id_Operario,
        operario_nuevo:    { id: operario[0].Id_Usuario, nombre: operario[0].Nombre_Completo }
      }
    })
  } catch (error) {
    console.error('[carga-trabajo] PATCH /ordenes/:id/operario', error)
    res.status(500).json({ ok: false, mensaje: 'Error al reasignar la orden' })
  }
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/carga-trabajo/operarios/:id/estado
// ─────────────────────────────────────────────────────────────
router.patch('/operarios/:id/estado', async (req, res) => {
  try {
    const { id } = req.params
    const { Estado } = req.body

    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'El id debe ser un número válido' })
    }

    const estadosValidos = ['activo', 'inactivo']
    if (!Estado || !estadosValidos.includes(Estado)) {
      return res.status(400).json({ ok: false, mensaje: `Estado inválido. Usa: ${estadosValidos.join(', ')}` })
    }

    const { rows: operario } = await db.query(`
      SELECT u."Id_Usuario", u."Nombre_Completo", u."Estado"
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      WHERE u."Id_Usuario" = $1
    `, [id])

    if (operario.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró el operario con id ${id}` })
    }

    await db.query(
      `UPDATE usuario SET "Estado" = $1 WHERE "Id_Usuario" = $2`,
      [Estado, id]
    )

    res.json({
      ok: true,
      mensaje: `Operario ${operario[0].Nombre_Completo} actualizado a estado "${Estado}"`,
      data: { Id_Usuario: Number(id), Nombre_Completo: operario[0].Nombre_Completo, Estado }
    })
  } catch (error) {
    console.error('[carga-trabajo] PATCH /operarios/:id/estado', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el estado del operario' })
  }
})

export default router