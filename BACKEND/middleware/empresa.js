/**
 * Middleware para exigir contexto de empresa activa en rutas empresariales.
 * Verifica que el token de sesión autenticado cuente con un `empresaId` válido.
 */
export function requireEmpresa(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Sesión requerida.' })
  }

  if (!req.auth.empresaId) {
    return res.status(403).json({
      error: 'Se requiere una empresa activa para acceder a este recurso.',
      code: 'TENANT_REQUIRED',
    })
  }

  return next()
}

/**
 * Helper para validar que un parámetro de empresa o recurso coincida con la empresa activa.
 * 
 * @param {string|number} expectedEmpresaId
 * @param {object} auth Objeto req.auth
 * @returns {boolean}
 */
export function isSameEmpresa(expectedEmpresaId, auth) {
  if (!auth || !auth.empresaId || expectedEmpresaId === undefined || expectedEmpresaId === null) {
    return false
  }
  return String(expectedEmpresaId) === String(auth.empresaId)
}
