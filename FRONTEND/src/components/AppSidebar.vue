<template>
  <aside class="sidebar-shell">
    <div class="sidebar" :class="{ 'sidebar-visible': animVisible }">

    <div class="sidebar-top">
      <!-- Logo con anillo giratorio -->
      <div class="logo" :class="{ visible: animVisible }">
        <div class="logo-ring-wrap">
          <div class="logo-ring">
            <span class="logo-spark spark-1"></span>
            <span class="logo-spark spark-2"></span>
          </div>
          <img src="/img/LogoTexticode.png" alt="Logo Texticode">
        </div>
      </div>

      <!-- Panel label con badge de rol -->
      <div class="panel-label" :class="{ visible: animVisible }">
        <span class="role-badge" :class="rolClass">{{ panelLabel }}</span>
        <div class="sidebar-presence glass-chip">
          <span class="live-dot"></span>
          <span>Navegación activa</span>
        </div>
      </div>

      <!-- Menú de navegación -->
      <nav class="menu">
        <span class="menu-rail" :style="railStyle"></span>
        <RouterLink
          v-for="(item, i) in menuItems"
          :key="item.to"
          :to="item.to"
          class="menu-item"
          :class="{ active: $route.path === item.to, visible: animVisible }"
          :style="{ transitionDelay: animVisible ? `${100 + i * 55}ms` : '0ms' }"
          @mouseenter="hoveredItem = item.to"
          @mouseleave="hoveredItem = null"
        >
          <span class="menu-icon" v-html="item.icon"></span>
          <span class="menu-label">{{ item.label }}</span>
          <!-- Indicador activo -->
          <span v-if="$route.path === item.to" class="active-dot"></span>
        </RouterLink>
      </nav>
    </div>

    <!-- Footer: info usuario + cerrar sesión -->
    <div class="sidebar-footer" :class="{ visible: animVisible }">
      <div class="user-info">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-details">
          <span class="user-name-text">{{ userName }}</span>
          <span class="user-role-text">{{ roleLabel }}</span>
        </div>
      </div>
      <button
        class="logout"
        @click="pedirCerrarSesion"
        @mouseenter="logoutHovered = true"
        @mouseleave="logoutHovered = false"
        title="Cerrar sesión"
      >
        <Transition name="logout-swap" mode="out-in">
          <svg v-if="!logoutHovered" key="icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
          </svg>
          <span v-else key="text" class="logout-text">Cerrar sesión</span>
        </Transition>
      </button>
    </div>

    <!-- Confirm cerrar sesión -->
    <Transition name="fade">
      <div v-if="confirmLogout" class="logout-confirm" @click.self="confirmLogout = false">
        <div class="logout-box">
          <p class="logout-title">¿Cerrar sesión?</p>
          <div class="logout-btns">
            <button class="btn-stay" @click="confirmLogout = false">Cancelar</button>
            <button class="btn-leave" @click="cerrarSesion">Salir</button>
          </div>
        </div>
      </div>
    </Transition>

    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  rol: { type: String, required: true }
})

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

// ── ANIMACIÓN DE ENTRADA ──
const animVisible   = ref(false)
const hoveredItem   = ref(null)
const confirmLogout = ref(false)
const logoutHovered = ref(false)

onMounted(() => {
  setTimeout(() => animVisible.value = true, 30)
})

// ── ÍCONOS SVG ──
const iconUsuarios   = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>`
const iconClientes   = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/></svg>`
const iconInventario = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>`
const iconReportes   = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/></svg>`
const iconProduccion = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>`
const iconEficiencia = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>`
const iconCuenta     = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>`
const iconTareas     = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`
const iconAvances    = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>`
const iconPedidos    = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`
const iconSoporte    = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/></svg>`

const iconGoogle = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 13h3v3H8zM13.5 12.5h2.5M13.5 15.5h2.5"/></svg>`
// ── MENÚ POR ROL ──
const menuConfig = {
  admin: {
    label: 'Panel Administrador',
    roleLabel: 'Administrador',
    items: [
      { to: '/admin/usuarios',   label: 'Gestión de Usuarios',   icon: iconUsuarios   },
      { to: '/admin/clientes',   label: 'Gestión de Clientes',   icon: iconClientes   },
      { to: '/admin/inventario', label: 'Gestión de Inventario', icon: iconInventario },
      { to: '/admin/reportes',   label: 'Reportes',              icon: iconReportes   },
      { to: '/admin/produccion', label: 'Gestión de Producción', icon: iconProduccion },
      { to: '/admin/eficiencia', label: 'Gestión de Operarios',  icon: iconEficiencia },
      { to: '/admin/google-calendar', label: 'Google Calendar', icon: iconGoogle },
    ]
  },
  operario: {
    label: 'Panel Operario',
    roleLabel: 'Operario',
    items: [
      { to: '/operario/cuenta',  label: 'Cuenta Personal',  icon: iconCuenta  },
      { to: '/operario/tareas',  label: 'Tareas Asignadas', icon: iconTareas  },
      { to: '/operario/avances', label: 'Reportar Avances', icon: iconAvances },
      { to: '/operario/google-calendar', label: 'Google Calendar', icon: iconGoogle },
    ]
  },
  cliente: {
    label: 'Panel Cliente',
    roleLabel: 'Cliente',
    items: [
      { to: '/cliente/cuenta',  label: 'Cuenta Personal',   icon: iconCuenta  },
      { to: '/cliente/pedidos', label: 'Pedidos y Entregas', icon: iconPedidos },
      { to: '/cliente/soporte', label: 'Centro de Soporte',  icon: iconSoporte },
      { to: '/cliente/google-calendar', label: 'Google Calendar', icon: iconGoogle },
    ]
  }
}

const MENU_ITEM_HEIGHT = 42
const MENU_GAP = 4

const panelLabel  = computed(() => menuConfig[props.rol]?.label || '')
const menuItems   = computed(() => menuConfig[props.rol]?.items || [])
const activeIndex = computed(() => Math.max(0, menuItems.value.findIndex(item => item.to === route.path)))
const railStyle   = computed(() => ({
  transform: `translateY(${activeIndex.value * (MENU_ITEM_HEIGHT + MENU_GAP)}px)`,
  opacity: animVisible.value ? 1 : 0,
}))

// Nombre real del usuario logueado desde el store
const userName    = computed(() => auth.usuario?.Nombre_Completo || auth.usuario?.Nombre_Usuario || '')
const userInitial = computed(() => userName.value?.charAt(0).toUpperCase() || '?')

// Nombre de usuario en el footer
const roleLabel = computed(() => auth.usuario?.Nombre_Usuario || menuConfig[props.rol]?.roleLabel || '')

// Color del badge según rol
const rolClass = computed(() => ({
  'badge-admin':    props.rol === 'admin',
  'badge-operario': props.rol === 'operario',
  'badge-cliente':  props.rol === 'cliente',
}))

// ── CERRAR SESIÓN ──
function pedirCerrarSesion() {
  confirmLogout.value = true
}
function cerrarSesion() {
  confirmLogout.value = false
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
/* ── SIDEBAR BASE ── */
.sidebar-shell {
  width: 260px;
  min-width: 260px;
  flex-shrink: 0;
}

.sidebar {
  width: 260px; min-width: 260px;
  background: rgba(249, 250, 251, 0.78);
  border-right: 1px solid rgba(255,255,255,0.7);
  padding: 22px 16px;
  display: flex; flex-direction: column; justify-content: space-between;
  position: fixed; top: 0; left: 0; height: 100vh;
  opacity: 0; transform: translateX(-12px);
  transition: opacity 0.4s ease, transform 0.4s ease;
  backdrop-filter: blur(16px);
  box-shadow: 18px 0 50px rgba(15, 23, 42, 0.06);
  overflow-y: auto;
  z-index: 40;
}
.sidebar.sidebar-visible { opacity: 1; transform: none; }

/* ── LOGO ── */
.logo {
  text-align: center; margin-bottom: 10px;
  opacity: 0; transform: translateY(-8px);
  transition: opacity 0.35s ease, transform 0.35s ease;
  transition-delay: 40ms;
  overflow: visible;
}
.logo.visible { opacity: 1; transform: none; }

/* ── PANEL LABEL / BADGE ── */
.panel-label {
  text-align: center; margin-bottom: 20px;
  opacity: 0; transition: opacity 0.35s ease 80ms;
}
.panel-label.visible { opacity: 1; }
.sidebar-presence {
  margin: 12px auto 0;
  width: fit-content;
  color: #475569;
  font-size: 12px;
}

.role-badge {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  padding: 3px 12px; border-radius: 20px;
  letter-spacing: 0.3px;
}
.badge-admin    { background: #e0e7ff; color: #3730a3; }
.badge-operario { background: #dcfce7; color: #15803d; }
.badge-cliente  { background: #fef9c3; color: #92400e; }

/* ── MENÚ ── */
.menu { display: flex; flex-direction: column; gap: 4px; position: relative; }
.menu-rail {
  position: absolute;
  left: -4px;
  top: 0;
  width: 4px;
  height: 42px;
  border-radius: 999px;
  background: linear-gradient(180deg, #38bdf8, #2563eb);
  box-shadow: 0 0 18px rgba(37, 99, 235, 0.25);
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
}
.menu-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  min-height: 42px;
  font-size: 14px; color: #374151;
  text-decoration: none; cursor: pointer;
  transition: background 0.18s, color 0.18s, transform 0.18s, box-shadow 0.18s;
  position: relative;
  opacity: 0; transform: translateX(-10px);
}
.menu-item.visible { opacity: 1; transform: none; }
.menu-item:hover:not(.active) {
  background: rgba(255,255,255,0.92);
  transform: translateX(3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.menu-item.active {
  background: linear-gradient(135deg, #1f3a52, #244b6a);
  color: white; font-weight: 500;
  box-shadow: 0 16px 32px rgba(31, 58, 82, 0.28);
}

@media (max-width: 900px) {
  .sidebar-shell,
  .sidebar {
    width: 240px;
    min-width: 240px;
  }
}
.menu-item.active .menu-icon { opacity: 1; }
.menu-icon { display: flex; align-items: center; flex-shrink: 0; opacity: 0.7; transition: opacity 0.15s; }
.menu-item:hover .menu-icon,
.menu-item.active .menu-icon { opacity: 1; }
.menu-label { flex: 1; }

/* Punto indicador activo */
.active-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.6);
  flex-shrink: 0;
}

/* ── FOOTER ── */
.sidebar-footer {
  opacity: 0; transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
  transition-delay: 350ms;
}
.sidebar-footer.visible { opacity: 1; transform: none; }

.user-info {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  background: rgba(255,255,255,0.92); border: 1px solid rgba(226,232,240,0.9);
  margin-bottom: 8px;
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.06);
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: #1f3a52; color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; flex-shrink: 0;
}
.user-details { display: flex; flex-direction: column; overflow: hidden; }
.user-name-text {
  font-size: 13px; font-weight: 500; color: #111827;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.user-role-text { font-size: 11px; color: #9ca3af; }

.logout {
  display: flex; align-items: center; justify-content: center;
  width: 100%; gap: 8px; border: 1px solid #e5e7eb; padding: 10px;
  border-radius: 8px; font-size: 14px; background: rgba(255,255,255,0.92);
  cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
  color: #374151;
}
.logout:hover { background: #fef2f2; border-color: #fecaca; color: #dc2626; transform: translateY(-1px); }

/* ── CONFIRM LOGOUT ── */
.logout-confirm {
  position: absolute; bottom: 80px; left: 16px; right: 16px;
  z-index: 100;
}
.logout-box {
  background: white; border: 1px solid #e5e7eb;
  border-radius: 10px; padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  text-align: center;
}
.logout-title { font-size: 14px; font-weight: 500; color: #111827; margin: 0 0 14px; }
.logout-btns { display: flex; gap: 8px; justify-content: center; }
.btn-stay {
  padding: 7px 18px; border-radius: 7px; border: 1px solid #e5e7eb;
  background: white; font-size: 13px; cursor: pointer; transition: background 0.15s;
}
.btn-stay:hover { background: #f3f4f6; }
.btn-leave {
  padding: 7px 18px; border-radius: 7px; border: none;
  background: #dc2626; color: white; font-size: 13px;
  font-weight: 500; cursor: pointer; transition: background 0.15s;
}
.btn-leave:hover { background: #b91c1c; }

/* ── TRANSICIONES ── */
.fade-enter-active { transition: all 0.2s ease; }
.fade-leave-active { transition: all 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }

/* ── LOGOUT SWAP (icono ↔ texto) ── */
.logout-text {
  font-size: 13px; font-weight: 600; white-space: nowrap;
}
.logout-swap-enter-active,
.logout-swap-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.logout-swap-enter-from   { opacity: 0; transform: scale(0.8); }
.logout-swap-leave-to     { opacity: 0; transform: scale(0.8); }

.logo-ring-wrap {
  position: relative;
  display: inline-block;
  line-height: 0;
}
.logo-ring-wrap img {
  width: 120px;
  position: relative;
  z-index: 2;
}
.logo-ring {
  position: absolute;
  top: 50%; left: 50%;
  width: 128px; height: 128px;
  margin-left: -64px; margin-top: -64px;
  border-radius: 50%;
  border: 1px solid rgba(31,58,82,0.1);
  border-top-color: rgba(31,58,82,0.3);
  animation: sidebarspinring 6s linear infinite;
  pointer-events: none;
  z-index: 1;
}
@keyframes sidebarspinring { to { transform: rotate(360deg); } }

.logo-spark {
  position: absolute; top: 50%; left: 50%;
  width: 4px; height: 4px; border-radius: 50%;
  background: rgba(31,58,82,0.65);
  box-shadow: 0 0 4px 1px rgba(31,58,82,0.25);
  transform-origin: 0 0;
  animation: sidebarorbitspark 6s linear infinite;
  z-index: 3;
}
.spark-1 { animation-delay:  0s; }
.spark-2 { animation-delay: -3s; }

@keyframes sidebarorbitspark {
  0%   { transform: rotate(0deg)   translateX(62px) translateX(-2px); opacity: 0.7; }
  30%  { opacity: 0.25; }
  60%  { opacity: 0.6; }
  100% { transform: rotate(360deg) translateX(62px) translateX(-2px); opacity: 0.7; }
}
</style>