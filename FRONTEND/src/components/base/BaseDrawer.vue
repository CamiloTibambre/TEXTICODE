<!--
  BaseDrawer — panel lateral para detalles y edición sin salir de la vista

  <BaseDrawer v-model:open="detalleVisible" :titulo="operario.nombre" descripcion="Detalle de eficiencia" ancho="lg">
    ...contenido largo con scroll propio...
    <template #footer>
      <button class="btn btn-primary" @click="guardar">Guardar cambios</button>
    </template>
  </BaseDrawer>

  Props:
    open (v-model:open)
    titulo, descripcion
    ancho      — 'sm' 380px | 'md' 480px | 'lg' 640px | 'xl' 820px
    lado       — 'right' (por defecto) | 'left'
    cerrarAlClicFuera — por defecto true
  Slots: header, default, footer
-->
<template>
  <Teleport to="body">
    <Transition name="tx-drawer">
      <div v-if="open" class="tx-drawer-overlay" :class="`tx-drawer-overlay--${lado}`" @mousedown.self="clicFuera">
        <aside
          ref="panel"
          class="tx-drawer"
          :class="[`tx-drawer--${ancho}`, `tx-drawer--${lado}`]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titulo || $slots.header ? idTitulo : undefined"
          :aria-describedby="descripcion ? idDesc : undefined"
          tabindex="-1"
        >
          <header class="tx-drawer__header">
            <div class="tx-drawer__heading">
              <slot name="header">
                <h2 :id="idTitulo" class="tx-drawer__title">{{ titulo }}</h2>
                <p v-if="descripcion" :id="idDesc" class="tx-drawer__desc">{{ descripcion }}</p>
              </slot>
            </div>
            <button type="button" class="tx-drawer__close" aria-label="Cerrar panel" @click="cerrar">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </header>

          <div class="tx-drawer__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="tx-drawer__footer">
            <slot name="footer" />
          </footer>
        </aside>
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
  ancho:             { type: String,  default: 'md', validator: v => ['sm', 'md', 'lg', 'xl'].includes(v) },
  lado:              { type: String,  default: 'right', validator: v => ['left', 'right'].includes(v) },
  cerrarAlClicFuera: { type: Boolean, default: true },
})

const emit = defineEmits(['update:open', 'cerrar'])

const panel    = ref(null)
const uid      = useId()
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
.tx-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  justify-content: flex-end;
  background: var(--color-overlay);
}
.tx-drawer-overlay--left { justify-content: flex-start; }

.tx-drawer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  outline: none;
}
.tx-drawer--sm { max-width: 380px; }
.tx-drawer--md { max-width: 480px; }
.tx-drawer--lg { max-width: 640px; }
.tx-drawer--xl { max-width: 820px; }

.tx-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}
.tx-drawer__heading { min-width: 0; }
.tx-drawer__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--color-text);
}
.tx-drawer__desc {
  margin-top: var(--space-1);
  font-size: var(--text-base);
  color: var(--color-text-muted);
}
.tx-drawer__close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin: -4px -8px 0 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.tx-drawer__close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.tx-drawer__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-6);
}

.tx-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-muted);
}

/* Transición: el panel entra deslizándose, el overlay se funde */
.tx-drawer-enter-active,
.tx-drawer-leave-active {
  transition: opacity var(--duration-slow) var(--ease-out);
}
.tx-drawer-leave-active { transition-duration: var(--duration-base); }
.tx-drawer-enter-active .tx-drawer,
.tx-drawer-leave-active .tx-drawer {
  transition: transform var(--duration-slow) var(--ease-out);
}
.tx-drawer-leave-active .tx-drawer {
  transition-duration: var(--duration-base);
  transition-timing-function: var(--ease-in);
}
.tx-drawer-enter-from,
.tx-drawer-leave-to { opacity: 0; }
.tx-drawer-enter-from .tx-drawer--right,
.tx-drawer-leave-to .tx-drawer--right { transform: translateX(100%); }
.tx-drawer-enter-from .tx-drawer--left,
.tx-drawer-leave-to .tx-drawer--left { transform: translateX(-100%); }
</style>
