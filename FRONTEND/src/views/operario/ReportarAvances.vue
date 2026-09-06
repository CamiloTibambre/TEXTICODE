<template>
  <div class="layout">
    <AppSidebar rol="operario" />

    <main class="main">

      <!-- FONDO DECORATIVO -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': mounted }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Reportar Avances'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: mounted ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Actualiza el progreso de tus órdenes asignadas</p>
          </div>
        </div>
      </div>

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

        <div v-if="cargando" class="loading-wrap">
          <div class="spinner"></div>
          <p>Cargando órdenes...</p>
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
                <div class="oc-nombre">{{ o.nombre }}</div>

                <div class="oc-meta">
                  <div class="oc-meta-item">
                    <span class="oc-meta-lbl">Prendas</span>
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
                    <span class="oc-progress-lbl">Progreso de fabricación</span>
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
                  <div class="oc-bar-labels">
                    <span>0</span>
                    <span>{{ Math.round(o.unidadesTotales * 0.25) }}</span>
                    <span>{{ Math.round(o.unidadesTotales * 0.5) }}</span>
                    <span>{{ Math.round(o.unidadesTotales * 0.75) }}</span>
                    <span>{{ o.unidadesTotales }}</span>
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
                  Reportar Progreso
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
          <div class="hist-summary" :class="{ 'section-visible': mounted }" style="transition-delay: 200ms">
            <div class="hist-sum-item" :class="{ 'card-visible': mounted }" style="transition-delay: 200ms">
              <span class="hist-sum-num">{{ historial.length }}</span>
              <span class="hist-sum-lbl">Reportes enviados</span>
            </div>
            <div class="hist-sum-item" :class="{ 'card-visible': mounted }" style="transition-delay: 280ms">
              <span class="hist-sum-num">{{ totalUnidadesReportadas }}</span>
              <span class="hist-sum-lbl">Prendas reportadas</span>
            </div>
            <div class="hist-sum-item" :class="{ 'card-visible': mounted }" style="transition-delay: 360ms">
              <span class="hist-sum-num">{{ ordenesUnicas }}</span>
              <span class="hist-sum-lbl">Órdenes trabajadas</span>
            </div>
          </div>

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
                <div class="hist-unidades">
                  <span class="hist-uni-num">+{{ h.nuevas }}</span>
                  <span class="hist-uni-lbl">prendas</span>
                </div>
                <div class="hist-pct-wrap">
                  <div class="hist-pct-bar">
                    <div class="hist-pct-fill" :style="{ width: h.progreso + '%' }"></div>
                  </div>
                  <span class="hist-pct-txt">{{ h.progreso }}%</span>
                </div>
                <div class="hist-fecha">{{ h.fecha }}</div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </main>

    <!-- ── MODAL REPORTAR PROGRESO ── -->
    <Transition name="modal">
      <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">Reportar Progreso</div>
              <div class="modal-subtitle">{{ ordenActual?.id }} — {{ ordenActual?.nombre }}</div>
            </div>
            <button class="modal-close" @click="cerrarModal">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-estado" v-if="ordenActual">
            <div class="modal-estado-item">
              <span class="modal-estado-lbl">Prendas hechas</span>
              <span class="modal-estado-val">{{ ordenActual.unidadesHechas }} / {{ ordenActual.unidadesTotales }}</span>
            </div>
            <div class="modal-estado-item">
              <span class="modal-estado-lbl">Progreso actual</span>
              <span class="modal-estado-val">{{ ordenActual.progreso }}%</span>
            </div>
            <div class="modal-estado-item">
              <span class="modal-estado-lbl">Quedan</span>
              <span class="modal-estado-val orange">{{ ordenActual.unidadesTotales - ordenActual.unidadesHechas }}</span>
            </div>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Unidades completadas en esta sesión <span class="req">*</span></label>
              <input v-model.number="reporte.nuevas" type="number" min="1" class="form-input" placeholder="Ej: 10">
              <span class="form-hint" v-if="ordenActual && reporte.nuevas > 0">
                Total tras este reporte: {{ Math.min(ordenActual.unidadesHechas + reporte.nuevas, ordenActual.unidadesTotales) }} / {{ ordenActual.unidadesTotales }}
              </span>
            </div>
            <div class="form-group">
              <label class="form-label">Nota <span class="opt">(opcional)</span></label>
              <textarea v-model="reporte.nota" class="form-textarea" rows="3" placeholder="Describe el avance..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
            <button class="btn-enviar" @click="enviarReporte" :disabled="!reporte.nuevas || reporte.nuevas <= 0">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
              Enviar Reporte
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast" :class="toastType">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
          <path v-if="toastType === 'toast-success'" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
        </svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAuthStore } from '../../stores/auth'

// ── SENDGRID ───────────────────────────────────────────────────
import { useNotificaciones } from '../../composables/useNotificaciones'
const { notificarEstado } = useNotificaciones()

const auth = useAuthStore()
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const tabActivo    = ref('activas')
const modalVisible = ref(false)
const ordenActual  = ref(null)
const cargando     = ref(true)
const toastMsg     = ref('')
const toastType    = ref('toast-success')
const mounted      = ref(false)

const historial = ref([])
const ordenes   = ref([])

const reporte = ref({ nuevas: 0, nota: '' })
const historialStorageKey = computed(() => `historial-avances-operario-${auth.idUsuario || 'anon'}`)

// ── Helpers ──
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

function estaVencida(fechaStr) {
  if (!fechaStr || fechaStr === '—') return false
  return new Date(fechaStr) < new Date()
}

function estadoLabel(estado) {
  return { 'en-proceso': 'En Proceso', 'completado': 'Completado', 'retrasado': 'Retrasada' }[estado] || estado
}

// ── Helper: obtener correo del cliente por Id ──────────────────
async function obtenerCorreoCliente(idCliente) {
  try {
    const res  = await fetch(`${BASE}/usuarios/${idCliente}`)
    if (!res.ok) return null
    const data = await res.json()
    return { correo: data.Correo, nombre: data.Nombre_Completo }
  } catch {
    return null
  }
}

// ── Carga ──
onMounted(async () => {
  if (!auth.idUsuario) { cargando.value = false; setTimeout(() => { mounted.value = true }, 80); return }

  cargarHistorialLocal()

  try {
    const res  = await fetch(`${BASE}/ordenes/operario/${auth.idUsuario}`)
    const data = await res.json()

    ordenes.value = data
      .filter(t => t.Estado !== 'Cancelada')
      .map(t => {
        const realizadas  = t.Unidades_Realizadas ?? 0
        const unidades    = t.Unidades ?? t.Cantidad ?? 1
        const cantidad    = t.Cantidad ?? 1
        const estado      = t.Estado === 'Completada' ? 'completado'
                          : t.Estado === 'Retrasada' ? 'retrasado'
                          : 'en-proceso'

        let progreso = 0
        if (estado === 'completado') {
          progreso = 100
        } else if (unidades > 0 && realizadas > 0) {
          progreso = Math.min(100, Math.round((realizadas / unidades) * 100))
        }

        return {
          id:              `OP-${String(t.Id_Orden).padStart(3,'0')}`,
          idReal:          t.Id_Orden,
          idCliente:       t.Id_Cliente,
          nombre:          t.Descripcion,
          producto:        t.Producto || t.Descripcion,
          estado,
          prioridad:       (t.Prioridad || 'Media').toLowerCase(),
          unidadesHechas:  realizadas,
          unidadesTotales: cantidad,
          unidadesAsig:    unidades,
          fechaLimite:     t.Fecha_Limite?.split('T')[0] || '—',
          progreso,
        }
      })
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
const totalUnidadesReportadas = computed(() => historial.value.reduce((acc, h) => acc + h.nuevas, 0))
const ordenesUnicas           = computed(() => new Set(historial.value.map(h => h.ordenId)).size)

// ── Modal ──
function abrirModal(o) {
  ordenActual.value = o
  reporte.value = { nuevas: 0, nota: '' }
  modalVisible.value = true
}
function cerrarModal() { modalVisible.value = false }

function cargarHistorialLocal() {
  try {
    const raw = localStorage.getItem(historialStorageKey.value)
    historial.value = raw ? JSON.parse(raw) : []
  } catch {
    historial.value = []
  }
}

function guardarHistorialLocal() {
  localStorage.setItem(historialStorageKey.value, JSON.stringify(historial.value))
}

// ── Enviar reporte ──
async function enviarReporte() {
  if (!reporte.value.nuevas || reporte.value.nuevas <= 0) return

  const o = ordenActual.value
  const nuevasHechas  = Math.min(o.unidadesHechas + reporte.value.nuevas, o.unidadesTotales)
  const nuevoProgreso = Math.min(100, Math.round((nuevasHechas / o.unidadesAsig) * 100))
  const nuevoEstado   = nuevasHechas >= o.unidadesTotales
    ? 'Completada'
    : (o.estado === 'retrasado' ? 'Retrasada' : 'En Proceso')

  try {
    const res  = await fetch(`${BASE}/ordenes/${o.idReal}`)
    if (!res.ok) throw new Error(`GET orden falló: ${res.status}`)
    const data = await res.json()

    const payload = {
      Id_Cliente:          data.Id_Cliente,
      Id_Material:         data.Id_Material,
      Id_Operario:         data.Id_Operario  || null,
      Producto:            data.Producto     || null,
      Descripcion:         data.Descripcion,
      Cantidad:            data.Cantidad,
      Prioridad:           data.Prioridad,
      Fecha_Limite:        data.Fecha_Limite?.split('T')[0] || data.Fecha_Limite,
      Estado:              nuevoEstado,
      Unidades:            data.Unidades            ?? o.unidadesTotales,
      Unidades_Realizadas: nuevasHechas,
    }

    const putRes = await fetch(`${BASE}/ordenes/${o.idReal}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!putRes.ok) throw new Error(`PUT falló: ${putRes.status}`)

    o.unidadesHechas = nuevasHechas
    o.progreso       = nuevoProgreso
    if (nuevoEstado === 'Completada') o.estado = 'completado'
    else if (nuevoEstado === 'Retrasada') o.estado = 'retrasado'
    else o.estado = 'en-proceso'

    historial.value.push({
      id:       Date.now(),
      ordenId:  o.idReal,
      orden:    `${o.id} — ${o.nombre}`,
      nuevas:   reporte.value.nuevas,
      progreso: nuevoProgreso,
      nota:     reporte.value.nota,
      fecha:    new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    })
    guardarHistorialLocal()

    showToast('Reporte enviado correctamente', 'toast-success')
    cerrarModal()

    // ── SENDGRID: notificar al cliente solo si la orden se completó ──
    if (nuevoEstado === 'Completada') {
      const cliente = await obtenerCorreoCliente(o.idCliente)
      if (cliente?.correo) {
        await notificarEstado(
          {
            id:            o.idReal,
            clienteEmail:  cliente.correo,
            clienteNombre: cliente.nombre,
            productos:     o.producto,
          },
          'Completada'
        )
      }
    }

  } catch (err) {
    console.error('Error:', err)
    showToast('Error al enviar el reporte', 'toast-error')
  }
}

// ── Toast ──
function showToast(msg, type = 'toast-success') {
  toastMsg.value  = msg
  toastType.value = type
  setTimeout(() => { toastMsg.value = '' }, 3000)
}
</script>

<style scoped>
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
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
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
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 14px; color: #9ca3af; font-size: 14px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; gap: 12px; color: #9ca3af; font-size: 14px; background: white; border: 1px solid #e5e7eb; border-radius: 14px; }
.empty-hint { font-size: 12px; color: #d1d5db; }

/* ── GRID ÓRDENES ── */
.orders-grid { display: flex; flex-direction: column; gap: 16px; opacity: 0; transform: translateY(12px); transition: opacity .45s ease, transform .45s ease; }
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
.oc-badge.retrasado   { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.oc-prio { padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.oc-prio.alta  { background: #fee2e2; color: #991b1b; }
.oc-prio.media { background: #fef3c7; color: #92400e; }
.oc-prio.baja  { background: #f0fdf4; color: #166534; }

.oc-body    { padding: 16px 18px; }
.oc-nombre  { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 14px; }
.oc-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 16px; }
.oc-meta-item { display: flex; flex-direction: column; gap: 3px; }
.oc-meta-lbl  { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; }
.oc-meta-val  { font-size: 14px; font-weight: 600; color: #111827; }
.oc-meta-val.prendas { display: flex; align-items: baseline; gap: 3px; }
.oc-meta-val.prendas strong { font-size: 18px; color: #1f3a52; }
.oc-meta-val.prendas .sep   { color: #9ca3af; }
.oc-meta-val.prendas .tot   { font-size: 13px; color: #9ca3af; font-weight: 500; }
.val-vencida { color: #dc2626 !important; }

.oc-progress { margin-bottom: 18px; }
.oc-progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.oc-progress-lbl { font-size: 12px; color: #6b7280; font-weight: 500; }
.oc-progress-pct { font-size: 14px; font-weight: 700; color: #374151; }
.pct-verde   { color: #16a34a !important; }
.pct-rojo    { color: #dc2626 !important; }
.oc-bar { width: 100%; height: 10px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
.oc-bar-fill { height: 100%; background: #1f3a52; border-radius: 999px; transition: width 0.6s ease; }
.oc-bar-fill.fill-completado { background: #16a34a; }
.oc-bar-fill.fill-retrasado  { background: #dc2626; }
.oc-bar-labels { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: #d1d5db; }

.btn-reportar { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #1f3a52; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.15s; }
.btn-reportar:hover:not(:disabled) { background: #2d5580; transform: translateY(-1px); }
.btn-reportar:active:not(:disabled) { transform: scale(.97); }
.btn-reportar:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }

/* ── HISTORIAL ── */
.historial-list { display: flex; flex-direction: column; gap: 12px; }
.hist-entries   { display: flex; flex-direction: column; gap: 12px; }
.hist-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; opacity: 0; transform: translateY(12px); transition: opacity .45s ease, transform .45s ease; }
.hist-summary.section-visible { opacity: 1; transform: translateY(0); }
.hist-sum-item { display: flex; flex-direction: column; align-items: center; gap: 4px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; opacity: 0; transform: translateY(16px); transition: opacity .4s ease, transform .4s ease, box-shadow .2s; }
.hist-sum-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-2px) !important; }
.hist-sum-item.card-visible { opacity: 1; transform: translateY(0); }
.hist-sum-num { font-size: 28px; font-weight: 700; color: #1f3a52; }
.hist-sum-lbl { font-size: 12px; color: #9ca3af; text-align: center; }

.hist-card { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px 20px; transition: box-shadow 0.2s, transform 0.2s; }
.hist-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
.hist-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; }
.hist-icon { width: 38px; height: 38px; flex-shrink: 0; background: #f0fdf4; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #16a34a; }
.hist-info  { flex: 1; min-width: 0; }
.hist-orden { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hist-nota  { font-size: 12px; color: #6b7280; background: #f9fafb; border-radius: 6px; padding: 5px 8px; margin-top: 4px; border: 1px solid #f3f4f6; }
.hist-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.hist-unidades { display: flex; align-items: baseline; gap: 4px; }
.hist-uni-num  { font-size: 22px; font-weight: 700; color: #16a34a; }
.hist-uni-lbl  { font-size: 12px; color: #9ca3af; }
.hist-pct-wrap { display: flex; align-items: center; gap: 8px; }
.hist-pct-bar  { width: 80px; height: 5px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
.hist-pct-fill { height: 100%; background: #1f3a52; border-radius: 999px; transition: width .5s ease; }
.hist-pct-txt  { font-size: 12px; font-weight: 600; color: #374151; min-width: 34px; text-align: right; }
.hist-fecha    { font-size: 11px; color: #9ca3af; }

/* ── MODAL ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 24px 64px rgba(0,0,0,0.18); }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 24px 14px; border-bottom: 1px solid #f1f5f9; }
.modal-title    { font-size: 17px; font-weight: 700; color: #111827; }
.modal-subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
.modal-close { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 2px; border-radius: 6px; transition: background .15s; }
.modal-close:hover { background: #f3f4f6; color: #374151; }
.modal-estado { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #f3f4f6; border-bottom: 1px solid #f1f5f9; }
.modal-estado-item { background: white; padding: 12px 16px; display: flex; flex-direction: column; gap: 3px; }
.modal-estado-lbl { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; }
.modal-estado-val { font-size: 16px; font-weight: 700; color: #111827; }
.modal-estado-val.orange { color: #ea580c; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }
.form-group   { display: flex; flex-direction: column; gap: 6px; }
.form-label   { font-size: 13px; font-weight: 600; color: #374151; }
.req  { color: #dc2626; }
.opt  { color: #9ca3af; font-weight: 400; font-size: 12px; }
.form-input { padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow .2s; }
.form-input:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,.1); }
.form-hint  { font-size: 12px; color: #6b7280; padding: 4px 8px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; }
.form-textarea { padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; resize: vertical; font-family: inherit; transition: border-color 0.2s; }
.form-textarea:focus { border-color: #1f3a52; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px 20px; border-top: 1px solid #f1f5f9; }
.btn-cancelar { padding: 10px 20px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; font-size: 14px; cursor: pointer; transition: background .15s; }
.btn-cancelar:hover { background: #f3f4f6; }
.btn-enviar { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #1f3a52; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform .15s; }
.btn-enviar:hover:not(:disabled) { background: #2d5580; transform: translateY(-1px); }
.btn-enviar:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── TOAST ── */
.toast { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.toast-success { background: #166534; }
.toast-error   { background: #991b1b; }

/* ── Transitions ── */
.modal-enter-active, .modal-leave-active { transition: opacity .25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
.row-enter-active, .row-leave-active { transition: opacity .3s ease, transform .3s ease; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 900px) {
  .main { padding: 20px 16px; }
  .hist-summary { grid-template-columns: 1fr 1fr; }
  .page-hero { flex-direction: column; align-items: flex-start; }
}
</style>