import { Router } from 'express'
import pool from '../db.js'
import { hasRole, requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'

const router = Router()

// La empresa sale SIEMPRE del token (req.auth.empresaId); nunca del body, query o params.
// Un comprobante de otra empresa responde 404, igual que uno inexistente.

// GET todos los comprobantes de la empresa
router.get('/', requireRoles('admin'), async (req, res) => {
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
      WHERE c."Id_Empresa" = $1
      ORDER BY c."Fecha_Limite" DESC
    `, [req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// GET comprobantes de un cliente específico (dentro de la empresa)
router.get('/cliente/:idCliente', requireSelfParamOrRoles('idCliente', 'admin'), async (req, res) => {
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
      WHERE op."Id_Cliente" = $1 AND c."Id_Empresa" = $2
      ORDER BY c."Fecha_Limite" DESC
    `, [req.params.idCliente, req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
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
      WHERE c."Id_Comprobante" = $1 AND c."Id_Empresa" = $2
    `, [req.params.id, req.auth.empresaId])

    if (rows.length === 0) return res.status(404).json({ error: 'Comprobante no encontrado' })
    if (!hasRole(req.auth, ['admin']) && String(rows[0].Id_Cliente) !== String(req.auth.id)) {
      return res.status(403).json({ error: 'No tienes permisos para este comprobante.' })
    }
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// POST crear comprobante
router.post('/', requireRoles('admin'), async (req, res) => {
  const { Id_Usuario, Id_Orden, Estado, Fecha_Limite } = req.body
  if (!Id_Usuario || !Id_Orden)
    return res.status(400).json({ error: 'Id_Usuario e Id_Orden son obligatorios' })

  try {
    // Evitar duplicados: upsert por Id_Orden (solo dentro de la empresa)
    const existe = await pool.query(
      'SELECT "Id_Comprobante" FROM comprobantes WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2',
      [Id_Orden, req.auth.empresaId]
    )

    if (existe.rows.length > 0) {
      await pool.query(
        'UPDATE comprobantes SET "Estado"=$1, "Fecha_Limite"=$2 WHERE "Id_Orden"=$3 AND "Id_Empresa"=$4',
        [Estado || 'Pendiente', Fecha_Limite || null, Id_Orden, req.auth.empresaId]
      )
      return res.status(200).json({
        mensaje: 'Comprobante actualizado',
        Id_Comprobante: existe.rows[0].Id_Comprobante
      })
    }

    const { rows } = await pool.query(`
      INSERT INTO comprobantes ("Id_Usuario", "Id_Orden", "Estado", "Fecha_Limite", "Id_Empresa")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "Id_Comprobante"
    `, [Id_Usuario, Id_Orden, Estado || 'Pendiente', Fecha_Limite || null, req.auth.empresaId])

    res.status(201).json({ mensaje: 'Comprobante creado', Id_Comprobante: rows[0].Id_Comprobante })
  } catch (err) {
    // Las FKs compuestas de la base rechazan órdenes o usuarios de otra empresa.
    if (err.code === '23503') {
      return res.status(400).json({ error: 'La orden o el usuario indicado no pertenece a tu empresa.' })
    }
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// PUT actualizar estado del comprobante
router.put('/:id', requireRoles('admin'), async (req, res) => {
  const { Estado, Fecha_Limite } = req.body
  try {
    const { rowCount } = await pool.query(`
      UPDATE comprobantes SET "Estado"=$1, "Fecha_Limite"=$2
      WHERE "Id_Comprobante"=$3 AND "Id_Empresa"=$4
    `, [Estado, Fecha_Limite || null, req.params.id, req.auth.empresaId])

    if (rowCount === 0) return res.status(404).json({ error: 'Comprobante no encontrado' })
    res.json({ mensaje: 'Comprobante actualizado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// DELETE comprobante
router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM comprobantes WHERE "Id_Comprobante" = $1 AND "Id_Empresa" = $2',
      [req.params.id, req.auth.empresaId]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Comprobante no encontrado' })
    res.json({ mensaje: 'Comprobante eliminado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

export default router