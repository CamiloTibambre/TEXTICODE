import { Router } from 'express'
import pool from '../db.js'
import { notificarCambioEstado } from '../services/emailService.js'
import { hasRole, requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'

const router = Router()

function emitirFaseActualizada(empresaId, datos) {
  if (process.env.NODE_ENV === 'test') return
  import('../services/realtime.js')
    .then(modulo => modulo.emitirFaseActualizada(empresaId, datos))
    .catch(error => console.error('[realtime] No se pudo emitir el cambio de fase:', error.message))
}

function sincronizarCalendario(idOrden, empresaId) {
  if (process.env.NODE_ENV === 'test') return
  import('./googleCalendar.js')
    .then(modulo => modulo.programarSincronizacionOrden(idOrden, empresaId))
    .catch(error => console.error('[google/auto] No se pudo programar la fase:', error.message))
}

// Avisa al cliente por correo cuando su orden pasa a Completada.
// Corre despues de responder y nunca rompe la peticion si el correo falla.
async function notificarOrdenCompletada(idOrden, empresaId) {
  try {
    const { rows } = await pool.query(`
      SELECT u."Correo", u."Nombre_Completo",
             COALESCE(op."Producto", op."Descripcion") AS "Productos"
      FROM orden_produccion op
      INNER JOIN usuario u ON u."Id_Usuario" = op."Id_Cliente"
      INNER JOIN usuario_empresa ue ON ue."Id_Usuario" = u."Id_Usuario" AND ue."Id_Empresa" = op."Id_Empresa"
      WHERE op."Id_Orden" = $1 AND op."Id_Empresa" = $2
    `, [idOrden, empresaId])
    const o = rows[0]
    if (!o || !o.Correo) return
    await notificarCambioEstado({
      empresaId,
      ordenId: idOrden,
      clienteEmail: o.Correo,
      clienteNombre: o.Nombre_Completo,
      estado: 'Completada',
      productos: o.Productos || '',
    })
  } catch (err) {
    console.error('[orden_operario] No se pudo enviar el correo de orden completada:', err.message)
  }
}

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// Progreso en dos niveles:
//  1) por fase: operarios completados / operarios asignados a esa fase
//  2) por orden: promedio del avance de las fases DISTINTAS
// Una fase compartida solo llega a 100% cuando todos sus operarios completan.
async function recalcularProgresoOrden(client, idOrden, empresaId) {
  const ordenResult = await client.query(
    `SELECT "Cantidad", ("Fecha_Limite"::date < (NOW() AT TIME ZONE 'America/Bogota')::date) AS "Vencida" FROM orden_produccion WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2`,
    [idOrden, empresaId]
  )

  if (ordenResult.rows.length === 0) {
    throw new Error('Orden no encontrada')
  }

  const cantidadTotal = Number(ordenResult.rows[0].Cantidad) || 0
  // Si la fecha limite ya paso y la orden no esta completa, queda 'Retrasada'.
  const estadoPendiente = ordenResult.rows[0].Vencida === true ? 'Retrasada' : 'En Proceso'
  if (cantidadTotal <= 0) {
    await client.query(
      'UPDATE orden_produccion SET "Unidades_Realizadas" = 0, "Estado" = $1 WHERE "Id_Orden" = $2 AND "Id_Empresa" = $3',
      [estadoPendiente, idOrden, empresaId]
    )
    return { unidadesRealizadas: 0, estado: estadoPendiente, progreso: 0 }
  }

  // Avance real por fase: prendas hechas / prendas de la fase. Cada operario
  // tiene una cuota (reparto equitativo); una fase completada cuenta su cuota entera.
  const fasesResult = await client.query(`
    WITH base AS (
      SELECT oo."Numero_Fase", oo."Estado_Fase", oo."Cantidad_Realizada",
             (ROW_NUMBER() OVER (PARTITION BY oo."Numero_Fase" ORDER BY oo."Id_Orden_Operario") - 1)::int AS idx,
             (COUNT(*) OVER (PARTITION BY oo."Numero_Fase"))::int AS n
      FROM orden_operario oo
      WHERE oo."Id_Orden" = $1 AND oo."Id_Empresa" = $2
    ),
    cuotas AS (
      SELECT "Numero_Fase", "Estado_Fase", COALESCE("Cantidad_Realizada", 0) AS hecho,
             ($3::int / n) + CASE WHEN idx < ($3::int % n) THEN 1 ELSE 0 END AS cuota
      FROM base
    ),
    fases AS (
      SELECT "Numero_Fase",
             CASE
               WHEN SUM(cuota) = 0 THEN
                 COUNT(*) FILTER (WHERE "Estado_Fase" = 'Completada')::numeric / COUNT(*)
               ELSE
                 LEAST(1, SUM(CASE WHEN "Estado_Fase" = 'Completada' THEN cuota ELSE LEAST(hecho, cuota) END)::numeric / SUM(cuota))
             END AS avance
      FROM cuotas
      GROUP BY "Numero_Fase"
    )
    SELECT
      COUNT(*)::int             AS "Total_Fases",
      COALESCE(AVG(avance), 0)  AS "Progreso",
      COALESCE(MIN(avance), 0)  AS "Avance_Min"
    FROM fases
  `, [idOrden, empresaId, cantidadTotal])

  const totalFases = Number(fasesResult.rows[0].Total_Fases) || 0
  const progreso = Number(fasesResult.rows[0].Progreso) || 0
  const todasCompletas = totalFases > 0 && Number(fasesResult.rows[0].Avance_Min) >= 1

  const unidadesRealizadas = todasCompletas
    ? cantidadTotal
    : Math.min(cantidadTotal, Math.max(0, Math.round(progreso * cantidadTotal)))
  const estado = todasCompletas ? 'Completada' : estadoPendiente

  await client.query(`
    UPDATE orden_produccion
    SET "Unidades_Realizadas" = $1, "Estado" = $2
    WHERE "Id_Orden" = $3 AND "Id_Empresa" = $4
  `, [unidadesRealizadas, estado, idOrden, empresaId])

  return { unidadesRealizadas, estado, progreso }
}

// POST crear fase/operario para una orden.
// Varios operarios pueden compartir el mismo Numero_Fase.
router.post('/', requireRoles('admin'), async (req, res) => {
  const { Id_Orden, Id_Operario, Numero_Fase, Descripcion_Fase } = req.body
  const idOrden = toPositiveInt(Id_Orden)
  const idOperario = toPositiveInt(Id_Operario)
  const numeroFase = toPositiveInt(Numero_Fase)
  // Se ignoran Id_Empresa/empresaId del body, query y params.
  const empresaId = req.auth.empresaId

  if (!idOrden || !idOperario || !numeroFase) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(`
      INSERT INTO orden_operario
        ("Id_Orden", "Id_Operario", "Numero_Fase", "Descripcion_Fase", "Id_Empresa")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [idOrden, idOperario, numeroFase, Descripcion_Fase || null, empresaId])

    // Una fase nueva (o un operario nuevo en una fase) cambia el avance.
    await recalcularProgresoOrden(client, idOrden, empresaId)

    await client.query('COMMIT')
    res.status(201).json(rows[0])
    sincronizarCalendario(idOrden, empresaId)
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese operario ya está asignado a esa fase en la orden' })
    }
    if (err.code === '23503') return res.status(400).json({ error: 'La orden o el operario no existe o no pertenece a esta empresa' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  } finally {
    client.release()
  }
})

// GET fases de una orden, ordenadas por Numero_Fase
router.get('/orden/:idOrden', requireRoles('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT oo.*, u."Nombre_Completo" AS "Nombre_Operario"
      FROM orden_operario oo
      INNER JOIN usuario u ON oo."Id_Operario" = u."Id_Usuario"
      INNER JOIN usuario_empresa ue ON ue."Id_Usuario" = u."Id_Usuario" AND ue."Id_Empresa" = oo."Id_Empresa"
      WHERE oo."Id_Orden" = $1 AND oo."Id_Empresa" = $2
      ORDER BY oo."Numero_Fase" ASC, oo."Id_Orden_Operario" ASC
    `, [req.params.idOrden, req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// GET fases asignadas a un operario en todas las ordenes
router.get('/operario/:idOperario', requireSelfParamOrRoles('idOperario', 'admin'), async (req, res) => {
  try {
    const usaPaginacion = req.query.page != null || req.query.limit != null
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))
    const search = String(req.query.search || '').trim()
    const estado = String(req.query.estado || '').trim().toLowerCase()
    const prioridad = String(req.query.prioridad || '').trim().toLowerCase()
    const params = [req.params.idOperario, req.auth.empresaId]
    const filtros = []

    if (search) {
      params.push(`%${search}%`)
      filtros.push(`(
        op."Producto" ILIKE $${params.length}
        OR op."Descripcion" ILIKE $${params.length}
        OR oo."Descripcion_Fase" ILIKE $${params.length}
        OR CAST(op."Id_Orden" AS TEXT) ILIKE $${params.length}
      )`)
    }
    if (prioridad) {
      params.push(prioridad)
      filtros.push(`LOWER(COALESCE(op."Prioridad", 'Media')) = $${params.length}`)
    }
    if (estado === 'completado') filtros.push(`oo."Estado_Fase" = 'Completada'`)
    if (estado === 'pendiente') filtros.push(`oo."Estado_Fase" <> 'Completada' AND (op."Fecha_Limite" IS NULL OR op."Fecha_Limite"::date >= CURRENT_DATE)`)
    if (estado === 'retrasado') filtros.push(`oo."Estado_Fase" <> 'Completada' AND op."Fecha_Limite"::date < CURRENT_DATE`)

    const whereFiltros = filtros.length ? ` AND ${filtros.join(' AND ')}` : ''
    const consultaBase = `
      SELECT
        oo.*,
        uop."Nombre_Completo" AS "Nombre_Operario",
        op."Producto",
        op."Descripcion" AS "Descripcion_Orden",
        op."Cantidad",
        op."Unidades_Realizadas",
        op."Estado" AS "Estado_Orden",
        op."Prioridad",
        op."Fecha_Limite",
        op."Fecha_Creacion",
        op."Id_Cliente",
        cli."Nombre_Completo" AS "Cliente",
        materiales."Materiales",
        (op."Cantidad"::int / cnt.total) + CASE WHEN cnt.idx < op."Cantidad"::int % cnt.total THEN 1 ELSE 0 END AS "Cuota"
      FROM orden_operario oo
      INNER JOIN LATERAL (
        SELECT COUNT(*)::int AS total,
               (COUNT(*) FILTER (WHERE x."Id_Orden_Operario" < oo."Id_Orden_Operario"))::int AS idx
        FROM orden_operario x
        WHERE x."Id_Orden" = oo."Id_Orden" AND x."Numero_Fase" = oo."Numero_Fase" AND x."Id_Empresa" = oo."Id_Empresa"
      ) cnt ON TRUE
      INNER JOIN orden_produccion op ON oo."Id_Orden" = op."Id_Orden"
      INNER JOIN usuario uop ON oo."Id_Operario" = uop."Id_Usuario"
      INNER JOIN usuario cli ON op."Id_Cliente" = cli."Id_Usuario"
      INNER JOIN usuario_empresa ue_op ON ue_op."Id_Usuario" = uop."Id_Usuario" AND ue_op."Id_Empresa" = oo."Id_Empresa"
      INNER JOIN usuario_empresa ue_cli ON ue_cli."Id_Usuario" = cli."Id_Usuario" AND ue_cli."Id_Empresa" = op."Id_Empresa"
      LEFT JOIN LATERAL (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'Id_Material', material_orden."Id_Material",
              'Nombre_Material', material_orden."Nombre_Material",
              'Cantidad_Usada', material_orden."Cantidad_Usada"
            ) ORDER BY material_orden."Nombre_Material"
          ),
          '[]'::jsonb
        ) AS "Materiales"
        FROM (
          SELECT DISTINCT ON (m2."Id_Material")
            m2."Id_Material", m2."Nombre_Material", asociados."Cantidad_Usada"
          FROM (
            SELECT om."Id_Producto" AS "Id_Material", om."Cantidad_Usada"
            FROM orden_material om
            WHERE om."Id_Orden" = op."Id_Orden" AND om."Id_Empresa" = op."Id_Empresa"
            UNION ALL
            SELECT op."Id_Material", NULL
            WHERE op."Id_Material" IS NOT NULL
          ) asociados
          INNER JOIN material m2
            ON m2."Id_Material" = asociados."Id_Material"
           AND m2."Id_Empresa" = op."Id_Empresa"
          ORDER BY m2."Id_Material", asociados."Cantidad_Usada" NULLS LAST
        ) material_orden
      ) materiales ON TRUE
      WHERE oo."Id_Operario" = $1 AND oo."Id_Empresa" = $2
        AND op."Id_Empresa" = $2${whereFiltros}`

    if (!usaPaginacion) {
      const { rows } = await pool.query(`${consultaBase}
        ORDER BY op."Fecha_Limite" ASC NULLS LAST, oo."Numero_Fase" ASC
      `, params)
      return res.json(rows)
    }

    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM orden_operario oo
      INNER JOIN orden_produccion op
        ON op."Id_Orden" = oo."Id_Orden" AND op."Id_Empresa" = oo."Id_Empresa"
      WHERE oo."Id_Operario" = $1 AND oo."Id_Empresa" = $2${whereFiltros}
    `, params)

    const summaryResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE oo."Estado_Fase" = 'Completada')::int AS completadas,
        COUNT(*) FILTER (
          WHERE oo."Estado_Fase" <> 'Completada'
            AND (op."Fecha_Limite" IS NULL OR op."Fecha_Limite"::date >= CURRENT_DATE)
        )::int AS pendientes,
        COUNT(*) FILTER (
          WHERE oo."Estado_Fase" <> 'Completada' AND op."Fecha_Limite"::date < CURRENT_DATE
        )::int AS retrasadas
      FROM orden_operario oo
      INNER JOIN orden_produccion op
        ON op."Id_Orden" = oo."Id_Orden" AND op."Id_Empresa" = oo."Id_Empresa"
      WHERE oo."Id_Operario" = $1 AND oo."Id_Empresa" = $2
    `, [req.params.idOperario, req.auth.empresaId])

    const offset = (page - 1) * limit
    const dataParams = [...params, limit, offset]
    const { rows } = await pool.query(`${consultaBase}
      ORDER BY op."Fecha_Limite" ASC NULLS LAST, oo."Numero_Fase" ASC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `, dataParams)
    const total = countResult.rows[0].total

    res.json({
      data: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      summary: summaryResult.rows[0],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// GET historial persistente de fases completadas de un operario.
router.get('/operario/:idOperario/historial', requireSelfParamOrRoles('idOperario', 'admin'), async (req, res) => {
  try {
    const usaPaginacion = req.query.page != null || req.query.limit != null
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))
    const search = String(req.query.search || '').trim()
    const desde = String(req.query.desde || '').trim()
    const hasta = String(req.query.hasta || '').trim()
    const fechaValida = value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value)
    if (!fechaValida(desde) || !fechaValida(hasta)) {
      return res.status(400).json({ error: 'Las fechas deben tener formato YYYY-MM-DD.' })
    }

    const params = [req.params.idOperario, req.auth.empresaId]
    const filtros = []
    if (search) {
      params.push(`%${search}%`)
      filtros.push(`(
        op."Producto" ILIKE $${params.length}
        OR op."Descripcion" ILIKE $${params.length}
        OR oo."Descripcion_Fase" ILIKE $${params.length}
        OR CAST(op."Id_Orden" AS TEXT) ILIKE $${params.length}
      )`)
    }
    if (desde) {
      params.push(desde)
      filtros.push(`oo."Fecha_Completada"::date >= $${params.length}::date`)
    }
    if (hasta) {
      params.push(hasta)
      filtros.push(`oo."Fecha_Completada"::date <= $${params.length}::date`)
    }
    const whereFiltros = filtros.length ? ` AND ${filtros.join(' AND ')}` : ''
    const consultaBase = `
      SELECT
        oo.*, uop."Nombre_Completo" AS "Nombre_Operario", op."Producto",
        op."Descripcion" AS "Descripcion_Orden", op."Cantidad",
        op."Unidades_Realizadas", op."Estado" AS "Estado_Orden", op."Prioridad",
        op."Fecha_Limite", op."Fecha_Creacion", op."Id_Cliente",
        cli."Nombre_Completo" AS "Cliente",
        CASE
          WHEN oo."Fecha_Completada" IS NULL OR op."Fecha_Limite" IS NULL THEN NULL
          WHEN oo."Fecha_Completada"::date <= op."Fecha_Limite"::date THEN true
          ELSE false
        END AS "Completada_A_Tiempo",
        (op."Cantidad"::int / cnt.total) + CASE WHEN cnt.idx < op."Cantidad"::int % cnt.total THEN 1 ELSE 0 END AS "Cuota"
      FROM orden_operario oo
      INNER JOIN LATERAL (
        SELECT COUNT(*)::int AS total,
               (COUNT(*) FILTER (WHERE x."Id_Orden_Operario" < oo."Id_Orden_Operario"))::int AS idx
        FROM orden_operario x
        WHERE x."Id_Orden" = oo."Id_Orden" AND x."Numero_Fase" = oo."Numero_Fase" AND x."Id_Empresa" = oo."Id_Empresa"
      ) cnt ON TRUE
      INNER JOIN orden_produccion op ON oo."Id_Orden" = op."Id_Orden"
      INNER JOIN usuario uop ON oo."Id_Operario" = uop."Id_Usuario"
      INNER JOIN usuario cli ON op."Id_Cliente" = cli."Id_Usuario"
      INNER JOIN usuario_empresa ue_op ON ue_op."Id_Usuario" = uop."Id_Usuario" AND ue_op."Id_Empresa" = oo."Id_Empresa"
      INNER JOIN usuario_empresa ue_cli ON ue_cli."Id_Usuario" = cli."Id_Usuario" AND ue_cli."Id_Empresa" = op."Id_Empresa"
      WHERE oo."Id_Operario" = $1 AND oo."Id_Empresa" = $2
        AND op."Id_Empresa" = $2
        AND oo."Estado_Fase" = 'Completada'${whereFiltros}`

    if (!usaPaginacion) {
      const { rows } = await pool.query(`${consultaBase}
        ORDER BY oo."Fecha_Completada" DESC NULLS LAST, oo."updated_at" DESC
      `, params)
      return res.json(rows)
    }

    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM orden_operario oo
      INNER JOIN orden_produccion op
        ON op."Id_Orden" = oo."Id_Orden" AND op."Id_Empresa" = oo."Id_Empresa"
      WHERE oo."Id_Operario" = $1 AND oo."Id_Empresa" = $2
        AND oo."Estado_Fase" = 'Completada'${whereFiltros}
    `, params)
    const offset = (page - 1) * limit
    const dataParams = [...params, limit, offset]
    const { rows } = await pool.query(`${consultaBase}
      ORDER BY oo."Fecha_Completada" DESC NULLS LAST, oo."updated_at" DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `, dataParams)
    const total = countResult.rows[0].total
    res.json({
      data: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// PUT editar numero y/o descripcion de fase
router.put('/:id', requireRoles('admin'), async (req, res) => {
  const { Numero_Fase, Descripcion_Fase } = req.body
  const numeroFase = Numero_Fase == null ? null : toPositiveInt(Numero_Fase)
  // Se ignoran Id_Empresa/empresaId del body, query y params.
  const empresaId = req.auth.empresaId

  if (Numero_Fase != null && !numeroFase) {
    return res.status(400).json({ error: 'Numero_Fase inválido' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const currentResult = await client.query(
      'SELECT * FROM orden_operario WHERE "Id_Orden_Operario" = $1 AND "Id_Empresa" = $2 FOR UPDATE',
      [req.params.id, empresaId]
    )

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Fase no encontrada' })
    }

    const current = currentResult.rows[0]
    let numeroFaseForUpdate = numeroFase
    if (numeroFase && numeroFase !== current.Numero_Fase) {
      // Solo hay conflicto real si ESTE MISMO operario ya tiene ese número de
      // fase en la orden. Otros operarios en esa fase = fase compartida (válido).
      const conflictResult = await client.query(`
        SELECT *
        FROM orden_operario
        WHERE "Id_Orden" = $1
          AND "Numero_Fase" = $2
          AND "Id_Operario" = $3
          AND "Id_Orden_Operario" <> $4 AND "Id_Empresa" = $5
        FOR UPDATE
      `, [current.Id_Orden, numeroFase, current.Id_Operario, req.params.id, empresaId])

      if (conflictResult.rows.length > 0) {
        const conflict = conflictResult.rows[0]
        const tempNumero = 1000000 + Number(conflict.Id_Orden_Operario)
        await client.query(
          'UPDATE orden_operario SET "Numero_Fase" = $1 WHERE "Id_Orden_Operario" = $2 AND "Id_Empresa" = $3',
          [tempNumero, conflict.Id_Orden_Operario, empresaId]
        )
        await client.query(
          'UPDATE orden_operario SET "Numero_Fase" = $1 WHERE "Id_Orden_Operario" = $2 AND "Id_Empresa" = $3',
          [numeroFase, current.Id_Orden_Operario, empresaId]
        )
        await client.query(
          'UPDATE orden_operario SET "Numero_Fase" = $1 WHERE "Id_Orden_Operario" = $2 AND "Id_Empresa" = $3',
          [current.Numero_Fase, conflict.Id_Orden_Operario, empresaId]
        )
        numeroFaseForUpdate = null
      }
    }

    const { rows } = await client.query(`
      UPDATE orden_operario
      SET
        "Numero_Fase" = COALESCE($1, "Numero_Fase"),
        "Descripcion_Fase" = COALESCE($2, "Descripcion_Fase")
      WHERE "Id_Orden_Operario" = $3 AND "Id_Empresa" = $4
      RETURNING *
    `, [numeroFaseForUpdate, Descripcion_Fase, req.params.id, empresaId])

    // Cambiar el número de fase puede agrupar/desagrupar operarios.
    await recalcularProgresoOrden(client, current.Id_Orden, empresaId)

    await client.query('COMMIT')
    res.json(rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese operario ya está asignado a esa fase en la orden' })
    }
    if (err.code === '23503') return res.status(400).json({ error: 'La orden o el operario no existe o no pertenece a esta empresa' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  } finally {
    client.release()
  }
})

// DELETE quitar fase de una orden
router.delete('/:id', requireRoles('admin'), async (req, res) => {
  const empresaId = req.auth.empresaId
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      'DELETE FROM orden_operario WHERE "Id_Orden_Operario" = $1 AND "Id_Empresa" = $2 RETURNING "Id_Orden"',
      [req.params.id, empresaId]
    )

    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Fase no encontrada' })
    }

    await recalcularProgresoOrden(client, rows[0].Id_Orden, empresaId)

    await client.query('COMMIT')
    res.json({ mensaje: 'Fase eliminada de la orden' })
    sincronizarCalendario(rows[0].Id_Orden, empresaId)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  } finally {
    client.release()
  }
})

// Cuota de un operario dentro de su fase (reparto equitativo; el resto va a los primeros).
async function calcularCuota(client, fase, cantidadTotal, empresaId) {
  const companeros = await client.query(`
    SELECT "Id_Orden_Operario"
    FROM orden_operario
    WHERE "Id_Orden" = $1 AND "Numero_Fase" = $2 AND "Id_Empresa" = $3
    ORDER BY "Id_Orden_Operario" ASC
  `, [fase.Id_Orden, fase.Numero_Fase, empresaId])
  const n = companeros.rows.length || 1
  const indice = Math.max(
    0,
    companeros.rows.findIndex(r => Number(r.Id_Orden_Operario) === Number(fase.Id_Orden_Operario))
  )
  return Math.floor(cantidadTotal / n) + (indice < cantidadTotal % n ? 1 : 0)
}

// PATCH reportar avance parcial de una fase.
// Body: { Cantidad_Realizada: <total de prendas terminadas hasta ahora>, Nota_Operario?: string }
// La fase solo se completa cuando Cantidad_Realizada alcanza la cuota del operario.
router.patch('/:id/avance', async (req, res) => {
  const empresaId = req.auth.empresaId
  const cantidad = Number(req.body.Cantidad_Realizada)
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    return res.status(400).json({ error: 'Cantidad_Realizada debe ser un número entero mayor o igual a 0.' })
  }
  const nota = typeof req.body.Nota_Operario === 'string'
    ? req.body.Nota_Operario.trim() || null
    : null

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const faseResult = await client.query(`
      SELECT oo.*, op."Cantidad"
      FROM orden_operario oo
      INNER JOIN orden_produccion op ON oo."Id_Orden" = op."Id_Orden"
      WHERE oo."Id_Orden_Operario" = $1 AND oo."Id_Empresa" = $2 AND op."Id_Empresa" = $2
      FOR UPDATE OF oo
    `, [req.params.id, empresaId])

    if (faseResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Fase no encontrada' })
    }

    const fase = faseResult.rows[0]
    if (!hasRole(req.auth, ['admin']) && Number(fase.Id_Operario) !== Number(req.auth.id)) {
      await client.query('ROLLBACK')
      return res.status(403).json({ error: 'No tienes permisos para reportar avance en esta fase.' })
    }
    if (fase.Estado_Fase === 'Completada') {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Esta fase ya está completada.' })
    }

    const cuota = await calcularCuota(client, fase, Number(fase.Cantidad) || 0, empresaId)
    if (cantidad > cuota) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `No puedes reportar más de tu cuota (${cuota} prendas).` })
    }

    const completa = cantidad === cuota
    const updateFase = await client.query(`
      UPDATE orden_operario
      SET "Cantidad_Realizada" = $1,
          "Estado_Fase" = CASE WHEN $2::boolean THEN 'Completada' ELSE 'Pendiente' END,
          "Nota_Operario" = COALESCE($3, "Nota_Operario"),
          "Fecha_Completada" = CASE WHEN $2::boolean THEN COALESCE("Fecha_Completada", NOW()) ELSE NULL END
      WHERE "Id_Orden_Operario" = $4 AND "Id_Empresa" = $5
      RETURNING *
    `, [cantidad, completa, nota, req.params.id, empresaId])

    const estadoPrevio = (await client.query(
      'SELECT "Estado" FROM orden_produccion WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2', [fase.Id_Orden, empresaId]
    )).rows[0]?.Estado
    const progresoOrden = await recalcularProgresoOrden(client, fase.Id_Orden, empresaId)

    await client.query('COMMIT')
    res.json({
      mensaje: completa ? 'Fase completada' : 'Avance guardado',
      fase: updateFase.rows[0],
      cuota,
      orden: progresoOrden,
    })
    emitirFaseActualizada(empresaId, {
      idOrden: fase.Id_Orden,
      idOrdenOperario: fase.Id_Orden_Operario,
      idOperario: fase.Id_Operario,
      numeroFase: fase.Numero_Fase,
      estadoFase: updateFase.rows[0].Estado_Fase,
      estadoOrden: progresoOrden.estado,
    })

    if (progresoOrden.estado === 'Completada' && estadoPrevio !== 'Completada') {
      notificarOrdenCompletada(fase.Id_Orden, empresaId)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  } finally {
    client.release()
  }
})

// PATCH completar una fase de golpe (queda para admin y compatibilidad).
router.patch('/:id/completar', async (req, res) => {
  const empresaId = req.auth.empresaId
  const nota = typeof req.body.Nota_Operario === 'string'
    ? req.body.Nota_Operario.trim() || null
    : null
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const faseResult = await client.query(`
      SELECT oo.*, op."Cantidad"
      FROM orden_operario oo
      INNER JOIN orden_produccion op ON oo."Id_Orden" = op."Id_Orden"
      WHERE oo."Id_Orden_Operario" = $1 AND oo."Id_Empresa" = $2 AND op."Id_Empresa" = $2
      FOR UPDATE
    `, [req.params.id, empresaId])

    if (faseResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Fase no encontrada' })
    }

    const fase = faseResult.rows[0]
    if (!hasRole(req.auth, ['admin']) && Number(fase.Id_Operario) !== Number(req.auth.id)) {
      await client.query('ROLLBACK')
      return res.status(403).json({ error: 'No tienes permisos para completar esta fase.' })
    }
    if (fase.Estado_Fase === 'Completada') {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Esta fase ya está completada.' })
    }

    const cantidadTotal = Number(fase.Cantidad) || 0

    // Operarios que comparten esta misma fase (incluido el actual).
    const companerosResult = await client.query(`
      SELECT "Id_Orden_Operario"
      FROM orden_operario
      WHERE "Id_Orden" = $1 AND "Numero_Fase" = $2 AND "Id_Empresa" = $3
      ORDER BY "Id_Orden_Operario" ASC
    `, [fase.Id_Orden, fase.Numero_Fase, empresaId])

    const n = companerosResult.rows.length || 1
    const indice = Math.max(
      0,
      companerosResult.rows.findIndex(r => Number(r.Id_Orden_Operario) === Number(fase.Id_Orden_Operario))
    )
    // Su parte de la fase: reparto equitativo; el resto va a los primeros.
    const cuota = Math.floor(cantidadTotal / n) + (indice < cantidadTotal % n ? 1 : 0)

    const updateFase = await client.query(`
      UPDATE orden_operario
      SET "Cantidad_Realizada" = $1,
          "Estado_Fase" = 'Completada',
          "Nota_Operario" = $2,
          "Fecha_Completada" = COALESCE("Fecha_Completada", NOW())
      WHERE "Id_Orden_Operario" = $3 AND "Id_Empresa" = $4
      RETURNING *
    `, [cuota, nota, req.params.id, empresaId])

    const estadoPrevio = (await client.query(
      'SELECT "Estado" FROM orden_produccion WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2', [fase.Id_Orden, empresaId]
    )).rows[0]?.Estado
    const progresoOrden = await recalcularProgresoOrden(client, fase.Id_Orden, empresaId)

    await client.query('COMMIT')
    res.json({
      mensaje: 'Fase completada',
      fase: updateFase.rows[0],
      cuota,
      orden: progresoOrden,
    })
    emitirFaseActualizada(empresaId, {
      idOrden: fase.Id_Orden,
      idOrdenOperario: fase.Id_Orden_Operario,
      idOperario: fase.Id_Operario,
      numeroFase: fase.Numero_Fase,
      estadoFase: 'Completada',
      estadoOrden: progresoOrden.estado,
    })

    // Correo al cliente (no bloquea la respuesta)
    if (progresoOrden.estado === 'Completada' && estadoPrevio !== 'Completada') {
      notificarOrdenCompletada(fase.Id_Orden, empresaId)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  } finally {
    client.release()
  }
})

export default router
