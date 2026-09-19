// routes/notificaciones.js
// ─── Rutas de notificaciones SendGrid para Texticode ──────────────────────────
import { Router } from 'express';
import {
  notificarCambioEstado,
  enviarComprobante,
  notificarTareaOperario,
  obtenerEstadisticas,
} from '../services/emailService.js';

const router = Router();

// ── Validación básica de email ─────────────────────────────────────────────────
function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notificaciones/estado
// Llamado desde el backend cuando el admin cambia el estado de una orden
// ─────────────────────────────────────────────────────────────────────────────
router.post('/estado', async (req, res) => {
  const { ordenId, clienteEmail, clienteNombre, estado, productos, observaciones } = req.body;

  // Validaciones
  if (!ordenId || !clienteEmail || !clienteNombre || !estado || !productos) {
    return res.status(400).json({
      success: false,
      error: 'Campos requeridos: ordenId, clienteEmail, clienteNombre, estado, productos',
    });
  }

  if (!esEmailValido(clienteEmail)) {
    return res.status(400).json({ success: false, error: 'Email del cliente inválido' });
  }

  try {
    const resultado = await notificarCambioEstado({
      ordenId, clienteEmail, clienteNombre, estado, productos, observaciones,
    });

    console.log(`[SendGrid] ✅ Notificación enviada → ${clienteEmail} | Orden #${ordenId} | Estado: ${estado}`);
    res.json({ success: true, ...resultado });

  } catch (error) {
    console.error(`[SendGrid] ❌ Error al notificar estado:`, error.response?.body || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.body?.errors?.[0]?.message || error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notificaciones/comprobante
// Llamado cuando el admin marca la orden como 'Entregada' con el PDF generado
// ─────────────────────────────────────────────────────────────────────────────
router.post('/comprobante', async (req, res) => {
  const { ordenId, clienteEmail, clienteNombre, productos, pdfBase64, fechaEntrega } = req.body;

  if (!ordenId || !clienteEmail || !clienteNombre || !productos || !pdfBase64) {
    return res.status(400).json({
      success: false,
      error: 'Campos requeridos: ordenId, clienteEmail, clienteNombre, productos, pdfBase64',
    });
  }

  if (!esEmailValido(clienteEmail)) {
    return res.status(400).json({ success: false, error: 'Email del cliente inválido' });
  }

  // Verificar que el base64 sea válido (no vacío y formato correcto)
  if (pdfBase64.length < 100) {
    return res.status(400).json({ success: false, error: 'pdfBase64 inválido o vacío' });
  }

  try {
    const resultado = await enviarComprobante({
      ordenId, clienteEmail, clienteNombre, productos, pdfBase64, fechaEntrega,
    });

    console.log(`[SendGrid] ✅ Comprobante enviado → ${clienteEmail} | Orden #${ordenId}`);
    res.json({ success: true, ...resultado });

  } catch (error) {
    console.error(`[SendGrid] ❌ Error al enviar comprobante:`, error.response?.body || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.body?.errors?.[0]?.message || error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notificaciones/tarea
// Llamado cuando se asigna una tarea nueva a un operario
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tarea', async (req, res) => {
  const { operarioEmail, operarioNombre, tarea, ordenId, prioridad, fechaLimite } = req.body;

  if (!operarioEmail || !operarioNombre || !tarea || !ordenId) {
    return res.status(400).json({
      success: false,
      error: 'Campos requeridos: operarioEmail, operarioNombre, tarea, ordenId',
    });
  }

  if (!esEmailValido(operarioEmail)) {
    return res.status(400).json({ success: false, error: 'Email del operario inválido' });
  }

  try {
    const resultado = await notificarTareaOperario({
      operarioEmail, operarioNombre, tarea, ordenId, prioridad, fechaLimite,
    });

    console.log(`[SendGrid] ✅ Tarea notificada → ${operarioEmail} | Orden #${ordenId}`);
    res.json({ success: true, ...resultado });

  } catch (error) {
    console.error(`[SendGrid] ❌ Error al notificar tarea:`, error.response?.body || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.body?.errors?.[0]?.message || error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notificaciones/estadisticas?fecha=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
router.get('/estadisticas', async (req, res) => {
  const { fecha } = req.query;

  // Validar formato de fecha si se proporcionó
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({
      success: false,
      error: 'Formato de fecha inválido. Usa YYYY-MM-DD',
    });
  }

  try {
    const stats = await obtenerEstadisticas(fecha);
    res.json({ success: true, estadisticas: stats });

  } catch (error) {
    console.error(`[SendGrid] ❌ Error al obtener estadísticas:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;