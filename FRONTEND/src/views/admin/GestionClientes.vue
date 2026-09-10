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
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span v-for="(ch, i) in 'Gestión de Clientes'" :key="i"
                class="title-char"
                :style="{ animationDelay: animVisible ? `${i * 35}ms` : '9999s' }">{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Directorio y comprobantes de entrega</p>
          </div>
        </div>
        <div class="hero-search-wrap">
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input v-model="busqueda" type="text" placeholder="Buscar clientes..."
              @focus="searchFocus = true" @blur="searchFocus = false">
          </div>
        </div>
      </div>

      <!-- LISTA CLIENTES -->
      <section class="table-box" :class="{ 'box-visible': animVisible }" style="transition-delay: 200ms">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
            Lista de Clientes
            <span class="count-badge">{{ clientesFiltradosOrdenados.length }}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="sortable" @click="sortClientes('nombre')">
                <span class="th-inner">
                  Nombre
                  <span class="sort-arrows" :class="{ 'sort-active': sortKeyClientes === 'nombre' }">
                    <svg v-if="sortKeyClientes !== 'nombre'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
                    <svg v-else-if="sortDirClientes === 1" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-up"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
                    <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-down"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                  </span>
                </span>
              </th>
              <th class="sortable" @click="sortClientes('email')">
                <span class="th-inner">
                  Email
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
            <template v-for="(c, idx) in clientesFiltradosOrdenados" :key="c.id">
              <tr class="table-row client-row" :style="{ animationDelay: `${idx * 45}ms` }" @click="toggleCliente(c.id)">
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
                  <div class="comp-toggle">
                    <span class="comp-count-badge">
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                      </svg>
                      {{ comprobantesDeCliente(c.id).length }}
                    </span>
                    <svg class="chevron" :class="{ 'chevron-open': clientesExpandido[c.id] }" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </div>
                </td>
              </tr>
              <tr v-if="clientesExpandido[c.id]" class="client-detail-row">
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
                        <button class="action-btn view-btn" title="Ver detalle" @click.stop="verDetalle(o)">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"/>
                          </svg>
                        </button>
                        <button class="action-btn download-btn" title="Descargar PDF" @click.stop="descargarPDF(o)" :disabled="o.descargando">
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

        <div v-if="clientesFiltradosOrdenados.length === 0" class="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" width="40" height="40">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/>
          </svg>
          <p>No se encontraron clientes</p>
        </div>
      </section>

    </main>

    <!-- MODAL DETALLE COMPROBANTE PROFESIONAL -->
    <Transition name="modal">
      <div v-if="ordenSeleccionada" class="modal" @click.self="ordenSeleccionada = null">
        <div class="cp-wrap">
          <div class="cp-head">
            <div class="cp-head-left">
              <img src="data:image/png;base64,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" class="cp-logo-img" alt="Texticode logo" />
              <div>
                <div class="cp-empresa-nombre">TEXTICODE</div>
                <div class="cp-empresa-datos">Bogotá, Colombia &nbsp;|&nbsp; texticode@correo.com &nbsp;|&nbsp; +57 300 000 0000</div>
              </div>
            </div>
            <div class="cp-head-right">
              <div class="cp-doc-titulo">COMPROBANTE DE ENTREGA</div>
              <div class="cp-doc-numero">N.° {{ ordenSeleccionada.numero }}</div>
            </div>
          </div>

          <div class="cp-linea-doble"></div>

          <div class="cp-info-row">
            <div class="cp-info-bloque">
              <div class="cp-label">CLIENTE</div>
              <div class="cp-valor-grande">{{ ordenSeleccionada.cliente }}</div>
              <div class="cp-valor-sub" v-if="ordenSeleccionada.clienteEmail !== '—'">{{ ordenSeleccionada.clienteEmail }}</div>
              <div class="cp-valor-sub" v-if="ordenSeleccionada.clienteTel !== '—'">Tel: {{ ordenSeleccionada.clienteTel }}</div>
            </div>
            <div class="cp-info-bloque cp-info-bloque--center">
              <div class="cp-label">FECHA DE EMISIÓN</div>
              <div class="cp-valor-grande">{{ fechaHoy }}</div>
              <div class="cp-label" style="margin-top:14px">FECHA DE ENTREGA</div>
              <div class="cp-valor-grande">{{ ordenSeleccionada.fecha }}</div>
            </div>
            <div class="cp-info-bloque cp-info-bloque--right">
              <div class="cp-label">ESTADO DEL PEDIDO</div>
              <div class="cp-estado-caja" :class="ordenSeleccionada.estadoClass">{{ ordenSeleccionada.estado }}</div>
              <div class="cp-label" style="margin-top:14px">ORDEN DE REFERENCIA</div>
              <div class="cp-valor-grande">#{{ ordenSeleccionada.numero }}</div>
            </div>
          </div>

          <div class="cp-linea-simple"></div>

          <table class="cp-tabla">
            <thead>
              <tr>
                <th class="cp-th cp-th--num">#</th>
                <th class="cp-th">Descripción del producto / servicio</th>
                <th class="cp-th cp-th--centro">Cantidad</th>
                <th class="cp-th cp-th--right">Estado entrega</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in ordenSeleccionada.productosList" :key="i" class="cp-tr">
                <td class="cp-td cp-td--num">{{ String(i + 1).padStart(2, '0') }}</td>
                <td class="cp-td">
                  <div class="cp-prod-nombre">{{ p }}</div>
                  <div class="cp-prod-desc" v-if="ordenSeleccionada.descripcion && ordenSeleccionada.descripcion !== p">{{ ordenSeleccionada.descripcion }}</div>
                </td>
                <td class="cp-td cp-td--centro">{{ ordenSeleccionada.cantidad }}</td>
                <td class="cp-td cp-td--right">
                  <span class="cp-entrega-badge" :class="ordenSeleccionada.estadoClass">
                    {{ ordenSeleccionada.estado === 'Entregado' ? '✓ Entregado' : '⏳ Pendiente' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="cp-linea-simple"></div>

          <div class="cp-bottom">
            <div class="cp-observaciones">
              <div class="cp-label">OBSERVACIONES</div>
              <div class="cp-obs-caja">{{ ordenSeleccionada.observaciones || 'Ninguna observación registrada para este pedido.' }}</div>
            </div>
            <div class="cp-firmas">
              <div class="cp-firma-bloque">
                <div class="cp-firma-linea"></div>
                <div class="cp-firma-nombre">Entregado por</div>
                <div class="cp-firma-cargo">TEXTICODE S.A.S.</div>
              </div>
              <div class="cp-firma-bloque">
                <div class="cp-firma-linea"></div>
                <div class="cp-firma-nombre">Recibido por</div>
                <div class="cp-firma-cargo">{{ ordenSeleccionada.cliente }}</div>
              </div>
            </div>
          </div>

          <div class="cp-pie">
            <span>Este documento es un comprobante oficial de entrega emitido por TEXTICODE.</span>
            <span>Generado el {{ fechaHoy }}</span>
          </div>

          <div class="cp-acciones">
            <button class="btn-secondary" @click="ordenSeleccionada = null">Cerrar</button>
            <button class="btn-primary btn-icon-row" @click="descargarPDF(ordenSeleccionada)" :disabled="ordenSeleccionada.descargando">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              {{ ordenSeleccionada.descargando ? 'Generando...' : 'Descargar PDF' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { getUsuarios, getComprobantes, getOrdenes } from '../../services/api.js'

const busqueda = ref('')
const ordenSeleccionada = ref(null)
const animVisible = ref(false)
const searchFocus = ref(false)
const toastMsg = ref('')
const cargando = ref(true)
const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

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
          numero: String(o.Id_Orden).padStart(4, '0'),
          clienteId: o.Id_Cliente,
          cliente: clienteInfo.nombre || `Cliente #${o.Id_Cliente}`,
          clienteEmail: clienteInfo.email || '—',
          clienteTel: clienteInfo.telefono || '—',
          fecha: o.Fecha_Limite?.split('T')[0] || o.Fecha_Limite || '—',
          productos: o.Producto || o.Descripcion || '—',
          descripcion: o.Descripcion || o.Producto || '—',
          cantidad: o.Cantidad || 1,
          observaciones: o.Observaciones || '',
          estado: esEntregado ? 'Entregado' : 'Pendiente',
          estadoClass: esEntregado ? 'success' : 'danger',
          productosList: [o.Producto || o.Descripcion || '—'],
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
const clientesExpandido = reactive({})
function toggleCliente(id) {
  clientesExpandido[id] = !clientesExpandido[id]
}
function comprobantesDeCliente(id) {
  return ordenes.value.filter(o => o.clienteId === id && o.estado === 'Entregado')
}

const avatarBgPalette = ['#dbeafe','#fce7f3','#d1fae5','#fef3c7','#ede9fe','#fee2e2','#e0f2fe']
const avatarFgPalette = ['#1d4ed8','#9d174d','#065f46','#92400e','#5b21b6','#991b1b','#0369a1']
function avatarBg(iniciales) { return avatarBgPalette[(iniciales?.charCodeAt(0)||0) % avatarBgPalette.length] }
function avatarFg(iniciales) { return avatarFgPalette[(iniciales?.charCodeAt(0)||0) % avatarFgPalette.length] }

function verDetalle(orden) { ordenSeleccionada.value = orden }

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

// ── DESCARGA PDF REAL ──
async function descargarPDF(orden) {
  orden.descargando = true
  try {
    // Cargar jsPDF si no existe
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
      })
    }

    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W = doc.internal.pageSize.width
    const ML = 14
    const MR = W - 14

    const AZUL   = [15, 34, 54]
    const BLANCO = [255, 255, 255]
    const GRIS_T = [75, 85, 99]
    const NEGRO  = [17, 24, 39]
    const GRIS_BG= [249, 250, 251]
    const GRIS_LN= [243, 244, 246]

    // Cabecera azul
    doc.setFillColor(...AZUL)
    doc.rect(0, 0, W, 32, 'F')

    // Logo en cabecera PDF - tamaño acorde al encabezado
    const logoB64 = 'data:image/png;base64,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'
    doc.addImage(logoB64, 'PNG', ML, 4, 20, 20)

    doc.setTextColor(...BLANCO)
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('TEXTICODE', ML + 24, 15)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.setTextColor(147, 197, 253)
    doc.text('Bogotá, Colombia  ·  texticode@correo.com  ·  +57 300 000 0000', ML + 24, 22)

    doc.setTextColor(...BLANCO)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('COMPROBANTE DE ENTREGA', MR, 14, { align: 'right' })
    doc.setFontSize(16)
    doc.text(`N.° ${orden.numero}`, MR, 24, { align: 'right' })

    // Línea divisora
    doc.setDrawColor(...AZUL)
    doc.setLineWidth(0.3)
    doc.line(ML, 34, MR, 34)

    // Bloque info cliente
    let y = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRIS_T)
    doc.text('CLIENTE', ML, y)
    y += 5
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NEGRO)
    doc.text(orden.cliente, ML, y)
    y += 5
    if (orden.clienteEmail !== '—') {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRIS_T)
      doc.text(orden.clienteEmail, ML, y)
      y += 4
    }
    if (orden.clienteTel !== '—') {
      doc.text('Tel: ' + orden.clienteTel, ML, y)
      y += 4
    }

    // Fechas (columna derecha)
    const col2X = W / 2 + 10
    let y2 = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('FECHA DE EMISIÓN', col2X, y2)
    y2 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text(fechaHoy, col2X, y2)
    y2 += 8
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('FECHA DE ENTREGA', col2X, y2)
    y2 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text(orden.fecha, col2X, y2)

    // Estado + Orden de referencia (columna derecha)
    const col3X = MR
    let y3 = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('ESTADO DEL PEDIDO', col3X, y3, { align: 'right' })
    y3 += 6
    const esEntregado = orden.estadoClass === 'success'
    const badgeW = 30
    const badgeX = col3X - badgeW
    doc.setFillColor(esEntregado ? 209 : 255, esEntregado ? 250 : 237, esEntregado ? 229 : 213)
    doc.roundedRect(badgeX, y3 - 4.5, badgeW, 7, 1.5, 1.5, 'F')
    doc.setTextColor(esEntregado ? 6 : 146, esEntregado ? 95 : 64, esEntregado ? 70 : 14)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text(orden.estado, badgeX + badgeW / 2, y3, { align: 'center' })
    y3 += 10
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('ORDEN DE REFERENCIA', col3X, y3, { align: 'right' })
    y3 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text('#' + orden.numero, col3X, y3, { align: 'right' })

    y = Math.max(y, y2, y3) + 10

    // Linea separadora
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2)
    doc.line(ML, y, MR, y)
    y += 6

    // Encabezado tabla igual que el modal
    const colNumW = 14
    const colEstW = 38
    const colCantW = 28
    const colDescW = MR - ML - colNumW - colCantW - colEstW
    const colX = [ML, ML + colNumW, ML + colNumW + colDescW, ML + colNumW + colDescW + colCantW]
    doc.setFillColor(...AZUL)
    doc.rect(ML, y, MR - ML, 8, 'F')
    doc.setTextColor(...BLANCO); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
    doc.text('#', colX[0] + 2, y + 5.5)
    doc.text('DESCRIPCION DEL PRODUCTO / SERVICIO', colX[1] + 2, y + 5.5)
    doc.text('CANTIDAD', colX[2] + colCantW / 2, y + 5.5, { align: 'center' })
    doc.text('ESTADO ENTREGA', colX[3] + colEstW / 2, y + 5.5, { align: 'center' })
    y += 8

    // Filas tabla con descripcion debajo del nombre
    orden.productosList.forEach((prod, i) => {
      const desc = orden.descripcion && orden.descripcion !== prod ? orden.descripcion : null
      const rowH = desc ? 14 : 10
      const bgColor = i % 2 === 0 ? BLANCO : GRIS_LN
      doc.setFillColor(...bgColor)
      doc.rect(ML, y, MR - ML, rowH, 'F')
      doc.setTextColor(156, 163, 175); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.text(String(i + 1).padStart(2, '0'), colX[0] + 2, y + 6.5)
      doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'bold')
      doc.text(prod, colX[1] + 2, y + 6.5, { maxWidth: colDescW - 4 })
      if (desc) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRIS_T)
        doc.text(desc, colX[1] + 2, y + 11, { maxWidth: colDescW - 4 })
      }
      doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      doc.text(String(orden.cantidad), colX[2] + colCantW / 2, y + 6.5, { align: 'center' })
      const eEnt = orden.estadoClass === 'success'
      const tbadgeW = 28
      const tbadgeX = colX[3] + (colEstW - tbadgeW) / 2
      doc.setFillColor(eEnt ? 209 : 255, eEnt ? 250 : 237, eEnt ? 229 : 213)
      doc.roundedRect(tbadgeX, y + 2.5, tbadgeW, 6, 1, 1, 'F')
      doc.setTextColor(eEnt ? 6 : 146, eEnt ? 95 : 64, eEnt ? 70 : 14)
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
      doc.text(eEnt ? 'Entregado' : 'Pendiente', tbadgeX + tbadgeW / 2, y + 7, { align: 'center' })
      y += rowH
    })

    y += 8

    // Observaciones
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('OBSERVACIONES', ML, y)
    y += 5
    doc.setFillColor(...GRIS_BG)
    doc.rect(ML, y, (MR - ML) / 2 - 4, 18, 'F')
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO); doc.setFontSize(9)
    doc.text(orden.observaciones || 'Ninguna observación registrada.', ML + 2, y + 5, { maxWidth: (MR - ML) / 2 - 8 })

    // Firmas
    const firmaX1 = (MR - ML) / 2 + ML + 10
    const firmaX2 = MR - 28
    y += 20
    doc.setLineWidth(0.4); doc.setDrawColor(55, 65, 81)
    doc.line(firmaX1, y, firmaX1 + 44, y)
    doc.line(firmaX2 - 6, y, firmaX2 + 22, y)
    y += 4
    doc.setFontSize(8); doc.setTextColor(...GRIS_T)
    doc.text('Entregado por', firmaX1 + 22, y, { align: 'center' })
    doc.text('Recibido por', firmaX2 + 8, y, { align: 'center' })
    y += 4
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NEGRO); doc.setFontSize(8.5)
    doc.text('TEXTICODE S.A.S.', firmaX1 + 22, y, { align: 'center' })
    doc.text(orden.cliente, firmaX2 + 8, y, { align: 'center' })

    // Pie de página
    const pH = doc.internal.pageSize.height
    doc.setFillColor(...AZUL)
    doc.rect(0, pH - 12, W, 12, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(147, 197, 253)
    doc.text('Documento de uso oficial · TEXTICODE S.A.S.', ML, pH - 5)
    doc.text(`Generado el ${fechaHoy}`, MR, pH - 5, { align: 'right' })

    doc.save(`comprobante-${orden.numero}.pdf`)
    showToast(`Comprobante ${orden.numero} descargado correctamente`)
  } catch (err) {
    console.error('Error generando PDF:', err)
    showToast('Error al generar el PDF')
  } finally {
    orden.descargando = false
  }
}

onMounted(async () => {
  await cargarDatos()
  setTimeout(() => {
    animVisible.value = true
  }, 80)
})
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
.hero-search-wrap { flex-shrink: 0; }
.search-box { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: white; border: 1.5px solid #e5e7eb; border-radius: 10px; transition: border-color 0.2s, box-shadow 0.2s; width: 280px; }
.search-box.search-focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.search-ico { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font-size: 14px; color: #374151; background: transparent; }
.search-box input::placeholder { color: #9ca3af; }

/* TABLE BOX */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; margin-bottom: 28px; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; padding: 13px 18px; white-space: nowrap; }

/* ── SORT ANIMADO ── */
.sortable { cursor: pointer; user-select: none; transition: color 0.15s; }
.sortable:hover { color: #1f3a52; }
.th-inner { display: inline-flex; align-items: center; gap: 6px; }
.sort-arrows { display: inline-flex; align-items: center; transition: all 0.2s ease; }
.sort-neutral { opacity: 0.35; color: #9ca3af; transition: opacity 0.2s, transform 0.2s; }
.sortable:hover .sort-neutral { opacity: 0.55; }
.sort-up, .sort-down { color: #1f3a52; animation: sortIconPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes sortIconPop { from { transform: scale(0.6) rotate(-15deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }

td { padding: 14px 18px; font-size: 14px; color: #374151; border-top: 1px solid #f1f5f9; }
.table-row { transition: background 0.18s; animation: rowSlideIn 0.35s ease both; }
.table-row:hover td { background: #f8fafc; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes rowFlash { 0% { background: #d1fae5; } 100% { background: transparent; } }
.row-flash { animation: rowFlash 1.2s ease; }
.row-enter-active, .row-leave-active { transition: opacity 0.3s ease; }
.row-enter-from, .row-leave-to { opacity: 0; }

/* USER CELL */
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; transition: transform 0.2s; }
.avatar:hover { transform: scale(1.12); }
.avatar-online { position: absolute; bottom: 1px; right: 1px; width: 9px; height: 9px; border-radius: 50%; background: #22c55e; border: 1.5px solid white; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 14px; color: #111827; }
.user-handle { font-size: 12px; color: #6b7280; }
.email-td { color: #6b7280; font-size: 13px; }
.phone-cell { display: flex; align-items: center; gap: 6px; color: #374151; }

.badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.success { background: #dcfce7; color: #15803d; }
.danger  { background: #fee2e2; color: #b91c1c; }

/* CLIENTE — DESPLEGABLE DE COMPROBANTES */
.client-row { cursor: pointer; }
.comp-toggle { display: flex; align-items: center; gap: 8px; }
.comp-count-badge { display: inline-flex; align-items: center; gap: 5px; background: #eef2ff; color: #1f3a52; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.chevron { color: #9ca3af; transition: transform 0.2s; flex-shrink: 0; }
.chevron-open { transform: rotate(180deg); color: #1f3a52; }

.client-detail-row td { padding: 0 18px 16px; border-top: none; background: #fbfcfe; }
.client-comprobantes { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.empty-comprobantes { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #f8fafc; border-radius: 12px; color: #9ca3af; font-size: 12px; }

.comprobante-card { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: white; border: 1px solid #eef1f5; border-radius: 12px; }
.comp-icon { width: 36px; height: 36px; border-radius: 50%; background: #eef2ff; color: #1f3a52; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.comp-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.comp-title { font-size: 13px; font-weight: 700; color: #111827; }
.comp-date { font-size: 11px; color: #6b7280; }
.comp-status-badge { display: inline-flex; align-items: center; gap: 4px; width: fit-content; background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px; margin-top: 2px; }
.comp-actions { display: flex; gap: 8px; flex-shrink: 0; }

.order-num-pill { display: inline-block; background: #f1f5f9; color: #1f3a52; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; transition: background 0.15s; }
tr:hover .order-num-pill { background: #e0ecff; color: #2563eb; }

/* ACCIONES */
.actions { display: flex; gap: 8px; align-items: center; }
.action-btn { width: 32px; height: 32px; border-radius: 7px; border: none; background: #1f3a52; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.15s; -webkit-font-smoothing: antialiased; }
.action-btn svg { pointer-events: none; filter: drop-shadow(0 0 0.3px rgba(255,255,255,0.4)); }
.action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.view-btn:hover:not(:disabled)     { background: #2d5580; transform: scale(1.07); }
.download-btn:hover:not(:disabled) { background: #1d4ed8; transform: scale(1.07); }

/* EMPTY */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 44px 0; color: #9ca3af; font-size: 14px; }

/* SPINNER */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.72s linear infinite; }

/* ══ MODAL COMPROBANTE ══ */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.cp-wrap { background: #fff; width: 700px; max-width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 4px; box-shadow: 0 8px 40px rgba(0,0,0,.18); font-family: 'Georgia', 'Times New Roman', serif; }
.cp-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 32px; background: #0f2236; }
.cp-head-left { display: flex; align-items: center; gap: 14px; }
.cp-logo-img { width: 50px; height: 50px; object-fit: contain; flex-shrink: 0; }
.cp-empresa-nombre { font-size: 20px; font-weight: 700; letter-spacing: 3px; color: #fff; font-family: Arial, sans-serif; }
.cp-empresa-datos  { font-size: 11px; color: #93c5fd; margin-top: 3px; font-family: Arial, sans-serif; }
.cp-head-right { text-align: right; }
.cp-doc-titulo { font-size: 13px; font-weight: 600; letter-spacing: 2px; color: #93c5fd; font-family: Arial, sans-serif; text-transform: uppercase; }
.cp-doc-numero { font-size: 26px; font-weight: 700; color: #fff; font-family: Arial, sans-serif; margin-top: 4px; }
.cp-linea-doble { border: none; border-top: 3px double #1f3b57; margin: 0 32px; }
.cp-linea-simple { border: none; border-top: 1px solid #d1d5db; margin: 0 32px; }
.cp-info-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; padding: 22px 32px; border-bottom: 1px solid #e5e7eb; }
.cp-info-bloque { padding-right: 20px; }
.cp-info-bloque--center { border-left: 1px solid #e5e7eb; padding-left: 20px; border-right: 1px solid #e5e7eb; padding-right: 20px; }
.cp-info-bloque--right  { padding-left: 20px; padding-right: 0; }
.cp-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; font-family: Arial, sans-serif; margin-bottom: 5px; }
.cp-valor-grande { font-size: 14px; color: #111827; line-height: 1.4; }
.cp-valor-sub    { font-size: 12px; color: #6b7280; margin-top: 2px; font-family: Arial, sans-serif; }
.cp-estado-caja { display: inline-block; padding: 5px 14px; border-radius: 2px; font-size: 12px; font-weight: 700; font-family: Arial, sans-serif; letter-spacing: .5px; margin-top: 4px; }
.cp-estado-caja.success { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.cp-estado-caja.danger  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
.cp-tabla { width: 100%; border-collapse: collapse; margin: 0; }
.cp-th { padding: 10px 12px 10px 32px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #fff; background: #1f3b57; text-transform: uppercase; font-family: Arial, sans-serif; text-align: left; }
.cp-th--num { width: 44px; padding-left: 32px; }
.cp-th--centro { text-align: center; }
.cp-th--right { text-align: right; padding-right: 32px; }
.cp-tr { border-bottom: 1px solid #f3f4f6; }
.cp-tr:nth-child(even) { background: #f9fafb; }
.cp-td { padding: 13px 12px 13px 32px; font-size: 13px; color: #374151; vertical-align: top; }
.cp-td--num    { color: #9ca3af; font-size: 12px; width: 44px; font-family: Arial, sans-serif; }
.cp-td--centro { text-align: center; font-family: Arial, sans-serif; }
.cp-td--right  { text-align: right; padding-right: 32px; }
.cp-prod-nombre { font-weight: 600; color: #111827; }
.cp-prod-desc   { font-size: 12px; color: #6b7280; margin-top: 3px; font-family: Arial, sans-serif; }
.cp-entrega-badge { font-size: 11px; font-weight: 600; font-family: Arial, sans-serif; padding: 3px 10px; border-radius: 2px; }
.cp-entrega-badge.success { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.cp-entrega-badge.danger  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
.cp-bottom { display: flex; gap: 32px; padding: 22px 32px 28px; }
.cp-observaciones { flex: 1; }
.cp-obs-caja { margin-top: 8px; padding: 12px; border: 1px solid #e5e7eb; font-size: 12px; color: #374151; line-height: 1.6; min-height: 64px; font-family: Arial, sans-serif; }
.cp-firmas { display: flex; gap: 28px; align-items: flex-end; flex-shrink: 0; }
.cp-firma-bloque { text-align: center; }
.cp-firma-linea  { width: 130px; border-top: 1px solid #374151; margin-bottom: 6px; }
.cp-firma-nombre { font-size: 11px; color: #374151; font-family: Arial, sans-serif; }
.cp-firma-cargo  { font-size: 11px; font-weight: 600; color: #1f3b57; font-family: Arial, sans-serif; }
.cp-pie { background: #1f3b57; padding: 10px 32px; display: flex; justify-content: space-between; font-size: 10px; color: #93c5fd; font-family: Arial, sans-serif; letter-spacing: .3px; }
.cp-acciones { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 32px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
.btn-primary { background: #1f3b57; color: white; padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; transition: background .2s; font-size: 14px; }
.btn-primary:hover:not(:disabled) { background: #2d5580; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #f3f4f6; color: #374151; padding: 8px 14px; border-radius: 8px; border: 1px solid #e5e7eb; cursor: pointer; transition: background .2s; font-size: 14px; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-icon-row { display: flex; align-items: center; gap: 8px; }

/* TOAST */
.toast { position: fixed; bottom: 28px; right: 28px; background: #111827; color: white; padding: 12px 18px; border-radius: 10px; font-size: 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.2); z-index: 2000; }

/* TRANSITIONS */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
</style>