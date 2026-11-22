// ═══════════════════════════════════════════════════════════════
// useCountUp — anima un número de su valor actual al nuevo valor
// · Usa requestAnimationFrame (no setInterval) y una curva ease-out.
// · Duración corta (600ms) para que el dato se lea rápido.
// · Con prefers-reduced-motion muestra el valor final directamente.
// ═══════════════════════════════════════════════════════════════

import { ref, watch, onBeforeUnmount } from 'vue'
import { prefiereMenosMovimiento } from './useSidebar'

const easeOut = t => 1 - Math.pow(1 - t, 3)

/**
 * @param {import('vue').Ref<number>|(() => number)} fuente valor objetivo
 * @param {{ duracion?: number, decimales?: number }} opciones
 */
export function useCountUp(fuente, { duracion = 600, decimales = 0 } = {}) {
  const mostrado = ref(0)
  let frame = null

  function animar(destino) {
    cancelAnimationFrame(frame)
    const objetivo = Number(destino) || 0
    if (prefiereMenosMovimiento()) {
      mostrado.value = objetivo
      return
    }
    const desde = mostrado.value
    const inicio = performance.now()
    const factor = Math.pow(10, decimales)

    const paso = ahora => {
      const t = Math.min(1, (ahora - inicio) / duracion)
      const valor = desde + (objetivo - desde) * easeOut(t)
      mostrado.value = Math.round(valor * factor) / factor
      if (t < 1) frame = requestAnimationFrame(paso)
    }
    frame = requestAnimationFrame(paso)
  }

  watch(fuente, animar, { immediate: true })
  onBeforeUnmount(() => cancelAnimationFrame(frame))

  return mostrado
}
