import { Router } from 'express'
import pool from '../db.js'
import bcrypt from 'bcryptjs'
import { requireAuth } from '../middleware/auth.js'
import { hasRole, requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'
import { signAuthToken } from '../middleware/auth.js'
import { processLogin } from '../services/auth.service.js'

const router = Router()

async function userHasSuperadminRole(idUsuario) {
  const { rows } = await pool.query(
    `SELECT 1 FROM usuario u
     INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
     WHERE u."Id_Usuario" = $1 AND lower(trim(r."Nombre_Rol")) = 'superadmin'
     LIMIT 1`,
    [idUsuario]
  )
  return rows.length > 0
}

async function roleIdIsSuperadmin(idRol) {
  const { rows } = await pool.query(
    `SELECT 1 FROM rol WHERE "Id_Rol" = $1 AND lower(trim("Nombre_Rol")) = 'superadmin' LIMIT 1`,
    [idRol]
  )
  return rows.length > 0
}

function denySuperadminMutation(res) {
  return res.status(403).json({ error: 'Solo el superadmin puede asignar o administrar ese usuario o rol.' })
}

// Ejecuta fn(client) dentro de una transacción: confirma o revierte siempre y libera la conexión.
async function enTransaccion(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const resultado = await fn(client)
    await client.query('COMMIT')
    return resultado
  } catch (err) {
    try { await client.query('ROLLBACK') } catch { /* la conexión ya falló */ }
    throw err
  } finally {
    client.release()
  }
}

function normalizarEstado(valor, actual = 'activo') {
  return valor === 'activo' || valor === 'inactivo' ? valor : actual
}

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

// La empresa sale SIEMPRE del token (req.auth.empresaId); nunca del body, query o params.
// Un usuario de otra empresa responde 404, igual que uno inexistente.

// GET usuarios de la empresa (con nombre de rol)
router.get('/', requireAuth, requireRoles('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
             u."Correo", u."Telefono", u."Estado", u."Fecha_Registro",
             r."Nombre_Rol" AS "Rol", r."Id_Rol"
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol"
      INNER JOIN usuario_empresa ue ON ue."Id_Usuario" = u."Id_Usuario"
      WHERE ue."Id_Empresa" = $1
    `, [req.auth.empresaId])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// GET un usuario por ID (solo de la misma empresa)
router.get('/:id', requireAuth, requireSelfParamOrRoles('id', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
             u."Correo", u."Telefono", u."Estado", u."Fecha_Registro",
             r."Nombre_Rol" AS "Rol", r."Id_Rol"
      FROM usuario u
      INNER JOIN rol r ON u."Id_Rol" = r."Id_Rol"
      INNER JOIN usuario_empresa ue ON ue."Id_Usuario" = u."Id_Usuario"
      WHERE u."Id_Usuario" = $1 AND ue."Id_Empresa" = $2
    `, [req.params.id, req.auth.empresaId])

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// POST login — compartido con auth.service.js
router.post('/login', async (req, res) => {
  const { correo, contrasena, idEmpresa, Id_Empresa } = req.body
  const identificador = correo || req.body.usuario || req.body.nombreUsuario

  if (!identificador || !contrasena)
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' })

  try {
    const result = await processLogin(pool, {
      identificador,
      contrasena,
      idEmpresaDeseada: idEmpresa || Id_Empresa || null,
    })

    if (result.type === 'membership_invariant_violation') {
      return res.status(409).json({ error: result.error, code: 'MEMBERSHIP_INVARIANT' })
    }

    if (result.type === 'requires_selection') {
      return res.status(200).json({
        requiresEmpresaSelection: true,
        selectionToken: result.selectionToken,
        empresas: result.empresas,
        usuario: result.usuario,
      })
    }

    if (result.type === 'no_memberships') {
      return res.status(403).json({
        error: result.error,
        code: 'NO_MEMBERSHIPS',
        usuario: result.usuario,
      })
    }

    if (result.type === 'unauthorized_tenant') {
      return res.status(403).json({
        error: result.error,
        code: 'TENANT_UNAUTHORIZED',
      })
    }

    return res.status(200).json({
      mensaje: 'Login exitoso',
      token: result.token,
      usuario: result.usuario,
      ...(result.empresaActiva ? { empresaActiva: result.empresaActiva } : {}),
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message })
    }
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// POST crear usuario — encripta la contraseña con bcrypt y crea su membresía en la empresa
router.post('/', requireAuth, requireRoles('admin'), async (req, res) => {
  const { Id_Rol, Nombre_Completo, Nombre_Usuario, Correo, Telefono, Estado, Contrasena } = req.body
  if (!Id_Rol || !Nombre_Completo || !Nombre_Usuario || !Correo || !Contrasena)
    return res.status(400).json({ error: 'Faltan campos obligatorios' })

  const errorNombre = validarNombre(Nombre_Completo)
  if (errorNombre) return res.status(400).json({ error: errorNombre })

  const errorPass = validarContrasena(Contrasena)
  if (errorPass) return res.status(400).json({ error: errorPass })

  try {
    if (await roleIdIsSuperadmin(Id_Rol)) return denySuperadminMutation(res)
    const hash = await bcrypt.hash(Contrasena, 10)
    const estado = normalizarEstado(Estado)

    // Usuario + membresía en una sola transacción: sin membresía activa no podría iniciar sesión.
    const idUsuario = await enTransaccion(async (client) => {
      const { rows } = await client.query(`
        INSERT INTO usuario ("Id_Rol", "Nombre_Completo", "Nombre_Usuario", "Correo", "Telefono", "Estado", "Contrasena")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING "Id_Usuario"
      `, [Id_Rol, Nombre_Completo, Nombre_Usuario, Correo || null, Telefono || null, estado, hash])

      await client.query(`
        INSERT INTO usuario_empresa ("Id_Usuario", "Id_Empresa", "Id_Rol", "Estado", "Es_Principal")
        VALUES ($1, $2, $3, $4, true)
      `, [rows[0].Id_Usuario, req.auth.empresaId, Id_Rol, estado])

      return rows[0].Id_Usuario
    })

    res.status(201).json({ mensaje: 'Usuario creado', Id_Usuario: idUsuario })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El correo o nombre de usuario ya existe' })
    if (err.code === '23503')
      return res.status(400).json({ error: 'El rol indicado no existe.' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// PUT actualizar usuario — encripta la contraseña si se envía una nueva
router.put('/:id', requireAuth, requireSelfParamOrRoles('id', 'admin'), async (req, res) => {
  const { Nombre_Completo, Nombre_Usuario, Correo, Telefono, Contrasena } = req.body
  const errorNombre = validarNombre(Nombre_Completo)
  if (errorNombre) return res.status(400).json({ error: errorNombre })
  try {
    const { rows: actualRows } = await pool.query(`
      SELECT u."Id_Rol", u."Estado"
      FROM usuario u
      INNER JOIN usuario_empresa ue ON ue."Id_Usuario" = u."Id_Usuario"
      WHERE u."Id_Usuario" = $1 AND ue."Id_Empresa" = $2
    `, [req.params.id, req.auth.empresaId])
    if (actualRows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    const actual = actualRows[0]

    // Solo un admin puede cambiar rol o estado; si no, se conservan los actuales (evita auto-ascenso).
    const esAdmin = hasRole(req.auth, ['admin'])
    const idRol = esAdmin && req.body.Id_Rol ? req.body.Id_Rol : actual.Id_Rol
    const estado = esAdmin ? normalizarEstado(req.body.Estado, actual.Estado) : actual.Estado

    if (await userHasSuperadminRole(req.params.id) || await roleIdIsSuperadmin(idRol)) {
      return denySuperadminMutation(res)
    }

    let hash = null
    if (Contrasena && Contrasena.trim() !== '') {
      const errorPass = validarContrasena(Contrasena)
      if (errorPass) return res.status(400).json({ error: errorPass })
      hash = await bcrypt.hash(Contrasena, 10)
    }

    await enTransaccion(async (client) => {
      if (hash) {
        await client.query(`
          UPDATE usuario
          SET "Id_Rol"=$1, "Nombre_Completo"=$2, "Nombre_Usuario"=$3, "Correo"=$4,
              "Telefono"=$5, "Estado"=$6, "Contrasena"=$7
          WHERE "Id_Usuario"=$8
        `, [idRol, Nombre_Completo, Nombre_Usuario, Correo || null, Telefono || null, estado, hash, req.params.id])
      } else {
        await client.query(`
          UPDATE usuario
          SET "Id_Rol"=$1, "Nombre_Completo"=$2, "Nombre_Usuario"=$3, "Correo"=$4,
              "Telefono"=$5, "Estado"=$6
          WHERE "Id_Usuario"=$7
        `, [idRol, Nombre_Completo, Nombre_Usuario, Correo || null, Telefono || null, estado, req.params.id])
      }
      // La membresía conserva el mismo rol y estado que el usuario.
      await client.query(`
        UPDATE usuario_empresa SET "Id_Rol"=$1, "Estado"=$2
        WHERE "Id_Usuario"=$3 AND "Id_Empresa"=$4
      `, [idRol, estado, req.params.id, req.auth.empresaId])
    })

    res.json({ mensaje: 'Usuario actualizado' })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El correo o nombre de usuario ya existe' })
    if (err.code === '23503')
      return res.status(400).json({ error: 'El rol indicado no existe.' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// PATCH inactivar usuario (soft delete): también inactiva su membresía
router.patch('/:id/inactivar', requireAuth, requireRoles('admin'), async (req, res) => {
  try {
    if (await userHasSuperadminRole(req.params.id)) return denySuperadminMutation(res)
    const encontrado = await enTransaccion(async (client) => {
      const { rowCount } = await client.query(`
        UPDATE usuario_empresa SET "Estado" = 'inactivo'
        WHERE "Id_Usuario" = $1 AND "Id_Empresa" = $2
      `, [req.params.id, req.auth.empresaId])
      if (rowCount === 0) return false
      await client.query(`UPDATE usuario SET "Estado" = 'inactivo' WHERE "Id_Usuario" = $1`, [req.params.id])
      return true
    })
    if (!encontrado) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ mensaje: 'Usuario inactivado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// DELETE usuario (solo de la misma empresa)
router.delete('/:id', requireAuth, requireRoles('admin'), async (req, res) => {
  try {
    if (await userHasSuperadminRole(req.params.id)) return denySuperadminMutation(res)
    const { rows } = await pool.query(
      'SELECT 1 FROM usuario_empresa WHERE "Id_Usuario" = $1 AND "Id_Empresa" = $2',
      [req.params.id, req.auth.empresaId]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })

    await pool.query('DELETE FROM usuario WHERE "Id_Usuario" = $1', [req.params.id])
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (err) {
    // Las FKs de la base impiden borrar usuarios con órdenes, materiales o comprobantes.
    if (err.code === '23503')
      return res.status(409).json({ error: 'No se puede eliminar: el usuario tiene registros asociados. Inactívalo en su lugar.' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

export default router