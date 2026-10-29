<!--
  ToastHost — se monta UNA vez en App.vue. Pinta los toasts de useToast().
  · Éxito/info se anuncian con aria-live="polite"; errores con "assertive".
  · El cierre automático se pausa con hover o foco, para poder leer.
-->
<template>
  <Teleport to="body">
    <div class="tx-toasts">
      <!-- Regiones vivas para lectores de pantalla -->
      <div class="sr-only" aria-live="polite" aria-atomic="true">{{ anuncioNormal }}</div>
      <div class="sr-only" aria-live="assertive" aria-atomic="true">{{ anuncioUrgente }}</div>

      <TransitionGroup name="tx-toast" tag="ul" class="tx-toasts__list">
        <li
          v-for="t in toast.items"
          :key="t.id"
          class="tx-toast"
          :class="`tx-toast--${t.tipo}`"
          @mouseenter="toast.pausar(t.id)"
          @mouseleave="toast.reanudar(t.id)"
          @focusin="toast.pausar(t.id)"
          @focusout="toast.reanudar(t.id)"
        >
          <span class="tx-toast__icon" aria-hidden="true" v-html="iconos[t.tipo]"></span>
          <div class="tx-toast__text">
            <p v-if="t.titulo" class="tx-toast__title">{{ t.titulo }}</p>
            <p class="tx-toast__msg">{{ t.mensaje }}</p>
          </div>
          <button type="button" class="tx-toast__close" aria-label="Cerrar notificación" @click="toast.cerrar(t.id)">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
          <span
            v-if="t.duracion > 0"
            class="tx-toast__progress"
            :style="{ animationDuration: `${t.duracion}ms` }"
            aria-hidden="true"
          ></span>
        </li>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'

const toast = useToast()

const ico = d => `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`
const iconos = {
  success: ico('M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
  error:   ico('M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z'),
  warning: ico('M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'),
  info:    ico('m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'),
}

// El texto anunciado se copia a la región viva correspondiente
const anuncioNormal  = ref('')
const anuncioUrgente = ref('')
let ultimoId = 0
watch(
  () => toast.items.map(t => t.id),
  () => {
    // Todos los toasts nuevos desde la última vez (pueden llegar varios juntos)
    const nuevos = toast.items.filter(t => t.id > ultimoId)
    if (!nuevos.length) return
    ultimoId = Math.max(...nuevos.map(t => t.id))
    const texto = lista => lista.map(t => [t.titulo, t.mensaje].filter(Boolean).join('. ')).join('. ')
    const urgentes = nuevos.filter(t => t.tipo === 'error')
    const normales = nuevos.filter(t => t.tipo !== 'error')
    if (urgentes.length) anuncioUrgente.value = texto(urgentes)
    if (normales.length) anuncioNormal.value = texto(normales)
  }
)
</script>

<style>
.tx-toasts__list {
  position: fixed;
  right: var(--space-6);
  bottom: var(--space-6);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  width: min(380px, calc(100vw - var(--space-12)));
  list-style: none;
  pointer-events: none;
}

.tx-toast {
  --toast-accent: var(--color-info-solid);
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--toast-accent);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  pointer-events: auto;
}
.tx-toast--success { --toast-accent: var(--color-success-solid); }
.tx-toast--error   { --toast-accent: var(--color-danger-solid); }
.tx-toast--warning { --toast-accent: var(--color-warning-solid); }
.tx-toast--info    { --toast-accent: var(--color-info-solid); }

.tx-toast__icon {
  flex-shrink: 0;
  display: flex;
  margin-top: 1px;
  color: var(--toast-accent);
}
.tx-toast__text { flex: 1; min-width: 0; }
.tx-toast__title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}
.tx-toast__msg {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  overflow-wrap: anywhere;
}

.tx-toast__close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.tx-toast__close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

/* Barra de tiempo restante (se pausa con hover) */
.tx-toast__progress {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: var(--toast-accent);
  opacity: 0.35;
  transform-origin: left;
  animation: txToastProgress linear forwards;
}
.tx-toast:hover .tx-toast__progress,
.tx-toast:focus-within .tx-toast__progress {
  animation-play-state: paused;
}
@keyframes txToastProgress {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

/* Entrada desde la derecha; salida con desvanecido; reacomodo suave */
.tx-toast-enter-active {
  transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-slow) var(--ease-out);
}
.tx-toast-leave-active {
  position: absolute;
  right: 0;
  transition: opacity var(--duration-fast) var(--ease-in), transform var(--duration-fast) var(--ease-in);
}
.tx-toast-move {
  transition: transform var(--duration-base) var(--ease-out);
}
.tx-toast-enter-from {
  opacity: 0;
  transform: translateX(var(--motion-shift-lg));
}
.tx-toast-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
