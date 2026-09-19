import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET todos los roles
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rol ORDER BY "Id_Rol"')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET rol por ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rol WHERE "Id_Rol" = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST crear rol
router.post('/', async (req, res) => {
  const { Nombre_Rol } = req.body
  if (!Nombre_Rol) return res.status(400).json({ error: 'Nombre_Rol es obligatorio' })

  try {
    const { rows } = await pool.query(
      'INSERT INTO rol ("Nombre_Rol") VALUES ($1) RETURNING "Id_Rol"',
      [Nombre_Rol]
    )
    res.status(201).json({ mensaje: 'Rol creado', Id_Rol: rows[0].Id_Rol })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ese rol ya existe' })
    res.status(500).json({ error: err.message })
  }
})

// PUT actualizar rol
router.put('/:id', async (req, res) => {
  const { Nombre_Rol } = req.body
  try {
    const { rowCount } = await pool.query(
      'UPDATE rol SET "Nombre_Rol"=$1 WHERE "Id_Rol"=$2',
      [Nombre_Rol, req.params.id]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Rol no encontrado' })
    res.json({ mensaje: 'Rol actualizado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE rol
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM rol WHERE "Id_Rol" = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Rol no encontrado' })
    res.json({ mensaje: 'Rol eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router