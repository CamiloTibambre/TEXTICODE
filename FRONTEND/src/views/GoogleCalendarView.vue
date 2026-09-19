<template>
  <div class="layout">
    <AppSidebar :rol="rolActual" />

    <main class="main">

      <!-- FONDO DECORATIVO -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- TOAST -->
      <Transition name="toast">
        <div v-if="message" class="toast" :class="messageType === 'error' ? 'danger' : 'success'">
          <svg v-if="messageType !== 'error'" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          </svg>
          <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126Z"/>
          </svg>
          {{ message }}
        </div>
      </Transition>

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': animVisible }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Google Calendar'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: animVisible ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Sincroniza fechas de entrega y recordatorios automáticos con Google Workspace</p>
          </div>
        </div>
        <div class="hero-actions-wrap">
          <button class="btn btn-refresh" @click="sincronizar" :disabled="working || !status.connected">
            <svg class="btn-icon" :class="{ 'spin': working }" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            Sincronizar ahora
          </button>
        </div>
      </div>

      <!-- STATS -->
      <div class="stats" :class="{ 'stats-visible': animVisible }">
        <div class="stat-card" style="transition-delay:0ms">
          <div class="stat-accent" style="background:#1f3a52"></div>
          <div class="stat-icon-bg" style="color:#1f3a52">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
          </div>
          <h3>Usuarios conectados</h3>
          <p style="color:#1f3a52">{{ statsConectados }}</p>
        </div>
        <div class="stat-card" style="transition-delay:80ms">
          <div class="stat-accent" style="background:#16a34a"></div>
          <div class="stat-icon-bg" style="color:#16a34a">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </div>
          <h3>Eventos sincronizados</h3>
          <p style="color:#16a34a">{{ syncCount }}</p>
        </div>
        <div class="stat-card" style="transition-delay:160ms">
          <div class="stat-accent" style="background:#2563eb"></div>
          <div class="stat-icon-bg" style="color:#2563eb">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
            </svg>
          </div>
          <h3>Próximos eventos</h3>
          <p style="color:#2563eb">{{ events.length }}</p>
        </div>
        <div class="stat-card" style="transition-delay:240ms">
          <div class="stat-accent" style="background:#d97706"></div>
          <div class="stat-icon-bg" style="color:#d97706">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
            </svg>
          </div>
          <h3>Recordatorios activos</h3>
          <p style="color:#d97706">{{ events.length * 2 }}</p>
        </div>
      </div>

      <!-- FILA PRINCIPAL -->
      <div class="grid-2" :class="{ 'box-visible': animVisible }" style="margin-bottom:20px">

        <!-- ESTADO DE VINCULACIÓN -->
        <div class="table-box box-visible" style="transition-delay:200ms">
          <div class="table-header-bar">
            <div class="table-header-left">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
              Estado de vinculación
            </div>
            <span class="badge-rendimiento" :class="status.connected ? 'alto' : 'bajo'">
              {{ status.connected ? 'Conectado' : 'Sin vincular' }}
            </span>
          </div>

          <div style="padding:20px">
            <div v-if="loading" class="cargando-detalle">
              <div class="spinner"></div> Consultando Google Calendar...
            </div>
            <template v-else>
              <div v-if="status.connected" class="connected-box">
                <div class="g-avatar">
                  <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  </svg>
                </div>
                <div class="conn-info">
                  <span class="conn-name">{{ status.profile?.email }}</span>
                  <span class="conn-meta">Calendario: {{ status.profile?.calendarId || 'primary' }} &nbsp;·&nbsp; Última sync: {{ formatDate(status.profile?.lastSyncAt) }}</span>
                </div>
              </div>
              <div v-else class="empty-box">
                Vincula tu cuenta de Google para activar la sincronización con el calendario
              </div>

              <div class="actions-row" style="margin-top:16px">
                <button class="action-btn-full" @click="iniciarVinculacion" :disabled="working">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/>
                  </svg>
                  {{ status.connected ? 'Reautorizar Google' : 'Vincular cuenta con Google' }}
                </button>
                <button v-if="status.connected" class="action-btn-danger" @click="desvincular" :disabled="working">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.181 8.68a4.503 4.503 0 0 1 1.903 6.405m-9.768-3.782L3.56 14.09a4.5 4.5 0 0 0 6.364 6.364l3.018-3.018m-4.5-6.364L12 8.318m0 0 3.75-3.75a4.5 4.5 0 0 1 6.364 6.364l-3.018 3.018"/>
                  </svg>
                  Desvincular
                </button>
              </div>

              <div v-if="syncResult" class="result-box">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                <span>{{ syncResult }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- FUNCIONALIDADES -->
        <div class="table-box box-visible" style="transition-delay:280ms">
          <div class="table-header-bar">
            <div class="table-header-left">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
              </svg>
              Funcionalidades activas
            </div>
          </div>
          <div style="padding:16px">
            <div class="feature-grid">
              <div class="feature-item" v-for="f in features" :key="f.title">
                <div class="feature-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="f.icon"/>
                  </svg>
                </div>
                <span class="feature-title">{{ f.title }}</span>
                <span class="feature-desc">{{ f.desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FILA INFERIOR -->
      <div class="grid-2">

        <!-- PRÓXIMOS EVENTOS -->
        <div class="table-box box-visible" style="transition-delay:360ms">
          <div class="table-header-bar">
            <div class="table-header-left">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
              </svg>
              Próximos eventos Texticode
              <span class="count-badge">{{ events.length }}</span>
            </div>
            <button class="btn-ghost-sm" @click="cargarEventos" :disabled="!status.connected || working">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              Actualizar
            </button>
          </div>
          <div style="padding:16px">
            <div v-if="events.length" class="event-list">
              <a v-for="event in events" :key="event.id" class="event-row" :href="event.htmlLink" target="_blank" rel="noreferrer">
                <span class="event-date-badge">{{ formatEventDate(event.start) }}</span>
                <span class="event-title-txt">{{ event.summary }}</span>
                <span class="event-arrow">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                  </svg>
                </span>
              </a>
            </div>
            <div v-else class="empty-state">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"/>
              </svg>
              <p>Sin eventos Texticode consultados</p>
            </div>
          </div>
        </div>

        <!-- USUARIOS ADMIN -->
        <div v-if="esAdmin" class="table-box box-visible" style="transition-delay:440ms">
          <div class="table-header-bar">
            <div class="table-header-left">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
              </svg>
              Usuarios con Google vinculado
              <span class="count-badge">{{ connectedUsers.filter(u => u.Google_Email).length }}</span>
            </div>
            <button class="btn-ghost-sm" @click="cargarUsuariosGoogle">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              Actualizar
            </button>
          </div>
          <div style="padding:16px">
            <div class="user-list">
              <div v-for="user in connectedUsers" :key="user.Id_Usuario" class="user-row">
                <div class="avatar" :style="{ background: avatarBg(user.Nombre_Completo), color: avatarColor(user.Nombre_Completo) }">
                  {{ iniciales(user.Nombre_Completo) }}
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.Nombre_Completo }}</span>
                  <span class="user-meta">{{ user.Rol }} · {{ user.Correo }}</span>
                </div>
                <span class="badge-rendimiento" :class="user.Google_Email ? 'alto' : 'bajo'" style="font-size:11px">
                  {{ user.Google_Email ? 'Google activo' : 'Sin vincular' }}
                </span>
              </div>
              <div v-if="!connectedUsers.length" class="empty-state">
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z"/>
                </svg>
                <p>Sin usuarios con Google vinculado</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import { useAuthStore } from '../stores/auth'
import {
  getGoogleAuthUrl,
  getGoogleCalendarStatus,
  getGoogleConnectedUsers,
  getGoogleUpcomingEvents,
  syncGoogleDeliveryEvents,
  unlinkGoogleCalendar,
} from '../services/api'

const auth        = useAuthStore()
const animVisible = ref(false)
const loading     = ref(true)
const working     = ref(false)
const status      = ref({ connected: false, profile: null })
const events      = ref([])
const connectedUsers = ref([])
const syncResult  = ref('')
const syncCount   = ref(0)
const message     = ref('')
const messageType = ref('success')

const rolActual = computed(() => {
  const rol = auth.rol
  if (rol === 'administrador') return 'admin'
  return rol || 'cliente'
})
const esAdmin = computed(() => rolActual.value === 'admin')
const statsConectados = computed(() => connectedUsers.value.filter(u => u.Google_Email).length)

const ICON_CAL  = 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5'
const ICON_BELL = 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0'
const ICON_PAINT= 'M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42'
const ICON_CHECK= 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'

const features = [
  { title: 'Eventos automáticos',  desc: 'Orden, producto, prioridad y operario incluidos', icon: ICON_CAL   },
  { title: 'Recordatorios',        desc: 'Email 48h antes y alerta 24h antes del vencimiento', icon: ICON_BELL  },
  { title: 'Color por prioridad',  desc: 'Alta, media o baja se diferencian visualmente', icon: ICON_PAINT },
  { title: 'Sin duplicados',       desc: 'Usa el Id de orden para actualizar sin repetir eventos', icon: ICON_CHECK },
]

const PALETTES = [
  { bg: '#dbeafe', color: '#1d4ed8' }, { bg: '#fce7f3', color: '#be185d' },
  { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef9c3', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' }, { bg: '#fee2e2', color: '#991b1b' },
]
function avatarBg(n)    { return PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length].bg }
function avatarColor(n) { return PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length].color }
function iniciales(n)   { return (n || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() }

function notify(text, type = 'success') {
  message.value     = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 2800)
}

async function cargarEstado() {
  loading.value = true
  try {
    status.value = await getGoogleCalendarStatus()
    if (status.value.connected) await cargarEventos()
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function iniciarVinculacion() {
  working.value = true
  try {
    const data = await getGoogleAuthUrl('link')
    window.location.href = data.url
  } catch (e) {
    notify(e.message, 'error')
    working.value = false
  }
}

async function desvincular() {
  if (!confirm('¿Deseas desvincular Google Calendar de tu cuenta?')) return
  working.value = true
  try {
    await unlinkGoogleCalendar()
    status.value = { connected: false, profile: null }
    events.value = []
    notify('Cuenta de Google desvinculada correctamente.')
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    working.value = false
  }
}

async function sincronizar() {
  working.value = true
  syncResult.value = ''
  try {
    const result = await syncGoogleDeliveryEvents()
    syncCount.value  = result.total || 0
    syncResult.value = `${result.total} eventos creados o actualizados en Google Calendar.`
    notify(result.mensaje)
    await cargarEstado()
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    working.value = false
  }
}

async function cargarEventos() {
  if (!status.value.connected) return
  try {
    const data = await getGoogleUpcomingEvents()
    events.value = data.events || []
  } catch (e) {
    notify(e.message, 'error')
  }
}

async function cargarUsuariosGoogle() {
  if (!esAdmin.value) return
  try {
    const data = await getGoogleConnectedUsers()
    connectedUsers.value = data.users || []
  } catch (e) {
    notify(e.message, 'error')
  }
}

function formatDate(value) {
  if (!value) return 'Sin sincronizar'
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}
function formatEventDate(start) {
  const value = start?.dateTime || start?.date
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-CO', { month: 'short', day: '2-digit' })
}

onMounted(async () => {
  await cargarEstado()
  await cargarUsuariosGoogle()
  setTimeout(() => { animVisible.value = true }, 50)
})
</script>

<style scoped>
/* ── LAYOUT ── */
.layout { display: flex; min-height: 100vh; background: #f1f5f9; position: relative; overflow: hidden; }
.main { flex: 1; padding: 28px 30px; position: relative; z-index: 1; }

/* ── FONDO ── */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: #16a34a; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #2563eb; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(31,58,82,.04) 1px,transparent 1px); background-size: 40px 40px; }

/* ── HERO ── */
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity .5s ease, transform .5s ease; }
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }
.hero-left { display: flex; align-items: center; gap: 16px; }
.hero-text { display: flex; flex-direction: column; }
.hero-icon-wrap { position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: #1f3a52; border-radius: 14px; flex-shrink: 0; }
.hero-icon { width: 26px; height: 26px; color: white; }
.hero-icon-ring { position: absolute; border-radius: 50%; border: 1.5px solid #1f3a52; opacity: 0; animation: iconPulse 3s ease-out infinite; }
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 86px; height: 86px; animation-delay: .8s; }
@keyframes iconPulse { 0% { transform: scale(.7); opacity: .5; } 100% { transform: scale(1.4); opacity: 0; } }
.hero-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; opacity: 0; transform: translateY(12px); animation: charReveal .4s ease forwards; }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
.hero-actions-wrap { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.btn { display: flex; align-items: center; gap: 8px; background: #1f3a52; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background .2s, transform .1s; }
.btn:hover:not(:disabled) { background: #162b3c; transform: translateY(-1px); }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; }
.spin { animation: spinIcon .8s linear infinite; }
@keyframes spinIcon { to { transform: rotate(360deg); } }

/* ── STATS ── */
.stats { display: flex; gap: 18px; margin-bottom: 24px; }
.stat-card { background: white; flex: 1; padding: 20px 20px 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity .45s ease, transform .45s ease, box-shadow .2s; }
.stats-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.09); transform: translateY(-3px) !important; }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: .07; }
.stat-icon-bg svg { width: 52px; height: 52px; }
.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px; }
.stat-card p { font-size: 30px; font-weight: 800; margin: 0; line-height: 1; }

/* ── GRID ── */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* ── TABLE BOX ── */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity .45s ease, transform .45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }

/* ── ESTADO VINCULACIÓN ── */
.connected-box { display: flex; gap: 14px; align-items: center; padding: 14px 16px; border-radius: 10px; background: #f9fafb; border: 1px solid #e5e7eb; }
.g-avatar { width: 42px; height: 42px; border-radius: 10px; background: #1f3a52; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.g-avatar svg { width: 22px; height: 22px; color: white; }
.conn-info { display: flex; flex-direction: column; gap: 3px; }
.conn-name { font-size: 14px; font-weight: 600; color: #111827; }
.conn-meta { font-size: 12px; color: #6b7280; }
.empty-box { padding: 18px; border-radius: 10px; background: #f9fafb; border: 1px dashed #d1d5db; text-align: center; color: #6b7280; font-size: 14px; }
.actions-row { display: flex; gap: 10px; flex-wrap: wrap; }
.action-btn-full { display: flex; align-items: center; gap: 8px; background: #1f3a52; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .2s, transform .1s; }
.action-btn-full:hover:not(:disabled) { background: #162b3c; transform: translateY(-1px); }
.action-btn-full:disabled { opacity: .5; cursor: not-allowed; }
.action-btn-danger { display: flex; align-items: center; gap: 8px; background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .2s; }
.action-btn-danger:hover:not(:disabled) { background: #fecaca; }
.action-btn-danger:disabled { opacity: .5; cursor: not-allowed; }
.result-box { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: #dcfce7; border: 1px solid #bbf7d0; margin-top: 12px; }
.result-box svg { width: 16px; height: 16px; color: #15803d; flex-shrink: 0; }
.result-box span { font-size: 13px; font-weight: 600; color: #15803d; }

/* ── FEATURES ── */
.feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.feature-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.feature-icon { width: 32px; height: 32px; border-radius: 8px; background: #1f3a52; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
.feature-icon svg { width: 16px; height: 16px; color: white; }
.feature-title { font-size: 13px; font-weight: 700; color: #111827; }
.feature-desc { font-size: 12px; color: #6b7280; line-height: 1.4; }

/* ── EVENTOS ── */
.event-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
.event-row { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; background: #f9fafb; border: 1px solid #e5e7eb; text-decoration: none; color: inherit; transition: border-color .15s, background .15s; }
.event-row:hover { border-color: #1f3a52; background: #f0f4f8; }
.event-date-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; }
.event-title-txt { font-size: 13px; font-weight: 500; color: #111827; flex: 1; }
.event-arrow { color: #9ca3af; flex-shrink: 0; }
.event-arrow svg { width: 14px; height: 14px; }

/* ── USUARIOS ── */
.user-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
.user-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; background: #f9fafb; border: 1px solid #e5e7eb; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.user-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.user-name { font-size: 13px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-meta { font-size: 11px; color: #6b7280; }

/* ── BADGES ── */
.badge-rendimiento { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-rendimiento.alto { background: #dcfce7; color: #15803d; }
.badge-rendimiento.bajo { background: #fee2e2; color: #b91c1c; }

/* ── BOTÓN GHOST ── */
.btn-ghost-sm { display: flex; align-items: center; gap: 6px; background: transparent; color: #1f3a52; border: 1.5px solid #e5e7eb; padding: 7px 12px; border-radius: 9px; font-size: 12px; font-weight: 600; cursor: pointer; transition: border-color .2s, background .2s; }
.btn-ghost-sm:hover:not(:disabled) { border-color: #1f3a52; background: #f0f4f8; }
.btn-ghost-sm:disabled { opacity: .5; cursor: not-allowed; }

/* ── UTILS ── */
.cargando-detalle { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px; color: #6b7280; }
.spinner { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spinIcon .7s linear infinite; }
.empty-state { text-align: center; padding: 40px 20px; color: #9ca3af; }
.empty-state svg { margin: 0 auto 12px; display: block; opacity: .4; }
.empty-state p { font-size: 14px; margin: 0; }

/* ── TOAST ── */
.toast { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; color: white; box-shadow: 0 4px 20px rgba(0,0,0,.15); }
.toast.success { background: #16a34a; }
.toast.danger  { background: #dc2626; }
.toast-enter-active { transition: all .3s ease; }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(12px); }
.toast-leave-to   { opacity: 0; transform: translateY(12px); }

/* ── RESPONSIVE ── */
@media (max-width: 960px) {
  .grid-2 { grid-template-columns: 1fr; }
  .stats { flex-wrap: wrap; }
  .stat-card { min-width: calc(50% - 9px); }
}
</style>