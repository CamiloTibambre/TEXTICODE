<template>
  <div class="layout">
    <AppSidebar rol="admin" />
    <main class="content">

      <!-- FONDO DECORATIVO: orbes + grid dentro del mismo contenedor (igual que GestionClientes) -->
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
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Gestión de Inventario'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: animVisible ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Controla stock, niveles y alertas de materiales en tiempo real</p>
          </div>
        </div>
        <div class="hero-controls-wrap">
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              v-model="busqueda"
              type="text"
              placeholder="Buscar materiales..."
              @focus="searchFocus = true"
              @blur="searchFocus = false"
            >
          </div>
          <div class="select-wrapper">
            <select v-model="categoriaFiltro" class="category-select">
              <option value="">Todas las categorías</option>
              <option>Telas</option>
              <option>Hilos</option>
              <option>Accesorios</option>
            </select>
            <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
            </svg>
          </div>
          <button class="btn-primary" @click="abrirModal(null)">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            Agregar Material
          </button>
        </div>
      </div>

      <!-- STATS CARDS con contadores animados -->
      <div class="cards" :class="{ 'cards-visible': animVisible }">
        <div
          v-for="(s, i) in statCards"
          :key="i"
          class="stat-card"
          :style="{ transitionDelay: animVisible ? `${i * 80}ms` : '0ms' }"
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

      <!-- ALERTAS con ícono pulsante -->
      <Transition name="slide-down">
        <div class="alert-box" v-if="alertas.length">
          <h3>
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="alert-icon pulse">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
            Alertas de Inventario
            <span class="alert-count">{{ alertas.length }}</span>
          </h3>
          <TransitionGroup name="row">
            <div v-for="a in alertas" :key="a.id" class="alert-item">
              <div class="alert-item-left">
                <div class="alert-dot" :class="a.estadoClass"></div>
                <div class="alert-info">
                  <span class="alert-name">{{ a.nombre }}</span>
                  <span class="alert-cliente">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                    </svg>
                    {{ a.cliente || 'Sin cliente asignado' }}
                  </span>
                </div>
              </div>
              <div class="alert-item-right">
                <span class="alert-stock">{{ a.stock }} {{ a.unidad }}</span>
                <span class="badge" :class="a.estadoClass">{{ a.estado }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </Transition>

      <!-- TABLA DE INVENTARIO -->
      <section class="table-box" :class="{ 'box-visible': animVisible }" style="transition-delay: 200ms">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
            </svg>
            Inventario de Materiales
            <span class="count-badge">{{ materialesFiltrados.length }}</span>
          </div>
        </div>

        <div v-if="cargandoVista" class="table-skeleton">
          <div v-for="i in 6" :key="i" class="table-skeleton-row">
            <span class="skeleton-line sk-user"></span>
            <span class="skeleton-line sk-tag"></span>
            <span class="skeleton-line sk-stock"></span>
            <span class="skeleton-line sk-date"></span>
          </div>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th class="sortable" @click="doSort('nombre')">Material <span class="sort-icon">{{ sIcon('nombre') }}</span></th>
              <th class="sortable" @click="doSort('categoria')">Categoría <span class="sort-icon">{{ sIcon('categoria') }}</span></th>
              <th class="sortable" @click="doSort('stock')">Stock <span class="sort-icon">{{ sIcon('stock') }}</span></th>
              <th>Min/Max</th>
              <th>Nivel</th>
              <th>Cliente</th>
              <th class="sortable" @click="doSort('estado')">Estado <span class="sort-icon">{{ sIcon('estado') }}</span></th>
              <th class="sortable" @click="doSort('fecha')">Última Act. <span class="sort-icon">{{ sIcon('fecha') }}</span></th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <TransitionGroup name="row">
              <tr
                v-for="(m, idx) in materialesFiltrados"
                :key="m.id"
                class="table-row"
                :class="{ 'row-eliminating': m.eliminando }"
                :style="{ animationDelay: `${idx * 45}ms` }"
              >
                <td>
                  <div class="material-cell">
                    <div class="material-icon-bg">
                      <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="14" height="14">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
                      </svg>
                    </div>
                    <strong>{{ m.nombre }}</strong>
                  </div>
                </td>
                <td><span class="cat-pill">{{ m.categoria }}</span></td>
                <td>
                  <span class="stock-cell">
                    <svg v-if="m.estadoClass === 'success'" class="trend-icon trend-up" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"/>
                    </svg>
                    <svg v-else-if="m.estadoClass === 'warning'" class="trend-icon trend-warning" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
                    </svg>
                    <svg v-else class="trend-icon trend-down" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181"/>
                    </svg>
                    <strong>{{ m.stock }}</strong>&nbsp;{{ m.unidad }}
                  </span>
                </td>
                <td class="minmax">{{ m.minimo }} / {{ m.maximo }}</td>
                <td class="nivel-td">
                  <div class="nivel-bar-wrap" :title="`${stockPct(m)}% del máximo`">
                    <div class="nivel-bar">
                      <div class="nivel-fill" :class="m.estadoClass" :style="{ width: (barWidths[m.id] ?? 0) + '%' }"></div>
                    </div>
                    <span class="nivel-pct">{{ stockPct(m) }}%</span>
                  </div>
                </td>
                <td>{{ m.cliente || '—' }}</td>
                <td><span class="badge" :class="m.estadoClass">{{ m.estado }}</span></td>
                <td class="fecha">{{ m.fecha }}</td>
                <td class="actions">
                  <button class="action-btn view-btn" title="Editar" @click="abrirModal(m)">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                    </svg>
                  </button>
                  <button class="action-btn download-btn" title="Eliminar" @click="eliminar(m)">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </TransitionGroup>
          </tbody>
        </table>

        <div v-if="materialesFiltrados.length === 0 && !cargandoVista" class="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" width="40" height="40">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
          </svg>
          <p>No se encontraron materiales</p>
        </div>
      </section>

    </main>

    <!-- MODAL AGREGAR / EDITAR -->
    <Transition name="modal">
      <div v-if="modalVisible" class="modal" @click.self="cerrarModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ editando ? 'Editar Material' : 'Agregar Nuevo Material' }}</h2>
            <button class="close" @click="cerrarModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nombre del Material</label>
              <input v-model="form.nombre" type="text" placeholder="Ej: Tela de Algodón" :class="{ 'input-error': errores.nombre }">
              <span v-if="errores.nombre" class="error-msg">{{ errores.nombre }}</span>
            </div>
            <div class="form-group">
              <label>Categoría</label>
              <select v-model="form.categoria" :class="{ 'input-error': errores.categoria }">
                <option disabled value="">Selecciona categoría</option>
                <option>Telas</option><option>Hilos</option><option>Accesorios</option>
              </select>
              <span v-if="errores.categoria" class="error-msg">{{ errores.categoria }}</span>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Stock Actual</label>
                <input v-model.number="form.stock" type="number" min="0">
              </div>
              <div class="form-group">
                <label>Unidad</label>
                <select v-model="form.unidad" :class="{ 'input-error': errores.unidad }">
                  <option disabled value="">Selecciona unidad</option>
                  <option>Metros</option>
                  <option>Centímetros</option>
                  <option>Unidades</option>
                  <option>Rollos</option>
                  <option>Kilos</option>
                  <option>Gramos</option>
                  <option>Piezas</option>
                </select>
                <span v-if="errores.unidad" class="error-msg">{{ errores.unidad }}</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Stock Mínimo</label>
                <input v-model.number="form.minimo" type="number" min="0">
              </div>
              <div class="form-group">
                <label>Stock Máximo</label>
                <input v-model.number="form.maximo" type="number" min="0">
              </div>
            </div>
            <div class="form-group" v-if="form.maximo > 0">
              <label>Vista previa del nivel</label>
              <div class="nivel-bar modal-preview-bar">
                <div
                  class="nivel-fill"
                  :class="calcularEstado(form).estadoClass"
                  :style="{ width: Math.min(100, Math.round((form.stock / form.maximo) * 100)) + '%', transition: 'width .4s ease' }"
                ></div>
              </div>
              <span style="font-size:12px;color:#6b7280;margin-top:5px;display:block;">
                {{ Math.min(100, Math.round((form.stock / form.maximo) * 100)) }}% del máximo —
                <strong :style="{ color: estadoColor(calcularEstado(form).estadoClass) }">{{ calcularEstado(form).estado }}</strong>
              </span>
            </div>
            <div class="form-group">
              <label>Cliente</label>
              <select v-model="form.Id_Cliente">
                <option value="">Sin cliente</option>
                <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn-primary" @click="guardar" :disabled="guardando">
              <span v-if="guardando">Guardando...</span>
              <span v-else>{{ editando ? 'Guardar Cambios' : 'Agregar Material' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- CONFIRM ELIMINAR -->
    <Transition name="modal">
      <div v-if="confirmItem" class="modal" @click.self="confirmItem = null">
        <div class="confirm-box">
          <div class="confirm-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#dc2626" width="36" height="36">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
          </div>
          <h3>¿Eliminar material?</h3>
          <p>Se eliminará <strong>{{ confirmItem.nombre }}</strong>. Esta acción no se puede deshacer.</p>
          <div class="confirm-btns">
            <button class="btn-secondary" @click="confirmItem = null">Cancelar</button>
            <button class="btn-danger" @click="confirmarEliminar">Sí, eliminar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast" :class="toastType">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="18" height="18">
          <path v-if="toastType === 'toast-success'" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
        </svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { getMateriales, crearMaterial, actualizarMaterial, eliminarMaterial, getUsuarios } from '../../services/api.js'
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'

// ── Datos ────────────────────────────────────────────────────
const materiales = ref([])
const clientes   = ref([])

const busqueda        = ref('')
const categoriaFiltro = ref('')
const modalVisible    = ref(false)
const editando        = ref(false)
const guardando       = ref(false)
const animVisible     = ref(false)  // mismo nombre que GestionClientes
const searchFocus     = ref(false)  // mismo nombre que GestionClientes
const cargandoVista   = ref(true)
const toastMsg        = ref('')
const toastType       = ref('toast-success')
const confirmItem     = ref(null)

const form = ref({
  id: null, nombre: '', categoria: '', stock: 0,
  unidad: '', minimo: 0, maximo: 0, cliente: '', Id_Cliente: null
})

// ── Barras de nivel animadas ──────────────────────────────────
const barWidths = ref({})

function animateBars() {
  const init = {}
  materiales.value.forEach(m => { init[m.id] = 0 })
  barWidths.value = init
  requestAnimationFrame(() => requestAnimationFrame(() => {
    materiales.value.forEach((m, i) => {
      setTimeout(() => {
        barWidths.value = { ...barWidths.value, [m.id]: stockPct(m) }
      }, i * 60)
    })
  }))
}

// ── Contadores animados ──────────────────────────────────────
const displayTotal      = ref(0)
const displayAlertas    = ref(0)
const displayCategorias = ref(0)

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

// ── Stat cards como computed array — igual que GestionClientes ──
const statCards = computed(() => [
  {
    label:   'Total Materiales',
    display: displayTotal.value,
    accent:  '#1f3a52',
    icon:    'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  },
  {
    label:   'Alertas de Stock',
    display: displayAlertas.value,
    accent:  '#dc2626',
    icon:    'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  },
  {
    label:   'Categorías',
    display: displayCategorias.value,
    accent:  '#2563eb',
    icon:    'M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3ZM6 6h.008v.008H6V6Z',
  },
])

// ── Helpers ──────────────────────────────────────────────────
const categorias = ['Telas', 'Hilos', 'Accesorios', 'Otros']

function calcularEstado(m) {
  if (m.stock === 0)      return { estado: 'Agotado',    estadoClass: 'danger' }
  if (m.stock < m.minimo) return { estado: 'Stock Bajo', estadoClass: 'warning' }
  return                         { estado: 'En Stock',   estadoClass: 'success' }
}

function estadoColor(cls) {
  return cls === 'success' ? '#16a34a' : cls === 'warning' ? '#ca8a04' : '#dc2626'
}

function stockPct(m) {
  if (!m.maximo) return 0
  return Math.min(100, Math.round((m.stock / m.maximo) * 100))
}

// ── Ordenamiento ─────────────────────────────────────────────
const sortKey = ref('nombre')
const sortDir = ref(1)

function doSort(key) {
  if (sortKey.value === key) sortDir.value *= -1
  else { sortKey.value = key; sortDir.value = 1 }
}
function sIcon(key) {
  if (sortKey.value !== key) return '⇅'
  return sortDir.value === 1 ? '↑' : '↓'
}

// ── Computed ─────────────────────────────────────────────────
const alertas = computed(() => materiales.value.filter(m => m.estadoClass !== 'success'))

const materialesFiltrados = computed(() => {
  const lista = materiales.value.filter(m => {
    const b = m.nombre.toLowerCase().includes(busqueda.value.toLowerCase())
    const c = !categoriaFiltro.value || m.categoria === categoriaFiltro.value
    return b && c
  })
  return [...lista].sort((a, b) => {
    const va = a[sortKey.value], vb = b[sortKey.value]
    if (typeof va === 'number') return (va - vb) * sortDir.value
    return va > vb ? sortDir.value : -sortDir.value
  })
})

const errores = computed(() => ({
  nombre:    !form.value.nombre.trim() ? 'El nombre es requerido' : '',
  categoria: !form.value.categoria     ? 'Selecciona una categoría' : '',
  unidad:    !form.value.unidad        ? 'Selecciona una unidad' : '',
}))
const formValido = computed(() => !errores.value.nombre && !errores.value.categoria && !errores.value.unidad)

function mapearMaterial(m) {
  return {
    id:         m.Id_Material,
    nombre:     m.Nombre_Material,
    categoria:  m.Categoria,
    stock:      m.Stock_Actual,
    unidad:     m.Unidad,
    minimo:     m.Stock_Minimo,
    maximo:     m.Stock_Maximo,
    fecha:      m.Fecha ? m.Fecha.split('T')[0] : '',
    cliente:    m.Nombre_Cliente || '',
    Id_Cliente: m.Id_Cliente     || null,
    eliminando: false,
    ...calcularEstado({ stock: m.Stock_Actual, minimo: m.Stock_Minimo }),
  }
}

// ── Acciones ─────────────────────────────────────────────────
function abrirModal(m) {
  editando.value = !!m
  form.value = m
    ? { ...m, Id_Cliente: m.Id_Cliente || null }
    : { id: null, nombre: '', categoria: '', stock: 0, unidad: '', minimo: 0, maximo: 0, cliente: '', Id_Cliente: null }
  modalVisible.value = true
}
function cerrarModal() { modalVisible.value = false }

function eliminar(m) { confirmItem.value = m }

async function guardar() {
  if (!formValido.value) return
  guardando.value = true
  try {
    if (editando.value) {
      await actualizarMaterial(form.value.id, {
        Nombre_Material: form.value.nombre,
        Categoria:       form.value.categoria,
        Stock_Actual:    form.value.stock,
        Unidad:          form.value.unidad,
        Stock_Minimo:    form.value.minimo,
        Stock_Maximo:    form.value.maximo,
        Id_Cliente:      form.value.Id_Cliente || null,
      })
      showToast('Material actualizado correctamente', 'toast-success')
    } else {
      await crearMaterial({
        Nombre_Material: form.value.nombre,
        Categoria:       form.value.categoria,
        Stock_Actual:    form.value.stock,
        Unidad:          form.value.unidad,
        Stock_Minimo:    form.value.minimo,
        Stock_Maximo:    form.value.maximo,
        Id_Cliente:      form.value.Id_Cliente || null,
      })
      showToast('Material agregado correctamente', 'toast-success')
    }
    const data = await getMateriales()
    materiales.value = data.map(mapearMaterial)
    animateBars()
  } catch (err) {
    showToast(err.message || 'Error al guardar', 'toast-danger')
  }
  guardando.value = false
  cerrarModal()
}

async function confirmarEliminar() {
  const m = confirmItem.value
  confirmItem.value = null
  m.eliminando = true
  try {
    await eliminarMaterial(m.id)
    setTimeout(() => {
      materiales.value = materiales.value.filter(x => x.id !== m.id)
      showToast(`"${m.nombre}" eliminado`, 'toast-danger')
    }, 400)
  } catch (err) {
    m.eliminando = false
    showToast(err.message || 'Error al eliminar', 'toast-danger')
  }
}

function showToast(msg, type = 'toast-success') {
  toastMsg.value = msg
  toastType.value = type
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

// ── onMounted ──────────────────────────────────────────────
onMounted(async () => {
  try {
    const data = await getMateriales()
    materiales.value = data.map(mapearMaterial)
    animateBars()
  } catch (err) {
    console.error('Error cargando materiales:', err)
  }

  try {
    const usuarios = await getUsuarios()
    clientes.value = usuarios
      .filter(u => (u.Rol || u.Nombre_Rol || '').toLowerCase() === 'cliente' && u.Estado === 'activo')
      .map(u => ({ id: u.Id_Usuario, nombre: u.Nombre_Completo }))
  } catch (err) {
    console.error('Error cargando clientes:', err)
  } finally {
    cargandoVista.value = false
  }

  setTimeout(() => {
    animVisible.value = true
    animateCount(displayTotal,      materiales.value.length)
    animateCount(displayAlertas,    alertas.value.length)
    animateCount(displayCategorias, categorias.length)
    animateBars()
  }, 80)
})
</script>

<style scoped>
/* ── LAYOUT ── */
.layout  { display: flex; min-height: 100vh; background: #f1f5f9; position: relative; overflow: hidden; }
.content { flex: 1; padding: 28px 30px; position: relative; z-index: 1; }

/* ── FONDO DECORATIVO ── */
/* .bg-grid va DENTRO de .bg-orbs — igual que GestionClientes */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.07;
}
.orb-1 {
  width: 600px; height: 600px;
  background: #1f3a52;
  top: -200px; right: -100px;
  animation: orbDrift1 18s ease-in-out infinite alternate;
}
.orb-2 {
  width: 400px; height: 400px;
  background: #2563eb;
  bottom: -100px; left: 10%;
  animation: orbDrift2 22s ease-in-out infinite alternate;
}
.orb-3 {
  width: 300px; height: 300px;
  background: #16a34a;
  top: 40%; right: 5%;
  animation: orbDrift3 15s ease-in-out infinite alternate;
}

@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }

.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ── HERO HEADER ── */
.page-hero {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 28px;
  opacity: 0; transform: translateY(-16px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }

.hero-left  { display: flex; align-items: center; gap: 16px; }
.hero-text  { display: flex; flex-direction: column; }

/* hero-icon-wrap ES la caja azul (sin div anidado) — igual que GestionClientes */
.hero-icon-wrap {
  position: relative;
  width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center;
  background: #1f3a52;
  border-radius: 14px;
  flex-shrink: 0;
}
.hero-icon { width: 26px; height: 26px; color: white; }

.hero-icon-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid #1f3a52;
  opacity: 0;
  animation: iconPulse 3s ease-out infinite;
}
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 86px; height: 86px; animation-delay: 0.8s; }

@keyframes iconPulse {
  0%   { transform: scale(0.7); opacity: 0.5; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* Título letra por letra — mismas clases que GestionClientes */
.hero-title {
  font-size: 24px; font-weight: 700; color: #111827;
  margin: 0; display: flex; flex-wrap: wrap;
}
.title-char {
  display: inline-block;
  opacity: 0; transform: translateY(12px);
  animation: charReveal 0.4s ease forwards;
}
@keyframes charReveal {
  to { opacity: 1; transform: translateY(0); }
}

.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0 0; }

/* Buscador hero */
.search-box {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 14px;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 220px;
}
.search-box.search-focus {
  border-color: #1f3a52;
  box-shadow: 0 0 0 3px rgba(31,58,82,0.1);
}
.search-ico { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.search-box input {
  border: none; outline: none; width: 100%;
  font-size: 14px; color: #374151; background: transparent;
}
.search-box input::placeholder { color: #9ca3af; }
/* ── HERO CONTROLS WRAP (search + select + button en una fila) ── */
.hero-controls-wrap {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex-shrink: 0;
}

.select-wrapper  { position: relative; display: flex; align-items: center; }
.category-select {
  padding: 9px 36px 9px 14px; border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  outline: none; background: white; font-size: 14px; color: #374151;
  appearance: none; cursor: pointer; min-width: 170px; transition: border-color .2s;
}
.category-select:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: #6b7280; pointer-events: none; }

.btn-primary {
  padding: 10px 16px; background: #1f3a52; color: white;
  border: none; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 8px; white-space: nowrap;
  transition: background .2s, transform .1s; flex-shrink: 0;
}
.btn-primary:hover    { background: #162b36; transform: translateY(-1px); }
.btn-primary:active   { transform: scale(.97); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }

/* ── STATS CARDS — .cards + .cards-visible + transitionDelay inline — igual que GestionClientes ── */
.cards {
  display: flex; gap: 18px; margin-bottom: 28px;
}
.stat-card {
  background: white; flex: 1;
  padding: 20px 20px 20px 24px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  position: relative; overflow: hidden;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s;
}
.cards-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.09);
  transform: translateY(-3px) !important;
}

.stat-accent {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 4px; border-radius: 4px 0 0 4px;
}
.stat-icon-bg {
  position: absolute; right: 16px; top: 50%;
  transform: translateY(-50%);
  opacity: 0.07;
}
.stat-icon-bg svg { width: 52px; height: 52px; }

.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px 0; }
.stat-card p  { font-size: 30px; font-weight: 800; margin: 0; line-height: 1; }

/* ── ALERTAS ── */
.alert-box {
  background: #fff7ed; padding: 20px 24px; border-radius: 12px;
  margin-bottom: 25px; border: 1px solid #fed7aa;
}
.alert-box h3 { font-size: 15px; font-weight: 600; color: #9a3412; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px; }
.alert-icon   { width: 20px; height: 20px; color: #ea580c; }
.alert-count  { background: #dc2626; color: white; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 20px; }
@keyframes pulseFade { 0%,100%{opacity:1} 50%{opacity:.35} }
.pulse { animation: pulseFade 2s ease infinite; }
.alert-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px; color: #4b5563; }
.alert-item + .alert-item { border-top: 1px solid #fed7aa; }
.alert-item-left  { display: flex; align-items: center; gap: 8px; }
.alert-info    { display: flex; flex-direction: column; gap: 2px; }
.alert-name    { font-weight: 500; color: #4b5563; }
.alert-cliente { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #9a6a3f; }
.alert-item-right { display: flex; align-items: center; gap: 10px; }
.alert-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.alert-dot.warning { background: #ca8a04; }
.alert-dot.danger  { background: #dc2626; }
.alert-stock { font-size: 12px; color: #9ca3af; }

/* ── TABLE BOX — .table-box + .box-visible — igual que GestionClientes ── */
.table-box {
  background: white;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  margin-bottom: 28px;
  overflow: hidden;
  opacity: 0; transform: translateY(16px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}
.box-visible { opacity: 1; transform: translateY(0); }

/* table-header-bar con fondo gris — igual que GestionClientes */
.table-header-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: #f9fafb;
}
.table-header-left {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #374151;
}
.table-header-left svg { color: #1f3a52; }

/* count-badge azul oscuro — igual que GestionClientes */
.count-badge {
  background: #1f3a52; color: white;
  font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 999px;
  line-height: 1.6;
}

/* ── TABLA ── */
table  { width: 100%; border-collapse: collapse; }
thead  { background: #f9fafb; }
th {
  text-align: left; font-size: 12px; font-weight: 600;
  color: #6b7280; padding: 13px 18px;
  white-space: nowrap;
}
.sortable { cursor: pointer; user-select: none; transition: color 0.15s; }
.sortable:hover { color: #1f3a52; }
.sort-icon { font-size: 11px; margin-left: 4px; opacity: 0.6; }
td { padding: 14px 18px; font-size: 14px; color: #374151; border-top: 1px solid #f1f5f9; }

/* @keyframes rowSlideIn — igual que GestionClientes (animation, no transition + clase) */
.table-row {
  transition: background 0.18s;
  animation: rowSlideIn 0.35s ease both;
}
.table-row:hover td { background: #f8fafc; }
.table-row.row-eliminating { opacity: 0; background: #fee2e2; }

@keyframes rowSlideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Material cell */
.material-cell { display: flex; align-items: center; gap: 10px; }
.material-icon-bg {
  width: 28px; height: 28px; border-radius: 6px;
  background: #f0f9ff; border: 1px solid #e0f2fe;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background .2s, transform .2s;
  color: #0891b2;
}
.table-row:hover .material-icon-bg { background: #e0f2fe; transform: scale(1.1); }

.stock-cell    { display: flex; align-items: center; gap: 6px; }
.trend-icon    { width: 15px; height: 15px; flex-shrink: 0; }
.trend-up      { color: #16a34a; }
.trend-warning { color: #ca8a04; }
.trend-down    { color: #dc2626; }
.minmax        { color: #9ca3af; font-size: 13px; }

/* ── BARRA DE NIVEL ── */
.nivel-td       { min-width: 110px; }
.nivel-bar-wrap { display: flex; align-items: center; gap: 6px; }
.nivel-bar      { flex: 1; height: 6px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
.nivel-fill     { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
.nivel-fill.success { background: #16a34a; }
.nivel-fill.warning { background: #ca8a04; }
.nivel-fill.danger  { background: #dc2626; }
.nivel-pct      { font-size: 11px; color: #9ca3af; white-space: nowrap; }
.modal-preview-bar { height: 10px; border-radius: 99px; background: #f3f4f6; overflow: hidden; margin-top: 6px; }

/* ── BADGES / PILLS ── */
.badge   { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.success { background: #dcfce7; color: #15803d; }
.warning { background: #fef9c3; color: #854d0e; }
.danger  { background: #fee2e2; color: #991b1b; }
.cat-pill { background: #eff6ff; color: #1d4ed8; font-size: 12px; padding: 3px 9px; border-radius: 20px; font-weight: 500; }

/* ── ACCIONES — igual que GestionClientes ── */
.actions    { display: flex; gap: 8px; align-items: center; }
.action-btn {
  width: 32px; height: 32px; border-radius: 7px; border: none;
  background: #1f3a52;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: white;
  transition: all 0.15s;
}
.action-btn svg {
  pointer-events: none;
  filter: drop-shadow(0 0 0.3px rgba(255,255,255,0.4));
}
.view-btn:hover     { background: #2d5580; transform: scale(1.07); }
.download-btn:hover { background: #b91c1c; transform: scale(1.07); }

.fecha { white-space: nowrap; color: #9ca3af; font-size: 13px; }

/* ── SKELETON ── */
.table-skeleton { display: grid; gap: 12px; padding: 16px 20px; }
.table-skeleton-row {
  display: grid; grid-template-columns: 1.4fr 0.8fr 0.8fr 0.6fr;
  gap: 14px; padding: 14px 12px; border-radius: 10px; background: #fafafa;
}
.skeleton-line {
  display: block; border-radius: 999px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.sk-user  { width: 72%; height: 16px; }
.sk-tag   { width: 88px; height: 14px; }
.sk-stock { width: 84px; height: 14px; }
.sk-date  { width: 70px; height: 14px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── EMPTY STATE ── */
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 8px;
  padding: 44px 0; color: #9ca3af; font-size: 14px;
}

/* ── MODAL ── */
.modal {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  backdrop-filter: blur(2px);
  display: flex; justify-content: center; align-items: center; z-index: 1000;
}
.modal-content {
  background: #fff; width: 500px; max-width: 95%;
  border-radius: 14px; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,.2);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #111827; }
.close { cursor: pointer; font-size: 24px; color: #9ca3af; background: none; border: none; line-height: 1; }
.close:hover { color: #374151; }

.form-group       { display: flex; flex-direction: column; margin-bottom: 15px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.form-row         { display: flex; gap: 15px; }
.form-row .form-group { flex: 1; }

.modal-body input,
.modal-body select {
  padding: 10px 12px; border-radius: 8px; border: 1px solid #d1d5db;
  background: #f9fafb; font-family: inherit; font-size: 14px; color: #374151; outline: none;
  transition: border-color .2s, background .2s;
}
.modal-body input:focus,
.modal-body select:focus { border-color: #1f3a52; background: white; }
.input-error { border-color: #dc2626 !important; }
.error-msg   { font-size: 12px; color: #dc2626; margin-top: 4px; }

.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.btn-secondary {
  padding: 10px 18px; background: #f3f4f6; color: #374151;
  border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-size: 14px;
  transition: background .2s;
}
.btn-secondary:hover { background: #e5e7eb; }

/* ── CONFIRM ── */
.confirm-box {
  background: white; border-radius: 14px; padding: 32px 28px;
  width: 380px; max-width: 95%; box-shadow: 0 20px 50px rgba(0,0,0,.2); text-align: center;
}
.confirm-icon   { margin-bottom: 12px; }
.confirm-box h3 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px; }
.confirm-box p  { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
.confirm-btns   { display: flex; gap: 10px; justify-content: center; }
.btn-danger     { padding: 10px 18px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; transition: background .2s; }
.btn-danger:hover { background: #b91c1c; }

/* ── TOAST ── */
.toast {
  position: fixed; bottom: 28px; right: 28px; color: white;
  padding: 12px 18px; border-radius: 10px; font-size: 14px;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,.2); z-index: 2000;
}
.toast-success { background: #111827; }
.toast-danger  { background: #dc2626; }

/* ── TRANSITIONS ── */
.modal-enter-active, .modal-leave-active { transition: opacity .25s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; }

.toast-enter-active, .toast-leave-active { transition: opacity .3s ease, transform .3s ease; }
.toast-enter-from, .toast-leave-to       { opacity: 0; transform: translateY(12px); }

.slide-down-enter-active, .slide-down-leave-active { transition: opacity .3s ease, transform .3s ease; }
.slide-down-enter-from, .slide-down-leave-to       { opacity: 0; transform: translateY(-8px); }

.row-enter-active, .row-leave-active { transition: opacity .3s ease; }
.row-enter-from, .row-leave-to       { opacity: 0; }

@media (max-width: 960px) {
  .page-hero { flex-direction: column; align-items: flex-start; }
  .hero-controls-wrap { width: 100%; }
  .search-box { width: 100%; }
  .category-select { min-width: 0; flex: 1; }
  .cards { flex-direction: column; }
  .table-skeleton-row { grid-template-columns: 1fr 0.8fr; }
  .sk-stock, .sk-date { display: none; }
}
</style>