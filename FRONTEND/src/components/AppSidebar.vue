<template>
  <aside
    class="sidebar"
    :class="{ collapsed, ready: listo }"
    aria-label="Navegación principal"
  >
    <!-- Panel: siempre mide --sidebar-width; al colapsar se recorta con
         clip-path (sin animar width) y el texto se desvanece. -->
    <div class="sidebar-panel">
      <div class="sidebar-top">
        <!-- Logo: completo ↔ mini -->
        <RouterLink :to="inicio" class="logo" :aria-label="`Texticode, ir a ${menuItems[0]?.label || 'inicio'}`">
          <span class="logo-full" aria-hidden="true">
            <span class="logo-ring">
              <span class="logo-spark spark-1"></span>
              <span class="logo-spark spark-2"></span>
            </span>
            <img src="/img/LogoTexticode.png" alt="">
          </span>
          <img class="logo-mini" src="/img/LogoTexticodeMini.jpg" alt="" aria-hidden="true">
        </RouterLink>

        <div class="panel-label">
          <span class="role-badge" :class="`badge-${rol}`">{{ panelLabel }}</span>
        </div>

        <!-- Menú -->
        <nav class="menu" ref="menuEl">
          <span class="menu-rail" :class="{ 'no-anim': !railAnimado }" :style="railStyle" aria-hidden="true"></span>
          <RouterLink
            v-for="(item, i) in menuItems"
            :key="item.to"
            :to="item.to"
            class="menu-item"
            :class="{ active: esActivo(item) }"
            :style="{ '--i': i }"
            :aria-current="esActivo(item) ? 'page' : undefined"
            :ref="el => setItemRef(el, i)"
            @mouseenter="mostrarTooltip($event, item.label)"
            @mouseleave="ocultarTooltip"
            @focus="mostrarTooltip($event, item.label)"
            @blur="ocultarTooltip"
          >
            <span class="menu-icon" aria-hidden="true" v-html="item.icon"></span>
            <span class="menu-label">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <!-- Footer: usuario + cerrar sesión -->
      <div class="sidebar-footer">
        <component
          :is="perfilAccion ? 'button' : 'div'"
          :type="perfilAccion ? 'button' : undefined"
          class="user-info"
          :class="{ 'user-info--action': perfilAccion }"
          :aria-label="perfilAccion ? `Mi perfil: ${userName}` : undefined"
          @click="abrirPerfil"
          @mouseenter="mostrarTooltip($event, perfilAccion ? 'Mi perfil' : `${userName} · ${roleLabel}`)"
          @mouseleave="ocultarTooltip"
          @focus="mostrarTooltip($event, 'Mi perfil')"
          @blur="ocultarTooltip"
        >
          <span class="user-avatar" aria-hidden="true">{{ userInitial }}</span>
          <span class="user-details">
            <span class="user-name-text">{{ userName }}</span>
            <span class="user-role-text">{{ perfilAccion ? 'Ver mi perfil' : roleLabel }}</span>
          </span>
          <svg v-if="perfilAccion" class="user-chevron" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
          </svg>
        </component>

        <button
          type="button"
          class="logout"
          aria-label="Cerrar sesión"
          @click="pedirCerrarSesion"
          @mouseenter="mostrarTooltip($event, 'Cerrar sesión')"
          @mouseleave="ocultarTooltip"
          @focus="mostrarTooltip($event, 'Cerrar sesión')"
          @blur="ocultarTooltip"
        >
          <svg class="logout-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
          </svg>
          <span class="logout-text">Cerrar sesión</span>
        </button>
      </div>
    </div>

    <!-- Borde derecho + botón de colapsar: se desplazan con transform -->
    <div class="sidebar-edge">
      <button
        type="button"
        class="collapse-btn"
        :aria-label="collapsed ? 'Expandir menú' : 'Contraer menú'"
        :aria-expanded="!collapsed"
        @click="toggle"
        @mouseenter="mostrarTooltip($event, collapsed ? 'Expandir menú' : 'Contraer menú', true)"
        @mouseleave="ocultarTooltip"
        @focus="mostrarTooltip($event, collapsed ? 'Expandir menú' : 'Contraer menú', true)"
        @blur="ocultarTooltip"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
        </svg>
      </button>
    </div>
  </aside>

  <!-- "Mi perfil" del administrador -->
  <PerfilDrawer v-if="rol === 'admin'" v-model:open="perfilAbierto" />

  <!-- Tooltip único, fuera del panel recortado -->
  <Teleport to="body">
    <div
      class="sb-tooltip"
      :class="{ visible: tooltip.visible }"
      :style="{ top: `${tooltip.top}px`, left: `${tooltip.left}px` }"
      role="tooltip"
      aria-hidden="true"
    >{{ tooltip.text }}</div>
  </Teleport>

</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSidebar } from '../composables/useSidebar'
import { useConfirm } from '../composables/useConfirm'
import PerfilDrawer from './PerfilDrawer.vue'

const props = defineProps({
  rol: { type: String, required: true }
})

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const { collapsed, toggle } = useSidebar()

// ── ÍCONOS SVG ──
const svg = (d, w = 1.5) => `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="${w}" stroke="currentColor">${d}</svg>`
const iconUsuarios   = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>`)
const iconClientes   = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>`)
const iconInventario = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>`)
const iconReportes   = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>`)
const iconProduccion = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>`)
const iconEficiencia = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>`)
const iconCuenta     = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>`, 1.8)
const iconTareas     = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>`, 1.8)
const iconAvances    = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>`, 1.8)
const iconPedidos    = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>`)
const iconSoporte    = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/>`)
const iconRoles      = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>`)
const iconEmpresas   = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>`)
const iconGoogle     = svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 13h3v3H8zM13.5 12.5h2.5M13.5 15.5h2.5"/>`, 1.6)

// ── MENÚ POR ROL (misma lógica de roles que antes) ──
const menuConfig = {
  superadmin: {
    label: 'Panel Superadmin',
    roleLabel: 'Superadmin',
    items: [
      { to: '/superadmin/empresas', label: 'Gestión de Empresas', icon: iconEmpresas },
      { to: '/superadmin/roles',    label: 'Gestión de Roles',    icon: iconRoles },
    ]
  },
  admin: {
    label: 'Panel Administrador',
    roleLabel: 'Administrador',
    items: [
      { to: '/admin/usuarios',        label: 'Gestión de Usuarios',   icon: iconUsuarios   },
      { to: '/admin/clientes',        label: 'Gestión de Clientes',   icon: iconClientes   },
      { to: '/admin/inventario',      label: 'Gestión de Inventario', icon: iconInventario },
      { to: '/admin/reportes',        label: 'Reportes',              icon: iconReportes   },
      { to: '/admin/produccion',      label: 'Gestión de Producción', icon: iconProduccion },
      { to: '/admin/eficiencia',      label: 'Gestión de Operarios',  icon: iconEficiencia },
      { to: '/admin/google-calendar', label: 'Google Calendar',       icon: iconGoogle     },
    ]
  },
  operario: {
    label: 'Panel Operario',
    roleLabel: 'Operario',
    items: [
      { to: '/operario/cuenta',          label: 'Cuenta Personal',  icon: iconCuenta  },
      { to: '/operario/tareas',          label: 'Tareas Asignadas', icon: iconTareas  },
      { to: '/operario/avances',         label: 'Reportar Avances', icon: iconAvances },
      { to: '/operario/google-calendar', label: 'Google Calendar',  icon: iconGoogle  },
    ]
  },
  cliente: {
    label: 'Panel Cliente',
    roleLabel: 'Cliente',
    items: [
      { to: '/cliente/cuenta',          label: 'Cuenta Personal',       icon: iconCuenta     },
      { to: '/cliente/pedidos',         label: 'Pedidos y Entregas',    icon: iconPedidos    },
      { to: '/cliente/soporte',         label: 'Centro de Soporte',     icon: iconSoporte    },
      { to: '/cliente/alertas',         label: 'Alertas de Materiales', icon: iconInventario },
      { to: '/cliente/google-calendar', label: 'Google Calendar',       icon: iconGoogle     },
    ]
  }
}

const panelLabel = computed(() => menuConfig[props.rol]?.label || '')
const menuItems  = computed(() => menuConfig[props.rol]?.items || [])
const inicio     = computed(() => menuItems.value[0]?.to || '/')

function esActivo(item) {
  return route.path === item.to
}

// ── USUARIO ──
const userName    = computed(() => auth.usuario?.Nombre_Completo || auth.usuario?.Nombre_Usuario || '')
const userInitial = computed(() => userName.value?.charAt(0).toUpperCase() || '?')
const roleLabel   = computed(() => auth.usuario?.Nombre_Usuario || menuConfig[props.rol]?.roleLabel || '')

// ── ENTRADA ──
// Como el sidebar ya no se desmonta al navegar, la entrada solo ocurre
// una vez (al iniciar sesión o recargar).
const listo = ref(false)

// ── INDICADOR ACTIVO (riel) ──
// Se mide la posición real del ítem activo, así no depende de alturas fijas.
const menuEl     = ref(null)
const itemRefs   = []
const railTop    = ref(0)
const railHeight = ref(0)
const railAnimado = ref(false)

function setItemRef(el, i) {
  itemRefs[i] = el ? (el.$el || el) : null
}

const indiceActivo = computed(() => menuItems.value.findIndex(esActivo))

function medirRiel() {
  const el = itemRefs[indiceActivo.value]
  if (!el) return
  railTop.value    = el.offsetTop
  railHeight.value = el.offsetHeight
}

const railStyle = computed(() => ({
  height: `${railHeight.value}px`,
  transform: `translateY(${railTop.value}px)`,
  opacity: indiceActivo.value >= 0 && listo.value ? 1 : 0,
}))

watch(() => route.path, async () => {
  await nextTick()
  medirRiel()
})

let resizeObs = null

onMounted(async () => {
  await nextTick()
  medirRiel()
  // Activar la transición del riel después de la primera medición,
  // para que no "viaje" desde arriba al cargar.
  requestAnimationFrame(() => {
    listo.value = true
    requestAnimationFrame(() => { railAnimado.value = true })
  })
  if ('ResizeObserver' in window && menuEl.value) {
    resizeObs = new ResizeObserver(medirRiel)
    resizeObs.observe(menuEl.value)
  }
})

onBeforeUnmount(() => {
  resizeObs?.disconnect()
})

// ── TOOLTIP (solo con el menú contraído) ──
const tooltip = reactive({ visible: false, text: '', top: 0, left: 0 })

function mostrarTooltip(event, texto, siempre = false) {
  if (!collapsed.value && !siempre) return
  const rect = event.currentTarget.getBoundingClientRect()
  // Con el menú contraído, el elemento sigue midiendo el ancho completo
  // (solo está recortado), así que el tooltip se ancla al borde visible.
  const recortado = !!event.currentTarget.closest('.sidebar-panel')
  const bordeVisible = collapsed.value && recortado
    ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width-collapsed')) || 76
    : rect.right
  tooltip.text = texto
  tooltip.top  = rect.top + rect.height / 2
  tooltip.left = Math.max(rect.right > bordeVisible ? bordeVisible : rect.right, 0) + 10
  tooltip.visible = true
}

function ocultarTooltip() {
  tooltip.visible = false
}

watch(collapsed, ocultarTooltip)
watch(() => route.path, ocultarTooltip)

// ── MI PERFIL ──
// Admin: abre el panel lateral. Operario y cliente: van a su Cuenta Personal.
const rutaCuenta = { operario: '/operario/cuenta', cliente: '/cliente/cuenta' }
const perfilAccion  = computed(() => props.rol === 'admin' || !!rutaCuenta[props.rol])
const perfilAbierto = ref(false)

function abrirPerfil() {
  if (!perfilAccion.value) return
  ocultarTooltip()
  if (props.rol === 'admin') perfilAbierto.value = true
  else router.push(rutaCuenta[props.rol])
}

// ── CERRAR SESIÓN ──
const confirmar = useConfirm()

async function pedirCerrarSesion() {
  ocultarTooltip()
  const ok = await confirmar({
    titulo: '¿Cerrar sesión?',
    mensaje: 'Tendrás que volver a ingresar tu correo y contraseña.',
    textoConfirmar: 'Cerrar sesión',
    textoCancelar: 'Seguir aquí',
    tono: 'danger',
  })
  if (!ok) return
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
/* ═══════════ CONTENEDOR ═══════════
   El <aside> mide siempre --sidebar-width y no recibe clics por sí mismo:
   solo el panel (recortado) y el borde los reciben. */
.sidebar {
  --clip-right: 0px;
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  z-index: var(--z-sidebar);
  pointer-events: none;
}
.sidebar.collapsed {
  --clip-right: calc(var(--sidebar-width) - var(--sidebar-width-collapsed));
}

/* ═══════════ PANEL ═══════════ */
.sidebar-panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-4);
  background: rgba(249, 250, 251, 0.9);
  backdrop-filter: blur(16px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  pointer-events: auto;
  clip-path: inset(0 var(--clip-right) 0 0);
  transition: clip-path var(--duration-slow) var(--ease-out);
}

/* Entrada inicial (solo una vez) */
.sidebar-panel,
.sidebar-edge {
  opacity: 0;
}
.sidebar.ready .sidebar-panel,
.sidebar.ready .sidebar-edge {
  opacity: 1;
}
.sidebar.ready .sidebar-panel {
  transition:
    clip-path var(--duration-slow) var(--ease-out),
    opacity var(--duration-base) var(--ease-out);
}

/* ═══════════ BORDE + BOTÓN COLAPSAR ═══════════ */
.sidebar-edge {
  position: absolute;
  top: 0;
  left: calc(var(--sidebar-width) - 1px);
  width: 1px;
  height: 100%;
  background: var(--color-border);
  box-shadow: 8px 0 32px rgba(15, 23, 42, 0.06);
  transition: transform var(--duration-slow) var(--ease-out), opacity var(--duration-base) var(--ease-out);
}
.sidebar.collapsed .sidebar-edge {
  transform: translateX(calc(var(--clip-right) * -1));
}

.collapse-btn {
  position: absolute;
  top: 34px;
  left: -13px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  pointer-events: auto;
  transition:
    background var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-out);
}
/* Área de clic más grande que el círculo visible */
.collapse-btn::before {
  content: '';
  position: absolute;
  inset: -8px;
}
.collapse-btn:hover {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: var(--color-on-brand);
}
.collapse-btn:active { transform: scale(0.92); }
.collapse-btn svg {
  transition: transform var(--duration-slow) var(--ease-out);
}
.sidebar.collapsed .collapse-btn svg {
  transform: rotate(180deg);
}

/* ═══════════ LOGO ═══════════
   El área del logo tiene alto fijo: al colapsar solo se cruzan
   opacidades/escala, nada cambia de tamaño. */
.logo {
  position: relative;
  display: block;
  height: 96px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-lg);
  text-decoration: none;
}
.logo-full {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 92px;
  height: 92px;
  margin: -46px 0 0 -46px;
  display: grid;
  place-items: center;
  transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-slow) var(--ease-out);
}
.logo-full img {
  width: 84px;
  position: relative;
  z-index: 2;
}
.logo-mini {
  position: absolute;
  /* centrado en la franja visible de --sidebar-width-collapsed */
  left: calc(var(--sidebar-width-collapsed) / 2 - var(--space-4) - 20px);
  top: 50%;
  width: 40px;
  height: 40px;
  margin-top: -20px;
  border-radius: var(--radius-md);
  object-fit: cover;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-slow) var(--ease-out);
}
.sidebar.collapsed .logo-full {
  opacity: 0;
  transform: scale(0.85);
}
.sidebar.collapsed .logo-mini {
  opacity: 1;
  transform: scale(1);
}

.logo-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(31, 58, 82, 0.1);
  border-top-color: rgba(31, 58, 82, 0.3);
  animation: sidebarspinring 8s linear infinite;
  pointer-events: none;
}
@keyframes sidebarspinring { to { transform: rotate(360deg); } }

.logo-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(31, 58, 82, 0.65);
  transform-origin: 0 0;
  animation: sidebarorbitspark 8s linear infinite;
}
.spark-1 { animation-delay: 0s; }
.spark-2 { animation-delay: -4s; }
@keyframes sidebarorbitspark {
  from { transform: rotate(0deg) translateX(45px); }
  to   { transform: rotate(360deg) translateX(45px); }
}
/* Sin animación infinita mientras no se ve */
.sidebar.collapsed .logo-ring,
.sidebar.collapsed .logo-spark {
  animation-play-state: paused;
}

/* ═══════════ BADGE DE ROL ═══════════ */
.panel-label {
  text-align: center;
  margin-bottom: var(--space-4);
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.sidebar.collapsed .panel-label { opacity: 0; }

.role-badge {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  padding: 3px 12px;
  border-radius: var(--radius-full);
  letter-spacing: 0.3px;
}
.badge-superadmin { background: var(--color-brand); color: var(--color-on-brand); }
.badge-admin      { background: #e0e7ff; color: #3730a3; }
.badge-operario   { background: var(--color-success-soft); color: var(--color-success); }
.badge-cliente    { background: var(--color-warning-soft); color: var(--color-warning); }

/* ═══════════ MENÚ ═══════════ */
.menu {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.menu-rail {
  position: absolute;
  left: calc(var(--space-1) * -1);
  top: 0;
  width: 4px;
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, #38bdf8, #2563eb);
  box-shadow: 0 0 14px rgba(37, 99, 235, 0.3);
  transition:
    transform var(--duration-slow) var(--ease-out),
    opacity var(--duration-base) var(--ease-out);
  will-change: transform;
}
.menu-rail.no-anim { transition: none; }

.menu-item {
  /* Recorte del fondo: completo cuando está expandido,
     un cuadro de 44px centrado en la franja mini cuando está contraído. */
  --item-clip: 0px;
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  text-decoration: none;
  clip-path: inset(0 var(--item-clip) 0 0 round var(--radius-md));
  transition:
    background var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard),
    clip-path var(--duration-slow) var(--ease-out);
}
.sidebar.collapsed .menu-item {
  --item-clip: calc(100% - 44px);
}

/* Entrada escalonada (solo la primera vez) */
.menu-item {
  opacity: 0;
  transform: translateX(calc(var(--motion-shift-md) * -1));
}
.sidebar.ready .menu-item {
  opacity: 1;
  transform: none;
  transition:
    background var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard),
    clip-path var(--duration-slow) var(--ease-out),
    opacity var(--duration-base) var(--ease-out) calc(var(--i) * var(--stagger-step)),
    transform var(--duration-base) var(--ease-out) calc(var(--i) * var(--stagger-step));
}

.menu-item:hover:not(.active) {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}
.menu-item:active:not(.active) {
  background: var(--color-surface-hover);
}
.menu-item.active {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-hover));
  color: var(--color-on-brand);
  font-weight: var(--weight-medium);
  box-shadow: var(--shadow-brand);
}
/* El foco se dibuja dentro, porque el clip-path recortaría un outline externo */
.menu-item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--focus-ring-color);
}
.menu-item.active:focus-visible {
  box-shadow: inset 0 0 0 2px #93c5fd, var(--shadow-brand);
}

.menu-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 18px;
  opacity: 0.75;
  transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-out);
}
.menu-item:hover .menu-icon,
.menu-item.active .menu-icon { opacity: 1; }
.menu-item:active .menu-icon { transform: scale(0.9); }

.menu-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-slow) var(--ease-out);
}
.sidebar.collapsed .menu-label {
  opacity: 0;
  transform: translateX(calc(var(--motion-shift-md) * -1));
}

/* ═══════════ FOOTER ═══════════ */
.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.user-info {
  --item-clip: 0px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 6px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  clip-path: inset(0 var(--item-clip) 0 0 round var(--radius-md));
  transition: clip-path var(--duration-slow) var(--ease-out);
}
.sidebar.collapsed .user-info {
  --item-clip: calc(100% - 44px);
}
.user-info--action {
  width: 100%;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    clip-path var(--duration-slow) var(--ease-out),
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}
.user-info--action:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}
.user-info--action:hover .user-chevron { transform: translateX(2px); }
.user-info--action:active { background: var(--color-surface-hover); }
.user-info--action:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--focus-ring-color);
}
.user-chevron {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--color-text-muted);
  transition: transform var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-standard);
}
.sidebar.collapsed .user-chevron { opacity: 0; }
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-brand);
  color: var(--color-on-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  flex-shrink: 0;
}
.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.sidebar.collapsed .user-details { opacity: 0; }
.user-name-text {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role-text {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout {
  --item-clip: 0px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 44px;
  padding: var(--space-2) 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--text-base);
  cursor: pointer;
  clip-path: inset(0 var(--item-clip) 0 0 round var(--radius-md));
  transition:
    background var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    clip-path var(--duration-slow) var(--ease-out);
}
.sidebar.collapsed .logout {
  --item-clip: calc(100% - 44px);
}
.logout:hover {
  background: var(--color-danger-soft);
  border-color: #fecaca;
  color: var(--color-danger);
}
.logout:active .logout-icon { transform: translateX(-2px); }
.logout:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--focus-ring-color);
}
.logout-icon {
  flex-shrink: 0;
  transition: transform var(--duration-fast) var(--ease-out);
}
.logout-text {
  white-space: nowrap;
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.sidebar.collapsed .logout-text { opacity: 0; }
</style>

<!-- Estilos del tooltip, que se teletransporta al <body> (no puede ser scoped) -->
<style>
.sb-tooltip {
  position: fixed;
  z-index: var(--z-tooltip);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-text-strong);
  color: var(--color-text-inverse);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: var(--shadow-md);
  opacity: 0;
  transform: translate(-4px, -50%);
  transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-out);
}
.sb-tooltip.visible {
  opacity: 1;
  transform: translate(0, -50%);
}
</style>
