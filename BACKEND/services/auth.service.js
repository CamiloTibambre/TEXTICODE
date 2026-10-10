import bcrypt from 'bcryptjs'
import { signAuthToken, signSelectionToken, verifySelectionToken } from '../middleware/auth.js'

/**
 * Sanitiza el objeto de usuario removiendo datos sensibles como la contraseña.
 */
export function sanitizeUser(user) {
  if (!user) return null
  const { Contrasena, password, contrasena, ...safeUser } = user
  return safeUser
}

/**
 * Autentica las credenciales de un usuario buscando por Correo o Nombre_Usuario.
 * Admite contraseñas con hash bcrypt ($2...) y contraseñas legadas en texto plano.
 *
 * @param {object} dbClient Cliente o pool de base de datos con método query()
 * @param {object} credentials { identificador, contrasena }
 * @returns {Promise<{ user: object }>}
 */
export async function authenticateCredentials(dbClient, { identificador, contrasena }) {
  if (!identificador || !contrasena) {
    const error = new Error('Completa todos los campos obligatorios.')
    error.statusCode = 400
    throw error
  }

  const { rows } = await dbClient.query(
    `SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
            u."Correo", u."Contrasena", u."Estado", u."Id_Rol",
            r."Nombre_Rol" AS "Rol"
     FROM usuario u
     INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
     WHERE u."Correo" = $1 OR u."Nombre_Usuario" = $1
     LIMIT 1`,
    [identificador.trim()]
  )

  if (rows.length === 0) {
    const error = new Error('Credenciales incorrectas.')
    error.statusCode = 401
    throw error
  }

  const user = rows[0]

  if (user.Estado === 'inactivo') {
    const error = new Error('Tu cuenta está inactiva. Contacta al administrador.')
    error.statusCode = 403
    throw error
  }

  let passwordValida = false
  const esHash = user.Contrasena && user.Contrasena.startsWith('$2')
  if (esHash) {
    passwordValida = await bcrypt.compare(contrasena, user.Contrasena)
  } else {
    passwordValida = (contrasena === user.Contrasena)
  }

  if (!passwordValida) {
    const error = new Error('Credenciales incorrectas.')
    error.statusCode = 401
    throw error
  }

  return { user: sanitizeUser(user) }
}

/**
 * Consulta las membresías activas de un usuario en usuario_empresa y empresa.
 * Si las tablas aún no existen en la base de datos (PostgreSQL 42P01), retorna null
 * para permitir la degradación graciosa al modo monopromesa/legado.
 *
 * @param {object} dbClient
 * @param {number} idUsuario
 * @returns {Promise<Array<object>|null>}
 */
export async function getUserMemberships(dbClient, idUsuario) {
  try {
    const { rows } = await dbClient.query(
      `SELECT ue."Id_Empresa", e."Nombre_Empresa", e."Estado" AS "Empresa_Estado",
              ue."Id_Rol", r."Nombre_Rol" AS "Rol", ue."Estado" AS "Membresia_Estado",
              ue."Es_Principal"
       FROM usuario_empresa ue
       INNER JOIN empresa e ON e."Id_Empresa" = ue."Id_Empresa"
       INNER JOIN rol r ON r."Id_Rol" = ue."Id_Rol"
       WHERE ue."Id_Usuario" = $1
         AND ue."Estado" = 'activo'
         AND e."Estado" = 'activa'
       ORDER BY ue."Es_Principal" DESC, ue."Id_Empresa" ASC`,
      [idUsuario]
    )
    return rows
  } catch (err) {
    // Código PostgreSQL 42P01 = undefined_table (tablas multiempresa no creadas aún)
    if (err.code === '42P01') {
      return null
    }
    throw err
  }
}

/**
 * Flujo central de inicio de sesión con soporte multiempresa y compatibilidad con el esquema actual.
 *
 * @param {object} dbClient Cliente o pool de BD
 * @param {object} params { identificador, contrasena, idEmpresaDeseada }
 * @returns {Promise<object>} Resultado del login con tipo de respuesta
 */
export async function processLogin(dbClient, { identificador, contrasena, idEmpresaDeseada = null }) {
  const { user } = await authenticateCredentials(dbClient, { identificador, contrasena })

  const memberships = await getUserMemberships(dbClient, user.Id_Usuario)

  // 1. Modo de compatibilidad / transición: Tablas multiempresa no existen en la BD todavía
  if (memberships === null) {
    const token = signAuthToken(user)
    return {
      status: 'success',
      type: 'legacy',
      token,
      usuario: user,
    }
  }

  // 2. Usuario sin membresías activas
  if (memberships.length === 0) {
    return {
      status: 'no_memberships',
      type: 'no_memberships',
      error: 'El usuario no tiene membresías activas en ninguna empresa.',
      usuario: user,
    }
  }

  // 3. Si se solicitó una empresa específica en el login
  if (idEmpresaDeseada !== null && idEmpresaDeseada !== undefined) {
    const desiredId = Number(idEmpresaDeseada)
    const membership = memberships.find(m => Number(m.Id_Empresa) === desiredId)

    if (!membership) {
      return {
        status: 'unauthorized_tenant',
        type: 'unauthorized_tenant',
        error: 'No tienes acceso a la empresa solicitada o está inactiva.',
        usuario: user,
      }
    }

    return issueTenantSession(user, membership)
  }

  // 4. Si el usuario pertenece exactamente a 1 empresa activa
  if (memberships.length === 1) {
    return issueTenantSession(user, memberships[0])
  }

  // 5. Si el usuario pertenece a múltiples empresas activas -> Se requiere selección
  const selectionToken = signSelectionToken(user)
  return {
    status: 'requires_selection',
    type: 'requires_selection',
    requiresEmpresaSelection: true,
    selectionToken,
    empresas: memberships.map(m => ({
      Id_Empresa: m.Id_Empresa,
      Nombre_Empresa: m.Nombre_Empresa,
      Id_Rol: m.Id_Rol,
      Rol: m.Rol,
      Es_Principal: Boolean(m.Es_Principal),
    })),
    usuario: user,
  }
}

/**
 * Resuelve la selección de empresa mediante selectionToken o sesión previa.
 *
 * @param {object} dbClient
 * @param {object} params { userId, selectionToken, idEmpresa }
 * @returns {Promise<object>}
 */
export async function selectEmpresa(dbClient, { userId, selectionToken, idEmpresa }) {
  if (!idEmpresa) {
    const error = new Error('Debes indicar la empresa a seleccionar.')
    error.statusCode = 400
    throw error
  }

  let resolvedUserId = userId
  let userBasicInfo = null

  if (selectionToken) {
    const payload = verifySelectionToken(selectionToken)
    resolvedUserId = payload.id
    userBasicInfo = {
      Id_Usuario: payload.id,
      Nombre_Usuario: payload.usuario,
    }
  }

  if (!resolvedUserId) {
    const error = new Error('Identidad de usuario no especificada o token de selección ausente.')
    error.statusCode = 401
    throw error
  }

  // Obtener usuario completo si no lo tenemos
  if (!userBasicInfo || !userBasicInfo.Correo) {
    const { rows } = await dbClient.query(
      `SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
              u."Correo", u."Estado", u."Id_Rol", r."Nombre_Rol" AS "Rol"
       FROM usuario u
       INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
       WHERE u."Id_Usuario" = $1
       LIMIT 1`,
      [resolvedUserId]
    )
    if (rows.length === 0 || rows[0].Estado === 'inactivo') {
      const error = new Error('Usuario inexistente o inactivo.')
      error.statusCode = 403
      throw error
    }
    userBasicInfo = sanitizeUser(rows[0])
  }

  const memberships = await getUserMemberships(dbClient, resolvedUserId)

  if (!memberships || memberships.length === 0) {
    const error = new Error('El usuario no tiene membresías activas.')
    error.statusCode = 403
    throw error
  }

  const targetId = Number(idEmpresa)
  const selectedMembership = memberships.find(m => Number(m.Id_Empresa) === targetId)

  if (!selectedMembership) {
    const error = new Error('No tienes acceso a la empresa solicitada o está inactiva.')
    error.statusCode = 403
    throw error
  }

  return issueTenantSession(userBasicInfo, selectedMembership)
}

/**
 * Construye y emite la sesión final para la empresa seleccionada.
 */
function issueTenantSession(user, membership) {
  const sessionUser = {
    ...user,
    Id_Empresa: membership.Id_Empresa,
    Empresa: membership.Nombre_Empresa,
    Id_Rol: membership.Id_Rol,
    Rol: membership.Rol,
  }

  const token = signAuthToken(sessionUser)

  return {
    status: 'success',
    type: 'authenticated',
    token,
    empresaActiva: {
      Id_Empresa: membership.Id_Empresa,
      Nombre_Empresa: membership.Nombre_Empresa,
      Id_Rol: membership.Id_Rol,
      Rol: membership.Rol,
    },
    usuario: sessionUser,
  }
}
