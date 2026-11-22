// ═══════════════════════════════════════════════════════════════
// useTheme — modo de color de la app: 'claro' | 'oscuro' | 'auto'
// 'auto' sigue la preferencia del sistema operativo.
// El estado vive a nivel de módulo (compartido) y se guarda en
// localStorage. El tema se aplica como <html data-theme="dark|light">.
// Landing, login y cambio de contraseña siempre se ven en claro
// (App.vue decide con `permitido`).
// ═══════════════════════════════════════════════════════════════

import { ref, computed, readonly } from 'vue'

export const THEME_STORAGE_KEY = 'texticode.theme'
const MODOS = ['claro', 'oscuro', 'auto']

function leerModo() {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY)
    return MODOS.includes(v) ? v : 'claro'
  } catch {
    return 'claro'
  }
}

function guardarModo(v) {
  try { window.localStorage.setItem(THEME_STORAGE_KEY, v) } catch { /* ignorado */ }
}

const media = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

const modo          = ref(leerModo())
const sistemaOscuro = ref(!!media?.matches)
const permitido     = ref(true)   // false en páginas públicas (siempre claro)

media?.addEventListener?.('change', (e) => { sistemaOscuro.value = e.matches })

const esOscuro = computed(() =>
  modo.value === 'oscuro' || (modo.value === 'auto' && sistemaOscuro.value)
)

function aplicar() {
  if (typeof document === 'undefined') return
  const tema = permitido.value && esOscuro.value ? 'dark' : 'light'
  const html = document.documentElement
  if (html.dataset.theme === tema) return
  // Desactiva transiciones un instante para que el cambio sea limpio
  html.classList.add('theme-switching')
  html.dataset.theme = tema
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('theme-switching')))
}

export function useTheme() {
  function setModo(v) {
    if (!MODOS.includes(v)) return
    modo.value = v
    guardarModo(v)
    aplicar()
  }

  function setPermitido(v) {
    permitido.value = !!v
    aplicar()
  }

  return {
    modo: readonly(modo),
    esOscuro,
    setModo,
    setPermitido,
    aplicar,
  }
}

// Reaplica cuando cambia la preferencia del sistema (modo auto)
media?.addEventListener?.('change', aplicar)
