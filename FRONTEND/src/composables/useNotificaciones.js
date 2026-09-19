// composables/useNotificaciones.js
// ─── Composable Vue 3 para llamar las notificaciones SendGrid desde Texticode ──

/**
 * USO EN GestionProduccion.vue u otros componentes:
 *
 *   import { useNotificaciones } from '@/composables/useNotificaciones'
 *   const { notificarEstado, enviarComprobante, notificarTarea } = useNotificaciones()
 *
 *   // Al cambiar estado:
 *   await notificarEstado(orden, nuevoEstado)
 *
 *   // Al entregar con PDF:
 *   await enviarComprobante(orden, pdfBase64)
 *
 *   // Al asignar tarea:
 *   await notificarTarea(tarea, operario, ordenId)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ─── Helper interno ────────────────────────────────────────────────────────────
async function postJSON(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || `Error en ${endpoint}`);
  return data;
}

// ─── Composable ────────────────────────────────────────────────────────────────
export function useNotificaciones() {

  /**
   * Notifica al cliente cuando el admin cambia el estado de su orden.
   * @param {Object} orden        - Objeto orden con { id, clienteEmail, clienteNombre, productos }
   * @param {string} nuevoEstado  - 'En Proceso' | 'Completada' | 'Entregada' | 'Cancelada'
   * @param {string} [observaciones]
   */
  async function notificarEstado(orden, nuevoEstado, observaciones = '') {
    try {
      const result = await postJSON('/notificaciones/estado', {
        ordenId:        orden.id,
        clienteEmail:   orden.clienteEmail,
        clienteNombre:  orden.clienteNombre,
        estado:         nuevoEstado,
        productos:      orden.productos,
        observaciones,
      });
      console.log('[Texticode] Email de estado enviado:', result);
      return result;
    } catch (error) {
      // No bloqueamos la UI — el cambio de estado ya se guardó en la BD
      console.error('[Texticode] Error al enviar email de estado:', error.message);
      return null;
    }
  }

  /**
   * Envía el comprobante PDF al cliente cuando la orden se marca como Entregada.
   * @param {Object} orden     - Objeto orden con { id, clienteEmail, clienteNombre, productos }
   * @param {string} pdfBase64 - PDF convertido a base64 (sin prefijo data:...)
   */
  async function enviarComprobante(orden, pdfBase64) {
    try {
      const result = await postJSON('/notificaciones/comprobante', {
        ordenId:       orden.id,
        clienteEmail:  orden.clienteEmail,
        clienteNombre: orden.clienteNombre,
        productos:     orden.productos,
        pdfBase64,
        fechaEntrega:  new Date().toLocaleDateString('es-CO', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
      });
      console.log('[Texticode] Comprobante enviado:', result);
      return result;
    } catch (error) {
      console.error('[Texticode] Error al enviar comprobante:', error.message);
      return null;
    }
  }

  /**
   * Notifica a un operario que se le asignó una nueva tarea.
   * @param {string} tarea          - Descripción de la tarea
   * @param {Object} operario       - { email, nombre }
   * @param {number} ordenId
   * @param {string} [prioridad]    - 'Alta' | 'Media' | 'Normal'
   * @param {string} [fechaLimite]
   */
  async function notificarTarea(tarea, operario, ordenId, prioridad = 'Normal', fechaLimite = '') {
    try {
      const result = await postJSON('/notificaciones/tarea', {
        operarioEmail:  operario.email,
        operarioNombre: operario.nombre,
        tarea,
        ordenId,
        prioridad,
        fechaLimite,
      });
      console.log('[Texticode] Tarea notificada al operario:', result);
      return result;
    } catch (error) {
      console.error('[Texticode] Error al notificar tarea:', error.message);
      return null;
    }
  }

  /**
   * Obtiene estadísticas de emails enviados por SendGrid.
   * @param {string} [fecha] - YYYY-MM-DD (por defecto: hoy)
   */
  async function obtenerEstadisticas(fecha = null) {
    const url = fecha
      ? `${API_BASE}/notificaciones/estadisticas?fecha=${fecha}`
      : `${API_BASE}/notificaciones/estadisticas`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.estadisticas;
  }

  return { notificarEstado, enviarComprobante, notificarTarea, obtenerEstadisticas };
}