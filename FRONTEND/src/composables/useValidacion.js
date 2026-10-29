// ═══════════════════════════════════════════════════════════════
// useValidacion — cuándo mostrar los errores de un formulario
//
//   const errores = computed(() => ({ nombre: form.value.nombre ? '' : 'Escribe el nombre.' }))
//   const v = useValidacion(errores)
//
//   <BaseField :error="v.error('nombre')" ...>
//     <input ... @blur="v.tocar('nombre')">
//
//   async function guardar() {
//     if (!(await v.validar())) return   // muestra todo y enfoca el primer campo con error
//     ...
//   }
//
// · Un error aparece cuando el campo pierde el foco (no mientras se escribe
//   por primera vez) o cuando se intenta guardar.
// · Una vez visible, se actualiza en vivo y desaparece al corregirlo.
// · Llama a reiniciar() al abrir el formulario.
// ═══════════════════════════════════════════════════════════════

import { ref, computed, nextTick, unref } from 'vue'

export function useValidacion(errores) {
  const tocados = ref({})
  const intento = ref(false)

  const lista = computed(() => unref(errores) || {})
  const valido = computed(() => !Object.values(lista.value).some(Boolean))

  function tocar(campo) {
    if (!tocados.value[campo]) tocados.value = { ...tocados.value, [campo]: true }
  }

  function error(campo) {
    if (!intento.value && !tocados.value[campo]) return ''
    return lista.value[campo] || ''
  }

  /** Marca el intento de guardar. Si hay errores, enfoca el primero y devuelve false. */
  async function validar() {
    intento.value = true
    if (valido.value) return true
    await nextTick()
    const dialogos = document.querySelectorAll('[aria-modal="true"]')
    const raiz = dialogos[dialogos.length - 1] || document
    const primero = raiz.querySelector('[aria-invalid="true"]')
    if (primero) {
      primero.focus({ preventScroll: true })
      primero.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    return false
  }

  function reiniciar() {
    tocados.value = {}
    intento.value = false
  }

  return { tocar, error, valido, validar, reiniciar, intento }
}
