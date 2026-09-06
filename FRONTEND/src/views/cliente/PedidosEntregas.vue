<template>
  <div style="display:flex;min-height:100vh;background:#f1f5f9;position:relative;overflow:hidden">
    <AppSidebar rol="cliente" />

    <!-- FONDO DECORATIVO -->
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
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Pedidos y Entregas'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: mounted ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Seguimiento en tiempo real de tus órdenes</p>
          </div>
        </div>
        <div class="hero-filters-wrap">
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input v-model="busqueda" placeholder="Buscar orden..." @focus="searchFocus = true" @blur="searchFocus = false">
          </div>
          <div class="select-wrapper">
            <select v-model="filtroEstado" class="select">
              <option value="">Todos los estados</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Completada">Completada</option>
              <option value="Retrasada">Retrasada</option>
            </select>
            <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- STATS CARDS -->
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

      <!-- ESTADOS -->
      <div v-if="!auth.idUsuario" class="empty-state-box">Inicia sesión para ver tus pedidos.</div>
      <div v-else-if="cargando" class="loading-wrap">
        <div class="spinner"></div>
        <p>Cargando órdenes...</p>
      </div>
      <div v-else-if="errorMsg" class="error-box">{{ errorMsg }}</div>

      <!-- LISTA DE ÓRDENES -->
      <div v-else class="orders-container" :class="{ 'box-visible': mounted }" style="transition-delay: 280ms">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
            </svg>
            Mis Órdenes
            <span class="count-badge">{{ pedidosFiltrados.length }}</span>
          </div>
        </div>

        <div v-if="pedidosFiltrados.length === 0" class="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" width="40" height="40">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No tienes órdenes registradas aún.</p>
        </div>

        <div class="orders-list">
          <TransitionGroup name="row">
            <div
              v-for="(o, idx) in pedidosFiltrados"
              :key="o.id"
              class="order-card"
              :class="{ 'card-stagger-in': mounted }"
              :style="{ transitionDelay: (idx * 70 + 300) + 'ms' }"
            >
              <div class="order-stripe" :class="o.estadoClass"></div>
              <div class="order-body">
                <div class="order-head">
                  <span class="order-num-pill">#{{ o.id }}</span>
                  <span class="badge" :class="o.badgeClass">{{ o.estado }}</span>
                  <span class="badge prio" :class="o.prioridadClass">{{ o.prioridad }}</span>
                </div>

                <h2 class="order-title">{{ o.nombre }}</h2>
                <p class="order-desc">{{ o.descripcion }}</p>

                <div class="order-meta">
                  <div class="meta-item">
                    <span class="meta-label">Material</span>
                    <span class="meta-value">{{ o.material }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Cantidad pedida</span>
                    <span class="meta-value">{{ o.cantidad }} uds.</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Fecha Límite</span>
                    <span class="meta-value" :class="o.fechaClass">{{ o.fechaEntrega }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Prendas realizadas</span>
                    <span class="meta-value prendas-val" :class="{ 'prendas-completas': o.unidadesRealizadas >= o.cantidad }">
                      {{ o.unidadesRealizadas }}
                      <span class="prendas-total">/ {{ o.cantidad }}</span>
                    </span>
                  </div>
                </div>

                <!-- BARRA PROGRESO -->
                <div class="progress-section">
                  <div class="progress-row">
                    <span class="progress-label">Progreso de fabricación</span>
                    <span class="progress-detail">
                      <strong>{{ o.unidadesRealizadas }}</strong> de <strong>{{ o.cantidad }}</strong>
                      <span class="progress-pct" :class="{ 'pct-completo': o.progreso === 100 }">· {{ o.progreso }}%</span>
                    </span>
                  </div>
                  <div class="progress-bg">
                    <div
                      class="progress-fill"
                      :class="{
                        'fill-green':   o.progreso === 100,
                        'fill-orange':  o.progreso > 0 && o.progreso < 100
                      }"
                      :style="{ width: barWidths[o.id] + '%' }"
                    ></div>
                  </div>
                  <div class="progress-milestones">
                    <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                  </div>
                </div>

                <!-- BANNER ESTADO -->
                <div v-if="o.estado === 'Completada'" class="estado-banner completada">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Orden completada — todas las prendas han sido fabricadas
                </div>
                <div v-else-if="o.estado === 'En Proceso'" class="estado-banner proceso">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  En producción — faltan {{ o.cantidad - o.unidadesRealizadas }} prenda(s) por fabricar
                </div>
                <div v-else-if="o.estado === 'Retrasada'" class="estado-banner retrasada">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                  Orden con entrega retrasada — producción en seguimiento prioritario
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore } from '../../stores/auth'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const auth         = useAuthStore()
const busqueda     = ref('')
const filtroEstado = ref('')
const pedidos      = ref([])
const cargando     = ref(false)
const errorMsg     = ref('')
const mounted      = ref(false)
const searchFocus  = ref(false)
const barWidths    = ref({})

// Contadores animados
const displayTotal     = ref(0)
const displayProceso   = ref(0)
const displayComp      = ref(0)
const displayRetrasadas = ref(0)

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

const ICON_ALL   = 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
const ICON_PROC  = 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_CHECK = 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_ALERT = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'

const statsCards = computed(() => [
  { label: 'Total Órdenes', display: displayTotal.value,      accent: '#1f3a52', icon: ICON_ALL   },
  { label: 'En Proceso',    display: displayProceso.value,    accent: '#2563eb', icon: ICON_PROC  },
  { label: 'Completadas',   display: displayComp.value,       accent: '#16a34a', icon: ICON_CHECK },
  { label: 'Retrasadas',    display: displayRetrasadas.value, accent: '#dc2626', icon: ICON_ALERT },
])

async function cargarOrdenes() {
  if (!auth.idUsuario) return
  cargando.value = true; errorMsg.value = ''
  try {
    const res = await fetch(`${BASE}/ordenes/cliente/${auth.idUsuario}`)
    if (!res.ok) throw new Error(`Error ${res.status}`)
    const data = await res.json()

    pedidos.value = data.map(o => {
      const realizadas = o.Unidades_Realizadas ?? 0
      const cantidad   = o.Cantidad ?? 0
      let progreso = 0
      if (o.Estado === 'Completada') progreso = 100
      else if (cantidad > 0 && realizadas > 0) progreso = Math.min(100, Math.round((realizadas / cantidad) * 100))

      return {
        id: o.Id_Orden,
        nombre:            o.Producto    || o.Descripcion || 'Sin nombre',
        descripcion:       o.Descripcion || '',
        cantidad, realizadas,
        material:          o.NombreMaterial || '—',
        unidadesRealizadas: realizadas,
        progreso,
        fechaEntrega:      o.Fecha_Limite
          ? new Date(o.Fecha_Limite).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
          : '—',
        estado:            o.Estado,
        prioridad:         o.Prioridad || 'Media',
        badgeClass:    { 'En Proceso': 'badge-process', 'Completada': 'badge-done', 'Retrasada': 'badge-delayed' }[o.Estado] || 'badge-delayed',
        estadoClass:   { 'En Proceso': 'stripe-blue', 'Completada': 'stripe-green', 'Retrasada': 'stripe-red' }[o.Estado] || 'stripe-red',
        prioridadClass: { 'Alta': 'prio-alta', 'Media': 'prio-media', 'Baja': 'prio-baja' }[o.Prioridad] || 'prio-baja',
        fechaClass: o.Estado === 'Completada' ? 'fecha-ok' : '',
      }
    })
  } catch (e) {
    errorMsg.value = `No se pudieron cargar las órdenes: ${e.message}`
  } finally {
    cargando.value = false
    const bw = {}
    pedidos.value.forEach(p => { bw[p.id] = 0 })
    barWidths.value = bw
    requestAnimationFrame(() => requestAnimationFrame(() => {
      mounted.value = true
      animateCount(displayTotal,    pedidos.value.length)
      animateCount(displayProceso,  pedidos.value.filter(p => p.estado === 'En Proceso').length)
      animateCount(displayComp,     pedidos.value.filter(p => p.estado === 'Completada').length)
      animateCount(displayRetrasadas, pedidos.value.filter(p => p.estado === 'Retrasada').length)
      pedidos.value.forEach((p, i) => setTimeout(() => { barWidths.value[p.id] = p.progreso }, i * 70))
    }))
  }
}

onMounted(cargarOrdenes)

const pedidosFiltrados = computed(() =>
  pedidos.value.filter(p => {
    const q = busqueda.value.toLowerCase()
    return (p.nombre.toLowerCase().includes(q) || String(p.id).includes(q)) &&
           (!filtroEstado.value || p.estado === filtroEstado.value)
  })
)
</script>

<style scoped>
/* ── FONDO DECORATIVO ── */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: #2563eb; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #16a34a; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

.main { flex: 1; padding: 28px 30px; overflow-y: auto; position: relative; z-index: 1; }

/* ── HERO HEADER ── */
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }
.hero-left { display: flex; align-items: center; gap: 16px; }
.hero-text { display: flex; flex-direction: column; }
.hero-icon-wrap { position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: #1f3a52; border-radius: 14px; flex-shrink: 0; }
.hero-icon { width: 26px; height: 26px; color: white; }
.hero-icon-ring { position: absolute; border-radius: 50%; border: 1.5px solid #1f3a52; opacity: 0; animation: iconPulse 3s ease-out infinite; }
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 86px; height: 86px; animation-delay: 0.8s; }
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
.hero-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; opacity: 0; transform: translateY(12px); animation: charReveal 0.4s ease forwards; }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0 0; }
.hero-filters-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
.search-box { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: white; border: 1.5px solid #e5e7eb; border-radius: 10px; transition: border-color 0.2s, box-shadow 0.2s; width: 220px; }
.search-box.search-focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.search-ico { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font-size: 14px; color: #374151; background: transparent; }
.search-box input::placeholder { color: #9ca3af; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.select { padding: 9px 32px 9px 12px; border-radius: 10px; border: 1.5px solid #e5e7eb; font-size: 14px; background: white; appearance: none; -webkit-appearance: none; outline: none; cursor: pointer; transition: border-color 0.2s; }
.select:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: #6b7280; pointer-events: none; }

/* ── STATS ── */
.stats-grid { display: flex; gap: 18px; margin-bottom: 28px; }
.stat-card { background: white; flex: 1; padding: 20px 20px 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s; }
.stats-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-3px) !important; }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: 0.07; }
.stat-icon-bg svg { width: 52px; height: 52px; }
.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px 0; }
.stat-card p { font-size: 30px; font-weight: 800; margin: 0; line-height: 1; }

/* ── CONTENEDOR ORDENES ── */
.orders-container { background: white; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── ORDER CARDS ── */
.orders-list { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.order-card { display: flex; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease, background 0.15s, box-shadow 0.2s; }
.order-card:hover { background: #f9fafb; box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
.order-card.card-stagger-in { opacity: 1; transform: translateY(0); }
.order-stripe { width: 5px; flex-shrink: 0; }
.stripe-blue  { background: #2563eb; }
.stripe-green { background: #16a34a; }
.stripe-red   { background: #dc2626; }
.order-body { flex: 1; padding: 22px 24px; }
.order-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.order-num-pill { font-size: 13px; font-weight: 700; color: #1f3a52; background: #f1f5f9; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; transition: background 0.15s, color 0.15s; }
.order-card:hover .order-num-pill { background: #e0ecff; color: #2563eb; }
.badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.badge-process { background: #dbeafe; color: #1d4ed8; }
.badge-done    { background: #dcfce7; color: #15803d; }
.badge-delayed { background: #fee2e2; color: #b91c1c; }
.prio.prio-alta  { background: #fee2e2; color: #b91c1c; }
.prio.prio-media { background: #fef3c7; color: #92400e; }
.prio.prio-baja  { background: #f3f4f6; color: #6b7280; }
.order-title { font-size: 17px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.order-desc  { font-size: 14px; color: #6b7280; margin-bottom: 18px; }
.order-meta  { display: grid; grid-template-columns: repeat(4, auto); gap: 4px 32px; margin-bottom: 20px; }
.meta-label  { font-size: 12px; color: #9ca3af; display: block; margin-bottom: 2px; }
.meta-value  { font-size: 14px; font-weight: 600; color: #111827; }
.fecha-ok    { color: #15803d; }
.prendas-val { display: inline-flex; align-items: baseline; gap: 4px; font-size: 18px; font-weight: 800; color: #1d4ed8; }
.prendas-val.prendas-completas { color: #15803d; }
.prendas-total { font-size: 14px; font-weight: 500; color: #9ca3af; }

/* ── PROGRESS ── */
.progress-section { margin-bottom: 16px; }
.progress-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
.progress-label { font-size: 13px; color: #6b7280; font-weight: 500; }
.progress-detail { font-size: 13px; color: #374151; }
.progress-pct { font-weight: 700; color: #374151; }
.pct-completo { color: #15803d; }
.progress-bg { width: 100%; height: 10px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: #1f3a52; border-radius: 999px; transition: width 1.1s cubic-bezier(0.4,0,0.2,1); }
.progress-fill.fill-green  { background: linear-gradient(90deg, #15803d, #4ade80); }
.progress-fill.fill-orange { background: linear-gradient(90deg, #1d4ed8, #60a5fa); }
.progress-milestones { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: #d1d5db; }

/* ESTADO BANNERS */
.estado-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-top: 4px; }
.estado-banner.completada { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.estado-banner.proceso    { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.estado-banner.retrasada  { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

/* ── ESTADOS VACIOS / CARGA ── */
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 16px; color: #9ca3af; font-size: 14px; position: relative; z-index: 1; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 24px; color: #9ca3af; font-size: 14px; }
.empty-state-box { background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 40px; text-align: center; color: #6b7280; font-size: 14px; position: relative; z-index: 1; }
.error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px 20px; color: #991b1b; font-size: 14px; position: relative; z-index: 1; }

/* ── TRANSITIONS ── */
.row-enter-active, .row-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 1100px) { .stats-grid { display: grid; grid-template-columns: repeat(2,1fr); } }
@media (max-width: 800px)  { .main { padding: 20px 16px; } .order-meta { grid-template-columns: 1fr 1fr; } .page-hero { flex-direction: column; align-items: flex-start; } .hero-filters-wrap { width: 100%; } .search-box { flex: 1; width: auto; } }
</style>