// ═══════════════════════════════════════════════════════════════
// useToast — notificaciones globales
//
//   import { useToast } from '@/composables/useToast'
//   const toast = useToast()
//   toast.success('Usuario creado')
//   toast.error('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
//   toast.info('Sincronizando…', { duracion: 0 })   // 0 = no se cierra solo
//
// Los toasts se pintan en <ToastHost /> (montado una sola vez en App.vue).
// ═══════════════════════════════════════════════════════════════

import { reactive, readonly } from 'vue'

const MAX_VISIBLES = 4
const DURACION = { success: 3500, info: 4000, warning: 5000, error: 6000 }

const estado = reactive({ items: [] })
let siguienteId = 1
const temporizadores = new Map()

function cerrar(id) {
  clearTimeout(temporizadores.get(id))
  temporizadores.delete(id)
  const i = estado.items.findIndex(t => t.id === id)
  if (i !== -1) estado.items.splice(i, 1)
}

function programarCierre(id, ms) {
  clearTimeout(temporizadores.get(id))
  if (ms > 0) temporizadores.set(id, setTimeout(() => cerrar(id), ms))
}

function mostrar(tipo, mensaje, { titulo = '', duracion } = {}) {
  const id = siguienteId++
  const ms = duracion ?? DURACION[tipo] ?? 4000
  estado.items.push({ id, tipo, mensaje, titulo, duracion: ms })
  // Si hay demasiados, se cierra el más antiguo
  while (estado.items.length > MAX_VISIBLES) cerrar(estado.items[0].id)
  programarCierre(id, ms)
  return id
}

/** Pausa el cierre automático (hover/foco) para que se pueda leer */
function pausar(id) {
  clearTimeout(temporizadores.get(id))
}

/** Reanuda el cierre automático con un margen corto */
function reanudar(id) {
  const t = estado.items.find(x => x.id === id)
  if (t && t.duracion > 0) programarCierre(id, 2000)
}

const api = {
  success: (msg, opts) => mostrar('success', msg, opts),
  error:   (msg, opts) => mostrar('error', msg, opts),
  warning: (msg, opts) => mostrar('warning', msg, opts),
  info:    (msg, opts) => mostrar('info', msg, opts),
  cerrar,
  pausar,
  reanudar,
  items: readonly(estado.items),
}

export function useToast() {
  return api
}
