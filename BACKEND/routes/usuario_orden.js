import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET operarios asignados a una orden
router.get('/orden/:idOrden', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT uo.*, u."Nombre_Completo", u."Correo"
      FROM usuario_orden uo
      INNER JOIN usuario u ON uo."Id_Usuario" = u."Id_Usuario"
      WHERE uo."Id_Orden" = $1
    `, [req.params.idOrden])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET órdenes asignadas a un usuario
router.get('/usuario/:idUsuario', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT uo.*, op."Descripcion", op."Estado", op."Fecha_Limite", op."Prioridad"
      FROM usuario_orden uo
      INNER JOIN orden_produccion op ON uo."Id_Orden" = op."Id_Orden"
      WHERE uo."Id_Usuario" = $1
    `, [req.params.idUsuario])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST asignar usuario a orden
router.post('/', async (req, res) => {
  const { Id_Usuario, Id_Orden, Funcion } = req.body
  if (!Id_Usuario || !Id_Orden)
    return res.status(400).json({ error: 'Id_Usuario e Id_Orden son obligatorios' })

  try {
    await pool.query(`
      INSERT INTO usuario_orden ("Id_Usuario", "Id_Orden", "Funcion") VALUES ($1, $2, $3)
    `, [Id_Usuario, Id_Orden, Funcion || null])

    res.status(201).json({ mensaje: 'Usuario asignado a la orden' })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El usuario ya está asignado a esa orden' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE desasignar usuario de una orden
router.delete('/:idUsuario/:idOrden', async (req, res) => {
  try {
    const { rowCount } = await pool.query(`
      DELETE FROM usuario_orden WHERE "Id_Usuario"=$1 AND "Id_Orden"=$2
    `, [req.params.idUsuario, req.params.idOrden])

    if (rowCount === 0) return res.status(404).json({ error: 'Asignación no encontrada' })
    res.json({ mensaje: 'Usuario desasignado de la orden' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router