import { Router } from 'express'
import pool from '../db.js'
import bcrypt from 'bcryptjs'

const router = Router()

// ── Validación de nombre (solo letras, espacios y tildes) ──
function validarNombre(nombre) {
  if (!nombre || !nombre.trim()) return 'El nombre completo es requerido.'
  if (/[0-9]/.test(nombre)) return 'El nombre no puede contener números.'
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÄËÏÖÜäëïöüÑñÜü\s'-]+$/.test(nombre.trim()))
    return 'El nombre solo puede contener letras y espacios.'
  return null
}

// ── Validación de contraseña fuerte ──
function validarContrasena(contrasena) {
  if (contrasena.length < 8)
    return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(contrasena))
    return 'La contraseña debe tener al menos una letra mayúscula.'
  if (!/[0-9]/.test(contrasena))
    return 'La contraseña debe tener al menos un número.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena))
    return 'La contraseña debe tener al menos un carácter especial (@, #, $, etc.).'
  return null
}

// GET todos los usuarios (con nombre de rol)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
             u."Correo", u."Telefono", u."Estado", u."Fecha_Registro",
             r."Nombre_Rol" AS "Rol", r."Id_Rol"
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol"
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
             u."Correo", u."Telefono", u."Estado", u."Fecha_Registro",
             r."Nombre_Rol" AS "Rol", r."Id_Rol"
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol"
      WHERE u."Id_Usuario" = $1
    `, [req.params.id])

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST login — compara con bcrypt
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body
  if (!correo || !contrasena)
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' })

  try {
    const { rows } = await pool.query(`
      SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
             u."Correo", u."Contrasena", u."Estado", r."Nombre_Rol" AS "Rol"
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol"
      WHERE (u."Correo" = $1 OR u."Nombre_Usuario" = $1) AND u."Estado" = 'activo'
    `, [correo])

    if (rows.length === 0)
      return res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo' })

    const usuario = rows[0]

    let passwordValida = false
    if (usuario.Contrasena.startsWith('$2')) {
      passwordValida = await bcrypt.compare(contrasena, usuario.Contrasena)
    } else {
      passwordValida = (contrasena === usuario.Contrasena)
    }

    if (!passwordValida)
      return res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo' })

    const { Contrasena, ...usuarioSinPass } = usuario
    res.json({ mensaje: 'Login exitoso', usuario: usuarioSinPass })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST crear usuario — encripta la contraseña con bcrypt
router.post('/', async (req, res) => {
  const { Id_Rol, Nombre_Completo, Nombre_Usuario, Correo, Telefono, Estado, Contrasena } = req.body
  if (!Id_Rol || !Nombre_Completo || !Nombre_Usuario || !Correo || !Contrasena)
    return res.status(400).json({ error: 'Faltan campos obligatorios' })

  const errorNombre = validarNombre(Nombre_Completo)
  if (errorNombre) return res.status(400).json({ error: errorNombre })

  const errorPass = validarContrasena(Contrasena)
  if (errorPass) return res.status(400).json({ error: errorPass })

  try {
    const hash = await bcrypt.hash(Contrasena, 10)

    const { rows } = await pool.query(`
      INSERT INTO usuario ("Id_Rol", "Nombre_Completo", "Nombre_Usuario", "Correo", "Telefono", "Estado", "Contrasena")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING "Id_Usuario"
    `, [Id_Rol, Nombre_Completo, Nombre_Usuario, Correo || null, Telefono || null, Estado || 'activo', hash])

    res.status(201).json({ mensaje: 'Usuario creado', Id_Usuario: rows[0].Id_Usuario })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El correo o nombre de usuario ya existe' })
    res.status(500).json({ error: err.message })
  }
})

// PUT actualizar usuario — encripta la contraseña si se envía una nueva
router.put('/:id', async (req, res) => {
  const { Id_Rol, Nombre_Completo, Nombre_Usuario, Correo, Telefono, Estado, Contrasena } = req.body
  const errorNombre = validarNombre(Nombre_Completo)
  if (errorNombre) return res.status(400).json({ error: errorNombre })
  try {
    if (Contrasena && Contrasena.trim() !== '') {
      const errorPass = validarContrasena(Contrasena)
      if (errorPass) return res.status(400).json({ error: errorPass })

      const hash = await bcrypt.hash(Contrasena, 10)
      await pool.query(`
        UPDATE usuario
        SET "Id_Rol"=$1, "Nombre_Completo"=$2, "Nombre_Usuario"=$3, "Correo"=$4,
            "Telefono"=$5, "Estado"=$6, "Contrasena"=$7
        WHERE "Id_Usuario"=$8
      `, [Id_Rol, Nombre_Completo, Nombre_Usuario, Correo || null, Telefono || null, Estado, hash, req.params.id])
    } else {
      await pool.query(`
        UPDATE usuario
        SET "Id_Rol"=$1, "Nombre_Completo"=$2, "Nombre_Usuario"=$3, "Correo"=$4,
            "Telefono"=$5, "Estado"=$6
        WHERE "Id_Usuario"=$7
      `, [Id_Rol, Nombre_Completo, Nombre_Usuario, Correo || null, Telefono || null, Estado, req.params.id])
    }

    res.json({ mensaje: 'Usuario actualizado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH inactivar usuario (soft delete)
router.patch('/:id/inactivar', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE usuario SET "Estado" = 'inactivo' WHERE "Id_Usuario" = $1`,
      [req.params.id]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ mensaje: 'Usuario inactivado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE usuario
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM usuario WHERE "Id_Usuario" = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router