<template>
  <div style="display:flex;min-height:100vh;background:#f1f5f9;position:relative;overflow:hidden">

    <div class="bg-orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>

    <main class="main">

      <PageHeader
        titulo="Alertas de Materiales"
        subtitulo="Estado de tus materiales asignados"
        icono="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      >
        <template #acciones>
          <button type="button" class="tx-btn tx-btn--secondary" @click="cargar" :disabled="loading">
            <svg width="16" height="16" :class="{ spin: loading }" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            {{ loading ? 'Actualizando…' : 'Actualizar' }}
          </button>
        </template>
      </PageHeader>

      <!-- CARGANDO -->
      <div v-if="loading">
        <div class="kpi-grid">
          <SkeletonCard v-for="i in 3" :key="i" variante="kpi" />
        </div>
        <div class="material-list">
          <SkeletonCard v-for="i in 4" :key="i" variante="contenido" :lineas="2" />
        </div>
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

        <!-- KPIs: filtran la lista -->
        <div class="kpi-grid" role="group" aria-label="Filtrar materiales por estado">
          <KpiCard
            v-for="(k, i) in kpis"
            :key="k.label"
            v-bind="k"
            :activo="filtro === k.filtro"
            :indice="i"
            @click="filtro = k.filtro"
          />
        </div>

        <!-- Aviso compacto (antes: lista completa de alertas antes de la lista de materiales) -->
        <div v-if="totalAlertas > 0" class="alert-banner" role="status">
          <svg class="alert-banner__icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
          <p class="alert-banner__text">
            <strong>{{ totalAlertas }} {{ totalAlertas === 1 ? 'material necesita' : 'materiales necesitan' }} reposición</strong>
            <span>{{ resumenAlertas }}</span>
          </p>
          <button type="button" class="tx-btn tx-btn--secondary tx-btn--sm" @click="filtro = filtro === 'alertas' ? '' : 'alertas'">
            {{ filtro === 'alertas' ? 'Ver todos' : 'Ver solo estos' }}
          </button>
        </div>

        <!-- TODOS TUS MATERIALES -->
        <section class="table-box">
          <div class="table-header-bar">
            <div class="table-header-left">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
              </svg>
              Todos tus materiales
              <span class="count-badge">{{ materialesFiltrados.length }}</span>
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
                v-for="(m, idx) in materialesFiltrados"
                :key="m.Id_Material"
                class="material-card"
                :class="estadoClass(m)"
                :style="{ '--row-i': Math.min(idx, 12) }"
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
                    <div class="mc-bar-fill" :class="[estadoClass(m), { 'fill-in': mounted }]" :style="{ width: stockPct(m) * 100 + '%' }"></div>
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
import { useAuthStore } from '../../stores/auth'
import { getMaterialesPorCliente } from '../../services/api'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import SkeletonCard from '../../components/base/SkeletonCard.vue'

const auth    = useAuthStore()
const mounted = ref(false)
const loading = ref(true)
const error   = ref(null)
const materiales = ref([])
const filtro      = ref('')   // '' | 'agotado' | 'bajo' | 'alertas'

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

// Las barras usan su ancho real y entran con scaleX (solo transform)
function animarBarras() {
  mounted.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => { mounted.value = true }))
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

const kpis = computed(() => [
  { label: 'Total materiales', valor: materiales.value.length, icono: ICON_BOX,   tono: 'brand',   filtro: '' },
  { label: 'Agotados',         valor: agotados.value.length,   icono: ICON_ALERT, tono: 'danger',  filtro: 'agotado' },
  { label: 'Stock bajo',       valor: stockBajo.value.length,  icono: ICON_DOWN,  tono: 'warning', filtro: 'bajo' },
])

const resumenAlertas = computed(() => {
  const nombres = alertas.value.slice(0, 3).map(m => m.Nombre_Material).join(', ')
  const resto = alertas.value.length - 3
  return resto > 0 ? `${nombres} y ${resto} más` : nombres
})

const materialesFiltrados = computed(() => {
  if (filtro.value === 'agotado') return agotados.value
  if (filtro.value === 'bajo')    return stockBajo.value
  if (filtro.value === 'alertas') return alertas.value
  return materiales.value
})

onMounted(cargar)
</script>

<style scoped>
/* ── AVISO DE REPOSICIÓN (compacto) ── */
.alert-banner {
  display: flex; align-items: center; gap: var(--space-3);
  margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4);
  border: 1px solid #fed7aa; border-radius: var(--radius-lg); background: #fff7ed;
}
.alert-banner__icon { flex-shrink: 0; color: #c2410c; }
.alert-banner__text { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: var(--text-base); color: #7c2d12; }
.alert-banner__text span { font-size: var(--text-sm); color: #9a3412; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.spin { animation: spinIcon .8s linear infinite; }
@keyframes spinIcon { to { transform: rotate(360deg); } }

/* ── ALERT BOX ── */

/* ── TABLE BOX ── */
.table-box { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-xs); margin-bottom: var(--space-6); overflow: hidden; animation: tableIn var(--duration-slow) var(--ease-out) 120ms both; }
@keyframes tableIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── MATERIAL LIST ── */
/* Grilla: 2-3 materiales por fila en escritorio */
.material-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-3); padding: var(--space-4); align-items: start; }
.material-card { border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 14px 16px; background: var(--color-surface); animation: rowSlideIn var(--duration-base) var(--ease-out) both; animation-delay: calc(var(--row-i, 0) * 30ms); transition: box-shadow var(--duration-fast), transform var(--duration-fast) var(--ease-out); }
.material-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.material-card.danger  { border-color: #fecaca; background: #fff8f8; }
.material-card.warning { border-color: #fde68a; background: #fffdf5; }
.material-card.success { border-color: #bbf7d0; background: #f9fffb; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mc-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.mc-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mc-icon.danger  { background: #fee2e2; color: #b91c1c; }
.mc-icon.warning { background: #fef3c7; color: #b45309; }
.mc-icon.success { background: #dcfce7; color: #15803d; }
.mc-title { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.mc-name { font-size: 14px; font-weight: 700; color: #111827; }
.mc-cat  { font-size: 12px; color: var(--color-text-muted); }

.badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.badge.danger  { background: #fee2e2; color: #991b1b; }
.badge.warning { background: #fef3c7; color: #92400e; }
.badge.success { background: #dcfce7; color: #15803d; }

.mc-bar-wrap { margin-bottom: 10px; }
.mc-bar { width: 100%; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.mc-bar-fill { height: 100%; border-radius: 999px; transform: scaleX(0); transform-origin: left; transition: transform var(--duration-slower) var(--ease-out); transition-delay: calc(var(--row-i, 0) * 40ms + 100ms); }
.mc-bar-fill.fill-in { transform: scaleX(1); }
.mc-bar-fill.danger  { background: #dc2626; }
.mc-bar-fill.warning { background: #d97706; }
.mc-bar-fill.success { background: #16a34a; }

.mc-bottom { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
.mc-minmax { color: var(--color-text-muted); }

/* ── ESTADOS VACÍOS / CARGA ── */
@keyframes spin { to { transform: rotate(360deg); } }
.error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; color: #991b1b; font-size: 14px; margin-bottom: 20px; }
.btn-retry { margin-left: auto; background: #991b1b; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 13px; cursor: pointer; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 24px; color: var(--color-text-muted); font-size: 14px; }

/* ── TRANSICIONES ── */
.slide-down-enter-active, .slide-down-leave-active { transition: opacity .3s ease, transform .3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
.row-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.row-leave-active { transition: opacity var(--duration-fast) var(--ease-in); animation: none; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 800px) {
  .main { padding: 20px 16px; }
}
</style>