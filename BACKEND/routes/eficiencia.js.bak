import express from 'express'
import db from '../db.js'
import verificarApiKey from '../apiKey.js'
import { actualizarOrdenesRetrasadas } from './ordenes.js'
import { calcularRendimiento } from '../services/rendimiento.js'

const router = express.Router()

router.use(verificarApiKey)

// ---------------------------------------------------------------
// Órdenes de cada operario: une las fases (orden_operario) con las
// órdenes viejas que todavía tienen orden_produccion.Id_Operario.
// UNION elimina duplicados (mismo operario + misma orden).
// Se usa como: LEFT JOIN ${SQL_ORDENES_OP} op ON ...
// ---------------------------------------------------------------
const SQL_ORDENES_OP = `(
  SELECT oo."Id_Operario", p."Id_Orden", p."Producto", p."Estado", p."Prioridad",
         p."Dificultad",
         MAX(oo."Cantidad_Realizada")::int                  AS "Unidades_Realizadas",
         MAX(ROUND(p."Cantidad"::numeric / c.n))::int       AS "Unidades",
         p."Fecha_Limite", p."Fecha_Creacion"
  FROM orden_operario oo
  JOIN orden_produccion p ON p."Id_Orden" = oo."Id_Orden"
  JOIN (
    SELECT "Id_Orden", "Numero_Fase", COUNT(*) AS n
    FROM orden_operario
    GROUP BY "Id_Orden", "Numero_Fase"
  ) c ON c."Id_Orden" = oo."Id_Orden" AND c."Numero_Fase" = oo."Numero_Fase"
  GROUP BY oo."Id_Operario", p."Id_Orden", p."Producto", p."Estado", p."Prioridad",
           p."Dificultad", p."Fecha_Limite", p."Fecha_Creacion"
  UNION ALL
  SELECT p."Id_Operario", p."Id_Orden", p."Producto", p."Estado", p."Prioridad",
         p."Dificultad", p."Unidades_Realizadas"::int, p."Unidades"::int,
         p."Fecha_Limite", p."Fecha_Creacion"
  FROM orden_produccion p
  WHERE p."Id_Operario" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM orden_operario x
      WHERE x."Id_Orden" = p."Id_Orden" AND x."Id_Operario" = p."Id_Operario"
    )
)`

// ---------------------------------------------------------------
// Métrica legacy (se conserva para el SELECT; prendas_por_dia y
// rendimiento se sobrescriben con calcularRendimiento).
// ---------------------------------------------------------------
const SQL_PRENDAS_POR_DIA = `
  ROUND(
    COALESCE(SUM(
      CASE
        WHEN (
          SELECT COUNT(*) FROM observacion_operario ob2
          WHERE ob2."Id_Orden" = op."Id_Orden"
        ) = 0
        THEN op."Unidades_Realizadas" * CASE op."Dificultad"
              WHEN 'Alta'  THEN 3
              WHEN 'Media' THEN 2
              WHEN 'Baja'  THEN 1
              ELSE 2
            END
        ELSE NULL
      END
    ), 0) /
    NULLIF(
      SUM(
        CASE
          WHEN (
            SELECT COUNT(*) FROM observacion_operario ob3
            WHERE ob3."Id_Orden" = op."Id_Orden"
          ) = 0
          THEN GREATEST((CURRENT_DATE - DATE(op."Fecha_Creacion"))::int, 1)
          ELSE 0
        END
      ),
      0
    ), 1
  )
`

const SQL_ORDENES_EN_RETRASO = `
  COUNT(
    CASE
      WHEN op."Estado" = 'Retrasada'
        OR (CURRENT_DATE > op."Fecha_Limite" AND op."Estado" = 'En Proceso')
      THEN 1
    END
  )
`

// Mezcla las métricas de baseline individual sobre una fila de operario.
// Sin actividad en el periodo: 0 prendas y "Medio" (no se penaliza).
function aplicarRendimiento(op, m) {
  if (!m) {
    return { ...op, prendas_por_dia: 0, rendimiento: 'Medio', tendencia: 'estable', baseline: null }
  }
  return { ...op, ...m }
}

// ---------------------------------------------------------------
// GET /api/eficiencia/operarios/:id
// ---------------------------------------------------------------
router.get('/operarios/:id', async (req, res) => {
  const { id } = req.params

  if (isNaN(id)) {
    return res.status(400).json({ ok: false, mensaje: 'El id debe ser un número válido' })
  }

  try {
    await actualizarOrdenesRetrasadas()

    const { rows } = await db.query(`
      SELECT
        u."Id_Usuario",
        u."Nombre_Completo",
        u."Nombre_Usuario",
        u."Correo",
        u."Telefono",

        ${SQL_PRENDAS_POR_DIA} AS prendas_por_dia,

        COALESCE(SUM(op."Unidades_Realizadas"), 0) AS total_unidades_producidas,

        ${SQL_ORDENES_EN_RETRASO} AS ordenes_en_retraso,

        COUNT(CASE WHEN op."Estado" = 'Completada' THEN 1 END) AS ordenes_completadas,
        COUNT(CASE WHEN op."Estado" = 'En Proceso' THEN 1 END) AS ordenes_en_proceso,
        COUNT(CASE WHEN op."Estado" = 'Retrasada' OR (CURRENT_DATE > op."Fecha_Limite" AND op."Estado" = 'En Proceso') THEN 1 END) AS ordenes_retrasadas,

        COUNT(
          CASE WHEN (
            SELECT COUNT(*) FROM observacion_operario ob5
            WHERE ob5."Id_Orden" = op."Id_Orden"
          ) > 0 THEN 1 END
        ) AS ordenes_con_problema

      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      LEFT JOIN ${SQL_ORDENES_OP} op ON op."Id_Operario" = u."Id_Usuario"
      WHERE u."Id_Usuario" = $1 AND u."Estado" = 'activo'
      GROUP BY u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo", u."Telefono"
    `, [id])

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró operario con id ${id}` })
    }

    const mapa = await calcularRendimiento(db)
    const operario = aplicarRendimiento(rows[0], mapa.get(Number(id)))

    const { rows: ordenes } = await db.query(`
      SELECT
        op."Id_Orden", op."Producto", op."Estado", op."Prioridad", op."Dificultad",
        op."Unidades_Realizadas", op."Unidades", op."Fecha_Limite",
        CASE
          WHEN op."Estado" = 'Retrasada' OR (CURRENT_DATE > op."Fecha_Limite" AND op."Estado" = 'En Proceso')
          THEN true ELSE false
        END AS vencida,
        CASE
          WHEN (
            SELECT COUNT(*) FROM observacion_operario ob
            WHERE ob."Id_Orden" = op."Id_Orden"
          ) > 0 THEN true ELSE false
        END AS tiene_problema
      FROM ${SQL_ORDENES_OP} op
      WHERE op."Id_Operario" = $1
      ORDER BY op."Fecha_Limite" ASC
    `, [id])

    const ordenesConObs = await Promise.all(
      ordenes.map(async (o) => {
        const { rows: obs } = await db.query(`
          SELECT ob."Id_Observacion", ob."Observacion", ob."Fecha",
                 u."Nombre_Completo" AS "Admin"
          FROM observacion_operario ob
          INNER JOIN usuario u ON ob."Id_Admin" = u."Id_Usuario"
          WHERE ob."Id_Operario" = $1 AND ob."Id_Orden" = $2
          ORDER BY ob."Fecha" DESC
        `, [id, o.Id_Orden])
        return { ...o, observaciones: obs }
      })
    )

    res.json({
      ok: true,
      data: { ...operario, ordenes_detalle: ordenesConObs }
    })
  } catch (err) {
    console.error('Error en GET /eficiencia/operarios/:id:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno al cargar el operario' })
  }
})

// ---------------------------------------------------------------
// GET /api/eficiencia/operarios
// Acepta ?periodo=YYYY-MM (opcional). El filtro por mes va en el ON
// del LEFT JOIN para que un operario sin órdenes ese mes siga
// apareciendo con métricas en 0.
// ---------------------------------------------------------------
router.get('/operarios', async (req, res) => {
  const { rendimiento, estado, limite, periodo } = req.query

  let inicioPeriodo = null
  if (periodo) {
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({ ok: false, mensaje: 'periodo inválido, use el formato YYYY-MM' })
    }
    inicioPeriodo = `${periodo}-01`
  }

  try {
    await actualizarOrdenesRetrasadas()

    const { rows } = await db.query(`
      SELECT
        u."Id_Usuario",
        u."Nombre_Completo",
        u."Nombre_Usuario",

        ${SQL_PRENDAS_POR_DIA} AS prendas_por_dia,

        COALESCE(SUM(op."Unidades_Realizadas"), 0) AS total_unidades_producidas,

        ${SQL_ORDENES_EN_RETRASO} AS ordenes_en_retraso,

        COUNT(CASE WHEN op."Estado" = 'Completada' THEN 1 END) AS ordenes_completadas,
        COUNT(CASE WHEN op."Estado" = 'En Proceso' THEN 1 END) AS ordenes_en_proceso,
        COUNT(CASE WHEN op."Estado" = 'Retrasada' OR (CURRENT_DATE > op."Fecha_Limite" AND op."Estado" = 'En Proceso') THEN 1 END) AS ordenes_retrasadas,

        COUNT(
          CASE WHEN (
            SELECT COUNT(*) FROM observacion_operario ob5
            WHERE ob5."Id_Orden" = op."Id_Orden"
          ) > 0 THEN 1 END
        ) AS ordenes_con_problema

      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
      LEFT JOIN ${SQL_ORDENES_OP} op
        ON op."Id_Operario" = u."Id_Usuario"
       AND (
             $1::date IS NULL
             OR (
                  op."Fecha_Limite" >= $1::date
                  AND op."Fecha_Limite" < ($1::date + INTERVAL '1 month')
                )
           )
      WHERE u."Estado" = 'activo'
      GROUP BY u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario"
    `, [inicioPeriodo])

    // Rendimiento por baseline individual + tendencia
    const mapa = await calcularRendimiento(db, { periodo })
    let resultado = rows
      .map(op => aplicarRendimiento(op, mapa.get(op.Id_Usuario)))
      .sort((a, b) => Number(b.prendas_por_dia) - Number(a.prendas_por_dia))

    if (rendimiento) {
      const validos = ['Alto', 'Medio', 'Bajo']
      if (!validos.includes(rendimiento)) {
        return res.status(400).json({ ok: false, mensaje: `rendimiento inválido. Usa: ${validos.join(', ')}` })
      }
      resultado = resultado.filter(r => r.rendimiento === rendimiento)
    }

    if (estado) {
      const validos = ['Completada', 'En Proceso', 'Retrasada']
      if (!validos.includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: `estado inválido. Usa: ${validos.join(', ')}` })
      }
      resultado = resultado.filter(r => {
        if (estado === 'Completada') return r.ordenes_completadas > 0
        if (estado === 'En Proceso') return r.ordenes_en_proceso > 0
        if (estado === 'Retrasada')  return (r.ordenes_retrasadas > 0 || r.ordenes_en_retraso > 0)
      })
    }

    if (limite) {
      const n = parseInt(limite)
      if (isNaN(n) || n <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'limite debe ser un número positivo' })
      }
      resultado = resultado.slice(0, n)
    }

    res.json({
      ok: true,
      total: resultado.length,
      filtros_aplicados: { rendimiento: rendimiento || null, estado: estado || null, limite: limite || null, periodo: periodo || null },
      data: resultado
    })
  } catch (err) {
    console.error('Error en GET /eficiencia/operarios:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno al cargar la eficiencia de operarios' })
  }
})

// ---------------------------------------------------------------
// POST /api/eficiencia/observaciones
// ---------------------------------------------------------------
router.post('/observaciones', async (req, res) => {
  const { Id_Operario, Id_Admin, Id_Orden, Observacion } = req.body

  if (!Id_Operario || !Id_Admin || !Id_Orden || !Observacion) {
    return res.status(400).json({ ok: false, mensaje: 'Id_Operario, Id_Admin, Id_Orden y Observacion son requeridos' })
  }

  if (Observacion.length > 500) {
    return res.status(400).json({ ok: false, mensaje: 'La observación no puede superar 500 caracteres' })
  }

  try {
    const { rows: operario } = await db.query(
      `SELECT u."Id_Usuario" FROM usuario u
       INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol"
       WHERE u."Id_Usuario" = $1 AND r."Nombre_Rol" = 'operario' AND u."Estado" = 'activo'`,
      [Id_Operario]
    )
    if (operario.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Operario no encontrado o no activo' })
    }

    const { rows: orden } = await db.query(
      `SELECT x."Id_Orden" FROM ${SQL_ORDENES_OP} x
       WHERE x."Id_Orden" = $1 AND x."Id_Operario" = $2`,
      [Id_Orden, Id_Operario]
    )
    if (orden.length === 0) {
      return res.status(400).json({ ok: false, mensaje: 'La orden no pertenece a este operario' })
    }

    const { rows: result } = await db.query(
      `INSERT INTO observacion_operario ("Id_Operario", "Id_Orden", "Id_Admin", "Observacion")
       VALUES ($1, $2, $3, $4)
       RETURNING "Id_Observacion"`,
      [Id_Operario, Id_Orden, Id_Admin, Observacion]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Observación registrada correctamente',
      data: { Id_Observacion: result[0].Id_Observacion, Id_Operario, Id_Orden, Id_Admin, Observacion }
    })
  } catch (err) {
    console.error('Error en POST /eficiencia/observaciones:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno al registrar la observación' })
  }
})

// ---------------------------------------------------------------
// GET /api/eficiencia/observaciones/:id
// ---------------------------------------------------------------
router.get('/observaciones/:id', async (req, res) => {
  const { id } = req.params
  const { Id_Orden } = req.query

  let sql = `
    SELECT ob."Id_Observacion", ob."Id_Orden", ob."Observacion", ob."Fecha",
           u."Nombre_Completo" AS "Admin"
    FROM observacion_operario ob
    INNER JOIN usuario u ON ob."Id_Admin" = u."Id_Usuario"
    WHERE ob."Id_Operario" = $1
  `
  const params = [id]

  if (Id_Orden) {
    sql += ` AND ob."Id_Orden" = $2`
    params.push(Id_Orden)
  }

  sql += ` ORDER BY ob."Fecha" DESC`

  try {
    const { rows } = await db.query(sql, params)
    res.json({ ok: true, total: rows.length, data: rows })
  } catch (err) {
    console.error('Error en GET /eficiencia/observaciones/:id:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno al cargar las observaciones' })
  }
})

// ---------------------------------------------------------------
// GET /api/eficiencia/operarios/:id/historial
// Rendimiento y tendencia salen de calcularRendimiento (mismas
// ventanas de 7/30/90 días), igual que el ranking general.
// ---------------------------------------------------------------
router.get('/operarios/:id/historial', async (req, res) => {
  const { id } = req.params
  const { periodo = 'semana' } = req.query

  if (isNaN(id)) {
    return res.status(400).json({ ok: false, mensaje: 'El id debe ser un número válido' })
  }

  const periodosValidos = ['semana', 'mes', 'trimestre']
  if (!periodosValidos.includes(periodo)) {
    return res.status(400).json({ ok: false, mensaje: `periodo inválido. Usa: ${periodosValidos.join(', ')}` })
  }

  const diasPeriodo = { semana: 7, mes: 30, trimestre: 90 }
  const dias = diasPeriodo[periodo]

  // Conteos por ventana (completadas, retrasos, etc.)
  const sqlConteosPeriodo = (offsetInicio, offsetFin) => `
    SELECT
      COALESCE(SUM(op."Unidades_Realizadas"), 0) AS total_unidades,
      COUNT(CASE WHEN op."Estado" = 'Completada' THEN 1 END) AS completadas,
      COUNT(CASE WHEN op."Estado" IN ('En Proceso','Retrasada') THEN 1 END) AS en_curso,
      COUNT(
        CASE
          WHEN op."Estado" = 'Retrasada'
            OR (CURRENT_DATE > op."Fecha_Limite" AND op."Estado" = 'En Proceso')
          THEN 1
        END
      ) AS retrasos,
      COUNT(
        CASE WHEN (SELECT COUNT(*) FROM observacion_operario ob5 WHERE ob5."Id_Orden" = op."Id_Orden") > 0
        THEN 1 END
      ) AS con_problema
    FROM ${SQL_ORDENES_OP} op
    WHERE op."Id_Operario" = $1
      AND op."Fecha_Creacion" >= CURRENT_DATE - INTERVAL '${offsetInicio} days'
      AND op."Fecha_Creacion" <  CURRENT_DATE - INTERVAL '${offsetFin} days'
  `

  try {
    const { rows: operario } = await db.query(
      `SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario"
       FROM usuario u
       INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol" AND r."Nombre_Rol" = 'operario'
       WHERE u."Id_Usuario" = $1 AND u."Estado" = 'activo'`,
      [id]
    )

    if (operario.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró operario con id ${id}` })
    }

    const { rows: actual }   = await db.query(sqlConteosPeriodo(dias, 0), [id])
    const { rows: anterior } = await db.query(sqlConteosPeriodo(dias * 2, dias), [id])

    const m = (await calcularRendimiento(db, { dias })).get(Number(id))

    const ppd_actual   = m ? m.prendas_por_dia  : 0
    const ppd_anterior = m ? m.anterior_por_dia : 0
    const tendencia    = m ? m.tendencia        : 'estable'
    const diferencia   = ppd_actual - ppd_anterior

    res.json({
      ok: true,
      data: {
        operario: operario[0],
        periodo,
        dias,
        actual: {
          prendas_por_dia: ppd_actual,
          total_unidades:  actual[0].total_unidades,
          completadas:     actual[0].completadas,
          en_curso:        actual[0].en_curso,
          retrasos:        actual[0].retrasos,
          con_problema:    actual[0].con_problema,
          rendimiento:     m ? m.rendimiento : 'Medio'
        },
        anterior: {
          prendas_por_dia: ppd_anterior,
          total_unidades:  anterior[0].total_unidades,
          completadas:     anterior[0].completadas,
          retrasos:        anterior[0].retrasos,
          rendimiento:     null
        },
        tendencia,
        diferencia_prendas: Math.round(diferencia * 10) / 10
      }
    })
  } catch (err) {
    console.error('Error en GET /eficiencia/operarios/:id/historial:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno al cargar el historial' })
  }
})

// ---------------------------------------------------------------
// DELETE /api/eficiencia/observaciones/:id
// ---------------------------------------------------------------
router.delete('/observaciones/:id', async (req, res) => {
  const { id } = req.params

  if (isNaN(id)) {
    return res.status(400).json({ ok: false, mensaje: 'El id debe ser un número válido' })
  }

  try {
    const { rows: obs } = await db.query(
      `SELECT "Id_Observacion" FROM observacion_operario WHERE "Id_Observacion" = $1`,
      [id]
    )

    if (obs.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró la observación con id ${id}` })
    }

    await db.query(`DELETE FROM observacion_operario WHERE "Id_Observacion" = $1`, [id])

    res.json({ ok: true, mensaje: 'Observación eliminada correctamente' })
  } catch (err) {
    console.error('Error en DELETE /eficiencia/observaciones/:id:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno al eliminar la observación' })
  }
})

export default router