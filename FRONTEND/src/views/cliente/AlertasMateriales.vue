<template>
  <div style="display:flex;min-height:100vh;background:#f1f5f9;position:relative;overflow:hidden">
    <AppSidebar rol="cliente" />

    <div class="bg-orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>

    <main class="main">

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': mounted }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Alertas de Materiales'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: mounted ? `${i * 30}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Estado de tus materiales asignados</p>
          </div>
        </div>
        <button class="btn-refresh" @click="cargar" :disabled="loading" title="Actualizar">
          <svg class="btn-icon" :class="{ spin: loading }" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
          Actualizar
        </button>
      </div>

      <!-- CARGANDO -->
      <div v-if="loading" class="loading-wrap">
        <div class="spinner"></div>
        <p>Cargando materiales...</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="error-banner">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
        </svg>
        {{ error }}
        <button class="btn-retry" @click="cargar">Reintentar</button>
      </div>

      <template v-else>

        <!-- STAT CARDS -->
        <div class="stats-grid" :class="{ 'stats-visible': mounted }">
          <div
            v-for="(s, i) in statsCards"
            :key="s.label"
            class="stat-card"
            :style="{ transitionDelay: mounted ? `${i * 80}ms` : '0ms' }"
          >
            <div class="stat-accent" :style="{ background: s.accent }"></div>
            <div class="stat-icon-bg" :style="{ color: s.accent }">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon"/>
              </svg>
            </div>
            <h3>{{ s.label }}</h3>
            <p :style="{ color: s.accent }">{{ s.display }}</p>
          </div>
        </div>

        <!-- BANNER DE ALERTAS (solo si hay alertas) -->
        <Transition name="slide-down">
          <div v-if="totalAlertas > 0" class="alert-box" :class="{ 'box-visible': mounted }" style="transition-delay:120ms">
            <div class="alert-box-header">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="alert-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
              </svg>
              Alertas de Inventario
              <span class="alert-count">{{ totalAlertas }}</span>
            </div>
            <TransitionGroup name="row" tag="div" class="alert-list">
              <div v-for="m in alertas" :key="m.Id_Material" class="alert-row">
                <div class="alert-row-left">
                  <span class="alert-dot" :class="estadoClass(m)"></span>
                  <div class="alert-info">
                    <span class="alert-name">{{ m.Nombre_Material }}</span>
                    <span class="alert-cat">{{ m.Categoria }}</span>
                  </div>
                </div>
                <div class="alert-row-right">
                  <span class="alert-stock">{{ m.Stock_Actual }} {{ m.Unidad }}</span>
                  <span class="badge" :class="estadoClass(m)">{{ estadoLabel(m) }}</span>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </Transition>

        <!-- TODOS TUS MATERIALES -->
        <section class="table-box" :class="{ 'box-visible': mounted }" style="transition-delay:220ms">
          <div class="table-header-bar">
            <div class="table-header-left">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
              </svg>
              Todos tus materiales
              <span class="count-badge">{{ materiales.length }}</span>
            </div>
          </div>

          <div v-if="materiales.length === 0" class="empty-state">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" width="40" height="40">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
            </svg>
            <p>No tienes materiales registrados.</p>
          </div>

          <div v-else class="material-list">
            <TransitionGroup name="row">
              <div
                v-for="(m, idx) in materiales"
                :key="m.Id_Material"
                class="material-card"
                :class="estadoClass(m)"
                :style="{ animationDelay: `${idx * 45}ms` }"
              >
                <div class="mc-top">
                  <div class="mc-icon" :class="estadoClass(m)">
                    <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
                    </svg>
                  </div>
                  <div class="mc-title">
                    <span class="mc-name">{{ m.Nombre_Material }}</span>
                    <span class="mc-cat">{{ m.Categoria }}</span>
                  </div>
                  <span class="badge" :class="estadoClass(m)">{{ estadoLabel(m) }}</span>
                </div>

                <div class="mc-bar-wrap">
                  <div class="mc-bar">
                    <div class="mc-bar-fill" :class="estadoClass(m)" :style="{ width: (barWidths[m.Id_Material] ?? 0) + '%' }"></div>
                  </div>
                </div>

                <div class="mc-bottom">
                  <span>{{ m.Stock_Actual }} {{ m.Unidad }} disponibles</span>
                  <span class="mc-minmax">Mín {{ m.Stock_Minimo }} / Máx {{ m.Stock_Maximo }}</span>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </section>

      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore } from '../../stores/auth'
import { getMaterialesPorCliente } from '../../services/api'

const auth    = useAuthStore()
const mounted = ref(false)
const loading = ref(true)
const error   = ref(null)
const materiales = ref([])
const barWidths   = ref({})

async function cargar() {
  loading.value = true
  error.value   = null
  try {
    if (!auth.idUsuario) { materiales.value = []; return }
    const data = await getMaterialesPorCliente(auth.idUsuario)
    materiales.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e.message || 'No se pudieron cargar tus materiales.'
    materiales.value = []
  } finally {
    loading.value = false
    animarBarras()
  }
}

function animarBarras() {
  const init = {}
  materiales.value.forEach(m => { init[m.Id_Material] = 0 })
  barWidths.value = init
  requestAnimationFrame(() => requestAnimationFrame(() => {
    materiales.value.forEach((m, i) => {
      setTimeout(() => {
        barWidths.value = { ...barWidths.value, [m.Id_Material]: stockPct(m) * 100 }
      }, i * 60)
    })
  }))
}

// ── Reglas de negocio (idénticas a la versión móvil) ──
function isLow(m)   { return m.Stock_Actual < m.Stock_Minimo }
function stockPct(m) {
  if (!m.Stock_Maximo || m.Stock_Maximo <= 0) return 0
  return Math.min(Math.max(m.Stock_Actual / m.Stock_Maximo, 0), 1)
}

const agotados  = computed(() => materiales.value.filter(m => m.Stock_Actual <= 0))
const stockBajo = computed(() => materiales.value.filter(m => isLow(m) && m.Stock_Actual > 0))
const alertas   = computed(() => [...agotados.value, ...stockBajo.value])
const totalAlertas = computed(() => alertas.value.length)

function estadoClass(m) {
  if (m.Stock_Actual <= 0) return 'danger'
  if (isLow(m)) return 'warning'
  return 'success'
}
function estadoLabel(m) {
  if (m.Stock_Actual <= 0) return 'Agotado'
  if (isLow(m)) return 'Stock Bajo'
  return 'Disponible'
}

const ICON_BOX   = 'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9'
const ICON_ALERT = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
const ICON_DOWN  = 'M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181'

const statsCards = computed(() => [
  { label: 'Total',       display: materiales.value.length, accent: '#1f3a52', icon: ICON_BOX   },
  { label: 'Agotados',    display: agotados.value.length,   accent: '#dc2626', icon: ICON_ALERT  },
  { label: 'Stock bajo',  display: stockBajo.value.length,  accent: '#d97706', icon: ICON_DOWN   },
])

onMounted(async () => {
  await cargar()
  setTimeout(() => { mounted.value = true }, 60)
})
</script>

<style scoped>
/* ── FONDO DECORATIVO ── */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: #dc2626; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #16a34a; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

.main { flex: 1; padding: 28px 30px; overflow-y: auto; position: relative; z-index: 1; }

/* ── HERO ── */
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }
.hero-left { display: flex; align-items: center; gap: 16px; }
.hero-text { display: flex; flex-direction: column; }
.hero-icon-wrap { position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: #dc2626; border-radius: 14px; flex-shrink: 0; }
.hero-icon { width: 26px; height: 26px; color: white; }
.hero-icon-ring { position: absolute; border-radius: 50%; border: 1.5px solid #dc2626; opacity: 0; animation: iconPulse 3s ease-out infinite; }
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 86px; height: 86px; animation-delay: 0.8s; }
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
.hero-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; opacity: 0; transform: translateY(12px); animation: charReveal 0.4s ease forwards; }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
.btn-refresh { display: flex; align-items: center; gap: 8px; background: #1f3a52; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background .2s, transform .1s; }
.btn-refresh:hover:not(:disabled) { background: #162b3c; transform: translateY(-1px); }
.btn-refresh:disabled { opacity: .6; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; }
.spin { animation: spinIcon .8s linear infinite; }
@keyframes spinIcon { to { transform: rotate(360deg); } }

/* ── STATS ── */
.stats-grid { display: flex; gap: 18px; margin-bottom: 24px; }
.stat-card { background: white; flex: 1; padding: 20px 20px 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity .45s ease, transform .45s ease, box-shadow .2s; }
.stats-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-3px) !important; }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: .07; }
.stat-icon-bg svg { width: 52px; height: 52px; }
.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px; }
.stat-card p { font-size: 30px; font-weight: 800; margin: 0; line-height: 1; }

/* ── ALERT BOX ── */
.alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; margin-bottom: 24px; overflow: hidden; opacity: 0; transform: translateY(14px); transition: opacity .45s ease, transform .45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.alert-box-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px; font-size: 14px; font-weight: 700; color: #991b1b; }
.alert-icon { color: #dc2626; flex-shrink: 0; }
.alert-count { background: #dc2626; color: white; font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; }
.alert-list { display: flex; flex-direction: column; padding: 0 20px 16px; gap: 8px; }
.alert-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: white; border: 1px solid #fee2e2; border-radius: 10px; padding: 10px 14px; }
.alert-row-left { display: flex; align-items: center; gap: 10px; }
.alert-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.alert-dot.danger  { background: #dc2626; }
.alert-dot.warning { background: #d97706; }
.alert-info { display: flex; flex-direction: column; }
.alert-name { font-size: 13px; font-weight: 600; color: #111827; }
.alert-cat  { font-size: 11px; color: #9ca3af; }
.alert-row-right { display: flex; align-items: center; gap: 10px; }
.alert-stock { font-size: 12px; color: #6b7280; }

/* ── TABLE BOX ── */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity .45s ease, transform .45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── MATERIAL LIST ── */
.material-list { display: flex; flex-direction: column; gap: 12px; padding: 16px 20px; }
.material-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px; animation: rowSlideIn .35s ease both; transition: box-shadow .2s, transform .2s; }
.material-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.material-card.danger  { border-color: #fecaca; background: #fff8f8; }
.material-card.warning { border-color: #fde68a; background: #fffdf5; }
.material-card.success { border-color: #bbf7d0; background: #f9fffb; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mc-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.mc-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mc-icon.danger  { background: #fee2e2; color: #dc2626; }
.mc-icon.warning { background: #fef3c7; color: #d97706; }
.mc-icon.success { background: #dcfce7; color: #16a34a; }
.mc-title { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.mc-name { font-size: 14px; font-weight: 700; color: #111827; }
.mc-cat  { font-size: 12px; color: #9ca3af; }

.badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.badge.danger  { background: #fee2e2; color: #991b1b; }
.badge.warning { background: #fef3c7; color: #92400e; }
.badge.success { background: #dcfce7; color: #15803d; }

.mc-bar-wrap { margin-bottom: 10px; }
.mc-bar { width: 100%; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.mc-bar-fill { height: 100%; border-radius: 999px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }
.mc-bar-fill.danger  { background: #dc2626; }
.mc-bar-fill.warning { background: #d97706; }
.mc-bar-fill.success { background: #16a34a; }

.mc-bottom { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
.mc-minmax { color: #9ca3af; }

/* ── ESTADOS VACÍOS / CARGA ── */
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 16px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-wrap p { color: #9ca3af; font-size: 14px; }
.error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; color: #991b1b; font-size: 14px; margin-bottom: 20px; }
.btn-retry { margin-left: auto; background: #991b1b; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 13px; cursor: pointer; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 24px; color: #9ca3af; font-size: 14px; }

/* ── TRANSICIONES ── */
.slide-down-enter-active, .slide-down-leave-active { transition: opacity .3s ease, transform .3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
.row-enter-active, .row-leave-active { transition: opacity .3s ease, transform .3s ease; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 800px) {
  .main { padding: 20px 16px; }
  .stats-grid { flex-direction: column; }
  .page-hero { flex-direction: column; align-items: flex-start; }
}
</style>