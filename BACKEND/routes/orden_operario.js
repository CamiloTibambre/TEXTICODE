import { Router } from 'express'
import pool from '../db.js'

const router = Router()

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

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
    SELECT
      COUNT(*)::int AS "Total_Fases",
      COALESCE(
        SUM(LEAST(GREATEST("Cantidad_Realizada", 0), $2)::numeric / $2),
        0
      ) AS "Suma_Progreso_Fases"
    FROM orden_operario
    WHERE "Id_Orden" = $1
  `, [idOrden, cantidadTotal])

  const totalFases = Number(fasesResult.rows[0].Total_Fases) || 0
  const sumaProgresoFases = Number(fasesResult.rows[0].Suma_Progreso_Fases) || 0
  const progreso = totalFases === 0 ? 0 : sumaProgresoFases / totalFases
  const unidadesRealizadas = Math.min(
    cantidadTotal,
    Math.max(0, Math.round(progreso * cantidadTotal))
  )
  const estado = unidadesRealizadas >= cantidadTotal ? 'Completada' : 'En Proceso'

  await client.query(`
    UPDATE orden_produccion
    SET "Unidades_Realizadas" = $1, "Estado" = $2
    WHERE "Id_Orden" = $3
  `, [unidadesRealizadas, estado, idOrden])

  return { unidadesRealizadas, estado, progreso }
}

// POST crear fase/operario para una orden
router.post('/', async (req, res) => {
  const { Id_Orden, Id_Operario, Numero_Fase, Descripcion_Fase } = req.body
  const idOrden = toPositiveInt(Id_Orden)
  const idOperario = toPositiveInt(Id_Operario)
  const numeroFase = toPositiveInt(Numero_Fase)

  if (!idOrden || !idOperario || !numeroFase) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO orden_operario
        ("Id_Orden", "Id_Operario", "Numero_Fase", "Descripcion_Fase")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [idOrden, idOperario, numeroFase, Descripcion_Fase || null])

    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una fase con ese número en la orden' })
    }
    res.status(500).json({ error: err.message })
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
      const conflictResult = await client.query(`
        SELECT *
        FROM orden_operario
        WHERE "Id_Orden" = $1
          AND "Numero_Fase" = $2
          AND "Id_Orden_Operario" <> $3
        FOR UPDATE
      `, [current.Id_Orden, numeroFase, req.params.id])

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

    await client.query('COMMIT')
    res.json(rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una fase con ese número en la orden' })
    }
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// DELETE quitar fase de una orden
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM orden_operario WHERE "Id_Orden_Operario" = $1',
      [req.params.id]
    )

    if (rowCount === 0) return res.status(404).json({ error: 'Fase no encontrada' })
    res.json({ mensaje: 'Fase eliminada de la orden' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH reportar avance incremental de una fase
router.patch('/:id/avance', async (req, res) => {
  const unidadesSesion = toPositiveInt(req.body.unidadesSesion)
  if (!unidadesSesion) {
    return res.status(400).json({ error: 'unidadesSesion debe ser mayor que 0' })
  }

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
    const cantidadActual = Number(fase.Cantidad_Realizada) || 0
    const nuevaCantidad = Math.min(cantidadTotal, cantidadActual + unidadesSesion)
    const estadoFase = nuevaCantidad >= cantidadTotal ? 'Completada' : 'En Proceso'

    const updateFase = await client.query(`
      UPDATE orden_operario
      SET "Cantidad_Realizada" = $1, "Estado_Fase" = $2
      WHERE "Id_Orden_Operario" = $3
      RETURNING *
    `, [nuevaCantidad, estadoFase, req.params.id])

    const progresoOrden = await recalcularProgresoOrden(client, fase.Id_Orden)

    await client.query('COMMIT')
    res.json({
      mensaje: 'Avance registrado',
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

