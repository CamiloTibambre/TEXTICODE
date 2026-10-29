// ═══════════════════════════════════════════════════════════════
// useOverlay — comportamiento común de modales y drawers
//  · Bloquea el scroll del body (con contador: soporta capas apiladas)
//  · Atrapa el foco dentro del panel (Tab / Shift+Tab)
//  · Cierra con Escape (solo la capa superior)
//  · Devuelve el foco al elemento que abrió la capa
// ═══════════════════════════════════════════════════════════════

import { watch, nextTick, onBeforeUnmount } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// Pila global de capas abiertas: solo la última responde a Escape/Tab
const pila = []
let bloqueosScroll = 0
let overflowPrevio = ''
let paddingPrevio = ''

function bloquearScroll() {
  if (bloqueosScroll === 0) {
    const anchoBarra = window.innerWidth - document.documentElement.clientWidth
    overflowPrevio = document.body.style.overflow
    paddingPrevio  = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    // Evita que el contenido "salte" al desaparecer la barra de scroll
    if (anchoBarra > 0) document.body.style.paddingRight = `${anchoBarra}px`
  }
  bloqueosScroll++
}

function liberarScroll() {
  bloqueosScroll = Math.max(0, bloqueosScroll - 1)
  if (bloqueosScroll === 0) {
    document.body.style.overflow = overflowPrevio
    document.body.style.paddingRight = paddingPrevio
  }
}

export function elementosEnfocables(contenedor) {
  if (!contenedor) return []
  return [...contenedor.querySelectorAll(FOCUSABLE)].filter(
    el => !el.hasAttribute('inert') && el.offsetParent !== null
  )
}

/**
 * @param {import('vue').Ref<boolean>} abierto   estado de la capa
 * @param {import('vue').Ref<HTMLElement>} panel elemento que contiene el foco
 * @param {object} opciones
 * @param {() => void} opciones.onEscape         qué hacer al presionar Escape
 * @param {import('vue').Ref<HTMLElement>} [opciones.focoInicial] elemento a enfocar al abrir
 */
export function useOverlay(abierto, panel, { onEscape, focoInicial } = {}) {
  const id = Symbol('overlay')
  let focoPrevio = null
  let activo = false

  function alPresionarTecla(e) {
    if (pila[pila.length - 1] !== id) return

    if (e.key === 'Escape') {
      e.stopPropagation()
      onEscape?.()
      return
    }

    if (e.key !== 'Tab') return
    const lista = elementosEnfocables(panel.value)
    if (lista.length === 0) {
      e.preventDefault()
      panel.value?.focus()
      return
    }
    const primero = lista[0]
    const ultimo  = lista[lista.length - 1]
    const actual  = document.activeElement

    if (e.shiftKey && (actual === primero || !panel.value.contains(actual))) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && (actual === ultimo || !panel.value.contains(actual))) {
      e.preventDefault()
      primero.focus()
    }
  }

  async function activar() {
    if (activo) return
    activo = true
    focoPrevio = document.activeElement
    pila.push(id)
    bloquearScroll()
    document.addEventListener('keydown', alPresionarTecla, true)

    await nextTick()
    const destino =
      focoInicial?.value ||
      panel.value?.querySelector('[autofocus]') ||
      elementosEnfocables(panel.value)[0] ||
      panel.value
    destino?.focus?.({ preventScroll: true })
  }

  function desactivar() {
    if (!activo) return
    activo = false
    const i = pila.indexOf(id)
    if (i !== -1) pila.splice(i, 1)
    liberarScroll()
    document.removeEventListener('keydown', alPresionarTecla, true)
    // Devolver el foco a quien abrió la capa (si sigue en el documento)
    if (focoPrevio && document.contains(focoPrevio)) {
      focoPrevio.focus?.({ preventScroll: true })
    }
    focoPrevio = null
  }

  watch(abierto, valor => (valor ? activar() : desactivar()), { immediate: true })
  onBeforeUnmount(desactivar)
}
