<template>
  <div style="display:flex;min-height:100vh;background:var(--th-page, #f1f5f9);position:relative">

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
            <input
              v-model="busqueda"
              type="search"
              placeholder="Buscar por producto o número"
              aria-label="Buscar órdenes por producto o número"
              @focus="searchFocus = true"
              @blur="searchFocus = false"
            >
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
              :class="o.cardClass"
              :style="{ '--row-i': Math.min(idx, 10) }"
            >
              <div class="order-stripe" :class="o.estadoClass"></div>
              <div class="order-body">

                <!-- CABECERA CON BADGES + ENTREGA ESTIMADA -->
                <div class="order-top-row">
                  <div>
                    <div class="order-head">
                      <span class="order-num-pill">#{{ o.id }}</span>
                      <span class="badge" :class="o.badgeClass">{{ o.estado }}</span>
                      <span class="badge prio" :class="o.prioridadClass">{{ o.prioridad }}</span>
                    </div>
                    <h2 class="order-title">{{ o.nombre }}</h2>
                    <p class="order-desc">{{ o.descripcion }}</p>
                  </div>

                  <div class="delivery-box">
                    <span class="delivery-label">Entrega estimada</span>
                    <span class="delivery-date" :class="o.fechaClass">{{ o.fechaEntrega }}</span>
                  </div>
                </div>

                <!-- METADATOS Y MATERIALES COMPLETOS -->
                <div class="order-meta">
                  <div class="meta-item meta-materiales">
                    <span class="meta-label">Materiales</span>
                    <div class="materials-list">
                      <span v-for="m in o.materiales" :key="m.id" class="material-chip">
                        {{ m.nombre }}<template v-if="m.cantidad != null"> · {{ m.cantidad }}<template v-if="m.unidad"> {{ m.unidad }}</template></template>
                      </span>
                      <span v-if="!o.materiales.length" class="meta-value">—</span>
                    </div>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Cantidad pedida</span>
                    <span class="meta-value">{{ o.cantidad }} uds.</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Prendas realizadas</span>
                    <span class="meta-value prendas-val" :class="{ 'prendas-completas': o.unidadesRealizadas >= o.cantidad }">
                      {{ o.unidadesRealizadas }}
                      <span class="prendas-total">/ {{ o.cantidad }}</span>
                    </span>
                  </div>
                </div>

                <!-- LÍNEA DE TIEMPO POR FASE REAL -->
                <div class="timeline-wrap">
                  <ol class="timeline" :aria-label="'Fases de la orden ' + o.id">
                    <li
                      v-for="(p, i) in o.pasos"
                      :key="i"
                      class="step"
                      :class="[
                        'step-' + p.estado,
                        { 'step-late': p.estado === 'actual' && o.estado === 'Retrasada' }
                      ]"
                    >
                      <span class="step-dot">
                        <svg v-if="p.estado === 'hecho'" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke-width="3.2" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                        </svg>
                        <span v-else-if="p.estado === 'actual'" class="step-core"></span>
                      </span>
                      <span class="step-name">{{ p.nombre }}</span>
                      <span class="step-sub">{{ p.detalle }}</span>
                    </li>
                  </ol>
                </div>

                <!-- BANNER ESTADO -->
                <div v-if="o.estado === 'Completada'" class="estado-banner completada">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Orden completada — todas las {{ o.cantidad }} prendas han sido fabricadas
                </div>
                <div v-else-if="o.estado === 'En Proceso'" class="estado-banner proceso">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <template v-if="o.faseActual">
                    Tu pedido está en <strong>{{ o.faseActual }}</strong> ({{ o.unidadesRealizadas }} de {{ o.cantidad }} prendas fabricadas)
                  </template>
                  <template v-else>
                    En producción — faltan {{ o.cantidad - o.unidadesRealizadas }} prenda(s) por fabricar
                  </template>
                </div>
                <div v-else-if="o.estado === 'Retrasada'" class="estado-banner retrasada">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
                  </svg>
                  <template v-if="o.faseActual">
                    Entrega retrasada — fase actual: <strong>{{ o.faseActual }}</strong>, en seguimiento prioritario
                  </template>
                  <template v-else>
                    Orden con entrega retrasada — producción en seguimiento prioritario
                  </template>
                </div>

                <!-- PIE DE TARJETA: AVANCE DE PRENDAS Y BOTÓN COMPROBANTE -->
                <div class="order-footer">
                  <span class="footer-count">{{ o.unidadesRealizadas }} de {{ o.cantidad }} prendas fabricadas</span>
                  <button
                    class="btn-pdf"
                    :class="{ 'btn-pdf-disabled': o.estado !== 'Completada' }"
                    :disabled="o.estado !== 'Completada' || descargando[o.id]"
                    :title="o.estado !== 'Completada' ? 'Disponible cuando la orden esté completada' : 'Ver comprobante de entrega'"
                    @click="comprobanteSeleccionado = o.comprobante"
                  >
                    <svg v-if="!descargando[o.id]" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                    </svg>
                    <span v-else class="btn-pdf-spinner"></span>
                    {{ descargando[o.id] ? 'Generando...' : 'Ver comprobante' }}
                  </button>
                </div>

              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

    </main>

    <ComprobanteEntrega
      :orden="comprobanteSeleccionado"
      :descargando="descargando[comprobanteSeleccionado?.id]"
      @cerrar="comprobanteSeleccionado = null"
      @descargar="descargarPDF"
    />
  </div>
</template>

<script setup>
import ComprobanteEntrega from '../../components/ComprobanteEntrega.vue'
import { generarComprobantePdf, numeroComprobante } from '../../services/comprobanteEntrega'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import SkeletonCard from '../../components/base/SkeletonCard.vue'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { getComprobantesPorCliente } from '../../services/api'
import { useToast } from '../../composables/useToast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const auth                    = useAuthStore()
const toast                   = useToast()
const comprobanteSeleccionado = ref(null)
const busqueda                = ref('')
const filtroEstado            = ref('')
const pedidos                 = ref([])
const cargando                = ref(false)
const errorMsg                = ref('')
const searchFocus             = ref(false)
const descargando             = ref({})

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

function fechaCorta(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '')
}

// ── Línea de tiempo por fase real de la orden ──
function construirPasos(o, fasesOrden) {
  const cantidad   = Number(o.Cantidad) || 0
  const completada = o.Estado === 'Completada'
  const pasos      = [{ nombre: 'Recibido', detalle: fechaCorta(o.Fecha_Creacion), estado: 'hecho' }]
  let faseActual   = ''

  if (fasesOrden.length === 0) {
    pasos.push({
      nombre: 'En producción',
      detalle: completada ? '' : 'en curso',
      estado: completada ? 'hecho' : 'actual',
    })
  } else {
    const fases     = [...fasesOrden].sort((a, b) => Number(a.Numero_Fase) - Number(b.Numero_Fase))
    const completas = fases.map(f =>
      f.Estado_Fase === 'Completada' || (Number(f.Operarios) > 0 && Number(f.Completados) >= Number(f.Operarios))
    )
    const idxActual = completada ? -1 : completas.findIndex(c => !c)

    fases.forEach((f, i) => {
      const nombre = (f.Descripcion_Fase || '').trim() || `Fase ${f.Numero_Fase}`
      let estado  = 'pendiente'
      let detalle = ''

      if (completada || completas[i]) {
        estado  = 'hecho'
        detalle = fechaCorta(f.Fecha_Completada)
      } else if (i === idxActual) {
        estado     = 'actual'
        detalle    = `${Math.min(Number(f.Hecho) || 0, cantidad)} de ${cantidad} prendas`
        faseActual = nombre
      }
      pasos.push({ nombre, detalle, estado })
    })
  }

  pasos.push({
    nombre: 'Entregado',
    detalle: completada ? fechaCorta(o.Fecha_Entrega || o.Fecha_Limite) : '',
    estado: completada ? 'hecho' : 'pendiente',
  })

  return { pasos, faseActual }
}

async function cargarOrdenes() {
  if (!auth.idUsuario) return
  cargando.value = true
  errorMsg.value = ''

  try {
    const res = await fetch(`${BASE}/ordenes/cliente/${auth.idUsuario}`, { headers: auth.authHeader() })
    if (!res.ok) throw new Error(`Error ${res.status}`)

    const [data, comprobantes, detalle] = await Promise.all([
      res.json(),
      getComprobantesPorCliente(auth.idUsuario).catch(() => []),
      fetch(`${BASE}/orden-operario/cliente/${auth.idUsuario}`, { headers: auth.authHeader() })
        .then(r => (r.ok ? r.json() : { fases: [], materiales: [] }))
        .catch(() => ({ fases: [], materiales: [] })),
    ])

    const porOrden = new Map((Array.isArray(comprobantes) ? comprobantes : []).map(comp => [String(comp.Id_Orden), comp]))

    const fasesPorOrden = new Map()
    for (const f of detalle.fases || []) {
      const k = String(f.Id_Orden)
      if (!fasesPorOrden.has(k)) fasesPorOrden.set(k, [])
      fasesPorOrden.get(k).push(f)
    }

    const materialesPorOrden = new Map()
    for (const m of detalle.materiales || []) {
      const k = String(m.Id_Orden)
      if (!materialesPorOrden.has(k)) materialesPorOrden.set(k, [])
      materialesPorOrden.get(k).push({
        id: m.Id_Material,
        nombre: m.Nombre_Material,
        cantidad: m.Cantidad_Usada,
        unidad: m.Unidad,
      })
    }

    pedidos.value = data.map(o => {
      const realizadas = o.Unidades_Realizadas ?? 0
      const cantidad   = o.Cantidad ?? 0
      const comp       = porOrden.get(String(o.Id_Orden))

      // Prioriza lista completa de materiales de la orden; fallback al material principal
      let materiales = materialesPorOrden.get(String(o.Id_Orden)) || []
      if (!materiales.length && Array.isArray(o.Materiales) && o.Materiales.length) {
        materiales = o.Materiales.map(m => ({
          id: m.Id_Material,
          nombre: m.Nombre_Material,
          cantidad: m.Cantidad_Usada,
          unidad: m.Unidad,
        }))
      }
      if (!materiales.length && o.NombreMaterial) {
        materiales = [{ id: o.Id_Material, nombre: o.NombreMaterial, cantidad: null, unidad: null }]
      }

      const { pasos, faseActual } = construirPasos(o, fasesPorOrden.get(String(o.Id_Orden)) || [])

      return {
        id: o.Id_Orden,
        comprobante: {
          id: o.Id_Orden,
          numero: numeroComprobante(o.Id_Orden, comp),
          cliente: auth.usuario?.Nombre_Completo || o.Cliente,
          clienteEmail: auth.usuario?.Correo,
          clienteTel: auth.usuario?.Telefono,
          productos: o.Producto || o.Descripcion || 'Sin nombre',
          descripcion: o.Descripcion,
          detalles: [
            'Prioridad: ' + (o.Prioridad || 'Media'),
            'Materiales: ' + (materiales.length ? materiales.map(m => m.nombre).join(', ') : '—'),
            'Unidades realizadas: ' + realizadas,
          ],
          cantidad,
          observaciones: o.Observaciones,
          fechaLimite: o.Fecha_Limite,
          estado: o.Estado,
          estadoClass: o.Estado === 'Completada' ? 'success' : 'danger',
        },
        nombre:             o.Producto || o.Descripcion || 'Sin nombre',
        descripcion:        o.Descripcion || '',
        cantidad,
        realizadas,
        materiales,
        unidadesRealizadas: realizadas,
        pasos,
        faseActual,
        fechaEntrega:       o.Fecha_Limite
          ? new Date(o.Fecha_Limite).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
          : '—',
        estado:             o.Estado,
        prioridad:          o.Prioridad || 'Media',
        badgeClass:         { 'En Proceso': 'badge-process', 'Completada': 'badge-done', 'Retrasada': 'badge-delayed' }[o.Estado] || 'badge-delayed',
        estadoClass:        { 'En Proceso': 'stripe-blue', 'Completada': 'stripe-green', 'Retrasada': 'stripe-red' }[o.Estado] || 'stripe-red',
        cardClass:          { 'En Proceso': 'card-proceso', 'Completada': 'card-completada', 'Retrasada': 'card-retrasada' }[o.Estado] || 'card-retrasada',
        prioridadClass:     { 'Alta': 'prio-alta', 'Media': 'prio-media', 'Baja': 'prio-baja' }[o.Prioridad] || 'prio-baja',
        fechaClass:         o.Estado === 'Completada' ? 'fecha-ok' : o.Estado === 'Retrasada' ? 'fecha-late' : '',
      }
    })
  } catch (e) {
    errorMsg.value = `No se pudieron cargar las órdenes: ${e.message}`
  } finally {
    cargando.value = false
  }
}

onMounted(cargarOrdenes)

async function descargarPDF(orden) {
  if (orden.estado !== 'Completada' || descargando.value[orden.id]) return
  descargando.value[orden.id] = true
  try {
    const doc = await generarComprobantePdf(orden)
    doc.save('orden-' + orden.id + '.pdf')
  } catch (e) {
    toast.error('No se pudo generar el PDF: ' + e.message)
  } finally {
    delete descargando.value[orden.id]
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
.orb-1 { width: 600px; height: 600px; background: var(--th-brand, #1f3a52); top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: var(--th-info-solid, #2563eb); bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: var(--th-success-solid, #16a34a); top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(var(--th-brand-rgb, 31, 58, 82), 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--th-brand-rgb, 31, 58, 82), 0.04) 1px, transparent 1px); background-size: 40px 40px; }

.main { flex: 1; padding: 28px 30px; position: relative; z-index: 1; min-width: 0; }

/* ── BARRA DE BÚSQUEDA ── */
.search-box { display: flex; align-items: center; gap: 8px; height: var(--control-height); padding: 0 12px; background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); transition: border-color var(--duration-fast), box-shadow var(--duration-fast); width: 240px; }
.search-box.search-focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.search-ico { width: 16px; height: 16px; color: var(--color-text-muted); flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: transparent; }
.search-box input::placeholder { color: var(--color-text-muted); }

/* ── CONTENEDOR ÓRDENES ── */
.orders-container { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-xs); overflow: hidden; animation: tableIn var(--duration-slow) var(--ease-out) 120ms both; }
@keyframes tableIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--th-border, #f1f5f9); background: var(--th-surface-2, #f9fafb); }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--th-text-2, #374151); }
.table-header-left svg { color: var(--th-heading, #1f3a52); }
.count-badge { background: var(--th-brand, #1f3a52); color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── ORDER CARDS CON SOMBREADO POR ESTADO (estilo TareasAsignadas) ── */
.orders-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(560px, 1fr)); gap: var(--space-3); padding: var(--space-4); align-items: start; }
.orders-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(560px, 1fr)); gap: var(--space-3); }
.order-card {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--th-border, #e5e7eb);
  border-radius: 12px;
  background: var(--th-surface, #ffffff);
  animation: cardIn var(--duration-base) var(--ease-out) both;
  animation-delay: calc(var(--row-i, 0) * 40ms);
  transition: box-shadow 0.2s, transform 0.2s;
}
.order-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
@keyframes cardIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }

/* Degradado suave según el color de cada estado */
.order-card.card-proceso    { background: linear-gradient(135deg, var(--th-info-soft, #eff6ff) 0%, var(--th-surface, #ffffff) 60%); border-color: var(--th-info-border, #bfdbfe); }
.order-card.card-completada { background: linear-gradient(135deg, var(--th-success-soft, #f0fdf4) 0%, var(--th-surface, #ffffff) 60%); border-color: var(--th-success-border, #bbf7d0); }
.order-card.card-retrasada  { background: linear-gradient(135deg, var(--th-danger-soft, #fef2f2) 0%, var(--th-surface, #ffffff) 60%); border-color: var(--th-danger-border, #fecaca); }

.order-stripe { width: 5px; flex-shrink: 0; }
.stripe-blue  { background: var(--th-info-solid, #2563eb); }
.stripe-green { background: var(--th-success-solid, #16a34a); }
.stripe-red   { background: var(--th-danger-solid, #dc2626); }

.order-body { flex: 1; min-width: 0; padding: 22px 24px; }

.order-top-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
.order-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.order-num-pill { font-size: 13px; font-weight: 700; color: var(--th-heading, #1f3a52); background: var(--th-surface-3, #f1f5f9); padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; transition: background 0.15s, color 0.15s; }
.order-card:hover .order-num-pill { background: var(--th-info-soft, #e0ecff); color: var(--th-link, #1d4ed8); }

.badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.badge-process { background: var(--th-info-soft, #dbeafe); color: var(--th-link, #1d4ed8); }
.badge-done    { background: var(--th-success-soft, #dcfce7); color: var(--th-success, #15803d); }
.badge-delayed { background: var(--th-danger-soft, #fee2e2); color: var(--th-danger, #b91c1c); }
.prio.prio-alta  { background: var(--th-danger-soft, #fee2e2); color: var(--th-danger, #b91c1c); }
.prio.prio-media { background: var(--th-warning-soft, #fef3c7); color: var(--th-warning, #92400e); }
.prio.prio-baja  { background: var(--th-surface-3, #f3f4f6); color: var(--th-text-2, #4b5563); }

.order-title { font-size: 17px; font-weight: 700; color: var(--th-text, #111827); margin-bottom: 4px; }
.order-desc  { font-size: 14px; color: var(--th-text-muted, #6b7280); margin: 0; }

/* Fecha estimada arriba a la derecha */
.delivery-box { text-align: right; flex-shrink: 0; }
.delivery-label { display: block; font-size: 11px; color: var(--color-text-muted); margin-bottom: 2px; }
.delivery-date { font-size: 16px; font-weight: 800; color: var(--th-heading, #1f3a52); }
.delivery-date.fecha-ok { color: var(--th-success, #15803d); }
.delivery-date.fecha-late { color: var(--th-danger, #dc2626); }

/* Metadatos y materiales */
.order-meta { display: grid; grid-template-columns: repeat(2, auto); justify-content: start; gap: 12px 32px; margin-bottom: 20px; }
.meta-materiales { grid-column: 1 / -1; }
.meta-label  { font-size: 12px; color: var(--color-text-muted); display: block; margin-bottom: 4px; }
.meta-value  { font-size: 14px; font-weight: 600; color: var(--th-text, #111827); }
.prendas-val { display: inline-flex; align-items: baseline; gap: 4px; font-size: 18px; font-weight: 800; color: var(--th-link, #1d4ed8); }
.prendas-val.prendas-completas { color: var(--th-success, #15803d); }
.prendas-total { font-size: 14px; font-weight: 500; color: var(--color-text-muted); }

.materials-list { display: flex; flex-wrap: wrap; gap: 6px; }
.material-chip { display: inline-flex; padding: 3px 9px; border-radius: 999px; background: var(--th-surface-2, #eef2f6); color: var(--th-text-2, #334155); font-size: 12px; font-weight: 600; border: 1px solid var(--th-border, #e2e8f0); }

/* ── LÍNEA DE TIEMPO POR FASE ── */
.timeline-wrap { margin: 4px 0 18px; padding: 6px 0 2px; overflow-x: auto; }
.timeline { display: flex; list-style: none; margin: 0; padding: 0; min-width: min-content; }
.step { position: relative; flex: 1 1 0; min-width: 96px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; }

/* Línea conectora entre nodos */
.step + .step::before {
  content: '';
  position: absolute;
  top: 10px;
  left: -50%;
  right: 50%;
  height: 3px;
  border-radius: 2px;
  background: var(--th-border, #d7dee6);
}
.step-hecho + .step::before,
.step + .step-hecho::before,
.step + .step-actual::before {
  background: var(--th-brand, #1f3a52);
}

.step-dot {
  position: relative;
  z-index: 1;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--th-surface, #fff);
  border: 2px solid var(--th-border, #cbd5e1);
  color: #fff;
  margin-bottom: 6px;
}
.step-hecho .step-dot { background: var(--th-brand, #1f3a52); border-color: var(--th-brand, #1f3a52); }
.step-actual .step-dot { border-color: var(--th-brand, #1f3a52); background: var(--th-surface, #fff); }
.step-core { width: 8px; height: 8px; border-radius: 50%; background: var(--th-brand, #1f3a52); }

.step-late .step-dot { border-color: var(--th-danger-solid, #dc2626); }
.step-late .step-core { background: var(--th-danger-solid, #dc2626); }

.step-name { font-size: 13px; font-weight: 700; color: var(--th-text, #111827); line-height: 1.25; padding: 0 4px; }
.step-pendiente .step-name { font-weight: 600; color: var(--th-text-muted, #94a3b8); }
.step-sub { font-size: 11px; color: var(--th-text-muted, #64748b); min-height: 14px; }
.step-late .step-sub { color: var(--th-danger, #b91c1c); font-weight: 600; }

/* ESTADO BANNERS */
.estado-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-top: 4px; }
.estado-banner.completada { background: var(--th-success-soft, #f0fdf4); color: var(--th-success, #15803d); border: 1px solid var(--th-success-border, #bbf7d0); }
.estado-banner.proceso    { background: var(--th-info-soft, #eff6ff); color: var(--th-link, #1d4ed8); border: 1px solid var(--th-info-border, #bfdbfe); }
.estado-banner.retrasada  { background: var(--th-danger-soft, #fef2f2); color: var(--th-danger, #b91c1c); border: 1px solid var(--th-danger-border, #fecaca); }
.estado-banner svg { flex-shrink: 0; }

/* ── FOOTER Y BOTÓN COMPROBANTE ── */
.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--th-border, #e5e7eb);
  flex-wrap: wrap;
}
.footer-count { font-size: 13px; color: var(--th-text-muted, #6b7280); font-weight: 500; }

.btn-pdf {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 16px;
  background: var(--th-brand, #1f3a52); color: white; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
}
.btn-pdf:hover:not(:disabled) { background: #16283a; box-shadow: 0 4px 12px rgba(var(--th-brand-rgb, 31, 58, 82), 0.25); transform: translateY(-1px); }
.btn-pdf:active:not(:disabled) { transform: translateY(0); }
.btn-pdf-disabled, .btn-pdf:disabled {
  background: var(--th-surface-3, #e5e7eb); color: var(--th-text-muted, #9ca3af); cursor: not-allowed;
  box-shadow: none; transform: none;
}
.btn-pdf-spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
}

/* ── ESTADOS VACÍOS / CARGA ── */
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 24px; color: var(--color-text-muted); font-size: 14px; }
.empty-state-box { background: var(--th-surface, white); border: 1px solid var(--th-border, #e5e7eb); border-radius: 14px; padding: 40px; text-align: center; color: var(--th-text-muted, #6b7280); font-size: 14px; position: relative; z-index: 1; }

/* ── TRANSITIONS ── */
.row-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.row-leave-active { transition: opacity var(--duration-fast) var(--ease-in); animation: none; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 1100px) { .orders-list, .orders-skeleton { grid-template-columns: 1fr; } }
@media (max-width: 800px)  {
  .main { padding: 20px 16px; }
  .order-top-row { flex-direction: column; }
  .delivery-box { text-align: left; }
  .order-meta { grid-template-columns: 1fr 1fr; }
  .search-box { width: 100%; }
  .order-body { padding: 18px 16px; }
}
</style>