<template>
  
  <div class="layout">
    <AppSidebar rol="operario" />

    <!-- FONDO DECORATIVO -->
    <div class="bg-orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>

    <main class="main">

      <!-- HERO HEADER -->
      <div class="hero-section">
        <div class="hero-icon-wrap">
          <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4"/>
          </svg>
          <span class="hero-icon-ring ring-1"></span>
          <span class="hero-icon-ring ring-2"></span>
        </div>

        <div class="hero-text">
          <h1>
            <span
              v-for="(char, i) in titleChars"
              :key="i"
              class="title-char"
              :style="{ animationDelay: `${i * 35}ms` }"
            >{{ char === ' ' ? '\u00A0' : char }}</span>
          </h1>
          <p class="hero-sub">Gestiona y hace seguimiento a tus órdenes de producción</p>
        </div>

        <!-- FILTROS en el hero -->
        <div class="hero-filters">
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input
              v-model="busqueda"
              placeholder="Buscar tareas..."
              @focus="searchFocus = true"
              @blur="searchFocus = false"
            />
          </div>
          <select class="filter-select" v-model="filtroEstado">
            <option value="">Todos los estados</option>
            <option value="en-proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="retrasado">Retrasada</option>
          </select>
          <select class="filter-select" v-model="filtroPrioridad">
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      <!-- STAT CARDS -->
      <div class="cards" :class="{ 'cards-visible': animVisible }">
        <div class="stat-card" :style="{ transitionDelay: '0ms' }">
          <div class="card-accent" style="background: #2563eb"></div>
          <div class="card-icon-bg">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
              <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M8 12h8M12 8v8"/>
            </svg>
          </div>
          <div class="card-body">
            <div class="card-label">En Proceso</div>
            <div class="card-value" style="color: #2563eb">{{ displayEnProceso }}</div>
          </div>
        </div>
        <div class="stat-card" :style="{ transitionDelay: '70ms' }">
          <div class="card-accent" style="background: #16a34a"></div>
          <div class="card-icon-bg">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
              <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.5l2.5 2.5 4.5-4.5"/>
            </svg>
          </div>
          <div class="card-body">
            <div class="card-label">Completadas</div>
            <div class="card-value" style="color: #16a34a">{{ displayCompletadas }}</div>
          </div>
        </div>
        <div class="stat-card" :style="{ transitionDelay: '140ms' }">
          <div class="card-accent" style="background: #dc2626"></div>
          <div class="card-icon-bg">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
            </svg>
          </div>
          <div class="card-body">
            <div class="card-label">Retrasadas</div>
            <div class="card-value" style="color: #dc2626">{{ displayRetrasadas }}</div>
          </div>
        </div>
        <div class="stat-card" :style="{ transitionDelay: '210ms' }">
          <div class="card-accent" style="background: #1f3a52"></div>
          <div class="card-icon-bg">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
              <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <div class="card-body">
            <div class="card-label">Total</div>
            <div class="card-value" style="color: #1f3a52">{{ displayTotal }}</div>
          </div>
        </div>
      </div>

      <!-- CARGANDO -->
      <div v-if="cargando" class="loading-wrap">
        <div class="spinner-load"></div>
        <p>Cargando tareas...</p>
      </div>

      <!-- SIN SESIÓN -->
      <div v-else-if="!auth.idUsuario" class="empty-state">
        <p>Inicia sesión con tu cuenta de operario para ver tus tareas asignadas.</p>
      </div>

      <!-- TAREAS -->
      <div v-else class="table-box" :class="{ 'box-visible': animVisible }" style="transition-delay: 280ms">
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
              :style="{ animationDelay: `${idx * 40}ms` }"
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
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAuthStore } from '../../stores/auth'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const auth            = useAuthStore()
const busqueda        = ref('')
const filtroEstado    = ref('')
const filtroPrioridad = ref('')
const tareas          = ref([])
const cargando        = ref(true)
const animVisible     = ref(false)
const searchFocus     = ref(false)
const titleChars      = 'Tareas Asignadas'.split('')

const displayEnProceso   = ref(0)
const displayCompletadas = ref(0)
const displayRetrasadas = ref(0)
const displayTotal       = ref(0)

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

onMounted(async () => {
  if (!auth.idUsuario) {
    cargando.value = false
    setTimeout(() => { animVisible.value = true }, 80)
    return
  }

  try {
    const res  = await fetch(`${BASE}/ordenes/operario/${auth.idUsuario}`)
    const data = await res.json()

    tareas.value = data.map(o => {
      const realizadas = o.Unidades_Realizadas ?? 0
      const unidades   = o.Unidades ?? o.Cantidad ?? 1
      const cantidad   = o.Cantidad ?? 0
      const estado     = mapearEstado(o.Estado)

      let progreso = 0
      if (estado === 'completado') {
        progreso = 100
      } else if (unidades > 0 && realizadas > 0) {
        progreso = Math.min(100, Math.round((realizadas / unidades) * 100))
      }

      return {
  id:          o.Id_Orden,
  nombre:      o.Descripcion,
  producto:    o.Producto || o.Descripcion,
  descripcion: o.Descripcion,
  cliente:     o.Cliente        || '—',
  material:    o.NombreMaterial || '—',
  entrega:     o.Fecha_Limite?.split('T')[0] || '—',
  cantidad, realizadas, estado, progreso,
  prioridad: (o.Prioridad || 'Media').toLowerCase(),
  // vencida ya no se calcula aquí — se confía en o.Estado === 'Retrasada'
}
    })
  } catch (err) {
    console.error('Error cargando tareas:', err)
  } finally {
    cargando.value = false
    setTimeout(() => {
      animVisible.value = true
      animateCount(displayEnProceso,   tareas.value.filter(t => t.estado === 'en-proceso').length)
      animateCount(displayCompletadas, tareas.value.filter(t => t.estado === 'completado').length)
      animateCount(displayRetrasadas, tareas.value.filter(t => t.estado === 'retrasado').length)
      animateCount(displayTotal,       tareas.value.length)
    }, 80)
  }
})

function mapearEstado(estado) {
  return {
    'En Proceso': 'en-proceso',
    'Completada': 'completado',
    'Retrasada': 'retrasado',
  }[estado] || 'en-proceso'
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
.hero-section { display: flex; align-items: center; gap: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px 28px; margin-bottom: 28px; box-shadow: 0 2px 12px rgba(31,58,82,0.06); flex-wrap: wrap; }
.hero-icon-wrap { width: 56px; height: 56px; background: #1f3a52; border-radius: 14px; display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0; }
.hero-icon { width: 28px; height: 28px; color: white; position: relative; z-index: 1; }
.hero-icon-ring { position: absolute; border-radius: 50%; border: 2px solid #1f3a52; animation: iconPulse 2.4s ease-out infinite; }
.ring-1 { width: 72px; height: 72px; opacity: 0.25; }
.ring-2 { width: 90px; height: 90px; opacity: 0.12; animation-delay: 0.5s; }
@keyframes iconPulse { from { transform: scale(0.7); opacity: 0.4; } to { transform: scale(1.4); opacity: 0; } }

.hero-text { flex: 1; min-width: 200px; }
.hero-text h1 { font-size: 26px; font-weight: 700; color: #111827; margin: 0 0 6px; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; animation: charReveal 0.4s ease both; }
@keyframes charReveal { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.hero-sub { font-size: 14px; color: #6b7280; margin: 0; }

.hero-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.search-box { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: #f9fafb; transition: border-color 0.2s, box-shadow 0.2s; }
.search-box.search-focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.08); background: white; }
.search-box svg { color: #9ca3af; flex-shrink: 0; }
.search-box input { border: none; background: transparent; font-size: 14px; color: #374151; outline: none; width: 180px; }
.search-box input::placeholder { color: #9ca3af; }
.filter-select { padding: 9px 12px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: #f9fafb; font-size: 14px; color: #374151; cursor: pointer; outline: none; transition: border-color 0.2s; }
.filter-select:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.08); }

/* STAT CARDS */
.cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; margin-bottom: 24px; }
.stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 20px 18px; position: relative; overflow: hidden; opacity: 0; transform: translateY(14px); transition: opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s; }
.cards-visible .stat-card { opacity: 1; transform: none; }
.stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px) !important; }
.card-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 12px 0 0 12px; }
.card-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: 0.06; width: 52px; height: 52px; }
.card-icon-bg svg { width: 100%; height: 100%; color: #1f3a52; }
.card-body { padding-left: 8px; }
.card-label { font-size: 13px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
.card-value { font-size: 28px; font-weight: 700; }

/* TABLE BOX */
.table-box { background: white; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); opacity: 0; transform: translateY(14px); transition: opacity 0.45s ease, transform 0.45s ease; }
.box-visible { opacity: 1; transform: none; }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.table-header-bar h3 { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
.count-badge { background: #1f3a52; color: white; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }

/* TASKS LIST */
.tasks-list { display: flex; flex-direction: column; }

/* TASK CARD */
.task-card { background: white; border-bottom: 1px solid #f3f4f6; display: flex; overflow: hidden; transition: background 0.15s, transform 0.2s; animation: rowSlideIn 0.35s ease both; }
.task-card:last-child { border-bottom: none; }
.task-card:hover { background: #f9fafb; transform: translateX(3px); }
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
.badge.en-proceso { background: #dbeafe; color: #2563eb; }
.badge.completado  { background: #dcfce7; color: #15803d; }
.badge.retrasado   { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.badge.prioridad.alta  { background: #fee2e2; color: #991b1b; }
.badge.prioridad.media { background: #fef3c7; color: #92400e; }
.badge.prioridad.baja  { background: #f0fdf4; color: #166534; }

.retraso-banner { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 5px 10px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; font-size: 12px; font-weight: 600; color: #b91c1c; }

.task-name { font-size: 17px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.task-desc { font-size: 14px; color: #6b7280; margin-bottom: 18px; }

.task-meta   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 28px; margin-bottom: 18px; }
.meta-item   { display: flex; align-items: flex-start; gap: 8px; color: #6b7280; }
.meta-item svg { flex-shrink: 0; margin-top: 2px; }
.meta-label  { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
.meta-value  { font-size: 14px; font-weight: 600; color: #111827; }
.fecha-vencida { color: #dc2626 !important; }

.prendas-val   { display: flex; align-items: baseline; gap: 3px; }
.prendas-val strong { font-size: 16px; color: #1f3a52; }
.prendas-sep   { color: #9ca3af; font-size: 13px; }
.prendas-total { font-size: 13px; color: #9ca3af; }

/* PROGRESS */
.progress-label { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.progress-pct   { font-weight: 600; color: #374151; }
.progress-bar   { width: 100%; height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
.progress-fill  { height: 100%; background: #1f3a52; border-radius: 999px; transition: width 0.6s ease; }
.progress-fill.fill-completo  { background: #16a34a; }
.progress-fill.fill-retrasado { background: #dc2626; }

/* LOADING */
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 14px; color: #9ca3af; font-size: 14px; }
.spinner-load { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* EMPTY */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 24px; color: #9ca3af; font-size: 14px; text-align: center; }

/* TRANSITIONS */
.row-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.row-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 1100px) { .cards { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 800px)  { .main { padding: 20px 16px; } .cards { grid-template-columns: repeat(2,1fr); } .task-meta { grid-template-columns: 1fr; } .hero-section { flex-direction: column; align-items: flex-start; } }

</style>