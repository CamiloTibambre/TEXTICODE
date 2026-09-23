import { Router } from 'express'
import pool from '../db.js'

const router = Router()

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// Progreso en dos niveles:
//  1) por fase: operarios completados / operarios asignados a esa fase
//  2) por orden: promedio del avance de las fases DISTINTAS
// Una fase compartida solo llega a 100% cuando todos sus operarios completan.
async function recalcularProgresoOrden(client, idOrden) {
  const ordenResult = await client.query(
    'SELECT "Cantidad" FROM orden_produccion WHERE "Id_Orden" = $1',
    [idOrden]
  )

  if (ordenResult.rows.length === 0) {
    throw new Error('Orden no encontrada')
  }

  const cantidadTotal = Number(ordenResult.rows[0].Cantidad) || 0
  if (cantidadTotal <= 0) {
    await client.query(
      'UPDATE orden_produccion SET "Unidades_Realizadas" = 0, "Estado" = $1 WHERE "Id_Orden" = $2',
      ['En Proceso', idOrden]
    )
    return { unidadesRealizadas: 0, estado: 'En Proceso', progreso: 0 }
  }

  const fasesResult = await client.query(`
    WITH fases AS (
      SELECT
        "Numero_Fase",
        COUNT(*) FILTER (WHERE "Estado_Fase" = 'Completada')::numeric / COUNT(*) AS avance
      FROM orden_operario
      WHERE "Id_Orden" = $1
      GROUP BY "Numero_Fase"
    )
    SELECT
      COUNT(*)::int             AS "Total_Fases",
      COALESCE(AVG(avance), 0)  AS "Progreso",
      COALESCE(MIN(avance), 0)  AS "Avance_Min"
    FROM fases
  `, [idOrden])

  const totalFases = Number(fasesResult.rows[0].Total_Fases) || 0
  const progreso = Number(fasesResult.rows[0].Progreso) || 0
  const todasCompletas = totalFases > 0 && Number(fasesResult.rows[0].Avance_Min) >= 1

  const unidadesRealizadas = todasCompletas
    ? cantidadTotal
    : Math.min(cantidadTotal, Math.max(0, Math.round(progreso * cantidadTotal)))
  const estado = todasCompletas ? 'Completada' : 'En Proceso'

  await client.query(`
    UPDATE orden_produccion
    SET "Unidades_Realizadas" = $1, "Estado" = $2
    WHERE "Id_Orden" = $3
  `, [unidadesRealizadas, estado, idOrden])

  return { unidadesRealizadas, estado, progreso }
}

// POST crear fase/operario para una orden.
// Varios operarios pueden compartir el mismo Numero_Fase.
router.post('/', async (req, res) => {
  const { Id_Orden, Id_Operario, Numero_Fase, Descripcion_Fase } = req.body
  const idOrden = toPositiveInt(Id_Orden)
  const idOperario = toPositiveInt(Id_Operario)
  const numeroFase = toPositiveInt(Numero_Fase)

  if (!idOrden || !idOperario || !numeroFase) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(`
      INSERT INTO orden_operario
        ("Id_Orden", "Id_Operario", "Numero_Fase", "Descripcion_Fase")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [idOrden, idOperario, numeroFase, Descripcion_Fase || null])

    // Una fase nueva (o un operario nuevo en una fase) cambia el avance.
    await recalcularProgresoOrden(client, idOrden)

    await client.query('COMMIT')
    res.status(201).json(rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese operario ya está asignado a esa fase en la orden' })
    }
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// GET fases de una orden, ordenadas por Numero_Fase
router.get('/orden/:idOrden', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT oo.*, u."Nombre_Completo" AS "Nombre_Operario"
      FROM orden_operario oo
      INNER JOIN usuario u ON oo."Id_Operario" = u."Id_Usuario"
      WHERE oo."Id_Orden" = $1
      ORDER BY oo."Numero_Fase" ASC, oo."Id_Orden_Operario" ASC
    `, [req.params.idOrden])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET fases asignadas a un operario en todas las ordenes
router.get('/operario/:idOperario', async (req, res) => {
  try {
    const { rows } = await pool.query(`
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
        m."Nombre_Material" AS "NombreMaterial"
      FROM orden_operario oo
      INNER JOIN orden_produccion op ON oo."Id_Orden" = op."Id_Orden"
      INNER JOIN usuario uop ON oo."Id_Operario" = uop."Id_Usuario"
      INNER JOIN usuario cli ON op."Id_Cliente" = cli."Id_Usuario"
      INNER JOIN material m ON op."Id_Material" = m."Id_Material"
      WHERE oo."Id_Operario" = $1
      ORDER BY op."Fecha_Limite" ASC, oo."Numero_Fase" ASC
    `, [req.params.idOperario])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET historial persistente de fases completadas de un operario.
router.get('/operario/:idOperario/historial', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        oo.*, uop."Nombre_Completo" AS "Nombre_Operario", op."Producto",
        op."Descripcion" AS "Descripcion_Orden", op."Cantidad",
        op."Unidades_Realizadas", op."Estado" AS "Estado_Orden", op."Prioridad",
        op."Fecha_Limite", op."Id_Cliente", cli."Nombre_Completo" AS "Cliente",
        m."Nombre_Material" AS "NombreMaterial"
      FROM orden_operario oo
      INNER JOIN orden_produccion op ON oo."Id_Orden" = op."Id_Orden"
      INNER JOIN usuario uop ON oo."Id_Operario" = uop."Id_Usuario"
      INNER JOIN usuario cli ON op."Id_Cliente" = cli."Id_Usuario"
      INNER JOIN material m ON op."Id_Material" = m."Id_Material"
      WHERE oo."Id_Operario" = $1
        AND oo."Estado_Fase" = 'Completada'
      ORDER BY oo."Fecha_Completada" DESC NULLS LAST, oo."updated_at" DESC
    `, [req.params.idOperario])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT editar numero y/o descripcion de fase
router.put('/:id', async (req, res) => {
  const { Numero_Fase, Descripcion_Fase } = req.body
  const numeroFase = Numero_Fase == null ? null : toPositiveInt(Numero_Fase)

  if (Numero_Fase != null && !numeroFase) {
    return res.status(400).json({ error: 'Numero_Fase inválido' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const currentResult = await client.query(
      'SELECT * FROM orden_operario WHERE "Id_Orden_Operario" = $1 FOR UPDATE',
      [req.params.id]
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
          AND "Id_Orden_Operario" <> $4
        FOR UPDATE
      `, [current.Id_Orden, numeroFase, current.Id_Operario, req.params.id])

      if (conflictResult.rows.length > 0) {
        const conflict = conflictResult.rows[0]
        const tempNumero = 1000000 + Number(conflict.Id_Orden_Operario)
        await client.query(
          'UPDATE orden_operario SET "Numero_Fase" = $1 WHERE "Id_Orden_Operario" = $2',
          [tempNumero, conflict.Id_Orden_Operario]
        )
        await client.query(
          'UPDATE orden_operario SET "Numero_Fase" = $1 WHERE "Id_Orden_Operario" = $2',
          [numeroFase, current.Id_Orden_Operario]
        )
        await client.query(
          'UPDATE orden_operario SET "Numero_Fase" = $1 WHERE "Id_Orden_Operario" = $2',
          [current.Numero_Fase, conflict.Id_Orden_Operario]
        )
        numeroFaseForUpdate = null
      }
    }

    const { rows } = await client.query(`
      UPDATE orden_operario
      SET
        "Numero_Fase" = COALESCE($1, "Numero_Fase"),
        "Descripcion_Fase" = COALESCE($2, "Descripcion_Fase")
      WHERE "Id_Orden_Operario" = $3
      RETURNING *
    `, [numeroFaseForUpdate, Descripcion_Fase, req.params.id])

    // Cambiar el número de fase puede agrupar/desagrupar operarios.
    await recalcularProgresoOrden(client, current.Id_Orden)

    await client.query('COMMIT')
    res.json(rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese operario ya está asignado a esa fase en la orden' })
    }
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// DELETE quitar fase de una orden
router.delete('/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      'DELETE FROM orden_operario WHERE "Id_Orden_Operario" = $1 RETURNING "Id_Orden"',
      [req.params.id]
    )

    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Fase no encontrada' })
    }

    await recalcularProgresoOrden(client, rows[0].Id_Orden)

    await client.query('COMMIT')
    res.json({ mensaje: 'Fase eliminada de la orden' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// PATCH completar una fase. No se reportan prendas parciales.
router.patch('/:id/completar', async (req, res) => {
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
      WHERE oo."Id_Orden_Operario" = $1
      FOR UPDATE
    `, [req.params.id])

    if (faseResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Fase no encontrada' })
    }

    const fase = faseResult.rows[0]
    const cantidadTotal = Number(fase.Cantidad) || 0

    // Operarios que comparten esta misma fase (incluido el actual).
    const companerosResult = await client.query(`
      SELECT "Id_Orden_Operario"
      FROM orden_operario
      WHERE "Id_Orden" = $1 AND "Numero_Fase" = $2
      ORDER BY "Id_Orden_Operario" ASC
    `, [fase.Id_Orden, fase.Numero_Fase])

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
      WHERE "Id_Orden_Operario" = $3
      RETURNING *
    `, [cuota, nota, req.params.id])

    const progresoOrden = await recalcularProgresoOrden(client, fase.Id_Orden)

    await client.query('COMMIT')
    res.json({
      mensaje: 'Fase completada',
      fase: updateFase.rows[0],
      orden: progresoOrden,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

export default router