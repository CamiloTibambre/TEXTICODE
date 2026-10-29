<template>
  
  <div class="layout">

    <!-- FONDO DECORATIVO -->
    <div class="bg-orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>

    <main class="main">

      <PageHeader
        titulo="Tareas Asignadas"
        subtitulo="Gestiona y haz seguimiento a tus órdenes de producción"
        icono="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      >
        <template #acciones>
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              v-model="busqueda"
              type="search"
              placeholder="Buscar tarea o producto"
              aria-label="Buscar tareas por nombre o producto"
              @focus="searchFocus = true"
              @blur="searchFocus = false"
            />
          </div>
          <select class="filter-select" v-model="filtroPrioridad" aria-label="Filtrar por prioridad">
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </template>
      </PageHeader>

      <!-- KPIs: filtran por estado -->
      <div class="kpi-grid" role="group" aria-label="Filtrar tareas por estado">
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

      <!-- CARGANDO -->
      <div v-if="cargando" class="table-box">
        <SkeletonTable :filas="5" :columnas="5" :con-avatar="false" etiqueta="Cargando tareas" />
      </div>

      <!-- SIN SESIÓN -->
      <div v-else-if="!auth.idUsuario" class="empty-state">
        <p>Inicia sesión con tu cuenta de operario para ver tus tareas asignadas.</p>
      </div>

      <!-- TAREAS -->
      <div v-else class="table-box">
        <div class="table-header-bar">
          <h3>Mis Tareas</h3>
          <span class="count-badge">{{ tareasFiltradas.length }} tarea{{ tareasFiltradas.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="tasks-list">
          <TransitionGroup name="row">
            <div
              class="task-card"
              v-for="(tarea, idx) in tareasFiltradas"
              :key="tarea.id"
              :class="{
                'task-retrasada':  tarea.estado === 'retrasado',
                'task-completada': tarea.estado === 'completado'
              }"
              :style="{ '--row-i': Math.min(idx, 12) }"
            >
              <div class="task-stripe" :class="tarea.estado"></div>

              <div class="task-body">
                <div class="task-top">
                  <div class="task-badges">
                    <span class="task-id">OP-{{ String(tarea.id).padStart(3, '0') }}</span>
                    <span class="badge" :class="tarea.estado">
                      <svg v-if="tarea.estado === 'en-proceso'" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                        <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M8 12h8M12 8v8"/>
                      </svg>
                      <svg v-else-if="tarea.estado === 'completado'" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                        <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.5l2.5 2.5 4.5-4.5"/>
                      </svg>
                      <svg v-else width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                      </svg>
                      {{ estadoLabel(tarea.estado) }}
                    </span>
                    <span class="badge prioridad" :class="tarea.prioridad">
                      {{ tarea.prioridad.charAt(0).toUpperCase() + tarea.prioridad.slice(1) }}
                    </span>
                  </div>
                  <div v-if="tarea.estado === 'retrasado'" class="retraso-banner">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                    </svg>
                    Orden con entrega retrasada
                  </div>
                </div>

                <h2 class="task-name">{{ tarea.producto || tarea.nombre }}</h2>
                <p class="task-desc">{{ tarea.descripcion }}</p>

                <div class="task-meta">
                  <div class="meta-item">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/>
                    </svg>
                    <div>
                      <div class="meta-label">Cliente</div>
                      <div class="meta-value">{{ tarea.cliente }}</div>
                    </div>
                  </div>
                  <div class="meta-item">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
                    </svg>
                    <div>
                      <div class="meta-label">Material</div>
                      <div class="meta-value">{{ tarea.material }}</div>
                    </div>
                  </div>
                  <div class="meta-item">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                    </svg>
                    <div>
                      <div class="meta-label">Fecha Límite</div>
                      <div class="meta-value" :class="{ 'fecha-vencida': tarea.vencida }">{{ tarea.entrega }}</div>
                    </div>
                  </div>
                  <div class="meta-item">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/>
                    </svg>
                    <div>
                      <div class="meta-label">Prendas</div>
                      <div class="meta-value prendas-val">
                        <strong>{{ tarea.realizadas }}</strong>
                        <span class="prendas-sep">/</span>
                        <span class="prendas-total">{{ tarea.cantidad }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="progress-section">
                  <div class="progress-label">
                    <span>Progreso</span>
                    <span class="progress-pct">{{ tarea.progreso }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :class="{
                        'fill-completo':  tarea.progreso >= 100,
                        'fill-retrasado': tarea.estado === 'retrasado'
                      }"
                      :style="{ width: tarea.progreso + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="tareasFiltradas.length === 0" class="empty-state">
            <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="#d1d5db">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p>No tienes tareas asignadas.</p>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import SkeletonTable from '../../components/base/SkeletonTable.vue'
import { useToast } from '../../composables/useToast'

const toast = useToast()
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const auth            = useAuthStore()
const authHeaders     = () => auth.authHeader()
const busqueda        = ref('')
const filtroEstado    = ref('')
const filtroPrioridad = ref('')
const tareas          = ref([])
const cargando        = ref(true)
const animVisible     = ref(false)
const searchFocus     = ref(false)
const titleChars      = 'Tareas Asignadas'.split('')

const ICON_TOTAL = 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
const ICON_PROC  = 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'
const ICON_OK    = 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_WARN  = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'

const kpis = computed(() => [
  { label: 'Total',       valor: tareas.value.length,                                       icono: ICON_TOTAL, tono: 'brand',   filtro: '' },
  { label: 'En proceso',  valor: tareas.value.filter(t => t.estado === 'en-proceso').length, icono: ICON_PROC,  tono: 'info',    filtro: 'en-proceso' },
  { label: 'Completadas', valor: tareas.value.filter(t => t.estado === 'completado').length, icono: ICON_OK,    tono: 'success', filtro: 'completado' },
  { label: 'Retrasadas',  valor: tareas.value.filter(t => t.estado === 'retrasado').length,  icono: ICON_WARN,  tono: 'danger',  filtro: 'retrasado' },
])

onMounted(async () => {
  if (!auth.idUsuario) {
    cargando.value = false
    setTimeout(() => { animVisible.value = true }, 80)
    return
  }

  try {
    const res  = await fetch(`${BASE}/orden-operario/operario/${auth.idUsuario}`, { headers: authHeaders() })
    const data = await res.json()

    tareas.value = data.map(o => {
      const completada = o.Estado_Fase === 'Completada'
      const vencida = !completada && estaRetrasada(o.Fecha_Limite)
      return {
  id:          o.Id_Orden_Operario,
  nombre:      o.Descripcion_Fase || o.Descripcion_Orden,
  producto:    o.Producto || o.Descripcion_Orden,
  descripcion: `Fase ${o.Numero_Fase}: ${o.Descripcion_Fase || 'Sin descripción'}`,
  cliente:     o.Cliente        || '—',
  material:    o.NombreMaterial || '—',
  entrega:     o.Fecha_Limite?.split('T')[0] || '—',
  cantidad: o.Cuota ?? o.Cantidad ?? 0,
  realizadas: completada ? (o.Cuota ?? o.Cantidad ?? 0) : Number(o.Cantidad_Realizada || 0),
  estado: completada ? 'completado' : vencida ? 'retrasado' : 'en-proceso',
  progreso: completada ? 100 : Math.min(100, Math.round((Number(o.Cantidad_Realizada || 0) / Math.max(1, Number(o.Cuota ?? o.Cantidad ?? 0))) * 100)),
  prioridad: (o.Prioridad || 'Media').toLowerCase(),
  vencida,
}
    }).sort(ordenarTareas)
  } catch (err) {
    console.error('Error cargando tareas:', err)
    toast.error('No se pudieron cargar tus tareas. Revisa tu conexión y recarga la página.')
  } finally {
    cargando.value = false
    animVisible.value = true
  }
})

function ordenarTareas(a, b) {
  const grupo = t => t.estado === 'retrasado' ? 0 : t.estado === 'en-proceso' ? 1 : 2
  const porEstado = grupo(a) - grupo(b)
  if (porEstado) return porEstado
  return new Date(a.entrega || '9999-12-31') - new Date(b.entrega || '9999-12-31')
}

function estaRetrasada(fecha) {
  if (!fecha) return false
  const limite = new Date(fecha)
  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  return limite < inicioHoy
}

const estadoLabel = (estado) => ({
  'en-proceso': 'En Proceso',
  'completado': 'Completado',
  'retrasado': 'Retrasada',
})[estado] || estado

const tareasFiltradas = computed(() =>
  tareas.value.filter(t => {
    const q = busqueda.value.toLowerCase()
    const b = !q || t.nombre.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q)
    const e = !filtroEstado.value    || t.estado    === filtroEstado.value
    const p = !filtroPrioridad.value || t.prioridad === filtroPrioridad.value
    return b && e && p
  })
)
</script>

<style scoped>
/* LAYOUT */
.layout { display: flex; min-height: 100vh; background: #f1f5f9; overflow: hidden; }
.main   { flex: 1; padding: 28px 30px; min-height: 100vh; position: relative; z-index: 1; }

/* FONDO */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 520px; height: 520px; background: #1f3a52; top: -140px; right: -100px; animation: orbDrift1 18s ease-in-out infinite; }
.orb-2 { width: 380px; height: 380px; background: #2563eb; bottom: 60px; left: -80px; animation: orbDrift2 24s ease-in-out infinite; }
.orb-3 { width: 300px; height: 300px; background: #16a34a; top: 40%; right: 20%; animation: orbDrift3 20s ease-in-out infinite; }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(31,58,82,0.04) 1px,transparent 1px); background-size: 40px 40px; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,40px) scale(1.08); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(25px,-35px) scale(1.05); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-20px,30px) scale(1.1); } }

/* HERO */
@keyframes iconPulse { from { transform: scale(0.7); opacity: 0.4; } to { transform: scale(1.4); opacity: 0; } }

@keyframes charReveal { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.search-box { display: flex; align-items: center; gap: 8px; height: var(--control-height); padding: 0 12px; background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); transition: border-color var(--duration-fast), box-shadow var(--duration-fast); width: 240px; }
.search-box.search-focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.search-box svg { color: var(--color-text-muted); flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: transparent; }
.search-box input::placeholder { color: var(--color-text-muted); }
.filter-select { height: var(--control-height); padding: 0 32px 0 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border-strong); background: var(--color-surface) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2714%27 height=%2714%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke-width=%272%27 stroke=%27%236b7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27m19.5 8.25-7.5 7.5-7.5-7.5%27/%3E%3C/svg%3E") no-repeat right 10px center; appearance: none; -webkit-appearance: none; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); cursor: pointer; outline: none; transition: border-color var(--duration-fast), box-shadow var(--duration-fast); }
.filter-select:focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }

/* STAT CARDS */

/* TABLE BOX */
.table-box { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-xs); margin-bottom: var(--space-6); overflow: hidden; animation: tableIn var(--duration-slow) var(--ease-out) 120ms both; }
@keyframes tableIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.table-header-bar h3 { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
.count-badge { background: #1f3a52; color: white; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }

/* TASKS LIST */
/* Dos columnas en escritorio (antes una sola columna a todo el ancho) */
.tasks-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: var(--space-3); padding: var(--space-3); align-items: start; }

/* TASK CARD */
.task-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); display: flex; overflow: hidden; transition: background var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast) var(--ease-out); animation: rowSlideIn var(--duration-base) var(--ease-out) both; animation-delay: calc(var(--row-i, 0) * 30ms); }
.task-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: none; } }
.task-card.task-retrasada { background: linear-gradient(135deg, #fef2f2 0%, #ffffff 60%); }
.task-card.task-completada { background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%); }

/* Banda lateral */
.task-stripe { width: 5px; flex-shrink: 0; }
.task-stripe.en-proceso { background: #2563eb; }
.task-stripe.completado { background: #16a34a; }
.task-stripe.retrasado  { background: #dc2626; }

.task-body   { flex: 1; padding: 20px 22px; }
.task-top    { margin-bottom: 10px; }
.task-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.task-id     { font-size: 13px; font-weight: 700; color: #1f3a52; }

.badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.badge.en-proceso { background: #dbeafe; color: #1d4ed8; }
.badge.completado  { background: #dcfce7; color: #15803d; }
.badge.retrasado   { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.badge.prioridad.alta  { background: #fee2e2; color: #991b1b; }
.badge.prioridad.media { background: #fef3c7; color: #92400e; }
.badge.prioridad.baja  { background: #f0fdf4; color: #166534; }

.retraso-banner { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 5px 10px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; font-size: 12px; font-weight: 600; color: #b91c1c; }

.task-name { font-size: 17px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.task-desc { font-size: 14px; color: #6b7280; margin-bottom: 18px; }

.task-meta   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 28px; margin-bottom: 18px; }
.meta-item   { display: flex; align-items: flex-start; gap: 8px; color: #6b7280; }
.meta-item svg { flex-shrink: 0; margin-top: 2px; }
.meta-label  { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
.meta-value  { font-size: 14px; font-weight: 600; color: #111827; }
.fecha-vencida { color: #dc2626 !important; }

.prendas-val   { display: flex; align-items: baseline; gap: 3px; }
.prendas-val strong { font-size: 16px; color: #1f3a52; }
.prendas-sep   { color: var(--color-text-muted); font-size: 13px; }
.prendas-total { font-size: 13px; color: var(--color-text-muted); }

/* PROGRESS */
.progress-label { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.progress-pct   { font-weight: 600; color: #374151; }
.progress-bar   { width: 100%; height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
.progress-fill  { height: 100%; background: #1f3a52; border-radius: 999px; transition: width 0.6s ease; }
.progress-fill.fill-completo  { background: #16a34a; }
.progress-fill.fill-retrasado { background: #dc2626; }

/* LOADING */
@keyframes spin { to { transform: rotate(360deg); } }

/* EMPTY */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 24px; color: var(--color-text-muted); font-size: 14px; text-align: center; }

/* TRANSITIONS */
.row-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.row-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 1100px) { .cards { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 800px)  { .main { padding: 20px 16px; } .cards { grid-template-columns: repeat(2,1fr); } .task-meta { grid-template-columns: 1fr; } .hero-section { flex-direction: column; align-items: flex-start; } }

</style>