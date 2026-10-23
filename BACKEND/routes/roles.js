import { Router } from 'express'
import pool from '../db.js'

// Lectura de roles para administradores de empresa.
// La creación/edición/eliminación de roles es global y vive en
// /api/superadmin/roles (solo superadmin).
const router = Router()

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rol WHERE lower(trim("Nombre_Rol")) <> 'superadmin' ORDER BY "Id_Rol"`)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rol WHERE "Id_Rol" = $1 AND lower(trim("Nombre_Rol")) <> 'superadmin'`, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router