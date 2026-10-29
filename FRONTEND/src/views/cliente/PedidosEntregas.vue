<template>
  <div style="display:flex;min-height:100vh;background:#f1f5f9;position:relative">

    <!-- FONDO DECORATIVO -->
    <div class="bg-orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>

    <main class="main">

      <PageHeader
        titulo="Pedidos y Entregas"
        subtitulo="Seguimiento en tiempo real de tus órdenes"
        icono="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      >
        <template #acciones>
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input v-model="busqueda" type="search" placeholder="Buscar por producto o número"
              aria-label="Buscar órdenes por producto o número"
              @focus="searchFocus = true" @blur="searchFocus = false">
          </div>
        </template>
      </PageHeader>

      <!-- KPIs: cada tarjeta filtra por estado -->
      <div class="kpi-grid" role="group" aria-label="Filtrar órdenes por estado">
        <KpiCard
          v-for="(k, i) in kpis"
          :key="k.label"
          v-bind="k"
          :activo="filtroEstado === k.filtro"
          :cargando="cargando"
          :indice="i"
          @click="filtroEstado = k.filtro"
        />
      </div>

      <!-- ESTADOS -->
      <div v-if="!auth.idUsuario" class="empty-state-box">Inicia sesión para ver tus pedidos.</div>
      <div v-else-if="cargando" class="orders-skeleton">
        <SkeletonCard v-for="i in 4" :key="i" variante="contenido" :lineas="3" />
      </div>
      <EmptyState
        v-else-if="errorMsg"
        icono="error"
        titulo="No pudimos cargar tus órdenes"
        descripcion="Revisa tu conexión e inténtalo de nuevo."
        class="empty-card"
      >
        <button type="button" class="tx-btn tx-btn--secondary" @click="cargarOrdenes">Reintentar</button>
      </EmptyState>

      <!-- LISTA DE ÓRDENES -->
      <div v-else class="orders-container">
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
              :style="{ '--row-i': Math.min(idx, 10) }"
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
                     :class="[o.estadoClass.replace('stripe-', 'fill-'), { 'fill-in': mounted }]"
                     :style="{ width: o.progreso + '%' }"
                    >
                 </div>
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

                <!-- BOTÓN DESCARGAR PDF -->
                <button
                  class="btn-pdf"
                  :class="{ 'btn-pdf-disabled': o.estado !== 'Completada' }"
                  :disabled="o.estado !== 'Completada' || descargando[o.id]"
                  :title="o.estado !== 'Completada' ? 'Disponible cuando la orden esté completada' : 'Descargar comprobante en PDF'"
                  @click="descargarPDF(o)"
                >
                  <svg v-if="!descargando[o.id]" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                  </svg>
                  <span v-else class="btn-pdf-spinner"></span>
                  {{ descargando[o.id] ? 'Generando...' : 'Descargar PDF' }}
                </button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import SkeletonCard from '../../components/base/SkeletonCard.vue'
import { ref, computed, onMounted } from 'vue'
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
const descargando  = ref({})

const ICON_ALL   = 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
const ICON_PROC  = 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_CHECK = 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_ALERT = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'

const kpis = computed(() => [
  { label: 'Total órdenes', valor: pedidos.value.length,                                        icono: ICON_ALL,   tono: 'brand',   filtro: '' },
  { label: 'En proceso',    valor: pedidos.value.filter(p => p.estado === 'En Proceso').length, icono: ICON_PROC,  tono: 'info',    filtro: 'En Proceso' },
  { label: 'Completadas',   valor: pedidos.value.filter(p => p.estado === 'Completada').length, icono: ICON_CHECK, tono: 'success', filtro: 'Completada' },
  { label: 'Retrasadas',    valor: pedidos.value.filter(p => p.estado === 'Retrasada').length,  icono: ICON_ALERT, tono: 'danger',  filtro: 'Retrasada' },
])

function toggleFiltro(valor) {
  filtroEstado.value = filtroEstado.value === valor ? '' : valor
}

async function cargarOrdenes() {
  if (!auth.idUsuario) return
  cargando.value = true; errorMsg.value = ''
  try {
    const res = await fetch(`${BASE}/ordenes/cliente/${auth.idUsuario}`, { headers: auth.authHeader() })
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
    // Las barras de progreso entran con scaleX una vez pintadas las tarjetas
    mounted.value = false
    requestAnimationFrame(() => requestAnimationFrame(() => { mounted.value = true }))
  }
}

onMounted(cargarOrdenes)

async function ensureJsPdf() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF

  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })

  return window.jspdf?.jsPDF
}

async function descargarPDF(o) {
  if (o.estado !== 'Completada' || descargando.value[o.id]) return
  descargando.value = { ...descargando.value, [o.id]: true }
  try {
    const jsPDF = await ensureJsPdf()
    if (!jsPDF) throw new Error('No se pudo cargar el generador PDF')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const rows = [
      ['Orden', `#${o.id}`],
      ['Producto', o.nombre],
      ['Estado', o.estado],
      ['Prioridad', o.prioridad],
      ['Material', o.material],
      ['Cantidad', o.cantidad],
      ['Unidades realizadas', o.realizadas],
      ['Fecha de entrega', o.fechaEntrega],
    ]

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('TEXTICODE', 20, 22)
    doc.setFontSize(14)
    doc.text('Comprobante de entrega', 20, 34)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Documento generado desde el portal del cliente.', 20, 42)

    let y = 56
    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(`${label}:`, 20, y)
      doc.setFont('helvetica', 'normal')
      doc.text(String(value ?? '-'), 70, y)
      y += 9
    })

    if (o.descripcion) {
      doc.setFont('helvetica', 'bold')
      doc.text('Descripcion:', 20, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.text(doc.splitTextToSize(o.descripcion, 165), 20, y + 12)
    }

    doc.save(`orden-${o.id}.pdf`)
  } catch (e) {
    errorMsg.value = `No se pudo generar el PDF: ${e.message}`
  } finally {
    descargando.value = { ...descargando.value, [o.id]: false }
  }
}

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

/* .main ya NO limita su propio scroll: la página completa se desplaza con el scroll del navegador */
.main { flex: 1; padding: 28px 30px; position: relative; z-index: 1; }

/* ── HERO HEADER ── */
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }

/* ── STATS (ahora son botones filtro) ── */

/* ── BARRA DE BÚSQUEDA (arriba de las cards de órdenes) ── */
.search-box { display: flex; align-items: center; gap: 8px; height: var(--control-height); padding: 0 12px; background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); transition: border-color var(--duration-fast), box-shadow var(--duration-fast); width: 240px; }
.search-box.search-focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.search-ico { width: 16px; height: 16px; color: var(--color-text-muted); flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: transparent; }
.search-box input::placeholder { color: var(--color-text-muted); }

/* ── CONTENEDOR ORDENES ── */
.orders-container { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-xs); overflow: hidden; animation: tableIn var(--duration-slow) var(--ease-out) 120ms both; }
@keyframes tableIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── ORDER CARDS ── */
/* Dos columnas en escritorio: menos scroll con muchas órdenes */
.orders-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: var(--space-3); padding: var(--space-4); align-items: start; }
.orders-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: var(--space-3); }
.order-card { display: flex; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; animation: cardIn var(--duration-base) var(--ease-out) both; animation-delay: calc(var(--row-i, 0) * 40ms); transition: background 0.15s, box-shadow 0.2s; }
.order-card:hover { background: #f9fafb; box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
@keyframes cardIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.order-stripe { width: 5px; flex-shrink: 0; }
.stripe-blue  { background: #2563eb; }
.stripe-green { background: #16a34a; }
.stripe-red   { background: #dc2626; }
.order-body { flex: 1; padding: 22px 24px; }
.order-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.order-num-pill { font-size: 13px; font-weight: 700; color: #1f3a52; background: #f1f5f9; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; transition: background 0.15s, color 0.15s; }
.order-card:hover .order-num-pill { background: #e0ecff; color: #1d4ed8; }
.badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.badge-process { background: #dbeafe; color: #1d4ed8; }
.badge-done    { background: #dcfce7; color: #15803d; }
.badge-delayed { background: #fee2e2; color: #b91c1c; }
.prio.prio-alta  { background: #fee2e2; color: #b91c1c; }
.prio.prio-media { background: #fef3c7; color: #92400e; }
.prio.prio-baja  { background: #f3f4f6; color: #4b5563; }
.order-title { font-size: 17px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.order-desc  { font-size: 14px; color: #6b7280; margin-bottom: 18px; }
.order-meta  { display: grid; grid-template-columns: repeat(4, auto); gap: 4px 32px; margin-bottom: 20px; }
.meta-label  { font-size: 12px; color: var(--color-text-muted); display: block; margin-bottom: 2px; }
.meta-value  { font-size: 14px; font-weight: 600; color: #111827; }
.fecha-ok    { color: #15803d; }
.prendas-val { display: inline-flex; align-items: baseline; gap: 4px; font-size: 18px; font-weight: 800; color: #1d4ed8; }
.prendas-val.prendas-completas { color: #15803d; }
.prendas-total { font-size: 14px; font-weight: 500; color: var(--color-text-muted); }

/* ── PROGRESS ── */
.progress-section { margin-bottom: 16px; }
.progress-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
.progress-label { font-size: 13px; color: #6b7280; font-weight: 500; }
.progress-detail { font-size: 13px; color: #374151; }
.progress-pct { font-weight: 700; color: #374151; }
.pct-completo { color: #15803d; }
.progress-bg { width: 100%; height: 10px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
/* Ancho real + entrada con scaleX (solo transform) */
.progress-fill { height: 100%; background: #1f3a52; border-radius: 999px; transform: scaleX(0); transform-origin: left; transition: transform var(--duration-slower) var(--ease-out); transition-delay: calc(var(--row-i, 0) * 50ms + 120ms); }
.progress-fill.fill-in { transform: scaleX(1); }
.progress-fill.fill-blue  { background: #2563eb; }
.progress-fill.fill-green { background: #16a34a; }
.progress-fill.fill-red   { background: #dc2626; }
.progress-milestones { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: var(--color-text-muted); }

/* ESTADO BANNERS */
.estado-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-top: 4px; }
.estado-banner.completada { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.estado-banner.proceso    { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.estado-banner.retrasada  { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

/* ── BOTÓN DESCARGAR PDF ── */
.btn-pdf {
  display: inline-flex; align-items: center; gap: 8px;
  margin-top: 12px; padding: 9px 16px;
  background: #1f3a52; color: white; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
}
.btn-pdf:hover:not(:disabled) { background: #16283a; box-shadow: 0 4px 12px rgba(31,58,82,0.25); transform: translateY(-1px); }
.btn-pdf:active:not(:disabled) { transform: translateY(0); }
.btn-pdf-disabled, .btn-pdf:disabled {
  background: #e5e7eb; color: #9ca3af; cursor: not-allowed;
  box-shadow: none; transform: none;
}
.btn-pdf-spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
}

/* ── ESTADOS VACIOS / CARGA ── */
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 24px; color: var(--color-text-muted); font-size: 14px; }
.empty-state-box { background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 40px; text-align: center; color: #6b7280; font-size: 14px; position: relative; z-index: 1; }

/* ── TRANSITIONS ── */
.row-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.row-leave-active { transition: opacity var(--duration-fast) var(--ease-in); animation: none; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 1100px) { .stats-grid { display: grid; grid-template-columns: repeat(2,1fr); } }
@media (max-width: 800px)  { .main { padding: 20px 16px; } .order-meta { grid-template-columns: 1fr 1fr; } .search-box { width: 100%; } }
</style>
