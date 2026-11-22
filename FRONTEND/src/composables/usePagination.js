// ═══════════════════════════════════════════════════════════════
// usePagination — paginación del lado del cliente
//
//   const { pagina, porPagina, totalPaginas, visibles, desde, hasta } =
//     usePagination(usuariosOrdenados, { porPagina: 10 })
//
//   <tr v-for="u in visibles" ...>
//   <BasePagination v-model:pagina="pagina" v-model:por-pagina="porPagina" :total="usuariosOrdenados.length" />
//
// · Si la página actual queda fuera de rango (p. ej. tras eliminar), se ajusta.
// · Llama a reiniciar() cuando cambien filtros o búsqueda (vuelve a la página 1).
// · El tamaño de página elegido se recuerda en localStorage (con try/catch).
// ═══════════════════════════════════════════════════════════════

import { ref, computed, watch, unref } from 'vue'

function leer(clave, defecto) {
  if (!clave) return defecto
  try {
    const v = Number(window.localStorage.getItem(clave))
    return Number.isFinite(v) && v > 0 ? v : defecto
  } catch {
    return defecto
  }
}

function guardar(clave, valor) {
  if (!clave) return
  try { window.localStorage.setItem(clave, String(valor)) } catch { /* sin almacenamiento */ }
}

/**
 * @param {import('vue').Ref<any[]>|(() => any[])} fuente lista completa (ya filtrada y ordenada)
 * @param {{ porPagina?: number, clave?: string }} opciones clave = id para recordar el tamaño de página
 */
export function usePagination(fuente, { porPagina: inicial = 10, clave = '' } = {}) {
  const lista = computed(() => (typeof fuente === 'function' ? fuente() : unref(fuente)) || [])
  const claveStorage = clave ? `texticode.paginacion.${clave}` : ''

  const pagina    = ref(1)
  const porPagina = ref(leer(claveStorage, inicial))

  const total        = computed(() => lista.value.length)
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / porPagina.value)))
  const desde        = computed(() => (total.value === 0 ? 0 : (pagina.value - 1) * porPagina.value + 1))
  const hasta        = computed(() => Math.min(pagina.value * porPagina.value, total.value))
  const visibles     = computed(() => lista.value.slice(desde.value - 1 < 0 ? 0 : desde.value - 1, hasta.value))

  // Página fuera de rango (lista más corta) → última página válida
  watch(() => lista.value.length, (nuevo, viejo) => {
    if (nuevo !== viejo && pagina.value > totalPaginas.value) pagina.value = totalPaginas.value
  })

  watch(porPagina, valor => {
    guardar(claveStorage, valor)
    pagina.value = 1
  })

  function reiniciar() { pagina.value = 1 }

  return { pagina, porPagina, total, totalPaginas, desde, hasta, visibles, reiniciar }
}
