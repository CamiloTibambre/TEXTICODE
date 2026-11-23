<template>
  <div class="layout">
    <main class="content">

      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <PageHeader
        titulo="Reportes"
        subtitulo="Análisis y exportación de datos de la operación"
        icono="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />

      <div class="kpi-grid">
        <KpiCard
          v-for="(k, i) in kpis"
          :key="k.label"
          v-bind="k"
          :cargando="cargando"
          :indice="i"
        />
      </div>

      <!-- Gráfico y lista de reportes lado a lado en escritorio -->
      <div class="reportes-grid">
      <section class="table-box table-box--chart" aria-labelledby="titulo-pedidos-mes">
        <header class="table-header-bar chart-header">
          <h2 id="titulo-pedidos-mes">Pedidos por Mes</h2>
          <span>Últimos 6 meses con datos</span>
        </header>

        <div v-if="meses.length" class="chart-container">
          <div class="chart" :class="{ 'bars-in': barrasListas }">
            <div class="chart-scale" aria-hidden="true">
              <span v-for="nivel in nivelesGrafico" :key="nivel">{{ nivel }}</span>
            </div>
            <div class="chart-grid" aria-hidden="true">
              <i v-for="nivel in nivelesGrafico" :key="nivel"></i>
            </div>
            <button
              v-for="(mes, idx) in meses"
              :key="mes.key"
              type="button"
              class="bar-col"
              :class="{ 'bar-muted': mesActivo && mesActivo !== mes.key }"
              :style="{ '--bar-i': idx, '--bar-height': alturaMes(mes) + '%' }"
              :aria-label="detalleMes(mes)"
              @mouseenter="mesSobre = mes.key"
              @mouseleave="mesSobre = null"
              @focus="mesEnFoco = mes.key"
              @blur="mesEnFoco = null"
              @click="mesSobre = mes.key"
              @keydown.esc.stop="mesSobre = null; mesEnFoco = null"
            >
              <span
                class="bar-stack"
                aria-hidden="true"
              >
                <span v-if="mes.pendientes" class="bar-pendientes" :style="{ flexGrow: mes.pendientes }"></span>
                <span v-if="mes.completadas" class="bar-completadas" :style="{ flexGrow: mes.completadas }"></span>
              </span>
              <span class="bar-label" aria-hidden="true">{{ mes.nombre }}</span>
              <span v-if="mesActivo === mes.key" class="bar-tooltip" :class="{ 'bar-tooltip--alta': alturaMes(mes) > 65 }" aria-hidden="true">
                <strong>{{ mes.titulo }}</strong>
                <span>{{ mes.completadas }} completados</span>
                <span>{{ mes.pendientes }} pendientes</span>
                <strong>{{ tasaMes(mes) }}% completado</strong>
              </span>
            </button>
          </div>
          <div class="legend">
            <span><i class="dot bar-completadas"></i>Completados</span>
            <span><i class="dot bar-pendientes"></i>Pendientes</span>
          </div>
        </div>
        <p v-else class="chart-empty">{{ cargando ? 'Cargando pedidos…' : 'Sin pedidos con fecha para mostrar.' }}</p>
      </section>

      <!-- REPORTES DISPONIBLES -->
      <section class="table-box table-box--reports">
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
              <select v-model="mesFiltro" class="type-select" aria-label="Filtrar por período">
                <option value="">Todos los períodos</option>
                <option v-for="key in mesesDisponibles" :key="key" :value="key">{{ mesLabel(key) }}</option>
              </select>
              <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
            <div class="select-wrapper">
              <select v-model="tipoFiltro" class="type-select" aria-label="Filtrar por tipo de reporte">
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
              :style="{ '--row-i': Math.min(idx, 10) }">
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

          <EmptyState
            v-if="reportes.length === 0"
            icono="documento"
            titulo="No hay reportes de este tipo"
            descripcion="Elige otro tipo o vuelve a mostrar todos."
            compacto
          >
            <button type="button" class="tx-btn tx-btn--secondary tx-btn--sm" @click="tipoFiltro = ''">Ver todos los tipos</button>
          </EmptyState>
        </div>
      </section>
      </div>

    </main>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getMateriales, getOrdenes, getUsuarios, getEficienciaOperarios, getHistorialInventario } from '../../services/api.js'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import { crearDocumentoPdf, estiloPdf, fechaDocumento } from '../../services/documentoPdf'
import { useToast } from '../../composables/useToast'

const toast = useToast()
const cargando = ref(true)
const barrasListas = ref(false)
const tipoFiltro = ref('')
const mesFiltro = ref('') // '' = todos los períodos
const mesSobre = ref(null)
const mesEnFoco = ref(null)
const mesActivo = computed(() => mesSobre.value || mesEnFoco.value)
const meses = ref([])
const nivelesGrafico = computed(() => {
  const maximo = Math.max(1, ...meses.value.map(mes => mes.completadas + mes.pendientes))
  const minimo = Math.ceil(maximo / 3)
  const magnitud = 10 ** Math.floor(Math.log10(minimo))
  const paso = [1, 2, 5, 10].map(valor => valor * magnitud).find(valor => valor >= minimo)
  return [3 * paso, 2 * paso, paso, 0]
})
const ordenesData = ref([])
const usuariosData = ref([])
const materialesData = ref([])
const eficienciaData = ref([])
const errorEficiencia = ref(false)
const stockBajoRef = ref(0)
const stats = reactive({ total: 0, completados: 0, tasa: 0, pendientes: 0 })

const ICON_BARS  = 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z'
const ICON_CHECK = 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_RATE  = 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z'
const ICON_CLOCK = 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'

// Las notas salen de los datos reales (antes había porcentajes de
// "tendencia" escritos a mano que no correspondían a nada).
const kpis = computed(() => [
  { label: 'Pedidos totales',      valor: stats.total,       icono: ICON_BARS,  tono: 'brand' },
  { label: 'Pedidos completados',  valor: stats.completados, icono: ICON_CHECK, tono: 'success',
    nota: stats.total ? `${pct(stats.completados)}% del total` : '' },
  { label: 'Tasa de completación', valor: stats.tasa, sufijo: '%', decimales: 1, icono: ICON_RATE, tono: 'violet' },
  { label: 'Pedidos en proceso',   valor: stats.pendientes,  icono: ICON_CLOCK, tono: 'warning',
    nota: stats.total ? `${pct(stats.pendientes)}% del total` : '' },
])

function pct(n) {
  return stats.total ? Math.round((n / stats.total) * 100) : 0
}

onMounted(async () => {
  await cargarDatos()
  animateBars()
})

// Mantiene la firma anterior para no tocar cada llamada
function mostrarToast(msg, type = 'success') {
  if (type === 'danger' || type === 'error') toast.error(msg)
  else toast.success(msg)
}

function animateStats(total, completados, pendientes) {
  stats.total       = total
  stats.completados = completados
  stats.pendientes  = pendientes
  stats.tasa        = total > 0 ? parseFloat(((completados / total) * 100).toFixed(1)) : 0
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
      if (Number.isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const nombre = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase())
      if (!porMes[key]) {
        const titulo = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
        porMes[key] = { key, nombre, titulo, completadas: 0, pendientes: 0 }
      }
      if (o.Estado === 'Completada') porMes[key].completadas += 1
      else porMes[key].pendientes += 1
    })

    meses.value = Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b)).slice(-6)
      .map(([, value]) => value)

    const stockBajo  = materialesData.value.filter(m => Number(m.Stock_Actual) <= Number(m.Stock_Minimo)).length
    stockBajoRef.value = stockBajo

    actualizarReportesPorPeriodo()
    actualizarInventarioPorPeriodo()
  } catch {
    mostrarToast('No se pudieron cargar los datos de reportes. Revisa tu conexión y recarga la página.', 'danger')
  } finally {
    cargando.value = false
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

// Las barras se dibujan con su altura final y entran con transform: scaleY
// (solo transform → 60 fps), en lugar de cambiar la altura cuadro a cuadro.
function animateBars() {
  requestAnimationFrame(() => requestAnimationFrame(() => { barrasListas.value = true }))
}

function alturaMes(mes) {
  return (mes.completadas + mes.pendientes) / nivelesGrafico.value[0] * 100
}

function tasaMes(mes) {
  return Math.round(100 * mes.completadas / (mes.completadas + mes.pendientes))
}

function detalleMes(mes) {
  return [mes.titulo, mes.completadas + ' completados', mes.pendientes + ' pendientes', tasaMes(mes) + '% completado'].join(', ')
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
async function generarDocPdf(reporte) {
  const filas = obtenerFilasReporte(reporte)
  const { doc, fuente, cabecera, pies, izquierda, ancho } = await crearDocumentoPdf({ titulo: reporte.titulo })
  const { gris, textoTabla, borde, fondoTabla, paginaLimite } = estiloPdf
  const inicioPagina = cabecera()
  let y = inicioPagina

  const datos = [
    ['Período', reporte.periodo],
    ['Fecha de generación', fechaDocumento(new Date())],
    ['Total de registros', filas.length],
  ]
  fuente(9)
  const valores = datos.map(([, valor]) => doc.splitTextToSize(String(valor ?? '—'), ancho / 3 - 5))
  datos.forEach(([etiqueta], i) => {
    const x = izquierda + i * ancho / 3
    fuente(8, gris, 'bold')
    doc.text(etiqueta.toUpperCase(), x, y)
    fuente(9)
    doc.text(valores[i], x, y + 5)
  })
  y += 11 + 4 * Math.max(...valores.map(lineas => lineas.length))

  if (!filas.length) {
    fuente(10, gris)
    doc.text('Sin datos para este reporte.', izquierda, y + 4)
  } else {
    const pesos = { producto: 2.6, cliente: 1.8, operario: 1.8, estado: 1.3, material: 2, categoria: 1.4, unidades_producidas: 1.7, prendas_dia: 1.3 }
    const claves = Object.keys(filas[0])
    const pesoTotal = claves.reduce((total, clave) => total + (pesos[clave] || 1), 0)
    let siguienteX = izquierda
    const columnas = claves.map(clave => {
      const anchoColumna = (pesos[clave] || 1) / pesoTotal * ancho
      const columna = { clave, x: siguienteX + 2, ancho: anchoColumna - 4 }
      siguienteX += anchoColumna
      return columna
    })
    const coloresEstado = {
      Completada: '#166534',
      'En Proceso': '#92400e',
      Retrasada: '#991b1b',
    }
    const altoLinea = 3.8

    function dibujarEncabezado() {
      fuente(8, textoTabla, 'bold')
      const etiquetas = columnas.map(({ clave, ancho: anchoColumna }) => {
        const etiqueta = clave.replace(/_/g, ' ').replace(/^./, letra => letra.toUpperCase())
        return doc.splitTextToSize(etiqueta, anchoColumna)
      })
      const alto = 5 + altoLinea * Math.max(...etiquetas.map(lineas => lineas.length))
      doc.setFillColor(fondoTabla)
      doc.setDrawColor(borde)
      doc.setLineWidth(0.25)
      doc.roundedRect(izquierda, y, ancho, alto, 2, 2, 'FD')
      etiquetas.forEach((lineas, i) => doc.text(lineas, columnas[i].x, y + 4.5, { lineHeightFactor: 1.3 }))
      y += alto
      return alto
    }

    const altoEncabezado = dibujarEncabezado()
    const altoDisponible = paginaLimite - inicioPagina - altoEncabezado

    function nuevaPagina() {
      doc.addPage()
      y = cabecera()
      dibujarEncabezado()
    }
    for (const fila of filas) {
      const contenido = columnas.map(({ clave, ancho: anchoColumna }) => {
        const valor = String(fila[clave] ?? '—')
        const color = (clave === 'estado' && coloresEstado[valor]) || textoTabla
        const peso = clave === 'estado' ? 'bold' : 'normal'
        fuente(8, color, peso)
        return { lineas: doc.splitTextToSize(valor, anchoColumna), color, peso }
      })
      const altoFila = 5 + altoLinea * Math.max(...contenido.map(celda => celda.lineas.length))
      if (y + altoFila > paginaLimite && altoFila <= altoDisponible) nuevaPagina()

      while (contenido.some(celda => celda.lineas.length)) {
        if (y + altoLinea + 5 > paginaLimite) nuevaPagina()
        const espacio = Math.floor((paginaLimite - y - 5) / altoLinea)
        const filasVisibles = Math.min(espacio, Math.max(...contenido.map(celda => celda.lineas.length)))
        const alto = 5 + filasVisibles * altoLinea
        doc.setDrawColor(borde)
        doc.rect(izquierda, y, ancho, alto)
        contenido.forEach((celda, i) => {
          if (!celda.lineas.length) return
          fuente(8, celda.color, celda.peso)
          doc.text(celda.lineas.splice(0, filasVisibles), columnas[i].x, y + 4.5, { lineHeightFactor: 1.3 })
        })
        y += alto
      }
    }
  }

  pies('Documento de uso interno · TEXTICODE S.A.S.', true)
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
    mostrarToast('No se pudo exportar a Excel: ' + err.message, 'danger')
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
.layout  { display: flex; min-height: 100vh; background: var(--th-page, #f1f5f9); position: relative; overflow: hidden; }
.content { flex: 1; padding: 28px 30px; position: relative; z-index: 1; }

.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: var(--th-brand, #1f3a52); top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: var(--th-info-solid, #2563eb); bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: var(--th-success-solid, #16a34a); top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(var(--th-brand-rgb, 31, 58, 82), 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--th-brand-rgb, 31, 58, 82), 0.04) 1px, transparent 1px); background-size: 40px 40px; }

/* TABLE BOX */
/* Filtros de la lista de reportes */
.filters-right { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.type-select {
  height: var(--control-height-sm); padding: 0 32px 0 12px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong); background: var(--color-surface);
  font: inherit; font-size: var(--text-sm); color: var(--color-text-secondary);
  appearance: none; -webkit-appearance: none; cursor: pointer; min-width: 150px; outline: none;
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}
.type-select:hover { border-color: var(--th-border-strong, #9ca3af); }
.type-select:focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: var(--color-text-muted); pointer-events: none; }
.table-box--reports .table-header-bar { flex-wrap: wrap; gap: var(--space-2); }

/* Gráfico + reportes en dos columnas (escritorio ancho) */
.reportes-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}
@media (max-width: 1180px) {
  .reportes-grid { grid-template-columns: 1fr; }
}
.table-box {
  background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xs); overflow: visible;
  animation: boxIn var(--duration-slow) var(--ease-out) both;
}
.table-box--chart   { animation-delay: 80ms; }
.table-box--reports { animation-delay: 140ms; display: flex; flex-direction: column; }
@keyframes boxIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--th-border, #f1f5f9); background: var(--th-surface-2, #f9fafb); border-radius: 14px 14px 0 0; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--th-text-2, #374151); }
.table-header-left svg { color: var(--th-heading, #1f3a52); }
.count-badge { background: var(--th-brand, #1f3a52); color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── CHART — con overflow visible para tooltip ── */
.table-box--chart { overflow: visible; }
.chart-header { gap: 12px; flex-wrap: wrap; background: transparent; }
.chart-header h2 { margin: 0; font-size: 15px; color: var(--color-text); }
.chart-header > span, .chart-empty { font-size: 13px; color: var(--color-text-muted); }
.chart-empty { margin: 20px; }
.chart-container {
  --chart-completadas: var(--th-info-solid, #2563eb);
  --chart-pendientes: #c3c9d2;
  padding: 20px 18px 14px;
}
:global(:root[data-theme="dark"]) .chart-container { --chart-completadas: #78a9d4; --chart-pendientes: #707b87; }
.chart {
  position: relative;
  display: flex;
  gap: clamp(4px, 1.5vw, 14px);
  height: 240px;
  padding-left: 42px;
  border-bottom: 1px solid var(--color-border);
}
.chart-scale, .chart-grid { position: absolute; inset-block: 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
.chart-scale { left: 0; width: 38px; text-align: right; color: var(--color-text-muted); font-size: 11px; font-variant-numeric: tabular-nums; line-height: 1; }
.chart-grid { left: 42px; right: 0; }
.chart-grid i { height: 0; }
.chart-grid i:not(:last-child) { border-top: 1px dashed var(--color-border); }
.bar-col { position: relative; display: flex; align-items: flex-end; flex: 1; min-width: 0; padding: 0; border: 0; background: transparent; color: var(--color-text); cursor: pointer; }
.bar-col:focus-visible { outline: 2px solid var(--color-focus, #2563eb); outline-offset: 3px; border-radius: 4px; }
.bar-stack {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: var(--bar-height);
  overflow: hidden;
  border-radius: 5px 5px 0 0;
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform var(--duration-slower) var(--ease-out) calc(var(--bar-i) * 40ms);
}
.bars-in .bar-stack { transform: scaleY(1); }
.bar-muted .bar-stack { opacity: .55; }
.bar-stack span { flex-basis: 0; min-height: 0; }
.bar-completadas { background: var(--chart-completadas); }
.bar-pendientes { background: var(--chart-pendientes); }
.bar-label { position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%); color: var(--color-text-muted); font-size: 12px; }
.bar-tooltip {
  position: absolute;
  bottom: calc(var(--bar-height) + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: grid;
  gap: 2px;
  min-width: max-content;
  padding: 8px 10px;
  border-radius: 8px;
  background: #1f2937;
  color: #f8fafc;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  box-shadow: var(--shadow-md);
  pointer-events: none;
}
.bar-tooltip--alta { top: 8px; bottom: auto; }
.bar-col:first-of-type .bar-tooltip { left: 0; transform: none; }
.bar-col:last-of-type:not(:first-of-type) .bar-tooltip { right: 0; left: auto; transform: none; }
.legend { display: flex; flex-wrap: wrap; gap: 10px 16px; margin: 30px 0 0; color: var(--th-text-2, #374151); font-size: 13px; }
.legend span { display: flex; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 3px; }

@media (prefers-reduced-motion: reduce) {
  .bar-stack { transform: none; transition: none; }
}

/* REPORT LIST — mismo diseño que la card de la app móvil */
.report-list-wrap { padding: var(--space-3) var(--space-4); max-height: 412px; overflow-y: auto; scrollbar-width: thin; }
@media (max-width: 1180px) { .report-list-wrap { max-height: none; } }
.report-list { display: flex; flex-direction: column; gap: var(--space-2); }
.report-card {
  display: flex; flex-direction: column; gap: var(--space-2);
  padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-lg);
  background: var(--color-bg-subtle);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
  animation: rowSlideIn var(--duration-base) var(--ease-out) both;
  animation-delay: calc(var(--row-i, 0) * 30ms);
}
.report-card:hover { border-color: var(--th-border-strong, #d1d5db); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.report-downloading { border-color: var(--th-info-border, #bfdbfe) !important; background: var(--th-info-soft, #eff6ff) !important; }
.report-exporting   { border-color: var(--th-success-border, #bbf7d0) !important; background: var(--th-success-soft, #f0fdf4) !important; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }

.report-card-top { display: flex; align-items: flex-start; gap: 10px; }
.report-icon-wrap { width: 36px; height: 36px; background: var(--th-surface-3, #f3f4f6); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.report-svg { width: 17px; height: 17px; color: var(--th-heading, #1f3a52); }
.report-info { flex: 1; min-width: 0; }
.report-title { font-size: 13px; font-weight: 700; color: var(--th-text, #111827); margin-bottom: 2px; }
.report-subtitle { font-size: var(--text-xs); color: var(--color-text-muted); }
.badge-generado { flex-shrink: 0; background: var(--th-success-soft, #dcfce7); color: var(--th-success, #15803d); font-size: 9px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }

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
.rep-btn-ver   { background: var(--th-brand, #1f3a52); border-color: var(--th-brand, #1f3a52); color: #fff; }
.rep-btn-ver:hover:not(:disabled)   { background: var(--th-brand-2, #2d5580); }
.rep-btn-pdf   { background: var(--th-danger-soft, #fef2f2); border-color: rgba(220,38,38,0.4); color: var(--th-danger, #b91c1c); }
.rep-btn-pdf:hover:not(:disabled)   { background: var(--th-danger-soft, #fee2e2); }
.rep-btn-excel { background: var(--th-success-soft, #dcfce7); border-color: rgba(22,163,74,0.4); color: var(--th-success, #15803d); }
.rep-btn-excel:hover:not(:disabled) { background: var(--th-success-soft, #bbf7d0); }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner { animation: spin 0.8s linear infinite; }

.empty-state { text-align: center; padding: 40px 20px; color: var(--color-text-muted); }
.empty-state svg { margin: 0 auto 12px; display: block; opacity: 0.4; }
.empty-state p { font-size: 14px; margin: 0; }

/* TRANSITIONS */
.tip-enter-active { transition: all 0.15s ease; }
.tip-leave-active { transition: all 0.1s ease; }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: translateX(-50%) translateY(4px); }
.report-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.report-leave-active { transition: opacity var(--duration-fast) var(--ease-in), transform var(--duration-fast) var(--ease-in); animation: none; }
.report-enter-from { opacity: 0; transform: translateY(-8px); }
.report-leave-to   { opacity: 0; transform: translateY(-8px); }

@media (max-width: 900px) {
  .type-select { width: 100%; }
}
</style>