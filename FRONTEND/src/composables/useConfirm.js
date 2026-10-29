// ═══════════════════════════════════════════════════════════════
// useConfirm — confirmación con Promesa (reemplaza window.confirm)
//
//   import { useConfirm } from '@/composables/useConfirm'
//   const confirmar = useConfirm()
//
//   const ok = await confirmar({
//     titulo: '¿Eliminar esta observación?',
//     mensaje: 'Esta acción no se puede deshacer.',
//     textoConfirmar: 'Eliminar observación',
//     tono: 'danger',            // 'danger' | 'primary'
//   })
//   if (!ok) return
//
// Se pinta en <ConfirmDialog /> (montado una sola vez en App.vue).
// ═══════════════════════════════════════════════════════════════

import { reactive, readonly } from 'vue'

const estado = reactive({
  abierto: false,
  titulo: '',
  mensaje: '',
  textoConfirmar: 'Confirmar',
  textoCancelar: 'Cancelar',
  tono: 'primary',
})

let resolverActual = null

function confirmar(opciones = {}) {
  // Si ya había una confirmación abierta, se cancela la anterior
  if (resolverActual) resolverActual(false)

  Object.assign(estado, {
    titulo: opciones.titulo || '¿Confirmas esta acción?',
    mensaje: opciones.mensaje || '',
    textoConfirmar: opciones.textoConfirmar || 'Confirmar',
    textoCancelar: opciones.textoCancelar || 'Cancelar',
    tono: opciones.tono || 'primary',
    abierto: true,
  })

  return new Promise(resolve => {
    resolverActual = resolve
  })
}

function responder(valor) {
  estado.abierto = false
  const resolver = resolverActual
  resolverActual = null
  resolver?.(valor)
}

export function useConfirm() {
  return confirmar
}

/** Uso interno de ConfirmDialog.vue */
export function useConfirmState() {
  return { estado: readonly(estado), responder }
}
