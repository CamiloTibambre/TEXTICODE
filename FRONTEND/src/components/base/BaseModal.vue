<!--
  BaseModal — diálogo centrado y accesible

  <BaseModal v-model:open="modalVisible" titulo="Nuevo usuario" descripcion="Completa los datos" tamano="md">
    ...contenido (formulario, detalle)...
    <template #footer>
      <button class="btn btn-secondary" @click="modalVisible = false">Cancelar</button>
      <button class="btn btn-primary" @click="guardar">Guardar usuario</button>
    </template>
  </BaseModal>

  Props:
    open (v-model:open)  — visible / oculto
    titulo, descripcion  — encabezado (descripcion es opcional)
    tamano               — 'sm' 400px | 'md' 560px | 'lg' 760px | 'xl' 960px
    cerrarAlClicFuera    — por defecto true; ponlo en false en formularios largos
    rol                  — 'dialog' (por defecto) o 'alertdialog' para confirmaciones
    elevado              — se dibuja por encima de otros modales/paneles (confirmaciones globales)
  Eventos: update:open, cerrar
  Slots: default, header (reemplaza título), footer
-->
<template>
  <Teleport to="body">
    <Transition name="tx-modal" @after-leave="$emit('despues-de-cerrar')">
      <div v-if="open" class="tx-modal-overlay" :class="{ 'tx-modal-overlay--elevado': elevado }" @mousedown.self="clicFuera">
        <div
          ref="panel"
          class="tx-modal"
          :class="`tx-modal--${tamano}`"
          :role="rol"
          aria-modal="true"
          :aria-labelledby="titulo || $slots.header ? idTitulo : undefined"
          :aria-describedby="descripcion ? idDesc : undefined"
          tabindex="-1"
        >
          <header v-if="titulo || $slots.header" class="tx-modal__header">
            <div class="tx-modal__heading">
              <slot name="header">
                <h2 :id="idTitulo" class="tx-modal__title">{{ titulo }}</h2>
                <p v-if="descripcion" :id="idDesc" class="tx-modal__desc">{{ descripcion }}</p>
              </slot>
            </div>
            <button
              v-if="mostrarCerrar"
              type="button"
              class="tx-modal__close"
              aria-label="Cerrar"
              @click="cerrar"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </header>

          <div class="tx-modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="tx-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, toRef, useId } from 'vue'
import { useOverlay } from '../../composables/useOverlay'

const props = defineProps({
  open:              { type: Boolean, default: false },
  titulo:            { type: String,  default: '' },
  descripcion:       { type: String,  default: '' },
  tamano:            { type: String,  default: 'md', validator: v => ['sm', 'md', 'lg', 'xl'].includes(v) },
  cerrarAlClicFuera: { type: Boolean, default: true },
  mostrarCerrar:     { type: Boolean, default: true },
  rol:               { type: String,  default: 'dialog' },
  elevado:           { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'cerrar', 'despues-de-cerrar'])

const panel   = ref(null)
const uid     = useId()
const idTitulo = `${uid}-titulo`
const idDesc   = `${uid}-desc`

function cerrar() {
  emit('update:open', false)
  emit('cerrar')
}

function clicFuera() {
  if (props.cerrarAlClicFuera) cerrar()
}

useOverlay(toRef(props, 'open'), panel, { onEscape: cerrar })
</script>

<style>
.tx-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-overlay);
}
.tx-modal-overlay--elevado { z-index: calc(var(--z-modal) + 10); }

.tx-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - var(--space-12));
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  outline: none;
}
.tx-modal--sm { max-width: 400px; }
.tx-modal--md { max-width: 560px; }
.tx-modal--lg { max-width: 760px; }
.tx-modal--xl { max-width: 960px; }

.tx-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-6) var(--space-4);
}
.tx-modal__heading { min-width: 0; }
.tx-modal__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--color-text);
}
.tx-modal__desc {
  margin-top: var(--space-1);
  font-size: var(--text-base);
  color: var(--color-text-muted);
}

.tx-modal__close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin: -6px -8px 0 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.tx-modal__close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.tx-modal__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--space-6) var(--space-6);
}
.tx-modal__header + .tx-modal__body { padding-top: 0; }
.tx-modal__body:first-child { padding-top: var(--space-6); }

.tx-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-muted);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

/* Transición: overlay en opacidad, panel en opacidad + escala */
.tx-modal-enter-active,
.tx-modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}
.tx-modal-leave-active { transition-duration: var(--duration-fast); }
.tx-modal-enter-active .tx-modal,
.tx-modal-leave-active .tx-modal {
  transition:
    opacity   var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}
.tx-modal-leave-active .tx-modal { transition-duration: var(--duration-fast); }
.tx-modal-enter-from,
.tx-modal-leave-to { opacity: 0; }
.tx-modal-enter-from .tx-modal,
.tx-modal-leave-to .tx-modal {
  opacity: 0;
  transform: translateY(var(--motion-shift-md)) scale(0.97);
}
</style>
