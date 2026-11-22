// ═══════════════════════════════════════════════════════════════
// useImpresion — animación de "impresora" al descargar comprobantes
//
//   const impresion = useImpresion()
//   const salida = impresion.iniciar({ numero: 'ORD-0009', cliente: 'Restaurante Brasa' })
//   ...generar el PDF...
//   await salida          // espera a que la hoja termine de salir
//   doc.save(...)
//   impresion.terminar()  // muestra "¡Listo!" y se cierra sola
//   // si algo falla:   impresion.fallar()
//
// Se pinta en <PrintHost /> (montado una sola vez en App.vue).
// ═══════════════════════════════════════════════════════════════

import { reactive, readonly } from 'vue'

const DURACION_IMPRESION = 2600   // lo que tarda la hoja en salir
const DURACION_LISTO     = 1100   // cuánto se ve el "¡Listo!"

const estado = reactive({
  visible: false,
  fase: 'imprimiendo',   // 'imprimiendo' | 'listo' | 'error'
  numero: '',
  cliente: '',
  ciclo: 0,              // cambia en cada impresión para reiniciar la animación
})

let timerCierre = null

const menosMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function iniciar({ numero = '', cliente = '' } = {}) {
  clearTimeout(timerCierre)
  estado.numero  = numero
  estado.cliente = cliente
  estado.fase    = 'imprimiendo'
  estado.ciclo++
  estado.visible = true
  const ms = menosMovimiento() ? 300 : DURACION_IMPRESION
  return new Promise(resolve => setTimeout(resolve, ms))
}

function cerrar() {
  clearTimeout(timerCierre)
  estado.visible = false
}

function terminar() {
  estado.fase = 'listo'
  clearTimeout(timerCierre)
  timerCierre = setTimeout(cerrar, menosMovimiento() ? 400 : DURACION_LISTO)
}

function fallar() {
  estado.fase = 'error'
  clearTimeout(timerCierre)
  timerCierre = setTimeout(cerrar, 1600)
}

export function useImpresion() {
  return { estado: readonly(estado), iniciar, terminar, fallar, cerrar }
}
