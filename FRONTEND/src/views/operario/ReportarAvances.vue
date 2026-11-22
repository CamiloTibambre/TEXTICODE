<template>
  <div class="layout">

    <main class="main">

      <!-- FONDO DECORATIVO -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <PageHeader
        titulo="Reportar Avances"
        subtitulo="Actualiza el progreso de tus órdenes asignadas"
        icono="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
      />

      <!-- TABS -->
      <div class="tabs-wrapper" :class="{ 'section-visible': mounted }" style="transition-delay: 80ms">
        <button class="tab-btn" :class="{ active: tabActivo === 'activas' }" @click="tabActivo = 'activas'">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
          </svg>
          Órdenes Activas
          <span class="tab-badge blue">{{ ordenesActivas.length }}</span>
        </button>
        <button class="tab-btn" :class="{ active: tabActivo === 'historial' }" @click="tabActivo = 'historial'">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Historial
          <span v-if="historialTotal" class="tab-badge green">{{ historialTotal }}</span>
        </button>
      </div>

      <!-- ── ÓRDENES ACTIVAS ── -->
      <div v-show="tabActivo === 'activas'" class="tab-content">

        <div v-if="cargando" class="orders-grid orders-grid--loading">
          <SkeletonCard v-for="i in 4" :key="i" variante="contenido" :lineas="4" />
        </div>

        <div v-else-if="!auth.idUsuario" class="empty-wrap">
          <p>Inicia sesión para ver tus órdenes.</p>
        </div>

        <div v-else-if="ordenesActivas.length === 0" class="empty-wrap">
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="#d1d5db">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
          </svg>
          <p>No tienes órdenes activas.</p>
        </div>

        <div v-else class="orders-grid" :class="{ 'section-visible': mounted }" style="transition-delay: 180ms">
          <TransitionGroup name="row">
            <div
              v-for="o in ordenesActivas"
              :key="o.idReal"
              class="order-card"
              :class="{ 'card-retrasada': o.estado === 'retrasado' }"
            >
              <div class="oc-header" :class="o.estado">
                <div class="oc-header-left">
                  <span class="oc-id">{{ o.numeroOrden }}</span>
                  <span class="oc-badge" :class="o.estado">{{ estadoLabel(o.estado) }}</span>
                  <span class="oc-prio" :class="o.prioridad">{{ capitalize(o.prioridad) }}</span>
                </div>
              </div>

              <div class="oc-body">
                <h2 class="oc-nombre">{{ o.producto }}</h2>
                <p class="oc-fase">Fase {{ o.numeroFase }} · {{ o.nombre }}</p>

                <div class="oc-meta">
                  <div class="oc-meta-item">
                    <span class="oc-meta-lbl">Prendas a realizar</span>
                    <span class="oc-meta-val prendas"><strong>{{ o.unidadesTotales }}</strong></span>
                  </div>
                  <div class="oc-meta-item">
                    <span class="oc-meta-lbl">Fecha Límite</span>
                    <span class="oc-meta-val" :class="{ 'val-vencida': estaVencida(o.fechaLimite) }">{{ o.fechaLimite }}</span>
                  </div>
                </div>

                <button
                  class="btn-reportar"
                  :disabled="o.estado === 'completado'"
                  @click="abrirModal(o)"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                  </svg>
                  Reportar avance
                </button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- ── HISTORIAL ── -->
      <div v-show="tabActivo === 'historial'" class="tab-content">
        <div class="history-filters">
          <label class="history-search">
            <span>Buscar orden</span>
            <input v-model="historialBusqueda" type="search" class="tx-input" placeholder="ORD-014 o nombre de la orden">
          </label>
          <label>
            <span>Desde</span>
            <input v-model="historialDesde" type="date" class="tx-input">
          </label>
          <label>
            <span>Hasta</span>
            <input v-model="historialHasta" type="date" class="tx-input">
          </label>
        </div>

        <div v-if="historialCargando" class="historial-list">
          <SkeletonCard v-for="i in 3" :key="i" variante="contenido" :lineas="3" />
        </div>

        <div v-else-if="historial.length === 0" class="empty-wrap history-empty">
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="#d1d5db">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No se encontraron fases completadas.</p>
          <span class="empty-hint">Prueba otro rango de fechas o busca una orden diferente.</span>
        </div>

        <div v-else class="historial-list">
          <TransitionGroup name="row" tag="div" class="hist-entries">
            <article v-for="h in historial" :key="h.id" class="hist-card">
              <div class="hist-left">
                <div class="hist-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="hist-info">
                  <div class="hist-title-row">
                    <h3 class="hist-orden">{{ h.numeroOrden }} · {{ h.producto }}</h3>
                    <span class="oc-prio" :class="h.prioridad">{{ capitalize(h.prioridad) }}</span>
                    <span v-if="h.aTiempo !== null" class="delivery-badge" :class="h.aTiempo ? 'on-time' : 'late'">{{ h.aTiempo ? 'A tiempo' : 'Con retraso' }}</span>
                  </div>
                  <p class="hist-fase">Fase {{ h.numeroFase }} · {{ h.fase }}</p>
                  <dl class="hist-details">
                    <div><dt>Cliente</dt><dd>{{ h.cliente }}</dd></div>
                    <div><dt>Prendas</dt><dd>{{ h.cantidad }}</dd></div>
                    <div><dt>Fecha límite</dt><dd>{{ h.fechaLimite }}</dd></div>
                    <div><dt>Completada</dt><dd>{{ h.fecha }}</dd></div>
                  </dl>
                  <div class="hist-nota" v-if="h.nota"><strong>Nota:</strong> {{ h.nota }}</div>
                </div>
              </div>
            </article>
          </TransitionGroup>
          <BasePagination
            v-model:pagina="historialPagina"
            v-model:por-pagina="historialPorPagina"
            :total="historialTotal"
            :opciones-tamano="[10]"
            etiqueta="registros"
          />
        </div>
      </div>
    </main>

    <!-- ── MODAL REPORTAR PROGRESO ── -->
    <BaseModal
      :open="modalVisible"
      titulo="Completar fase"
      :descripcion="ordenActual ? `${ordenActual.numeroOrden} — ${ordenActual.producto}` : ''"
      tamano="md"
      :cerrar-al-clic-fuera="false"
      @update:open="val => !val && cerrarModal()"
    >
      <form v-if="ordenActual" id="form-avance" class="tx-form" novalidate @submit.prevent="enviarReporte">
        <div class="confirmation-note" role="status">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          <p>Vas a marcar <strong>todas las prendas de esta fase</strong> como completadas. Esta acción avanzará el estado de la orden según corresponda.</p>
        </div>

        <dl class="avance-resumen">
          <div><dt>Orden</dt><dd>{{ ordenActual.numeroOrden }}</dd></div>
          <div><dt>Fase</dt><dd>{{ ordenActual.numeroFase }} · {{ ordenActual.nombre }}</dd></div>
          <div><dt>Prendas</dt><dd>{{ ordenActual.unidadesTotales }}</dd></div>
        </dl>

        <BaseField label="Nota" opcional hint="Se guarda junto con el avance y aparece en tu historial." v-slot="{ attrs }">
          <textarea v-bind="attrs" v-model="reporte.nota" class="tx-input" rows="3"
            placeholder="Ej: faltan botones para terminar 5 prendas"></textarea>
        </BaseField>
      </form>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="enviando" @click="cerrarModal">Cancelar</button>
        <button type="submit" form="form-avance" class="tx-btn tx-btn--primary" :disabled="enviando">
          <span v-if="enviando" class="tx-spinner" aria-hidden="true"></span>
          <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
          </svg>
          {{ enviando ? 'Confirmando…' : 'Confirmar' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import PageHeader from '../../components/PageHeader.vue'
import SkeletonCard from '../../components/base/SkeletonCard.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseField from '../../components/base/BaseField.vue'
import BasePagination from '../../components/base/BasePagination.vue'
import { useToast } from '../../composables/useToast'
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'

const toast = useToast()
const auth = useAuthStore()
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const authHeaders = () => auth.authHeader()

const tabActivo    = ref('activas')
const modalVisible = ref(false)
const ordenActual  = ref(null)
const cargando     = ref(true)
const mounted      = ref(false)

const historial = ref([])
const ordenes   = ref([])
const historialPagina = ref(1)
const historialPorPagina = ref(10)
const historialTotal = ref(0)
const historialBusqueda = ref('')
const historialDesde = ref('')
const historialHasta = ref('')
const historialCargando = ref(false)

const reporte = ref({ nota: '' })
const enviando = ref(false)

// ── Helpers ──
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

function estaVencida(fechaStr) {
  if (!fechaStr || fechaStr === '—') return false
  const fecha = new Date(fechaStr)
  const ahora = new Date()
  return fecha < new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
}

function estadoLabel(estado) {
  return { 'pendiente': 'Pendiente', 'completado': 'Completada', 'retrasado': 'Retrasada' }[estado] || estado
}

function fechaHora(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

async function cargarHistorial() {
  if (!auth.idUsuario) return
  historialCargando.value = true
  try {
    const query = new URLSearchParams({ page: historialPagina.value, limit: historialPorPagina.value })
    if (historialBusqueda.value.trim()) query.set('search', historialBusqueda.value.trim())
    if (historialDesde.value) query.set('desde', historialDesde.value)
    if (historialHasta.value) query.set('hasta', historialHasta.value)
    const res = await fetch(`${BASE}/orden-operario/operario/${auth.idUsuario}/historial?${query}`, { headers: authHeaders() })
    if (!res.ok) throw new Error('No se pudo cargar el historial')
    const payload = await res.json()
    historialTotal.value = payload.pagination?.total || 0
    historial.value = (payload.data || []).map(t => ({
      id: t.Id_Orden_Operario,
      numeroOrden: `ORD-${String(t.Id_Orden).padStart(3, '0')}`,
      producto: t.Producto || t.Descripcion_Orden || `Orden #${t.Id_Orden}`,
      numeroFase: t.Numero_Fase,
      fase: t.Descripcion_Fase || 'Sin descripción',
      nota: t.Nota_Operario,
      fecha: fechaHora(t.Fecha_Completada || t.updated_at),
      prioridad: (t.Prioridad || 'Media').toLowerCase(),
      cantidad: Number(t.Cuota ?? t.Cantidad ?? 0),
      cliente: t.Cliente || '—',
      fechaLimite: t.Fecha_Limite?.split('T')[0] || '—',
      aTiempo: t.Completada_A_Tiempo,
    }))
  } catch (error) {
    console.error('Error cargando historial:', error)
    toast.error('No se pudo cargar el historial.')
  } finally {
    historialCargando.value = false
  }
}

// ── Carga ──
onMounted(async () => {
  if (!auth.idUsuario) { cargando.value = false; setTimeout(() => { mounted.value = true }, 80); return }

  try {
    const fasesRes = await fetch(`${BASE}/orden-operario/operario/${auth.idUsuario}`, { headers: authHeaders() })
    if (!fasesRes.ok) throw new Error('No se pudieron cargar las fases')
    const data = await fasesRes.json()
    ordenes.value = data
      .map(t => {
        const completada = t.Estado_Fase === 'Completada'
        const retrasada = !completada && estaVencida(t.Fecha_Limite)

        const cuota  = Number(t.Cuota ?? t.Cantidad ?? 0)
        return {
          numeroOrden:     `ORD-${String(t.Id_Orden).padStart(3,'0')}`,
          idReal:          t.Id_Orden_Operario,
          idOrden:         t.Id_Orden,
          idCliente:       t.Id_Cliente,
          numeroFase:      t.Numero_Fase,
          nombre:          t.Descripcion_Fase || t.Descripcion_Orden || 'Sin descripción de fase',
          producto:        t.Producto || t.Nombre_Orden || t.Descripcion_Orden || `Orden #${t.Id_Orden}`,
          estado:          completada ? 'completado' : retrasada ? 'retrasado' : 'pendiente',
          prioridad:       (t.Prioridad || 'Media').toLowerCase(),
          fechaLimite:     t.Fecha_Limite?.split('T')[0] || '—',
          unidadesTotales: cuota,
        }
      }).sort(ordenarFases)
    await cargarHistorial()
  } catch (err) {
    console.error('Error cargando avances:', err)
  } finally {
    cargando.value = false
    setTimeout(() => { mounted.value = true }, 80)
  }
})

// ── Computed ──
const ordenesActivas          = computed(() => ordenes.value.filter(o => o.estado !== 'completado'))

watch([historialPagina, historialPorPagina], cargarHistorial)
watch([historialDesde, historialHasta], () => {
  if (historialPagina.value !== 1) historialPagina.value = 1
  else cargarHistorial()
})
let historialTimer
watch(historialBusqueda, () => {
  clearTimeout(historialTimer)
  historialTimer = setTimeout(() => {
    if (historialPagina.value !== 1) historialPagina.value = 1
    else cargarHistorial()
  }, 300)
})

function abrirModal(o) {
  ordenActual.value = o
  reporte.value = { nota: '' }
  modalVisible.value = true
}
function cerrarModal() { modalVisible.value = false }

// ── Enviar reporte ──
async function enviarReporte() {
  const o = ordenActual.value
  if (!o || enviando.value) return
  enviando.value = true

  try {
    const res = await fetch(`${BASE}/orden-operario/${o.idReal}/completar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        Nota_Operario: reporte.value.nota,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `No se pudo guardar el avance (${res.status})`)

    o.estado = 'completado'
    await cargarHistorial()
    showToast('Fase completada.', 'toast-success')
    cerrarModal()
  } catch (err) {
    console.error('Error:', err)
    showToast(err.message || 'No se pudo guardar el avance. Inténtalo de nuevo.', 'toast-error')
  } finally {
    enviando.value = false
  }
}

function ordenarFases(a, b) {
  const grupo = o => o.estado === 'retrasado' ? 0 : o.estado === 'pendiente' ? 1 : 2
  return grupo(a) - grupo(b) || new Date(a.fechaLimite || '9999-12-31') - new Date(b.fechaLimite || '9999-12-31')
}

// ── Toast ──
function showToast(msg, type = 'toast-success') {
  if (type === 'toast-error') toast.error(msg)
  else toast.success(msg)
}
</script>

<style scoped>
/* ── MODAL DE AVANCE (fase 7) ── */
.avance-resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); margin: 0; }
.avance-resumen > div { padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-muted); }
.avance-resumen dt { font-size: var(--text-xs); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); }
.avance-resumen dd { margin: 2px 0 0; font-size: var(--text-md); font-weight: var(--weight-bold); color: var(--color-text); font-variant-numeric: tabular-nums; }
.avance-resumen dd.is-ok { color: var(--color-success); }
.avance-resumen dd.is-info { color: var(--color-info); }
.confirmation-note { display: flex; gap: var(--space-3); align-items: flex-start; padding: var(--space-4); border-radius: var(--radius-lg); background: #eff6ff; color: #1e3a5f; border: 1px solid #bfdbfe; }
.confirmation-note svg { flex: 0 0 auto; margin-top: 1px; }
.confirmation-note p { margin: 0; line-height: 1.55; }

/* ── LAYOUT ── */
.layout { display: flex; min-height: 100vh; background: #f1f5f9; position: relative; overflow: hidden; }
.main   { flex: 1; padding: 28px 30px; overflow-y: auto; position: relative; z-index: 1; }

/* ── FONDO DECORATIVO ── */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: #2563eb; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #16a34a; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

/* ── HERO HEADER ── */
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }

/* ── TABS ── */
.tabs-wrapper { display: flex; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 5px; margin-bottom: 22px; gap: 4px; opacity: 0; transform: translateY(12px); transition: opacity 0.4s ease, transform 0.4s ease; }
.tabs-wrapper.section-visible { opacity: 1; transform: translateY(0); }
.tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px; border: none; background: transparent; border-radius: 8px; font-size: 14px; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.18s; }
.tab-btn:hover:not(.active) { background: #f3f4f6; color: #374151; }
.tab-btn.active { background: #1f3a52; color: white; font-weight: 600; }
.tab-badge { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
.tab-badge.blue  { background: #dbeafe; color: #1d4ed8; }
.tab-badge.green { background: #dcfce7; color: #15803d; }
.tab-btn.active .tab-badge { background: rgba(255,255,255,0.2); color: white; }

/* ── LOADING / EMPTY ── */
@keyframes spin { to { transform: rotate(360deg); } }
.empty-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; gap: 12px; color: var(--color-text-muted); font-size: 14px; background: white; border: 1px solid #e5e7eb; border-radius: 14px; }
.empty-hint { font-size: 12px; color: var(--color-text-muted); }

/* ── GRID ÓRDENES ── */
/* Dos columnas en escritorio */
.orders-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); align-items: start; opacity: 0; transform: translateY(var(--motion-shift-md)); transition: opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out); }
.orders-grid--loading { opacity: 1; transform: none; }
.orders-grid.section-visible { opacity: 1; transform: translateY(0); }
.order-card { background: white; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; }
.order-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.07); transform: translateY(-2px); }
.order-card.card-retrasada { border-color: #fca5a5; background: #fff8f8; }

.oc-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 12px; border-bottom: 1px solid #f3f4f6; }
.oc-header.pendiente { background: linear-gradient(90deg, #eff6ff, transparent); border-bottom-color: #dbeafe; }
.oc-header.retrasado  { background: linear-gradient(90deg, #fef2f2, transparent); border-bottom-color: #fecaca; }
.oc-header.completado { background: linear-gradient(90deg, #f0fdf4, transparent); border-bottom-color: #bbf7d0; }

.oc-header-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.oc-id   { font-size: 13px; font-weight: 700; color: #1f3a52; }
.oc-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.oc-badge.pendiente { background: #dbeafe; color: #1d4ed8; }
.oc-badge.completado  { background: #dcfce7; color: #15803d; }
.oc-badge.retrasado   { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.oc-prio { padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }

.oc-body    { padding: 16px 18px; }
.oc-nombre  { font-size: 17px; font-weight: 700; color: #111827; margin: 0 0 5px; }
.oc-fase    { font-size: 13px; color: #6b7280; margin: 0 0 16px; }
.oc-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 16px; }
.oc-meta-item { display: flex; flex-direction: column; gap: 3px; }
.oc-meta-lbl  { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
.oc-meta-val  { font-size: 14px; font-weight: 600; color: #111827; }
.oc-meta-val.prendas { display: flex; align-items: baseline; gap: 3px; }
.oc-meta-val.prendas strong { font-size: 18px; color: #1f3a52; }
.oc-meta-val.prendas .sep   { color: var(--color-text-muted); }
.oc-meta-val.prendas .tot   { font-size: 13px; color: var(--color-text-muted); font-weight: 500; }
.val-vencida { color: #dc2626 !important; }

.oc-progress { margin-bottom: 18px; }
.oc-progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.oc-progress-lbl { font-size: 12px; color: #6b7280; font-weight: 500; }
.oc-progress-pct { font-size: 14px; font-weight: 700; color: #374151; }
.pct-verde   { color: #15803d !important; }
.pct-rojo    { color: #dc2626 !important; }
.oc-bar { width: 100%; height: 10px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
.oc-bar-fill { height: 100%; background: #1f3a52; border-radius: 999px; transition: width 0.6s ease; }
.oc-bar-fill.fill-completado { background: #16a34a; }
.oc-bar-fill.fill-retrasado  { background: #dc2626; }

.btn-reportar { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #1f3a52; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.15s; }
.btn-reportar:hover:not(:disabled) { background: #2d5580; transform: translateY(-1px); }
.btn-reportar:active:not(:disabled) { transform: scale(.97); }
.btn-reportar:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }

/* ── HISTORIAL ── */
.history-filters { display: grid; grid-template-columns: minmax(240px, 1fr) 180px 180px; gap: var(--space-3); align-items: end; padding: var(--space-4); margin-bottom: var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.history-filters label { display: flex; flex-direction: column; gap: 6px; color: var(--color-text-muted); font-size: var(--text-sm); font-weight: var(--weight-semibold); }
.historial-list { display: flex; flex-direction: column; gap: 12px; }
.hist-entries   { display: flex; flex-direction: column; gap: 12px; }

.hist-card { display: flex; align-items: flex-start; gap: 14px; background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px 20px; transition: box-shadow 0.2s, transform 0.2s; }
.hist-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
.hist-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; }
.hist-icon { width: 38px; height: 38px; flex-shrink: 0; background: #f0fdf4; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #15803d; }
.hist-info  { flex: 1; min-width: 0; }
.hist-title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.hist-orden { font-size: 15px; font-weight: 700; color: #111827; margin: 0; }
.hist-fase { margin: 5px 0 12px; color: #64748b; font-size: 13px; }
.hist-details { display: grid; grid-template-columns: repeat(4, minmax(100px, 1fr)); gap: 10px 18px; margin: 0; }
.hist-details dt { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; }
.hist-details dd { margin: 2px 0 0; font-size: 13px; font-weight: 600; color: #334155; }
.delivery-badge { display: inline-flex; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.delivery-badge.on-time { background: #dcfce7; color: #166534; }
.delivery-badge.late { background: #fee2e2; color: #991b1b; }
.hist-nota  { font-size: 12px; color: #6b7280; background: #f9fafb; border-radius: 6px; padding: 5px 8px; margin-top: 4px; border: 1px solid #f3f4f6; }
.hist-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.hist-unidades { display: flex; align-items: baseline; gap: 4px; }
.hist-uni-lbl  { font-size: 12px; color: var(--color-text-muted); }
.hist-fecha    { font-size: 11px; color: var(--color-text-muted); }

/* ── MODAL ── */

/* ── AVANCE PARCIAL ── */

.toast-success { background: #166534; }
.toast-error   { background: #991b1b; }

/* ── Transitions ── */
.row-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.row-leave-active { transition: opacity var(--duration-fast) var(--ease-in); animation: none; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 900px) {
  .main { padding: 20px 16px; }
  .orders-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .history-filters { grid-template-columns: 1fr 1fr; }
  .history-search { grid-column: 1 / -1; }
  .hist-details { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 620px) {
  .orders-grid { grid-template-columns: 1fr; }
  .avance-resumen { grid-template-columns: 1fr; }
  .history-filters { grid-template-columns: 1fr; }
  .history-search { grid-column: auto; }
  .hist-details { grid-template-columns: 1fr; }
}

/* Reglas repuestas (clases que llegan desde datos) */
.oc-prio.alta  { background: #fee2e2; color: #991b1b; }
.oc-prio.media { background: #fef3c7; color: #92400e; }
.oc-prio.baja  { background: #f0fdf4; color: #166534; }
</style>
