// services/emailService.js
// ─── Servicio central de SendGrid para Texticode ──────────────────────────────
import dotenv from 'dotenv';
dotenv.config();

import sgMail from '@sendgrid/mail';
import pool from '../db.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Multiempresa: una sola cuenta de SendGrid y un remitente verificado
// (SENDGRID_FROM_EMAIL). Lo que cambia por empresa es el NOMBRE visible del
// remitente, el Reply-To (empresa_config.Email_Notificaciones) y el texto de las plantillas.
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const FROM_NAME_DEFAULT = process.env.SENDGRID_FROM_NAME || 'Texticode';
const RE_EMAIL = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;

// Limpia un texto para usarlo como nombre en cabeceras de correo (sin saltos de línea ni comillas/<>).
function nombreSeguro(value, fallback) {
  const limpio = String(value ?? '').replace(/[\r\n"<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  return limpio || fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE ENVÍOS POR EMPRESA (tabla email_envio)
// Las estadísticas de SendGrid son de toda la cuenta; para que cada empresa vea
// solo lo suyo se registra cada envío en la base de datos.
// ─────────────────────────────────────────────────────────────────────────────
// msg.to puede ser string, { email, name } o un arreglo de ellos.
function correoDestino(to) {
  const uno = (x) => (typeof x === 'string' ? x : x?.email || '');
  return Array.isArray(to) ? to.map(uno).filter(Boolean).join(', ') : uno(to);
}

async function registrarEnvio({ empresaId, tipo, destinatario, ordenId = null, estado, error = null }) {
  if (!empresaId) return;
  try {
    await pool.query(
      `INSERT INTO email_envio ("Id_Empresa", "Tipo", "Destinatario", "Id_Orden", "Estado", "Error")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [empresaId, tipo, correoDestino(destinatario).slice(0, 200), ordenId ?? null, estado, error ? String(error).slice(0, 500) : null]
    );
  } catch (err) {
    // El registro nunca debe impedir ni romper el envío del correo.
    console.warn('[email_envio] No se pudo registrar el envío:', err.message);
  }
}

async function enviarYRegistrar(msg, { empresaId, tipo, ordenId = null }) {
  try {
    await sgMail.send(msg);
  } catch (err) {
    const detalle = err.response?.body?.errors?.[0]?.message || err.message;
    await registrarEnvio({ empresaId, tipo, destinatario: msg.to, ordenId, estado: 'error', error: detalle });
    throw err;
  }
  await registrarEnvio({ empresaId, tipo, destinatario: msg.to, ordenId, estado: 'enviado' });
}

function fechaBogota(fecha) {
  if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

// Estadísticas de UNA empresa (día en hora de Bogotá).
export async function obtenerEstadisticasEmpresa(empresaId, fecha = null) {
  const dia = fechaBogota(fecha);
  const { rows } = await pool.query(
    `SELECT "Tipo", "Estado", COUNT(*)::int AS n
       FROM email_envio
      WHERE "Id_Empresa" = $1
        AND "Fecha" >= ($2::date::timestamp AT TIME ZONE 'America/Bogota')
        AND "Fecha" <  (($2::date + 1)::timestamp AT TIME ZONE 'America/Bogota')
      GROUP BY "Tipo", "Estado"`,
    [empresaId, dia]
  );
  const por_tipo = {};
  let enviados = 0, errores = 0;
  for (const r of rows) {
    por_tipo[r.Tipo] ??= { enviados: 0, errores: 0 };
    if (r.Estado === 'enviado') { por_tipo[r.Tipo].enviados += r.n; enviados += r.n; }
    else { por_tipo[r.Tipo].errores += r.n; errores += r.n; }
  }
  return { fecha: dia, enviados, errores, por_tipo };
}

// Todas las empresas (solo superadmin): una fila por empresa, aunque no haya envíos.
export async function obtenerEstadisticasPorEmpresa(fecha = null) {
  const dia = fechaBogota(fecha);
  const { rows } = await pool.query(
    `SELECT e."Id_Empresa", e."Nombre_Empresa",
            COUNT(x."Id_Envio") FILTER (WHERE x."Estado" = 'enviado')::int AS enviados,
            COUNT(x."Id_Envio") FILTER (WHERE x."Estado" <> 'enviado')::int AS errores
       FROM empresa e
       LEFT JOIN email_envio x
         ON x."Id_Empresa" = e."Id_Empresa"
        AND x."Fecha" >= ($1::date::timestamp AT TIME ZONE 'America/Bogota')
        AND x."Fecha" <  (($1::date + 1)::timestamp AT TIME ZONE 'America/Bogota')
      GROUP BY e."Id_Empresa", e."Nombre_Empresa"
      ORDER BY e."Id_Empresa"`,
    [dia]
  );
  return { fecha: dia, empresas: rows };
}

// Marca de la empresa: { nombre, from, replyTo }
export async function obtenerMarcaEmpresa(empresaId) {
  let nombre = FROM_NAME_DEFAULT;
  let replyEmail = null;
  if (empresaId) {
    const { rows } = await pool.query(
      `SELECT e."Nombre_Empresa", c."Nombre_Comercial", c."Email_Notificaciones"
       FROM empresa e
       LEFT JOIN empresa_config c ON c."Id_Empresa" = e."Id_Empresa"
       WHERE e."Id_Empresa" = $1`,
      [empresaId]
    );
    if (rows[0]) {
      nombre = nombreSeguro(rows[0].Nombre_Comercial || rows[0].Nombre_Empresa, FROM_NAME_DEFAULT);
      const correo = String(rows[0].Email_Notificaciones || '').trim();
      if (RE_EMAIL.test(correo)) replyEmail = correo;
    }
  }
  return {
    nombre,
    from: { email: FROM_EMAIL, name: nombre },
    replyTo: replyEmail ? { email: replyEmail, name: nombre } : undefined,
  };
}

// Escapa texto antes de meterlo en el HTML del correo (evita inyección de HTML/enlaces).
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Etiquetas visuales por estado ─────────────────────────────────────────────
const ESTADO_META = {
  'Pendiente':   { emoji: '⏳', color: '#f59e0b', label: 'Pendiente de inicio' },
  'En Proceso':  { emoji: '🔄', color: '#3b82f6', label: 'En producción'       },
  'Completada':  { emoji: '✅', color: '#10b981', label: 'Lista para entrega'   },
  'Retrasada':   { emoji: '⚠️', color: '#dc2626', label: 'Retrasada'            },
  'Entregada':   { emoji: '📦', color: '#8b5cf6', label: 'Entregada exitosamente' },
  'Cancelada':   { emoji: '❌', color: '#ef4444', label: 'Cancelada'            },
};

// ── Template HTML reutilizable ─────────────────────────────────────────────────
function baseTemplate({ titulo, contenido, color = '#6366f1', marca }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header con color de estado -->
        <tr>
          <td style="background:${color};padding:28px 40px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;
                      letter-spacing:2px;text-transform:uppercase;font-weight:600;">
              ${esc(marca.nombre)} — SISTEMA DE GESTIÓN TEXTIL
            </p>
          </td>
        </tr>

        <!-- Contenido principal -->
        <tr>
          <td style="padding:40px;">
            ${contenido}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 40px;text-align:center;
                     border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
              Este es un correo automático generado por ${esc(marca.nombre)}.<br>
              Si tienes dudas, contacta al administrador del sistema.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NOTIFICACIÓN DE CAMBIO DE ESTADO DE ORDEN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {Object} params
 * @param {number}   params.ordenId
 * @param {string}   params.clienteEmail
 * @param {string}   params.clienteNombre
 * @param {string}   params.estado         - 'En Proceso' | 'Completada' | 'Entregada' | ...
 * @param {string}   params.productos      - Descripción de los productos de la orden
 * @param {string}   [params.observaciones]
 */
export async function notificarCambioEstado({
  empresaId, ordenId, clienteEmail, clienteNombre, estado, productos, observaciones = '',
}) {
  const marca = await obtenerMarcaEmpresa(empresaId);
  const meta = ESTADO_META[estado] || { emoji: '📋', color: '#6366f1', label: estado };

  const contenido = `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px;">
      ${meta.emoji} Tu orden ha sido actualizada
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:15px;">
      Hola <strong>${esc(clienteNombre)}</strong>, te informamos que el estado de tu orden ha cambiado.
    </p>

    <!-- Tarjeta de estado -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
                padding:24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#64748b;font-size:13px;font-weight:600;
                     text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">
            Orden
          </td>
          <td style="color:#64748b;font-size:13px;font-weight:600;
                     text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">
            Estado actual
          </td>
        </tr>
        <tr>
          <td style="color:#1e293b;font-size:20px;font-weight:700;">#${ordenId}</td>
          <td>
            <span style="background:${meta.color};color:#fff;border-radius:20px;
                         padding:4px 14px;font-size:14px;font-weight:600;">
              ${esc(meta.label)}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Productos -->
    <div style="margin-bottom:24px;">
      <p style="margin:0 0 6px;color:#64748b;font-size:13px;font-weight:600;
                text-transform:uppercase;letter-spacing:1px;">Productos</p>
      <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.6;">
        ${esc(productos)}
      </p>
    </div>

    ${observaciones ? `
    <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:14px 18px;
                border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
        <strong>Observaciones:</strong> ${esc(observaciones)}
      </p>
    </div>` : ''}

    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
      Si tienes alguna pregunta sobre tu pedido, puedes responder directamente a este correo.
    </p>
  `;

  const msg = {
    to:      { email: clienteEmail, name: clienteNombre },
    from:    marca.from,
    ...(marca.replyTo ? { replyTo: marca.replyTo } : {}),
    subject: `${marca.nombre} — Orden #${ordenId}: ${meta.label}`,
    html:    baseTemplate({ titulo: `Orden #${ordenId} actualizada`, contenido, color: meta.color, marca }),
  };

  await enviarYRegistrar(msg, { empresaId, tipo: 'estado', ordenId });
  return { enviado: true, destinatario: clienteEmail, estado };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ENVÍO DE COMPROBANTE DE ENTREGA CON PDF ADJUNTO
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {Object} params
 * @param {number}   params.ordenId
 * @param {string}   params.clienteEmail
 * @param {string}   params.clienteNombre
 * @param {string}   params.productos
 * @param {string}   params.pdfBase64      - PDF en base64 (sin prefijo data:...)
 * @param {string}   [params.fechaEntrega]
 */
export async function enviarComprobante({
  empresaId, ordenId, clienteEmail, clienteNombre, productos, pdfBase64, fechaEntrega,
}) {
  const marca = await obtenerMarcaEmpresa(empresaId);
  const fecha = fechaEntrega || new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const contenido = `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px;">
      📦 Comprobante de entrega
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:15px;">
      Hola <strong>${esc(clienteNombre)}</strong>, tu orden <strong>#${ordenId}</strong>
      ha sido entregada exitosamente. Adjuntamos el comprobante oficial.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
                padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#166534;font-size:13px;font-weight:600;
                text-transform:uppercase;letter-spacing:1px;">Resumen de entrega</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          <td style="color:#374151;font-size:14px;padding:4px 0;">
            <strong>Orden N°:</strong>
          </td>
          <td style="color:#1e293b;font-size:14px;font-weight:600;padding:4px 0;">
            #${ordenId}
          </td>
        </tr>
        <tr>
          <td style="color:#374151;font-size:14px;padding:4px 0;">
            <strong>Productos:</strong>
          </td>
          <td style="color:#1e293b;font-size:14px;padding:4px 0;">
            ${esc(productos)}
          </td>
        </tr>
        <tr>
          <td style="color:#374151;font-size:14px;padding:4px 0;">
            <strong>Fecha de entrega:</strong>
          </td>
          <td style="color:#1e293b;font-size:14px;padding:4px 0;">
            ${esc(fecha)}
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
      El comprobante está adjunto en formato PDF. Guárdalo como respaldo de tu compra.
    </p>
  `;

  const msg = {
    to:      { email: clienteEmail, name: clienteNombre },
    from:    marca.from,
    ...(marca.replyTo ? { replyTo: marca.replyTo } : {}),
    subject: `${marca.nombre} — Comprobante de entrega Orden #${ordenId}`,
    html:    baseTemplate({
      titulo:   `Comprobante Orden #${ordenId}`,
      contenido,
      color:    '#8b5cf6',
      marca,
    }),
    attachments: [{
      content:     pdfBase64,
      filename:    `comprobante_orden_${ordenId}.pdf`,
      type:        'application/pdf',
      disposition: 'attachment',
    }],
  };

  await enviarYRegistrar(msg, { empresaId, tipo: 'comprobante', ordenId });
  return { enviado: true, destinatario: clienteEmail, adjunto: `comprobante_orden_${ordenId}.pdf` };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. NOTIFICACIÓN A OPERARIO — NUEVA TAREA ASIGNADA
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {Object} params
 * @param {string}   params.operarioEmail
 * @param {string}   params.operarioNombre
 * @param {string}   params.tarea
 * @param {number}   params.ordenId
 * @param {string}   [params.prioridad]    - 'Alta' | 'Media' | 'Normal'
 * @param {string}   [params.fechaLimite]
 */
export async function notificarTareaOperario({
  empresaId, operarioEmail, operarioNombre, tarea, ordenId, prioridad = 'Normal', fechaLimite = '',
}) {
  const marca = await obtenerMarcaEmpresa(empresaId);
  const prioridadColor = { Alta: '#ef4444', Media: '#f59e0b', Normal: '#10b981' }[prioridad] || '#6366f1';

  const contenido = `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px;">
      🔧 Nueva tarea asignada
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:15px;">
      Hola <strong>${esc(operarioNombre)}</strong>, se te ha asignado una nueva tarea de producción.
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
                padding:24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td colspan="2" style="padding-bottom:16px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:13px;font-weight:600;
                      text-transform:uppercase;letter-spacing:1px;">Tarea</p>
            <p style="margin:0;color:#1e293b;font-size:16px;font-weight:600;">
              ${esc(tarea)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="width:50%;padding-top:12px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;
                      text-transform:uppercase;">Orden</p>
            <p style="margin:0;color:#1e293b;font-size:15px;font-weight:600;">#${ordenId}</p>
          </td>
          <td style="width:50%;padding-top:12px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;
                      text-transform:uppercase;">Prioridad</p>
            <span style="background:${prioridadColor};color:#fff;border-radius:20px;
                         padding:3px 12px;font-size:13px;font-weight:600;">
              ${esc(prioridad)}
            </span>
          </td>
        </tr>
        ${fechaLimite ? `
        <tr>
          <td colspan="2" style="padding-top:12px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;
                      text-transform:uppercase;">Fecha límite</p>
            <p style="margin:0;color:#1e293b;font-size:15px;">${esc(fechaLimite)}</p>
          </td>
        </tr>` : ''}
      </table>
    </div>

    <p style="margin:0;color:#94a3b8;font-size:13px;">
      Ingresa al sistema ${esc(marca.nombre)} para ver los detalles completos de la tarea.
    </p>
  `;

  const msg = {
    to:      { email: operarioEmail, name: operarioNombre },
    from:    marca.from,
    ...(marca.replyTo ? { replyTo: marca.replyTo } : {}),
    subject: `${marca.nombre} — Nueva tarea asignada: ${nombreSeguro(tarea, 'Tarea')}`,
    html:    baseTemplate({
      titulo:   'Nueva tarea asignada',
      contenido,
      color:    '#6366f1',
      marca,
    }),
  };

  await enviarYRegistrar(msg, { empresaId, tipo: 'tarea', ordenId });
  return { enviado: true, destinatario: operarioEmail, tarea };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ESTADÍSTICAS DE ENVÍO (GET)
// Son de la cuenta de SendGrid completa (todas las empresas): solo para uso global.
// ─────────────────────────────────────────────────────────────────────────────
export async function obtenerEstadisticas(fecha = null) {
  // Fix: antes se usaba new Date().toISOString(), que da la fecha en UTC.
  // Eso hacía que, según la hora del día, el endpoint calculara "hoy" con
  // un día de diferencia respecto a la hora local de Colombia, y por lo
  // tanto no encontrara los envíos del día real (todo salía en 0).
  // 'en-CA' devuelve directamente el formato YYYY-MM-DD.
  const startDate = fecha || new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Bogota',
  });

  const response = await fetch(
    `https://api.sendgrid.com/v3/stats?start_date=${startDate}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SendGrid stats error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const metrics = data[0]?.stats?.[0]?.metrics || {};

  return {
    fecha:       startDate,
    enviados:    metrics.requests  || 0,
    entregados:  metrics.delivered || 0,
    abiertos:    metrics.opens     || 0,
    clicks:      metrics.clicks    || 0,
    rebotes:     metrics.bounces   || 0,
    spam:        metrics.spam_reports || 0,
  };
}