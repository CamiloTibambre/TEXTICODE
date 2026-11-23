// ═══════════════════════════════════════════════════════════════
// useImpresion — animación de "impresora" en todas las descargas
//
//   const impresion = useImpresion()
//   const salida = impresion.iniciar({
//     tipo: 'comprobante',            // 'comprobante' | 'reporte' | 'excel'
//     numero: 'ORD-0009',             // texto corto que va en la hoja
//     detalle: 'Restaurante Brasa',   // segunda línea del mensaje
//   })
//   ...generar el archivo...
//   await salida          // espera a que la hoja termine de salir
//   doc.save(...)         // o descargarArchivo(...)
//   impresion.terminar()  // muestra "¡Listo!" y se cierra sola
//   // si algo falla:   impresion.fallar()
//
// Se pinta en <PrintHost /> (montado una sola vez en App.vue).
// ═══════════════════════════════════════════════════════════════

import { reactive, readonly } from 'vue'

const DURACION_IMPRESION = 2600   // lo que tarda la hoja en salir
const DURACION_LISTO     = 1100   // cuánto se ve el "¡Listo!"
const TIPOS = ['comprobante', 'reporte', 'excel']

const estado = reactive({
  visible: false,
  fase: 'imprimiendo',   // 'imprimiendo' | 'listo' | 'error'
  tipo: 'comprobante',
  numero: '',
  detalle: '',
  ciclo: 0,              // cambia en cada impresión para reiniciar la animación
})

let timerCierre = null

const menosMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function iniciar({ tipo = 'comprobante', numero = '', detalle = '', cliente = '' } = {}) {
  clearTimeout(timerCierre)
  estado.tipo    = TIPOS.includes(tipo) ? tipo : 'comprobante'
  estado.numero  = numero
  estado.detalle = detalle || cliente   // `cliente` se acepta por compatibilidad
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
