import express from 'express'
import db from '../db.js'
import verificarApiKey from '../apiKey.js'
import { actualizarOrdenesRetrasadas } from './ordenes.js'

const router = express.Router()

router.use(verificarApiKey)

const LIMITE_ORDENES_SOBRECARGA = 5
const LIMITE_ORDENES_DISPONIBLE = 2

// GET /api/carga-trabajo
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

    const { rows: operarios } = await db.query(`
      SELECT
        u."Id_Usuario",
        u."Nombre_Completo",
        u."Nombre_Usuario",
        u."Correo",
        u."Telefono",

        COUNT(
          CASE WHEN op."Estado" IN ('En Proceso', 'Retrasada') THEN 1 END
        ) AS ordenes_activas,

        COUNT(
          CASE WHEN (op."Estado" = 'Retrasada' OR (op."Estado" = 'En Proceso' AND CURRENT_DATE > op."Fecha_Limite"))
          THEN 1 END
        ) AS ordenes_vencidas,

        COUNT(
          CASE WHEN op."Estado" IN ('En Proceso', 'Retrasada')
               AND op."Prioridad" = 'Alta'
          THEN 1 END
        ) AS ordenes_alta_prioridad

      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      LEFT JOIN orden_produccion op ON op."Id_Operario" = u."Id_Usuario"
      WHERE u."Estado" = 'activo'
      GROUP BY u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo", u."Telefono"
      ORDER BY ordenes_activas DESC
    `)

    let data = operarios.map(op => {
      let estado_carga
      if (op.ordenes_activas > LIMITE_ORDENES_SOBRECARGA) {
        estado_carga = 'sobrecargado'
      } else if (op.ordenes_activas <= LIMITE_ORDENES_DISPONIBLE) {
        estado_carga = 'disponible'
      } else {
        estado_carga = 'normal'
      }
      return { ...op, estado_carga }
    })

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

// GET /api/carga-trabajo/sugerencias
router.get('/sugerencias', async (req, res) => {
  try {
    await actualizarOrdenesRetrasadas()

    const { rows: operarios } = await db.query(`
      SELECT
        u."Id_Usuario",
        u."Nombre_Completo",
        COUNT(
          CASE WHEN op."Estado" IN ('En Proceso', 'Retrasada') THEN 1 END
        ) AS ordenes_activas
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      LEFT JOIN orden_produccion op ON op."Id_Operario" = u."Id_Usuario"
      WHERE u."Estado" = 'activo'
      GROUP BY u."Id_Usuario", u."Nombre_Completo"
    `)

    const sobrecargados = operarios.filter(o => o.ordenes_activas > LIMITE_ORDENES_SOBRECARGA)
    const disponibles   = operarios.filter(o => o.ordenes_activas <= LIMITE_ORDENES_DISPONIBLE)

    if (sobrecargados.length === 0) {
      return res.json({ ok: true, mensaje: 'No hay operarios sobrecargados en este momento', sugerencias: [] })
    }
    if (disponibles.length === 0) {
      return res.json({ ok: true, mensaje: 'Hay operarios sobrecargados pero ninguno tiene capacidad disponible', sugerencias: [] })
    }

    const sugerencias = []

    for (const operario of sobrecargados) {
      const { rows: ordenes } = await db.query(`
        SELECT
          "Id_Orden", "Producto", "Estado", "Prioridad", "Fecha_Limite",
          "Unidades", "Unidades_Realizadas",
          CASE WHEN ("Estado" = 'Retrasada' OR CURRENT_DATE > "Fecha_Limite") THEN true ELSE false END AS vencida,
          CASE "Prioridad"
            WHEN 'Alta'  THEN 1
            WHEN 'Media' THEN 2
            WHEN 'Baja'  THEN 3
            ELSE 4
          END AS orden_prioridad
        FROM orden_produccion
        WHERE "Id_Operario" = $1 AND "Estado" IN ('En Proceso', 'Retrasada')
        ORDER BY vencida DESC, orden_prioridad ASC, "Fecha_Limite" ASC
      `, [operario.Id_Usuario])

      const exceso = Math.max(0, operario.ordenes_activas - LIMITE_ORDENES_SOBRECARGA)
      const ordenesAReasignar = ordenes.slice(0, exceso)

      const movimientos = ordenesAReasignar.map((orden, idx) => {
        const destino = disponibles[idx % disponibles.length]
        return {
          Id_Orden:       orden.Id_Orden,
          Producto:       orden.Producto,
          Prioridad:      orden.Prioridad,
          vencida:        Boolean(orden.vencida),
          Fecha_Limite:   orden.Fecha_Limite,
          desde_operario: { id: operario.Id_Usuario, nombre: operario.Nombre_Completo },
          hacia_operario: { id: destino.Id_Usuario,  nombre: destino.Nombre_Completo },
        }
      })

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

// GET /api/carga-trabajo/operarios/:id
router.get('/operarios/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'El id debe ser un número válido' })
    }

    await actualizarOrdenesRetrasadas()

    const { rows } = await db.query(`
      SELECT
        u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo", u."Telefono",
        COUNT(CASE WHEN op."Estado" IN ('En Proceso', 'Retrasada') THEN 1 END) AS ordenes_activas,
        COUNT(CASE WHEN (op."Estado" = 'Retrasada' OR (op."Estado" = 'En Proceso' AND CURRENT_DATE > op."Fecha_Limite")) THEN 1 END) AS ordenes_vencidas,
        COUNT(CASE WHEN op."Estado" IN ('En Proceso', 'Retrasada') AND op."Prioridad" = 'Alta' THEN 1 END) AS ordenes_alta_prioridad
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      LEFT JOIN orden_produccion op ON op."Id_Operario" = u."Id_Usuario"
      WHERE u."Id_Usuario" = $1 AND u."Estado" = 'activo'
      GROUP BY u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo", u."Telefono"
    `, [id])

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró operario con id ${id}` })
    }

    const operario = rows[0]
    let estado_carga
    if (operario.ordenes_activas > LIMITE_ORDENES_SOBRECARGA) estado_carga = 'sobrecargado'
    else if (operario.ordenes_activas <= LIMITE_ORDENES_DISPONIBLE) estado_carga = 'disponible'
    else estado_carga = 'normal'

    const { rows: ordenes } = await db.query(`
      SELECT
        "Id_Orden", "Producto", "Estado", "Prioridad",
        "Unidades", "Unidades_Realizadas", "Fecha_Limite",
        CASE WHEN ("Estado" = 'Retrasada' OR CURRENT_DATE > "Fecha_Limite") THEN true ELSE false END AS vencida
      FROM orden_produccion
      WHERE "Id_Operario" = $1 AND "Estado" IN ('En Proceso', 'Retrasada')
      ORDER BY CASE "Prioridad" WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 ELSE 3 END ASC, "Fecha_Limite" ASC
    `, [id])

    res.json({
      ok: true,
      data: { ...operario, estado_carga, ordenes_activas_detalle: ordenes }
    })
  } catch (error) {
    console.error('[carga-trabajo] GET /operarios/:id', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la carga del operario' })
  }
})

// POST /api/carga-trabajo/reasignar
router.post('/reasignar', async (req, res) => {
  try {
    const { Id_Orden, Id_Operario_Destino } = req.body

    if (!Id_Orden || !Id_Operario_Destino) {
      return res.status(400).json({ ok: false, mensaje: 'Se requieren Id_Orden e Id_Operario_Destino' })
    }

    const { rows: orden } = await db.query(`
      SELECT "Id_Orden", "Id_Operario", "Producto", "Estado"
      FROM orden_produccion
      WHERE "Id_Orden" = $1 AND "Estado" IN ('En Proceso', 'Retrasada')
    `, [Id_Orden])

    if (orden.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró una orden activa con id ${Id_Orden}` })
    }

    const { rows: operario } = await db.query(`
      SELECT u."Id_Usuario", u."Nombre_Completo"
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      WHERE u."Id_Usuario" = $1 AND u."Estado" = 'activo'
    `, [Id_Operario_Destino])

    if (operario.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró un operario activo con id ${Id_Operario_Destino}` })
    }

    await db.query(
      `UPDATE orden_produccion SET "Id_Operario" = $1 WHERE "Id_Orden" = $2`,
      [Id_Operario_Destino, Id_Orden]
    )

    res.json({
      ok: true,
      mensaje: `Orden #${Id_Orden} reasignada correctamente a ${operario[0].Nombre_Completo}`,
      data: {
        Id_Orden,
        Producto:          orden[0].Producto,
        operario_anterior: orden[0].Id_Operario,
        operario_nuevo:    { id: operario[0].Id_Usuario, nombre: operario[0].Nombre_Completo }
      }
    })
  } catch (error) {
    console.error('[carga-trabajo] POST /reasignar', error)
    res.status(500).json({ ok: false, mensaje: 'Error al reasignar la orden' })
  }
})

// POST /api/carga-trabajo/reasignar-multiple
router.post('/reasignar-multiple', async (req, res) => {
  try {
    const { movimientos } = req.body

    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return res.status(400).json({ ok: false, mensaje: 'Se requiere un array de movimientos con al menos un elemento' })
    }

    const resultados = []
    const errores    = []

    for (const mov of movimientos) {
      const { Id_Orden, Id_Operario_Destino } = mov

      if (!Id_Orden || !Id_Operario_Destino) {
        errores.push({ Id_Orden, error: 'Faltan Id_Orden o Id_Operario_Destino' })
        continue
      }

      try {
        const { rows: orden } = await db.query(
          `SELECT "Id_Orden", "Producto" FROM orden_produccion WHERE "Id_Orden" = $1 AND "Estado" IN ('En Proceso', 'Retrasada')`,
          [Id_Orden]
        )
        if (orden.length === 0) {
          errores.push({ Id_Orden, error: 'Orden no encontrada o no está activa' })
          continue
        }

        await db.query(
          `UPDATE orden_produccion SET "Id_Operario" = $1 WHERE "Id_Orden" = $2`,
          [Id_Operario_Destino, Id_Orden]
        )
        resultados.push({ Id_Orden, Producto: orden[0].Producto, Id_Operario_Destino, ok: true })
      } catch {
        errores.push({ Id_Orden, error: 'Error al procesar esta orden' })
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

// POST /api/carga-trabajo/aplicar-sugerencias
router.post('/aplicar-sugerencias', async (req, res) => {
  try {
    const { rows: operarios } = await db.query(`
      SELECT
        u."Id_Usuario", u."Nombre_Completo",
        COUNT(CASE WHEN op."Estado" IN ('En Proceso', 'Pausado') THEN 1 END) AS ordenes_activas
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      LEFT JOIN orden_produccion op ON op."Id_Operario" = u."Id_Usuario"
      WHERE u."Estado" = 'activo'
      GROUP BY u."Id_Usuario", u."Nombre_Completo"
    `)

    const sobrecargados = operarios.filter(o => o.ordenes_activas > LIMITE_ORDENES_SOBRECARGA)
    const disponibles   = operarios.filter(o => o.ordenes_activas <= LIMITE_ORDENES_DISPONIBLE)

    if (sobrecargados.length === 0) {
      return res.json({ ok: true, mensaje: 'No hay operarios sobrecargados', aplicados: 0 })
    }
    if (disponibles.length === 0) {
      return res.json({ ok: true, mensaje: 'No hay operarios disponibles para reasignar', aplicados: 0 })
    }

    let aplicados = 0
    const movimientos = []

    for (const operario of sobrecargados) {
      const { rows: ordenes } = await db.query(`
        SELECT "Id_Orden", "Producto", "Prioridad", "Fecha_Limite",
          CASE WHEN CURRENT_DATE > "Fecha_Limite" THEN true ELSE false END AS vencida,
          CASE "Prioridad" WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 ELSE 3 END AS orden_prioridad
        FROM orden_produccion
        WHERE "Id_Operario" = $1 AND "Estado" IN ('En Proceso', 'Pausado')
        ORDER BY vencida DESC, orden_prioridad ASC, "Fecha_Limite" ASC
      `, [operario.Id_Usuario])

      const exceso = Math.max(0, operario.ordenes_activas - LIMITE_ORDENES_SOBRECARGA)
      const aReasignar = ordenes.slice(0, exceso)

      for (let i = 0; i < aReasignar.length; i++) {
        const orden   = aReasignar[i]
        const destino = disponibles[i % disponibles.length]

        await db.query(
          `UPDATE orden_produccion SET "Id_Operario" = $1 WHERE "Id_Orden" = $2`,
          [destino.Id_Usuario, orden.Id_Orden]
        )

        movimientos.push({
          Id_Orden:       orden.Id_Orden,
          Producto:       orden.Producto,
          desde_operario: operario.Nombre_Completo,
          hacia_operario: destino.Nombre_Completo,
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

// PATCH /api/carga-trabajo/umbrales
let umbrales = {
  limite_sobrecarga: LIMITE_ORDENES_SOBRECARGA,
  limite_disponible: LIMITE_ORDENES_DISPONIBLE,
}

router.patch('/umbrales', async (req, res) => {
  try {
    const { limite_sobrecarga, limite_disponible } = req.body

    if (limite_sobrecarga !== undefined) {
      if (!Number.isInteger(limite_sobrecarga) || limite_sobrecarga < 1) {
        return res.status(400).json({ ok: false, mensaje: 'limite_sobrecarga debe ser un entero positivo' })
      }
      umbrales.limite_sobrecarga = limite_sobrecarga
    }

    if (limite_disponible !== undefined) {
      if (!Number.isInteger(limite_disponible) || limite_disponible < 0) {
        return res.status(400).json({ ok: false, mensaje: 'limite_disponible debe ser un entero >= 0' })
      }
      umbrales.limite_disponible = limite_disponible
    }

    res.json({ ok: true, mensaje: 'Umbrales actualizados', umbrales })
  } catch (error) {
    console.error('[carga-trabajo] PATCH /umbrales', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar umbrales' })
  }
})

// PATCH /api/carga-trabajo/ordenes/:id/operario
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

// PATCH /api/carga-trabajo/operarios/:id/estado
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