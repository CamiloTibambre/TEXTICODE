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
import { getMateriales, getOrdenes, getUsuarios, getEficienciaOperarios, getHistorialInventario } from '../../services/api.js'

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
    await actualizarEficienciaPorPeriodo()

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
    actualizarInventarioPorPeriodo()
  } catch {
    mostrarToast('No fue posible cargar los reportes.', 'danger')
  }
}

// Carga la eficiencia de operarios. Sin periodo trae el acumulado
// histórico completo (comportamiento de siempre); con periodo
// ('YYYY-MM') el backend filtra las órdenes por Fecha_Limite dentro
// de ese mes, así que las métricas (prendas/día, completadas,
// retrasadas, rendimiento) quedan calculadas solo con lo que
// realmente pasó ese mes — ya no es un texto que cambia sobre datos
// que no se movieron.
async function cargarEficiencia(periodo) {
  try {
    const dataEficiencia = await getEficienciaOperarios(periodo ? { periodo } : {})
    eficienciaData.value = Array.isArray(dataEficiencia) ? dataEficiencia : []
    errorEficiencia.value = false
  } catch (e) {
    console.error('getEficienciaOperarios() falló:', e)
    eficienciaData.value = []
    errorEficiencia.value = true
  }
}

async function actualizarEficienciaPorPeriodo() {
  reportesData[2].periodo = mesFiltro.value ? periodoLabel.value : 'Datos actuales'
  reportesData[2].subtitulo = 'Cargando...'
  await cargarEficiencia(mesFiltro.value || undefined)
  const sufijo = mesFiltro.value ? periodoLabel.value : 'Datos actuales'
  reportesData[2].subtitulo = errorEficiencia.value
    ? `No se pudo cargar la eficiencia · ${sufijo}`
    : eficienciaData.value.length === 0
      ? `Sin operarios con datos de eficiencia · ${sufijo}`
      : `${eficienciaData.value.length} operario(s) evaluado(s) · ${sufijo}`
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
}

// Inventario SÍ se recalcula por período ahora, a partir de la
// bitácora de movimientos (material_movimiento). Si no hay mes
// filtrado, usa el stock actual (foto del momento, como antes). Si
// hay un mes elegido, le pide al backend el inventario reconstruido
// al final de ese mes (GET /materiales/reportes/historial). Solo hay
// datos reales desde que se activó la migración en adelante — un mes
// anterior a eso legítimamente no tiene nada que mostrar, y así se le
// indica al usuario en vez de fingir que sí hay información.
const inventarioHistoricoData = ref([])
const cargandoInventarioHistorico = ref(false)
const errorInventarioHistorico = ref(false)

async function actualizarInventarioPorPeriodo() {
  if (!mesFiltro.value) {
    reportesData[3].periodo = 'Datos actuales'
    reportesData[3].subtitulo = materialesData.value.length === 0
      ? `Sin materiales registrados · Datos actuales`
      : `${materialesData.value.length} material(es) registrado(s) · ${stockBajoRef.value} con stock bajo`
    return
  }

  cargandoInventarioHistorico.value = true
  errorInventarioHistorico.value = false
  reportesData[3].periodo = periodoLabel.value
  reportesData[3].subtitulo = 'Cargando...'
  try {
    inventarioHistoricoData.value = await getHistorialInventario(mesFiltro.value)
    reportesData[3].subtitulo = inventarioHistoricoData.value.length === 0
      ? `Sin datos de inventario para este período · ${periodoLabel.value}`
      : `${inventarioHistoricoData.value.length} material(es) registrado(s) · ${periodoLabel.value}`
  } catch (e) {
    console.error('getHistorialInventario() falló:', e)
    inventarioHistoricoData.value = []
    errorInventarioHistorico.value = true
    reportesData[3].subtitulo = `No se pudo cargar el inventario de ese período · ${periodoLabel.value}`
  } finally {
    cargandoInventarioHistorico.value = false
  }
}

watch(mesFiltro, () => {
  actualizarReportesPorPeriodo()
  actualizarInventarioPorPeriodo()
  actualizarEficienciaPorPeriodo()
})

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
    const logoB64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAADYCAYAAACJIC3tAAAWfmNhQlgAABZ+anVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAAFlhqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOmIxZGRhYmE3LWUzM2EtNDQ3OC05MzhkLWExNzBhZWZmOTIwNgAAAAOTanVtYgAAAClqdW1kYzJhcwARABCAAACqADibcQNjMnBhLmFzc2VydGlvbnMAAAAAuGp1bWIAAABEanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5pbmdyZWRpZW50LnYzAAAAABhjMnNona1iqCobO0rhIQrI9vn81AAAAGxjYm9yo2lkYzpmb3JtYXRpaW1hZ2UvcG5namluc3RhbmNlSUR4LHhtcDppaWQ6YzRkYTBjMzItNGE0Ny00MGZkLWIzMDUtM2E0ZGFmMTA5MDAybHJlbGF0aW9uc2hpcGhwYXJlbnRPZgAAAeJqdW1iAAAAQWp1bWRjYm9yABEAEIAAAKoAOJtxE2MycGEuYWN0aW9ucy52MgAAAAAYYzJzaBaZ02CbZH+wkC4en6EtNwsAAAGZY2JvcqJnYWN0aW9uc4KiZmFjdGlvbmtjMnBhLm9wZW5lZGpwYXJhbWV0ZXJzoWtpbmdyZWRpZW50c4GiY3VybHgtc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5pbmdyZWRpZW50LnYzZGhhc2hYIDDInesa+scPmupap2QYT/wmvuMbRbMDC7mtvAXIcBWDpGZhY3Rpb254HWNvbS5hbnRocm9waWMuY2xhdWRlLnByb3ZpZGVkanBhcmFtZXRlcnOheB9jb20uYW50aHJvcGljLm9yaWdpbi1jb25maWRlbmNlZ3Vua25vd25rZGVzY3JpcHRpb254ZkNsYXVkZSBwcm92aWRlZCB0aGlzIGZpbGUgYXQgdGhlIHJlcXVlc3Qgb2YgYSB1c2VyIGFuZCBtYXkgaGF2ZSBjcmVhdGVkIG9yIG1vZGlmaWVkIHRoZSBmaWxlIGNvbnRlbnRzLm1zb2Z0d2FyZUFnZW50oWRuYW1lZkNsYXVkZXJhbGxBY3Rpb25zSW5jbHVkZWT1AAAAyGp1bWIAAABAanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5oYXNoLmRhdGEAAAAAGGMyc2h7h80uJcdkgAgsGsGfLUPwAAAAgGNib3KlY2FsZ2ZzaGEyNTZjcGFkTQAAAAAAAAAAAAAAAABkaGFzaFggAJqNaIhx3A+nmcDYgqwCUcoxqOJhRB8T2jFHtg/fw8VkbmFtZW5qdW1iZiBtYW5pZmVzdGpleGNsdXNpb25zgaJlc3RhcnQYIWZsZW5ndGgZFooAAAI+anVtYgAAACdqdW1kYzJjbAARABCAAACqADibcQNjMnBhLmNsYWltLnYyAAAAAg9jYm9ypWNhbGdmc2hhMjU2aXNpZ25hdHVyZXhNc2VsZiNqdW1iZj0vYzJwYS91cm46YzJwYTpiMWRkYWJhNy1lMzNhLTQ0NzgtOTM4ZC1hMTcwYWVmZjkyMDYvYzJwYS5zaWduYXR1cmVqaW5zdGFuY2VJRHgseG1wOmlpZDo5YTg5M2I3MS0yM2M1LTQxMWQtODZiMS0wZTQwZDM1YWEyODByY3JlYXRlZF9hc3NlcnRpb25zg6JjdXJseC1zZWxmI2p1bWJmPWMycGEuYXNzZXJ0aW9ucy9jMnBhLmluZ3JlZGllbnQudjNkaGFzaFggMMid6xr6xw+a6lqnZBhP/Ca+4xtFswMLua28BchwFYOiY3VybHgqc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5hY3Rpb25zLnYyZGhhc2hYIOGy2wysbOBqhWAsWVvDRcviFMk7T7oHTqnp+70IV9B+omN1cmx4KXNlbGYjanVtYmY9YzJwYS5hc3NlcnRpb25zL2MycGEuaGFzaC5kYXRhZGhhc2hYIA80a7q4LIHi7GTSLhd2X/XEVyeBNa6It2foJdwQshUwdGNsYWltX2dlbmVyYXRvcl9pbmZvo2RuYW1lb0FudGhyb3BpYyBGaWxlc2d2ZXJzaW9uZTEuMC4wa3NwZWNWZXJzaW9uZTIuNC4wAAAQOGp1bWIAAAAoanVtZGMyY3MAEQAQgAAAqgA4m3EDYzJwYS5zaWduYXR1cmUAAAAQCGNib3LShFkCEqIBJhghWQIKMIICBjCCAY2gAwIBAgIUQOWgCu7COdC+uIP6BkIFPWdVEwAwCgYIKoZIzj0EAwMwSTEXMBUGA1UEChMOQW50aHJvcGljLCBQQkMxLjAsBgNVBAMTJUFudGhyb3BpYyBDb250ZW50IENyZWRlbnRpYWxzIFJvb3QgQ0EwHhcNMjYwODA3MTg0MzU2WhcNMjgwODA2MTk0MzU2WjBEMRcwFQYDVQQKEw5BbnRocm9waWMsIFBCQzEpMCcGA1UEAxMgQW50aHJvcGljIENsYXVkZSBDb250ZW50IFNpZ25pbmcwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASYegpry1AYBRTVNL1CpTlbROnY3dey+UrsF9C3phYrATN3ZHf93Mo8RQN0KOUuOn19P4oWNFWe5n2/She9N7eTo1gwVjAOBgNVHQ8BAf8EBAMCB4AwFQYDVR0lBA4wDAYKKwYBBAGD6F4CATAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFM5R4gSBTmRbI/jjxM+aPpzB11zCMAoGCCqGSM49BAMDA2cAMGQCMDFzHRSeAXrSy1WOzkbhPZ6Km2wGTmZ/2gK18k8BQGXyqz88Rdrz6CTX9flAnYNVxgIwcF9c3fVhqmJKpi+UhasNUMko69cyX6STPfta3Q8EjyzDjzoyrol46FP6VFHhvUcJoWNwYWRZDZ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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'
    const logoCX = ML + 10
    const logoCY = 15
    doc.setFillColor(255, 255, 255)
    doc.circle(logoCX, logoCY, 10, 'F')
    doc.addImage(logoB64, 'PNG', logoCX - 7, logoCY - 7, 14, 14)
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
      'Retrasada':   { bg: [254, 226, 226], fg: [153, 27, 27] },
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
      'Completada': [9,12], 'En Proceso': [10,13], 'Retrasada': [11,14]
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
    // Igual que en móvil cuando no hay período elegido: TODOS los
    // materiales, no solo los de stock bajo (esa distinción queda
    // para la tarjeta de estadísticas). Con período elegido, se usa
    // el inventario reconstruido para ese mes (misma forma de fila,
    // porque el backend devuelve las mismas columnas).
    const fuente = mesFiltro.value ? inventarioHistoricoData.value : materialesData.value
    return fuente.map(m => ({
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