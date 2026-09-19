import express from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

const JWT_SECRET  = process.env.JWT_SECRET  || 'cambia_este_secreto_seguro'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h'
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI  = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback'
const FRONTEND_URL         = process.env.FRONTEND_URL || 'http://localhost:5173'
const ALLOW_DIFFERENT_EMAILS = process.env.GOOGLE_ALLOW_DIFFERENT_EMAILS === 'true'

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]

export function requireGoogleConfig(res) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).json({
      error: 'Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el backend.',
    })
    return false
  }
  return true
}

function getBearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}

export function requireAuth(req, res, next) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'Sesión requerida.' })

  try {
    req.auth = jwt.verify(token, JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' })
  }
}

function buildAppToken(user) {
  return jwt.sign(
    { id: user.Id_Usuario, rol: user.Id_Rol, usuario: user.Nombre_Usuario },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )
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

export async function ensureGoogleSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS google_calendar_tokens (
      "Id_Usuario"         int          NOT NULL,
      "Google_Id"          varchar(255) DEFAULT NULL,
      "Google_Email"       varchar(255) DEFAULT NULL,
      "Access_Token"       text         NOT NULL,
      "Refresh_Token"      text         DEFAULT NULL,
      "Scope"              text         DEFAULT NULL,
      "Token_Type"         varchar(50)  DEFAULT NULL,
      "Expiry_Date"        bigint       DEFAULT NULL,
      "Calendar_Id"        varchar(255) NOT NULL DEFAULT 'primary',
      "Sync_Enabled"       boolean      NOT NULL DEFAULT true,
      "Last_Login_Google"  timestamp    DEFAULT NULL,
      "Last_Sync_At"       timestamp    DEFAULT NULL,
      "Created_At"         timestamp    NOT NULL DEFAULT now(),
      "Updated_At"         timestamp    NOT NULL DEFAULT now(),
      PRIMARY KEY ("Id_Usuario"),
      CONSTRAINT fk_google_calendar_usuario
        FOREIGN KEY ("Id_Usuario") REFERENCES usuario("Id_Usuario") ON DELETE CASCADE
    )
  `)
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
  if (!row.Refresh_Token) return row.Access_Token
  if (row.Expiry_Date && Number(row.Expiry_Date) > Date.now() + 60000) return row.Access_Token

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: row.Refresh_Token,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.error || 'No se pudo renovar la sesión de Google.')

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
    [data.access_token, expiryDate, data.scope || null, data.token_type || null, row.Id_Usuario]
  )
  return data.access_token
}

export async function upsertGoogleTokens(userId, profile, tokenPayload) {
  await ensureGoogleSchema()
  const tokens = normalizeGoogleToken(tokenPayload)

  await db.query(
    `INSERT INTO google_calendar_tokens
       ("Id_Usuario", "Google_Id", "Google_Email",
        "Access_Token", "Refresh_Token", "Scope", "Token_Type", "Expiry_Date",
        "Calendar_Id", "Sync_Enabled", "Last_Login_Google", "Updated_At")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'primary', true, now(), now())
     ON CONFLICT ("Id_Usuario") DO UPDATE SET
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
    [userId, profile.id, profile.email,
     tokens.accessToken, tokens.refreshToken, tokens.scope, tokens.tokenType, tokens.expiryDate]
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
  let statePayload = { action }

  if (action === 'link') {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Inicia sesión para vincular Google.' })
    try {
      const auth = jwt.verify(token, JWT_SECRET)
      statePayload = { action, id: auth.id }
    } catch {
      return res.status(401).json({ error: 'Sesión inválida o expirada.' })
    }
  }

  const state = jwt.sign(statePayload, JWT_SECRET, { expiresIn: '10m' })
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

    const payload      = jwt.verify(state, JWT_SECRET)
    const tokenPayload = await exchangeCodeForTokens(code)
    const profile      = await getGoogleProfile(tokenPayload.access_token)

    if (payload.action === 'link') {
      const user = await getUserForAuth(payload.id)
      if (!user || user.Estado === 'inactivo')
        throw new Error('Tu usuario de Texticode no está activo.')
      if (!ALLOW_DIFFERENT_EMAILS && user.Correo.toLowerCase() !== profile.email.toLowerCase())
        throw new Error(`El correo de Google (${profile.email}) debe coincidir con tu usuario Texticode (${user.Correo}).`)

      await upsertGoogleTokens(user.Id_Usuario, profile, tokenPayload)
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
              u."Correo", u."Estado", u."Id_Rol", r."Nombre_Rol" AS "Rol"
       FROM google_calendar_tokens g
       INNER JOIN usuario u ON u."Id_Usuario" = g."Id_Usuario"
       INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
       WHERE (g."Google_Id" = $1 OR g."Google_Email" = $2)
       LIMIT 1`,
      [profile.id, profile.email]
    )

    if (!rows.length)
      throw new Error('Esta cuenta de Google aún no está vinculada a un usuario creado por el administrador.')

    const user = rows[0]
    if (user.Estado === 'inactivo')
      throw new Error('Tu cuenta está inactiva. Contacta al administrador.')

    await upsertGoogleTokens(user.Id_Usuario, profile, tokenPayload)
    const appToken = buildAppToken(user)
    const url = new URL('/google-auth/callback', FRONTEND_URL)
    url.searchParams.set('status',  'login')
    url.searchParams.set('token',   appToken)
    url.searchParams.set('usuario', Buffer.from(JSON.stringify({ ...user, rol: (user.Rol || '').toLowerCase() })).toString('base64url'))
    console.log('🟢 [login] FRONTEND_URL:', FRONTEND_URL)
    console.log('🟢 [login] Redirigiendo a:', url.toString())
    return res.redirect(url.toString())

  } catch (err) {
    console.error('[google/callback]', err.message)
    return redirectWithError(res, err.message)
  }
})

router.get('/status', requireAuth, async (req, res) => {
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

router.delete('/unlink', requireAuth, async (req, res) => {
  await db.query('DELETE FROM google_calendar_tokens WHERE "Id_Usuario" = $1', [req.auth.id])
  res.json({ mensaje: 'Cuenta de Google desvinculada correctamente.' })
})

router.patch('/settings', requireAuth, async (req, res) => {
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

export async function getConnectedGoogleRow(userId) {
  await ensureGoogleSchema()
  const { rows } = await db.query(
    'SELECT * FROM google_calendar_tokens WHERE "Id_Usuario" = $1 LIMIT 1',
    [userId]
  )
  if (!rows.length) throw new Error('Primero vincula tu cuenta con Google Calendar.')
  if (!rows[0].Sync_Enabled) throw new Error('La sincronización con Google Calendar está desactivada.')
  return rows[0]
}

export async function getUserOrders(auth) {
  const user = await getUserForAuth(auth.id)
  if (!user) return []

  if (Number(user.Id_Rol) === 1) {
    const { rows } = await db.query(
      `SELECT op."Id_Orden", op."Producto", op."Descripcion", op."Cantidad",
              op."Prioridad", op."Estado", op."Fecha_Limite", op."Fecha_Creacion",
              c."Nombre_Completo" AS "Cliente", o."Nombre_Completo" AS "Operario"
       FROM orden_produccion op
       LEFT JOIN usuario c ON c."Id_Usuario" = op."Id_Cliente"
       LEFT JOIN usuario o ON o."Id_Usuario" = op."Id_Operario"
       WHERE op."Fecha_Limite" >= CURRENT_DATE
       ORDER BY op."Fecha_Limite" ASC
       LIMIT 50`
    )
    return rows
  }

  if (Number(user.Id_Rol) === 2) {
    const { rows } = await db.query(
      `SELECT op."Id_Orden", op."Producto", op."Descripcion", op."Cantidad",
              op."Prioridad", op."Estado", op."Fecha_Limite", op."Fecha_Creacion",
              c."Nombre_Completo" AS "Cliente", o."Nombre_Completo" AS "Operario"
       FROM orden_produccion op
       LEFT JOIN usuario c ON c."Id_Usuario" = op."Id_Cliente"
       LEFT JOIN usuario o ON o."Id_Usuario" = op."Id_Operario"
       WHERE (op."Id_Operario" = $1 OR EXISTS (
         SELECT 1 FROM usuario_orden uo WHERE uo."Id_Orden" = op."Id_Orden" AND uo."Id_Usuario" = $2
       )) AND op."Fecha_Limite" >= CURRENT_DATE
       ORDER BY op."Fecha_Limite" ASC
       LIMIT 50`,
      [auth.id, auth.id]
    )
    return rows
  }

  const { rows } = await db.query(
    `SELECT op."Id_Orden", op."Producto", op."Descripcion", op."Cantidad",
            op."Prioridad", op."Estado", op."Fecha_Limite", op."Fecha_Creacion",
            c."Nombre_Completo" AS "Cliente", o."Nombre_Completo" AS "Operario"
     FROM orden_produccion op
     LEFT JOIN usuario c ON c."Id_Usuario" = op."Id_Cliente"
     LEFT JOIN usuario o ON o."Id_Usuario" = op."Id_Operario"
     WHERE op."Id_Cliente" = $1 AND op."Fecha_Limite" >= CURRENT_DATE
     ORDER BY op."Fecha_Limite" ASC
     LIMIT 50`,
    [auth.id]
  )
  return rows
}

function toGoogleEvent(order) {
  const date = new Date(order.Fecha_Limite)
  const end  = new Date(date)
  end.setDate(end.getDate() + 1)

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
    start: { date: date.toISOString().slice(0, 10) },
    end:   { date: end.toISOString().slice(0, 10) },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 },
        { method: 'email', minutes: 48 * 60 },
      ],
    },
    colorId: order.Prioridad === 'Alta' ? '11' : order.Prioridad === 'Media' ? '5' : '2',
    extendedProperties: { private: { texticodeOrderId: String(order.Id_Orden) } },
  }
}

export async function createOrUpdateCalendarEvent(accessToken, calendarId, order) {
  const params = new URLSearchParams({
    privateExtendedProperty: `texticodeOrderId=${order.Id_Orden}`,
    maxResults: '1',
  })
  const listRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const listData = await listRes.json()
  if (!listRes.ok) throw new Error(listData.error?.message || 'No se pudo buscar el evento en Google Calendar.')

  const event    = toGoogleEvent(order)
  const existing = listData.items?.[0]
  const url = existing
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existing.id)}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`

  const res = await fetch(url, {
    method:  existing ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(event),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'No se pudo crear o actualizar el evento.')
  return { id: data.id, htmlLink: data.htmlLink, status: existing ? 'updated' : 'created', orderId: order.Id_Orden }
}

router.post('/sync/delivery-events', requireAuth, async (req, res) => {
  try {
    const googleRow    = await getConnectedGoogleRow(req.auth.id)
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
    res.status(400).json({ error: err.message })
  }
})

router.get('/events/upcoming', requireAuth, async (req, res) => {
  try {
    const googleRow   = await getConnectedGoogleRow(req.auth.id)
    const accessToken = await refreshAccessToken(googleRow)
    const params = new URLSearchParams({
      timeMin:      new Date().toISOString(),
      maxResults:   String(req.query.limit || 10),
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
    res.status(400).json({ error: err.message })
  }
})

router.get('/connected-users', requireAuth, async (req, res) => {
  if (Number(req.auth.rol) !== 1) return res.status(403).json({ error: 'Solo administradores.' })
  await ensureGoogleSchema()
  const { rows } = await db.query(
    `SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario", u."Correo",
            r."Nombre_Rol" AS "Rol", g."Google_Email", g."Sync_Enabled",
            g."Last_Login_Google", g."Last_Sync_At", g."Updated_At"
     FROM usuario u
     INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
     LEFT JOIN google_calendar_tokens g ON g."Id_Usuario" = u."Id_Usuario"
     ORDER BY (g."Updated_At" IS NULL) ASC, g."Updated_At" DESC, u."Nombre_Completo" ASC`
  )
  res.json({ users: rows })
})

export default router