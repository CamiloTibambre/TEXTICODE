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
          <span v-if="historial.length" class="tab-badge green">{{ historial.length }}</span>
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
                  <span class="oc-id">{{ o.id }}</span>
                  <span class="oc-badge" :class="o.estado">{{ estadoLabel(o.estado) }}</span>
                  <span class="oc-prio" :class="o.prioridad">{{ capitalize(o.prioridad) }}</span>
                </div>
              </div>

              <div class="oc-body">
                <div class="oc-nombre">{{ o.producto || o.nombre }}</div>
                <div v-if="o.producto && o.nombre && o.producto !== o.nombre" class="oc-fase">
                  Fase: {{ o.nombre }}
                </div>

                <div class="oc-meta">
                  <div class="oc-meta-item">
                    <span class="oc-meta-lbl">Prendas realizadas</span>
                    <span class="oc-meta-val prendas">
                      <strong>{{ o.unidadesHechas }}</strong>
                      <span class="sep">/</span>
                      <span class="tot">{{ o.unidadesTotales }}</span>
                    </span>
                  </div>
                  <div class="oc-meta-item">
                    <span class="oc-meta-lbl">Fecha Límite</span>
                    <span class="oc-meta-val" :class="{ 'val-vencida': estaVencida(o.fechaLimite) }">{{ o.fechaLimite }}</span>
                  </div>
                </div>

                <div class="oc-progress">
                  <div class="oc-progress-row">
                    <span class="oc-progress-lbl">Progreso de la fase</span>
                    <span class="oc-progress-pct" :class="{ 'pct-verde': o.progreso >= 100, 'pct-rojo': o.estado === 'retrasado' }">{{ o.progreso }}%</span>
                  </div>
                  <div class="oc-bar">
                    <div
                      class="oc-bar-fill"
                      :class="{
                        'fill-completado': o.progreso >= 100,
                        'fill-retrasado':  o.estado === 'retrasado'
                      }"
                      :style="{ width: o.progreso + '%' }"
                    ></div>
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
        <div v-if="historial.length === 0" class="empty-wrap">
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="#d1d5db">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No hay reportes en el historial aún.</p>
          <span class="empty-hint">Los reportes que envíes aparecerán aquí.</span>
        </div>

        <div v-else class="historial-list">
          <TransitionGroup name="row" tag="div" class="hist-entries">
            <div v-for="h in historialOrdenado" :key="h.id" class="hist-card">
              <div class="hist-left">
                <div class="hist-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="hist-info">
                  <div class="hist-orden">{{ h.orden }}</div>
                  <div class="hist-nota" v-if="h.nota">{{ h.nota }}</div>
                </div>
              </div>
              <div class="hist-right">
                <div class="hist-unidades"><span class="hist-uni-lbl">Completada</span></div>
                <div class="hist-fecha">{{ h.fecha }}</div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </main>

    <!-- ── MODAL REPORTAR PROGRESO ── -->
    <BaseModal
      :open="modalVisible"
      titulo="Reportar avance"
      :descripcion="ordenActual ? `${ordenActual.id} — ${ordenActual.nombre}` : ''"
      tamano="md"
      :cerrar-al-clic-fuera="false"
      @update:open="val => !val && cerrarModal()"
    >
      <form v-if="ordenActual" id="form-avance" class="tx-form" novalidate @submit.prevent="enviarReporte">
        <dl class="avance-resumen">
          <div><dt>Fase</dt><dd>{{ ordenActual.id }}</dd></div>
          <div><dt>Tu cuota</dt><dd>{{ ordenActual.unidadesTotales }} prendas</dd></div>
          <div><dt>Al guardar</dt><dd :class="completaFase ? 'is-ok' : 'is-info'">{{ resultadoTexto }}</dd></div>
        </dl>

        <div class="avance-barra" aria-hidden="true">
          <span class="avance-barra__fill" :class="{ 'is-ok': completaFase }"
            :style="{ transform: `scaleX(${cantidadValida ? reporte.cantidad / Math.max(1, cuotaActual) : 0})` }"></span>
        </div>

        <BaseField label="Prendas terminadas hasta ahora" requerido
          :error="cantidadValida ? '' : `Escribe un número entero entre 0 y ${ordenActual.unidadesTotales}.`"
          :hint="completaFase ? 'Con esta cantidad la fase queda completada.' : `Te quedarán ${ordenActual.unidadesTotales - reporte.cantidad} prendas por terminar.`"
          v-slot="{ attrs }">
          <div class="material-row">
            <input v-bind="attrs" v-model.number="reporte.cantidad" type="number" inputmode="numeric" min="0"
              :max="ordenActual.unidadesTotales" step="1" class="tx-input" placeholder="0" required>
            <button type="button" class="tx-btn tx-btn--secondary" @click="reporte.cantidad = ordenActual.unidadesTotales">
              Todas ({{ ordenActual.unidadesTotales }})
            </button>
          </div>
        </BaseField>

        <BaseField label="Nota" opcional hint="Se guarda junto con el avance y aparece en tu historial." v-slot="{ attrs }">
          <textarea v-bind="attrs" v-model="reporte.nota" class="tx-input" rows="3"
            placeholder="Ej: faltan botones para terminar 5 prendas"></textarea>
        </BaseField>
      </form>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="enviando" @click="cerrarModal">Cancelar</button>
        <button type="submit" form="form-avance" class="tx-btn tx-btn--primary" :disabled="!cantidadValida || enviando">
          <span v-if="enviando" class="tx-spinner" aria-hidden="true"></span>
          <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
          </svg>
          {{ enviando ? 'Guardando…' : completaFase ? 'Completar fase' : 'Guardar avance' }}
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
import { useToast } from '../../composables/useToast'

const toast = useToast()
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'

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

const reporte = ref({ cantidad: 0, nota: '' })
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
  return { 'en-proceso': 'En Proceso', 'completado': 'Completado', 'retrasado': 'Retrasada' }[estado] || estado
}

// ── Carga ──
onMounted(async () => {
  if (!auth.idUsuario) { cargando.value = false; setTimeout(() => { mounted.value = true }, 80); return }

  try {
    const fasesRes = await fetch(`${BASE}/orden-operario/operario/${auth.idUsuario}`, { headers: authHeaders() })
    if (!fasesRes.ok) throw new Error('No se pudieron cargar las fases')
    const data = await fasesRes.json()
    let dataHistorial = []
    try {
      const historialRes = await fetch(`${BASE}/orden-operario/operario/${auth.idUsuario}/historial`, { headers: authHeaders() })
      if (historialRes.ok) dataHistorial = await historialRes.json()
    } catch {
      // El historial no impide que las fases activas se muestren.
    }

    ordenes.value = data
      .map(t => {
        const completada = t.Estado_Fase === 'Completada'
        const retrasada = !completada && estaVencida(t.Fecha_Limite)

        const cuota  = Number(t.Cuota ?? t.Cantidad ?? 0)
        const hechas = Number(t.Cantidad_Realizada || 0)

        return {
          id:              `OP-${String(t.Id_Orden).padStart(3,'0')} · F${t.Numero_Fase}`,
          idReal:          t.Id_Orden_Operario,
          idCliente:       t.Id_Cliente,
          nombre:          t.Descripcion_Fase || t.Descripcion_Orden || 'Sin descripción de fase',
          producto:        t.Producto || t.Nombre_Orden || t.Descripcion_Orden || `Orden #${t.Id_Orden}`,
          estado:          completada ? 'completado' : retrasada ? 'retrasado' : 'en-proceso',
          prioridad:       (t.Prioridad || 'Media').toLowerCase(),
          fechaLimite:     t.Fecha_Limite?.split('T')[0] || '—',
          unidadesHechas:  completada ? cuota : hechas,
          unidadesTotales: cuota,
          progreso:        completada ? 100 : Math.min(100, Math.round((hechas / Math.max(1, cuota)) * 100)),
        }
      }).sort(ordenarFases)
    historial.value = dataHistorial.map(t => ({
      id: t.Id_Orden_Operario,
      ordenId: t.Id_Orden,
      orden: `OP-${String(t.Id_Orden).padStart(3, '0')} · F${t.Numero_Fase} — ${t.Producto || t.Descripcion_Fase || ''}`,
      nota: t.Nota_Operario,
      fecha: new Date(t.Fecha_Completada || t.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    }))
  } catch (err) {
    console.error('Error cargando avances:', err)
  } finally {
    cargando.value = false
    setTimeout(() => { mounted.value = true }, 80)
  }
})

// ── Computed ──
const ordenesActivas          = computed(() => ordenes.value.filter(o => o.estado !== 'completado'))
const historialOrdenado       = computed(() => [...historial.value].reverse())

// ── Modal ──
const cuotaActual    = computed(() => Number(ordenActual.value?.unidadesTotales ?? 0))
const cantidadValida = computed(() => {
  const c = reporte.value.cantidad
  return Number.isInteger(c) && c >= 0 && c <= cuotaActual.value
})
const completaFase   = computed(() => cantidadValida.value && reporte.value.cantidad === cuotaActual.value)
const resultadoTexto = computed(() => {
  if (!cantidadValida.value) return '—'
  if (completaFase.value) return 'Completada'
  return `${Math.round((reporte.value.cantidad / Math.max(1, cuotaActual.value)) * 100)}%`
})

function abrirModal(o) {
  ordenActual.value = o
  reporte.value = { cantidad: o.unidadesHechas, nota: '' }
  modalVisible.value = true
}
function cerrarModal() { modalVisible.value = false }

// ── Enviar reporte ──
async function enviarReporte() {
  const o = ordenActual.value
  if (!o || !cantidadValida.value || enviando.value) return
  enviando.value = true

  try {
    const res = await fetch(`${BASE}/orden-operario/${o.idReal}/avance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        Cantidad_Realizada: reporte.value.cantidad,
        Nota_Operario: reporte.value.nota,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `No se pudo guardar el avance (${res.status})`)

    const nota = reporte.value.nota
    o.unidadesHechas = reporte.value.cantidad

    if (data.fase?.Estado_Fase === 'Completada') {
      o.estado   = 'completado'
      o.progreso = 100
      historial.value.unshift({ id: o.idReal, ordenId: o.idReal, orden: `${o.id} — ${o.nombre}`, nota, fecha: new Date().toLocaleDateString('es-CO') })
      showToast('Fase completada.', 'toast-success')
    } else {
      o.progreso = Math.min(99, Math.round((o.unidadesHechas / Math.max(1, o.unidadesTotales)) * 100))
      showToast('Avance guardado.', 'toast-success')
    }
    cerrarModal()
  } catch (err) {
    console.error('Error:', err)
    showToast(err.message || 'No se pudo guardar el avance. Inténtalo de nuevo.', 'toast-error')
  } finally {
    enviando.value = false
  }
}

function ordenarFases(a, b) {
  const grupo = o => o.estado === 'retrasado' ? 0 : o.estado === 'en-proceso' ? 1 : 2
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
.avance-barra { height: 8px; margin-top: calc(var(--space-2) * -1); border-radius: var(--radius-full); background: var(--color-surface-hover); overflow: hidden; }
.avance-barra__fill { display: block; width: 100%; height: 100%; border-radius: inherit; background: var(--color-info); transform-origin: left; transition: transform var(--duration-slow) var(--ease-out), background var(--duration-fast); }
.avance-barra__fill.is-ok { background: var(--color-success-solid, #16a34a); }
.material-row { display: flex; gap: var(--space-2); }
.material-row .tx-input { flex: 1; min-width: 0; }

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
.orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: var(--space-4); align-items: start; opacity: 0; transform: translateY(var(--motion-shift-md)); transition: opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out); }
.orders-grid--loading { opacity: 1; transform: none; }
.orders-grid.section-visible { opacity: 1; transform: translateY(0); }
.order-card { background: white; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; }
.order-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.07); transform: translateY(-2px); }
.order-card.card-retrasada { border-color: #fca5a5; background: #fff8f8; }

.oc-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 12px; border-bottom: 1px solid #f3f4f6; }
.oc-header.en-proceso { background: linear-gradient(90deg, #eff6ff, transparent); border-bottom-color: #dbeafe; }
.oc-header.retrasado  { background: linear-gradient(90deg, #fef2f2, transparent); border-bottom-color: #fecaca; }
.oc-header.completado { background: linear-gradient(90deg, #f0fdf4, transparent); border-bottom-color: #bbf7d0; }

.oc-header-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.oc-id   { font-size: 13px; font-weight: 700; color: #1f3a52; }
.oc-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.oc-badge.en-proceso { background: #dbeafe; color: #1d4ed8; }
.oc-badge.completado  { background: #dcfce7; color: #15803d; }
.oc-badge.retrasado   { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.oc-prio { padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }

.oc-body    { padding: 16px 18px; }
.oc-nombre  { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 14px; }
.oc-fase    { font-size: 12px; color: #6b7280; margin: -9px 0 14px; }
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
.historial-list { display: flex; flex-direction: column; gap: 12px; }
.hist-entries   { display: flex; flex-direction: column; gap: 12px; }

.hist-card { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px 20px; transition: box-shadow 0.2s, transform 0.2s; }
.hist-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
.hist-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; }
.hist-icon { width: 38px; height: 38px; flex-shrink: 0; background: #f0fdf4; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #15803d; }
.hist-info  { flex: 1; min-width: 0; }
.hist-orden { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
}

/* Reglas repuestas (clases que llegan desde datos) */
.oc-prio.alta  { background: #fee2e2; color: #991b1b; }
.oc-prio.media { background: #fef3c7; color: #92400e; }
.oc-prio.baja  { background: #f0fdf4; color: #166534; }
</style>