<template>
  <div class="layout">

    <main class="main">

      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <PageHeader
        titulo="Cuenta Personal"
        subtitulo="Tu perfil y actividad de operario"
        icono="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />

      <!-- CARGANDO -->
      <div v-if="cargando" class="cuenta-skeleton">
        <SkeletonCard variante="contenido" :lineas="2" />
        <div class="kpi-grid">
          <SkeletonCard v-for="i in 3" :key="i" variante="kpi" />
        </div>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="error-banner">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
        </svg>
        {{ error }}
        <button class="btn-retry" @click="cargarDatos">Reintentar</button>
      </div>

      <template v-else>
        <!-- SIN SESIÓN -->
        <div v-if="!auth.idUsuario" class="empty-session">
          <div class="empty-icon-hex">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
            </svg>
          </div>
          <p class="empty-title">Ingresa con tu cuenta</p>
          <p class="empty-sub">Inicia sesión para ver tu perfil y actividad.</p>
        </div>

        <!-- CON SESIÓN -->
        <template v-else>

          <!-- CARD UNIFICADA (perfil + contacto) -->
          <div class="profile-contact-card" :class="{ 'banner-in': mounted }">

            <!-- Engranajes decorativos -->
            <div class="gear-deco gear-big" :class="{ 'gear-spin': mounted }">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.07)" stroke-width=".8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </div>
            <div class="gear-deco gear-small" :class="{ 'gear-spin-rev': mounted }">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.1)" stroke-width=".8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </div>

            <!-- Cabecera: avatar + nombre + botón -->
            <div class="pc-header">
              <div class="pc-avatar-wrap" :class="{ 'avatar-in': mounted }">
                <div
                  class="pc-avatar"
                  :style="{
                    background: avatarBg(perfil.Nombre_Completo),
                    color: avatarColor(perfil.Nombre_Completo)
                  }"
                >
                  {{ iniciales }}
                </div>
              </div>

              <div class="pc-identity">
                <div class="pc-name">
                  <span v-for="(c, i) in (perfil.Nombre_Completo || '')" :key="i"
                    class="name-char" :class="{ 'char-in': mounted }"
                    :style="{ animationDelay: mounted ? `${80 + i * 30}ms` : '0ms' }">
                    {{ c === ' ' ? '\u00A0' : c }}
                  </span>
                </div>
              </div>

              <button class="pc-edit-btn" @click="abrirModal">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                </svg>
                Editar Perfil
              </button>
            </div>

            <!-- Divisor -->
            <div class="pc-divider"></div>

            <!-- Grid de contacto dentro de la card azul -->
            <div class="pc-contact-grid">
              <div
                class="pc-contact-item"
                v-for="(item, i) in contactItems"
                :key="item.label"
                :style="{ animationDelay: mounted ? `${200 + i * 65}ms` : '9999s' }"
              >
                <div class="pc-contact-icon">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
                       stroke-width="1.8" stroke="currentColor" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon"/>
                  </svg>
                </div>
                <div class="pc-contact-info">
                  <span class="pc-contact-label">{{ item.label }}</span>
                  <span class="pc-contact-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="kpi-grid">
            <KpiCard v-for="(k, i) in kpis" :key="k.label" v-bind="k" :indice="i" />
          </div>

          <!-- ACTIVIDAD RECIENTE -->
          <div class="card" style="--d:300ms">
            <div class="card-header">
              <div class="ch-dot" style="background:#e0eaf2">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#1f3a52" style="display:block">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              Actividad Reciente
              <div class="card-badge">{{ ordenes.length }}</div>
              <div class="card-line"></div>
            </div>

            <div v-if="cargandoOrdenes" class="loading-inline">
              <div class="skeleton-row" v-for="i in 3" :key="i"></div>
            </div>
            <div v-else-if="ordenes.length === 0" class="empty-msg">No hay órdenes asignadas aún.</div>

            <div v-else class="timeline">
              <div class="timeline-line" :class="{ 'line-grow': mounted }"></div>
              <div class="timeline-item"
                v-for="(o, i) in ordenes.slice(0, 5)" :key="o.Id_Orden"
                :style="{ animationDelay: mounted ? `${480 + i * 75}ms` : '0ms' }">

                <div class="tl-order-pill">#{{ o.Id_Orden }}</div>

                <div class="tl-node" :class="nodeClass(o.Estado)">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="display:block">
                    <path v-if="o.Estado === 'Completada'" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    <path v-else-if="o.Estado === 'En Proceso'" stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5"/>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5"/>
                  </svg>
                </div>

                <div class="tl-content">
                  <div class="tl-head">
                    <span class="tl-badge" :class="badgeClass(o.Estado)">{{ o.Estado }}</span>
                  </div>
                  <div class="tl-desc">{{ o.Descripcion }}</div>
                  <div class="tl-sub">Cliente: {{ o.Cliente || '—' }} · Cantidad: {{ o.Cantidad }}</div>
                  <div class="tl-prog">
                    <div class="tl-prog-bar">
                      <div class="tl-prog-fill" :class="[badgeClass(o.Estado), { 'fill-in': mounted }]"
                        :style="{ width: progresoOrden(o) + '%', '--row-i': Math.min(i, 10) }"></div>
                    </div>
                    <span class="tl-prog-txt">{{ progresoOrden(o) }}%</span>
                  </div>
                  <div class="tl-fecha">{{ formatFecha(o.Fecha_Limite) }}</div>
                </div>
              </div>
            </div>
          </div>

        </template>
      </template>
    </main>

    <!-- MODAL EDITAR PERFIL -->
    <BaseModal
      :open="modalVisible"
      titulo="Editar perfil"
      descripcion="Tus datos de contacto y acceso."
      tamano="md"
      :cerrar-al-clic-fuera="false"
      @update:open="val => !val && cerrarModal()"
    >
      <form id="form-perfil" class="tx-form" novalidate @submit.prevent="guardarCambios">
        <Transition name="tx-field-msg">
          <p v-if="errorGuardar" class="tx-form-alert" role="alert">{{ errorGuardar }}</p>
        </Transition>
        <div class="tx-form-grid">
          <BaseField label="Nombre completo" requerido completo :error="v.error('Nombre_Completo')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="formEdicion.Nombre_Completo" type="text" class="tx-input" autocomplete="name"
              required @keypress="soloLetras" @blur="v.tocar('Nombre_Completo')">
          </BaseField>
          <BaseField label="Correo electrónico" requerido :error="v.error('Correo')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="formEdicion.Correo" type="email" class="tx-input" autocomplete="email"
              required @blur="v.tocar('Correo')">
          </BaseField>
          <BaseField label="Teléfono" opcional v-slot="{ attrs }">
            <input v-bind="attrs" v-model="formEdicion.Telefono" type="tel" class="tx-input" autocomplete="tel" placeholder="+57 300 000 0000">
          </BaseField>
          <BaseField label="Nueva contraseña" opcional completo :error="v.error('Contrasena')"
            hint="Déjala vacía si no quieres cambiarla." v-slot="{ attrs }">
            <BasePassword v-bind="attrs" v-model="formEdicion.Contrasena" requisitos :reglas="passwordHints"
              @blur="v.tocar('Contrasena')" />
          </BaseField>
        </div>
      </form>
      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="cerrarModal">Cancelar</button>
        <button type="submit" form="form-perfil" class="tx-btn tx-btn--primary" :disabled="guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import SkeletonCard from '../../components/base/SkeletonCard.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseField from '../../components/base/BaseField.vue'
import BasePassword from '../../components/base/BasePassword.vue'
import { useValidacion } from '../../composables/useValidacion'
import { useToast } from '../../composables/useToast'

const toast = useToast()
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { getUsuario, actualizarUsuario, getOrdenesDeOperario } from '../../services/api'

const auth = useAuthStore()

// ── VALIDACIÓN DE CONTRASEÑA FUERTE ──
function validarContrasena(pwd) {
  if (!pwd) return null // vacío = no cambia, permitido
  if (pwd.length < 8)              return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(pwd))          return 'Debe incluir al menos una letra mayúscula.'
  if (!/[0-9]/.test(pwd))          return 'Debe incluir al menos un número.'
  if (!/[^A-Za-z0-9]/.test(pwd))   return 'Debe incluir al menos un carácter especial (@, #, $, etc.).'
  return null
}

const passwordHints = computed(() => {
  const pwd = formEdicion.value.Contrasena || ''
  return [
    { label: 'Mínimo 8 caracteres',        ok: pwd.length >= 8 },
    { label: 'Una letra mayúscula',         ok: /[A-Z]/.test(pwd) },
    { label: 'Un número',                   ok: /[0-9]/.test(pwd) },
    { label: 'Un carácter especial (@#$…)', ok: /[^A-Za-z0-9]/.test(pwd) },
  ]
})

const erroresPerfil = computed(() => ({
  Nombre_Completo: !formEdicion.value.Nombre_Completo?.trim()
    ? 'Escribe tu nombre completo.'
    : /[0-9]/.test(formEdicion.value.Nombre_Completo) ? 'El nombre no puede tener números.' : '',
  Correo: !formEdicion.value.Correo?.trim()
    ? 'Escribe tu correo electrónico.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEdicion.value.Correo.trim()) ? 'Escribe un correo válido, por ejemplo nombre@empresa.com.' : '',
  Contrasena: validarContrasena(formEdicion.value.Contrasena || '') || '',
}))
const v = useValidacion(erroresPerfil)

// ── PALETA DE AVATARES ──
const PALETTES = [
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef9c3', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fee2e2', color: '#991b1b' },
]
function avatarBg(n)    { return PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length].bg }
function avatarColor(n) { return PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length].color }


const mounted         = ref(false)
const cargando        = ref(true)
const cargandoOrdenes = ref(false)
const error           = ref('')
const errorGuardar    = ref('')
const guardando       = ref(false)
const modalVisible    = ref(false)
const perfil          = ref({})
const ordenes         = ref([])
const formEdicion     = ref({})

const titleChars = 'Cuenta Personal'.split('')

const iniciales = computed(() =>
  (perfil.value.Nombre_Completo || '').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()
)

const contactItems = computed(() => [
  {
    label: 'Email',
    value: perfil.value.Correo || '—',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75'
  },
  {
    label: 'Teléfono',
    value: perfil.value.Telefono || '—',
    icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25Z'
  },
  {
    label: 'Usuario',
    value: perfil.value.Nombre_Usuario || '—',
    icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0'
  },
])

const kpis = computed(() => [
  { label: 'Completadas', nota: 'Órdenes finalizadas', valor: ordenes.value.filter(o => o.Estado === 'Completada').length, tono: 'success',
    icono: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
  { label: 'En proceso',  nota: 'Producción activa',  valor: ordenes.value.filter(o => o.Estado === 'En Proceso').length, tono: 'info',
    icono: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
  { label: 'Total',       nota: 'Órdenes asignadas',  valor: ordenes.value.length, tono: 'brand',
    icono: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z' },
])

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}
function nodeClass(estado) {
  return { 'Completada': 'node-green', 'En Proceso': 'node-blue', 'Pausado': 'node-yellow' }[estado] || 'node-yellow'
}
function badgeClass(estado) {
  return { 'Completada': 'badge-completada', 'En Proceso': 'badge-proceso', 'Pausado': 'badge-pausado' }[estado] || 'badge-pausado'
}
// Progreso real de la orden (prendas realizadas / total). Antes se mostraba
// un valor fijo por estado (58% "En Proceso", 28% "Pausado").
function progresoOrden(o) {
  if (o.Estado === 'Completada') return 100
  const total = Number(o.Unidades ?? o.Cantidad ?? 0)
  const hechas = Number(o.Unidades_Realizadas ?? 0)
  if (!total) return 0
  return Math.min(100, Math.round((hechas / total) * 100))
}

async function cargarDatos() {
  cargando.value = true; error.value = ''
  try {
    if (!auth.idUsuario) { perfil.value = {}; ordenes.value = []; return }
    perfil.value = await getUsuario(auth.idUsuario)
    cargandoOrdenes.value = true
    try {
      const data = await getOrdenesDeOperario(auth.idUsuario)
      ordenes.value = Array.isArray(data) ? data : []
    } catch { ordenes.value = [] }
    finally { cargandoOrdenes.value = false }
  } catch (e) {
    error.value = e.message || 'No se pudo cargar tu perfil. Revisa tu conexión e inténtalo de nuevo.'
  } finally {
    cargando.value = false
    requestAnimationFrame(() => requestAnimationFrame(() => { mounted.value = true }))
  }
}

onMounted(cargarDatos)

function abrirModal() { v.reiniciar(); formEdicion.value = { ...perfil.value, Contrasena: '' }; errorGuardar.value = ''; modalVisible.value = true }
function cerrarModal() { modalVisible.value = false; errorGuardar.value = '' }
function soloLetras(e) {
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÄËÏÖÜäëïöüÑñ\s'-]$/.test(e.key)) e.preventDefault()
}

async function guardarCambios() {
  errorGuardar.value = ''
  if (!(await v.validar())) return
  guardando.value = true; errorGuardar.value = ''
  try {
    const payload = { Id_Rol: perfil.value.Id_Rol, Nombre_Completo: formEdicion.value.Nombre_Completo, Nombre_Usuario: perfil.value.Nombre_Usuario, Correo: formEdicion.value.Correo, Telefono: formEdicion.value.Telefono || null, Estado: perfil.value.Estado, Contrasena: formEdicion.value.Contrasena || null }
    await actualizarUsuario(auth.idUsuario, payload)
    perfil.value = { ...perfil.value, ...payload }
    if (auth.usuario) auth.usuario.Nombre_Completo = formEdicion.value.Nombre_Completo
    cerrarModal(); mostrarToast('Perfil actualizado.')
  } catch (e) { errorGuardar.value = e.message || 'No se pudieron guardar los cambios. Inténtalo de nuevo.' }
  finally { guardando.value = false }
}
function mostrarToast(msg, type = 'success') {
  if (type === 'danger' || type === 'error') toast.error(msg)
  else toast.success(msg)
}
</script>

<style scoped>
/* ═══ LAYOUT ═══ */
.layout { display: flex; min-height: 100vh; background: #f3f4f6; }
.main {
  flex: 1; padding: 28px 30px; overflow-y: auto; position: relative;
  background:
    radial-gradient(circle at 20% 10%, rgba(37,99,235,.08), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(31,58,82,.08), transparent 45%);
}

/* ═══ FONDO ═══ */
.bg-grid {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: .5;
  background-image:
    linear-gradient(rgba(31,58,82,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31,58,82,0.06) 1px, transparent 1px);
  background-size: 40px 40px;
}
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .13; animation: orbDrift 12s ease-in-out infinite alternate; }
.orb-1 { width: 420px; height: 420px; background: #1f3a52; top: -80px; right: -60px; animation-duration: 13s; }
.orb-2 { width: 300px; height: 300px; background: #2563eb; bottom: 80px; left: -60px; animation-duration: 17s; animation-direction: alternate-reverse; }
.orb-3 { width: 200px; height: 200px; background: #16a34a; top: 45%; right: 20%; animation-duration: 10s; }
@keyframes orbDrift { from { transform: translate(0,0) scale(1); } to { transform: translate(28px,18px) scale(1.07); } }

/* ═══ HERO HEADER ═══ */
@keyframes pulseExpand { 0% { transform: scale(.7); opacity: .7; } 100% { transform: scale(1.3); opacity: 0; } }

/* ══════════════════════════════════════════
   CARD UNIFICADA PERFIL + CONTACTO
══════════════════════════════════════════ */
.profile-contact-card {
  background: linear-gradient(135deg, #111827 0%, #1f3a52 55%, #0f2236 100%);
  border-radius: var(--radius-xl); padding: 18px 22px; margin-bottom: var(--space-4);
  opacity: 0; transform: translateY(var(--motion-shift-md));
  transition: opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out);
  box-shadow: 0 8px 32px rgba(15,34,54,0.3);
  position: relative; overflow: hidden;
}
.profile-contact-card.banner-in { opacity: 1; transform: none; }

/* En escritorio ancho: identidad y contacto en una sola fila (menos alto) */
@media (min-width: 1200px) {
  .profile-contact-card {
    display: grid;
    grid-template-columns: minmax(300px, auto) 1fr;
    align-items: center;
    column-gap: var(--space-6);
  }
  .profile-contact-card .pc-divider { display: none; }
}

/* ═══ ENGRANAJES ═══ */
.gear-deco { position: absolute; pointer-events: none; }
.gear-big  { width: 160px; height: 160px; right: -20px; top: -30px; transform-origin: center; }
.gear-small { width: 80px; height: 80px; right: 110px; bottom: -20px; transform-origin: center; }
.gear-big svg, .gear-small svg { width: 100%; height: 100%; }
.gear-spin     { animation: gearTurn 20s linear infinite; }
.gear-spin-rev { animation: gearTurn 14s linear infinite reverse; }
@keyframes gearTurn { to { transform: rotate(360deg); } }

/* ── CABECERA ── */
.pc-header {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  position: relative; z-index: 1;
}

/* Avatar sin rombo */
.pc-avatar-wrap {
  flex-shrink: 0;
  opacity: 0; transform: scale(0.5);
  transition: opacity 0.5s ease 0.1s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
}
.pc-avatar-wrap.avatar-in { opacity: 1; transform: scale(1); }
.pc-avatar {
  width: 68px; height: 68px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 800;
  border: 2.5px solid rgba(255,255,255,0.25);
  box-shadow: 0 0 0 4px rgba(255,255,255,0.06), 0 6px 18px rgba(0,0,0,0.3);
}

/* Identidad */
.pc-identity { flex: 1; min-width: 0; }
.pc-name {
  font-size: 20px; font-weight: 700; color: white;
  display: flex; flex-wrap: wrap;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.name-char { display: inline-block; opacity: 0; transform: translateY(6px); animation: charReveal .3s ease both; }
@keyframes charReveal { to { opacity:1; transform:none; } }

/* Botón editar */
.pc-edit-btn {
  display: flex; align-items: center; gap: 7px;
  background: rgba(255,255,255,0.12); color: white;
  border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;
  padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
  flex-shrink: 0; backdrop-filter: blur(6px);
  transition: background 0.2s, transform 0.15s; position: relative; z-index: 1;
}
.pc-edit-btn:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }

/* Divisor */
.pc-divider {
  margin: 22px 0 18px; border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  position: relative; z-index: 1;
}

/* ── GRID DE CONTACTO DENTRO DE LA CARD ── */
.pc-contact-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; position: relative; z-index: 1;
}
.pc-contact-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  opacity: 0; animation: contactReveal 0.4s ease both;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}
.pc-contact-item:hover {
  background: rgba(255,255,255,0.13);
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-1px);
}
@keyframes contactReveal { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.pc-contact-icon {
  width: 34px; height: 34px; border-radius: 10px;
  background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.85);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pc-contact-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pc-contact-label {
  font-size: 10px; color: rgba(255,255,255,0.45);
  text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
}
.pc-contact-value {
  font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ═══ STATS CARDS ═══ */
@keyframes statIn { from{opacity:0;transform:translateY(18px) scale(.96)} 60%{transform:translateY(-3px)} to{opacity:1;transform:none} }

/* ═══ CARD ACTIVIDAD ═══ */
.card {
  position: relative; z-index: 1;
  background: white; border: 1px solid #e5e7eb; border-radius: 14px;
  padding: 22px 24px; margin-bottom: 16px;
  opacity: 0; transform: translateY(16px);
  animation: slideUp .5s ease var(--d, 300ms) both;
  transition: box-shadow .2s;
}
.card:hover { box-shadow: 0 4px 18px rgba(0,0,0,.07); }
@keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
.card-header { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 18px; }
.ch-dot { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-badge { font-size: 11px; font-weight: 700; padding: 2px 9px; background: #e0eaf2; color: #1f3a52; border-radius: 20px; }
.card-line { flex: 1; height: 1px; background: linear-gradient(90deg, #e5e7eb, transparent); }

/* ═══ TIMELINE ═══ */
.timeline { position: relative; padding-left: 24px; }
.timeline-line {
  position: absolute; left: 9px; top: 8px; bottom: 8px; width: 2px;
  background: linear-gradient(180deg, #1f3a52, #e5e7eb); border-radius: 999px;
  transform-origin: top; transform: scaleY(0); transition: transform 1s ease .48s;
}
.timeline-line.line-grow { transform: scaleY(1); }
.timeline-item {
  position: relative; display: flex; gap: 14px; align-items: flex-start;
  margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #f3f4f6;
  opacity: 0; transform: translateX(-14px); animation: tlIn .45s ease both;
}
.timeline-item:last-child { border-bottom: none; margin-bottom: 0; }
@keyframes tlIn { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:none} }
.tl-order-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; background: #f3f4f6; color: #374151; border-radius: 20px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; transition: background .2s, color .2s; }
.timeline-item:hover .tl-order-pill { background: #1f3a52; color: white; }
.tl-node { position: absolute; left: -24px; top: 2px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 2; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,.15); transition: transform .2s cubic-bezier(.34,1.56,.64,1); }
.timeline-item:hover .tl-node { transform: scale(1.2); }
.node-green  { background: #16a34a; color: white; }
.node-blue   { background: #2563eb; color: white; }
.node-yellow { background: #d97706; color: white; }
.tl-content { flex: 1; }
.tl-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tl-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.badge-completada { background: #dcfce7; color: #166534; }
.badge-proceso    { background: #dbeafe; color: #1d4ed8; }
.badge-pausado    { background: #fef3c7; color: #92400e; }
.tl-desc  { font-size: 13px; color: #374151; font-weight: 500; margin-bottom: 3px; }
.tl-sub   { font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
.tl-fecha { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; }
.tl-prog { display: flex; align-items: center; gap: 8px; }
.tl-prog-bar { flex: 1; height: 5px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
.tl-prog-fill { height: 100%; border-radius: 999px; transform: scaleX(0); transform-origin: left; transition: transform var(--duration-slower) var(--ease-out); transition-delay: calc(var(--row-i, 0) * 50ms + 150ms); }
.tl-prog-fill.fill-in { transform: scaleX(1); }
.tl-prog-fill.badge-completada { background: #16a34a; }
.tl-prog-fill.badge-proceso    { background: #2563eb; }
.tl-prog-fill.badge-pausado    { background: #d97706; }
.tl-prog-txt { font-size: 11px; font-weight: 700; color: #374151; min-width: 30px; }

/* ═══ LOADING / SKELETON ═══ */
@keyframes spin { to{transform:rotate(360deg)} }
.loading-inline { display: flex; flex-direction: column; gap: 10px; }
.skeleton-row { height: 60px; border-radius: 10px; background: linear-gradient(90deg, #f3f4f6 0%, #fafafa 40%, #f3f4f6 80%); background-size: 300% 100%; animation: skeletonWave 1.6s ease-in-out infinite; }
@keyframes skeletonWave { 0%{background-position:200% 0} 100%{background-position:-100% 0} }
.empty-msg { font-size: 13px; color: var(--color-text-muted); padding: 16px 0; }

/* ═══ EMPTY SESSION ═══ */
.empty-session { display: flex; flex-direction: column; align-items: center; padding: 80px 24px; gap: 12px; text-align: center; position: relative; z-index: 1; }
.empty-icon-hex { width: 72px; height: 72px; border-radius: 16px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; animation: hexFloat 3s ease-in-out infinite; }
@keyframes hexFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.empty-title { font-size: 16px; font-weight: 600; color: #374151; }
.empty-sub   { font-size: 13px; color: var(--color-text-muted); max-width: 300px; }

/* ═══ ERROR ═══ */
.error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; color: #991b1b; font-size: 14px; margin-bottom: 20px; position: relative; z-index: 1; }
.btn-retry { margin-left: auto; background: #991b1b; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 13px; cursor: pointer; }

/* ═══ MODAL ═══ */
@keyframes modalIn { from{opacity:0;transform:scale(.85) translateY(20px)} to{opacity:1;transform:none} }

/* ═══ TOAST ═══ */
@keyframes toastIn  { from{opacity:0;transform:translateY(14px) scale(.9)} to{opacity:1;transform:none} }
@keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateY(8px)} }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 960px) {
  .main { padding: 20px 16px; }
  .pc-contact-grid { grid-template-columns: 1fr 1fr; }
  .pc-edit-btn { width: 100%; justify-content: center; }
}
@media (max-width: 600px) {
  .pc-contact-grid { grid-template-columns: 1fr; }
}
</style>