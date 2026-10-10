import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function getBearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

export function signAuthToken(user) {
  const payload = {
    id: user.Id_Usuario,
    rol: user.Id_Rol,
    usuario: user.Nombre_Usuario,
  }

  if (user.Id_Empresa !== undefined && user.Id_Empresa !== null) {
    payload.empresa = user.Id_Empresa
  }
  if (user.Empresa || user.Nombre_Empresa) {
    payload.empresaNombre = user.Empresa || user.Nombre_Empresa
  }
  if (user.Rol) {
    payload.rolNombre = user.Rol
  }

  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpires })
}

export function signSelectionToken(user) {
  return jwt.sign(
    {
      id: user.Id_Usuario,
      usuario: user.Nombre_Usuario,
      purpose: 'empresa_selection',
    },
    env.jwtSecret,
    { expiresIn: '15m' }
  )
}

export function verifySelectionToken(token) {
  const payload = jwt.verify(token, env.jwtSecret)
  if (!payload || !payload.id || payload.purpose !== 'empresa_selection') {
    const err = new Error('Token de selección de empresa inválido o sin propósito permitido.')
    err.name = 'JsonWebTokenError'
    throw err
  }
  return payload
}

export function verifyAuthToken(token) {
  const payload = jwt.verify(token, env.jwtSecret)
  if (!payload || !payload.id || !payload.rol) {
    const err = new Error('Token sin estructura de sesión válida.')
    err.name = 'JsonWebTokenError'
    throw err
  }
  return payload
}

export async function requireAuth(req, res, next) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'Sesión requerida.' })

  try {
    const payload = verifyAuthToken(token)
    const { default: db } = await import('../db.js')
    const { rows } = await db.query(
      `SELECT u."Id_Usuario", u."Nombre_Usuario", u."Nombre_Completo",
              u."Correo", u."Estado", u."Id_Rol", r."Nombre_Rol" AS "Rol"
       FROM usuario u
       INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
       WHERE u."Id_Usuario" = $1
       LIMIT 1`,
      [payload.id]
    )

    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Sesión inválida.' })
    if (user.Estado === 'inactivo') return res.status(403).json({ error: 'Usuario inactivo.' })

    const activeEmpresaId = payload.empresa || null
    const activeEmpresaNombre = payload.empresaNombre || null
    const activeRol = payload.rol || user.Id_Rol
    const activeRolNombre = payload.rolNombre || user.Rol

    req.auth = {
      id: user.Id_Usuario,
      rol: activeRol,
      rolNombre: activeRolNombre,
      empresaId: activeEmpresaId,
      empresaNombre: activeEmpresaNombre,
      usuario: user.Nombre_Usuario,
      membresia: activeEmpresaId ? {
        Id_Empresa: activeEmpresaId,
        Nombre_Empresa: activeEmpresaNombre,
        Id_Rol: activeRol,
        Rol: activeRolNombre,
      } : null,
      user,
    }
    return next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada.' })
    }
    return res.status(401).json({ error: 'Sesión inválida.' })
  }
}
