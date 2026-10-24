import { Router } from 'express'
import pool from '../db.js'
import { requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'

const router = Router()

// GET operarios asignados a una orden
router.get('/orden/:idOrden', requireRoles('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT uo.*, u."Nombre_Completo", u."Correo"
      FROM usuario_orden uo
      INNER JOIN usuario u ON uo."Id_Usuario" = u."Id_Usuario"
      INNER JOIN usuario_empresa ue ON ue."Id_Usuario" = u."Id_Usuario" AND ue."Id_Empresa" = uo."Id_Empresa"
      WHERE uo."Id_Orden" = $1 AND uo."Id_Empresa" = $2
    `, [req.params.idOrden, req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// GET órdenes asignadas a un usuario
router.get('/usuario/:idUsuario', requireSelfParamOrRoles('idUsuario', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT uo.*, op."Descripcion", op."Estado", op."Fecha_Limite", op."Prioridad"
      FROM usuario_orden uo
      INNER JOIN orden_produccion op ON uo."Id_Orden" = op."Id_Orden" AND op."Id_Empresa" = uo."Id_Empresa"
      WHERE uo."Id_Usuario" = $1 AND uo."Id_Empresa" = $2
        AND op."Id_Empresa" = $2
    `, [req.params.idUsuario, req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// POST asignar usuario a orden
router.post('/', requireRoles('admin'), async (req, res) => {
  const { Id_Usuario, Id_Orden, Funcion } = req.body
  // Se ignoran Id_Empresa/empresaId del body, query y params.
  const empresaId = req.auth.empresaId
  if (!Id_Usuario || !Id_Orden)
    return res.status(400).json({ error: 'Id_Usuario e Id_Orden son obligatorios' })

  try {
    await pool.query(`
      INSERT INTO usuario_orden ("Id_Usuario", "Id_Orden", "Funcion", "Id_Empresa") VALUES ($1, $2, $3, $4)
    `, [Id_Usuario, Id_Orden, Funcion || null, empresaId])

    res.status(201).json({ mensaje: 'Usuario asignado a la orden' })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El usuario ya está asignado a esa orden' })
    if (err.code === '23503')
      return res.status(400).json({ error: 'La orden o el usuario no existe o no pertenece a esta empresa' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// DELETE desasignar usuario de una orden
router.delete('/:idUsuario/:idOrden', requireRoles('admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query(`
      DELETE FROM usuario_orden WHERE "Id_Usuario"=$1 AND "Id_Orden"=$2 AND "Id_Empresa"=$3
    `, [req.params.idUsuario, req.params.idOrden, req.auth.empresaId])

    if (rowCount === 0) return res.status(404).json({ error: 'Asignación no encontrada' })
    res.json({ mensaje: 'Usuario desasignado de la orden' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

export default router
