import { exchangeMobileAuthCode, upsertGoogleTokens } from './googleCalendar.js'
import express  from 'express'
import crypto   from 'crypto'
import sgMail   from '@sendgrid/mail'
import db       from '../db.js'
import bcrypt   from 'bcryptjs'
import { env } from '../config/env.js'
import { signAuthToken } from '../middleware/auth.js'
import { getUserMemberships, processLogin, selectEmpresa } from '../services/auth.service.js'

const router = express.Router()

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

if (env.sendgridApiKey) sgMail.setApiKey(env.sendgridApiKey)

// ─────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body
  const identificador = correo || req.body.usuario || req.body.nombreUsuario

  if (!identificador || !contrasena) {
    return res.status(400).json({ error: 'Completa todos los campos.' })
  }

  try {
    const result = await processLogin(db, {
      identificador,
      contrasena,
    })

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

    if (result.type === 'membership_invariant_violation') {
      return res.status(409).json({ error: result.error, code: 'MEMBERSHIP_INVARIANT' })
    }

    return res.status(200).json({
      token: result.token,
      usuario: result.usuario,
      ...(result.empresaActiva ? { empresaActiva: result.empresaActiva } : {}),
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message })
    }
    console.error('Error en /login:', err)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/select-empresa
// DEPRECADO: se conserva por compatibilidad, pero ignora la empresa del cliente.
// ─────────────────────────────────────────────────────────
router.post('/select-empresa', async (req, res) => {
  const { token } = req.body
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7).trim()
    : null
  const selectionToken = token || headerToken

  try {
    const result = await selectEmpresa(db, {
      selectionToken,
    })

    return res.status(200).json({
      mensaje: 'Empresa seleccionada exitosamente',
      token: result.token,
      empresaActiva: result.empresaActiva,
      usuario: result.usuario,
    })
  } catch (err) {
    const status = err.statusCode || 500
    return res.status(status).json({ error: err.message })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/google/mobile
// Login desde la app móvil usando el idToken del SDK nativo de Google.
// ─────────────────────────────────────────────────────────
router.post('/google/mobile', async (req, res) => {
  const { idToken, serverAuthCode } = req.body

  if (!idToken) {
    return res.status(400).json({ error: 'Falta idToken.' })
  }

  try {
    // 1) Verificar el idToken directamente contra Google
    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    )
    const info = await infoRes.json()

    if (!infoRes.ok || !info.email) {
      return res.status(401).json({ error: 'Token de Google inválido.' })
    }

    // 2) Buscar el usuario de Texticode por correo (debe existir, lo crea el admin)
    const { rows } = await db.query(
      `SELECT u."Id_Usuario", u."Nombre_Completo", u."Nombre_Usuario",
              u."Correo", u."Estado", u."Id_Rol", r."Nombre_Rol" AS "Rol"
       FROM usuario u
       INNER JOIN rol r ON r."Id_Rol" = u."Id_Rol"
       WHERE LOWER(u."Correo") = LOWER($1)
       LIMIT 1`,
      [info.email]
    )

    if (!rows.length) {
      return res.status(404).json({
        error: 'No existe un usuario de Texticode con este correo de Google.',
      })
    }

    const user = rows[0]
    if (user.Estado === 'inactivo') {
      return res.status(403).json({ error: 'Tu cuenta está inactiva. Contacta al administrador.' })
    }

    const memberships = await getUserMemberships(db, user.Id_Usuario)
    if (String(user.Rol || '').trim().toLowerCase() === 'superadmin'
      && (memberships === null || memberships.length === 0)) {
      const token = signAuthToken(user)
      return res.status(200).json({
        token,
        usuario: user,
      })
    }
    if (memberships?.length === 0) {
      return res.status(403).json({ error: 'El usuario no tiene membresías activas.' })
    }
    if (memberships && memberships.length !== 1) {
      return res.status(409).json({ error: 'La cuenta no tiene una membresía empresarial única.' })
    }
    const membership = memberships?.[0] || null
    const sessionUser = membership ? {
      ...user,
      Id_Empresa: membership.Id_Empresa,
      Empresa: membership.Nombre_Empresa,
      Id_Rol: membership.Id_Rol,
      Rol: membership.Rol,
    } : user

    // 3) Si llegó serverAuthCode, vincula Calendar de una vez (no bloquea el login si falla)
    if (serverAuthCode) {
      try {
        const tokenPayload = await exchangeMobileAuthCode(serverAuthCode)
        await upsertGoogleTokens(user.Id_Usuario, { id: info.sub, email: info.email }, tokenPayload)
      } catch (e) {
        console.error('[auth/google/mobile] no se pudo vincular Calendar:', e.message)
      }
    }

    const token = signAuthToken(sessionUser)

    return res.status(200).json({
      token,
      usuario: {
        Id_Usuario:      sessionUser.Id_Usuario,
        Nombre_Completo: sessionUser.Nombre_Completo,
        Nombre_Usuario:  sessionUser.Nombre_Usuario,
        Correo:          sessionUser.Correo,
        Id_Rol:          sessionUser.Id_Rol,
        Rol:             sessionUser.Rol,
        Estado:          sessionUser.Estado,
        ...(membership ? { Id_Empresa: membership.Id_Empresa, Empresa: membership.Nombre_Empresa } : {}),
      },
      ...(membership ? { empresaActiva: { Id_Empresa: membership.Id_Empresa, Nombre_Empresa: membership.Nombre_Empresa } } : {}),
    })
  } catch (err) {
    console.error('[auth/google/mobile]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/recuperar-contrasena
// ─────────────────────────────────────────────────────────
router.post('/recuperar-contrasena', async (req, res) => {
  const { email } = req.body
  console.log('[recuperar-contrasena] solicitud recibida')

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('[recuperar-contrasena] correo con formato inválido, se corta aquí')
    return res.status(400).json({ mensaje: 'El correo no es válido.' })
  }

  try {
    const { rows } = await db.query(
      `SELECT u."Id_Usuario", u."Nombre_Completo", u."Correo"
       FROM usuario u
       WHERE u."Correo" = $1
       LIMIT 1`,
      [email.trim().toLowerCase()]
    )
    console.log('[recuperar-contrasena] filas encontradas en usuario:', rows.length)

    if (!rows.length) {
      console.log('[recuperar-contrasena] solicitud procesada')
      return res.status(200).json({ mensaje: 'Si el correo está registrado, recibirás el enlace.' })
    }

    const usuario = rows[0]

    const token      = crypto.randomBytes(32).toString('hex')
    const expiracion = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await db.query(
      `INSERT INTO tokens_recuperacion ("Id_Usuario", token, expiracion, usado)
       VALUES ($1, $2, $3, false)
       ON CONFLICT ("Id_Usuario")
       DO UPDATE SET token = EXCLUDED.token, expiracion = EXCLUDED.expiracion, usado = false`,
      [usuario.Id_Usuario, token, expiracion]
    )

    const enlace = `${env.frontendUrl}/cambiar-contrasena?token=${token}`
    console.log('[recuperar-contrasena] token generado, enviando correo')

    const sgResponse = await sgMail.send({
      to:      usuario.Correo,
      from:    env.sendgridFromEmail,
      subject: 'Texticode — Cambiar contraseña',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
            <tr><td align="center">
              <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;
                box-shadow:0 4px 24px rgba(0,0,0,0.10);">
                <tr>
                  <td style="background:linear-gradient(135deg,#1f3a52,#2d6a9f);padding:32px;text-align:center;">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Texticode</p>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Sistema de gestión textil</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <div style="text-align:center;margin-bottom:20px;">
                      <span style="font-size:40px;">🔐</span>
                    </div>
                    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0d1f2d;text-align:center;">
                      Cambio de contraseña
                    </h2>
                    <p style="font-size:14px;color:#4b5563;text-align:center;line-height:1.6;">
                      Hola <strong style="color:#1f3a52;">${usuario.Nombre_Completo}</strong>,
                      recibimos una solicitud para cambiar tu contraseña en Texticode.
                    </p>
                    <div style="text-align:center;margin:24px 0;">
                      <a href="${enlace}" style="display:inline-block;padding:14px 32px;
                        background:linear-gradient(135deg,#1f3a52,#2d5478);
                        color:#fff;text-decoration:none;border-radius:10px;
                        font-size:15px;font-weight:600;">
                        Cambiar contraseña
                      </a>
                    </div>
                    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
                      <p style="margin:0;font-size:12.5px;color:#92400e;text-align:center;">
                        ⏱ Este enlace expira en <strong>1 hora</strong>.
                      </p>
                    </div>
                    <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:16px;">
                      Si no solicitaste este cambio, ignora este correo.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 32px 28px;text-align:center;border-top:1px solid #f3f4f6;">
                    <p style="margin:0;font-size:11px;color:#c4c9d4;">
                      Texticode © 2026 · Sistema de gestión textil · ADSO 2026
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `
    })
    console.log('[recuperar-contrasena] sgMail.send() OK, status code:', sgResponse?.[0]?.statusCode)

    return res.status(200).json({ mensaje: 'Si el correo está registrado, recibirás el enlace.' })

  } catch (err) {
    console.error('[recuperar-contrasena] ERROR:', err?.response?.body || err.message)
    return res.status(500).json({ mensaje: 'Error interno. Intenta más tarde.' })
  }
})

// ─────────────────────────────────────────────────────────
// GET /api/auth/validar-token?token=xxx
// ─────────────────────────────────────────────────────────
router.get('/validar-token', async (req, res) => {
  const { token } = req.query

  if (!token) {
    return res.status(400).json({ mensaje: 'Token requerido' })
  }

  try {
    const { rows } = await db.query(
      `SELECT id FROM tokens_recuperacion
       WHERE token = $1 AND usado = false AND expiracion > NOW()`,
      [token]
    )

    if (rows.length === 0) {
      return res.status(400).json({ mensaje: 'Token inválido o expirado' })
    }

    return res.status(200).json({ valido: true })
  } catch (error) {
    console.error('Error validando token:', error)
    return res.status(500).json({ mensaje: 'Error del servidor' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/cambiar-contrasena
// ─────────────────────────────────────────────────────────
router.post('/cambiar-contrasena', async (req, res) => {
  const { token, nuevaPassword } = req.body

  if (!token || !nuevaPassword) {
    return res.status(400).json({ mensaje: 'Datos incompletos' })
  }

  const errorPass = validarContrasena(nuevaPassword)
  if (errorPass) return res.status(400).json({ mensaje: errorPass })

  try {
    const { rows } = await db.query(
      `SELECT id, "Id_Usuario" FROM tokens_recuperacion
       WHERE token = $1 AND usado = false AND expiracion > NOW()`,
      [token]
    )

    if (rows.length === 0) {
      return res.status(400).json({ mensaje: 'El enlace es inválido o ya expiró. Solicita uno nuevo.' })
    }

    const { id: tokenId, Id_Usuario } = rows[0]

    const hash = await bcrypt.hash(nuevaPassword, 10)

    await db.query(
      `UPDATE usuario SET "Contrasena" = $1 WHERE "Id_Usuario" = $2`,
      [hash, Id_Usuario]
    )

    await db.query(
      `UPDATE tokens_recuperacion SET usado = true WHERE id = $1`,
      [tokenId]
    )

    return res.status(200).json({ mensaje: 'Contraseña actualizada exitosamente' })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    return res.status(500).json({ mensaje: 'Error del servidor' })
  }
})

export default router
