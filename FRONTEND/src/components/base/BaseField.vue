<!--
  BaseField — etiqueta + control + ayuda + error, con los atributos ARIA ya conectados

  <BaseField label="Correo electrónico" :error="v.error('email')" hint="Le llegarán las notificaciones" v-slot="{ attrs }">
    <input v-bind="attrs" v-model="form.email" type="email" class="tx-input" @blur="v.tocar('email')">
  </BaseField>

  Props:
    label      — texto de la etiqueta
    error      — mensaje de error ('' = sin error). Úsalo con useValidacion().error(campo)
    hint       — texto de ayuda bajo el campo (se oculta cuando hay error)
    requerido  — muestra un asterisco visual (el control debe llevar `required` si aplica)
    opcional   — muestra "(opcional)" junto a la etiqueta
    completo   — en un .tx-form-grid ocupa las dos columnas
    id         — id del control (si no se pasa, se genera uno)
  Slot por defecto: { id, attrs, invalid }
    attrs = { id, 'aria-invalid', 'aria-describedby' } → v-bind en el input/select/textarea
-->
<template>
  <div class="tx-field" :class="{ 'tx-field--full': completo, 'is-invalid': !!error }">
    <label v-if="label" :for="idControl" class="tx-field__label">
      {{ label }}
      <span v-if="requerido" class="tx-field__req" aria-hidden="true">*</span>
      <span v-if="opcional" class="tx-field__opt">(opcional)</span>
    </label>

    <slot :id="idControl" :attrs="attrs" :invalid="!!error" />

    <Transition name="tx-field-msg" mode="out-in">
      <p v-if="error" :id="idError" :key="'e'" class="tx-field__error">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
        </svg>
        <span>{{ error }}</span>
      </p>
      <p v-else-if="hint" :id="idHint" :key="'h'" class="tx-field__hint">{{ hint }}</p>
    </Transition>

    <slot name="extra" />
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  label:     { type: String,  default: '' },
  error:     { type: String,  default: '' },
  hint:      { type: String,  default: '' },
  requerido: { type: Boolean, default: false },
  opcional:  { type: Boolean, default: false },
  completo:  { type: Boolean, default: false },
  id:        { type: String,  default: '' },
})

const uid = useId()
const idControl = computed(() => props.id || `${uid}-campo`)
const idError = computed(() => `${idControl.value}-error`)
const idHint  = computed(() => `${idControl.value}-ayuda`)

const attrs = computed(() => ({
  id: idControl.value,
  'aria-invalid': props.error ? 'true' : undefined,
  'aria-describedby': props.error ? idError.value : props.hint ? idHint.value : undefined,
}))
</script>
