// ═══════════════════════════════════════════════════════════════════
// emailTemplates.js — diseño único de los correos de Texticode
//
// Todos los correos (estado de orden, comprobante, tarea del operario y
// recuperación de contraseña) usan esta plantilla, con la paleta original
// de la app (azul petróleo #1f3a52 / #2d6a9f).
//
// Reglas de correo HTML: tablas + estilos en línea (Gmail y Outlook
// ignoran <style> y SVG), ancho máximo 600px y todo texto variable
// pasa por esc() para evitar inyección de HTML.
// ═══════════════════════════════════════════════════════════════════

import { env } from '../config/env.js'

// ── Paleta ───────────────────────────────────────────────────────────
export const C = {
  marca:      '#1f3a52',
  marcaHover: '#2d5580',
  acento:     '#2d6a9f',
  fondo:      '#f1f5f9',
  tarjeta:    '#ffffff',
  suave:      '#f8fafc',
  borde:      '#e2e8f0',
  texto:      '#111827',
  texto2:     '#475569',
  muted:      '#94a3b8',
}

// Tonos para estados, prioridades y avisos (mismos de la app)
export const TONOS = {
  info:    { color: '#1d4ed8', fondo: '#dbeafe', borde: '#bfdbfe' },
  exito:   { color: '#15803d', fondo: '#dcfce7', borde: '#bbf7d0' },
  aviso:   { color: '#92400e', fondo: '#fef3c7', borde: '#fde68a' },
  peligro: { color: '#b91c1c', fondo: '#fee2e2', borde: '#fecaca' },
  marca:   { color: '#1f3a52', fondo: '#e8eef4', borde: '#c7d9f0' },
  neutro:  { color: '#475569', fondo: '#f1f5f9', borde: '#e2e8f0' },
}

const FUENTE = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"

// Escapa texto antes de meterlo en el HTML (evita inyección de HTML/enlaces)
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// URL pública de la app (para el botón y el logo). En local (localhost)
// no se pone el logo porque el cliente de correo no podría descargarlo.
function urlApp() {
  return String(env.frontendUrl || '').replace(/\/+$/, '')
}
function urlLogo() {
  if (process.env.EMAIL_LOGO_URL) return process.env.EMAIL_LOGO_URL
  const base = urlApp()
  return /^https:\/\//.test(base) && !/localhost|127\.0\.0\.1/.test(base)
    ? `${base}/img/LogoTexticodeMini.jpg`
    : null
}
export function enlaceApp(ruta = '') {
  const base = urlApp()
  return base ? `${base}${ruta}` : null
}

// ── Piezas reutilizables ─────────────────────────────────────────────

/** Pastilla de color (estado, prioridad). */
export function pastilla(texto, tono = 'neutro') {
  const t = TONOS[tono] || TONOS.neutro
  return `<span style="display:inline-block;background:${t.fondo};color:${t.color};border:1px solid ${t.borde};border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;line-height:1.4;white-space:nowrap;">${esc(texto)}</span>`
}

/**
 * Tarjeta de datos en dos columnas.
 * filas: [{ etiqueta, valor, html? }]  (html = valor ya formateado, p. ej. una pastilla)
 */
export function tablaDatos(filas) {
  const visibles = filas.filter(f => f && (f.html || (f.valor !== undefined && f.valor !== null && f.valor !== '')))
  const tr = visibles.map((f, i) => `
          <tr>
            <td style="padding:12px 20px;${i ? `border-top:1px solid ${C.borde};` : ''}font-size:13px;color:${C.texto2};width:42%;vertical-align:top;">${esc(f.etiqueta)}</td>
            <td style="padding:12px 20px;${i ? `border-top:1px solid ${C.borde};` : ''}font-size:14px;color:${C.texto};font-weight:600;text-align:right;vertical-align:top;">${f.html || esc(f.valor)}</td>
          </tr>`).join('')
  return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.borde};border-radius:12px;border-collapse:separate;background:${C.suave};margin:0 0 24px;">
          ${tr}
        </table>`
}

/** Caja de aviso con borde de color a la izquierda. */
export function aviso(html, tono = 'aviso') {
  const t = TONOS[tono] || TONOS.aviso
  return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr><td style="background:${t.fondo};border-left:4px solid ${t.color};border-radius:0 10px 10px 0;padding:14px 18px;font-size:14px;line-height:1.6;color:${t.color};">${html}</td></tr>
        </table>`
}

/**
 * Línea de progreso horizontal (pasos de un pedido).
 * pasos: ['Recibida', 'En producción', ...]   actual: índice del paso actual
 */
export function lineaProgreso(pasos, actual, tono = 'marca') {
  const colorActivo = (TONOS[tono] || TONOS.marca).color
  const ancho = Math.floor(100 / pasos.length)
  const celdas = pasos.map((p, i) => {
    const hecho = i <= actual
    const esActual = i === actual
    const punto = hecho ? colorActivo : '#cbd5e1'
    const izq = i === 0 ? 'transparent' : (hecho ? colorActivo : '#e2e8f0')
    const der = i === pasos.length - 1 ? 'transparent' : (i < actual ? colorActivo : '#e2e8f0')
    const linea = (color) => `<div style="height:3px;background:${color};font-size:0;line-height:0;">&nbsp;</div>`
    return `
            <td width="${ancho}%" align="center" style="vertical-align:top;padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:middle;">${linea(izq)}</td>
                <td width="16" style="width:16px;vertical-align:middle;"><div style="width:16px;height:16px;border-radius:50%;background:${punto};${esActual ? `box-shadow:0 0 0 4px ${(TONOS[tono] || TONOS.marca).fondo};` : ''}font-size:0;line-height:0;">&nbsp;</div></td>
                <td style="vertical-align:middle;">${linea(der)}</td>
              </tr></table>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.3;color:${hecho ? C.texto : C.muted};font-weight:${esActual ? 700 : 500};">${esc(p)}</p>
            </td>`
  }).join('')
  return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
          <tr>${celdas}
          </tr>
        </table>`
}

/** Botón principal (a prueba de clientes de correo). */
export function boton(texto, url) {
  if (!url) return ''
  return `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 28px;">
          <tr><td style="border-radius:10px;background:${C.marca};">
            <a href="${esc(url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FUENTE};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(texto)} &rarr;</a>
          </td></tr>
        </table>`
}

// ── Plantilla base ───────────────────────────────────────────────────
/**
 * @param {Object} o
 * @param {string} o.marca         Nombre de la empresa que envía
 * @param {string} o.etiqueta      Texto corto arriba a la derecha (tipo de correo)
 * @param {string} o.preheader     Resumen que muestra la bandeja de entrada
 * @param {string} [o.eyebrow]     Texto pequeño sobre el título
 * @param {string} [o.tono]        Color del eyebrow (clave de TONOS)
 * @param {string} o.titulo
 * @param {string} o.intro         Párrafo de introducción (HTML ya escapado)
 * @param {string} o.cuerpo        Contenido (tarjetas, avisos, botón)
 * @param {string} [o.motivo]      Por qué recibe el correo (pie)
 */
export function plantillaCorreo({ marca, etiqueta, preheader, eyebrow, tono = 'marca', titulo, intro, cuerpo, motivo }) {
  const nombre = esc(marca || 'Texticode')
  const logo = urlLogo()
  const t = TONOS[tono] || TONOS.marca
  const anio = new Date().getFullYear()
  const app = urlApp()

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${esc(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:${C.fondo};font-family:${FUENTE};-webkit-font-smoothing:antialiased;">
  <!-- Preheader (vista previa en la bandeja de entrada) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${esc(preheader || titulo)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};">
    <tr><td align="center" style="padding:32px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.tarjeta};border-radius:16px;overflow:hidden;border:1px solid ${C.borde};">

        <!-- Franja de marca -->
        <tr><td style="height:6px;background:${C.marca};background-image:linear-gradient(90deg,${C.marca},${C.acento});font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Encabezado: logo + empresa | tipo de correo -->
        <tr>
          <td style="padding:24px 36px;border-bottom:1px solid ${C.borde};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                  ${logo ? `<td style="padding-right:10px;vertical-align:middle;"><img src="${esc(logo)}" width="32" height="30" alt="" style="display:block;border:0;"></td>` : ''}
                  <td style="vertical-align:middle;font-size:17px;font-weight:800;letter-spacing:0.06em;color:${C.marca};">${nombre.toUpperCase()}</td>
                </tr></table>
              </td>
              <td align="right" style="vertical-align:middle;font-size:12px;font-weight:600;color:${C.muted};letter-spacing:0.04em;">${esc(etiqueta || '')}</td>
            </tr></table>
          </td>
        </tr>

        <!-- Contenido -->
        <tr>
          <td style="padding:36px 36px 8px;">
            ${eyebrow ? `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${t.color};">${esc(eyebrow)}</p>` : ''}
            <h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${C.texto};">${esc(titulo)}</h1>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${C.texto2};">${intro}</p>
            ${cuerpo}
          </td>
        </tr>

        <!-- Ayuda -->
        <tr>
          <td style="padding:0 36px 32px;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:${C.muted};">¿Tienes dudas? Responde a este correo y el equipo de ${nombre} te ayudará.</p>
          </td>
        </tr>

        <!-- Pie -->
        <tr>
          <td style="background:${C.suave};border-top:1px solid ${C.borde};padding:22px 36px;">
            <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${C.texto2};font-weight:600;">${nombre}</p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:${C.muted};">
              ${motivo ? `${esc(motivo)}<br>` : ''}Este es un correo automático, enviado con Texticode · Gestión de producción textil.<br>
              ${app ? `<a href="${esc(app)}" target="_blank" style="color:${C.acento};text-decoration:none;">Abrir Texticode</a> · ` : ''}© ${anio}
            </p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`
}
