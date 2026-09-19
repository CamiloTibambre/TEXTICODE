import express from 'express'
import db from '../db.js'

const router = express.Router()

// ─────────────────────────────────────────
// PATH PARAMS
// ─────────────────────────────────────────

// 1. Obtener usuario por ID
router.get('/usuarios/:Id_Usuario', async (req, res) => {
  const { Id_Usuario } = req.params
  const { rows } = await db.query('SELECT * FROM usuario WHERE "Id_Usuario" = $1', [Id_Usuario])
  if (rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' })
  res.json(rows[0])
})

// 2. Obtener una orden de producción específica
router.get('/ordenes/:Id_Orden', async (req, res) => {
  const { Id_Orden } = req.params
  const { rows } = await db.query('SELECT * FROM orden_produccion WHERE "Id_Orden" = $1', [Id_Orden])
  if (rows.length === 0) return res.status(404).json({ mensaje: 'Orden no encontrada' })
  res.json(rows[0])
})

// 3. Materiales usados en una orden (subrecurso)
router.get('/ordenes/:Id_Orden/materiales', async (req, res) => {
  const { Id_Orden } = req.params
  const { rows } = await db.query(
    `SELECT m.*, om."Cantidad_Usada"
     FROM orden_material om
     JOIN material m ON om."Id_Producto" = m."Id_Material"
     WHERE om."Id_Orden" = $1`,
    [Id_Orden]
  )
  res.json(rows)
})

// 4. Comprobante de una orden (subrecurso)
router.get('/ordenes/:Id_Orden/comprobante', async (req, res) => {
  const { Id_Orden } = req.params
  const { rows } = await db.query('SELECT * FROM comprobantes WHERE "Id_Orden" = $1', [Id_Orden])
  if (rows.length === 0) return res.status(404).json({ mensaje: 'Comprobante no encontrado' })
  res.json(rows[0])
})

// 5. Materiales de un cliente
router.get('/clientes/:Id_Cliente/materiales', async (req, res) => {
  const { Id_Cliente } = req.params
  const { rows } = await db.query('SELECT * FROM material WHERE "Id_Cliente" = $1', [Id_Cliente])
  res.json(rows)
})

// ─────────────────────────────────────────
// QUERY PARAMS
// ─────────────────────────────────────────

// 6 & 10. Filtrar/ordenar órdenes
router.get('/ordenes', async (req, res) => {
  const { estado, orden, dir, page, limit } = req.query
  let sql = 'SELECT * FROM orden_produccion WHERE 1=1'
  const params = []
  let idx = 1

  if (estado) {
    sql += ` AND "Estado" = $${idx++}`
    params.push(estado)
  }

  const columnasPermitidas = ['Prioridad', 'Fecha_Limite', 'Fecha_Creacion', 'Cantidad']
  if (orden && columnasPermitidas.includes(orden)) {
    const direction = dir === 'desc' ? 'DESC' : 'ASC'
    sql += ` ORDER BY "${orden}" ${direction}`
  }

  if (page && limit) {
    const offset = (parseInt(page) - 1) * parseInt(limit)
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`
    params.push(parseInt(limit), offset)
  }

  const { rows } = await db.query(sql, params)
  res.json(rows)
})

// 7. Filtrar materiales por categoría
router.get('/materiales', async (req, res) => {
  const { categoria } = req.query
  let sql = 'SELECT * FROM material WHERE 1=1'
  const params = []

  if (categoria) {
    sql += ' AND "Categoria" = $1'
    params.push(categoria)
  }

  const { rows } = await db.query(sql, params)
  res.json(rows)
})

// 8. Paginar usuarios
router.get('/usuarios', async (req, res) => {
  const { page = 1, limit = 5 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  const { rows } = await db.query(
    'SELECT * FROM usuario LIMIT $1 OFFSET $2',
    [parseInt(limit), offset]
  )
  res.json(rows)
})

// 9. Filtrar comprobantes por estado y fecha
router.get('/comprobantes', async (req, res) => {
  const { estado, fecha } = req.query
  let sql = 'SELECT * FROM comprobantes WHERE 1=1'
  const params = []
  let idx = 1

  if (estado) {
    sql += ` AND "Estado" = $${idx++}`
    params.push(estado)
  }
  if (fecha) {
    sql += ` AND "Fecha_Limite" = $${idx++}`
    params.push(fecha)
  }

  const { rows } = await db.query(sql, params)
  res.json(rows)
})

export default router