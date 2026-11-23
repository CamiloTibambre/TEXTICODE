// services/emailService.js
// ─── Servicio central de SendGrid para Texticode ──────────────────────────────
import dotenv from 'dotenv';
dotenv.config();

import sgMail from '@sendgrid/mail';
import pool from '../db.js';
import { esc, plantillaCorreo, tablaDatos, pastilla, aviso, lineaProgreso, boton, enlaceApp } from './emailTemplates.js';

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

// ── Estados de una orden: texto y color del correo ──────────────────────────
// paso: posición en la línea de progreso (Recibida → En producción → Lista → Entregada)
const PASOS_ORDEN = ['Recibida', 'En producción', 'Lista', 'Entregada'];
const ESTADO_META = {
  'Pendiente':  { tono: 'aviso',   label: 'Pendiente de inicio', paso: 0,  titulo: 'Recibimos tu orden',          texto: 'ya quedó registrada y pronto empezará su producción.' },
  'En Proceso': { tono: 'info',    label: 'En producción',       paso: 1,  titulo: 'Tu orden está en producción', texto: 'ya está en producción en nuestro taller.' },
  'Completada': { tono: 'exito',   label: 'Lista para entrega',  paso: 2,  titulo: 'Tu orden está lista',         texto: 'está terminada y lista para entregarse.' },
  'Retrasada':  { tono: 'peligro', label: 'Retrasada',           paso: 1,  titulo: 'Tu orden presenta un retraso', texto: 'presenta un retraso en producción. Estamos trabajando para entregarla lo antes posible.' },
  'Entregada':  { tono: 'exito',   label: 'Entregada',           paso: 3,  titulo: 'Tu orden fue entregada',      texto: 'fue entregada exitosamente.' },
  'Cancelada':  { tono: 'peligro', label: 'Cancelada',           paso: -1, titulo: 'Tu orden fue cancelada',      texto: 'fue cancelada.' },
};

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
  const meta = ESTADO_META[estado] || { tono: 'marca', label: estado, paso: -1, titulo: 'Tu orden fue actualizada', texto: `cambió de estado a "${estado}".` };

  const contenido = `
    ${meta.paso >= 0 ? lineaProgreso(PASOS_ORDEN, meta.paso, meta.tono === 'peligro' ? 'peligro' : 'marca') : ''}
    ${tablaDatos([
      { etiqueta: 'Orden',         valor: `#${ordenId}` },
      { etiqueta: 'Estado actual', html: pastilla(meta.label, meta.tono) },
      { etiqueta: 'Productos',     valor: productos },
    ])}
    ${estado === 'Retrasada' ? aviso('Te avisaremos apenas tengamos una nueva fecha de entrega.', 'peligro') : ''}
    ${observaciones ? aviso(`<strong>Observaciones:</strong> ${esc(observaciones)}`, 'aviso') : ''}
    ${boton('Ver mi pedido', enlaceApp('/cliente/pedidos'))}
  `;

  const msg = {
    to:      { email: clienteEmail, name: clienteNombre },
    from:    marca.from,
    ...(marca.replyTo ? { replyTo: marca.replyTo } : {}),
    subject: `${marca.nombre} — Orden #${ordenId}: ${meta.label}`,
    html:    plantillaCorreo({
      marca:     marca.nombre,
      etiqueta:  'Seguimiento de pedido',
      preheader: `Orden #${ordenId}: ${meta.label}. ${productos || ''}`.trim(),
      eyebrow:   meta.label,
      tono:      meta.tono,
      titulo:    meta.titulo,
      intro:     `Hola <strong style="color:#111827;">${esc(clienteNombre)}</strong>, tu orden <strong style="color:#111827;">#${ordenId}</strong> ${esc(meta.texto)}`,
      cuerpo:    contenido,
      motivo:    'Recibes este correo porque tienes un pedido activo con nosotros.',
    }),
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
    ${lineaProgreso(PASOS_ORDEN, 3, 'exito')}
    ${tablaDatos([
      { etiqueta: 'Orden',            valor: `#${ordenId}` },
      { etiqueta: 'Productos',        valor: productos },
      { etiqueta: 'Fecha de entrega', valor: fecha },
      { etiqueta: 'Estado',           html: pastilla('Entregada', 'exito') },
    ])}
    ${aviso(`<strong>Comprobante adjunto.</strong> Encontrarás el PDF <span style="white-space:nowrap;">comprobante_orden_${ordenId}.pdf</span> en este correo. Guárdalo como respaldo de tu compra.`, 'exito')}
    ${boton('Ver mis pedidos', enlaceApp('/cliente/pedidos'))}
  `;

  const msg = {
    to:      { email: clienteEmail, name: clienteNombre },
    from:    marca.from,
    ...(marca.replyTo ? { replyTo: marca.replyTo } : {}),
    subject: `${marca.nombre} — Comprobante de entrega Orden #${ordenId}`,
    html:    plantillaCorreo({
      marca:     marca.nombre,
      etiqueta:  'Comprobante de entrega',
      preheader: `Tu orden #${ordenId} fue entregada. Adjuntamos el comprobante en PDF.`,
      eyebrow:   'Entrega completada',
      tono:      'exito',
      titulo:    'Tu pedido fue entregado',
      intro:     `Hola <strong style="color:#111827;">${esc(clienteNombre)}</strong>, tu orden <strong style="color:#111827;">#${ordenId}</strong> fue entregada exitosamente. Gracias por confiar en nosotros.`,
      cuerpo:    contenido,
      motivo:    'Recibes este correo porque se completó la entrega de tu pedido.',
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
  const tonoPrioridad = { Alta: 'peligro', Media: 'aviso', Normal: 'exito', Baja: 'exito' }[prioridad] || 'neutro';

  const contenido = `
    ${tablaDatos([
      { etiqueta: 'Tarea',        valor: tarea },
      { etiqueta: 'Orden',        valor: `#${ordenId}` },
      { etiqueta: 'Prioridad',    html: pastilla(prioridad, tonoPrioridad) },
      { etiqueta: 'Fecha límite', valor: fechaLimite },
    ])}
    ${prioridad === 'Alta' ? aviso('<strong>Prioridad alta:</strong> te recomendamos empezar con esta tarea.', 'peligro') : ''}
    ${boton('Ver mis tareas', enlaceApp('/operario/tareas'))}
  `;

  const msg = {
    to:      { email: operarioEmail, name: operarioNombre },
    from:    marca.from,
    ...(marca.replyTo ? { replyTo: marca.replyTo } : {}),
    subject: `${marca.nombre} — Nueva tarea asignada: ${nombreSeguro(tarea, 'Tarea')}`,
    html:    plantillaCorreo({
      marca:     marca.nombre,
      etiqueta:  'Producción',
      preheader: `Nueva tarea: ${tarea} · Orden #${ordenId}${fechaLimite ? ` · Entrega ${fechaLimite}` : ''}`,
      eyebrow:   'Nueva tarea asignada',
      tono:      'marca',
      titulo:    'Tienes una nueva tarea',
      intro:     `Hola <strong style="color:#111827;">${esc(operarioNombre)}</strong>, se te asignó una nueva tarea de producción. Estos son los detalles:`,
      cuerpo:    contenido,
      motivo:    'Recibes este correo porque eres operario en esta empresa.',
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