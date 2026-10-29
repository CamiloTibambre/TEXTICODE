<template>
  <div class="layout">

    <main class="main">

      <!-- PARTÍCULAS DE FONDO DECORATIVAS -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- ENCABEZADO -->
      <PageHeader
        titulo="Gestión de Usuarios"
        subtitulo="Administración y control de accesos"
        :icono="ICON_USERS"
      >
        <template #acciones>
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              v-model="busqueda"
              type="search"
              placeholder="Buscar por nombre o correo"
              aria-label="Buscar usuarios por nombre o correo"
              @focus="searchFocus = true"
              @blur="searchFocus = false"
            >
          </div>
          <div class="select-wrapper">
            <select v-model="filtroRol" class="select" aria-label="Filtrar por rol">
              <option value="">Todos los roles</option>
              <option value="administrador">Administrador</option>
              <option value="operador">Operario</option>
              <option value="cliente">Cliente</option>
            </select>
            <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
            </svg>
          </div>
          <button type="button" class="tx-btn tx-btn--primary" @click="abrirModal(null)">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Nuevo usuario
          </button>
        </template>
      </PageHeader>

      <!-- KPIs: también funcionan como filtro rápido por rol -->
      <div class="kpi-grid">
        <KpiCard
          v-for="(k, i) in kpis"
          :key="k.label"
          :label="k.label"
          :valor="k.valor"
          :icono="k.icono"
          :tono="k.tono"
          :activo="filtroRol === k.filtro"
          :cargando="cargando"
          :indice="i"
          @click="filtroRol = k.filtro"
        />
      </div>

      <!-- TABLA -->
      <div class="table-box">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
            Todos los Usuarios
          </div>
        </div>

        <div v-if="cargando" class="table-skeleton">
          <div v-for="i in 6" :key="i" class="table-skeleton-row">
            <span class="skeleton-avatar"></span>
            <span class="skeleton-line skeleton-user"></span>
            <span class="skeleton-line skeleton-tag"></span>
            <span class="skeleton-line skeleton-phone"></span>
            <span class="skeleton-line skeleton-date"></span>
          </div>
        </div>

        <div v-else class="tx-table-scroll">
        <table>
          <thead>
            <tr>
              <th class="th-sortable" tabindex="0" :aria-sort="ariaSort('nombre')" @click="sortBy('nombre')" @keydown.enter.prevent="sortBy('nombre')" @keydown.space.prevent="sortBy('nombre')">
                <span class="th-inner">
                  Usuario
                  <span class="sort-arrows" :class="{ 'sort-active': sortKey === 'nombre' }">
                    <svg v-if="sortKey !== 'nombre'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
                    </svg>
                    <svg v-else-if="sortDir === 1" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-up">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>
                    </svg>
                    <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-down">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </span>
                </span>
              </th>
              <th class="th-sortable" tabindex="0" :aria-sort="ariaSort('rol')" @click="sortBy('rol')" @keydown.enter.prevent="sortBy('rol')" @keydown.space.prevent="sortBy('rol')">
                <span class="th-inner">
                  Rol
                  <span class="sort-arrows" :class="{ 'sort-active': sortKey === 'rol' }">
                    <svg v-if="sortKey !== 'rol'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
                    </svg>
                    <svg v-else-if="sortDir === 1" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-up">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>
                    </svg>
                    <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-down">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </span>
                </span>
              </th>
              <th>Teléfono</th>
              <th class="th-sortable" tabindex="0" :aria-sort="ariaSort('fechaRegistro')" @click="sortBy('fechaRegistro')" @keydown.enter.prevent="sortBy('fechaRegistro')" @keydown.space.prevent="sortBy('fechaRegistro')">
                <span class="th-inner">
                  Fecha Registro
                  <span class="sort-arrows" :class="{ 'sort-active': sortKey === 'fechaRegistro' }">
                    <svg v-if="sortKey !== 'fechaRegistro'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
                    </svg>
                    <svg v-else-if="sortDir === 1" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-up">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>
                    </svg>
                    <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-down">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </span>
                </span>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <TransitionGroup name="row">
              <tr
                v-for="(u, idx) in visibles"
                :key="u.id"
                class="table-row"
                :class="{ 'row-flash': u.flash, 'row-eliminating': u.eliminating }"
                :style="{ '--row-i': Math.min(idx, 12) }"
              >
                <td>
                  <div class="user">
                    <div class="avatar-wrap">
                      <div class="avatar" :style="{ background: avatarBg(u.nombre), color: avatarColor(u.nombre) }">
                        {{ u.iniciales }}
                      </div>
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ u.nombre }}</span>
                      <span class="user-handle">{{ u.email }}</span>
                    </div>
                  </div>
                </td>
                <td><span class="badge-role" :class="u.rol">{{ u.rolLabel }}</span></td>
                <td>
                  <div class="phone-cell">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
                    </svg>
                    {{ u.telefono || '—' }}
                  </div>
                </td>
                <td>{{ u.fechaRegistro }}</td>
                <td>
                  <div class="actions">
                    <button type="button" class="action-btn edit-btn" @click="abrirModal(u)" :aria-label="`Editar a ${u.nombre}`" title="Editar">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                      </svg>
                    </button>
                    <button type="button" class="action-btn delete-btn" @click="pedirEliminar(u.id)" :aria-label="`Desactivar a ${u.nombre}`" title="Desactivar">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </TransitionGroup>
            <tr v-if="usuariosOrdenados.length === 0">
              <td colspan="5">
                <EmptyState
                  :icono="busqueda || filtroRol ? 'buscar' : 'vacio'"
                  :titulo="busqueda || filtroRol ? 'Ningún usuario coincide' : 'Todavía no hay usuarios'"
                  :descripcion="busqueda || filtroRol ? 'Prueba con otro nombre o quita el filtro de rol.' : 'Crea el primer usuario para darle acceso a Texticode.'"
                  compacto
                >
                  <button v-if="busqueda || filtroRol" type="button" class="tx-btn tx-btn--secondary tx-btn--sm" @click="busqueda = ''; filtroRol = ''">Quitar filtros</button>
                  <button v-else type="button" class="tx-btn tx-btn--primary tx-btn--sm" @click="abrirModal(null)">Crear usuario</button>
                </EmptyState>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        <BasePagination
          v-if="!cargando"
          v-model:pagina="pagina"
          v-model:por-pagina="porPagina"
          :total="usuariosOrdenados.length"
          etiqueta="usuarios"
        />
      </div>
    </main>

    <!-- MODAL CREAR/EDITAR USUARIO -->
    <BaseModal
      :open="modalVisible"
      :titulo="editando ? 'Editar usuario' : 'Nuevo usuario'"
      :descripcion="editando ? `Actualiza los datos de ${form.nombre || 'este usuario'}.` : 'Podrá iniciar sesión con su usuario y contraseña.'"
      tamano="lg"
      :cerrar-al-clic-fuera="false"
      @update:open="v => !v && cerrarModal()"
    >
      <form id="form-usuario" class="tx-form" novalidate @submit.prevent="guardarUsuario">
        <div class="tx-form-grid">
          <BaseField label="Nombre completo" requerido completo :error="v.error('nombre')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="form.nombre" type="text" class="tx-input" autocomplete="off"
              placeholder="Ej: Laura Gómez" required @keypress="soloLetras" @blur="v.tocar('nombre')">
          </BaseField>

          <BaseField label="Usuario para iniciar sesión" requerido :error="v.error('nombreUsuario')"
            hint="Ej: laura.gomez" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="form.nombreUsuario" type="text" class="tx-input" autocomplete="off"
              autocapitalize="none" spellcheck="false" required @blur="v.tocar('nombreUsuario')">
          </BaseField>

          <BaseField label="Teléfono" requerido :error="v.error('telefono')" v-slot="{ attrs }">
            <div class="tx-input-group">
              <span class="tx-input-group__addon" aria-hidden="true">+57</span>
              <input v-bind="attrs" v-model="form.telefono" type="tel" inputmode="numeric" maxlength="10"
                class="tx-input" placeholder="3001234567" autocomplete="off" required
                @keypress="soloNumeros" @input="limitarTelefono" @blur="v.tocar('telefono')">
            </div>
          </BaseField>

          <BaseField label="Correo electrónico" requerido :error="v.error('email')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="form.email" type="email" class="tx-input" autocomplete="off"
              placeholder="nombre@empresa.com" required @blur="v.tocar('email')">
          </BaseField>

          <BaseField label="Rol" requerido :error="v.error('Id_Rol')" v-slot="{ attrs }">
            <select v-bind="attrs" v-model="form.Id_Rol" class="tx-input" required @blur="v.tocar('Id_Rol')">
              <option value="" disabled>Selecciona un rol</option>
              <option v-for="r in todosLosRoles" :key="r.Id_Rol" :value="r.Id_Rol">{{ r.Nombre_Rol }}</option>
            </select>
          </BaseField>

          <BaseField v-if="!editando" label="Contraseña" requerido completo :error="v.error('contrasena')" v-slot="{ attrs }">
            <BasePassword v-bind="attrs" v-model="form.contrasena" requisitos required
              placeholder="La usará para iniciar sesión" @blur="v.tocar('contrasena')" />
          </BaseField>
        </div>
      </form>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="cerrarModal">Cancelar</button>
        <button type="submit" form="form-usuario" class="tx-btn tx-btn--primary" :disabled="guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  getUsuarios, getRoles, crearUsuario, actualizarUsuario
} from '../../services/api.js'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseField from '../../components/base/BaseField.vue'
import BasePassword from '../../components/base/BasePassword.vue'
import { useValidacion } from '../../composables/useValidacion'
import BasePagination from '../../components/base/BasePagination.vue'
import { usePagination } from '../../composables/usePagination'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const toast     = useToast()
const confirmar = useConfirm()

// ── ESTADO ──
const cargando    = ref(true)
const guardando   = ref(false)
const searchFocus = ref(false)
const busqueda    = ref('')
const filtroRol   = ref('')
const modalVisible      = ref(false)
const editando    = ref(false)
const roles       = ref([])
const usuarios    = ref([])

// ── ROL HELPERS ──
const ROL_NORM  = { 'administrador': 'administrador', 'admin': 'administrador', 'operario': 'operador', 'operador': 'operador', 'cliente': 'cliente' }
const ROL_LABEL = { administrador: 'Administrador', operador: 'Operario', cliente: 'Cliente' }
function normRol(nombreRol) { return ROL_NORM[(nombreRol || '').toLowerCase()] || 'operador' }

// ── COMPUTED DE ROLES ──

// Todos los roles incluyendo administrador (para el modal de creación/edición)
const todosLosRoles = computed(() => roles.value)

// Solo roles sin admin (ya no se usa en el modal, queda disponible si se necesita en otro lado)
const rolesNoAdmin = computed(() =>
  roles.value.filter(r => !['administrador','admin'].includes((r.Nombre_Rol || '').toLowerCase()))
)

function mapear(u) {
  const rolNombreRaw = u.Rol || u.Nombre_Rol || ''
  const rol = normRol(rolNombreRaw)
  const nombre = u.Nombre_Completo || u.Nombre_Usuario || ''
  const rolObj = roles.value.find(r => (r.Nombre_Rol || '').toLowerCase() === rolNombreRaw.toLowerCase())
  return {
    id: u.Id_Usuario,
    nombre,
    nombreUsuario: u.Nombre_Usuario || '',
    email: u.Correo || '',
    telefono: u.Telefono || '',
    Id_Rol: rolObj?.Id_Rol ?? '',
    rol,
    rolLabel: ROL_LABEL[rol] || rolNombreRaw,
    estado: u.Estado === 'activo' ? 'active' : 'inactive',
    fechaRegistro: u.Fecha_Registro ? new Date(u.Fecha_Registro).toLocaleDateString('es-CO') : '—',
    iniciales: nombre.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase(),
    flash: false,
    eliminating: false,
  }
}

// ── CARGA INICIAL ──
async function cargarDatos() {
  cargando.value = true
  try {
    const [dataU, dataR] = await Promise.all([getUsuarios(), getRoles()])
    roles.value = dataR

    // Muestra en tabla a administradores, operarios y clientes activos
    usuarios.value = dataU
      .filter(u => u.Estado === 'activo')
      .map(mapear)

  } catch (e) {
    toast.error('No se pudieron cargar los usuarios. Revisa tu conexión y recarga la página.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargarDatos)

// ── ELIMINAR (desactivar) ──
async function pedirEliminar(id) {
  const u = usuarios.value.find(x => x.id === id)
  if (!u) return
  const ok = await confirmar({
    titulo: `¿Desactivar a ${u.nombre}?`,
    mensaje: 'Ya no podrá iniciar sesión y dejará de aparecer en esta lista.',
    textoConfirmar: 'Desactivar usuario',
    tono: 'danger',
  })
  if (!ok) return
  u.eliminating = true
  try {
    await actualizarUsuario(id, {
      Id_Rol: u.Id_Rol,
      Nombre_Completo: u.nombre,
      Nombre_Usuario: u.nombreUsuario,
      Correo: u.email,
      Telefono: u.telefono || null,
      Estado: 'inactivo',
    })
    setTimeout(() => {
      usuarios.value = usuarios.value.filter(x => x.id !== id)
      toast.success(`${u.nombre} fue desactivado.`)
    }, 350)
  } catch (e) {
    u.eliminating = false
    toast.error(e.message || 'No se pudo desactivar el usuario. Inténtalo de nuevo.')
  }
}

const ICON_USERS  = 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'
const ICON_ADMIN  = 'M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z'
const ICON_WRENCH = 'M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z'
const ICON_CLIENT = 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'

const kpis = computed(() => [
  { label: 'Total usuarios',  valor: usuarios.value.length,                                       icono: ICON_USERS,  tono: 'brand',   filtro: '' },
  { label: 'Administradores', valor: usuarios.value.filter(u => u.rol === 'administrador').length, icono: ICON_ADMIN,  tono: 'success', filtro: 'administrador' },
  { label: 'Operarios',       valor: usuarios.value.filter(u => u.rol === 'operador').length,      icono: ICON_WRENCH, tono: 'info',    filtro: 'operador' },
  { label: 'Clientes',        valor: usuarios.value.filter(u => u.rol === 'cliente').length,       icono: ICON_CLIENT, tono: 'warning', filtro: 'cliente' },
])

// ── AVATAR COLORS ──
const PALETTES = [
  { bg: '#dbeafe', color: '#1d4ed8' }, { bg: '#fce7f3', color: '#be185d' },
  { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef9c3', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' }, { bg: '#fee2e2', color: '#991b1b' },
]
function avatarBg(n)    { return PALETTES[(n?.charCodeAt(0)||0) % PALETTES.length].bg }
function avatarColor(n) { return PALETTES[(n?.charCodeAt(0)||0) % PALETTES.length].color }

// ── ORDENAMIENTO ──
const sortKey = ref('nombre')
const sortDir = ref(1)
function sortBy(key) { sortKey.value === key ? sortDir.value *= -1 : (sortKey.value = key, sortDir.value = 1) }

const usuariosFiltrados = computed(() =>
  usuarios.value.filter(u => {
    const q = busqueda.value.toLowerCase()
    return (u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
           (!filtroRol.value || u.rol === filtroRol.value)
  })
)
const usuariosOrdenados = computed(() =>
  [...usuariosFiltrados.value].sort((a, b) => {
    const va = a[sortKey.value] || '', vb = b[sortKey.value] || ''
    return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir.value
  })
)

// ── PAGINACIÓN ──
const { pagina, porPagina, visibles, reiniciar } = usePagination(usuariosOrdenados, { porPagina: 10, clave: 'usuarios' })
watch([busqueda, filtroRol, sortKey, sortDir], reiniciar)

// aria-sort para lectores de pantalla
function ariaSort(key) {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 1 ? 'ascending' : 'descending'
}

// ── VALIDACIÓN ──
const form = ref({ id: null, nombre: '', nombreUsuario: '', email: '', telefono: '', Id_Rol: '', estado: 'activo', contrasena: '' })
function validarContrasena(contrasena) {
  if (!contrasena.trim()) return ''
  if (contrasena.length < 8) return 'Mínimo 8 caracteres.'
  if (!/[A-Z]/.test(contrasena)) return 'Debe tener al menos una mayúscula.'
  if (!/[0-9]/.test(contrasena)) return 'Debe tener al menos un número.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena)) return 'Debe tener al menos un carácter especial (@, #, $, etc.).'
  return ''
}


const errores = computed(() => ({
  nombre: !form.value.nombre.trim()
    ? 'Escribe el nombre completo.'
    : /[0-9]/.test(form.value.nombre)
      ? 'El nombre no puede contener números.'
      : '',
  nombreUsuario: !form.value.nombreUsuario.trim()
    ? 'Escribe un nombre de usuario.'
    : /^\d+$/.test(form.value.nombreUsuario.trim())
      ? 'El nombre de usuario no puede ser solo números.'
      : '',
  email: !form.value.email.trim()
    ? 'Escribe el correo electrónico.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())
      ? 'Escribe un correo válido, por ejemplo nombre@empresa.com.'
      : '',
  Id_Rol: !form.value.Id_Rol ? 'Elige un rol.' : '',
  contrasena: !editando.value && !form.value.contrasena.trim()
    ? 'Escribe una contraseña.'
    : validarContrasena(form.value.contrasena),
  telefono: !form.value.telefono.trim()
    ? 'Escribe el teléfono.'
    : !/^\d{10}$/.test(form.value.telefono)
      ? 'El teléfono debe tener 10 dígitos.'
      : '',
}))
const v = useValidacion(errores)

// ── TELÉFONO: mismo formato que en new_user_sheet.dart / edit_user_sheet.dart ──
// El usuario solo digita sus 10 dígitos locales; al guardar se antepone
// "+57 " y se agrupan en bloques (300 123 4567).
function formatearTelefono(digitos) {
  return `+57 ${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6, 10)}`
}

// Al editar, "desarma" un teléfono ya guardado (con +57 y espacios, o
// un registro antiguo sin formato) para volver a mostrar solo los 10
// dígitos locales en el input.
function extraerTelefonoLocal(telefono) {
  const digitos = (telefono || '').replace(/\D/g, '')
  return (digitos.length === 12 && digitos.startsWith('57')) ? digitos.slice(2) : digitos
}

// ── MODAL USUARIO ──
function abrirModal(usuario) {
  v.reiniciar()
  if (usuario) {
    editando.value = true
    form.value = {
      id: usuario.id,
      nombre: usuario.nombre,
      nombreUsuario: usuario.nombreUsuario,
      email: usuario.email,
      telefono: extraerTelefonoLocal(usuario.telefono),
      Id_Rol: usuario.Id_Rol,
      estado: usuario.estado === 'active' ? 'activo' : 'inactivo',
      contrasena: '',
    }
  } else {
    editando.value = false
    form.value = { id: null, nombre: '', nombreUsuario: '', email: '', telefono: '', Id_Rol: roles.value[0]?.Id_Rol || '', estado: 'activo', contrasena: '' }
  }
  modalVisible.value = true
}
function cerrarModal() { modalVisible.value = false }

async function guardarUsuario() {
  if (!(await v.validar())) return
  guardando.value = true
  const payload = {
    Nombre_Completo: form.value.nombre,
    Nombre_Usuario: form.value.nombreUsuario || form.value.nombre.toLowerCase().replace(/\s+/g, '.'),
    Correo: form.value.email,
    Telefono: formatearTelefono(form.value.telefono),
    Id_Rol: form.value.Id_Rol,
    Estado: form.value.estado,
    ...(form.value.contrasena.trim() ? { Contrasena: form.value.contrasena.trim() } : {}),
  }
  try {
    if (editando.value) {
      await actualizarUsuario(form.value.id, payload)
      toast.success('Cambios guardados.')
      await cargarDatos()
    } else {
      await crearUsuario(payload)
      toast.success('Usuario creado.')
      await cargarDatos()
      // Que el usuario recién creado aparezca de primeras sin tener
      // que buscarlo con scroll: pasamos la tabla a "más reciente
      // primero" (por Id_Usuario, que siempre crece con cada alta) y
      // resaltamos brevemente esa fila.
      sortKey.value = 'id'
      sortDir.value = -1
      const nuevo = usuarios.value.reduce(
        (max, u) => (!max || u.id > max.id ? u : max), null)
      if (nuevo) {
        nuevo.flash = true
        setTimeout(() => { nuevo.flash = false }, 1800)
      }
    }
    cerrarModal()
  } catch (e) {
    toast.error(e.message || 'No se pudo guardar el usuario. Inténtalo de nuevo.')
  } finally {
    guardando.value = false
  }
}

function soloLetras(e) {
  // Permite letras, tildes, ñ, espacios, guiones y apóstrofes
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÄËÏÖÜäëïöüÑñ\s'-]$/.test(e.key)) {
    e.preventDefault()
  }
}

function soloNumeros(e) {
  if (!/^[0-9]$/.test(e.key)) e.preventDefault()
}

// Limpia lo que quede (por pegado, autocompletado, etc.) a solo
// dígitos y lo recorta a 10, igual que en new_user_sheet.dart /
// edit_user_sheet.dart en el móvil.
function limitarTelefono() {
  form.value.telefono = form.value.telefono.replace(/\D/g, '').slice(0, 10)
}

</script>

<style scoped>
/* ── LAYOUT ── */
.layout { display: flex; min-height: 100vh; background: #f1f5f9; position: relative; overflow: hidden; }
.main { flex: 1; padding: 28px 30px; position: relative; z-index: 1; }

/* ── FONDO ── */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: #2563eb; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #16a34a; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

/* ── BÚSQUEDA Y FILTRO (en el encabezado) ── */
.search-box { display: flex; align-items: center; gap: 8px; height: var(--control-height); padding: 0 12px; background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); transition: border-color var(--duration-fast), box-shadow var(--duration-fast); width: 240px; }
.search-box.search-focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.search-ico { width: 16px; height: 16px; color: var(--color-text-muted); flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: transparent; }
.search-box input::placeholder { color: var(--color-text-muted); }
.search-box input::-webkit-search-cancel-button { cursor: pointer; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.select { height: var(--control-height); padding: 0 32px 0 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border-strong); font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: var(--color-surface); appearance: none; -webkit-appearance: none; outline: none; cursor: pointer; transition: border-color var(--duration-fast), box-shadow var(--duration-fast); }
.select:focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: var(--color-text-muted); pointer-events: none; }
/* ── TABLA BOX ── */
.table-box { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); overflow: hidden; box-shadow: var(--shadow-xs); animation: tableIn var(--duration-slow) var(--ease-out) 120ms both; }
@keyframes tableIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }

/* ── TABLA ── */
table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; padding: 13px 18px; white-space: nowrap; }

/* ── SORT ANIMADO ── */
.th-sortable { cursor: pointer; user-select: none; transition: color 0.15s; position: relative; }
.th-sortable:hover { color: #1f3a52; }
.th-sortable:focus-visible { outline: var(--focus-outline); outline-offset: -2px; }
.th-sortable::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: #1f3a52;
  border-radius: 2px 2px 0 0;
  opacity: 0;
  transform: scaleX(0.4);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.th-sortable:hover::after { opacity: 1; transform: scaleX(1); }
.th-inner { display: inline-flex; align-items: center; gap: 6px; }
.sort-arrows { display: inline-flex; align-items: center; transition: all 0.2s ease; }
.sort-neutral { opacity: 0.35; color: var(--color-text-muted); transition: opacity 0.2s, transform 0.2s; }
.th-sortable:hover .sort-neutral { opacity: 0.55; }
.sort-up, .sort-down { color: #1f3a52; animation: sortIconPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes sortIconPop { from { transform: scale(0.6) rotate(-15deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }

td { padding: 14px 18px; font-size: 14px; border-top: 1px solid #f1f5f9; }
.table-row { transition: background var(--duration-fast); animation: rowSlideIn var(--duration-base) var(--ease-out) both; animation-delay: calc(var(--row-i, 0) * 25ms); }
.table-row:hover td { background: #f8fafc; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
.row-flash td { background: #f0fdf4 !important; }
.row-eliminating { opacity: 0 !important; transform: translateX(20px) !important; transition: all 0.35s ease !important; }
.row-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.row-leave-active { transition: opacity var(--duration-fast) var(--ease-in), transform var(--duration-fast) var(--ease-in); animation: none; }
.row-enter-from { opacity: 0; transform: translateY(-10px); }
.row-leave-to { opacity: 0; transform: translateX(20px); }

/* ── SKELETON TABLA ── */
.table-skeleton { padding: 18px; display: grid; gap: 12px; }
.table-skeleton-row { display: grid; grid-template-columns: 34px 1.4fr 0.7fr 0.7fr 0.7fr; align-items: center; gap: 16px; padding: 14px 10px; border-radius: 16px; background: rgba(255,255,255,0.72); }
.skeleton-avatar { display: block; width: 34px; height: 34px; border-radius: 999px; background: #e5e7eb; }
.skeleton-user  { width: 72%; height: 16px; }
.skeleton-tag   { width: 90px; height: 14px; }
.skeleton-phone { width: 120px; height: 14px; }
.skeleton-date  { width: 80px; height: 14px; }

/* ── USER ── */
.user { display: flex; align-items: center; gap: 10px; }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; transition: transform 0.2s; }
.avatar:hover { transform: scale(1.1); }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 14px; color: #111827; }
.user-handle { font-size: 12px; color: #6b7280; }
.phone-cell { display: flex; align-items: center; gap: 6px; color: #374151; }

/* ── BADGES ── */
.badge-role { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge-role.administrador { background: #f3f4f6; color: #374151; }
.badge-role.operador { background: #e0ecff; color: #1d4ed8; }
.badge-role.cliente  { background: #fef9c3; color: #92400e; }

/* ── ACCIONES ── */
.actions { display: flex; gap: 8px; align-items: center; }
.action-btn {
  width: 32px; height: 32px; border-radius: 7px; border: none;
  background: #1f3a52; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; color: white;
  -webkit-font-smoothing: antialiased;
}
.action-btn svg { pointer-events: none; filter: drop-shadow(0 0 0.3px rgba(255,255,255,0.4)); }
.edit-btn:hover   { background: #2d5580; transform: scale(1.07); }
.delete-btn:hover { background: #dc2626; transform: scale(1.07); }

/* ── EMPTY ── */

/* ── MODAL ── */

/* ── TRANSICIONES ── */
</style>