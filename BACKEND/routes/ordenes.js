import { Router } from 'express'
import pool from '../db.js'
import { hasRole, requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'

const router = Router()

// Helper: sincroniza órdenes que hayan superado su fecha límite y sigan en 'En Proceso'
export async function actualizarOrdenesRetrasadas(empresaId) {
  try {
    await pool.query(`
      UPDATE orden_produccion
      SET "Estado" = 'Retrasada'
      WHERE "Estado" = 'En Proceso'
        AND "Fecha_Limite" < CURRENT_DATE
        AND "Id_Empresa" = $1
    `, [empresaId])
  } catch (err) {
    console.error('Error actualizando órdenes retrasadas:', err.message)
  }
}

// GET todas las órdenes
router.get('/', requireRoles('admin'), async (req, res) => {
  try {
    await actualizarOrdenesRetrasadas(req.auth.empresaId)

    const { rows } = await pool.query(`
      SELECT op.*,
             u."Nombre_Completo"   AS "Cliente",
             m."Nombre_Material"   AS "NombreMaterial",
             opr."Nombre_Completo" AS "Operario"
      FROM orden_produccion op
      INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
      INNER JOIN material m ON op."Id_Material" = m."Id_Material" AND m."Id_Empresa" = op."Id_Empresa"
      LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
      WHERE op."Id_Empresa" = $1
      ORDER BY op."Fecha_Limite" ASC
    `, [req.auth.empresaId])

    res.json(rows)
  } catch (err) {
    console.error('ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET órdenes asignadas a un operario
router.get('/operario/:idOperario', requireSelfParamOrRoles('idOperario', 'admin'), async (req, res) => {
  try {
    await actualizarOrdenesRetrasadas(req.auth.empresaId)

    const { rows } = await pool.query(`
      SELECT op.*,
             u."Nombre_Completo"   AS "Cliente",
             m."Nombre_Material"   AS "NombreMaterial",
             opr."Nombre_Completo" AS "Operario"
      FROM orden_produccion op
      INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
      INNER JOIN material m ON op."Id_Material" = m."Id_Material" AND m."Id_Empresa" = op."Id_Empresa"
      LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
      WHERE op."Id_Empresa" = $2 AND (op."Id_Operario" = $1
         OR EXISTS (
              SELECT 1 FROM orden_operario oo
              WHERE oo."Id_Orden" = op."Id_Orden" AND oo."Id_Operario" = $1
                AND oo."Id_Empresa" = op."Id_Empresa"
            )
         OR EXISTS (
              SELECT 1 FROM orden_operario oo
              WHERE oo."Id_Orden" = op."Id_Orden" AND oo."Id_Operario" = $1
                AND oo."Id_Empresa" = op."Id_Empresa"
            ))
      ORDER BY op."Fecha_Limite" ASC
    `, [req.params.idOperario, req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET órdenes de un cliente
router.get('/cliente/:idCliente', requireSelfParamOrRoles('idCliente', 'admin'), async (req, res) => {
  try {
    await actualizarOrdenesRetrasadas(req.auth.empresaId)

    const { rows } = await pool.query(`
      SELECT op.*,
             u."Nombre_Completo"   AS "Cliente",
             m."Nombre_Material"   AS "NombreMaterial",
             opr."Nombre_Completo" AS "Operario"
      FROM orden_produccion op
      INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
      INNER JOIN material m ON op."Id_Material" = m."Id_Material" AND m."Id_Empresa" = op."Id_Empresa"
      LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
      WHERE op."Id_Cliente" = $1 AND op."Id_Empresa" = $2
      ORDER BY op."Fecha_Limite" ASC
    `, [req.params.idCliente, req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET orden por ID
router.get('/:id', async (req, res) => {
  try {
    await actualizarOrdenesRetrasadas(req.auth.empresaId)

    const { rows } = await pool.query(`
      SELECT op.*,
             u."Nombre_Completo"   AS "Cliente",
             m."Nombre_Material"   AS "NombreMaterial",
             opr."Nombre_Completo" AS "Operario"
      FROM orden_produccion op
      INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
      INNER JOIN material m ON op."Id_Material" = m."Id_Material" AND m."Id_Empresa" = op."Id_Empresa"
      LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
      WHERE op."Id_Orden" = $1 AND op."Id_Empresa" = $2
    `, [req.params.id, req.auth.empresaId])
    if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada' })
    const orden = rows[0]
    if (!hasRole(req.auth, ['admin'])) {
      const asignacion = await pool.query(`
        SELECT 1
        FROM orden_operario
        WHERE "Id_Orden" = $1 AND "Id_Operario" = $2 AND "Id_Empresa" = $3
        UNION
        SELECT 1
        FROM usuario_orden
        WHERE "Id_Orden" = $1 AND "Id_Usuario" = $2 AND "Id_Empresa" = $3
        LIMIT 1
      `, [req.params.id, req.auth.id, req.auth.empresaId])
      const autorizado =
        String(orden.Id_Cliente) === String(req.auth.id) ||
        String(orden.Id_Operario) === String(req.auth.id) ||
        asignacion.rows.length > 0
      if (!autorizado) return res.status(403).json({ error: 'No tienes permisos para esta orden.' })
    }
    res.json(orden)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET órdenes por estado
router.get('/estado/:estado', requireRoles('admin'), async (req, res) => {
  const estadosValidos = ['En Proceso', 'Completada', 'Retrasada']
  if (!estadosValidos.includes(req.params.estado))
    return res.status(400).json({ error: 'Estado inválido' })
  try {
    await actualizarOrdenesRetrasadas(req.auth.empresaId)

    const { rows } = await pool.query(`
      SELECT op.*,
             u."Nombre_Completo"   AS "Cliente",
             m."Nombre_Material"   AS "NombreMaterial",
             opr."Nombre_Completo" AS "Operario"
      FROM orden_produccion op
      INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
      INNER JOIN material m ON op."Id_Material" = m."Id_Material" AND m."Id_Empresa" = op."Id_Empresa"
      LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
      WHERE op."Estado" = $1 AND op."Id_Empresa" = $2
    `, [req.params.estado, req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST crear orden
router.post('/', requireRoles('admin'), async (req, res) => {
  const {
    Id_Cliente, Id_Material, Id_Operario,
    Producto, Descripcion, Cantidad,
    Prioridad, Fecha_Limite, Estado,
    Dificultad
  } = req.body

  // La empresa se deriva del token; se ignora cualquier empresa enviada por el cliente.
  const empresaId = req.auth.empresaId

  if (!Id_Cliente || !Id_Material || !Descripcion || !Cantidad || !Fecha_Limite)
    return res.status(400).json({ error: 'Faltan campos obligatorios' })

  let estadoFinal = Estado || 'En Proceso'
  if (estadoFinal === 'En Proceso' && Fecha_Limite) {
    const hoy = new Date().toISOString().split('T')[0]
    const fLim = typeof Fecha_Limite === 'string' ? Fecha_Limite.split('T')[0] : ''
    if (fLim && fLim < hoy) {
      estadoFinal = 'Retrasada'
    }
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO orden_produccion
        ("Id_Cliente", "Id_Material", "Id_Operario", "Producto", "Descripcion",
         "Cantidad", "Prioridad", "Fecha_Limite", "Estado", "Dificultad", "Id_Empresa")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING "Id_Orden"
    `, [
      Id_Cliente,
      Id_Material,
      Id_Operario  || null,
      Producto     || null,
      Descripcion,
      Cantidad,
      Prioridad    || 'Media',
      Fecha_Limite,
      estadoFinal,
      Dificultad   || 'Media',
      empresaId,
    ])
    res.status(201).json({ mensaje: 'Orden creada', Id_Orden: rows[0].Id_Orden })
  } catch (err) {
    if (err.code === '23503')
      return res.status(400).json({ error: 'Cliente, material u operario no existe o no pertenece a esta empresa' })
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', requireRoles('admin'), async (req, res) => {
  const {
    Id_Cliente, Id_Material, Id_Operario, Producto, Descripcion,
    Cantidad, Prioridad, Fecha_Limite, Estado,
    Unidades, Unidades_Realizadas,
    Dificultad
  } = req.body

  // Se ignora cualquier empresa enviada en body, query o params.
  const empresaId = req.auth.empresaId

  let estadoFinal = Estado || 'En Proceso'
  if (estadoFinal === 'En Proceso' && Fecha_Limite) {
    const hoy = new Date().toISOString().split('T')[0]
    const fLim = typeof Fecha_Limite === 'string' ? Fecha_Limite.split('T')[0] : ''
    if (fLim && fLim < hoy) {
      estadoFinal = 'Retrasada'
    }
  }

  try {
    const { rowCount } = await pool.query(`
      UPDATE orden_produccion
      SET "Id_Cliente"=$1,
          "Id_Material"=$2,
          "Id_Operario"=$3,
          "Producto"=$4,
          "Descripcion"=$5,
          "Cantidad"=$6,
          "Prioridad"=$7,
          "Fecha_Limite"=$8,
          "Estado"=$9,
          "Unidades"=COALESCE($10, "Unidades"),
          "Unidades_Realizadas"=COALESCE($11, "Unidades_Realizadas"),
          "Dificultad"=$12
      WHERE "Id_Orden"=$13 AND "Id_Empresa"=$14
    `, [
      Id_Cliente,
      Id_Material,
      Id_Operario || null,
      Producto || null,
      Descripcion,
      Cantidad,
      Prioridad,
      Fecha_Limite,
      estadoFinal,
      Unidades ?? null,
      Unidades_Realizadas ?? null,
      Dificultad || 'Media',
      req.params.id,
      empresaId,
    ])

    if (rowCount === 0)
      return res.status(404).json({ error: 'Orden no encontrada' })

    res.json({ mensaje: 'Orden actualizada' })

  } catch (err) {
    if (err.code === '23503')
      return res.status(400).json({ error: 'Cliente, material u operario no existe o no pertenece a esta empresa' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE orden
router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM orden_produccion WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2',
      [req.params.id, req.auth.empresaId]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Orden no encontrada' })
    res.json({ mensaje: 'Orden eliminada' })
  } catch (err) {
    if (err.code === '23503')
      return res.status(409).json({ error: 'No se puede eliminar la orden porque tiene registros asociados.' })
    res.status(500).json({ error: err.message })
  }
})

export default router