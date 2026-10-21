import express from 'express'
import db from '../db.js'
import { env } from '../config/env.js'
import { requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'

const router = express.Router()

if (env.nodeEnv === 'production') {
  router.use((req, res) => {
    res.status(404).json({ mensaje: 'Rutas de práctica no disponibles.' })
  })
} else {
  router.use(requireRoles('admin'))
  // Rutas de práctica: siempre limitadas a la empresa del token.
  router.use((req, res, next) => {
    if (!req.auth?.empresaId) return res.status(403).json({ mensaje: 'Se requiere una empresa activa.' })
    next()
  })
}

// ─────────────────────────────────────────
// PATH PARAMS
// ─────────────────────────────────────────

// 1. Obtener usuario por ID
router.get('/usuarios/:Id_Usuario', requireSelfParamOrRoles('Id_Usuario', 'admin'), async (req, res) => {
  const { Id_Usuario } = req.params
  const { rows } = await db.query(`
    SELECT u."Id_Usuario", u."Id_Rol", u."Nombre_Completo", u."Nombre_Usuario",
           u."Correo", u."Telefono", u."Estado", u."Fecha_Registro"
    FROM usuario u
    WHERE u."Id_Usuario" = $1
      AND EXISTS (SELECT 1 FROM usuario_empresa ue WHERE ue."Id_Usuario" = u."Id_Usuario" AND ue."Id_Empresa" = $2)
  `, [Id_Usuario, req.auth.empresaId])
  if (rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' })
  res.json(rows[0])
})

// 2. Obtener una orden de producción específica
router.get('/ordenes/:Id_Orden', async (req, res) => {
  const { Id_Orden } = req.params
  const { rows } = await db.query('SELECT * FROM orden_produccion WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2', [Id_Orden, req.auth.empresaId])
  if (rows.length === 0) return res.status(404).json({ mensaje: 'Orden no encontrada' })
  res.json(rows[0])
})

// 3. Materiales usados en una orden (subrecurso)
router.get('/ordenes/:Id_Orden/materiales', async (req, res) => {
  const { Id_Orden } = req.params
  const { rows } = await db.query(
    `SELECT m.*, om."Cantidad_Usada"
     FROM orden_material om
     JOIN material m ON om."Id_Producto" = m."Id_Material" AND m."Id_Empresa" = om."Id_Empresa"
     WHERE om."Id_Orden" = $1 AND om."Id_Empresa" = $2`,
    [Id_Orden, req.auth.empresaId]
  )
  res.json(rows)
})

// 4. Comprobante de una orden (subrecurso)
router.get('/ordenes/:Id_Orden/comprobante', async (req, res) => {
  const { Id_Orden } = req.params
  const { rows } = await db.query('SELECT * FROM comprobantes WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2', [Id_Orden, req.auth.empresaId])
  if (rows.length === 0) return res.status(404).json({ mensaje: 'Comprobante no encontrado' })
  res.json(rows[0])
})

// 5. Materiales de un cliente
router.get('/clientes/:Id_Cliente/materiales', async (req, res) => {
  const { Id_Cliente } = req.params
  const { rows } = await db.query('SELECT * FROM material WHERE "Id_Cliente" = $1 AND "Id_Empresa" = $2', [Id_Cliente, req.auth.empresaId])
  res.json(rows)
})

// ─────────────────────────────────────────
// QUERY PARAMS
// ─────────────────────────────────────────

// 6 & 10. Filtrar/ordenar órdenes
router.get('/ordenes', async (req, res) => {
  const { estado, orden, dir, page, limit } = req.query
  let sql = 'SELECT * FROM orden_produccion WHERE "Id_Empresa" = $1'
  const params = [req.auth.empresaId]
  let idx = 2

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
  let sql = 'SELECT * FROM material WHERE "Id_Empresa" = $1'
  const params = [req.auth.empresaId]

  if (categoria) {
    sql += ' AND "Categoria" = $2'
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
    `SELECT u."Id_Usuario", u."Id_Rol", u."Nombre_Completo", u."Nombre_Usuario",
            u."Correo", u."Telefono", u."Estado", u."Fecha_Registro"
     FROM usuario u
     INNER JOIN usuario_empresa ue ON ue."Id_Usuario" = u."Id_Usuario" AND ue."Id_Empresa" = $3
     ORDER BY u."Id_Usuario"
     LIMIT $1 OFFSET $2`,
    [parseInt(limit), offset, req.auth.empresaId]
  )
  res.json(rows)
})

// 9. Filtrar comprobantes por estado y fecha
router.get('/comprobantes', async (req, res) => {
  const { estado, fecha } = req.query
  let sql = 'SELECT * FROM comprobantes WHERE "Id_Empresa" = $1'
  const params = [req.auth.empresaId]
  let idx = 2

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