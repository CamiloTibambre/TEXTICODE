import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { requireSuperadmin } from '../middleware/auth.js'

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

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${empresaColumns} FROM empresa ORDER BY "Id_Empresa"`)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ error: 'No se pudieron consultar las empresas.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${empresaColumns} FROM empresa WHERE "Id_Empresa" = $1`, [req.params.id])
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
  try {
    if (await comprobarNombreEmpresa(pool, Nombre_Empresa, req.params.id)) return respuestaDuplicado(res)
    const { rows } = await pool.query(
      `UPDATE empresa SET "Nombre_Empresa" = $1, "Slug" = $2, "Updated_At" = NOW()
       WHERE "Id_Empresa" = $3 RETURNING ${empresaColumns}`,
      [Nombre_Empresa.trim(), Slug.trim().toLowerCase(), req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Empresa no encontrada.' })
    return res.json(rows[0])
  } catch (err) {
    if (nombreDuplicado(err)) return respuestaDuplicado(res)
    return res.status(500).json({ error: 'No se pudo actualizar la empresa.' })
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

export default router
