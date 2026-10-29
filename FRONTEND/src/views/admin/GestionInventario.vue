<template>
  <div class="layout">
    <main class="content">

      <!-- FONDO DECORATIVO: orbes + grid dentro del mismo contenedor (igual que GestionClientes) -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <PageHeader
        titulo="Gestión de Inventario"
        subtitulo="Controla stock, niveles y alertas de materiales en tiempo real"
        icono="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      >
        <template #acciones>
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              v-model="busqueda"
              type="search"
              placeholder="Buscar material"
              aria-label="Buscar material por nombre"
              @focus="searchFocus = true"
              @blur="searchFocus = false"
            >
          </div>
          <div class="select-wrapper">
            <select v-model="categoriaFiltro" class="category-select" aria-label="Filtrar por categoría">
              <option value="">Todas las categorías</option>
              <option>Telas</option>
              <option>Hilos</option>
              <option>Accesorios</option>
            </select>
            <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
            </svg>
          </div>
          <button type="button" class="tx-btn tx-btn--primary" @click="abrirModal(null)">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Agregar material
          </button>
        </template>
      </PageHeader>

      <div class="kpi-grid">
        <KpiCard
          v-for="(k, i) in kpis"
          :key="k.label"
          v-bind="k"
          :activo="k.filtro !== undefined && soloAlertas === k.filtro"
          :cargando="cargandoVista"
          :indice="i"
          v-on="k.filtro !== undefined ? { click: () => (soloAlertas = k.filtro) } : {}"
        />
      </div>

      <!-- Aviso compacto: reemplaza la lista larga de alertas que empujaba la tabla hacia abajo -->
      <Transition name="slide-down">
        <div v-if="!cargandoVista && alertas.length" class="alert-banner" role="status">
          <svg class="alert-banner__icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
          <p class="alert-banner__text">
            <strong>{{ alertas.length }} {{ alertas.length === 1 ? 'material necesita' : 'materiales necesitan' }} reposición</strong>
            <span>{{ resumenAlertas }}</span>
          </p>
          <button type="button" class="tx-btn tx-btn--secondary tx-btn--sm" @click="soloAlertas = !soloAlertas">
            {{ soloAlertas ? 'Ver todo el inventario' : 'Ver solo estos materiales' }}
          </button>
        </div>
      </Transition>

      <!-- TABLA DE INVENTARIO -->
      <section class="table-box">
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
        <div v-else class="tx-table-scroll">
        <table>
          <thead>
            <tr>
              <th class="sortable" tabindex="0" :aria-sort="ariaSort('nombre')" @click="doSort('nombre')" @keydown.enter.prevent="doSort('nombre')" @keydown.space.prevent="doSort('nombre')">Material <span class="sort-icon">{{ sIcon('nombre') }}</span></th>
              <th class="sortable" tabindex="0" :aria-sort="ariaSort('categoria')" @click="doSort('categoria')" @keydown.enter.prevent="doSort('categoria')" @keydown.space.prevent="doSort('categoria')">Categoría <span class="sort-icon">{{ sIcon('categoria') }}</span></th>
              <th class="sortable" tabindex="0" :aria-sort="ariaSort('stock')" @click="doSort('stock')" @keydown.enter.prevent="doSort('stock')" @keydown.space.prevent="doSort('stock')">Stock <span class="sort-icon">{{ sIcon('stock') }}</span></th>
              <th>Min/Max</th>
              <th>Nivel</th>
              <th>Cliente</th>
              <th class="sortable" tabindex="0" :aria-sort="ariaSort('estado')" @click="doSort('estado')" @keydown.enter.prevent="doSort('estado')" @keydown.space.prevent="doSort('estado')">Estado <span class="sort-icon">{{ sIcon('estado') }}</span></th>
              <th class="sortable" tabindex="0" :aria-sort="ariaSort('fecha')" @click="doSort('fecha')" @keydown.enter.prevent="doSort('fecha')" @keydown.space.prevent="doSort('fecha')">Última Act. <span class="sort-icon">{{ sIcon('fecha') }}</span></th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <TransitionGroup name="row">
              <tr
                v-for="(m, idx) in visibles"
                :key="m.id"
                class="table-row"
                :class="{ 'row-eliminating': m.eliminando }"
                :style="{ '--row-i': Math.min(idx, 12) }"
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
                      <div class="nivel-fill" :class="[m.estadoClass, { 'nivel-in': barrasListas }]" :style="{ width: stockPct(m) + '%' }"></div>
                    </div>
                    <span class="nivel-pct">{{ stockPct(m) }}%</span>
                  </div>
                </td>
                <td>{{ m.cliente || '—' }}</td>
                <td><span class="badge" :class="m.estadoClass">{{ m.estado }}</span></td>
                <td class="fecha">{{ m.fecha }}</td>
                <td class="actions">
                  <button type="button" class="action-btn view-btn" title="Editar" :aria-label="`Editar ${m.nombre}`" @click="abrirModal(m)">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                    </svg>
                  </button>
                  <button type="button" class="action-btn download-btn" title="Eliminar" :aria-label="`Eliminar ${m.nombre}`" @click="eliminar(m)">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </TransitionGroup>
          </tbody>
        </table>
        </div>
        <BasePagination
          v-if="!cargandoVista"
          v-model:pagina="pagina"
          v-model:por-pagina="porPagina"
          :total="materialesFiltrados.length"
          etiqueta="materiales"
        />

        <EmptyState
          v-if="materialesFiltrados.length === 0 && !cargandoVista"
          :icono="busqueda || categoriaFiltro || soloAlertas ? 'buscar' : 'caja'"
          :titulo="busqueda || categoriaFiltro || soloAlertas ? 'Ningún material coincide' : 'Todavía no hay materiales'"
          :descripcion="busqueda || categoriaFiltro || soloAlertas ? 'Prueba con otro nombre o quita los filtros.' : 'Agrega el primer material para empezar a controlar el stock.'"
          compacto
        >
          <button v-if="busqueda || categoriaFiltro || soloAlertas" type="button" class="tx-btn tx-btn--secondary tx-btn--sm" @click="busqueda = ''; categoriaFiltro = ''; soloAlertas = false">Quitar filtros</button>
          <button v-else type="button" class="tx-btn tx-btn--primary tx-btn--sm" @click="abrirModal(null)">Agregar material</button>
        </EmptyState>
      </section>

    </main>

    <!-- MODAL AGREGAR / EDITAR -->
    <BaseModal
      :open="modalVisible"
      :titulo="editando ? 'Editar material' : 'Agregar material'"
      :descripcion="editando ? `Actualiza el stock y los límites de ${form.nombre || 'este material'}.` : 'Registra un material nuevo en el inventario.'"
      tamano="lg"
      :cerrar-al-clic-fuera="false"
      @update:open="val => !val && cerrarModal()"
    >
      <form id="form-material" class="tx-form" novalidate @submit.prevent="guardar">
        <fieldset class="tx-form-section">
          <legend class="tx-form-section__title">Material</legend>
          <div class="tx-form-grid">
            <BaseField label="Nombre del material" requerido completo :error="v.error('nombre')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model="form.nombre" type="text" class="tx-input" placeholder="Ej: Tela de algodón"
                required autocomplete="off" @blur="v.tocar('nombre')">
            </BaseField>
            <BaseField label="Categoría" requerido :error="v.error('categoria')" v-slot="{ attrs }">
              <select v-bind="attrs" v-model="form.categoria" class="tx-input" required @blur="v.tocar('categoria')">
                <option disabled value="">Selecciona una categoría</option>
                <option>Telas</option><option>Hilos</option><option>Accesorios</option>
              </select>
            </BaseField>
            <BaseField label="Unidad de medida" requerido :error="v.error('unidad')" v-slot="{ attrs }">
              <select v-bind="attrs" v-model="form.unidad" class="tx-input" required @blur="v.tocar('unidad')">
                <option disabled value="">Selecciona una unidad</option>
                <option>Metros</option>
                <option>Centímetros</option>
                <option>Unidades</option>
                <option>Rollos</option>
                <option>Kilos</option>
                <option>Gramos</option>
                <option>Piezas</option>
              </select>
            </BaseField>
          </div>
        </fieldset>

        <fieldset class="tx-form-section">
          <legend class="tx-form-section__title">Stock</legend>
          <div class="tx-form-grid tx-form-grid--3">
            <BaseField label="Stock actual" :error="v.error('stock')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model.number="form.stock" type="number" min="0" inputmode="numeric" class="tx-input" @blur="v.tocar('stock')">
            </BaseField>
            <BaseField label="Mínimo" hint="Por debajo se marca como stock bajo" :error="v.error('minimo')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model.number="form.minimo" type="number" min="0" inputmode="numeric" class="tx-input" @blur="v.tocar('minimo')">
            </BaseField>
            <BaseField label="Máximo" :error="v.error('maximo')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model.number="form.maximo" type="number" min="0" inputmode="numeric" class="tx-input" @blur="v.tocar('maximo')">
            </BaseField>
          </div>

          <div v-if="form.maximo > 0 && !v.error('stock') && !v.error('maximo')" class="nivel-preview">
            <div class="nivel-bar modal-preview-bar" aria-hidden="true">
              <div class="nivel-fill nivel-preview__fill" :class="calcularEstado(form).estadoClass"
                :style="{ transform: `scaleX(${pctForm / 100})` }"></div>
            </div>
            <p class="nivel-preview__text">
              {{ pctForm }}% del máximo ·
              <strong :style="{ color: estadoColor(calcularEstado(form).estadoClass) }">{{ calcularEstado(form).estado }}</strong>
            </p>
          </div>
        </fieldset>

        <fieldset class="tx-form-section">
          <legend class="tx-form-section__title">Asignación</legend>
          <BaseField label="Cliente" opcional hint="Si el material es de un cliente específico" v-slot="{ attrs }">
            <select v-bind="attrs" v-model="form.Id_Cliente" class="tx-input">
              <option :value="null">Sin cliente</option>
              <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </BaseField>
        </fieldset>
      </form>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="cerrarModal">Cancelar</button>
        <button type="submit" form="form-material" class="tx-btn tx-btn--primary" :disabled="guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar material' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import { getMateriales, crearMaterial, actualizarMaterial, eliminarMaterial, getUsuarios } from '../../services/api.js'
import { ref, computed, onMounted, watch } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseField from '../../components/base/BaseField.vue'
import { useValidacion } from '../../composables/useValidacion'
import BasePagination from '../../components/base/BasePagination.vue'
import { usePagination } from '../../composables/usePagination'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const toast     = useToast()
const confirmar = useConfirm()

// ── Datos ────────────────────────────────────────────────────
const materiales = ref([])
const clientes   = ref([])

const busqueda        = ref('')
const categoriaFiltro = ref('')
const modalVisible    = ref(false)
const editando        = ref(false)
const guardando       = ref(false)
const searchFocus     = ref(false)  // mismo nombre que GestionClientes
const cargandoVista   = ref(true)
const soloAlertas     = ref(false)
const barrasListas    = ref(false)

const form = ref({
  id: null, nombre: '', categoria: '', stock: 0,
  unidad: '', minimo: 0, maximo: 0, cliente: '', Id_Cliente: null
})

// ── Barras de nivel: se dibujan con su ancho final y entran con scaleX ──
function animateBars() {
  barrasListas.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => { barrasListas.value = true }))
}

const ICON_BOX   = 'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9'
const ICON_ALERT = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
const ICON_TAG   = 'M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z M6 6h.008v.008H6V6Z'

// Total y Alertas filtran la tabla; Categorías es informativo
const kpis = computed(() => [
  { label: 'Total materiales',  valor: materiales.value.length, icono: ICON_BOX,   tono: 'brand',  filtro: false },
  { label: 'Necesitan reposición', valor: alertas.value.length, icono: ICON_ALERT, tono: 'danger', filtro: true,
    nota: alertas.value.length ? `${agotados.value} agotado${agotados.value === 1 ? '' : 's'}` : 'Todo en orden' },
  { label: 'Categorías', valor: categorias.length, icono: ICON_TAG, tono: 'info' },
])

// ── Helpers ──────────────────────────────────────────────────
const categorias = ['Telas', 'Hilos', 'Accesorios']

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
const alertas  = computed(() => materiales.value.filter(m => m.estadoClass !== 'success'))
const agotados = computed(() => alertas.value.filter(m => m.estadoClass === 'danger').length)
const resumenAlertas = computed(() => {
  const nombres = alertas.value.slice(0, 3).map(m => m.nombre).join(', ')
  const resto = alertas.value.length - 3
  return resto > 0 ? `${nombres} y ${resto} más` : nombres
})

const materialesFiltrados = computed(() => {
  const lista = materiales.value.filter(m => {
    const b = m.nombre.toLowerCase().includes(busqueda.value.toLowerCase())
    const c = !categoriaFiltro.value || m.categoria === categoriaFiltro.value
    const a = !soloAlertas.value || m.estadoClass !== 'success'
    return b && c && a
  })
  return [...lista].sort((a, b) => {
    const va = a[sortKey.value], vb = b[sortKey.value]
    if (typeof va === 'number') return (va - vb) * sortDir.value
    return va > vb ? sortDir.value : -sortDir.value
  })
})

const { pagina, porPagina, visibles, reiniciar } = usePagination(materialesFiltrados, { porPagina: 10, clave: 'inventario' })
watch([busqueda, categoriaFiltro, soloAlertas, sortKey, sortDir], reiniciar)

function ariaSort(key) {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 1 ? 'ascending' : 'descending'
}

const esNumeroValido = n => n === '' || n === null || (Number.isFinite(Number(n)) && Number(n) >= 0)
const errores = computed(() => ({
  nombre:    !form.value.nombre.trim() ? 'Escribe el nombre del material.' : '',
  categoria: !form.value.categoria     ? 'Elige una categoría.' : '',
  unidad:    !form.value.unidad        ? 'Elige la unidad de medida.' : '',
  stock:     !esNumeroValido(form.value.stock)  ? 'Usa un número igual o mayor a 0.' : '',
  minimo:    !esNumeroValido(form.value.minimo) ? 'Usa un número igual o mayor a 0.' : '',
  maximo:    !esNumeroValido(form.value.maximo)
    ? 'Usa un número igual o mayor a 0.'
    : Number(form.value.maximo) > 0 && Number(form.value.maximo) < Number(form.value.minimo || 0)
      ? 'Debe ser mayor o igual al mínimo.'
      : '',
}))
const v = useValidacion(errores)
const pctForm = computed(() => {
  const max = Number(form.value.maximo) || 0
  return max > 0 ? Math.max(0, Math.min(100, Math.round((Number(form.value.stock) || 0) / max * 100))) : 0
})

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
  v.reiniciar()
  editando.value = !!m
  form.value = m
    ? { ...m, Id_Cliente: m.Id_Cliente || null }
    : { id: null, nombre: '', categoria: '', stock: 0, unidad: '', minimo: 0, maximo: 0, cliente: '', Id_Cliente: null }
  modalVisible.value = true
}
function cerrarModal() { modalVisible.value = false }

async function eliminar(m) {
  const ok = await confirmar({
    titulo: `¿Eliminar "${m.nombre}"?`,
    mensaje: 'El material se quitará del inventario. Esta acción no se puede deshacer.',
    textoConfirmar: 'Eliminar material',
    tono: 'danger',
  })
  if (!ok) return
  m.eliminando = true
  try {
    await eliminarMaterial(m.id)
    setTimeout(() => {
      materiales.value = materiales.value.filter(x => x.id !== m.id)
      toast.success(`"${m.nombre}" eliminado.`)
    }, 300)
  } catch (err) {
    m.eliminando = false
    toast.error(err.message || 'No se pudo eliminar el material. Inténtalo de nuevo.')
  }
}

async function guardar() {
  if (!(await v.validar())) return
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
      toast.success('Cambios guardados.')
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
      toast.success('Material agregado.')
    }
    const data = await getMateriales()
    materiales.value = data.map(mapearMaterial)
    animateBars()
    cerrarModal()
  } catch (err) {
    // El modal sigue abierto para no perder lo que se escribió
    toast.error(err.message || 'No se pudo guardar el material. Revisa los datos e inténtalo de nuevo.')
  } finally {
    guardando.value = false
  }
}

// ── onMounted ──────────────────────────────────────────────
onMounted(async () => {
  try {
    const data = await getMateriales()
    materiales.value = data.map(mapearMaterial)
    animateBars()
  } catch (err) {
    console.error('Error cargando materiales:', err)
    toast.error('No se pudo cargar el inventario. Revisa tu conexión y recarga la página.')
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

  animateBars()
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

/* hero-icon-wrap ES la caja azul (sin div anidado) — igual que GestionClientes */

@keyframes iconPulse {
  0%   { transform: scale(0.7); opacity: 0.5; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* Título letra por letra — mismas clases que GestionClientes */
@keyframes charReveal {
  to { opacity: 1; transform: translateY(0); }
}

/* Buscador hero */
.search-box { display: flex; align-items: center; gap: 8px; height: var(--control-height); padding: 0 12px; background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); transition: border-color var(--duration-fast), box-shadow var(--duration-fast); width: 240px; }
.search-box.search-focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.search-ico { width: 16px; height: 16px; color: var(--color-text-muted); flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: transparent; }
.search-box input::placeholder { color: var(--color-text-muted); }
/* ── HERO CONTROLS WRAP (search + select + button en una fila) ── */

.select-wrapper  { position: relative; display: flex; align-items: center; }
.category-select {
  height: var(--control-height); padding: 0 32px 0 12px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  outline: none; background: var(--color-surface); font: inherit; font-size: var(--text-base); color: var(--color-text-secondary);
  appearance: none; cursor: pointer; min-width: 170px; transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}
.category-select:focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: var(--color-text-muted); pointer-events: none; }

/* ── STATS CARDS — .cards + .cards-visible + transitionDelay inline — igual que GestionClientes ── */

/* ── AVISO DE REPOSICIÓN (compacto) ── */
.alert-banner {
  display: flex; align-items: center; gap: var(--space-3);
  margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4);
  border: 1px solid #fed7aa; border-radius: var(--radius-lg); background: #fff7ed;
}
.alert-banner__icon { flex-shrink: 0; color: #c2410c; }
.alert-banner__text { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: var(--text-base); color: #7c2d12; }
.alert-banner__text span { font-size: var(--text-sm); color: #9a3412; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── TABLE BOX — .table-box + .box-visible — igual que GestionClientes ── */
.table-box {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xs);
  margin-bottom: var(--space-6);
  overflow: hidden;
  animation: tableIn var(--duration-slow) var(--ease-out) 120ms both;
}
@keyframes tableIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }

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
.sortable:focus-visible { outline: var(--focus-outline); outline-offset: -2px; }
.sortable { cursor: pointer; user-select: none; transition: color 0.15s; }
.sortable:hover { color: #1f3a52; }
.sort-icon { font-size: 11px; margin-left: 4px; opacity: 0.6; }
td { padding: 14px 18px; font-size: 14px; color: #374151; border-top: 1px solid #f1f5f9; }

/* @keyframes rowSlideIn — igual que GestionClientes (animation, no transition + clase) */
.table-row {
  transition: background var(--duration-fast);
  animation: rowSlideIn var(--duration-base) var(--ease-out) both; animation-delay: calc(var(--row-i, 0) * 25ms);
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
.trend-up      { color: #15803d; }
.trend-warning { color: #a16207; }
.trend-down    { color: #dc2626; }
.minmax        { color: var(--color-text-muted); font-size: 13px; }

/* ── BARRA DE NIVEL ── */
.nivel-td       { min-width: 110px; }
.nivel-bar-wrap { display: flex; align-items: center; gap: 6px; }
.nivel-bar      { flex: 1; height: 6px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
/* La barra tiene su ancho real y entra con scaleX (solo transform) */
.nivel-fill     { height: 100%; border-radius: 99px; transform: scaleX(0); transform-origin: left; transition: transform var(--duration-slower) var(--ease-out); transition-delay: calc(var(--row-i, 0) * 30ms); }
.nivel-fill.nivel-in { transform: scaleX(1); }
.nivel-fill.success { background: #16a34a; }
.nivel-fill.warning { background: #ca8a04; }
.nivel-fill.danger  { background: #dc2626; }
.nivel-pct      { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }
.modal-preview-bar { height: 10px; border-radius: 99px; background: #f3f4f6; overflow: hidden; }
.nivel-preview { display: flex; flex-direction: column; gap: 6px; margin-top: var(--space-4); }
.nivel-preview .nivel-bar { flex: none; }
.nivel-preview__fill { width: 100%; transition: transform var(--duration-slow) var(--ease-out); }
.nivel-preview__text { font-size: var(--text-sm); color: var(--color-text-muted); }

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

.fecha { white-space: nowrap; color: var(--color-text-muted); font-size: 13px; }

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

/* ── MODAL ── */

.modal-body input,
.modal-body input:focus,

/* ── TRANSITIONS ── */

.slide-down-enter-active, .slide-down-leave-active { transition: opacity .3s ease, transform .3s ease; }
.slide-down-enter-from, .slide-down-leave-to       { opacity: 0; transform: translateY(-8px); }

.row-enter-active { transition: opacity var(--duration-base) var(--ease-out); }
.row-leave-active { transition: opacity var(--duration-fast) var(--ease-in); animation: none; }
.row-enter-from, .row-leave-to       { opacity: 0; }

@media (max-width: 960px) {
  .search-box { width: 100%; }
  .category-select { min-width: 0; flex: 1; }
  .table-skeleton-row { grid-template-columns: 1fr 0.8fr; }
  .sk-stock, .sk-date { display: none; }
}
</style>