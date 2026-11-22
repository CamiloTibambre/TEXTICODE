// ═══════════════════════════════════════════════════════════════
// useSidebar — estado compartido del sidebar (expandido / colapsado)
// El estado vive a nivel de módulo para que App.vue y AppSidebar
// lean y escriban el mismo valor. Se recuerda en localStorage.
// ═══════════════════════════════════════════════════════════════

import { ref, readonly } from 'vue'

const STORAGE_KEY = 'texticode.sidebar.collapsed'

function leerEstadoGuardado() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function guardarEstado(valor) {
  try {
    window.localStorage.setItem(STORAGE_KEY, valor ? '1' : '0')
  } catch {
    /* almacenamiento bloqueado (modo privado, etc.): se ignora */
  }
}

const collapsed = ref(leerEstadoGuardado())

export function useSidebar() {
  function setCollapsed(valor) {
    collapsed.value = !!valor
    guardarEstado(collapsed.value)
  }

  function toggle() {
    setCollapsed(!collapsed.value)
  }

  return {
    collapsed: readonly(collapsed),
    setCollapsed,
    toggle,
  }
}

/** true si el usuario pidió reducir el movimiento en su sistema */
export function prefiereMenosMovimiento() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
