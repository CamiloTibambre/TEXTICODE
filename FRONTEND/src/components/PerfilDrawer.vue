<!--
  PerfilDrawer — "Mi perfil" del administrador, abierto desde el sidebar.
  Reemplaza la tarjeta de perfil y el modal "Editar mi perfil" que vivían
  dentro de Gestión de Usuarios. Usa los mismos endpoints:
    GET /usuarios/:id  ·  PUT /usuarios/:id
-->
<template>
  <BaseDrawer
    :open="open"
    titulo="Mi perfil"
    descripcion="Tus datos de acceso y contacto"
    ancho="md"
    :cerrar-al-clic-fuera="!editando"
    @update:open="v => !v && cerrar()"
  >
    <!-- Cargando -->
    <div v-if="cargando" class="perfil-loading">
      <span class="tx-skel perfil-skel-avatar"></span>
      <span class="tx-skel tx-skel--line" style="width: 50%; height: 16px"></span>
      <span class="tx-skel tx-skel--line" style="width: 70%"></span>
      <span class="tx-skel tx-skel--line" style="width: 60%"></span>
    </div>

    <!-- Error de carga -->
    <EmptyState
      v-else-if="errorCarga"
      icono="error"
      titulo="No pudimos cargar tu perfil"
      descripcion="Revisa tu conexión e inténtalo de nuevo."
      compacto
    >
      <button type="button" class="tx-btn tx-btn--secondary" @click="cargar">Reintentar</button>
    </EmptyState>

    <!-- Vista de perfil -->
    <div v-else-if="!editando" class="perfil-view">
      <div class="perfil-identity">
        <span class="perfil-avatar" aria-hidden="true">{{ iniciales }}</span>
        <div class="perfil-identity__text">
          <p class="perfil-name">{{ perfil.nombre || 'Sin nombre' }}</p>
          <span class="perfil-role">Administrador</span>
        </div>
      </div>

      <dl class="perfil-list">
        <div class="perfil-row">
          <dt>Correo electrónico</dt>
          <dd :class="{ 'is-empty': !perfil.email }">{{ perfil.email || 'Sin registrar' }}</dd>
        </div>
        <div class="perfil-row">
          <dt>Teléfono</dt>
          <dd :class="{ 'is-empty': !perfil.telefono }">{{ perfil.telefono || 'Sin registrar' }}</dd>
        </div>
        <div class="perfil-row">
          <dt>Usuario para iniciar sesión</dt>
          <dd :class="{ 'is-empty': !perfil.nombreUsuario }">{{ perfil.nombreUsuario || 'Sin registrar' }}</dd>
        </div>
      </dl>
    </div>

    <!-- Formulario de edición -->
    <form v-else id="perfil-form" class="tx-form" novalidate @submit.prevent="guardar">
      <div class="tx-form-grid">
        <BaseField label="Nombre completo" requerido completo :error="v.error('nombre')" v-slot="{ attrs }">
          <input v-bind="attrs" v-model="form.nombre" type="text" class="tx-input" autocomplete="name" required
            @keypress="soloLetras" @blur="v.tocar('nombre')">
        </BaseField>
        <BaseField label="Usuario para iniciar sesión" v-slot="{ attrs }">
          <input v-bind="attrs" v-model="form.nombreUsuario" type="text" class="tx-input" autocomplete="username"
            autocapitalize="none" spellcheck="false" placeholder="Ej: juan.perez">
        </BaseField>
        <BaseField label="Teléfono" opcional v-slot="{ attrs }">
          <input v-bind="attrs" v-model="form.telefono" type="tel" class="tx-input" autocomplete="tel" placeholder="+57 300 000 0000">
        </BaseField>
        <BaseField label="Correo electrónico" completo :error="v.error('email')" v-slot="{ attrs }">
          <input v-bind="attrs" v-model="form.email" type="email" class="tx-input" autocomplete="email" @blur="v.tocar('email')">
        </BaseField>
        <BaseField label="Nueva contraseña" opcional completo :error="v.error('contrasena')"
          hint="Déjala vacía para no cambiarla." v-slot="{ attrs }">
          <BasePassword v-bind="attrs" v-model="form.contrasena" requisitos @blur="v.tocar('contrasena')" />
        </BaseField>
      </div>
    </form>

    <template #footer>
      <template v-if="!editando">
        <button type="button" class="tx-btn tx-btn--secondary" @click="cerrar">Cerrar</button>
        <button type="button" class="tx-btn tx-btn--primary" :disabled="cargando || errorCarga" @click="empezarEdicion">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
          Editar perfil
        </button>
      </template>
      <template v-else>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="editando = false">Cancelar</button>
        <button type="submit" form="perfil-form" class="tx-btn tx-btn--primary" :disabled="guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </template>
    </template>
  </BaseDrawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseDrawer from './base/BaseDrawer.vue'
import EmptyState from './base/EmptyState.vue'
import BaseField from './base/BaseField.vue'
import BasePassword, { reglasContrasena } from './base/BasePassword.vue'
import { useValidacion } from '../composables/useValidacion'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { getUsuario, actualizarUsuario } from '../services/api.js'

const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open'])

const auth  = useAuthStore()
const toast = useToast()

const cargando   = ref(false)
const errorCarga = ref(false)
const editando   = ref(false)
const guardando  = ref(false)

const perfil = ref({ nombre: '', nombreUsuario: '', email: '', telefono: '', Id_Rol: null })
const form   = ref({ nombre: '', nombreUsuario: '', email: '', telefono: '', contrasena: '' })

const iniciales = computed(() =>
  (perfil.value.nombre || '?').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
)

async function cargar() {
  if (!auth.idUsuario) return
  cargando.value = true
  errorCarga.value = false
  try {
    const d = await getUsuario(auth.idUsuario)
    perfil.value = {
      nombre: d.Nombre_Completo || d.Nombre_Usuario || '',
      nombreUsuario: d.Nombre_Usuario || '',
      email: d.Correo || '',
      telefono: d.Telefono || '',
      Id_Rol: d.Id_Rol,
    }
  } catch {
    errorCarga.value = true
  } finally {
    cargando.value = false
  }
}

// Se carga cada vez que se abre, para mostrar siempre datos frescos
watch(() => props.open, abierto => {
  if (!abierto) return
  editando.value = false
  cargar()
})

function cerrar() {
  emit('update:open', false)
}

function empezarEdicion() {
  form.value = {
    nombre: perfil.value.nombre,
    nombreUsuario: perfil.value.nombreUsuario,
    email: perfil.value.email,
    telefono: perfil.value.telefono,
    contrasena: '',
  }
  v.reiniciar()
  editando.value = true
}

// ── Validación ──

const errores = computed(() => ({
  nombre: !form.value.nombre.trim()
    ? 'Escribe tu nombre completo.'
    : /[0-9]/.test(form.value.nombre) ? 'El nombre no puede tener números.' : '',
  email: form.value.email && !form.value.email.includes('@')
    ? 'Escribe un correo válido, por ejemplo nombre@empresa.com.'
    : '',
  contrasena: form.value.contrasena && reglasContrasena(form.value.contrasena).some(h => !h.ok)
    ? 'La contraseña no cumple los requisitos.'
    : '',
}))
const v = useValidacion(errores)

function soloLetras(e) {
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÄËÏÖÜäëïöüÑñ\s'-]$/.test(e.key)) e.preventDefault()
}

async function guardar() {
  if (!(await v.validar())) return

  guardando.value = true
  try {
    const payload = {
      Nombre_Completo: form.value.nombre,
      Nombre_Usuario: form.value.nombreUsuario || perfil.value.nombreUsuario,
      Correo: form.value.email,
      Telefono: form.value.telefono || null,
      Id_Rol: perfil.value.Id_Rol,
      Estado: 'activo',
      ...(form.value.contrasena.trim() ? { Contrasena: form.value.contrasena.trim() } : {}),
    }
    await actualizarUsuario(auth.idUsuario, payload)

    perfil.value = {
      ...perfil.value,
      nombre: form.value.nombre,
      nombreUsuario: payload.Nombre_Usuario,
      email: form.value.email,
      telefono: form.value.telefono,
    }

    // Refleja el cambio en el sidebar y en la sesión guardada
    if (auth.usuario) {
      auth.usuario.Nombre_Completo = form.value.nombre
      auth.usuario.Nombre_Usuario  = payload.Nombre_Usuario
      try { localStorage.setItem('usuario', JSON.stringify(auth.usuario)) } catch { /* sin almacenamiento */ }
    }

    editando.value = false
    toast.success('Perfil actualizado.')
  } catch (e) {
    toast.error(e.message || 'No se pudo guardar tu perfil. Inténtalo de nuevo.')
  } finally {
    guardando.value = false
  }
}
</script>

<style>
.perfil-loading {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
}
.perfil-skel-avatar { width: 64px; height: 64px; border-radius: var(--radius-full); }

.perfil-identity {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.perfil-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-brand), var(--color-accent));
  color: var(--color-on-brand);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}
.perfil-name {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}
.perfil-role {
  display: inline-block;
  margin-top: var(--space-1);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: #e0e7ff;
  color: #3730a3;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.perfil-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.perfil-row dt {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}
.perfil-row dd {
  margin-top: 2px;
  font-size: var(--text-md);
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.perfil-row dd.is-empty { color: var(--color-text-muted); font-style: italic; }

</style>
