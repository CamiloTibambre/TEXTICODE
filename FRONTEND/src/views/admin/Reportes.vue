<template>
  <div class="layout">
    <AppSidebar rol="admin" />
    <main class="content">

      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': animVisible }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span v-for="(ch, i) in 'Reportes'" :key="i"
                class="title-char" :style="{ animationDelay: animVisible ? `${i * 35}ms` : '9999s' }">{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Análisis y exportación de datos de la operación</p>
          </div>
        </div>

      </div>

      <!-- STATS CARDS -->
      <div class="cards" :class="{ 'cards-visible': animVisible }">
        <div v-for="(s, i) in statCards" :key="i" class="stat-card" :style="{ transitionDelay: animVisible ? `${i * 80}ms` : '0ms' }">
          <div class="stat-accent" :style="{ background: s.accent }"></div>
          <div class="stat-icon-bg" :style="{ color: s.accent }">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon"/>
            </svg>
          </div>
          <h3>{{ s.label }}</h3>
          <p :style="{ color: s.accent }">{{ s.display }}</p>
          <div class="stat-change" :style="{ color: s.changeColor }">
            <svg v-if="s.changeIcon" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="change-icon">
              <path stroke-linecap="round" stroke-linejoin="round" :d="s.changeIcon"/>
            </svg>
            {{ s.change }}
          </div>
        </div>
      </div>

      <!-- GRÁFICO DE BARRAS -->
      <section class="table-box" :class="{ 'box-visible': animVisible }" style="transition-delay: 160ms">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
            </svg>
            Pedidos por Mes
            <span class="count-badge">Últimos 6 meses</span>
          </div>
        </div>

        <!-- CHART con tooltip posicionado ABAJO cuando la barra es alta -->
        <div class="chart-container">
          <div class="chart">
            <div v-for="(mes, idx) in meses" :key="mes.nombre" class="bar-col"
              @mouseenter="hoveredBar = idx" @mouseleave="hoveredBar = null">
              <div class="bar-wrapper">
                <div class="bar-total" :class="{ 'bar-hovered': hoveredBar === idx, 'bar-empty': (mes.completadas + mes.pendientes) === 0 }"
                  :style="{ height: barHeights[idx] + 'px' }">
                  <div class="bar-pending-strip" :style="{ height: pendingHeights[idx] + 'px' }"></div>

                  <!-- Tooltip: aparece ARRIBA si hay espacio, ABAJO si la barra es muy alta -->
                  <Transition name="tip">
                    <div v-if="hoveredBar === idx" class="bar-tooltip"
                      :class="{ 'tooltip-below': barHeights[idx] > 120 }">
                      <strong>{{ mes.nombre }}</strong>
                      <span>📦 {{ mes.completadas + mes.pendientes }} pedidos totales</span>
                      <span>✅ {{ mes.completadas }} completados</span>
                      <span>🔵 {{ mes.pendientes }} pendientes</span>
                      <span>📊 Tasa: {{ mes.completadas + mes.pendientes > 0 ? Math.round((mes.completadas / (mes.completadas + mes.pendientes)) * 100) : 0 }}%</span>
                    </div>
                  </Transition>
                </div>
              </div>
              <div class="bar-label">{{ mes.nombre }}</div>
              <div class="bar-sub">{{ mes.completadas + mes.pendientes }} pedidos</div>
              <div class="bar-counts">
                <span class="c-dark">{{ mes.completadas }}</span>
                <span class="c-orange">{{ mes.pendientes }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="legend">
          <span class="legend-item"><span class="dot dot-dark"></span> Completados</span>
          <span class="legend-item"><span class="dot dot-orange"></span> Pendientes</span>
        </div>
      </section>

      <!-- REPORTES DISPONIBLES -->
      <section class="table-box" :class="{ 'box-visible': animVisible }" style="transition-delay: 280ms">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
            </svg>
            Reportes Disponibles
            <span class="count-badge">{{ reportes.length }} reporte{{ reportes.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="filters-right">
            <div class="select-wrapper">
              <select v-model="mesFiltro" class="type-select">
                <option value="">Todos los períodos</option>
                <option v-for="key in mesesDisponibles" :key="key" :value="key">{{ mesLabel(key) }}</option>
              </select>
              <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
            <div class="select-wrapper">
              <select v-model="tipoFiltro" class="type-select">
                <option value="">Todos los tipos</option>
                <option>Pedidos</option>
                <option>Eficiencia</option>
                <option>Inventario</option>
              </select>
              <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="report-list-wrap">
          <TransitionGroup name="report" tag="div" class="report-list">
            <div v-for="(r, idx) in reportes" :key="r.titulo" class="report-card"
              :class="{ 'report-downloading': r.downloading, 'report-exporting': r.exporting }"
              :style="{ animationDelay: `${idx * 45}ms` }">
              <div class="report-card-top">
                <div class="report-icon-wrap">
                  <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="report-svg">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="r.iconPath"/>
                  </svg>
                </div>
                <div class="report-info">
                  <div class="report-title">{{ r.titulo }}</div>
                  <div class="report-subtitle">{{ r.subtitulo }}</div>
                </div>
                <span class="badge-generado">Generado</span>
              </div>

              <div class="report-actions">
                <button class="rep-btn rep-btn-ver" @click="verReporte(r)" :disabled="r.viendo" :title="r.viendo ? 'Generando vista previa...' : 'Ver'">
                  <svg v-if="!r.viendo" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="13" height="13" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  </svg>
                  <svg v-else class="spinner" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="13" height="13" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                  </svg>
                  <span>Ver</span>
                </button>
                <button class="rep-btn rep-btn-pdf" @click="descargar(r)" :disabled="r.downloading" :title="r.downloading ? 'Descargando...' : 'Descargar PDF'">
                  <svg v-if="!r.downloading" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="13" height="13" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                  </svg>
                  <svg v-else class="spinner" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="13" height="13" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                  </svg>
                  <span>PDF</span>
                </button>
                <button class="rep-btn rep-btn-excel" @click="exportarExcel(r)" :disabled="r.exporting" :title="r.exporting ? 'Exportando...' : 'Exportar a Excel'">
                  <svg v-if="!r.exporting" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="13" height="13" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125Z M3.75 9.75h16.5M3.75 14.25h16.5M9 4.5v15M15 4.5v15"/>
                  </svg>
                  <svg v-else class="spinner" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="13" height="13" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                  </svg>
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="reportes.length === 0" class="empty-state">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
            </svg>
            <p>No hay reportes para este tipo</p>
          </div>
        </div>
      </section>

    </main>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast.visible" class="toast" :class="toast.type">
        <svg v-if="toast.type === 'success'" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        {{ toast.msg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { getMateriales, getOrdenes, getUsuarios, getEficienciaOperarios } from '../../services/api.js'

const animVisible = ref(false)
const toast = ref({ visible: false, msg: '', type: 'success' })
const tipoFiltro = ref('')
const mesFiltro = ref('') // '' = todos los períodos
const hoveredBar = ref(null)
const meses = ref([])
const barHeights = ref([])
const pendingHeights = ref([])
const ordenesData = ref([])
const usuariosData = ref([])
const materialesData = ref([])
const eficienciaData = ref([])
const errorEficiencia = ref(false)
const stockBajoRef = ref(0)
const statsDisplay = reactive({ total: 0, completados: 0, tasa: 0, pendientes: 0 })

const statCards = computed(() => [
  {
    label: 'Pedidos Totales', display: statsDisplay.total,
    accent: '#1f3a52', changeColor: '#2563eb', change: '+8.3%',
    changeIcon: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
  },
  {
    label: 'Pedidos Completados', display: statsDisplay.completados,
    accent: '#16a34a', changeColor: '#16a34a', change: '+12.5%',
    changeIcon: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
    icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    label: 'Tasa Completación', display: statsDisplay.tasa + '%',
    accent: '#7c3aed', changeColor: '#7c3aed', change: '+2.3%',
    changeIcon: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    label: 'Pedidos Pendientes', display: statsDisplay.pendientes,
    accent: '#94a3b8', changeColor: '#94a3b8', change: '5% del total',
    changeIcon: null,
    icon: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
  },
])

onMounted(async () => {
  await cargarDatos()
  setTimeout(() => animVisible.value = true, 50)
  setTimeout(() => animateBars(), 250)
})

function mostrarToast(msg, type = 'success') {
  toast.value = { visible: true, msg, type }
  setTimeout(() => { toast.value.visible = false }, 2800)
}

function animateCount(key, target, isDecimal = false) {
  let val = 0
  const steps = 36; const step = target / steps; let count = 0
  const iv = setInterval(() => {
    count++; val += step
    if (count >= steps) { statsDisplay[key] = isDecimal ? target : Math.round(target); clearInterval(iv) }
    else statsDisplay[key] = isDecimal ? parseFloat(val.toFixed(1)) : Math.round(val)
  }, 22)
}

function animateStats(total, completados, pendientes) {
  const tasa = total > 0 ? parseFloat(((completados / total) * 100).toFixed(1)) : 0
  animateCount('total', total)
  animateCount('completados', completados)
  animateCount('tasa', tasa, true)
  animateCount('pendientes', pendientes)
}

async function cargarDatos() {
  try {
    const [dataOrdenes, dataUsuarios, dataMateriales] = await Promise.all([
      getOrdenes(), getUsuarios(), getMateriales(),
    ])
    ordenesData.value = Array.isArray(dataOrdenes) ? dataOrdenes : []
    usuariosData.value = Array.isArray(dataUsuarios) ? dataUsuarios : []
    materialesData.value = Array.isArray(dataMateriales) ? dataMateriales : []

    // La eficiencia va en su propio try/catch: requiere API key y es un
    // endpoint aparte, así que si falla no debe tumbar el resto de la
    // pantalla (igual que en la app móvil).
    try {
      const dataEficiencia = await getEficienciaOperarios()
      eficienciaData.value = Array.isArray(dataEficiencia) ? dataEficiencia : []
      errorEficiencia.value = false
    } catch (e) {
      console.error('getEficienciaOperarios() falló:', e)
      eficienciaData.value = []
      errorEficiencia.value = true
    }

    const total = ordenesData.value.length
    const completados = ordenesData.value.filter(o => o.Estado === 'Completada').length
    const pendientes  = ordenesData.value.filter(o => o.Estado === 'En Proceso').length
    animateStats(total, completados, pendientes)

    const porMes = {}
    ordenesData.value.forEach(o => {
      const fecha = o.Fecha_Limite || o.Fecha
      if (!fecha) return
      const d = new Date(fecha)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const nombre = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase())
      if (!porMes[key]) porMes[key] = { nombre, completadas: 0, pendientes: 0 }
      if (o.Estado === 'Completada') porMes[key].completadas += 1
      else porMes[key].pendientes += 1
    })

    meses.value = Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b)).slice(-6)
      .map(([, value]) => value)

    if (meses.value.length === 0) {
      meses.value = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map(nombre => ({ nombre, completadas: 0, pendientes: 0 }))
    }

    const stockBajo  = materialesData.value.filter(m => Number(m.Stock_Actual) <= Number(m.Stock_Minimo)).length
    stockBajoRef.value = stockBajo

    actualizarReportesPorPeriodo()
  } catch {
    mostrarToast('No fue posible cargar los reportes.', 'danger')
  }
}

function animateBars() {
  barHeights.value   = meses.value.map(() => 0)
  pendingHeights.value = meses.value.map(() => 0)
  const totals   = meses.value.map(mes => mes.completadas + mes.pendientes)
  const maxTotal = Math.max(...totals, 1)
  meses.value.forEach((mes, index) => {
    const totalMes    = mes.completadas + mes.pendientes
    const totalTarget = totalMes === 0 ? 18 : Math.max(42, (totalMes / maxTotal) * 170)
    const pendingTarget = totalMes === 0 ? 0 : Math.max(8, totalTarget * (mes.pendientes / totalMes))
    let val = 0; const steps = 30; const step = totalTarget / steps; let count = 0
    setTimeout(() => {
      const iv = setInterval(() => {
        count++; val += step
        if (count >= steps) {
          barHeights.value[index]    = totalTarget
          pendingHeights.value[index] = Math.min(pendingTarget, totalTarget)
          clearInterval(iv)
        } else {
          const current = Math.min(val, totalTarget)
          barHeights.value[index]    = current
          pendingHeights.value[index] = totalTarget === 0 ? 0 : Math.min((current / totalTarget) * pendingTarget, pendingTarget)
        }
      }, 18)
    }, index * 55)
  })
}

const reportesData = reactive([
  {
    titulo: 'Reporte de Pedidos Mensuales', tipo: 'Pedidos', subtipo: 'todos',
    periodo: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    generado: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(), subtitulo: 'Cargando...',
    downloading: false, exporting: false, viendo: false,
    iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'
  },
  {
    titulo: 'Reporte de Pedidos Pendientes', tipo: 'Pedidos', subtipo: 'pendientes',
    periodo: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    generado: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(), subtitulo: 'Cargando...',
    downloading: false, exporting: false, viendo: false,
    iconPath: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z'
  },
  {
    titulo: 'Reporte de Eficiencia Operaria', tipo: 'Eficiencia', subtipo: null,
    periodo: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    generado: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(), subtitulo: 'Cargando...',
    downloading: false, exporting: false, viendo: false,
    iconPath: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z'
  },
  {
    titulo: 'Reporte de Inventario', tipo: 'Inventario', subtipo: null,
    periodo: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    generado: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(), subtitulo: 'Cargando...',
    downloading: false, exporting: false, viendo: false,
    iconPath: 'M3.375 19.5h17.25c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125Z M3.75 9.75h16.5M3.75 14.25h16.5M9 4.5v15M15 4.5v15'
  },
])

const reportes = computed(() =>
  tipoFiltro.value === '' ? reportesData : reportesData.filter(r => r.tipo === tipoFiltro.value)
)

const mesesNombres = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function mesLabel(key) {
  const [anio, mes] = key.split('-')
  const nombre = mesesNombres[parseInt(mes, 10) - 1]
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`
}

// Solo se listan meses que realmente tienen al menos una orden con
// Fecha_Limite registrada — nunca se ofrece un mes sin datos.
const mesesDisponibles = computed(() => {
  const claves = new Set()
  ordenesData.value.forEach(o => {
    const fecha = o.Fecha_Limite || o.Fecha
    if (!fecha) return
    const d = new Date(fecha)
    if (isNaN(d)) return
    claves.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  })
  return Array.from(claves).sort((a, b) => b.localeCompare(a))
})

const periodoLabel = computed(() => mesFiltro.value ? mesLabel(mesFiltro.value) : 'Todos los períodos')

// Órdenes que corresponden al período elegido (o todas, si no hay filtro).
// Los reportes basados en pedidos (Producción, Ventas) usan esto tanto
// para las filas descargables como para su subtítulo/período mostrado.
function ordenesDelPeriodo() {
  if (!mesFiltro.value) return ordenesData.value
  return ordenesData.value.filter(o => {
    const fecha = o.Fecha_Limite || o.Fecha
    if (!fecha) return false
    const d = new Date(fecha)
    if (isNaN(d)) return false
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return key === mesFiltro.value
  })
}

// Actualiza el subtítulo de los 4 reportes cada vez que cambia el mes
// filtrado, para que el comportamiento sea consistente entre todos
// ellos (antes solo Pedidos Mensuales/Pendientes reflejaban el
// período elegido, y Eficiencia/Inventario se quedaban con el texto
// de la carga inicial, dando la sensación de que "no cambiaban" o
// de que su información desaparecía al filtrar).
function actualizarReportesPorPeriodo() {
  const filtradas = ordenesDelPeriodo()
  const pendientes = filtradas.filter(o => o.Estado !== 'Completada')

  reportesData[0].periodo = periodoLabel.value
  reportesData[0].subtitulo = filtradas.length === 0
    ? `Sin órdenes registradas · ${periodoLabel.value}`
    : `${filtradas.length} órdenes registradas · ${periodoLabel.value}`

  reportesData[1].periodo = periodoLabel.value
  reportesData[1].subtitulo = pendientes.length === 0
    ? `Sin pedidos pendientes · ${periodoLabel.value}`
    : `${pendientes.length} pedidos pendientes · ${periodoLabel.value}`

  // Eficiencia e Inventario NO se recalculan por período: la API de
  // eficiencia (getEficienciaOperarios) no acepta ningún parámetro de
  // fecha y devuelve un acumulado histórico ya calculado en el
  // servidor, y MaterialItem no tiene ningún campo de fecha (el stock
  // es una foto del momento). obtenerFilasReporte() nunca filtra estas
  // dos por mesFiltro, así que etiquetarlas con el mes elegido sería
  // mentir en el propio PDF/Excel exportado (imprime "Período: <mes>"
  // con filas que en realidad son de todo el histórico). Por eso su
  // `periodo` se deja fijo en "Datos actuales", igual que ya hace la
  // app móvil (_tablaEficiencia/_tablaInventario no usan _mesFiltro).
  reportesData[2].periodo = 'Datos actuales'
  reportesData[2].subtitulo = errorEficiencia.value
    ? `No se pudo cargar la eficiencia · Datos actuales`
    : eficienciaData.value.length === 0
      ? `Sin operarios con datos de eficiencia · Datos actuales`
      : `${eficienciaData.value.length} operario(s) evaluado(s) · Datos actuales`

  reportesData[3].periodo = 'Datos actuales'
  reportesData[3].subtitulo = materialesData.value.length === 0
    ? `Sin materiales registrados · Datos actuales`
    : `${materialesData.value.length} material(es) registrado(s) · ${stockBajoRef.value} con stock bajo`
}

watch(mesFiltro, actualizarReportesPorPeriodo)

// ── CONSTRUCCIÓN DEL PDF (compartida entre "Ver" y "Descargar") ──
async function cargarJsPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = resolve
      s.onerror = () => reject(new Error('No se pudo cargar jsPDF'))
      document.head.appendChild(s)
    })
  }
}

async function generarDocPdf(r) {
    await cargarJsPdf()
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const rows    = obtenerFilasReporte(r)
    const headers = rows.length ? Object.keys(rows[0]) : []

    const mesesN = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const hoy = new Date()
    const fechaHoy = `${hoy.getDate()} de ${mesesN[hoy.getMonth()]} de ${hoy.getFullYear()}`

    const AZUL    = [31, 58, 82]
    const BLANCO  = [255, 255, 255]
    const GRIS_BG = [240, 244, 247]
    const GRIS_LN = [248, 250, 252]
    const NEGRO   = [17, 24, 39]
    const GRIS_T  = [75, 85, 99]
    const GRIS_M  = [156, 163, 175]
    const AZUL_CL = [180, 200, 215]

    const W  = doc.internal.pageSize.width
    const ML = 14
    const MR = W - 14

    // Cabecera con logo
    doc.setFillColor(...AZUL)
    doc.rect(0, 0, W, 30, 'F')
    const logoB64 = 'data:image/png;base64,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'
    doc.addImage(logoB64, 'PNG', ML, 5, 20, 20)
    doc.setTextColor(...BLANCO)
    doc.setFontSize(17); doc.setFont('helvetica', 'bold')
    doc.text('TEXTICODE', ML + 24, 14)
    doc.setFontSize(8); doc.setFont('helvetica', 'italic')
    doc.setTextColor(...AZUL_CL)
    doc.text('Gestión Textil Profesional', ML + 24, 20)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
    doc.text('Bogotá, Colombia', MR, 11, { align: 'right' })
    doc.text('texticode@correo.com', MR, 17, { align: 'right' })
    doc.text('+57 300 000 0000', MR, 23, { align: 'right' })

    // Sub-cabecera con título del reporte
    doc.setFillColor(...GRIS_BG)
    doc.rect(0, 32, W, 14, 'F')
    doc.setDrawColor(...AZUL); doc.setLineWidth(0.4)
    doc.line(0, 46, W, 46)
    doc.setTextColor(...AZUL); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text(r.titulo.toUpperCase(), W / 2, 41, { align: 'center' })

    let y = 52
    const metaW = MR - ML
    const colW3 = metaW / 3
    const boxH  = 15
    doc.setFillColor(...GRIS_BG)
    doc.roundedRect(ML, y, metaW, boxH, 2, 2, 'F')
    const metaItems = [
      { label: 'PERÍODO',             value: r.periodo },
      { label: 'FECHA DE GENERACIÓN', value: fechaHoy },
      { label: 'TOTAL DE REGISTROS',  value: String(rows.length) },
    ]
    metaItems.forEach((item, i) => {
      const mx = ML + colW3 * i + 4
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...GRIS_T)
      doc.text(item.label, mx, y + 5.5)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...NEGRO)
      doc.text(item.value, mx, y + 11.5)
    })
    y += boxH + 7

    // Tabla
    const estadoColor = {
      'Completada': { bg: [209, 250, 229], fg: [6, 95, 70] },
      'En Proceso':  { bg: [254, 243, 199], fg: [146, 64, 14] },
      'Pendiente':   { bg: [254, 226, 226], fg: [153, 27, 27] },
    }
    const tableW = MR - ML
    const weightMap = {
      codigo: 1, producto: 2.6, cliente: 1.8, operario: 1.8, estado: 1.3, progreso: 1,
      rendimiento: 1.2, prendas_dia: 1.3, unidades_producidas: 1.7, completadas: 1.2, retrasadas: 1.2,
      material: 2, categoria: 1.4, stock: 1.2, minimo: 1, maximo: 1,
    }
    const totalWeight = headers.reduce((s, h) => s + (weightMap[h] || 1), 0)
    const colWidths   = headers.map(h => (weightMap[h] || 1) / totalWeight * tableW)
    const headH = 9; const rowH = 8
    const pageHmax = 277

    function drawTableHeader(yPos) {
      doc.setFillColor(...AZUL)
      doc.rect(ML, yPos, tableW, headH, 'F')
      doc.setTextColor(...BLANCO); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
      let cx = ML
      headers.forEach((h, i) => {
        const label = h.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        doc.text(label, cx + 2, yPos + 6, { maxWidth: colWidths[i] - 3 })
        cx += colWidths[i]
      })
      return yPos + headH
    }

    if (headers.length && rows.length) {
      y = drawTableHeader(y)
      rows.forEach((row, ri) => {
        if (y + rowH > pageHmax) {
          doc.addPage()
          y = 16
          y = drawTableHeader(y)
        }
        const bgColor = ri % 2 === 0 ? BLANCO : GRIS_LN
        doc.setFillColor(...bgColor); doc.rect(ML, y, tableW, rowH, 'F')
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.15)
        doc.line(ML, y + rowH, MR, y + rowH)
        doc.setFontSize(7.5)
        let cx = ML
        headers.forEach((key, i) => {
          const val = String(row[key] ?? '')
          const esEst = key === 'estado' || key === 'Estado'
          const colores = esEst ? estadoColor[val] : null
          const avail = colWidths[i] - 4
          if (colores) {
            const bW = Math.min(avail, 28)
            doc.setFillColor(...colores.bg)
            doc.roundedRect(cx + 2, y + 1.8, bW, 4.5, 1, 1, 'F')
            doc.setTextColor(...colores.fg); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8)
            doc.text(val, cx + 2 + bW / 2, y + 5.1, { align: 'center' }); doc.setFontSize(7.5)
          } else {
            doc.setTextColor(...(i === 0 ? NEGRO : GRIS_T))
            doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
            const lines = doc.splitTextToSize(val, avail)
            doc.text(lines[0], cx + 2, y + 5.5)
          }
          cx += colWidths[i]
        })
        y += rowH
      })
    } else {
      doc.setTextColor(...GRIS_M); doc.setFontSize(10); doc.setFont('helvetica', 'italic')
      doc.text('Sin datos para este reporte.', W / 2, y + 10, { align: 'center' })
    }

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      const pH = doc.internal.pageSize.height
      doc.setFillColor(...AZUL); doc.rect(0, pH - 12, W, 12, 'F')
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...AZUL_CL)
      doc.text('Documento de uso interno · TEXTICODE S.A.S.', ML, pH - 5)
      doc.text(`Página ${p} de ${totalPages}`, MR, pH - 5, { align: 'right' })
    }

    return doc
}

async function descargar(r) {
  r.downloading = true
  try {
    const doc = await generarDocPdf(r)
    doc.save(`${slugify(r.titulo)}.pdf`)
    mostrarToast(`"${r.titulo}" descargado como PDF`, 'success')
  } catch (err) {
    console.error('Error PDF:', err)
    mostrarToast(`Error al generar PDF: ${err.message}`, 'danger')
  } finally {
    r.downloading = false
  }
}

// ── VER (botón del ojito) — misma idea que la vista previa de la app
// móvil: genera el PDF y lo abre para visualizarlo, sin descargarlo. ──
async function verReporte(r) {
  r.viendo = true
  try {
    const doc = await generarDocPdf(r)
    const blobUrl = doc.output('bloburl')
    window.open(blobUrl, '_blank')
  } catch (err) {
    console.error('Error vista previa PDF:', err)
    mostrarToast(`Error al generar la vista previa: ${err.message}`, 'danger')
  } finally {
    r.viendo = false
  }
}

async function exportarExcel(r) {
  r.exporting = true
  try {
    const mesesN = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const hoy = new Date()
    const fechaStr = `${hoy.getDate()} de ${mesesN[hoy.getMonth()]} de ${hoy.getFullYear()}`
    const rows    = obtenerFilasReporte(r)
    const headers = rows.length ? Object.keys(rows[0]) : []

    // Paleta de colores Texticode
    const AZUL_OSC  = '1F3A52'  // cabecera
    const AZUL_MED  = '2D5580'  // hover
    const BLANCO    = 'FFFFFF'
    const GRIS_HDR  = 'EEF2F6'  // fondo encabezados tabla
    const GRIS_ALT  = 'F8FAFC'  // filas alternas
    const GRIS_META = 'F0F4F7'  // fila metadatos
    const CELESTE   = '93C5FD'  // sub-texto cabecera

    // Colores estado
    const EST_OK_BG = 'D1FAE5'; const EST_OK_FG = '065F46'
    const EST_PR_BG = 'FEF3C7'; const EST_PR_FG = '92400E'
    const EST_PE_BG = 'FEE2E2'; const EST_PE_FG = '991B1B'

    // ── Helpers XML ──
    const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

    function solidFill(hex) { return `<fill><patternFill patternType="solid"><fgColor rgb="FF${hex}"/><bgColor indexed="64"/></patternFill></fill>` }
    function font(hex, sz, bold=false, italic=false) {
      return `<font>${bold?'<b/>':''}${italic?'<i/>':''}<sz val="${sz}"/><color rgb="FF${hex}"/><name val="Calibri"/><family val="2"/></font>`
    }
    function border(style='thin', hex='D1D5DB') {
      const s = `<${style}><color rgb="FF${hex}"/></${style}>`  // placeholder
      const b = `<border><left style="${style}"><color rgb="FF${hex}"/></left><right style="${style}"><color rgb="FF${hex}"/></right><top style="${style}"><color rgb="FF${hex}"/></top><bottom style="${style}"><color rgb="FF${hex}"/></bottom></border>`
      return b
    }
    function align(h='left', v='center', wrap=false) {
      return `<alignment horizontal="${h}" vertical="${v}"${wrap?' wrapText="1"':''}/>` 
    }
    function xf(fontId, fillId, borderId, alignXml='', numFmtId=0) {
      return `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${alignXml}</xf>`
    }

    // ── Definición de estilos (índices) ──
    // fonts: 0=datos, 1=tituloBlanco, 2=encabBlancoNegrita, 3=metaAzul, 4=metaGris, 5=datosNegrita, 6=estadoVerde, 7=estadoNaranja, 8=estadoRojo, 9=subtituloCeleste
    const fonts = [
      font('111827',9),           // 0 datos normal
      font(BLANCO,13,true),       // 1 titulo blanco bold
      font(BLANCO,9,true),        // 2 encabezado blanco bold
      font(AZUL_OSC,9,true),      // 3 meta label azul bold
      font('4B5563',9),           // 4 meta valor gris
      font('111827',9,true),      // 5 datos primera col bold
      font(EST_OK_FG,9,true),     // 6 estado ok
      font(EST_PR_FG,9,true),     // 7 estado en proceso
      font(EST_PE_FG,9,true),     // 8 estado pendiente
      font(CELESTE,8,false,true), // 9 subtitulo celeste italica
    ].join('')

    // fills: 0=none, 1=gray(default), 2=azulOsc, 3=grisMeta, 4=grisHdr, 5=blanco, 6=grisAlt, 7=estadoOkBg, 8=estadoPrBg, 9=estadoPeBg
    const fills = [
      '<fill><patternFill patternType="none"/></fill>',
      '<fill><patternFill patternType="gray125"/></fill>',
      solidFill(AZUL_OSC),
      solidFill(GRIS_META),
      solidFill(GRIS_HDR),
      solidFill(BLANCO),
      solidFill(GRIS_ALT),
      solidFill(EST_OK_BG),
      solidFill(EST_PR_BG),
      solidFill(EST_PE_BG),
    ].join('')

    // borders: 0=none, 1=delgado, 2=medio azul
    const borders = [
      '<border><left/><right/><top/><bottom/><diagonal/></border>',
      border('thin','D1D5DB'),
      border('medium',AZUL_OSC),
    ].join('')

    // cellXfs (xf index):
    // 0=default, 1=titulo(font1,fill2,bord2,left,center), 2=encab(font2,fill2,bord1,center),
    // 3=metaLabel(font3,fill3,bord1,left), 4=metaVal(font4,fill3,bord1,left),
    // 5=datosPrimCol(font5,fill5,bord1,left), 6=datosNormal(font0,fill5,bord1,center),
    // 7=datosAltPrim(font5,fill6,bord1,left), 8=datosAlt(font0,fill6,bord1,center),
    // 9=estadoOk(font6,fill7,bord1,center), 10=estadoPr(font7,fill8,bord1,center),
    // 11=estadoPe(font8,fill9,bord1,center), 12=estadoOkAlt(font6,fill7+alt,bord1), 
    // 13=vacío(font0,fill5,bord0)
    const cellXfs = [
      xf(0,0,0),                                          // 0 default
      xf(1,2,2, align('left','center')),                  // 1 titulo
      xf(2,2,1, align('center','center')),                // 2 encabezado col
      xf(3,3,1, align('left','center')),                  // 3 meta label
      xf(4,3,1, align('left','center')),                  // 4 meta valor
      xf(5,5,1, align('left','center')),                  // 5 datos 1a col blanco
      xf(0,5,1, align('center','center')),                // 6 datos normal blanco
      xf(5,6,1, align('left','center')),                  // 7 datos 1a col alt
      xf(0,6,1, align('center','center')),                // 8 datos normal alt
      xf(6,7,1, align('center','center')),                // 9 estado ok (verde)
      xf(7,8,1, align('center','center')),                // 10 estado en proceso (naranja)
      xf(8,9,1, align('center','center')),                // 11 estado pendiente (rojo)
      xf(6,7,1, align('center','center')),                // 12 estado ok alt
      xf(7,8,1, align('center','center')),                // 13 estado proceso alt
      xf(8,9,1, align('center','center')),                // 14 estado pendiente alt
      xf(9,2,2, align('left','center')),                  // 15 subtitulo celeste
    ].join('')

    // ── Construir celdas ──
    function colLetter(n) {
      let s = ''
      for (n++; n > 0; n = Math.floor((n-1)/26)) s = String.fromCharCode(65+((n-1)%26)) + s
      return s
    }
    function cell(row, col, value, styleIdx, type='s') {
      const addr = colLetter(col) + row
      const v = esc(value)
      if (type === 'n') return `<c r="${addr}" s="${styleIdx}" t="n"><v>${v}</v></c>`
      return `<c r="${addr}" s="${styleIdx}" t="inlineStr"><is><t>${v}</t></is></c>`
    }

    // Ancho columnas
    const colWidthMap = { descripcion:42,cliente:28,correo:36,material:30,orden:10,prioridad:14,fecha_limite:16,estado:18,stock_actual:14,stock_minimo:14,categoria:20,telefono:18 }
    const colsXml = headers.map((h,i) => `<col min="${i+1}" max="${i+1}" width="${colWidthMap[h]||20}" customWidth="1"/>`).join('')

    let xmlRows = ''
    const nCols = headers.length

    // Fila 1 — Título empresa (azul)
    let r1 = `<row r="1" ht="32" customHeight="1">`
    r1 += cell(1, 0, `TEXTICODE · ${r.titulo.toUpperCase()} · Período: ${r.periodo}`, 1)
    for (let c=1; c<nCols; c++) r1 += cell(1, c, '', 1)
    r1 += `</row>`
    xmlRows += r1

    // Fila 2 — Metadatos (gris claro)
    let r2 = `<row r="2" ht="20" customHeight="1">`
    const metaVals = ['Generado: ' + fechaStr, '', 'Total registros: ' + rows.length, '', 'TEXTICODE S.A.S.']
    headers.forEach((h, ci) => {
      r2 += cell(2, ci, metaVals[ci] || '', ci % 2 === 0 ? 3 : 4)
    })
    r2 += `</row>`
    xmlRows += r2

    // Fila 3 — separador vacío
    let r3 = `<row r="3" ht="8" customHeight="1">`
    for (let c=0; c<nCols; c++) r3 += cell(3, c, '', 0)
    r3 += `</row>`
    xmlRows += r3

    // Fila 4 — Encabezados tabla (azul)
    let r4 = `<row r="4" ht="22" customHeight="1">`
    headers.forEach((h, ci) => {
      const label = h.replace(/_/g,' ').replace(/\b\w/g, l=>l.toUpperCase())
      r4 += cell(4, ci, label, 2)
    })
    r4 += `</row>`
    xmlRows += r4

    // Filas de datos
    const estadoXfMap = {
      'Completada': [9,12], 'En Proceso': [10,13], 'Pendiente': [11,14]
    }
    rows.forEach((rowData, ri) => {
      const rowNum = 5 + ri
      const isAlt = ri % 2 !== 0
      let rxml = `<row r="${rowNum}" ht="18" customHeight="1">`
      headers.forEach((key, ci) => {
        const val = rowData[key] ?? ''
        const isEstado = key === 'estado' || key === 'Estado'
        let styleIdx
        if (isEstado) {
          const pair = estadoXfMap[String(val)] || [6, 8]
          styleIdx = isAlt ? pair[1] : pair[0]
        } else if (ci === 0) {
          styleIdx = isAlt ? 7 : 5
        } else {
          styleIdx = isAlt ? 8 : 6
        }
        const isNum = !isNaN(val) && val !== ''
        rxml += cell(rowNum, ci, val, styleIdx, isNum ? 'n' : 's')
      })
      rxml += `</row>`
      xmlRows += rxml
    })

    // Merge fila 1 (título)
    const lastCol = colLetter(nCols - 1)
    const mergesXml = `<mergeCells count="1"><mergeCell ref="A1:${lastCol}1"/></mergeCells>`

    // ── Armar XLSX (ZIP manual via Blob) ──
    const styleXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="${[...fonts.matchAll(/<font>/g)].length}">${fonts}</fonts>
  <fills count="${[...fills.matchAll(/<fill>/g)].length}">${fills}</fills>
  <borders count="${[...borders.matchAll(/<border>/g)].length}">${borders}</borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="${[...cellXfs.matchAll(/<xf /g)].length}">${cellXfs}</cellXfs>
</styleSheet>`

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${colsXml}</cols>
  <sheetData>${xmlRows}</sheetData>
  ${mergesXml}
</worksheet>`

    const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${esc(r.titulo.substring(0,31))}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

    const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>TEXTICODE</Application></Properties>`
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
    const relsBase = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

    // Usar JSZip o construir ZIP manualmente con fflate si está disponible
    // Fallback: cargar JSZip
    if (!window.JSZip) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
        s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
      })
    }
    const zip = new window.JSZip()
    zip.file('[Content_Types].xml', contentTypes)
    zip.file('_rels/.rels', relsBase)
    zip.file('xl/workbook.xml', wbXml)
    zip.file('xl/_rels/workbook.xml.rels', relsXml)
    zip.file('xl/styles.xml', styleXml)
    zip.file('xl/worksheets/sheet1.xml', sheetXml)
    zip.file('docProps/app.xml', appXml)

    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    descargarArchivo(blob, `${slugify(r.titulo)}.xlsx`)
    mostrarToast(`"${r.titulo}" exportado como Excel`, 'excel')
  } catch (err) {
    console.error(err)
    mostrarToast('Error al exportar Excel: ' + err.message, 'danger')
  } finally {
    r.exporting = false
  }
}
function formatearFecha(val) {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (isNaN(d)) return String(val)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return String(val) }
}

function progresoPorcentaje(o) {
  const total = Number(o.Cantidad) || 0
  const actual = Number(o.Unidades_Realizadas) || 0
  if (total <= 0) return 0
  return Math.round(Math.min(Math.max(actual / total, 0), 1) * 100)
}

function obtenerFilasReporte(reporte) {
  if (reporte.tipo === 'Pedidos') {
    const base = reporte.subtipo === 'pendientes'
      ? ordenesDelPeriodo().filter(o => o.Estado !== 'Completada')
      : ordenesDelPeriodo()
    return base.map(o => ({
      codigo:   `ORD-${String(o.Id_Orden).padStart(4, '0')}`,
      producto: o.Producto || o.Descripcion || '—',
      cliente:  o.Cliente,
      operario: o.Operario || '—',
      estado:   o.Estado,
      progreso: `${progresoPorcentaje(o)}%`,
    }))
  }
  if (reporte.tipo === 'Eficiencia') {
    return eficienciaData.value.map(op => ({
      operario:  op.Nombre_Completo,
      rendimiento: op.rendimiento,
      prendas_dia: Number(op.prendas_por_dia || 0).toFixed(1),
      unidades_producidas: op.total_unidades_producidas,
      completadas: op.ordenes_completadas,
      retrasadas: op.ordenes_en_retraso,
    }))
  }
  if (reporte.tipo === 'Inventario') {
    // Igual que en móvil: TODOS los materiales, no solo los de stock
    // bajo (esa distinción queda para la tarjeta de estadísticas).
    return materialesData.value.map(m => ({
      material: m.Nombre_Material,
      categoria: m.Categoria || '—',
      stock: `${m.Stock_Actual ?? '—'}${m.Unidad ? ' ' + m.Unidad : ''}`,
      minimo: m.Stock_Minimo ?? '—',
      maximo: m.Stock_Maximo ?? '—',
    }))
  }
  return []
}

function descargarArchivo(blob, nombre) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = nombre; link.click()
  URL.revokeObjectURL(url)
}

function slugify(value) { return value.toLowerCase().replace(/\s+/g, '-') }
</script>

<style scoped>
.layout  { display: flex; min-height: 100vh; background: #f1f5f9; position: relative; overflow: hidden; }
.content { flex: 1; padding: 28px 30px; position: relative; z-index: 1; }

.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: #2563eb; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #16a34a; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

/* HERO */
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
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
.filters-right { display: flex; align-items: center; gap: 10px; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.type-select { padding: 9px 36px 9px 14px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: white; font-size: 14px; color: #374151; appearance: none; -webkit-appearance: none; cursor: pointer; min-width: 190px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
.type-select:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: #6b7280; pointer-events: none; }

/* STATS */
.cards { display: flex; gap: 18px; margin-bottom: 28px; }
.stat-card { background: white; flex: 1; padding: 20px 20px 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s; }
.cards-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-3px) !important; }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: 0.07; }
.stat-icon-bg svg { width: 52px; height: 52px; }
.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px 0; }
.stat-card p  { font-size: 30px; font-weight: 800; margin: 0 0 8px; line-height: 1; }
.stat-change  { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; }
.change-icon  { width: 14px; height: 14px; flex-shrink: 0; }

/* TABLE BOX */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; margin-bottom: 28px; overflow: visible; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; border-radius: 14px 14px 0 0; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── CHART — con overflow visible para tooltip ── */
.chart-container { overflow: visible; padding: 0 20px; }
.chart { display: flex; align-items: flex-end; gap: 16px; height: 220px; margin: 60px 0 16px; position: relative; overflow: visible; }
.bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; cursor: pointer; position: relative; overflow: visible; }
.bar-wrapper { display: flex; align-items: flex-end; width: 100%; justify-content: center; position: relative; overflow: visible; }

.bar-total {
  width: 80%; background: #1f3a52; border-radius: 6px 6px 0 0;
  position: relative; display: flex; flex-direction: column; justify-content: flex-end;
  min-height: 4px; transition: background 0.2s, transform 0.15s;
  overflow: visible; /* CLAVE: permite que el tooltip salga del área */
}
.bar-total.bar-hovered { background: #2d5580; transform: scaleX(1.05); }
.bar-total.bar-empty { background: #e2e8f0; } /* mes sin pedidos: gris de la web, no azul */
.bar-total.bar-empty.bar-hovered { background: #cbd5e1; }
.bar-pending-strip { width: 100%; background: #94a3b8; border-radius: 0; min-height: 0; }

/* ── TOOLTIP CORREGIDO ──
   Por defecto aparece arriba (.bar-tooltip).
   Si la barra es alta se añade .tooltip-below y aparece abajo de la barra. */
.bar-tooltip {
  position: absolute;
  /* Arriba por defecto */
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937; color: white; border-radius: 8px;
  padding: 10px 14px; font-size: 12px; white-space: nowrap;
  display: flex; flex-direction: column; gap: 4px;
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(0,0,0,0.28);
  pointer-events: none;
}
.bar-tooltip::after {
  content: '';
  position: absolute;
  left: 50%; transform: translateX(-50%);
  border: 6px solid transparent;
  /* Flecha hacia abajo cuando el tooltip está arriba */
  top: 100%;
  border-top-color: #1f2937;
}

/* Variante: tooltip ABAJO de la barra cuando es muy alta */
.bar-tooltip.tooltip-below {
  bottom: auto;
  top: calc(100% + 8px);
}
.bar-tooltip.tooltip-below::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: #1f2937;
}

.bar-tooltip strong { font-size: 13px; margin-bottom: 2px; }
.bar-label { font-size: 13px; font-weight: 600; color: #374151; margin-top: 8px; }
.bar-sub   { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.bar-counts { display: flex; gap: 6px; font-size: 12px; font-weight: 600; margin-top: 2px; }
.c-dark   { color: #1f3a52; }
.c-orange { color: #94a3b8; }
.legend   { display: flex; gap: 20px; font-size: 13px; color: #374151; justify-content: center; margin: 0 20px 20px; border-radius: 0 0 14px 14px; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-dark   { background: #1f3a52; }
.dot-orange { background: #94a3b8; }

/* REPORT LIST — mismo diseño que la card de la app móvil */
.report-list-wrap { padding: 16px 20px; border-radius: 0 0 14px 14px; overflow: hidden; }
.report-list { display: flex; flex-direction: column; gap: 12px; }
.report-card {
  display: flex; flex-direction: column; gap: 12px;
  padding: 14px; border: 1px solid #e5e7eb; border-radius: 18px;
  background: #f8fafc; transition: border-color 0.2s, box-shadow 0.2s;
  animation: rowSlideIn 0.35s ease both;
}
.report-card:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.report-downloading { border-color: #bfdbfe !important; background: #eff6ff !important; }
.report-exporting   { border-color: #bbf7d0 !important; background: #f0fdf4 !important; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }

.report-card-top { display: flex; align-items: flex-start; gap: 10px; }
.report-icon-wrap { width: 36px; height: 36px; background: #f3f4f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.report-svg { width: 17px; height: 17px; color: #1f3a52; }
.report-info { flex: 1; min-width: 0; }
.report-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
.report-subtitle { font-size: 11px; color: #9ca3af; }
.badge-generado { flex-shrink: 0; background: #dcfce7; color: #16a34a; font-size: 9px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }

/* Fila de 3 botones (Ver / PDF / Excel) — alineados a la derecha, sin ocupar todo el ancho */
.report-actions { display: flex; justify-content: flex-end; gap: 6px; }
.rep-btn {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 8px 12px; border-radius: 10px; border: 1px solid transparent;
  font-size: 11px; font-weight: 600; cursor: pointer; transition: opacity 0.15s, transform 0.1s, background 0.15s;
}
.rep-btn svg { pointer-events: none; flex-shrink: 0; }
.rep-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.rep-btn:active:not(:disabled) { transform: scale(0.97); }
.rep-btn-ver   { background: #1f3a52; border-color: #1f3a52; color: #fff; }
.rep-btn-ver:hover:not(:disabled)   { background: #2d5580; }
.rep-btn-pdf   { background: #fef2f2; border-color: rgba(220,38,38,0.4); color: #dc2626; }
.rep-btn-pdf:hover:not(:disabled)   { background: #fee2e2; }
.rep-btn-excel { background: #dcfce7; border-color: rgba(22,163,74,0.4); color: #16a34a; }
.rep-btn-excel:hover:not(:disabled) { background: #bbf7d0; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner { animation: spin 0.8s linear infinite; }

.empty-state { text-align: center; padding: 40px 20px; color: #9ca3af; }
.empty-state svg { margin: 0 auto 12px; display: block; opacity: 0.4; }
.empty-state p { font-size: 14px; margin: 0; }

/* TOAST */
.toast { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.toast.success { background: #16a34a; }
.toast.excel   { background: #15803d; }
.toast.danger  { background: #dc2626; }

/* TRANSITIONS */
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
.tip-enter-active { transition: all 0.15s ease; }
.tip-leave-active { transition: all 0.1s ease; }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: translateX(-50%) translateY(4px); }
.report-enter-active { transition: all 0.3s ease; }
.report-leave-active { transition: all 0.25s ease; }
.report-enter-from { opacity: 0; transform: translateY(-8px); }
.report-leave-to   { opacity: 0; transform: translateY(-8px); }

@media (max-width: 900px) {
  .page-hero { flex-direction: column; align-items: flex-start; gap: 14px; }
  .cards { flex-direction: column; }
  .type-select { width: 100%; }
}
</style>