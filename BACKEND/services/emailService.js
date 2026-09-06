// services/emailService.js
// ─── Servicio central de SendGrid para Texticode ──────────────────────────────
import dotenv from 'dotenv';
dotenv.config();

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL,
  name: process.env.SENDGRID_FROM_NAME || 'Texticode',
};

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
function baseTemplate({ titulo, contenido, color = '#6366f1' }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
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
              TEXTICODE — SISTEMA DE GESTIÓN TEXTIL
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
              Este es un correo automático generado por Texticode.<br>
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
  ordenId, clienteEmail, clienteNombre, estado, productos, observaciones = '',
}) {
  const meta = ESTADO_META[estado] || { emoji: '📋', color: '#6366f1', label: estado };

  const contenido = `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px;">
      ${meta.emoji} Tu orden ha sido actualizada
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:15px;">
      Hola <strong>${clienteNombre}</strong>, te informamos que el estado de tu orden ha cambiado.
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
              ${meta.label}
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
        ${productos}
      </p>
    </div>

    ${observaciones ? `
    <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:14px 18px;
                border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
        <strong>Observaciones:</strong> ${observaciones}
      </p>
    </div>` : ''}

    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
      Si tienes alguna pregunta sobre tu pedido, puedes responder directamente a este correo.
    </p>
  `;

  const msg = {
    to:      { email: clienteEmail, name: clienteNombre },
    from:    FROM,
    subject: `Texticode — Orden #${ordenId}: ${meta.label}`,
    html:    baseTemplate({ titulo: `Orden #${ordenId} actualizada`, contenido, color: meta.color }),
  };

  await sgMail.send(msg);
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
  ordenId, clienteEmail, clienteNombre, productos, pdfBase64, fechaEntrega,
}) {
  const fecha = fechaEntrega || new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const contenido = `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px;">
      📦 Comprobante de entrega
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:15px;">
      Hola <strong>${clienteNombre}</strong>, tu orden <strong>#${ordenId}</strong>
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
            ${productos}
          </td>
        </tr>
        <tr>
          <td style="color:#374151;font-size:14px;padding:4px 0;">
            <strong>Fecha de entrega:</strong>
          </td>
          <td style="color:#1e293b;font-size:14px;padding:4px 0;">
            ${fecha}
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
    from:    FROM,
    subject: `Texticode — Comprobante de entrega Orden #${ordenId}`,
    html:    baseTemplate({
      titulo:   `Comprobante Orden #${ordenId}`,
      contenido,
      color:    '#8b5cf6',
    }),
    attachments: [{
      content:     pdfBase64,
      filename:    `comprobante_texticode_orden_${ordenId}.pdf`,
      type:        'application/pdf',
      disposition: 'attachment',
    }],
  };

  await sgMail.send(msg);
  return { enviado: true, destinatario: clienteEmail, adjunto: `comprobante_texticode_orden_${ordenId}.pdf` };
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
  operarioEmail, operarioNombre, tarea, ordenId, prioridad = 'Normal', fechaLimite = '',
}) {
  const prioridadColor = { Alta: '#ef4444', Media: '#f59e0b', Normal: '#10b981' }[prioridad] || '#6366f1';

  const contenido = `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px;">
      🔧 Nueva tarea asignada
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:15px;">
      Hola <strong>${operarioNombre}</strong>, se te ha asignado una nueva tarea de producción.
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
                padding:24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td colspan="2" style="padding-bottom:16px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:13px;font-weight:600;
                      text-transform:uppercase;letter-spacing:1px;">Tarea</p>
            <p style="margin:0;color:#1e293b;font-size:16px;font-weight:600;">
              ${tarea}
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
              ${prioridad}
            </span>
          </td>
        </tr>
        ${fechaLimite ? `
        <tr>
          <td colspan="2" style="padding-top:12px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;
                      text-transform:uppercase;">Fecha límite</p>
            <p style="margin:0;color:#1e293b;font-size:15px;">${fechaLimite}</p>
          </td>
        </tr>` : ''}
      </table>
    </div>

    <p style="margin:0;color:#94a3b8;font-size:13px;">
      Ingresa al sistema Texticode para ver los detalles completos de la tarea.
    </p>
  `;

  const msg = {
    to:      { email: operarioEmail, name: operarioNombre },
    from:    FROM,
    subject: `Texticode — Nueva tarea asignada: ${tarea}`,
    html:    baseTemplate({
      titulo:   'Nueva tarea asignada',
      contenido,
      color:    '#6366f1',
    }),
  };

  await sgMail.send(msg);
  return { enviado: true, destinatario: operarioEmail, tarea };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ESTADÍSTICAS DE ENVÍO (GET)
// ─────────────────────────────────────────────────────────────────────────────
export async function obtenerEstadisticas(fecha = null) {
  const startDate = fecha || new Date().toISOString().split('T')[0];

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