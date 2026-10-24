<template>
  <div class="layout">
    <AppSidebar rol="superadmin" />

    <main class="main">
      <Transition name="toast">
        <div v-if="toast.visible" class="toast" :class="toast.type">{{ toast.msg }}</div>
      </Transition>

      <div class="page-hero">
        <div>
          <h1 class="hero-title">Gestión de Roles</h1>
          <p class="hero-sub">Roles globales del sistema (aplican a todas las empresas)</p>
        </div>
        <button class="btn" @click="abrirCrear">+ Nuevo Rol</button>
      </div>

      <div class="info">
        Los roles no se eliminan, se desactivan: los usuarios con un rol inactivo no pueden iniciar sesión
        hasta que lo vuelvas a activar. Los roles base (superadmin, admin, operario, cliente) no se renombran,
        y el rol superadmin no se puede desactivar.
      </div>

      <div class="card">
        <div v-if="cargando" class="empty">Cargando...</div>
        <div v-else-if="!roles.length" class="empty">No hay roles.</div>
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
                <button class="mini" :disabled="r.Protegido" @click="abrirEditar(r)">Editar</button>
                <button v-if="esInactivo(r)" class="mini mini-ok" @click="pedirCambioEstado(r)">Activar</button>
                <button v-else class="mini mini-danger" :disabled="esSuperadmin(r)" @click="pedirCambioEstado(r)">Desactivar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      <div v-if="modal.visible" class="overlay" @click.self="cerrarModal">
        <div class="modal">
          <h2>{{ modal.id ? 'Editar rol' : 'Nuevo rol' }}</h2>
          <label>Nombre del rol</label>
          <input v-model="modal.nombre" type="text" maxlength="40" placeholder="Ej: supervisor" @keyup.enter="guardar">
          <p v-if="modal.error" class="err">{{ modal.error }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="cerrarModal">Cancelar</button>
            <button class="btn-submit" :disabled="guardando" @click="guardar">{{ guardando ? 'Guardando...' : 'Guardar' }}</button>
          </div>
        </div>
      </div>

      <!-- MODAL ACTIVAR / DESACTIVAR -->
      <div v-if="cambio.visible" class="overlay" @click.self="cambio.visible = false">
        <div class="modal">
          <h2>{{ cambio.activar ? 'Activar rol' : 'Desactivar rol' }}</h2>
          <p v-if="cambio.activar">
            ¿Activar el rol <strong>{{ cambio.rol?.Nombre_Rol }}</strong>? Sus usuarios podrán volver a iniciar sesión.
          </p>
          <p v-else>
            ¿Desactivar el rol <strong>{{ cambio.rol?.Nombre_Rol }}</strong>?
            Sus {{ cambio.rol?.Total_Usuarios }} usuario(s), en todas las empresas, no podrán iniciar sesión
            y sus sesiones abiertas se cortarán hasta que lo vuelvas a activar.
          </p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="cambio.visible = false">Cancelar</button>
            <button :class="cambio.activar ? 'btn-submit' : 'btn-danger'" :disabled="cambiando" @click="confirmarCambioEstado">
              {{ cambiando ? 'Guardando...' : (cambio.activar ? 'Activar' : 'Desactivar') }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { getRolesGlobales, crearRolGlobal, actualizarRolGlobal, desactivarRolGlobal, activarRolGlobal } from '../../services/api.js'

const roles = ref([])
const cargando = ref(true)
const guardando = ref(false)
const cambiando = ref(false)
const toast = ref({ visible: false, msg: '', type: 'success' })
const modal = ref({ visible: false, id: null, nombre: '', error: '' })
const cambio = ref({ visible: false, rol: null, activar: false })

function mostrarToast(msg, type = 'success') {
  toast.value = { visible: true, msg, type }
  setTimeout(() => (toast.value.visible = false), 3200)
}

async function cargar() {
  cargando.value = true
  try {
    roles.value = await getRolesGlobales()
  } catch (e) {
    mostrarToast(e.message || 'Error al cargar roles', 'error')
  } finally {
    cargando.value = false
  }
}

function abrirCrear() { modal.value = { visible: true, id: null, nombre: '', error: '' } }
function abrirEditar(r) { modal.value = { visible: true, id: r.Id_Rol, nombre: r.Nombre_Rol, error: '' } }
function cerrarModal() { modal.value.visible = false }

async function guardar() {
  const nombre = modal.value.nombre.trim()
  if (!nombre) { modal.value.error = 'El nombre es obligatorio'; return }
  guardando.value = true
  modal.value.error = ''
  try {
    if (modal.value.id) await actualizarRolGlobal(modal.value.id, { Nombre_Rol: nombre })
    else await crearRolGlobal({ Nombre_Rol: nombre })
    cerrarModal()
    mostrarToast(modal.value.id ? 'Rol actualizado' : 'Rol creado')
    await cargar()
  } catch (e) {
    modal.value.error = e.message || 'No se pudo guardar'
  } finally {
    guardando.value = false
  }
}

const esInactivo = (r) => r.Estado === 'inactivo'
const esSuperadmin = (r) => String(r.Nombre_Rol || '').trim().toLowerCase() === 'superadmin'

function pedirCambioEstado(r) { cambio.value = { visible: true, rol: r, activar: esInactivo(r) } }

async function confirmarCambioEstado() {
  const { rol, activar } = cambio.value
  cambiando.value = true
  try {
    if (activar) await activarRolGlobal(rol.Id_Rol)
    else await desactivarRolGlobal(rol.Id_Rol)
    cambio.value.visible = false
    mostrarToast(activar ? 'Rol activado' : 'Rol desactivado')
    await cargar()
  } catch (e) {
    cambio.value.visible = false
    mostrarToast(e.message || 'No se pudo cambiar el estado', 'error')
  } finally {
    cambiando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.layout { display: flex; min-height: 100vh; background: #f6f7f9; }
.main { flex: 1; padding: 32px; position: relative; min-width: 0; }
.page-hero { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.hero-title { font-size: 26px; font-weight: 800; margin: 0; color: #111827; }
.hero-sub { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
.btn { background: #1f3a52; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn:hover { background: #162b3c; }
.info { background: #eef4fa; border: 1px solid #d6e4f0; color: #1f3a52; padding: 12px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 18px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
.empty { padding: 32px; text-align: center; color: #9ca3af; }
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
.fila-inactiva td { color: #9ca3af; }
.fila-inactiva .nombre { color: #9ca3af; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
.modal { background: white; border-radius: 14px; padding: 24px; width: 100%; max-width: 420px; }
.modal h2 { margin: 0 0 14px; font-size: 18px; }
.modal label { display: block; font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.modal input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.err { color: #dc2626; font-size: 13px; margin: 8px 0 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
.btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; font-size: 14px; cursor: pointer; }
.btn-submit { padding: 10px 20px; border-radius: 8px; border: none; background: #1f3a52; color: white; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-danger { padding: 10px 20px; border-radius: 8px; border: none; background: #dc2626; color: white; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-submit:disabled, .btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }
.toast { position: fixed; top: 20px; right: 20px; padding: 12px 18px; border-radius: 10px; color: white; font-size: 14px; z-index: 100; }
.toast.success { background: #15803d; }
.toast.error { background: #dc2626; }
.toast-enter-active, .toast-leave-active { transition: opacity .25s, transform .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
@media (max-width: 720px) { .main { padding: 16px; } }
</style>
