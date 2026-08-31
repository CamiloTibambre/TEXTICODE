import express from 'express'
import db from '../db.js'
import {
  requireAuth,
  exchangeMobileAuthCode,
  getGoogleProfile,
  upsertGoogleTokens,
  ensureGoogleSchema,
  refreshAccessToken,
  getConnectedGoogleRow,
  getUserOrders,
  createOrUpdateCalendarEvent,
} from './googleCalendar.js'

const router = express.Router()

// GET /api/calendar/status
router.get('/status', requireAuth, async (req, res) => {
  await ensureGoogleSchema()
  const { rows } = await db.query(
    `SELECT "Google_Email" FROM google_calendar_tokens WHERE "Id_Usuario" = $1`,
    [req.auth.id]
  )
  const row = rows[0]
  res.json({ connected: !!row, calendarEmail: row?.Google_Email || null })
})

// POST /api/calendar/connect
router.post('/connect', requireAuth, async (req, res) => {
  const { serverAuthCode } = req.body
  if (!serverAuthCode) {
    return res.status(400).json({ error: 'Falta serverAuthCode.' })
  }
  try {
    const tokenPayload = await exchangeMobileAuthCode(serverAuthCode)
    const profile = await getGoogleProfile(tokenPayload.access_token)
    await upsertGoogleTokens(req.auth.id, profile, tokenPayload)
    res.json({ connected: true, calendarEmail: profile.email })
  } catch (err) {
    console.error('[calendar/connect]', err.message)
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/calendar/connect
router.delete('/connect', requireAuth, async (req, res) => {
  await ensureGoogleSchema()
  await db.query('DELETE FROM google_calendar_tokens WHERE "Id_Usuario" = $1', [req.auth.id])
  res.json({ mensaje: 'Google Calendar desvinculado correctamente.' })
})

// POST /api/calendar/sync
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const googleRow = await getConnectedGoogleRow(req.auth.id)
    const orders = await getUserOrders(req.auth)
    const accessToken = await refreshAccessToken(googleRow)

    let creados = 0
    let actualizados = 0
    for (const order of orders) {
      const r = await createOrUpdateCalendarEvent(accessToken, googleRow.Calendar_Id || 'primary', order)
      if (r.status === 'created') creados++
      else actualizados++
    }

    await db.query(
      'UPDATE google_calendar_tokens SET "Last_Sync_At" = now(), "Updated_At" = now() WHERE "Id_Usuario" = $1',
      [req.auth.id]
    )

    res.json({ creados, actualizados, total: orders.length })
  } catch (err) {
    console.error('[calendar/sync]', err.message)
    res.status(400).json({ error: err.message })
  }
})

// POST /api/calendar/sync/:idOrden
router.post('/sync/:idOrden', requireAuth, async (req, res) => {
  try {
    const googleRow = await getConnectedGoogleRow(req.auth.id)
    const orders = await getUserOrders(req.auth)
    const order = orders.find((o) => String(o.Id_Orden) === String(req.params.idOrden))
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada o sin acceso.' })
    }
    const accessToken = await refreshAccessToken(googleRow)
    await createOrUpdateCalendarEvent(accessToken, googleRow.Calendar_Id || 'primary', order)
    res.json({ mensaje: 'Orden sincronizada correctamente.' })
  } catch (err) {
    console.error('[calendar/sync/:idOrden]', err.message)
    res.status(400).json({ error: err.message })
  }
})

export default router