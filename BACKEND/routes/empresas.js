import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { requireSuperadmin } from '../middleware/auth.js'
import { obtenerEstadisticas, obtenerEstadisticasPorEmpresa } from '../services/emailService.js'

const router = Router()
router.use(requireSuperadmin)

function validarContrasena(contrasena) {
  if (typeof contrasena !== 'string' || contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(contrasena)) return 'La contraseña debe tener al menos una letra mayúscula.'
  if (!/[0-9]/.test(contrasena)) return 'La contraseña debe tener al menos un número.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(contrasena)) return 'La contraseña debe tener al menos un carácter especial (@, #, $, etc.).'
  return null
}

function nombreDuplicado(err) {
  return err.code === '23505'
}

function respuestaDuplicado(res) {
  return res.status(409).json({ error: 'El nombre, slug, correo o nombre de usuario ya existe.' })
}

async function comprobarNombreEmpresa(db, nombre, idEmpresa = null) {
  const { rows } = await db.query(
    `SELECT 1 FROM empresa
     WHERE lower(trim("Nombre_Empresa")) = lower(trim($1))
       AND ($2::integer IS NULL OR "Id_Empresa" <> $2)
     LIMIT 1`,
    [nombre, idEmpresa]
  )
  return rows.length > 0
}

async function obtenerAdminRoleId(db) {
  const { rows } = await db.query(
    `SELECT "Id_Rol" FROM rol
     WHERE lower(trim("Nombre_Rol")) IN ('admin', 'administrador')
     ORDER BY CASE lower(trim("Nombre_Rol")) WHEN 'admin' THEN 0 ELSE 1 END
     LIMIT 1`
  )
  return rows[0]?.Id_Rol ?? null
}

const empresaColumns = `"Id_Empresa", "Nombre_Empresa", "Slug", "Estado", "Fecha_Creacion", "Updated_At"`
const adminColumns = `u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo",
                      u."Telefono", u."Estado", u."Fecha_Registro", r."Nombre_Rol" AS "Rol"`

// Empresa + su configuración de correo (nombre comercial y correo de notificaciones).
const empresaConConfig = `
  SELECT e."Id_Empresa", e."Nombre_Empresa", e."Slug", e."Estado", e."Fecha_Creacion", e."Updated_At",
         c."Nombre_Comercial", c."Email_Notificaciones"
  FROM empresa e
  LEFT JOIN empresa_config c ON c."Id_Empresa" = e."Id_Empresa"`

const RE_EMAIL_CONFIG = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`${empresaConConfig} ORDER BY e."Id_Empresa"`)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ error: 'No se pudieron consultar las empresas.' })
  }
})

// Estadísticas de correo: globales de SendGrid + envíos por empresa (tabla email_envio).
// Va ANTES de '/:id' para que "correos" no se interprete como un id.
router.get('/correos/estadisticas', async (req, res) => {
  const { fecha } = req.query
  if (fecha !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
    return res.status(400).json({ error: 'fecha debe tener formato YYYY-MM-DD' })
  }
  try {
    const porEmpresa = await obtenerEstadisticasPorEmpresa(fecha || null)
    let global = null
    let errorGlobal = null
    try {
      global = await obtenerEstadisticas(porEmpresa.fecha)
    } catch (err) {
      errorGlobal = 'No se pudieron consultar las estadísticas de SendGrid.'
      console.warn('[SendGrid] stats:', err.message)
    }
    res.json({ fecha: porEmpresa.fecha, global, errorGlobal, empresas: porEmpresa.empresas })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`${empresaConConfig} WHERE e."Id_Empresa" = $1`, [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Empresa no encontrada.' })
    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo consultar la empresa.' })
  }
})

router.post('/', async (req, res) => {
  const empresa = req.body.empresa || {}
  const admin = req.body.administrador || {}
  const { Nombre_Empresa, Slug } = empresa
  const { Nombre_Completo, Nombre_Usuario, Correo, Telefono, Contrasena } = admin
  if (!Nombre_Empresa || !Slug || !Nombre_Completo || !Nombre_Usuario || !Correo || !Contrasena) {
    return res.status(400).json({ error: 'Empresa y administrador requieren sus campos obligatorios.' })
  }
  const errorPass = validarContrasena(Contrasena)
  if (errorPass) return res.status(400).json({ error: errorPass })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (await comprobarNombreEmpresa(client, Nombre_Empresa)) {
      await client.query('ROLLBACK')
      return respuestaDuplicado(res)
    }
    const adminRoleId = await obtenerAdminRoleId(client)
    if (!adminRoleId) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'No existe el rol admin o administrador requerido.' })
    }
    const companyResult = await client.query(
      `INSERT INTO empresa ("Nombre_Empresa", "Slug") VALUES ($1, $2)
       RETURNING ${empresaColumns}`,
      [Nombre_Empresa.trim(), Slug.trim().toLowerCase()]
    )
    const company = companyResult.rows[0]
    await client.query(
      `INSERT INTO empresa_config ("Id_Empresa") VALUES ($1)`,
      [company.Id_Empresa]
    )
    const hash = await bcrypt.hash(Contrasena, 10)
    const userResult = await client.query(
      `INSERT INTO usuario ("Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Telefono", "Estado", "Id_Rol")
       VALUES ($1, $2, $3, $4, $5, 'activo', $6)
       RETURNING "Id_Usuario", "Nombre_Completo", "Nombre_Usuario", "Correo", "Telefono", "Estado", "Fecha_Registro"`,
      [Nombre_Completo.trim(), Nombre_Usuario.trim(), Correo.trim(), hash, Telefono || null, adminRoleId]
    )
    const user = userResult.rows[0]
    await client.query(
      `INSERT INTO usuario_empresa ("Id_Usuario", "Id_Empresa", "Id_Rol", "Estado", "Es_Principal")
       VALUES ($1, $2, $3, 'activo', true)`,
      [user.Id_Usuario, company.Id_Empresa, adminRoleId]
    )
    await client.query('COMMIT')
    return res.status(201).json({ empresa: company, administrador: { ...user, Rol: 'admin' } })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    if (nombreDuplicado(err)) return respuestaDuplicado(res)
    return res.status(500).json({ error: 'No se pudo crear la empresa y su administrador.' })
  } finally {
    client.release()
  }
})

router.put('/:id', async (req, res) => {
  const { Nombre_Empresa, Slug } = req.body
  if (!Nombre_Empresa || !Slug) return res.status(400).json({ error: 'Nombre_Empresa y Slug son obligatorios.' })

  // Configuración de correo (opcional). Si la clave no viene en el body, no se toca;
  // si viene vacía, se borra (la empresa usará su nombre y el correo por defecto).
  const traeNombreComercial = Object.prototype.hasOwnProperty.call(req.body, 'Nombre_Comercial')
  const traeEmailNotif = Object.prototype.hasOwnProperty.call(req.body, 'Email_Notificaciones')
  const nombreComercial = traeNombreComercial ? String(req.body.Nombre_Comercial ?? '').trim() || null : null
  const emailNotif = traeEmailNotif ? String(req.body.Email_Notificaciones ?? '').trim() || null : null

  if (nombreComercial && nombreComercial.length > 80) {
    return res.status(400).json({ error: 'El nombre comercial no puede superar 80 caracteres.' })
  }
  if (emailNotif && (emailNotif.length > 160 || !RE_EMAIL_CONFIG.test(emailNotif))) {
    return res.status(400).json({ error: 'El correo de notificaciones no es válido.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (await comprobarNombreEmpresa(client, Nombre_Empresa, req.params.id)) {
      await client.query('ROLLBACK')
      return respuestaDuplicado(res)
    }
    const { rowCount } = await client.query(
      `UPDATE empresa SET "Nombre_Empresa" = $1, "Slug" = $2, "Updated_At" = NOW()
       WHERE "Id_Empresa" = $3`,
      [Nombre_Empresa.trim(), Slug.trim().toLowerCase(), req.params.id]
    )
    if (!rowCount) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Empresa no encontrada.' })
    }
    if (traeNombreComercial || traeEmailNotif) {
      await client.query(
        `INSERT INTO empresa_config ("Id_Empresa", "Nombre_Comercial", "Email_Notificaciones")
         VALUES ($1, $2, $3)
         ON CONFLICT ("Id_Empresa") DO UPDATE SET
           "Nombre_Comercial" = CASE WHEN $4::boolean THEN EXCLUDED."Nombre_Comercial" ELSE empresa_config."Nombre_Comercial" END,
           "Email_Notificaciones" = CASE WHEN $5::boolean THEN EXCLUDED."Email_Notificaciones" ELSE empresa_config."Email_Notificaciones" END,
           "Updated_At" = NOW()`,
        [req.params.id, nombreComercial, emailNotif, traeNombreComercial, traeEmailNotif]
      )
    }
    const { rows } = await client.query(`${empresaConConfig} WHERE e."Id_Empresa" = $1`, [req.params.id])
    await client.query('COMMIT')
    return res.json(rows[0])
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    if (nombreDuplicado(err)) return respuestaDuplicado(res)
    return res.status(500).json({ error: 'No se pudo actualizar la empresa.' })
  } finally {
    client.release()
  }
})

router.delete('/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rowCount } = await client.query(
      `UPDATE empresa SET "Estado" = 'inactiva', "Updated_At" = NOW()
       WHERE "Id_Empresa" = $1`,
      [req.params.id]
    )
    if (!rowCount) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Empresa no encontrada.' })
    }
    await client.query(
      `UPDATE usuario_empresa SET "Estado" = 'inactivo' WHERE "Id_Empresa" = $1`,
      [req.params.id]
    )
    await client.query('COMMIT')
    return res.json({ mensaje: 'Empresa desactivada.' })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    return res.status(500).json({ error: 'No se pudo desactivar la empresa.' })
  } finally {
    client.release()
  }
})

router.patch('/:id/activar', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rowCount } = await client.query(
      `UPDATE empresa SET "Estado" = 'activa', "Updated_At" = NOW()
       WHERE "Id_Empresa" = $1`,
      [req.params.id]
    )
    if (!rowCount) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Empresa no encontrada.' })
    }
    // Reactiva solo las membresías de usuarios que siguen activos
    // (los desactivados individualmente se quedan inactivos).
    await client.query(
      `UPDATE usuario_empresa ue SET "Estado" = 'activo'
       FROM usuario u
       WHERE ue."Id_Usuario" = u."Id_Usuario"
         AND ue."Id_Empresa" = $1
         AND lower(trim(u."Estado"::text)) = 'activo'`,
      [req.params.id]
    )
    await client.query('COMMIT')
    return res.json({ mensaje: 'Empresa activada.' })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('Error activando empresa:', err.message)
    return res.status(500).json({ error: 'No se pudo activar la empresa.' })
  } finally {
    client.release()
  }
})

router.get('/:id/administradores', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${adminColumns}
       FROM usuario_empresa ue
       INNER JOIN usuario u ON u."Id_Usuario" = ue."Id_Usuario"
       INNER JOIN rol r ON r."Id_Rol" = ue."Id_Rol"
       WHERE ue."Id_Empresa" = $1
         AND lower(trim(r."Nombre_Rol")) IN ('admin', 'administrador')
       ORDER BY u."Id_Usuario"`,
      [req.params.id]
    )
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ error: 'No se pudieron consultar los administradores.' })
  }
})

router.put('/:id/administradores/:idUsuario', async (req, res) => {
  const { Nombre_Completo, Nombre_Usuario, Correo, Telefono, Contrasena } = req.body
  if (!Nombre_Completo || !Nombre_Usuario || !Correo) return res.status(400).json({ error: 'Nombre, usuario y correo son obligatorios.' })
  let hash = null
  if (Contrasena) {
    const errorPass = validarContrasena(Contrasena)
    if (errorPass) return res.status(400).json({ error: errorPass })
    hash = await bcrypt.hash(Contrasena, 10)
  }
  try {
    const { rows } = await pool.query(
      `UPDATE usuario u SET "Nombre_Completo" = $1, "Nombre_Usuario" = $2,
         "Correo" = $3, "Telefono" = $4,
         "Contrasena" = COALESCE($5, u."Contrasena")
       WHERE u."Id_Usuario" = $6
         AND EXISTS (
           SELECT 1 FROM usuario_empresa ue
           INNER JOIN rol r ON r."Id_Rol" = ue."Id_Rol"
           WHERE ue."Id_Usuario" = u."Id_Usuario" AND ue."Id_Empresa" = $7
             AND lower(trim(r."Nombre_Rol")) IN ('admin', 'administrador')
         )
       RETURNING u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo", u."Telefono", u."Estado", u."Fecha_Registro"`,
      [Nombre_Completo.trim(), Nombre_Usuario.trim(), Correo.trim(), Telefono || null, hash, req.params.idUsuario, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Administrador de empresa no encontrado.' })
    return res.json(rows[0])
  } catch (err) {
    if (nombreDuplicado(err)) return respuestaDuplicado(res)
    return res.status(500).json({ error: 'No se pudo actualizar el administrador.' })
  }
})

router.patch('/:id/administradores/:idUsuario/inactivar', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `UPDATE usuario_empresa ue SET "Estado" = 'inactivo'
       FROM rol r
       WHERE ue."Id_Rol" = r."Id_Rol" AND ue."Id_Empresa" = $1 AND ue."Id_Usuario" = $2
         AND lower(trim(r."Nombre_Rol")) IN ('admin', 'administrador')
       RETURNING ue."Id_Usuario"`,
      [req.params.id, req.params.idUsuario]
    )
    if (!rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Administrador de empresa no encontrado.' })
    }
    await client.query(`UPDATE usuario SET "Estado" = 'inactivo' WHERE "Id_Usuario" = $1`, [req.params.idUsuario])
    await client.query('COMMIT')
    return res.json({ mensaje: 'Administrador desactivado.' })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    return res.status(500).json({ error: 'No se pudo desactivar el administrador.' })
  } finally {
    client.release()
  }
})

router.patch('/:id/administradores/:idUsuario/activar', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Solo se puede reactivar a un administrador si su empresa está activa.
    const empresa = await client.query(`SELECT "Estado" FROM empresa WHERE "Id_Empresa" = $1`, [req.params.id])
    if (!empresa.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Empresa no encontrada.' })
    }
    if (String(empresa.rows[0].Estado).toLowerCase() !== 'activa') {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Activa primero la empresa para poder reactivar a su administrador.' })
    }
    const { rows } = await client.query(
      `UPDATE usuario_empresa ue SET "Estado" = 'activo'
       FROM rol r
       WHERE ue."Id_Rol" = r."Id_Rol" AND ue."Id_Empresa" = $1 AND ue."Id_Usuario" = $2
         AND lower(trim(r."Nombre_Rol")) IN ('admin', 'administrador')
       RETURNING ue."Id_Usuario"`,
      [req.params.id, req.params.idUsuario]
    )
    if (!rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Administrador de empresa no encontrado.' })
    }
    await client.query(`UPDATE usuario SET "Estado" = 'activo' WHERE "Id_Usuario" = $1`, [req.params.idUsuario])
    await client.query('COMMIT')
    return res.json({ mensaje: 'Administrador activado.' })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('Error activando administrador:', err.message)
    return res.status(500).json({ error: 'No se pudo activar el administrador.' })
  } finally {
    client.release()
  }
})

export default router