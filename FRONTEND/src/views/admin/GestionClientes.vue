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
        titulo="Gestión de Clientes"
        subtitulo="Directorio y comprobantes de entrega"
        icono="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      >
        <template #acciones>
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input v-model="busqueda" type="search" placeholder="Buscar por nombre o correo"
              aria-label="Buscar clientes por nombre o correo"
              @focus="searchFocus = true" @blur="searchFocus = false">
          </div>
        </template>
      </PageHeader>

      <div class="kpi-grid">
        <KpiCard v-for="(k, i) in kpis" :key="k.label" v-bind="k" :cargando="cargando" :indice="i" />
      </div>

      <!-- LISTA CLIENTES -->
      <section class="table-box">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
            Lista de Clientes
            <span class="count-badge">{{ clientesFiltradosOrdenados.length }}</span>
          </div>
        </div>

        <div class="tx-table-scroll">
        <table>
          <thead>
            <tr>
              <th class="sortable" tabindex="0" :aria-sort="ariaSort('nombre')" @click="sortClientes('nombre')" @keydown.enter.prevent="sortClientes('nombre')" @keydown.space.prevent="sortClientes('nombre')">
                <span class="th-inner">
                  Nombre
                  <span class="sort-arrows" :class="{ 'sort-active': sortKeyClientes === 'nombre' }">
                    <svg v-if="sortKeyClientes !== 'nombre'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
                    <svg v-else-if="sortDirClientes === 1" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-up"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
                    <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-down"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                  </span>
                </span>
              </th>
              <th class="sortable" tabindex="0" :aria-sort="ariaSort('email')" @click="sortClientes('email')" @keydown.enter.prevent="sortClientes('email')" @keydown.space.prevent="sortClientes('email')">
                <span class="th-inner">
                  Correo
                  <span class="sort-arrows" :class="{ 'sort-active': sortKeyClientes === 'email' }">
                    <svg v-if="sortKeyClientes !== 'email'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
                    <svg v-else-if="sortDirClientes === 1" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-up"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
                    <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-down"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                  </span>
                </span>
              </th>
              <th>Teléfono</th>
              <th>Comprobantes</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(c, idx) in visibles" :key="c.id">
              <tr class="table-row client-row" :style="{ '--row-i': Math.min(idx, 12) }" @click="toggleCliente(c.id)">
                <td class="user-cell">
                  <div class="avatar-wrap">
                    <div class="avatar" :style="{ background: avatarBg(c.iniciales), color: avatarFg(c.iniciales) }">{{ c.iniciales }}</div>
                    <div class="avatar-online"></div>
                  </div>
                  <div class="user-info">
                    <span class="user-name">{{ c.nombre }}</span>
                  </div>
                </td>
                <td class="email-td">{{ c.email }}</td>
                <td>
                  <div class="phone-cell">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
                    </svg>
                    {{ c.telefono }}
                  </div>
                </td>
                <td>
                  <button type="button" class="comp-toggle"
                    :aria-expanded="!!clientesExpandido[c.id]"
                    :aria-controls="`comprobantes-${c.id}`"
                    :aria-label="`${clientesExpandido[c.id] ? 'Ocultar' : 'Ver'} los ${comprobantesDeCliente(c.id).length} comprobantes de ${c.nombre}`"
                    @click.stop="toggleCliente(c.id)">
                    <span class="comp-count-badge">
                      <svg aria-hidden="true" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                      </svg>
                      {{ comprobantesDeCliente(c.id).length }}
                    </span>
                    <svg aria-hidden="true" class="chevron" :class="{ 'chevron-open': clientesExpandido[c.id] }" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="clientesExpandido[c.id]" :id="`comprobantes-${c.id}`" class="client-detail-row">
                <td colspan="4">
                  <div class="client-comprobantes">
                    <div v-if="comprobantesDeCliente(c.id).length === 0" class="empty-comprobantes">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                      </svg>
                      Este cliente no tiene comprobantes registrados.
                    </div>
                    <div v-else class="comprobante-card" v-for="o in comprobantesDeCliente(c.id)" :key="o.id">
                      <div class="comp-icon">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                        </svg>
                      </div>
                      <div class="comp-info">
                        <span class="comp-title">Comprobante #{{ o.numero }}</span>
                        <span class="comp-date">Fecha: {{ o.fecha }}</span>
                        <span class="comp-status-badge">
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                          </svg>
                          Completada
                        </span>
                      </div>
                      <div class="comp-actions">
                        <button type="button" class="action-btn view-btn" title="Ver detalle" :aria-label="`Ver comprobante ${o.numero}`" @click.stop="verDetalle(o)">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"/>
                          </svg>
                        </button>
                        <button type="button" class="action-btn download-btn" title="Descargar PDF" :aria-label="`Descargar PDF del comprobante ${o.numero}`" @click.stop="descargarPDF(o)" :disabled="o.descargando">
                          <svg v-if="!o.descargando" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                          </svg>
                          <svg v-else class="spin" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        </div>
        <BasePagination
          v-model:pagina="pagina"
          v-model:por-pagina="porPagina"
          :total="clientesFiltradosOrdenados.length"
          etiqueta="clientes"
        />

        <EmptyState
          v-if="!cargando && clientesFiltradosOrdenados.length === 0"
          :icono="busqueda ? 'buscar' : 'vacio'"
          :titulo="busqueda ? 'Ningún cliente coincide' : 'Todavía no hay clientes'"
          :descripcion="busqueda ? 'Prueba con otro nombre o correo.' : 'Los clientes aparecen aquí cuando se crean en Gestión de Usuarios con el rol Cliente.'"
          compacto
        >
          <button v-if="busqueda" type="button" class="tx-btn tx-btn--secondary tx-btn--sm" @click="busqueda = ''">Limpiar búsqueda</button>
        </EmptyState>
      </section>

    </main>

    <ComprobanteEntrega
      :orden="ordenSeleccionada"
      :descargando="ordenSeleccionada?.descargando"
      @cerrar="ordenSeleccionada = null"
      @descargar="descargarPDF"
    />


  </div>
</template>

<script setup>
import ComprobanteEntrega from '../../components/ComprobanteEntrega.vue'
import { generarComprobantePdf, numeroComprobante } from '../../services/comprobanteEntrega'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getUsuarios, getComprobantes, getOrdenes } from '../../services/api.js'
import { useImpresion } from '../../composables/useImpresion'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import BasePagination from '../../components/base/BasePagination.vue'
import { usePagination } from '../../composables/usePagination'
import { useToast } from '../../composables/useToast'

const toast = useToast()
const impresion = useImpresion()

const busqueda = ref('')
const ordenSeleccionada = ref(null)
const searchFocus = ref(false)
const cargando = ref(true)

// Misma lógica que `fechaCorta` en comprobante_model.dart (móvil): d/m/yyyy,
// sin ceros a la izquierda. La web guardaba Fecha_Limite en formato ISO
// (yyyy-mm-dd), con el orden invertido respecto a la móvil.
function formatearFechaCorta(fechaLimite) {
  if (!fechaLimite) return 'Sin fecha'
  const d = new Date(fechaLimite)
  if (isNaN(d.getTime())) return fechaLimite
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`
}

const clientes = ref([])
const ordenes  = ref([])

async function cargarDatos() {
  cargando.value = true
  try {
    const [dataUsuarios, dataOrdenes, dataComprobantes] = await Promise.all([
      getUsuarios(), getOrdenes(), getComprobantes(),
    ])

    clientes.value = dataUsuarios
      .filter(u => (u.Nombre_Rol || u.Rol || '').toLowerCase() === 'cliente' && u.Estado === 'activo')
      .map(u => ({
        id: u.Id_Usuario,
        nombre: u.Nombre_Completo || u.Nombre_Usuario || '',
        email: u.Correo || '',
        telefono: u.Telefono || '—',
        estado: u.Estado === 'activo' ? 'Activo' : 'Inactivo',
        iniciales: (u.Nombre_Completo || u.Nombre_Usuario || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase(),
      }))

    const mapaClientes = {}
    clientes.value.forEach(c => { mapaClientes[c.id] = c })
    const mapaComp = {}
    dataComprobantes.forEach(c => { mapaComp[c.Id_Orden] = c })

    ordenes.value = dataOrdenes
      .filter(o => mapaClientes[o.Id_Cliente])
      .map(o => {
        const comp = mapaComp[o.Id_Orden]
        const estadoComp = comp?.Estado || o.Estado
        const esEntregado = estadoComp === 'Entregado' || o.Estado === 'Completada'
        const clienteInfo = mapaClientes[o.Id_Cliente] || {}
        return {
          id: o.Id_Orden,
          numero: numeroComprobante(o.Id_Orden, comp),
          clienteId: o.Id_Cliente,
          cliente: clienteInfo.nombre || `Cliente #${o.Id_Cliente}`,
          clienteEmail: clienteInfo.email || '—',
          clienteTel: clienteInfo.telefono || '—',
          fecha: formatearFechaCorta(o.Fecha_Limite),
          productos: o.Producto || o.Descripcion || '—',
          descripcion: o.Descripcion || o.Producto || '—',
          // Cantidad real del producto en la orden (viene del endpoint de
          // órdenes, que sí expone esta columna a diferencia del endpoint
          // de comprobantes que usa la app móvil — ver comprobante_model.dart).
          cantidad: o.Cantidad ?? 1,
          observaciones: o.Observaciones || '',
          // Etiqueta igual que en la móvil ("Completada" en vez de
          // "Entregado", ver comprobante_pdf_service.dart → estadoLabel).
          estado: esEntregado ? 'Completada' : 'Pendiente',
          estadoClass: esEntregado ? 'success' : 'danger',
          estadoPedido: o.Estado,
          fechaLimite: o.Fecha_Limite,

          flash: false,
          descargando: false,
        }
      })
  } catch (e) {
    console.error('Error cargando datos de clientes:', e)
    clientes.value = []
    ordenes.value = []
  } finally {
    cargando.value = false
  }
}

// ── Ordenamiento ──
const sortKeyClientes = ref('nombre')
const sortDirClientes = ref(1)

function sortClientes(key) {
  sortKeyClientes.value === key ? sortDirClientes.value *= -1 : (sortKeyClientes.value = key, sortDirClientes.value = 1)
}

const clientesFiltradosOrdenados = computed(() => {
  const q = busqueda.value.toLowerCase()
  const lista = clientes.value.filter(c =>
    c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  )
  return [...lista].sort((a, b) => {
    const k = sortKeyClientes.value
    return (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * sortDirClientes.value
  })
})


// ── Desplegable de comprobantes por cliente ──
const { pagina, porPagina, visibles, reiniciar } = usePagination(clientesFiltradosOrdenados, { porPagina: 10, clave: 'clientes' })
watch([busqueda, sortKeyClientes, sortDirClientes], reiniciar)

function ariaSort(key) {
  if (sortKeyClientes.value !== key) return 'none'
  return sortDirClientes.value === 1 ? 'ascending' : 'descending'
}

const clientesExpandido = reactive({})
function toggleCliente(id) {
  clientesExpandido[id] = !clientesExpandido[id]
}
const ICON_USERS = 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'
const ICON_DOC   = 'm9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z'
const ICON_CLOCK = 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'

const kpis = computed(() => [
  { label: 'Clientes activos',     valor: clientes.value.length, icono: ICON_USERS, tono: 'brand' },
  { label: 'Comprobantes emitidos', valor: ordenes.value.filter(o => o.estado === 'Completada').length, icono: ICON_DOC, tono: 'success' },
  { label: 'Órdenes pendientes',   valor: ordenes.value.filter(o => o.estado !== 'Completada').length, icono: ICON_CLOCK, tono: 'warning' },
])

function comprobantesDeCliente(id) {
  return ordenes.value.filter(o => o.clienteId === id && o.estado === 'Completada')
}

const avatarBgPalette = ['#dbeafe','#fce7f3','#d1fae5','#fef3c7','#ede9fe','#fee2e2','#e0f2fe']
const avatarFgPalette = ['#1d4ed8','#9d174d','#065f46','#92400e','#5b21b6','#991b1b','#0369a1']
function avatarBg(iniciales) { return avatarBgPalette[(iniciales?.charCodeAt(0)||0) % avatarBgPalette.length] }
function avatarFg(iniciales) { return avatarFgPalette[(iniciales?.charCodeAt(0)||0) % avatarFgPalette.length] }

function verDetalle(orden) { ordenSeleccionada.value = orden }

function showToast(msg) {
  // Mensajes de error de descarga → toast global
  if (/error/i.test(msg)) toast.error(msg)
  else toast.success(msg)
}

// ── DESCARGA PDF REAL ──
async function descargarPDF(orden) {
  if (orden.descargando) return
  orden.descargando = true
  const salida = impresion.iniciar({ tipo: 'comprobante', numero: orden.numero, detalle: orden.cliente })
  try {
    const doc = await generarComprobantePdf(orden)
    await salida
    doc.save('comprobante-' + orden.numero + '.pdf')
    impresion.terminar()
    showToast('Comprobante ' + orden.numero + ' descargado correctamente')
  } catch (err) {
    console.error('Error generando PDF:', err)
    impresion.fallar()
    showToast('Error al generar el PDF. Inténtalo de nuevo.')
  } finally {
    orden.descargando = false
  }
}

onMounted(cargarDatos)
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

/* HERO */
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.search-box { display: flex; align-items: center; gap: 8px; height: var(--control-height); padding: 0 12px; background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); transition: border-color var(--duration-fast), box-shadow var(--duration-fast); width: 240px; }
.search-box.search-focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.search-ico { width: 16px; height: 16px; color: var(--color-text-muted); flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: transparent; }
.search-box input::placeholder { color: var(--color-text-muted); }

/* TABLE BOX */
.table-box { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-xs); margin-bottom: var(--space-6); overflow: hidden; animation: tableIn var(--duration-slow) var(--ease-out) 120ms both; }
@keyframes tableIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--th-border, #f1f5f9); background: var(--th-surface-2, #f9fafb); }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--th-text-2, #374151); }
.table-header-left svg { color: var(--th-heading, #1f3a52); }
.count-badge { background: var(--th-brand, #1f3a52); color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

table { width: 100%; border-collapse: collapse; }
thead { background: var(--th-surface-2, #f9fafb); }
th { text-align: left; font-size: 12px; font-weight: 600; color: var(--th-text-muted, #6b7280); padding: 13px 18px; white-space: nowrap; }

/* ── SORT ANIMADO ── */
.sortable { cursor: pointer; user-select: none; transition: color 0.15s; }
.sortable:hover { color: var(--th-heading, #1f3a52); }
.th-inner { display: inline-flex; align-items: center; gap: 6px; }
.sort-arrows { display: inline-flex; align-items: center; transition: all 0.2s ease; }
.sort-neutral { opacity: 0.35; color: var(--color-text-muted); transition: opacity 0.2s, transform 0.2s; }
.sortable:hover .sort-neutral { opacity: 0.55; }
.sort-up, .sort-down { color: var(--th-heading, #1f3a52); animation: sortIconPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes sortIconPop { from { transform: scale(0.6) rotate(-15deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }

td { padding: 14px 18px; font-size: 14px; color: var(--th-text-2, #374151); border-top: 1px solid var(--th-border, #f1f5f9); }
.table-row { transition: background 0.18s; animation: rowSlideIn var(--duration-base) var(--ease-out) both; animation-delay: calc(var(--row-i, 0) * 25ms); }
.table-row:hover td { background: var(--th-surface-2, #f8fafc); }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes rowFlash { 0% { background: var(--th-success-soft, #d1fae5); } 100% { background: transparent; } }
.row-flash { animation: rowFlash 1.2s ease; }
.row-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.row-leave-active { transition: opacity var(--duration-fast) var(--ease-in); animation: none; }
.row-enter-from, .row-leave-to { opacity: 0; }

/* USER CELL */
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; transition: transform 0.2s; }
.avatar:hover { transform: scale(1.12); }
.avatar-online { position: absolute; bottom: 1px; right: 1px; width: 9px; height: 9px; border-radius: 50%; background: var(--th-success-solid, #22c55e); border: 1.5px solid white; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 14px; color: var(--th-text, #111827); }
.user-handle { font-size: 12px; color: var(--th-text-muted, #6b7280); }
.email-td { color: var(--th-text-muted, #6b7280); font-size: 13px; }
.phone-cell { display: flex; align-items: center; gap: 6px; color: var(--th-text-2, #374151); }

.badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.success { background: var(--th-success-soft, #dcfce7); color: var(--th-success, #15803d); }
.danger  { background: var(--th-danger-soft, #fee2e2); color: var(--th-danger, #b91c1c); }

/* CLIENTE — DESPLEGABLE DE COMPROBANTES */
.client-row { cursor: pointer; }
.client-row:focus-visible { outline: var(--focus-outline); outline-offset: -2px; }
.sortable:focus-visible { outline: var(--focus-outline); outline-offset: -2px; }
.comp-toggle { display: flex; align-items: center; gap: 8px; padding: 4px 6px; margin: -4px -6px; border: none; border-radius: var(--radius-md); background: none; font: inherit; color: inherit; cursor: pointer; transition: background var(--duration-fast) var(--ease-standard); }
.comp-toggle:hover { background: var(--color-surface-hover); }
.comp-count-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--th-info-soft, #eef2ff); color: var(--th-heading, #1f3a52); font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.chevron { color: var(--color-text-muted); transition: transform 0.2s; flex-shrink: 0; }
.chevron-open { transform: rotate(180deg); color: var(--th-heading, #1f3a52); }

.client-detail-row td { padding: 0 18px 16px; border-top: none; background: var(--th-surface, #fbfcfe); }
.client-comprobantes { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.empty-comprobantes { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: var(--th-surface-2, #f8fafc); border-radius: 12px; color: var(--color-text-muted); font-size: 12px; }

.comprobante-card { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--th-surface, white); border: 1px solid var(--th-border, #eef1f5); border-radius: 12px; }
.comp-icon { width: 36px; height: 36px; border-radius: 50%; background: var(--th-info-soft, #eef2ff); color: var(--th-heading, #1f3a52); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.comp-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.comp-title { font-size: 13px; font-weight: 700; color: var(--th-text, #111827); }
.comp-date { font-size: 11px; color: var(--th-text-muted, #6b7280); }
.comp-status-badge { display: inline-flex; align-items: center; gap: 4px; width: fit-content; background: var(--th-success-soft, #dcfce7); color: var(--th-success, #15803d); font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px; margin-top: 2px; }
.comp-actions { display: flex; gap: 8px; flex-shrink: 0; }

.order-num-pill { display: inline-block; background: var(--th-surface-3, #f1f5f9); color: var(--th-heading, #1f3a52); font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; transition: background 0.15s; }
tr:hover .order-num-pill { background: var(--th-info-soft, #e0ecff); color: var(--th-link, #1d4ed8); }

/* ACCIONES */
.actions { display: flex; gap: 8px; align-items: center; }
.action-btn { width: 32px; height: 32px; border-radius: 7px; border: none; background: var(--th-brand, #1f3a52); display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.15s; -webkit-font-smoothing: antialiased; }
.action-btn svg { pointer-events: none; filter: drop-shadow(0 0 0.3px rgba(255,255,255,0.4)); }
.action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.view-btn:hover:not(:disabled)     { background: var(--th-brand-2, #2d5580); transform: scale(1.07); }
.download-btn:hover:not(:disabled) { background: var(--th-info-solid, #1d4ed8); transform: scale(1.07); }

/* EMPTY */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 44px 0; color: var(--color-text-muted); font-size: 14px; }

/* SPINNER */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.72s linear infinite; }

</style>