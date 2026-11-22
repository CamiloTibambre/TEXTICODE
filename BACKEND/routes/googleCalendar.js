import express from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { env } from '../config/env.js'
import { getBearerToken, requireAuth, requireSuperadmin, signAuthToken, verifyAuthToken } from '../middleware/auth.js'
import { requireRoles } from '../middleware/roles.js'
import { decryptGoogleToken, encryptGoogleToken } from '../services/googleTokenCrypto.js'

const router = express.Router()

const GOOGLE_CLIENT_ID     = env.googleClientId
const GOOGLE_CLIENT_SECRET = env.googleClientSecret
const GOOGLE_REDIRECT_URI  = env.googleRedirectUri
const FRONTEND_URL         = env.frontendUrl
const ALLOW_DIFFERENT_EMAILS = process.env.GOOGLE_ALLOW_DIFFERENT_EMAILS === 'true'
const GOOGLE_STATE_PURPOSE   = 'google_oauth_state'

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
]

function requireGoogleUser(req, res, next) {
  try {
    const payload = verifyAuthToken(getBearerToken(req))
    return payload.empresa == null ? requireSuperadmin(req, res, next) : requireAuth(req, res, next)
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' })
  }
}

export function requireGoogleConfig(res) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).json({
      error: 'Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el backend.',
    })
    return false
  }
  return true
}

function buildAppToken(user) {
  return signAuthToken(user)
}

function normalizeGoogleToken(tokens = {}) {
  return {
    accessToken:  tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    scope:        tokens.scope || GOOGLE_SCOPES.join(' '),
    tokenType:    tokens.token_type || 'Bearer',
    expiryDate:   tokens.expires_in ? Date.now() + (Number(tokens.expires_in) * 1000) : null,
  }
}

// El esquema de google_calendar_tokens lo gestiona la migración multiempresa
// (PK compuesta Id_Usuario + Id_Empresa). Se conserva la función para no romper los imports.
export async function ensureGoogleSchema() {}

// Empresa activa del usuario (su única membresía). Devuelve null si no tiene.
export async function resolverEmpresaDeUsuario(userId) {
  const { rows } = await db.query(
    `SELECT ue."Id_Empresa" FROM usuario_empresa ue
     INNER JOIN empresa e ON e."Id_Empresa" = ue."Id_Empresa" AND e."Estado" = 'activa'
     WHERE ue."Id_Usuario" = $1 AND ue."Estado" = 'activo'
     LIMIT 1`,
    [userId]
  )
  return rows[0]?.Id_Empresa ?? null
}

// Flujo WEB: intercambio de code por tokens, CON redirect_uri
// (usado por router.get('/callback', ...) más abajo).
export async function exchangeCodeForTokens(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  GOOGLE_REDIRECT_URI,
      grant_type:    'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.error || 'No se pudo obtener tokens de Google.')
  return data
}

// Flujo MÓVIL: intercambio del serverAuthCode que entrega el SDK nativo
// de Android/iOS. A diferencia del flujo web, aquí NO se manda redirect_uri.
export async function exchangeMobileAuthCode(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type:    'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.error || 'No se pudo obtener tokens de Google (móvil).')
  return data
}

export async function getGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'No se pudo leer el perfil de Google.')
  return data
}

export async function refreshAccessToken(row) {
  const accessToken = decryptGoogleToken(row.Access_Token)
  const refreshToken = decryptGoogleToken(row.Refresh_Token)
  if (!refreshToken) return accessToken
  if (row.Expiry_Date && Number(row.Expiry_Date) > Date.now() + 60000) return accessToken

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    if (data.error === 'invalid_grant') {
      await db.query('DELETE FROM google_calendar_tokens WHERE "Id_Usuario" = $1', [row.Id_Usuario])
    }
    throw new Error(data.error_description || data.error || 'No se pudo renovar la sesión de Google.')
  }

  const expiryDate = data.expires_in
    ? Date.now() + Number(data.expires_in) * 1000
    : row.Expiry_Date

  await db.query(
    `UPDATE google_calendar_tokens
     SET "Access_Token" = $1, "Expiry_Date" = $2,
         "Scope"        = COALESCE($3, "Scope"),
         "Token_Type"   = COALESCE($4, "Token_Type"),
         "Updated_At"   = now()
     WHERE "Id_Usuario" = $5`,
    [encryptGoogleToken(data.access_token), expiryDate, data.scope || null, data.token_type || null, row.Id_Usuario]
  )
  return data.access_token
}

export async function upsertGoogleTokens(userId, profile, tokenPayload, idEmpresa = null) {
  let empresaId = idEmpresa
  if (empresaId == null) {
    const user = await getUserForAuth(userId)
    if (String(user?.Rol || '').toLowerCase() !== 'superadmin') {
      empresaId = await resolverEmpresaDeUsuario(userId)
    }
  }
  const tokens = normalizeGoogleToken(tokenPayload)

  await db.query(
    `INSERT INTO google_calendar_tokens
       ("Id_Usuario", "Id_Empresa", "Google_Id", "Google_Email",
        "Access_Token", "Refresh_Token", "Scope", "Token_Type", "Expiry_Date",
        "Calendar_Id", "Sync_Enabled", "Last_Login_Google", "Updated_At")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'primary', true, now(), now())
     ON CONFLICT ("Id_Usuario") DO UPDATE SET
       "Id_Empresa"        = EXCLUDED."Id_Empresa",
       "Google_Id"         = EXCLUDED."Google_Id",
       "Google_Email"      = EXCLUDED."Google_Email",
       "Access_Token"      = EXCLUDED."Access_Token",
       "Refresh_Token"     = COALESCE(EXCLUDED."Refresh_Token", google_calendar_tokens."Refresh_Token"),
       "Scope"             = EXCLUDED."Scope",
       "Token_Type"        = EXCLUDED."Token_Type",
       "Expiry_Date"       = EXCLUDED."Expiry_Date",
       "Last_Login_Google" = now(),
       "Sync_Enabled"      = true,
       "Updated_At"        = now()`,
    [userId, empresaId, profile.id, profile.email,
     encryptGoogleToken(tokens.accessToken), encryptGoogleToken(tokens.refreshToken), tokens.scope, tokens.tokenType, tokens.expiryDate]
  )
}

function redirectWithError(res, message) {
  const url = new URL('/login', FRONTEND_URL)
  url.searchParams.set('googleError', message)
  console.log('🔴 [redirectWithError] FRONTEND_URL:', FRONTEND_URL)
  console.log('🔴 [redirectWithError] Redirigiendo a:', url.toString())
  return res.redirect(url.toString())
}

export async function getUserForAuth(id) {
  const { rows } = await db.query(
    `SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
            u."Correo", u."Estado", u."Id_Rol", r."Nombre_Rol" AS "Rol"
     FROM usuario u
     INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
     WHERE u."Id_Usuario" = $1
     LIMIT 1`,
    [id]
  )
  return rows[0]
}

router.get('/auth-url', async (req, res) => {
  if (!requireGoogleConfig(res)) return

  const action = req.query.action === 'login' ? 'login' : 'link'
  // Nonce generado por el navegador que inicia el flujo: vuelve en el callback y el frontend
  // solo acepta la sesión si coincide con el que guardó (evita el CSRF de login).
  const nonce = typeof req.query.nonce === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(req.query.nonce)
    ? req.query.nonce
    : null
  if (action === 'login' && !nonce) {
    return res.status(400).json({ error: 'Falta el nonce del inicio de sesión con Google.' })
  }
  let statePayload = { purpose: GOOGLE_STATE_PURPOSE, action, nonce }

  if (action === 'link') {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Inicia sesión para vincular Google.' })
    try {
      const auth = verifyAuthToken(token)
      if (auth.empresa == null) {
        const user = await getUserForAuth(auth.id)
        if (String(user?.Rol || '').toLowerCase() !== 'superadmin') {
          return res.status(403).json({ error: 'Tu usuario no tiene una sesión válida.' })
        }
      } else {
        const membresia = await db.query(
          `SELECT 1 FROM usuario_empresa ue
           INNER JOIN empresa e ON e."Id_Empresa" = ue."Id_Empresa" AND e."Estado" = 'activa'
           WHERE ue."Id_Usuario" = $1 AND ue."Id_Empresa" = $2 AND ue."Estado" = 'activo'`,
          [auth.id, auth.empresa]
        )
        if (!membresia.rows.length) return res.status(403).json({ error: 'Tu usuario no tiene una empresa activa.' })
      }
      statePayload = { ...statePayload, id: auth.id, empresa: auth.empresa ?? null }
    } catch {
      return res.status(401).json({ error: 'Sesión inválida o expirada.' })
    }
  }

  const state = jwt.sign(statePayload, env.jwtSecret, { expiresIn: '10m' })
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id',              GOOGLE_CLIENT_ID)
  url.searchParams.set('redirect_uri',           GOOGLE_REDIRECT_URI)
  url.searchParams.set('response_type',          'code')
  url.searchParams.set('scope',                  GOOGLE_SCOPES.join(' '))
  url.searchParams.set('access_type',            'offline')
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('prompt',                 action === 'link' ? 'consent' : 'select_account')
  url.searchParams.set('state',                  state)

  res.json({ url: url.toString(), scopes: GOOGLE_SCOPES })
})

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query
  if (error)          return redirectWithError(res, `Google rechazó la autorización: ${error}`)
  if (!code || !state) return redirectWithError(res, 'Respuesta de Google incompleta.')

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)
      throw new Error('Google OAuth no está configurado en el servidor.')

    const payload      = jwt.verify(state, env.jwtSecret)
    if (payload?.purpose !== GOOGLE_STATE_PURPOSE) throw new Error('Estado de Google OAuth inválido.')
    const tokenPayload = await exchangeCodeForTokens(code)
    const profile      = await getGoogleProfile(tokenPayload.access_token)

    if (payload.action === 'link') {
      const user = await getUserForAuth(payload.id)
      if (!user || user.Estado === 'inactivo')
        throw new Error('Tu usuario de Texticode no está activo.')
      if (!ALLOW_DIFFERENT_EMAILS && user.Correo.toLowerCase() !== profile.email.toLowerCase())
        throw new Error(`El correo de Google (${profile.email}) debe coincidir con tu usuario Texticode (${user.Correo}).`)

      await upsertGoogleTokens(user.Id_Usuario, profile, tokenPayload, payload.empresa ?? null)
      if (payload.empresa != null) programarSincronizacionUsuario(user.Id_Usuario, payload.empresa)
      const url = new URL('/google-auth/callback', FRONTEND_URL)
      url.searchParams.set('status', 'linked')
      console.log('🟡 [link] FRONTEND_URL:', FRONTEND_URL)
      console.log('🟡 [link] Redirigiendo a:', url.toString())
      return res.redirect(url.toString())
    }

    // action === 'login'
    await ensureGoogleSchema()
    const { rows } = await db.query(
      `SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
              u."Correo", u."Estado", u."Id_Rol", r."Nombre_Rol" AS "Rol",
              g."Id_Empresa", e."Nombre_Empresa",
              ue."Estado" AS "Membresia_Estado", e."Estado" AS "Empresa_Estado",
              to_jsonb(rm) ->> 'Estado' AS "Rol_Membresia_Estado"
       FROM google_calendar_tokens g
       INNER JOIN usuario u ON u."Id_Usuario" = g."Id_Usuario"
       LEFT JOIN usuario_empresa ue ON ue."Id_Usuario" = g."Id_Usuario"
         AND ue."Id_Empresa" = g."Id_Empresa"
       LEFT JOIN empresa e ON e."Id_Empresa" = g."Id_Empresa"
       INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
       LEFT JOIN rol rm ON rm."Id_Rol" = ue."Id_Rol"
       WHERE (g."Google_Id" = $1 OR g."Google_Email" = $2)
       LIMIT 1`,
      [profile.id, profile.email]
    )

    if (!rows.length) throw new Error('Esta cuenta de Google no está vinculada a un usuario activo.')

    const user = rows[0]
    if (user.Estado === 'inactivo')
      throw new Error('Tu cuenta está inactiva. Contacta al administrador.')
    const esSuperadmin = String(user.Rol || '').toLowerCase() === 'superadmin'
    if (!esSuperadmin && user.Id_Empresa == null)
      throw new Error('Tu membresía empresarial ya no está activa.')
    if (!esSuperadmin && (user.Membresia_Estado !== 'activo' || user.Empresa_Estado !== 'activa'))
      throw new Error('Tu membresía empresarial ya no está activa.')
    if (!esSuperadmin && user.Rol_Membresia_Estado === 'inactivo')
      throw new Error('Tu rol está desactivado. Contacta al administrador.')

    await upsertGoogleTokens(user.Id_Usuario, profile, tokenPayload, user.Id_Empresa)
    // El token de la app debe llevar la empresa del usuario (igual que el login normal).
    const appToken = buildAppToken(user)
    // La sesión viaja en el fragmento (#), que el navegador no envía a ningún servidor
    // ni incluye en el Referer, en lugar del query string.
    const url = new URL('/google-auth/callback', FRONTEND_URL)
    url.hash = new URLSearchParams({
      status:  'login',
      token:   appToken,
      nonce:   payload.nonce || '',
      usuario: Buffer.from(JSON.stringify({ ...user, rol: (user.Rol || '').toLowerCase() })).toString('base64url'),
    }).toString()
    return res.redirect(url.toString())

  } catch (err) {
    console.error('[google/callback]', err.message)
    return redirectWithError(res, err.message)
  }
})

router.get('/status', requireGoogleUser, async (req, res) => {
  await ensureGoogleSchema()
  const { rows } = await db.query(
    `SELECT "Google_Email", "Scope", "Calendar_Id", "Sync_Enabled",
            "Last_Login_Google", "Last_Sync_At", "Updated_At"
     FROM google_calendar_tokens
     WHERE "Id_Usuario" = $1`,
    [req.auth.id]
  )
  const row = rows[0]
  res.json({
    connected: !!row,
    profile: row ? {
      email:           row.Google_Email,
      calendarId:      row.Calendar_Id,
      syncEnabled:     !!row.Sync_Enabled,
      lastLoginGoogle: row.Last_Login_Google,
      lastSyncAt:      row.Last_Sync_At,
      updatedAt:       row.Updated_At,
      scopes:          row.Scope?.split(' ') || [],
    } : null,
  })
})

export async function revokeAndDeleteGoogleTokens(userId) {
  const { rows } = await db.query('SELECT "Access_Token", "Refresh_Token" FROM google_calendar_tokens WHERE "Id_Usuario" = $1', [userId])
  const token = decryptGoogleToken(rows[0]?.Refresh_Token || rows[0]?.Access_Token)
  if (token) {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      if (!response.ok && response.status !== 400) {
        console.error('[google/unlink] Google no confirmó la revocación:', response.status)
      }
    } catch (error) {
      console.error('[google/unlink] No se pudo revocar el token:', error.message)
    }
  }
  await db.query('DELETE FROM google_calendar_tokens WHERE "Id_Usuario" = $1', [userId])
}

router.delete('/unlink', requireGoogleUser, async (req, res) => {
  await revokeAndDeleteGoogleTokens(req.auth.id)
  res.json({ mensaje: 'Cuenta de Google desvinculada correctamente.' })
})

router.patch('/settings', requireGoogleUser, async (req, res) => {
  await ensureGoogleSchema()
  const syncEnabled = !!req.body.syncEnabled
  const calendarId  = req.body.calendarId || 'primary'
  await db.query(
    `UPDATE google_calendar_tokens
     SET "Sync_Enabled" = $1, "Calendar_Id" = $2, "Updated_At" = now()
     WHERE "Id_Usuario" = $3`,
    [syncEnabled, calendarId, req.auth.id]
  )
  res.json({ mensaje: 'Preferencias de Google Calendar actualizadas.' })
})

export async function getConnectedGoogleRow(userId, idEmpresa = null) {
  const { rows } = await db.query(
    `SELECT * FROM google_calendar_tokens
     WHERE "Id_Usuario" = $1
     LIMIT 1`,
    [userId]
  )
  if (!rows.length) throw new Error('Primero vincula tu cuenta con Google Calendar.')
  if (!rows[0].Sync_Enabled) throw new Error('La sincronización con Google Calendar está desactivada.')
  return rows[0]
}

function extractDateStr(val) {
  if (!val) return null
  if (typeof val === 'string') {
    const m = val.match(/^(\d{4}-\d{2}-\d{2})/)
    if (m) return m[1]
  }
  if (val instanceof Date) {
    const year = val.getFullYear()
    const month = String(val.getMonth() + 1).padStart(2, '0')
    const day = String(val.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return null
}

function addOneDayStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + 1))
  const nextY = dt.getUTCFullYear()
  const nextM = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const nextD = String(dt.getUTCDate()).padStart(2, '0')
  return `${nextY}-${nextM}-${nextD}`
}

export async function getUserOrders(auth) {
  const user = await getUserForAuth(auth.id)
  if (!user) return []

  const operarioSubquery = `
    COALESCE(
      o."Nombre_Completo",
      (SELECT string_agg(DISTINCT uop."Nombre_Completo", ', ')
       FROM orden_operario oo2
       INNER JOIN usuario uop ON uop."Id_Usuario" = oo2."Id_Operario"
       WHERE oo2."Id_Orden" = op."Id_Orden")
    ) AS "Operario"
  `

  if (Number(user.Id_Rol) === 1) {
    const { rows } = await db.query(
      `SELECT op."Id_Orden", op."Id_Empresa", op."Producto", op."Descripcion", op."Cantidad",
              op."Prioridad", op."Estado", op."Fecha_Limite", op."Fecha_Creacion",
              c."Nombre_Completo" AS "Cliente",
              ${operarioSubquery}
       FROM orden_produccion op
       LEFT JOIN usuario c ON c."Id_Usuario" = op."Id_Cliente"
       LEFT JOIN usuario o ON o."Id_Usuario" = op."Id_Operario"
       WHERE op."Id_Empresa" = $1
         AND op."Fecha_Limite" IS NOT NULL
         AND (op."Estado" IN ('En Proceso', 'Retrasada') OR op."Fecha_Limite" >= CURRENT_DATE - INTERVAL '30 days')
       ORDER BY op."Fecha_Limite" ASC
       LIMIT 500`,
      [auth.empresaId]
    )
    return rows
  }

  if (Number(user.Id_Rol) === 2) {
    const { rows } = await db.query(
      `SELECT op."Id_Orden", op."Id_Empresa", op."Producto", op."Descripcion", op."Cantidad",
              op."Prioridad", op."Estado", op."Fecha_Limite", op."Fecha_Creacion",
              c."Nombre_Completo" AS "Cliente",
              ${operarioSubquery}
       FROM orden_produccion op
       LEFT JOIN usuario c ON c."Id_Usuario" = op."Id_Cliente"
       LEFT JOIN usuario o ON o."Id_Usuario" = op."Id_Operario"
       WHERE (
         op."Id_Operario" = $1
         OR EXISTS (
           SELECT 1 FROM orden_operario oo
           WHERE oo."Id_Orden" = op."Id_Orden" AND oo."Id_Operario" = $1
         )
         OR EXISTS (
           SELECT 1 FROM usuario_orden uo
           WHERE uo."Id_Orden" = op."Id_Orden" AND uo."Id_Usuario" = $1
         )
       )
       AND op."Id_Empresa" = $2
       AND op."Fecha_Limite" IS NOT NULL
       AND (op."Estado" IN ('En Proceso', 'Retrasada') OR op."Fecha_Limite" >= CURRENT_DATE - INTERVAL '30 days')
       ORDER BY op."Fecha_Limite" ASC
       LIMIT 500`,
      [auth.id, auth.empresaId]
    )
    return rows
  }

  const { rows } = await db.query(
    `SELECT op."Id_Orden", op."Id_Empresa", op."Producto", op."Descripcion", op."Cantidad",
            op."Prioridad", op."Estado", op."Fecha_Limite", op."Fecha_Creacion",
            c."Nombre_Completo" AS "Cliente",
            ${operarioSubquery}
     FROM orden_produccion op
     LEFT JOIN usuario c ON c."Id_Usuario" = op."Id_Cliente"
     LEFT JOIN usuario o ON o."Id_Usuario" = op."Id_Operario"
     WHERE op."Id_Cliente" = $1
       AND op."Id_Empresa" = $2
       AND op."Fecha_Limite" IS NOT NULL
       AND (op."Estado" IN ('En Proceso', 'Retrasada') OR op."Fecha_Limite" >= CURRENT_DATE - INTERVAL '30 days')
     ORDER BY op."Fecha_Limite" ASC
     LIMIT 500`,
    [auth.id, auth.empresaId]
  )
  return rows
}

function toGoogleEvent(order) {
  const startDateStr = extractDateStr(order.Fecha_Limite) || new Date().toISOString().slice(0, 10)
  const endDateStr   = addOneDayStr(startDateStr)

  return {
    summary: `Texticode: entrega orden #${order.Id_Orden} — ${order.Producto || 'Producción'}`,
    description: [
      `Orden: #${order.Id_Orden}`,
      `Producto: ${order.Producto || 'No especificado'}`,
      `Descripción: ${order.Descripcion || 'Sin descripción'}`,
      `Cantidad: ${order.Cantidad || '—'}`,
      `Prioridad: ${order.Prioridad || '—'}`,
      `Estado: ${order.Estado || '—'}`,
      `Cliente: ${order.Cliente || '—'}`,
      `Operario: ${order.Operario || '—'}`,
      'Evento creado automáticamente desde Texticode.',
    ].join('\n'),
    start: { date: startDateStr },
    end:   { date: endDateStr },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 },
        { method: 'email', minutes: 48 * 60 },
      ],
    },
    colorId: order.Prioridad === 'Alta' ? '11' : order.Prioridad === 'Media' ? '5' : '2',
    extendedProperties: { private: {
      texticodeOrderId: String(order.Id_Orden),
      texticodeCompanyId: String(order.Id_Empresa || ''),
    } },
  }
}

function googleApiError(data, fallback, status) {
  const error = new Error(data?.error?.message || fallback)
  error.status = status
  return error
}

export async function createOrUpdateCalendarEvent(accessToken, calendarId, order, knownEventId = null) {
  let existing = knownEventId ? { id: knownEventId } : null
  if (!existing) {
    const params = new URLSearchParams({
      privateExtendedProperty: `texticodeOrderId=${order.Id_Orden}`,
      maxResults: '1',
    })
    if (order.Id_Empresa) params.append('privateExtendedProperty', `texticodeCompanyId=${order.Id_Empresa}`)
    const listRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const listData = await listRes.json()
    if (!listRes.ok) {
      throw googleApiError(listData, 'No se pudo buscar el evento en Google Calendar.', listRes.status)
    }
    existing = listData.items?.[0] || null
  }

  const event    = toGoogleEvent(order)
  const url = existing
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existing.id)}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`

  const res = await fetch(url, {
    method:  existing ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(event),
  })
  const data = await res.json()
  if (!res.ok && res.status === 404 && knownEventId) {
    return createOrUpdateCalendarEvent(accessToken, calendarId, order)
  }
  if (!res.ok) {
    throw googleApiError(data, 'No se pudo crear o actualizar el evento.', res.status)
  }
  return { id: data.id, htmlLink: data.htmlLink, status: existing ? 'updated' : 'created', orderId: order.Id_Orden }
}

async function usuariosAsignadosAOrden(idOrden, empresaId) {
  const { rows } = await db.query(`
    SELECT DISTINCT asignados."Id_Usuario"
    FROM (
      SELECT "Id_Operario" AS "Id_Usuario" FROM orden_produccion
      WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2 AND "Id_Operario" IS NOT NULL
      UNION
      SELECT "Id_Cliente" FROM orden_produccion
      WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2 AND "Id_Cliente" IS NOT NULL
      UNION
      SELECT "Id_Operario" FROM orden_operario
      WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2
      UNION
      SELECT "Id_Usuario" FROM usuario_orden
      WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2
      UNION
      SELECT ue."Id_Usuario"
      FROM usuario_empresa ue
      INNER JOIN rol r ON r."Id_Rol" = ue."Id_Rol"
      WHERE ue."Id_Empresa" = $2 AND ue."Estado" = 'activo'
        AND lower(trim(r."Nombre_Rol")) IN ('admin', 'administrador')
    ) asignados
  `, [idOrden, empresaId])
  return rows.map(row => Number(row.Id_Usuario))
}

async function eliminarEventoAsignado(mapping) {
  try {
    const googleRow = await getConnectedGoogleRow(mapping.Id_Usuario)
    const token = await refreshAccessToken(googleRow)
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(mapping.Calendar_Id || 'primary')}/events/${encodeURIComponent(mapping.Google_Event_Id)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    )
    if (!response.ok && response.status !== 404 && response.status !== 410) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error?.message || `Google respondió ${response.status}`)
    }
  } catch (error) {
    console.error(`[google/auto] No se pudo eliminar el evento de usuario ${mapping.Id_Usuario}:`, error.message)
  } finally {
    await db.query(
      'DELETE FROM google_calendar_events WHERE "Id_Empresa" = $1 AND "Id_Orden" = $2 AND "Id_Usuario" = $3',
      [mapping.Id_Empresa, mapping.Id_Orden, mapping.Id_Usuario]
    )
  }
}

export async function sincronizarOrdenAutomaticamente(idOrden, empresaId) {
  const orderResult = await db.query(`
    SELECT op."Id_Orden", op."Id_Empresa", op."Producto", op."Descripcion", op."Cantidad", op."Prioridad",
           op."Estado", op."Fecha_Limite", op."Fecha_Creacion", c."Nombre_Completo" AS "Cliente"
    FROM orden_produccion op
    LEFT JOIN usuario c ON c."Id_Usuario" = op."Id_Cliente"
    WHERE op."Id_Orden" = $1 AND op."Id_Empresa" = $2
  `, [idOrden, empresaId])
  const order = orderResult.rows[0]
  const mappingsResult = await db.query(
    'SELECT * FROM google_calendar_events WHERE "Id_Empresa" = $1 AND "Id_Orden" = $2',
    [empresaId, idOrden]
  )
  if (!order) {
    for (const mapping of mappingsResult.rows) await eliminarEventoAsignado(mapping)
    return
  }

  const currentUsers = order.Estado === 'Completada' ? [] : await usuariosAsignadosAOrden(idOrden, empresaId)
  const currentSet = new Set(currentUsers)
  for (const mapping of mappingsResult.rows.filter(row => !currentSet.has(Number(row.Id_Usuario)))) {
    await eliminarEventoAsignado(mapping)
  }

  for (const userId of currentUsers) {
    try {
      const googleRow = await getConnectedGoogleRow(userId)
      const accessToken = await refreshAccessToken(googleRow)
      const knownEvent = mappingsResult.rows.find(row => Number(row.Id_Usuario) === userId)?.Google_Event_Id || null
      const result = await createOrUpdateCalendarEvent(accessToken, googleRow.Calendar_Id || 'primary', order, knownEvent)
      await db.query(`
        INSERT INTO google_calendar_events
          ("Id_Empresa", "Id_Orden", "Id_Usuario", "Google_Event_Id", "Calendar_Id", "Updated_At")
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT ("Id_Empresa", "Id_Orden", "Id_Usuario") DO UPDATE SET
          "Google_Event_Id" = EXCLUDED."Google_Event_Id",
          "Calendar_Id" = EXCLUDED."Calendar_Id",
          "Updated_At" = now()
      `, [empresaId, idOrden, userId, result.id, googleRow.Calendar_Id || 'primary'])
    } catch (error) {
      // Un 401 significa que Google ya no reconoce la credencial guardada. Se
      // elimina la vinculación para que el perfil no muestre un estado falso y
      // el usuario pueda autorizar de nuevo la cuenta de forma limpia.
      if (error.status === 401) {
        await db.query('DELETE FROM google_calendar_tokens WHERE "Id_Usuario" = $1', [userId])
      }
      if (!/Primero vincula|desactivada/.test(error.message)) {
        console.error(`[google/auto] Orden ${idOrden}, usuario ${userId}:`, error.message)
      }
    }
  }
}

export function programarSincronizacionOrden(idOrden, empresaId) {
  setImmediate(() => {
    sincronizarOrdenAutomaticamente(idOrden, empresaId)
      .catch(error => console.error(`[google/auto] Orden ${idOrden}:`, error.message))
  })
}

export function programarSincronizacionUsuario(userId, empresaId) {
  setImmediate(async () => {
    try {
      const rolResult = await db.query(`
        SELECT lower(trim(r."Nombre_Rol")) AS rol
        FROM usuario_empresa ue
        INNER JOIN rol r ON r."Id_Rol" = ue."Id_Rol"
        WHERE ue."Id_Usuario" = $1 AND ue."Id_Empresa" = $2 AND ue."Estado" = 'activo'
        LIMIT 1
      `, [userId, empresaId])
      const esAdmin = ['admin', 'administrador'].includes(rolResult.rows[0]?.rol)
      const { rows } = await db.query(`
        SELECT DISTINCT op."Id_Orden"
        FROM orden_produccion op
        WHERE op."Id_Empresa" = $2 AND op."Estado" <> 'Completada'
          AND (
            $3::boolean
            OR
            op."Id_Cliente" = $1
            OR
            op."Id_Operario" = $1
            OR EXISTS (SELECT 1 FROM orden_operario oo WHERE oo."Id_Orden" = op."Id_Orden" AND oo."Id_Empresa" = $2 AND oo."Id_Operario" = $1)
            OR EXISTS (SELECT 1 FROM usuario_orden uo WHERE uo."Id_Orden" = op."Id_Orden" AND uo."Id_Empresa" = $2 AND uo."Id_Usuario" = $1)
          )
      `, [userId, empresaId, esAdmin])
      for (const row of rows) await sincronizarOrdenAutomaticamente(row.Id_Orden, empresaId)
    } catch (error) {
      console.error(`[google/auto] Sincronización inicial de usuario ${userId}:`, error.message)
    }
  })
}

router.post('/sync/delivery-events', requireAuth, async (req, res) => {
  try {
    const googleRow    = await getConnectedGoogleRow(req.auth.id, req.auth.empresaId)
    const orders       = await getUserOrders(req.auth)
    const accessToken  = await refreshAccessToken(googleRow)
    const results      = []

    for (const order of orders) {
      results.push(await createOrUpdateCalendarEvent(accessToken, googleRow.Calendar_Id || 'primary', order))
    }

    await db.query(
      'UPDATE google_calendar_tokens SET "Last_Sync_At" = now(), "Updated_At" = now() WHERE "Id_Usuario" = $1',
      [req.auth.id]
    )
    res.json({ mensaje: 'Entregas sincronizadas con Google Calendar.', total: results.length, results })
  } catch (err) {
    console.error('[google/sync]', err.message)
    res.status(err.code ? 500 : 400).json({ error: err.code ? 'Error interno del servidor.' : err.message })
  }
})

router.get('/events/upcoming', requireAuth, async (req, res) => {
  try {
    const googleRow   = await getConnectedGoogleRow(req.auth.id, req.auth.empresaId)
    const accessToken = await refreshAccessToken(googleRow)

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const params = new URLSearchParams({
      timeMin:      startOfToday.toISOString(),
      maxResults:   String(req.query.limit || 100),
      singleEvents: 'true',
      orderBy:      'startTime',
      q:            'Texticode',
    })
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleRow.Calendar_Id || 'primary')}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'No se pudieron consultar eventos.')

    res.json({
      events: (data.items || []).map(event => ({
        id:       event.id,
        summary:  event.summary,
        start:    event.start,
        end:      event.end,
        htmlLink: event.htmlLink,
      })),
    })
  } catch (err) {
    console.error('[google/upcoming]', err.message)
    res.status(err.code ? 500 : 400).json({ error: err.code ? 'Error interno del servidor.' : err.message })
  }
})

router.get('/connected-users', requireAuth, requireRoles('admin'), async (req, res) => {
  if (Number(req.auth.rol) !== 1) return res.status(403).json({ error: 'Solo administradores.' })
  await ensureGoogleSchema()
  const { rows } = await db.query(
    `SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo",
            r."Nombre_Rol" AS "Rol", g."Google_Email", g."Sync_Enabled",
            g."Last_Login_Google", g."Last_Sync_At", g."Updated_At"
     FROM usuario u
     INNER JOIN usuario_empresa ue ON ue."Id_Usuario" = u."Id_Usuario" AND ue."Id_Empresa" = $1
     INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
     LEFT JOIN google_calendar_tokens g ON g."Id_Usuario" = u."Id_Usuario"
     ORDER BY (g."Updated_At" IS NULL) ASC, g."Updated_At" DESC, u."Nombre_Completo" ASC`,
    [req.auth.empresaId]
  )
  res.json({ users: rows })
})

router.delete('/unlink-user/:idUsuario', requireAuth, requireRoles('admin'), async (req, res) => {
  if (Number(req.auth.rol) !== 1) return res.status(403).json({ error: 'Solo administradores.' })
  const { idUsuario } = req.params
  await db.query(
    `DELETE FROM google_calendar_tokens g
     USING usuario_empresa ue
     WHERE g."Id_Usuario" = $1 AND ue."Id_Usuario" = g."Id_Usuario" AND ue."Id_Empresa" = $2`,
    [idUsuario, req.auth.empresaId]
  )
  res.json({ mensaje: 'Cuenta de Google desvinculada por el administrador.' })
})

export default router
