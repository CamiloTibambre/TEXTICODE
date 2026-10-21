const ROLE_ALIASES = {
  admin: ['admin', 'administrador'],
  operario: ['operario', 'operador'],
  cliente: ['cliente'],
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase()
}

export function hasRole(auth, allowedRoles = []) {
  if (!auth) return false
  const roleName = normalizeRole(auth.rolNombre)
  const roleId = Number(auth.rol)

  return allowedRoles.some(role => {
    const normalized = normalizeRole(role)
    if (normalized === 'admin' && roleId === 1) return true
    if (normalized === 'operario' && roleId === 2) return true
    if (normalized === 'cliente' && roleId === 3) return true
    return (ROLE_ALIASES[normalized] || [normalized]).includes(roleName)
  })
}

export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (hasRole(req.auth, allowedRoles)) return next()
    return res.status(403).json({ error: 'No tienes permisos para esta operación.' })
  }
}

export function requireSelfParamOrRoles(paramName, ...allowedRoles) {
  return (req, res, next) => {
    if (hasRole(req.auth, allowedRoles)) return next()
    if (String(req.params[paramName]) === String(req.auth?.id)) return next()
    return res.status(403).json({ error: 'No tienes permisos para este recurso.' })
  }
}
