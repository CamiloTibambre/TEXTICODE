// routes/notificaciones.js
// ─── Rutas de notificaciones SendGrid para Texticode ──────────────────────────
// Multiempresa: la orden debe pertenecer a la empresa del token y los
// destinatarios salen de la base de datos (no del body), para que un admin
// no pueda enviar correos a direcciones arbitrarias ni sobre órdenes ajenas.
import { Router } from 'express';
import pool from '../db.js';
import {
  notificarCambioEstado,
  enviarComprobante,
  notificarTareaOperario,
  obtenerEstadisticasEmpresa,
} from '../services/emailService.js';

const router = Router();

router.use((req, res, next) => {
  if (!req.auth?.empresaId) {
    return res.status(403).json({ success: false, error: 'Se requiere una empresa activa.' });
  }
  next();
});

function esIdValido(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

// Cliente de una orden DE LA EMPRESA (email y nombre salen de la base de datos).
async function obtenerClienteDeOrden(ordenId, empresaId) {
  const { rows } = await pool.query(
    `SELECT op."Id_Orden", cli."Correo", cli."Nombre_Completo"
     FROM orden_produccion op
     INNER JOIN usuario cli ON cli."Id_Usuario" = op."Id_Cliente"
     WHERE op."Id_Orden" = $1 AND op."Id_Empresa" = $2`,
    [ordenId, empresaId]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notificaciones/estado
// Llamado desde el backend cuando el admin cambia el estado de una orden
// ─────────────────────────────────────────────────────────────────────────────
router.post('/estado', async (req, res) => {
  const { ordenId, estado, productos, observaciones } = req.body;

  if (!ordenId || !estado || !productos) {
    return res.status(400).json({
      success: false,
      error: 'Campos requeridos: ordenId, estado, productos',
    });
  }
  if (!esIdValido(ordenId)) {
    return res.status(400).json({ success: false, error: 'ordenId inválido' });
  }

  try {
    const cliente = await obtenerClienteDeOrden(Number(ordenId), req.auth.empresaId);
    if (!cliente) return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    if (!cliente.Correo) {
      return res.status(400).json({ success: false, error: 'El cliente de la orden no tiene correo registrado' });
    }

    const resultado = await notificarCambioEstado({
      empresaId: req.auth.empresaId,
      ordenId: Number(ordenId),
      clienteEmail: cliente.Correo,
      clienteNombre: cliente.Nombre_Completo,
      estado, productos, observaciones,
    });

    console.log(`[SendGrid] ✅ Notificación enviada | Orden #${ordenId} | Estado: ${estado}`);
    res.json({ success: true, ...resultado });

  } catch (error) {
    console.error(`[SendGrid] ❌ Error al notificar estado:`, error.response?.body || error.message);
    res.status(500).json({
      success: false,
      error: 'No se pudo enviar la notificación.',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notificaciones/comprobante
// Llamado cuando el admin marca la orden como 'Entregada' con el PDF generado
// ─────────────────────────────────────────────────────────────────────────────
router.post('/comprobante', async (req, res) => {
  const { ordenId, productos, pdfBase64, fechaEntrega } = req.body;

  if (!ordenId || !productos || !pdfBase64) {
    return res.status(400).json({
      success: false,
      error: 'Campos requeridos: ordenId, productos, pdfBase64',
    });
  }
  if (!esIdValido(ordenId)) {
    return res.status(400).json({ success: false, error: 'ordenId inválido' });
  }

  // Verificar que el base64 sea válido (no vacío y formato correcto)
  if (typeof pdfBase64 !== 'string' || pdfBase64.length < 100) {
    return res.status(400).json({ success: false, error: 'pdfBase64 inválido o vacío' });
  }

  try {
    const cliente = await obtenerClienteDeOrden(Number(ordenId), req.auth.empresaId);
    if (!cliente) return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    if (!cliente.Correo) {
      return res.status(400).json({ success: false, error: 'El cliente de la orden no tiene correo registrado' });
    }

    const resultado = await enviarComprobante({
      empresaId: req.auth.empresaId,
      ordenId: Number(ordenId),
      clienteEmail: cliente.Correo,
      clienteNombre: cliente.Nombre_Completo,
      productos, pdfBase64, fechaEntrega,
    });

    console.log(`[SendGrid] ✅ Comprobante enviado | Orden #${ordenId}`);
    res.json({ success: true, ...resultado });

  } catch (error) {
    console.error(`[SendGrid] ❌ Error al enviar comprobante:`, error.response?.body || error.message);
    res.status(500).json({
      success: false,
      error: 'No se pudo enviar la notificación.',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notificaciones/tarea
// Llamado cuando se asigna una tarea nueva a un operario
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tarea', async (req, res) => {
  const { operarioEmail, tarea, ordenId, prioridad, fechaLimite } = req.body;

  if (!operarioEmail || !tarea || !ordenId) {
    return res.status(400).json({
      success: false,
      error: 'Campos requeridos: operarioEmail, tarea, ordenId',
    });
  }
  if (!esIdValido(ordenId)) {
    return res.status(400).json({ success: false, error: 'ordenId inválido' });
  }

  try {
    // La orden debe ser de la empresa
    const { rows: ordenRows } = await pool.query(
      'SELECT 1 FROM orden_produccion WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2',
      [Number(ordenId), req.auth.empresaId]
    );
    if (ordenRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    // El destinatario debe ser un miembro activo de la empresa
    const { rows: opRows } = await pool.query(
      `SELECT u."Correo", u."Nombre_Completo"
       FROM usuario u
       INNER JOIN usuario_empresa ue
         ON ue."Id_Usuario" = u."Id_Usuario" AND ue."Id_Empresa" = $2 AND ue."Estado" = 'activo'
       WHERE lower(trim(u."Correo")) = lower(trim($1))
       LIMIT 1`,
      [String(operarioEmail), req.auth.empresaId]
    );
    if (opRows.length === 0) {
      return res.status(404).json({ success: false, error: 'El operario no pertenece a tu empresa' });
    }

    const resultado = await notificarTareaOperario({
      empresaId: req.auth.empresaId,
      operarioEmail: opRows[0].Correo,
      operarioNombre: opRows[0].Nombre_Completo,
      tarea, ordenId: Number(ordenId), prioridad, fechaLimite,
    });

    console.log(`[SendGrid] ✅ Tarea notificada | Orden #${ordenId}`);
    res.json({ success: true, ...resultado });

  } catch (error) {
    console.error(`[SendGrid] ❌ Error al notificar tarea:`, error.response?.body || error.message);
    res.status(500).json({
      success: false,
      error: 'No se pudo enviar la notificación.',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notificaciones/estadisticas?fecha=YYYY-MM-DD
// Envíos de ESTA empresa (tabla email_envio). Las estadísticas globales de
// SendGrid son de toda la cuenta y solo las ve el superadmin.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/estadisticas', async (req, res) => {
  const { fecha } = req.query;
  if (fecha !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
    return res.status(400).json({ success: false, error: 'fecha debe tener formato YYYY-MM-DD' });
  }
  try {
    const stats = await obtenerEstadisticasEmpresa(req.auth.empresaId, fecha || null);
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error('[email_envio] Error al obtener estadísticas:', error.message);
    res.status(500).json({ success: false, error: 'No se pudieron obtener las estadísticas.' });
  }
});

export default router;