import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET todos los comprobantes
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
             u."Nombre_Completo"   AS "Usuario",
             op."Producto"         AS "Orden_Producto",
             op."Descripcion"      AS "Orden_Descripcion",
             op."Estado"           AS "Orden_Estado",
             op."Cantidad"         AS "Orden_Cantidad",
             op."Id_Cliente",
             cli."Nombre_Completo" AS "Cliente"
      FROM comprobantes c
      INNER JOIN usuario u          ON c."Id_Usuario" = u."Id_Usuario"
      INNER JOIN orden_produccion op ON c."Id_Orden"   = op."Id_Orden"
      INNER JOIN usuario cli         ON op."Id_Cliente" = cli."Id_Usuario"
      ORDER BY c."Fecha_Limite" DESC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET comprobantes de un cliente específico
router.get('/cliente/:idCliente', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
             u."Nombre_Completo"   AS "Usuario",
             op."Producto"         AS "Orden_Producto",
             op."Descripcion"      AS "Orden_Descripcion",
             op."Estado"           AS "Orden_Estado",
             op."Cantidad"         AS "Orden_Cantidad",
             op."Id_Cliente",
             cli."Nombre_Completo" AS "Cliente"
      FROM comprobantes c
      INNER JOIN usuario u          ON c."Id_Usuario" = u."Id_Usuario"
      INNER JOIN orden_produccion op ON c."Id_Orden"   = op."Id_Orden"
      INNER JOIN usuario cli         ON op."Id_Cliente" = cli."Id_Usuario"
      WHERE op."Id_Cliente" = $1
      ORDER BY c."Fecha_Limite" DESC
    `, [req.params.idCliente])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET comprobante por ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
             u."Nombre_Completo"   AS "Usuario",
             op."Producto"         AS "Orden_Producto",
             op."Descripcion"      AS "Orden_Descripcion",
             op."Estado"           AS "Orden_Estado",
             op."Cantidad"         AS "Orden_Cantidad",
             op."Id_Cliente",
             cli."Nombre_Completo" AS "Cliente"
      FROM comprobantes c
      INNER JOIN usuario u          ON c."Id_Usuario" = u."Id_Usuario"
      INNER JOIN orden_produccion op ON c."Id_Orden"   = op."Id_Orden"
      INNER JOIN usuario cli         ON op."Id_Cliente" = cli."Id_Usuario"
      WHERE c."Id_Comprobante" = $1
    `, [req.params.id])

    if (rows.length === 0) return res.status(404).json({ error: 'Comprobante no encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST crear comprobante
router.post('/', async (req, res) => {
  const { Id_Usuario, Id_Orden, Estado, Fecha_Limite } = req.body
  if (!Id_Usuario || !Id_Orden)
    return res.status(400).json({ error: 'Id_Usuario e Id_Orden son obligatorios' })

  try {
    // Evitar duplicados: upsert por Id_Orden
    const existe = await pool.query(
      'SELECT "Id_Comprobante" FROM comprobantes WHERE "Id_Orden" = $1',
      [Id_Orden]
    )

    if (existe.rows.length > 0) {
      await pool.query(
        'UPDATE comprobantes SET "Estado"=$1, "Fecha_Limite"=$2 WHERE "Id_Orden"=$3',
        [Estado || 'Pendiente', Fecha_Limite || null, Id_Orden]
      )
      return res.status(200).json({
        mensaje: 'Comprobante actualizado',
        Id_Comprobante: existe.rows[0].Id_Comprobante
      })
    }

    const { rows } = await pool.query(`
      INSERT INTO comprobantes ("Id_Usuario", "Id_Orden", "Estado", "Fecha_Limite")
      VALUES ($1, $2, $3, $4)
      RETURNING "Id_Comprobante"
    `, [Id_Usuario, Id_Orden, Estado || 'Pendiente', Fecha_Limite || null])

    res.status(201).json({ mensaje: 'Comprobante creado', Id_Comprobante: rows[0].Id_Comprobante })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT actualizar estado del comprobante
router.put('/:id', async (req, res) => {
  const { Estado, Fecha_Limite } = req.body
  try {
    const { rowCount } = await pool.query(`
      UPDATE comprobantes SET "Estado"=$1, "Fecha_Limite"=$2 WHERE "Id_Comprobante"=$3
    `, [Estado, Fecha_Limite || null, req.params.id])

    if (rowCount === 0) return res.status(404).json({ error: 'Comprobante no encontrado' })
    res.json({ mensaje: 'Comprobante actualizado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE comprobante
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM comprobantes WHERE "Id_Comprobante" = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Comprobante no encontrado' })
    res.json({ mensaje: 'Comprobante eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router