<template>
  <div class="layout">

    <main class="main">
      <PageHeader
        titulo="Gestión de Roles"
        subtitulo="Roles globales del sistema (aplican a todas las empresas)"
        icono="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      >
        <template #acciones>
          <button type="button" class="tx-btn tx-btn--primary" @click="abrirCrear">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Nuevo rol
          </button>
        </template>
      </PageHeader>

      <div class="info">
        Los roles no se eliminan, se desactivan: los usuarios con un rol inactivo no pueden iniciar sesión
        hasta que lo vuelvas a activar. Los roles base (superadmin, admin, operario, cliente) no se renombran,
        y el rol superadmin no se puede desactivar.
      </div>

      <div class="card">
        <SkeletonTable v-if="cargando" :filas="5" :columnas="6" :con-avatar="false" etiqueta="Cargando roles" />
        <EmptyState
          v-else-if="!roles.length"
          titulo="Todavía no hay roles"
          descripcion="Crea un rol para asignarlo a los usuarios de las empresas."
          compacto
        >
          <button type="button" class="tx-btn tx-btn--primary" @click="abrirCrear">Crear rol</button>
        </EmptyState>
        <table v-else class="tabla">
          <thead>
            <tr><th>ID</th><th>Rol</th><th>Usuarios</th><th>Tipo</th><th>Estado</th><th class="acc">Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in roles" :key="r.Id_Rol" :class="{ 'fila-inactiva': esInactivo(r) }">
              <td>{{ r.Id_Rol }}</td>
              <td class="nombre">{{ r.Nombre_Rol }}</td>
              <td>{{ r.Total_Usuarios }}</td>
              <td><span class="tag" :class="r.Protegido ? 'tag-base' : 'tag-custom'">{{ r.Protegido ? 'Base' : 'Personalizado' }}</span></td>
              <td><span class="tag" :class="esInactivo(r) ? 'tag-off' : 'tag-on'">{{ esInactivo(r) ? 'Inactivo' : 'Activo' }}</span></td>
              <td class="acc">
                <button type="button" class="mini" :disabled="r.Protegido" :aria-label="`Editar rol ${r.Nombre_Rol}`" @click="abrirEditar(r)">Editar</button>
                <button v-if="esInactivo(r)" type="button" class="mini mini-ok" :aria-label="`Activar rol ${r.Nombre_Rol}`" @click="pedirCambioEstado(r)">Activar</button>
                <button v-else type="button" class="mini mini-danger" :aria-label="`Desactivar rol ${r.Nombre_Rol}`" :disabled="esSuperadmin(r)" @click="pedirCambioEstado(r)">Desactivar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      <BaseModal
        :open="modal.visible"
        :titulo="modal.id ? 'Editar rol' : 'Nuevo rol'"
        :descripcion="modal.id ? 'El cambio de nombre aplica en todas las empresas.' : 'Estará disponible para todas las empresas.'"
        tamano="sm"
        @update:open="val => !val && cerrarModal()"
      >
        <form id="form-rol" novalidate @submit.prevent="guardar">
          <BaseField label="Nombre del rol" requerido :error="modal.error || v.error('nombre')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="modal.nombre" type="text" maxlength="40" class="tx-input" placeholder="Ej: supervisor"
              autocomplete="off" required @input="modal.error = ''" @blur="v.tocar('nombre')">
          </BaseField>
        </form>
        <template #footer>
          <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="cerrarModal">Cancelar</button>
          <button type="submit" form="form-rol" class="tx-btn tx-btn--primary" :disabled="guardando">
            <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
            {{ guardando ? 'Guardando…' : modal.id ? 'Guardar cambios' : 'Crear rol' }}
          </button>
        </template>
      </BaseModal>
    </main>
  </div>
</template>

<script setup>
import PageHeader from '../../components/PageHeader.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import SkeletonTable from '../../components/base/SkeletonTable.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseField from '../../components/base/BaseField.vue'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { useValidacion } from '../../composables/useValidacion'
import { ref, computed, onMounted } from 'vue'
import { getRolesGlobales, crearRolGlobal, actualizarRolGlobal, desactivarRolGlobal, activarRolGlobal } from '../../services/api.js'

const roles = ref([])
const cargando = ref(true)
const guardando = ref(false)
const cambiando = ref(false)
const toast = useToast()
const modal = ref({ visible: false, id: null, nombre: '', error: '' })
const confirmar = useConfirm()
const erroresRol = computed(() => ({
  nombre: !modal.value.nombre.trim() ? 'Escribe el nombre del rol.' : '',
}))
const v = useValidacion(erroresRol)

function mostrarToast(msg, type = 'success') {
  if (type === 'danger' || type === 'error') toast.error(msg)
  else toast.success(msg)
}

async function cargar() {
  cargando.value = true
  try {
    roles.value = await getRolesGlobales()
  } catch (e) {
    mostrarToast(e.message || 'No se pudieron cargar los roles. Revisa tu conexión e inténtalo de nuevo.', 'error')
  } finally {
    cargando.value = false
  }
}

function abrirCrear() { v.reiniciar(); modal.value = { visible: true, id: null, nombre: '', error: '' } }
function abrirEditar(r) { v.reiniciar(); modal.value = { visible: true, id: r.Id_Rol, nombre: r.Nombre_Rol, error: '' } }
function cerrarModal() { modal.value.visible = false }

async function guardar() {
  if (!(await v.validar())) return
  const nombre = modal.value.nombre.trim()
  guardando.value = true
  modal.value.error = ''
  try {
    if (modal.value.id) await actualizarRolGlobal(modal.value.id, { Nombre_Rol: nombre })
    else await crearRolGlobal({ Nombre_Rol: nombre })
    cerrarModal()
    mostrarToast(modal.value.id ? 'Rol actualizado.' : 'Rol creado.')
    await cargar()
  } catch (e) {
    modal.value.error = e.message || 'No se pudo guardar el rol. Inténtalo de nuevo.'
  } finally {
    guardando.value = false
  }
}

const esInactivo = (r) => r.Estado === 'inactivo'
const esSuperadmin = (r) => String(r.Nombre_Rol || '').trim().toLowerCase() === 'superadmin'

async function pedirCambioEstado(rol) {
  const activar = esInactivo(rol)
  const ok = await confirmar(activar
    ? {
        titulo: `¿Activar el rol «${rol.Nombre_Rol}»?`,
        mensaje: 'Sus usuarios podrán volver a iniciar sesión.',
        textoConfirmar: 'Activar rol',
      }
    : {
        titulo: `¿Desactivar el rol «${rol.Nombre_Rol}»?`,
        mensaje: `Sus ${rol.Total_Usuarios ?? 0} usuario(s), en todas las empresas, no podrán iniciar sesión y sus sesiones abiertas se cortarán hasta que lo vuelvas a activar.`,
        textoConfirmar: 'Desactivar rol',
        tono: 'danger',
      })
  if (!ok) return
  cambiando.value = true
  try {
    if (activar) await activarRolGlobal(rol.Id_Rol)
    else await desactivarRolGlobal(rol.Id_Rol)
    mostrarToast(activar ? 'Rol activado.' : 'Rol desactivado.')
    await cargar()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo cambiar el estado del rol. Inténtalo de nuevo.', 'error')
  } finally {
    cambiando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.layout { display: flex; min-height: 100vh; background: #f6f7f9; }
.main { flex: 1; padding: 32px; position: relative; min-width: 0; }
.info { background: #eef4fa; border: 1px solid #d6e4f0; color: #1f3a52; padding: 12px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 18px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
.tabla { width: 100%; border-collapse: collapse; }
.tabla th, .tabla td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f1f3; font-size: 14px; }
.tabla th { color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; background: #fafafa; }
.tabla tr:last-child td { border-bottom: none; }
.nombre { font-weight: 600; color: #111827; }
.acc { text-align: right !important; white-space: nowrap; }
.tag { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.tag-base { background: #e0e7ff; color: #3730a3; }
.tag-custom { background: #dcfce7; color: #15803d; }
.mini { padding: 6px 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; font-size: 13px; cursor: pointer; margin-left: 6px; }
.mini:hover:not(:disabled) { background: #f3f4f6; }
.mini:disabled { opacity: 0.4; cursor: not-allowed; }
.mini-danger { color: #dc2626; border-color: #fecaca; }
.mini-ok { color: #15803d; border-color: #bbf7d0; }
.tag-on { background: #dcfce7; color: #15803d; }
.tag-off { background: #fee2e2; color: #b91c1c; }
.fila-inactiva td { color: var(--color-text-muted); }
.fila-inactiva .nombre { color: var(--color-text-muted); }
@media (max-width: 720px) { .main { padding: 16px; } }

</style>
