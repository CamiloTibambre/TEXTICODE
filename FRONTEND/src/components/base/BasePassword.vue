<!--
  BasePassword — input de contraseña con botón mostrar/ocultar y requisitos en vivo

  <BaseField label="Contraseña" :error="v.error('contrasena')" v-slot="{ attrs }">
    <BasePassword v-bind="attrs" v-model="form.contrasena" requisitos @blur="v.tocar('contrasena')" />
  </BaseField>

  Props:
    modelValue  — valor
    requisitos  — muestra la lista de requisitos mientras se escribe
    reglas      — [{ label, ok }] propias (opcional); por defecto reglasContrasena(valor)
  Cualquier otro atributo (id, aria-*, placeholder, autocomplete) va al <input>.
  Exporta también reglasContrasena(valor) para validar con las mismas reglas.
-->
<template>
  <div class="tx-pass-wrap">
    <div class="tx-pass">
      <input
        v-bind="$attrs"
        :value="modelValue"
        :type="visible ? 'text' : 'password'"
        class="tx-input"
        :autocomplete="$attrs.autocomplete || 'new-password'"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      >
      <button
        type="button"
        class="tx-icon-btn tx-pass__toggle"
        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <svg v-if="!visible" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"/></svg>
        <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
      </button>
    </div>
    <ul v-if="requisitos && modelValue" class="tx-pass-hints" aria-label="Requisitos de la contraseña">
      <li v-for="r in listaReglas" :key="r.label" :class="r.ok ? 'is-ok' : 'is-no'">
        <span aria-hidden="true">{{ r.ok ? '✓' : '•' }}</span>
        {{ r.label }}<span class="sr-only">{{ r.ok ? ': cumplido' : ': pendiente' }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
// Reglas compartidas: las mismas que ya usaban los formularios de la app
export function reglasContrasena(valor = '') {
  return [
    { label: 'Mínimo 8 caracteres',        ok: valor.length >= 8 },
    { label: 'Una letra mayúscula',         ok: /[A-Z]/.test(valor) },
    { label: 'Un número',                   ok: /[0-9]/.test(valor) },
    { label: 'Un carácter especial (@#$…)', ok: /[^A-Za-z0-9]/.test(valor) },
  ]
}
</script>

<script setup>
import { ref, computed } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: String, default: '' },
  requisitos: { type: Boolean, default: false },
  reglas:     { type: Array,   default: null },
})
defineEmits(['update:modelValue', 'blur'])

const visible = ref(false)
const listaReglas = computed(() => props.reglas || reglasContrasena(props.modelValue || ''))
</script>

<style>
.tx-pass-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
