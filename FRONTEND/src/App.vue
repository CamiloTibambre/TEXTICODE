<template>
  <div class="app-shell" :class="{ 'has-sidebar': mostrarSidebar, 'sidebar-collapsed': mostrarSidebar && collapsed }">
    <a v-if="mostrarSidebar" href="#contenido-principal" class="skip-link" @click.prevent="saltarAlContenido">
      Saltar al contenido
    </a>

    <div class="app-ambient" aria-hidden="true">
      <span class="ambient-orb orb-a"></span>
      <span class="ambient-orb orb-b"></span>
      <span class="ambient-grid"></span>
    </div>

    <!-- El sidebar vive fuera del RouterView: no se desmonta al navegar,
         así el indicador activo puede deslizarse entre opciones. -->
    <AppSidebar v-if="mostrarSidebar" :rol="rolSidebar" />

    <div id="contenido-principal" ref="contentEl" class="app-content" tabindex="-1">
      <RouterView v-slot="{ Component, route: r }">
        <Transition name="route-fade" mode="out-in">
          <component :is="Component" :key="r.fullPath" />
        </Transition>
      </RouterView>
    </div>

    <!-- Capas globales: notificaciones y confirmaciones (useToast / useConfirm) -->
    <ToastHost />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import ToastHost from './components/base/ToastHost.vue'
import ConfirmDialog from './components/base/ConfirmDialog.vue'
import { useSidebar, prefiereMenosMovimiento } from './composables/useSidebar'

const route = useRoute()
const { collapsed } = useSidebar()
const contentEl = ref(null)

// El sidebar se muestra en toda ruta protegida por rol (meta.rol).
// El rol sale de la ruta, que ya fue validada por el guard del router.
const rolSidebar     = computed(() => route.meta?.rol || '')
const mostrarSidebar = computed(() => !!rolSidebar.value)

// Al colapsar/expandir, el padding del contenido cambia de golpe (un solo
// reflow) y luego deslizamos el contenido con transform para que el cambio
// se sienta continuo, sin animar width/padding cuadro a cuadro.
watch(collapsed, async (estaColapsado) => {
  if (!mostrarSidebar.value || prefiereMenosMovimiento()) return
  await nextTick()
  const el = contentEl.value
  if (!el || typeof el.animate !== 'function') return

  const styles = getComputedStyle(document.documentElement)
  const ancho  = parseFloat(styles.getPropertyValue('--sidebar-width')) || 260
  const mini   = parseFloat(styles.getPropertyValue('--sidebar-width-collapsed')) || 76
  const delta  = ancho - mini

  el.animate(
    [
      { transform: `translateX(${estaColapsado ? delta : -delta}px)` },
      { transform: 'translateX(0)' },
    ],
    {
      duration: parseFloat(styles.getPropertyValue('--duration-slow')) || 300,
      easing: styles.getPropertyValue('--ease-out').trim() || 'ease-out',
    }
  )
})

function saltarAlContenido() {
  const destino = contentEl.value?.querySelector('main') || contentEl.value
  if (!destino) return
  if (!destino.hasAttribute('tabindex')) destino.setAttribute('tabindex', '-1')
  destino.focus()
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  color-scheme: light;
  font-family: var(--font-sans);
}

html, body, #app {
  min-height: 100%;
}

body {
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.12), transparent 30%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 48%, #edf2f7 100%);
  color: var(--color-text);
}

.app-shell {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Contenido: deja espacio al sidebar fijo */
.app-content {
  position: relative;
  min-height: 100vh;
}
.app-content:focus { outline: none; }

.has-sidebar .app-content {
  padding-left: var(--sidebar-width);
}
.has-sidebar.sidebar-collapsed .app-content {
  padding-left: var(--sidebar-width-collapsed);
}

/* Las vistas traen su propio contenedor .layout de 100vh */
.app-content > .layout {
  min-height: 100vh;
}

.app-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ambient-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.6;
  animation: ambientFloat 12s ease-in-out infinite alternate;
}

.orb-a {
  width: 420px;
  height: 420px;
  top: -120px;
  left: -80px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.18), transparent 70%);
}

.orb-b {
  width: 360px;
  height: 360px;
  bottom: -120px;
  right: -80px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 72%);
  animation-duration: 16s;
}

.ambient-grid {
  position: absolute;
  inset: 0;
  opacity: 0.24;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at center, rgba(255,255,255,0.8), transparent 90%);
}

@keyframes ambientFloat {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(16px, -20px, 0) scale(1.05); }
}
</style>
