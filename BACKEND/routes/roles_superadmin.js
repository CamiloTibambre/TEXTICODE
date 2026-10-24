import { Router } from 'express'
import pool from '../db.js'
import { requireSuperadmin } from '../middleware/auth.js'

// Gestión global de roles: SOLO superadmin (token sin empresa).
const router = Router()
router.use(requireSuperadmin)

// Roles base del sistema: no se renombran ni se eliminan.
const ROLES_PROTEGIDOS = ['superadmin', 'admin', 'administrador', 'operario', 'operador', 'cliente']
const norm = (v) => String(v || '').trim().toLowerCase()
const esProtegido = (n) => ROLES_PROTEGIDOS.includes(norm(n))

function validarNombre(raw) {
  const nombre = String(raw || '').trim().replace(/\s+/g, ' ')
  if (!nombre) return { error: 'Nombre_Rol es obligatorio' }
  if (nombre.length > 40) return { error: 'El nombre no puede superar 40 caracteres' }
  if (norm(nombre) === 'superadmin') return { error: 'El nombre "superadmin" está reservado.' }
  return { nombre }
}

// GET roles con conteo de usuarios
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r."Id_Rol", r."Nombre_Rol", r."Estado", COUNT(u."Id_Usuario")::int AS "Total_Usuarios"
         FROM rol r LEFT JOIN usuario u ON u."Id_Rol" = r."Id_Rol"
        GROUP BY r."Id_Rol", r."Nombre_Rol", r."Estado"
        ORDER BY r."Id_Rol"`
    )
    res.json(rows.map(r => ({ ...r, Protegido: esProtegido(r.Nombre_Rol) })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// POST crear
router.post('/', async (req, res) => {
  const v = validarNombre(req.body?.Nombre_Rol)
  if (v.error) return res.status(400).json({ error: v.error })
  try {
    const { rows } = await pool.query(
      'INSERT INTO rol ("Nombre_Rol") VALUES ($1) RETURNING "Id_Rol"', [v.nombre])
    res.status(201).json({ mensaje: 'Rol creado', Id_Rol: rows[0].Id_Rol })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ese rol ya existe' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// PUT renombrar
router.put('/:id', async (req, res) => {
  const v = validarNombre(req.body?.Nombre_Rol)
  if (v.error) return res.status(400).json({ error: v.error })
  try {
    const { rows } = await pool.query('SELECT "Nombre_Rol" FROM rol WHERE "Id_Rol" = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Rol no encontrado' })
    if (esProtegido(rows[0].Nombre_Rol))
      return res.status(403).json({ error: 'Los roles base del sistema no se pueden renombrar.' })
    await pool.query('UPDATE rol SET "Nombre_Rol" = $1 WHERE "Id_Rol" = $2', [v.nombre, req.params.id])
    res.json({ mensaje: 'Rol actualizado' })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ese rol ya existe' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// Los roles no se eliminan (la FK usuario→rol es ON DELETE CASCADE y borraría a sus usuarios):
// se desactivan. Con el rol inactivo, sus usuarios no pueden iniciar sesión hasta reactivarlo.
async function cambiarEstado(req, res, estado) {
  try {
    const { rows } = await pool.query('SELECT "Nombre_Rol" FROM rol WHERE "Id_Rol" = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Rol no encontrado' })
    if (estado === 'inactivo' && norm(rows[0].Nombre_Rol) === 'superadmin')
      return res.status(403).json({ error: 'El rol superadmin no se puede desactivar.' })
    await pool.query('UPDATE rol SET "Estado" = $1 WHERE "Id_Rol" = $2', [estado, req.params.id])
    res.json({ mensaje: estado === 'activo' ? 'Rol activado' : 'Rol desactivado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

// PATCH desactivar / activar
router.patch('/:id/desactivar', (req, res) => cambiarEstado(req, res, 'inactivo'))
router.patch('/:id/activar', (req, res) => cambiarEstado(req, res, 'activo'))

export default router
