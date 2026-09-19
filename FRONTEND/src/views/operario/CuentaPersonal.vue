<template>
  <div class="layout">
    <AppSidebar rol="operario" />

    <main class="main">

      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- HERO HEADER -->
      <div class="hero-header" :class="{ 'hero-in': mounted }">
        <div class="hero-icon-wrap">
          <div class="hero-icon-box">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" shape-rendering="geometricPrecision" style="display:block">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
            </svg>
          </div>
          <div class="pulse-ring ring-1"></div>
          <div class="pulse-ring ring-2"></div>
        </div>
        <div class="hero-text">
          <h1 class="hero-title">
            <span v-for="(c, i) in titleChars" :key="i"
              class="title-char"
              :class="{ 'char-visible': mounted }"
              :style="{ transitionDelay: mounted ? `${i * 35}ms` : '0ms' }">{{ c === ' ' ? '\u00A0' : c }}</span>
          </h1>
          <p class="hero-sub">Tu perfil y actividad de operario</p>
        </div>
      </div>

      <!-- CARGANDO -->
      <div v-if="cargando" class="loading-wrap">
        <div class="loader-ring"></div>
        <p class="loading-text">Cargando perfil...</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="error-banner">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
        </svg>
        {{ error }}
        <button class="btn-retry" @click="cargarDatos">Reintentar</button>
      </div>

      <template v-else>
        <!-- SIN SESIÓN -->
        <div v-if="!auth.idUsuario" class="empty-session">
          <div class="empty-icon-hex">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
            </svg>
          </div>
          <p class="empty-title">Ingresa con tu cuenta</p>
          <p class="empty-sub">Inicia sesión para ver tu perfil y actividad.</p>
        </div>

        <!-- CON SESIÓN -->
        <template v-else>

          <!-- CARD UNIFICADA (perfil + contacto) -->
          <div class="profile-contact-card" :class="{ 'banner-in': mounted }">

            <!-- Engranajes decorativos -->
            <div class="gear-deco gear-big" :class="{ 'gear-spin': mounted }">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.07)" stroke-width=".8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </div>
            <div class="gear-deco gear-small" :class="{ 'gear-spin-rev': mounted }">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.1)" stroke-width=".8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </div>

            <!-- Cabecera: avatar + nombre + botón -->
            <div class="pc-header">
              <div class="pc-avatar-wrap" :class="{ 'avatar-in': mounted }">
                <div
                  class="pc-avatar"
                  :style="{
                    background: avatarBg(perfil.Nombre_Completo),
                    color: avatarColor(perfil.Nombre_Completo)
                  }"
                >
                  {{ iniciales }}
                </div>
              </div>

              <div class="pc-identity">
                <div class="pc-name">
                  <span v-for="(c, i) in (perfil.Nombre_Completo || '')" :key="i"
                    class="name-char" :class="{ 'char-in': mounted }"
                    :style="{ animationDelay: mounted ? `${80 + i * 30}ms` : '0ms' }">
                    {{ c === ' ' ? '\u00A0' : c }}
                  </span>
                </div>
              </div>

              <button class="pc-edit-btn" @click="abrirModal">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                </svg>
                Editar Perfil
              </button>
            </div>

            <!-- Divisor -->
            <div class="pc-divider"></div>

            <!-- Grid de contacto dentro de la card azul -->
            <div class="pc-contact-grid">
              <div
                class="pc-contact-item"
                v-for="(item, i) in contactItems"
                :key="item.label"
                :style="{ animationDelay: mounted ? `${200 + i * 65}ms` : '9999s' }"
              >
                <div class="pc-contact-icon">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
                       stroke-width="1.8" stroke="currentColor" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon"/>
                  </svg>
                </div>
                <div class="pc-contact-info">
                  <span class="pc-contact-label">{{ item.label }}</span>
                  <span class="pc-contact-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- STATS CARDS -->
          <div class="stats-row">
            <div class="stat-card" v-for="(s, i) in statsCards" :key="s.label"
              :style="{ '--i': i }">
              <div class="stat-accent" :style="{ background: s.color }"></div>
              <div class="stat-icon-bg" :style="{ color: s.color }">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" style="display:block">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon"/>
                </svg>
              </div>
              <div class="stat-body">
                <div class="stat-value" :style="{ color: s.color }">{{ s.display }}</div>
                <div class="stat-label">{{ s.label }}</div>
                <div class="stat-sub">{{ s.sub }}</div>
              </div>
            </div>
          </div>

          <!-- ACTIVIDAD RECIENTE -->
          <div class="card" style="--d:300ms">
            <div class="card-header">
              <div class="ch-dot" style="background:#e0eaf2">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#1f3a52" style="display:block">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              Actividad Reciente
              <div class="card-badge">{{ ordenes.length }}</div>
              <div class="card-line"></div>
            </div>

            <div v-if="cargandoOrdenes" class="loading-inline">
              <div class="skeleton-row" v-for="i in 3" :key="i"></div>
            </div>
            <div v-else-if="ordenes.length === 0" class="empty-msg">No hay órdenes asignadas aún.</div>

            <div v-else class="timeline">
              <div class="timeline-line" :class="{ 'line-grow': mounted }"></div>
              <div class="timeline-item"
                v-for="(o, i) in ordenes.slice(0, 5)" :key="o.Id_Orden"
                :style="{ animationDelay: mounted ? `${480 + i * 75}ms` : '0ms' }">

                <div class="tl-order-pill">#{{ o.Id_Orden }}</div>

                <div class="tl-node" :class="nodeClass(o.Estado)">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="display:block">
                    <path v-if="o.Estado === 'Completada'" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    <path v-else-if="o.Estado === 'En Proceso'" stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5"/>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5"/>
                  </svg>
                </div>

                <div class="tl-content">
                  <div class="tl-head">
                    <span class="tl-badge" :class="badgeClass(o.Estado)">{{ o.Estado }}</span>
                  </div>
                  <div class="tl-desc">{{ o.Descripcion }}</div>
                  <div class="tl-sub">Cliente: {{ o.Cliente || '—' }} · Cantidad: {{ o.Cantidad }}</div>
                  <div class="tl-prog">
                    <div class="tl-prog-bar">
                      <div class="tl-prog-fill" :class="badgeClass(o.Estado)"
                        :style="{ width: mounted ? progresoEstado(o.Estado) + '%' : '0%',
                                  transition: `width 1s ease ${500 + i * 80}ms` }"></div>
                    </div>
                    <span class="tl-prog-txt">{{ progresoEstado(o.Estado) }}%</span>
                  </div>
                  <div class="tl-fecha">{{ formatFecha(o.Fecha_Limite) }}</div>
                </div>
              </div>
            </div>
          </div>

        </template>
      </template>
    </main>

    <!-- MODAL EDITAR -->
    <Transition name="modal">
      <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">Editar Perfil</h3>
            <button class="modal-close" @click="cerrarModal">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group"><label class="form-label">Nombre Completo</label><input v-model="formEdicion.Nombre_Completo" type="text" class="form-input" @keypress="soloLetras"></div>
            <div class="form-group"><label class="form-label">Correo Electrónico</label><input v-model="formEdicion.Correo" type="email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input v-model="formEdicion.Telefono" type="tel" class="form-input"></div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <div class="input-wrap">
                <input v-model="formEdicion.Contrasena" :type="mostrarPassword ? 'text' : 'password'" class="form-input" placeholder="••••••••">
                <button class="toggle-pass" @click="mostrarPassword = !mostrarPassword" type="button">
                  <svg v-if="!mostrarPassword" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"/></svg>
                  <svg v-else fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                </button>
              </div>
              <div v-if="formEdicion.Contrasena" class="pwd-hints">
                <span v-for="h in passwordHints" :key="h.label" class="pwd-hint" :class="h.ok ? 'hint-ok' : 'hint-no'">
                  {{ h.ok ? '✓' : '✗' }} {{ h.label }}
                </span>
              </div>
              <p class="pwd-note">Déjala vacía si no deseas cambiarla.</p>
            </div>
          </div>
          <div v-if="errorGuardar" class="error-inline">{{ errorGuardar }}</div>
          <div class="modal-footer">
            <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
            <button class="btn-guardar" :disabled="guardando" @click="guardarCambios">{{ guardando ? 'Guardando...' : 'Guardar Cambios' }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="toast.visible" class="toast" :class="'toast-' + toast.type">{{ toast.msg }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore } from '../../stores/auth'
import { getUsuario, actualizarUsuario, getOrdenesDeOperario } from '../../services/api'

const auth = useAuthStore()

// ── VALIDACIÓN DE CONTRASEÑA FUERTE ──
function validarContrasena(pwd) {
  if (!pwd) return null // vacío = no cambia, permitido
  if (pwd.length < 8)              return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(pwd))          return 'Debe incluir al menos una letra mayúscula.'
  if (!/[0-9]/.test(pwd))          return 'Debe incluir al menos un número.'
  if (!/[^A-Za-z0-9]/.test(pwd))   return 'Debe incluir al menos un carácter especial (@, #, $, etc.).'
  return null
}

const passwordHints = computed(() => {
  const pwd = formEdicion.value.Contrasena || ''
  return [
    { label: 'Mínimo 8 caracteres',        ok: pwd.length >= 8 },
    { label: 'Una letra mayúscula',         ok: /[A-Z]/.test(pwd) },
    { label: 'Un número',                   ok: /[0-9]/.test(pwd) },
    { label: 'Un carácter especial (@#$…)', ok: /[^A-Za-z0-9]/.test(pwd) },
  ]
})

// ── PALETA DE AVATARES ──
const PALETTES = [
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef9c3', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fee2e2', color: '#991b1b' },
]
function avatarBg(n)    { return PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length].bg }
function avatarColor(n) { return PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length].color }

const displayCompletadas = ref(0)
const displayEnProceso   = ref(0)
const displayTotal       = ref(0)

function animateCount(targetRef, target) {
  let val = 0
  const steps = 80; const duration = 2000
  const intervalMs = Math.round(duration / steps)
  const step = Math.max(0.1, target / steps)
  const id = setInterval(() => {
    val += step
    if (val >= target) { targetRef.value = target; clearInterval(id) }
    else targetRef.value = Math.floor(val)
  }, intervalMs)
}

const mounted         = ref(false)
const cargando        = ref(true)
const cargandoOrdenes = ref(false)
const error           = ref('')
const errorGuardar    = ref('')
const guardando       = ref(false)
const modalVisible    = ref(false)
const mostrarPassword = ref(false)
const toast           = ref({ visible: false, msg: '', type: 'success' })
const perfil          = ref({})
const ordenes         = ref([])
const formEdicion     = ref({})

const titleChars = 'Cuenta Personal'.split('')

const iniciales = computed(() =>
  (perfil.value.Nombre_Completo || '').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()
)

const contactItems = computed(() => [
  {
    label: 'Email',
    value: perfil.value.Correo || '—',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75'
  },
  {
    label: 'Teléfono',
    value: perfil.value.Telefono || '—',
    icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25Z'
  },
  {
    label: 'Usuario',
    value: perfil.value.Nombre_Usuario || '—',
    icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0'
  },
])

const statsCards = computed(() => [
  {
    label: 'Completadas', sub: 'Órdenes finalizadas', display: displayCompletadas.value, color: '#16a34a',
    icon: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
  },
  {
    label: 'En Proceso', sub: 'Producción activa', display: displayEnProceso.value, color: '#2563eb',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
  },
  {
    label: 'Total', sub: 'Órdenes asignadas', display: displayTotal.value, color: '#1f3a52',
    icon: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'
  },
])

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}
function nodeClass(estado) {
  return { 'Completada': 'node-green', 'En Proceso': 'node-blue', 'Pausado': 'node-yellow' }[estado] || 'node-yellow'
}
function badgeClass(estado) {
  return { 'Completada': 'badge-completada', 'En Proceso': 'badge-proceso', 'Pausado': 'badge-pausado' }[estado] || 'badge-pausado'
}
function progresoEstado(estado) {
  return { 'Completada': 100, 'En Proceso': 58, 'Pausado': 28 }[estado] ?? 0
}

async function cargarDatos() {
  cargando.value = true; error.value = ''
  try {
    if (!auth.idUsuario) { perfil.value = {}; ordenes.value = []; return }
    perfil.value = await getUsuario(auth.idUsuario)
    cargandoOrdenes.value = true
    try {
      const data = await getOrdenesDeOperario(auth.idUsuario)
      ordenes.value = Array.isArray(data) ? data : []
    } catch { ordenes.value = [] }
    finally { cargandoOrdenes.value = false }
  } catch (e) {
    error.value = e.message || 'Error al cargar el perfil.'
  } finally {
    cargando.value = false
    setTimeout(() => {
      mounted.value = true
      animateCount(displayCompletadas, ordenes.value.filter(o => o.Estado === 'Completada').length)
      animateCount(displayEnProceso,   ordenes.value.filter(o => o.Estado === 'En Proceso').length)
      animateCount(displayTotal,       ordenes.value.length)
    }, 80)
  }
}

onMounted(cargarDatos)

function abrirModal() { formEdicion.value = { ...perfil.value, Contrasena: '' }; mostrarPassword.value = false; errorGuardar.value = ''; modalVisible.value = true }
function cerrarModal() { modalVisible.value = false; errorGuardar.value = '' }
function soloLetras(e) {
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÄËÏÖÜäëïöüÑñ\s'-]$/.test(e.key)) e.preventDefault()
}

async function guardarCambios() {
  if (!formEdicion.value.Nombre_Completo?.trim() || !formEdicion.value.Correo?.trim()) { errorGuardar.value = 'Nombre y correo son obligatorios.'; return }
  if (/[0-9]/.test(formEdicion.value.Nombre_Completo)) { errorGuardar.value = 'El nombre no puede contener números.'; return }
  const errPwd = validarContrasena(formEdicion.value.Contrasena)
  if (errPwd) { errorGuardar.value = errPwd; return }
  guardando.value = true; errorGuardar.value = ''
  try {
    const payload = { Id_Rol: perfil.value.Id_Rol, Nombre_Completo: formEdicion.value.Nombre_Completo, Nombre_Usuario: perfil.value.Nombre_Usuario, Correo: formEdicion.value.Correo, Telefono: formEdicion.value.Telefono || null, Estado: perfil.value.Estado, Contrasena: formEdicion.value.Contrasena || null }
    await actualizarUsuario(auth.idUsuario, payload)
    perfil.value = { ...perfil.value, ...payload }
    if (auth.usuario) auth.usuario.Nombre_Completo = formEdicion.value.Nombre_Completo
    cerrarModal(); mostrarToast('Perfil actualizado correctamente', 'success')
  } catch (e) { errorGuardar.value = e.message || 'Error al guardar los cambios.' }
  finally { guardando.value = false }
}
function mostrarToast(msg, type = 'success') { toast.value = { visible: true, msg, type }; setTimeout(() => { toast.value.visible = false }, 2800) }
</script>

<style scoped>
/* ═══ LAYOUT ═══ */
.layout { display: flex; min-height: 100vh; background: #f3f4f6; }
.main {
  flex: 1; padding: 28px 30px; overflow-y: auto; position: relative;
  background:
    radial-gradient(circle at 20% 10%, rgba(37,99,235,.08), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(31,58,82,.08), transparent 45%);
}

/* ═══ FONDO ═══ */
.bg-grid {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: .5;
  background-image:
    linear-gradient(rgba(31,58,82,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31,58,82,0.06) 1px, transparent 1px);
  background-size: 40px 40px;
}
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .13; animation: orbDrift 12s ease-in-out infinite alternate; }
.orb-1 { width: 420px; height: 420px; background: #1f3a52; top: -80px; right: -60px; animation-duration: 13s; }
.orb-2 { width: 300px; height: 300px; background: #2563eb; bottom: 80px; left: -60px; animation-duration: 17s; animation-direction: alternate-reverse; }
.orb-3 { width: 200px; height: 200px; background: #16a34a; top: 45%; right: 20%; animation-duration: 10s; }
@keyframes orbDrift { from { transform: translate(0,0) scale(1); } to { transform: translate(28px,18px) scale(1.07); } }

/* ═══ HERO HEADER ═══ */
.hero-header {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 20px; margin-bottom: 24px;
  opacity: 0; transform: translateY(-14px);
  transition: opacity .5s ease, transform .5s cubic-bezier(.34,1.56,.64,1);
}
.hero-header.hero-in { opacity: 1; transform: none; }
.hero-icon-wrap { position: relative; width: 56px; height: 56px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.hero-icon-box {
  width: 52px; height: 52px; border-radius: 14px;
  background: linear-gradient(135deg, #1f3a52, #2d5f8a);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(31,58,82,.35); position: relative; z-index: 2;
}
.pulse-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(31,58,82,.25); animation: pulseExpand 2.8s ease-out infinite; }
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 84px; height: 84px; animation-delay: .7s; }
@keyframes pulseExpand { 0% { transform: scale(.7); opacity: .7; } 100% { transform: scale(1.3); opacity: 0; } }
.hero-text { flex: 1; }
.hero-title { font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 4px; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; opacity: 0; transform: translateY(8px); transition: opacity .3s ease, transform .3s ease; }
.title-char.char-visible { opacity: 1; transform: none; }
.hero-sub { font-size: 13px; color: #9ca3af; margin: 0; }

/* ══════════════════════════════════════════
   CARD UNIFICADA PERFIL + CONTACTO
══════════════════════════════════════════ */
.profile-contact-card {
  background: linear-gradient(135deg, #111827 0%, #1f3a52 55%, #0f2236 100%);
  border-radius: 18px; padding: 26px 28px; margin-bottom: 20px;
  opacity: 0; transform: translateY(22px) scale(0.97);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 32px rgba(15,34,54,0.3);
  position: relative; overflow: hidden;
}
.profile-contact-card.banner-in { opacity: 1; transform: none; }

/* ═══ ENGRANAJES ═══ */
.gear-deco { position: absolute; pointer-events: none; }
.gear-big  { width: 160px; height: 160px; right: -20px; top: -30px; transform-origin: center; }
.gear-small { width: 80px; height: 80px; right: 110px; bottom: -20px; transform-origin: center; }
.gear-big svg, .gear-small svg { width: 100%; height: 100%; }
.gear-spin     { animation: gearTurn 20s linear infinite; }
.gear-spin-rev { animation: gearTurn 14s linear infinite reverse; }
@keyframes gearTurn { to { transform: rotate(360deg); } }

/* ── CABECERA ── */
.pc-header {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  position: relative; z-index: 1;
}

/* Avatar sin rombo */
.pc-avatar-wrap {
  flex-shrink: 0;
  opacity: 0; transform: scale(0.5);
  transition: opacity 0.5s ease 0.1s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
}
.pc-avatar-wrap.avatar-in { opacity: 1; transform: scale(1); }
.pc-avatar {
  width: 68px; height: 68px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 800;
  border: 2.5px solid rgba(255,255,255,0.25);
  box-shadow: 0 0 0 4px rgba(255,255,255,0.06), 0 6px 18px rgba(0,0,0,0.3);
}

/* Identidad */
.pc-identity { flex: 1; min-width: 0; }
.pc-name {
  font-size: 20px; font-weight: 700; color: white;
  display: flex; flex-wrap: wrap;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.name-char { display: inline-block; opacity: 0; transform: translateY(6px); animation: charReveal .3s ease both; }
@keyframes charReveal { to { opacity:1; transform:none; } }

/* Botón editar */
.pc-edit-btn {
  display: flex; align-items: center; gap: 7px;
  background: rgba(255,255,255,0.12); color: white;
  border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;
  padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
  flex-shrink: 0; backdrop-filter: blur(6px);
  transition: background 0.2s, transform 0.15s; position: relative; z-index: 1;
}
.pc-edit-btn:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }

/* Divisor */
.pc-divider {
  margin: 22px 0 18px; border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  position: relative; z-index: 1;
}

/* ── GRID DE CONTACTO DENTRO DE LA CARD ── */
.pc-contact-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; position: relative; z-index: 1;
}
.pc-contact-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  opacity: 0; animation: contactReveal 0.4s ease both;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}
.pc-contact-item:hover {
  background: rgba(255,255,255,0.13);
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-1px);
}
@keyframes contactReveal { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.pc-contact-icon {
  width: 34px; height: 34px; border-radius: 10px;
  background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.85);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pc-contact-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pc-contact-label {
  font-size: 10px; color: rgba(255,255,255,0.45);
  text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
}
.pc-contact-value {
  font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ═══ STATS CARDS ═══ */
.stats-row { position: relative; z-index: 1; display: flex; gap: 16px; margin-bottom: 20px; }
.stat-card {
  flex: 1; position: relative; overflow: hidden;
  display: flex; align-items: center; gap: 16px;
  background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px 20px;
  opacity: 0; transform: translateY(18px) scale(.96);
  animation: statIn .5s cubic-bezier(.34,1.56,.64,1) calc(var(--i, 0) * 90ms + 160ms) both;
  transition: box-shadow .2s, transform .2s;
}
.stat-card:hover { box-shadow: 0 6px 22px rgba(0,0,0,.09); transform: translateY(-3px) !important; }
@keyframes statIn { from{opacity:0;transform:translateY(18px) scale(.96)} 60%{transform:translateY(-3px)} to{opacity:1;transform:none} }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 14px 0 0 14px; }
.stat-icon-bg { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); opacity: .07; }
.stat-body { flex: 1; position: relative; z-index: 1; }
.stat-value { font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 13px; font-weight: 700; color: #111827; }
.stat-sub   { font-size: 11px; color: #9ca3af; margin-top: 2px; }

/* ═══ CARD ACTIVIDAD ═══ */
.card {
  position: relative; z-index: 1;
  background: white; border: 1px solid #e5e7eb; border-radius: 14px;
  padding: 22px 24px; margin-bottom: 16px;
  opacity: 0; transform: translateY(16px);
  animation: slideUp .5s ease var(--d, 300ms) both;
  transition: box-shadow .2s;
}
.card:hover { box-shadow: 0 4px 18px rgba(0,0,0,.07); }
@keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
.card-header { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 18px; }
.ch-dot { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-badge { font-size: 11px; font-weight: 700; padding: 2px 9px; background: #e0eaf2; color: #1f3a52; border-radius: 20px; }
.card-line { flex: 1; height: 1px; background: linear-gradient(90deg, #e5e7eb, transparent); }

/* ═══ TIMELINE ═══ */
.timeline { position: relative; padding-left: 24px; }
.timeline-line {
  position: absolute; left: 9px; top: 8px; bottom: 8px; width: 2px;
  background: linear-gradient(180deg, #1f3a52, #e5e7eb); border-radius: 999px;
  transform-origin: top; transform: scaleY(0); transition: transform 1s ease .48s;
}
.timeline-line.line-grow { transform: scaleY(1); }
.timeline-item {
  position: relative; display: flex; gap: 14px; align-items: flex-start;
  margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #f3f4f6;
  opacity: 0; transform: translateX(-14px); animation: tlIn .45s ease both;
}
.timeline-item:last-child { border-bottom: none; margin-bottom: 0; }
@keyframes tlIn { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:none} }
.tl-order-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; background: #f3f4f6; color: #374151; border-radius: 20px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; transition: background .2s, color .2s; }
.timeline-item:hover .tl-order-pill { background: #1f3a52; color: white; }
.tl-node { position: absolute; left: -24px; top: 2px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 2; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,.15); transition: transform .2s cubic-bezier(.34,1.56,.64,1); }
.timeline-item:hover .tl-node { transform: scale(1.2); }
.node-green  { background: #16a34a; color: white; }
.node-blue   { background: #2563eb; color: white; }
.node-yellow { background: #d97706; color: white; }
.tl-content { flex: 1; }
.tl-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tl-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.badge-completada { background: #dcfce7; color: #166534; }
.badge-proceso    { background: #dbeafe; color: #1d4ed8; }
.badge-pausado    { background: #fef3c7; color: #92400e; }
.tl-desc  { font-size: 13px; color: #374151; font-weight: 500; margin-bottom: 3px; }
.tl-sub   { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
.tl-fecha { font-size: 11px; color: #d1d5db; margin-top: 6px; }
.tl-prog { display: flex; align-items: center; gap: 8px; }
.tl-prog-bar { flex: 1; height: 5px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
.tl-prog-fill { height: 100%; border-radius: 999px; }
.tl-prog-fill.badge-completada { background: #16a34a; }
.tl-prog-fill.badge-proceso    { background: #2563eb; }
.tl-prog-fill.badge-pausado    { background: #d97706; }
.tl-prog-txt { font-size: 11px; font-weight: 700; color: #374151; min-width: 30px; }

/* ═══ LOADING / SKELETON ═══ */
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 18px; position: relative; z-index: 1; }
.loader-ring { width: 44px; height: 44px; border-radius: 50%; border: 3px solid #e5e7eb; border-top-color: #1f3a52; animation: spin .8s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }
.loading-text { font-size: 14px; color: #9ca3af; }
.loading-inline { display: flex; flex-direction: column; gap: 10px; }
.skeleton-row { height: 60px; border-radius: 10px; background: linear-gradient(90deg, #f3f4f6 0%, #fafafa 40%, #f3f4f6 80%); background-size: 300% 100%; animation: skeletonWave 1.6s ease-in-out infinite; }
@keyframes skeletonWave { 0%{background-position:200% 0} 100%{background-position:-100% 0} }
.empty-msg { font-size: 13px; color: #9ca3af; padding: 16px 0; }

/* ═══ EMPTY SESSION ═══ */
.empty-session { display: flex; flex-direction: column; align-items: center; padding: 80px 24px; gap: 12px; text-align: center; position: relative; z-index: 1; }
.empty-icon-hex { width: 72px; height: 72px; border-radius: 16px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; animation: hexFloat 3s ease-in-out infinite; }
@keyframes hexFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.empty-title { font-size: 16px; font-weight: 600; color: #374151; }
.empty-sub   { font-size: 13px; color: #9ca3af; max-width: 300px; }

/* ═══ ERROR ═══ */
.error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; color: #991b1b; font-size: 14px; margin-bottom: 20px; position: relative; z-index: 1; }
.btn-retry { margin-left: auto; background: #991b1b; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 13px; cursor: pointer; }

/* ═══ MODAL ═══ */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-container { background: white; border-radius: 16px; width: 460px; max-width: 95vw; box-shadow: 0 20px 60px rgba(0,0,0,.15); animation: modalIn .35s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes modalIn { from{opacity:0;transform:scale(.85) translateY(20px)} to{opacity:1;transform:none} }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-title  { font-size: 17px; font-weight: 600; color: #111827; }
.modal-close  { background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; border-radius: 6px; transition: background .15s, transform .2s; }
.modal-close:hover { background: #f3f4f6; transform: rotate(90deg); }
.modal-body   { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.form-group   { display: flex; flex-direction: column; gap: 5px; }
.form-label   { font-size: 12px; font-weight: 600; color: #374151; }
.form-input   { border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 14px; color: #111827; outline: none; transition: border-color .2s, box-shadow .2s; }
.form-input:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,.1); }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid #f3f4f6; }
.btn-cancelar { background: white; color: #374151; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 18px; font-size: 13px; cursor: pointer; }
.btn-guardar  { background: #1f3a52; color: white; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .2s; }
.btn-guardar:hover:not(:disabled) { background: #2d5580; }
.btn-guardar:disabled { opacity: .6; cursor: not-allowed; }
.input-wrap { display: flex; align-items: center; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff; }
.input-wrap:focus-within { border-color: #1f3a52; }
.input-wrap .form-input { flex: 1; border: none; outline: none; padding: 10px 12px; box-shadow: none !important; }
.toggle-pass { background: none; border: none; cursor: pointer; padding: 0 10px; color: #9ca3af; transition: color .15s; }
.toggle-pass:hover { color: #374151; }
.error-inline { color: #dc2626; font-size: 13px; padding: 6px 24px; }
.pwd-hints { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.pwd-hint { font-size: 11.5px; font-weight: 500; padding: 2px 8px; border-radius: 20px; transition: background .2s, color .2s; }
.hint-ok { background: #dcfce7; color: #166534; }
.hint-no { background: #f3f4f6; color: #9ca3af; }
.pwd-note { font-size: 11px; color: #9ca3af; margin-top: 4px; }

/* ═══ TOAST ═══ */
.toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 2000; }
.toast-success { background: #166534; color: white; }
.toast-danger  { background: #991b1b; color: white; }
.toast-enter-active { animation: toastIn .35s cubic-bezier(.34,1.56,.64,1) both; }
.toast-leave-active { animation: toastOut .25s ease both; }
@keyframes toastIn  { from{opacity:0;transform:translateY(14px) scale(.9)} to{opacity:1;transform:none} }
@keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateY(8px)} }
.modal-enter-active, .modal-leave-active { transition: opacity .25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 960px) {
  .main { padding: 20px 16px; }
  .stats-row { flex-direction: column; }
  .pc-contact-grid { grid-template-columns: 1fr 1fr; }
  .pc-edit-btn { width: 100%; justify-content: center; }
}
@media (max-width: 600px) {
  .pc-contact-grid { grid-template-columns: 1fr; }
}
</style>