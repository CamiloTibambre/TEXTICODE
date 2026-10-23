<template>
  <div class="layout">
    <AppSidebar rol="superadmin" />

    <main class="main">

      <!-- FONDO DECORATIVO -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- TOAST -->
      <Transition name="toast">
        <div v-if="toast.visible" class="toast" :class="toast.type">{{ toast.msg }}</div>
      </Transition>

      <!-- HERO -->
      <div class="page-hero" :class="{ 'hero-visible': animVisible }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" :d="ICON_EMPRESA"/>
            </svg>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">Gestión de Empresas</h1>
            <p class="hero-sub">Administración global de empresas y sus administradores</p>
          </div>
        </div>
        <div class="hero-actions-wrap">
          <div class="filters">
            <div class="search-box" :class="{ 'search-focus': searchFocus }">
              <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input v-model="busqueda" type="text" placeholder="Buscar empresas..."
                @focus="searchFocus = true" @blur="searchFocus = false">
            </div>
            <div class="select-wrapper">
              <select v-model="filtroEstado" class="select">
                <option value="">Todos los estados</option>
                <option value="activa">Activas</option>
                <option value="inactiva">Inactivas</option>
              </select>
              <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
          </div>
          <button class="btn" @click="abrirCrear">
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Nueva Empresa
          </button>
        </div>
      </div>

      <!-- STATS -->
      <div class="stats" :class="{ 'stats-visible': animVisible }">
        <div v-for="(s, i) in statsCards" :key="s.label" class="stat-card" :style="{ transitionDelay: animVisible ? `${i * 80}ms` : '0ms' }">
          <div class="stat-accent" :style="{ background: s.color }"></div>
          <h3>{{ s.label }}</h3>
          <p :style="{ color: s.color }">{{ s.value }}</p>
        </div>
      </div>

      <!-- TABLA -->
      <div class="table-box" :class="{ 'box-visible': animVisible }">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" :d="ICON_EMPRESA"/>
            </svg>
            Todas las empresas
            <span class="count-badge">{{ empresasFiltradas.length }}</span>
          </div>
        </div>

        <div v-if="cargando" class="table-skeleton">
          <div v-for="i in 4" :key="i" class="table-skeleton-row">
            <span class="skeleton-line skeleton-name"></span>
            <span class="skeleton-line skeleton-tag"></span>
            <span class="skeleton-line skeleton-date"></span>
          </div>
        </div>

        <table v-else>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Slug</th>
              <th>Estado</th>
              <th>Fecha de creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, idx) in empresasFiltradas" :key="e.Id_Empresa" class="table-row" :style="{ animationDelay: `${idx * 40}ms` }">
              <td>
                <div class="user">
                  <div class="avatar">{{ iniciales(e.Nombre_Empresa) }}</div>
                  <div class="user-info">
                    <span class="user-name">{{ e.Nombre_Empresa }}</span>
                    <span class="user-handle">ID {{ e.Id_Empresa }}</span>
                  </div>
                </div>
              </td>
              <td><code class="slug">{{ e.Slug }}</code></td>
              <td><span class="badge-estado" :class="e.Estado === 'activa' ? 'activa' : 'inactiva'">{{ e.Estado === 'activa' ? 'Activa' : 'Inactiva' }}</span></td>
              <td>{{ formatearFecha(e.Fecha_Creacion) }}</td>
              <td>
                <div class="actions">
                  <button class="action-btn" @click="abrirAdmins(e)" title="Administradores">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" :d="ICON_USERS"/>
                    </svg>
                  </button>
                  <button class="action-btn edit-btn" @click="abrirEditar(e)" title="Editar">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                    </svg>
                  </button>
                  <button v-if="e.Estado !== 'activa'" class="action-btn activate-btn" :disabled="activandoId === e.Id_Empresa" @click="activar(e)" title="Activar">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                  </button>
                  <button v-if="e.Estado === 'activa'" class="action-btn delete-btn" @click="pedirDesactivar(e)" title="Desactivar">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="empresasFiltradas.length === 0">
              <td colspan="5" class="empty-state">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="ICON_EMPRESA"/>
                </svg>
                <p>No se encontraron empresas</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- MODAL: NUEVA EMPRESA + ADMINISTRADOR -->
    <Transition name="modal">
      <div v-if="modalCrear" class="modal" @click.self="cerrarCrear">
        <div class="modal-content">
          <h2>Nueva Empresa</h2>
          <span class="close" @click="cerrarCrear">×</span>

          <p class="section-title">Datos de la empresa</p>

          <label>Nombre de la empresa</label>
          <input v-model="formCrear.nombreEmpresa" type="text" placeholder="Ej: Textiles del Norte"
            :class="{ 'input-error': erroresCrear.nombreEmpresa && tocadoCrear }" @blur="tocadoCrear = true"
            @input="autoSlug">
          <span v-if="erroresCrear.nombreEmpresa && tocadoCrear" class="error-msg">{{ erroresCrear.nombreEmpresa }}</span>

          <label>Slug <span class="label-hint">(identificador único, minúsculas y guiones)</span></label>
          <input v-model="formCrear.slug" type="text" placeholder="textiles-del-norte"
            :class="{ 'input-error': erroresCrear.slug && tocadoCrear }" @blur="tocadoCrear = true"
            @input="slugManual = true">
          <span v-if="erroresCrear.slug && tocadoCrear" class="error-msg">{{ erroresCrear.slug }}</span>

          <p class="section-title">Administrador de la empresa</p>

          <label>Nombre completo</label>
          <input v-model="formCrear.nombreCompleto" type="text" placeholder="Nombre completo"
            :class="{ 'input-error': erroresCrear.nombreCompleto && tocadoCrear }" @blur="tocadoCrear = true">
          <span v-if="erroresCrear.nombreCompleto && tocadoCrear" class="error-msg">{{ erroresCrear.nombreCompleto }}</span>

          <label>Nombre de usuario <span class="label-hint">(para iniciar sesión)</span></label>
          <input v-model="formCrear.nombreUsuario" type="text" placeholder="Ej: admin_textiles"
            :class="{ 'input-error': erroresCrear.nombreUsuario && tocadoCrear }" @blur="tocadoCrear = true">
          <span v-if="erroresCrear.nombreUsuario && tocadoCrear" class="error-msg">{{ erroresCrear.nombreUsuario }}</span>

          <label>Correo electrónico</label>
          <input v-model="formCrear.correo" type="email" placeholder="admin@empresa.com"
            :class="{ 'input-error': erroresCrear.correo && tocadoCrear }" @blur="tocadoCrear = true">
          <span v-if="erroresCrear.correo && tocadoCrear" class="error-msg">{{ erroresCrear.correo }}</span>

          <label>Teléfono <span class="label-hint">(opcional)</span></label>
          <input v-model="formCrear.telefono" type="tel" inputmode="numeric" maxlength="10" placeholder="3001234567"
            :class="{ 'input-error': erroresCrear.telefono && tocadoCrear }" @blur="tocadoCrear = true"
            @input="formCrear.telefono = soloDigitos(formCrear.telefono)">
          <span v-if="erroresCrear.telefono && tocadoCrear" class="error-msg">{{ erroresCrear.telefono }}</span>

          <label>Contraseña</label>
          <div class="input-wrap-modal">
            <input v-model="formCrear.contrasena" :type="verPassCrear ? 'text' : 'password'" placeholder="Contraseña del administrador"
              :class="{ 'input-error': erroresCrear.contrasena && tocadoCrear }" @blur="tocadoCrear = true" autocomplete="new-password">
            <button class="toggle-pass-modal" @click="verPassCrear = !verPassCrear" type="button">{{ verPassCrear ? 'Ocultar' : 'Ver' }}</button>
          </div>
          <div v-if="formCrear.contrasena" class="pwd-hints">
            <span v-for="h in hintsPassCrear" :key="h.label" class="pwd-hint" :class="h.ok ? 'hint-ok' : 'hint-no'">{{ h.ok ? '✓' : '✗' }} {{ h.label }}</span>
          </div>
          <span v-if="erroresCrear.contrasena && tocadoCrear" class="error-msg">{{ erroresCrear.contrasena }}</span>

          <div class="modal-buttons">
            <button class="btn-cancel" @click="cerrarCrear">Cancelar</button>
            <button class="btn-submit" @click="guardarCrear" :disabled="guardando">
              {{ guardando ? 'Creando...' : 'Crear Empresa' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL: EDITAR EMPRESA -->
    <Transition name="modal">
      <div v-if="modalEditar" class="modal" @click.self="cerrarEditar">
        <div class="modal-content">
          <h2>Editar Empresa</h2>
          <span class="close" @click="cerrarEditar">×</span>

          <label>Nombre de la empresa</label>
          <input v-model="formEditar.nombreEmpresa" type="text"
            :class="{ 'input-error': erroresEditar.nombreEmpresa && tocadoEditar }" @blur="tocadoEditar = true">
          <span v-if="erroresEditar.nombreEmpresa && tocadoEditar" class="error-msg">{{ erroresEditar.nombreEmpresa }}</span>

          <label>Slug</label>
          <input v-model="formEditar.slug" type="text"
            :class="{ 'input-error': erroresEditar.slug && tocadoEditar }" @blur="tocadoEditar = true">
          <span v-if="erroresEditar.slug && tocadoEditar" class="error-msg">{{ erroresEditar.slug }}</span>

          <p class="section-title">Correos a clientes y operarios</p>

          <label>Nombre comercial <span class="label-hint">(opcional)</span></label>
          <input v-model="formEditar.nombreComercial" type="text" maxlength="80" placeholder="Si lo dejas vacío se usa el nombre de la empresa"
            :class="{ 'input-error': erroresEditar.nombreComercial && tocadoEditar }" @blur="tocadoEditar = true">
          <span v-if="erroresEditar.nombreComercial && tocadoEditar" class="error-msg">{{ erroresEditar.nombreComercial }}</span>
          <span class="field-help">Es el nombre que verán los destinatarios como remitente y en el asunto de cada correo.</span>

          <label>Correo de respuestas <span class="label-hint">(opcional)</span></label>
          <input v-model="formEditar.emailNotificaciones" type="email" maxlength="160" placeholder="contacto@empresa.com"
            :class="{ 'input-error': erroresEditar.emailNotificaciones && tocadoEditar }" @blur="tocadoEditar = true">
          <span v-if="erroresEditar.emailNotificaciones && tocadoEditar" class="error-msg">{{ erroresEditar.emailNotificaciones }}</span>
          <span class="field-help">Cuando alguien responda un correo automático, la respuesta llegará aquí.</span>

          <div class="modal-buttons">
            <button class="btn-cancel" @click="cerrarEditar">Cancelar</button>
            <button class="btn-submit" @click="guardarEditar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL: ADMINISTRADORES DE LA EMPRESA -->
    <Transition name="modal">
      <div v-if="modalAdmins.visible" class="modal" @click.self="cerrarAdmins">
        <div class="modal-content modal-wide">
          <h2>Administradores — {{ modalAdmins.empresa?.Nombre_Empresa }}</h2>
          <span class="close" @click="cerrarAdmins">×</span>

          <div v-if="modalAdmins.cargando" class="admins-empty">Cargando...</div>
          <div v-else-if="modalAdmins.lista.length === 0" class="admins-empty">Esta empresa no tiene administradores.</div>
          <div v-else class="admins-list">
            <div v-for="a in modalAdmins.lista" :key="a.Id_Usuario" class="admin-row">
              <div class="avatar">{{ iniciales(a.Nombre_Completo) }}</div>
              <div class="admin-info">
                <span class="user-name">{{ a.Nombre_Completo }}</span>
                <span class="user-handle">@{{ a.Nombre_Usuario }} · {{ a.Correo }}</span>
                <span class="user-handle">{{ a.Telefono || 'Sin teléfono' }}</span>
              </div>
              <span class="badge-estado" :class="a.Estado === 'activo' ? 'activa' : 'inactiva'">{{ a.Estado === 'activo' ? 'Activo' : 'Inactivo' }}</span>
              <div class="actions">
                <button class="action-btn edit-btn" @click="abrirEditarAdmin(a)" title="Editar">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                  </svg>
                </button>
                <button v-if="a.Estado !== 'activo'" class="action-btn activate-btn" :disabled="activandoAdminId === a.Id_Usuario" @click="activarAdmin(a)" title="Activar">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                  </svg>
                </button>
                <button v-if="a.Estado === 'activo'" class="action-btn delete-btn" @click="pedirInactivarAdmin(a)" title="Desactivar">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="modal-buttons">
            <button class="btn-cancel" @click="cerrarAdmins">Cerrar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL: EDITAR ADMINISTRADOR -->
    <Transition name="modal">
      <div v-if="modalAdmin" class="modal modal-top" @click.self="cerrarEditarAdmin">
        <div class="modal-content">
          <h2>Editar Administrador</h2>
          <span class="close" @click="cerrarEditarAdmin">×</span>

          <label>Nombre completo</label>
          <input v-model="formAdmin.nombreCompleto" type="text"
            :class="{ 'input-error': erroresAdmin.nombreCompleto && tocadoAdmin }" @blur="tocadoAdmin = true">
          <span v-if="erroresAdmin.nombreCompleto && tocadoAdmin" class="error-msg">{{ erroresAdmin.nombreCompleto }}</span>

          <label>Nombre de usuario</label>
          <input v-model="formAdmin.nombreUsuario" type="text"
            :class="{ 'input-error': erroresAdmin.nombreUsuario && tocadoAdmin }" @blur="tocadoAdmin = true">
          <span v-if="erroresAdmin.nombreUsuario && tocadoAdmin" class="error-msg">{{ erroresAdmin.nombreUsuario }}</span>

          <label>Correo electrónico</label>
          <input v-model="formAdmin.correo" type="email"
            :class="{ 'input-error': erroresAdmin.correo && tocadoAdmin }" @blur="tocadoAdmin = true">
          <span v-if="erroresAdmin.correo && tocadoAdmin" class="error-msg">{{ erroresAdmin.correo }}</span>

          <label>Teléfono <span class="label-hint">(opcional)</span></label>
          <input v-model="formAdmin.telefono" type="tel" inputmode="numeric" maxlength="10"
            :class="{ 'input-error': erroresAdmin.telefono && tocadoAdmin }" @blur="tocadoAdmin = true"
            @input="formAdmin.telefono = soloDigitos(formAdmin.telefono)">
          <span v-if="erroresAdmin.telefono && tocadoAdmin" class="error-msg">{{ erroresAdmin.telefono }}</span>

          <label>Nueva contraseña <span class="label-hint">(déjala vacía para no cambiarla)</span></label>
          <div class="input-wrap-modal">
            <input v-model="formAdmin.contrasena" :type="verPassAdmin ? 'text' : 'password'" placeholder="Opcional"
              :class="{ 'input-error': erroresAdmin.contrasena && tocadoAdmin }" @blur="tocadoAdmin = true" autocomplete="new-password">
            <button class="toggle-pass-modal" @click="verPassAdmin = !verPassAdmin" type="button">{{ verPassAdmin ? 'Ocultar' : 'Ver' }}</button>
          </div>
          <div v-if="formAdmin.contrasena" class="pwd-hints">
            <span v-for="h in hintsPassAdmin" :key="h.label" class="pwd-hint" :class="h.ok ? 'hint-ok' : 'hint-no'">{{ h.ok ? '✓' : '✗' }} {{ h.label }}</span>
          </div>
          <span v-if="erroresAdmin.contrasena && tocadoAdmin" class="error-msg">{{ erroresAdmin.contrasena }}</span>

          <div class="modal-buttons">
            <button class="btn-cancel" @click="cerrarEditarAdmin">Cancelar</button>
            <button class="btn-submit" @click="guardarAdmin" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- CONFIRMAR: DESACTIVAR EMPRESA (hay que escribir el nombre) -->
    <Transition name="modal">
      <div v-if="confirmEmpresa.visible" class="confirm-overlay" @click.self="confirmEmpresa.visible = false">
        <div class="confirm-box">
          <div class="confirm-icon">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
          </div>
          <p class="confirm-title">¿Desactivar «{{ confirmEmpresa.empresa?.Nombre_Empresa }}»?</p>
          <p class="confirm-sub">Todos sus usuarios dejarán de poder iniciar sesión. Podrás volver a activarla después.</p>
          <p class="confirm-sub confirm-type">Escribe el nombre de la empresa para confirmar:</p>
          <input v-model="confirmEmpresa.texto" class="confirm-input" type="text" :placeholder="confirmEmpresa.empresa?.Nombre_Empresa">
          <div class="confirm-btns">
            <button class="btn-cancel" @click="confirmEmpresa.visible = false">Cancelar</button>
            <button class="btn-danger" :disabled="!nombreConfirmado || guardando" @click="confirmarDesactivar">
              {{ guardando ? 'Desactivando...' : 'Desactivar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- CONFIRMAR: DESACTIVAR ADMINISTRADOR -->
    <Transition name="modal">
      <div v-if="confirmAdmin.visible" class="confirm-overlay" @click.self="confirmAdmin.visible = false">
        <div class="confirm-box">
          <p class="confirm-title">¿Desactivar administrador?</p>
          <p class="confirm-sub">{{ confirmAdmin.admin?.Nombre_Completo }} ya no podrá iniciar sesión.</p>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="confirmAdmin.visible = false">Cancelar</button>
            <button class="btn-danger" :disabled="guardando" @click="confirmarInactivarAdmin">Desactivar</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import {
  getEmpresas, crearEmpresa, actualizarEmpresa, desactivarEmpresa, activarEmpresa,
  getAdministradoresEmpresa, actualizarAdministradorEmpresa, inactivarAdministradorEmpresa, activarAdministradorEmpresa,
} from '../../services/api.js'

const ICON_EMPRESA = 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21'
const ICON_USERS = 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'

// ── ESTADO GENERAL ──
const animVisible = ref(false)
const cargando    = ref(true)
const guardando   = ref(false)
const searchFocus = ref(false)
const busqueda    = ref('')
const filtroEstado = ref('')
const empresas    = ref([])
const toast       = ref({ visible: false, msg: '', type: 'success' })

function mostrarToast(msg, type = 'success') {
  toast.value = { visible: true, msg, type }
  setTimeout(() => (toast.value.visible = false), 3200)
}

// ── HELPERS ──
function iniciales(nombre) {
  return String(nombre || '?').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
}
function formatearFecha(f) {
  return f ? new Date(f).toLocaleDateString('es-CO') : '—'
}
function soloDigitos(v) {
  return String(v || '').replace(/\D/g, '').slice(0, 10)
}
function slugify(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// ── VALIDACIONES (mismas reglas que el backend) ──
const RE_NOMBRE = /^[A-Za-zÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÄËÏÖÜäëïöüÑñ\s'-]+$/
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_SLUG   = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function reglasPassword(p) {
  return [
    { label: '8+ caracteres', ok: p.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(p) },
    { label: 'Un número',     ok: /[0-9]/.test(p) },
    { label: 'Un carácter especial', ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
  ]
}
function errorPassword(p) {
  const fallo = reglasPassword(p).find(r => !r.ok)
  return fallo ? `La contraseña necesita: ${fallo.label.toLowerCase()}.` : ''
}
function validarPersona(f, { passwordObligatoria }) {
  const e = {}
  if (!f.nombreCompleto.trim()) e.nombreCompleto = 'El nombre completo es obligatorio.'
  else if (!RE_NOMBRE.test(f.nombreCompleto.trim())) e.nombreCompleto = 'Solo letras y espacios.'
  if (!f.nombreUsuario.trim()) e.nombreUsuario = 'El nombre de usuario es obligatorio.'
  else if (/\s/.test(f.nombreUsuario.trim()) || f.nombreUsuario.trim().length < 3) e.nombreUsuario = 'Mínimo 3 caracteres y sin espacios.'
  if (!f.correo.trim()) e.correo = 'El correo es obligatorio.'
  else if (!RE_CORREO.test(f.correo.trim())) e.correo = 'El correo no tiene un formato válido.'
  if (f.telefono && !/^\d{7,10}$/.test(f.telefono)) e.telefono = 'Debe tener entre 7 y 10 dígitos.'
  if (passwordObligatoria || f.contrasena) {
    const ep = f.contrasena ? errorPassword(f.contrasena) : 'La contraseña es obligatoria.'
    if (ep) e.contrasena = ep
  }
  return e
}
function validarEmpresa(nombre, slug) {
  const e = {}
  if (!nombre.trim()) e.nombreEmpresa = 'El nombre de la empresa es obligatorio.'
  if (!slug.trim()) e.slug = 'El slug es obligatorio.'
  else if (!RE_SLUG.test(slug.trim().toLowerCase())) e.slug = 'Solo minúsculas, números y guiones (ej: mi-empresa).'
  return e
}

// ── LISTA / FILTROS / STATS ──
const empresasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return empresas.value.filter(e => {
    if (filtroEstado.value && e.Estado !== filtroEstado.value) return false
    if (!q) return true
    return String(e.Nombre_Empresa).toLowerCase().includes(q) || String(e.Slug).toLowerCase().includes(q)
  })
})
const statsCards = computed(() => [
  { label: 'Total empresas', value: empresas.value.length, color: '#1f3a52' },
  { label: 'Activas',   value: empresas.value.filter(e => e.Estado === 'activa').length,   color: '#16a34a' },
  { label: 'Inactivas', value: empresas.value.filter(e => e.Estado !== 'activa').length,   color: '#dc2626' },
])

async function cargarEmpresas() {
  cargando.value = true
  try {
    empresas.value = await getEmpresas()
  } catch (e) {
    mostrarToast(e.message || 'Error al cargar las empresas', 'danger')
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargarEmpresas()
  setTimeout(() => (animVisible.value = true), 50)
})

// ── CREAR EMPRESA + ADMIN ──
const modalCrear = ref(false)
const tocadoCrear = ref(false)
const slugManual = ref(false)
const verPassCrear = ref(false)
const formVacioCrear = () => ({ nombreEmpresa: '', slug: '', nombreCompleto: '', nombreUsuario: '', correo: '', telefono: '', contrasena: '' })
const formCrear = ref(formVacioCrear())

const erroresCrear = computed(() => ({
  ...validarEmpresa(formCrear.value.nombreEmpresa, formCrear.value.slug),
  ...validarPersona(formCrear.value, { passwordObligatoria: true }),
}))
const hintsPassCrear = computed(() => reglasPassword(formCrear.value.contrasena))

function autoSlug() {
  if (!slugManual.value) formCrear.value.slug = slugify(formCrear.value.nombreEmpresa)
}
function abrirCrear() {
  formCrear.value = formVacioCrear()
  tocadoCrear.value = false
  slugManual.value = false
  verPassCrear.value = false
  modalCrear.value = true
}
function cerrarCrear() { modalCrear.value = false }

async function guardarCrear() {
  tocadoCrear.value = true
  if (Object.keys(erroresCrear.value).length) return
  const f = formCrear.value
  guardando.value = true
  try {
    await crearEmpresa({
      empresa: { Nombre_Empresa: f.nombreEmpresa.trim(), Slug: f.slug.trim().toLowerCase() },
      administrador: {
        Nombre_Completo: f.nombreCompleto.trim(),
        Nombre_Usuario: f.nombreUsuario.trim(),
        Correo: f.correo.trim(),
        Telefono: f.telefono || undefined,
        Contrasena: f.contrasena,
      },
    })
    modalCrear.value = false
    mostrarToast('Empresa creada con su administrador')
    await cargarEmpresas()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo crear la empresa', 'danger')
  } finally {
    guardando.value = false
  }
}

// ── EDITAR EMPRESA ──
const modalEditar = ref(false)
const tocadoEditar = ref(false)
const idEditar = ref(null)
const formEditar = ref({ nombreEmpresa: '', slug: '', nombreComercial: '', emailNotificaciones: '' })
const erroresEditar = computed(() => {
  const f = formEditar.value
  const e = validarEmpresa(f.nombreEmpresa, f.slug)
  if (f.nombreComercial && f.nombreComercial.trim().length > 80) e.nombreComercial = 'Máximo 80 caracteres.'
  if (f.emailNotificaciones && !RE_CORREO.test(f.emailNotificaciones.trim())) e.emailNotificaciones = 'El correo no tiene un formato válido.'
  return e
})

function abrirEditar(e) {
  idEditar.value = e.Id_Empresa
  formEditar.value = {
    nombreEmpresa: e.Nombre_Empresa,
    slug: e.Slug,
    nombreComercial: e.Nombre_Comercial || '',
    emailNotificaciones: e.Email_Notificaciones || '',
  }
  tocadoEditar.value = false
  modalEditar.value = true
}
function cerrarEditar() { modalEditar.value = false }

async function guardarEditar() {
  tocadoEditar.value = true
  if (Object.keys(erroresEditar.value).length) return
  guardando.value = true
  try {
    await actualizarEmpresa(idEditar.value, {
      Nombre_Empresa: formEditar.value.nombreEmpresa.trim(),
      Slug: formEditar.value.slug.trim().toLowerCase(),
      Nombre_Comercial: formEditar.value.nombreComercial.trim(),
      Email_Notificaciones: formEditar.value.emailNotificaciones.trim(),
    })
    modalEditar.value = false
    mostrarToast('Empresa actualizada')
    await cargarEmpresas()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo actualizar la empresa', 'danger')
  } finally {
    guardando.value = false
  }
}

// ── DESACTIVAR EMPRESA ──
const confirmEmpresa = ref({ visible: false, empresa: null, texto: '' })
const nombreConfirmado = computed(() => {
  const emp = confirmEmpresa.value.empresa
  return !!emp && confirmEmpresa.value.texto.trim().toLowerCase() === String(emp.Nombre_Empresa).trim().toLowerCase()
})
function pedirDesactivar(e) { confirmEmpresa.value = { visible: true, empresa: e, texto: '' } }

async function confirmarDesactivar() {
  if (!nombreConfirmado.value) return
  guardando.value = true
  try {
    await desactivarEmpresa(confirmEmpresa.value.empresa.Id_Empresa)
    confirmEmpresa.value.visible = false
    mostrarToast('Empresa desactivada', 'danger')
    await cargarEmpresas()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo desactivar la empresa', 'danger')
  } finally {
    guardando.value = false
  }
}

const activandoId = ref(null)
async function activar(e) {
  activandoId.value = e.Id_Empresa
  try {
    await activarEmpresa(e.Id_Empresa)
    mostrarToast('Empresa activada')
    await cargarEmpresas()
  } catch (err) {
    mostrarToast(err.message || 'No se pudo activar la empresa', 'danger')
  } finally {
    activandoId.value = null
  }
}

// ── ADMINISTRADORES DE UNA EMPRESA ──
const modalAdmins = ref({ visible: false, empresa: null, lista: [], cargando: false })

async function cargarAdmins() {
  const emp = modalAdmins.value.empresa
  if (!emp) return
  modalAdmins.value.cargando = true
  try {
    modalAdmins.value.lista = await getAdministradoresEmpresa(emp.Id_Empresa)
  } catch (e) {
    mostrarToast(e.message || 'No se pudieron cargar los administradores', 'danger')
  } finally {
    modalAdmins.value.cargando = false
  }
}
async function abrirAdmins(e) {
  modalAdmins.value = { visible: true, empresa: e, lista: [], cargando: true }
  await cargarAdmins()
}
function cerrarAdmins() { modalAdmins.value.visible = false }

// editar administrador
const modalAdmin = ref(false)
const tocadoAdmin = ref(false)
const verPassAdmin = ref(false)
const idAdmin = ref(null)
const formAdmin = ref({ nombreCompleto: '', nombreUsuario: '', correo: '', telefono: '', contrasena: '' })
const erroresAdmin = computed(() => validarPersona(formAdmin.value, { passwordObligatoria: false }))
const hintsPassAdmin = computed(() => reglasPassword(formAdmin.value.contrasena))

function abrirEditarAdmin(a) {
  idAdmin.value = a.Id_Usuario
  formAdmin.value = {
    nombreCompleto: a.Nombre_Completo || '',
    nombreUsuario: a.Nombre_Usuario || '',
    correo: a.Correo || '',
    telefono: a.Telefono || '',
    contrasena: '',
  }
  tocadoAdmin.value = false
  verPassAdmin.value = false
  modalAdmin.value = true
}
function cerrarEditarAdmin() { modalAdmin.value = false }

async function guardarAdmin() {
  tocadoAdmin.value = true
  if (Object.keys(erroresAdmin.value).length) return
  const f = formAdmin.value
  guardando.value = true
  try {
    await actualizarAdministradorEmpresa(modalAdmins.value.empresa.Id_Empresa, idAdmin.value, {
      Nombre_Completo: f.nombreCompleto.trim(),
      Nombre_Usuario: f.nombreUsuario.trim(),
      Correo: f.correo.trim(),
      Telefono: f.telefono || null,
      Contrasena: f.contrasena || undefined,
    })
    modalAdmin.value = false
    mostrarToast('Administrador actualizado')
    await cargarAdmins()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo actualizar el administrador', 'danger')
  } finally {
    guardando.value = false
  }
}

// activar administrador
const activandoAdminId = ref(null)
async function activarAdmin(a) {
  activandoAdminId.value = a.Id_Usuario
  try {
    await activarAdministradorEmpresa(modalAdmins.value.empresa.Id_Empresa, a.Id_Usuario)
    mostrarToast('Administrador activado')
    await cargarAdmins()
  } catch (err) {
    mostrarToast(err.message || 'No se pudo activar el administrador', 'danger')
  } finally {
    activandoAdminId.value = null
  }
}

// desactivar administrador
const confirmAdmin = ref({ visible: false, admin: null })
function pedirInactivarAdmin(a) { confirmAdmin.value = { visible: true, admin: a } }

async function confirmarInactivarAdmin() {
  guardando.value = true
  try {
    await inactivarAdministradorEmpresa(modalAdmins.value.empresa.Id_Empresa, confirmAdmin.value.admin.Id_Usuario)
    confirmAdmin.value.visible = false
    mostrarToast('Administrador desactivado', 'danger')
    await cargarAdmins()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo desactivar el administrador', 'danger')
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
/* ── LAYOUT ── */
.layout { display: flex; min-height: 100vh; background: #f1f5f9; position: relative; overflow: hidden; }
.main { flex: 1; padding: 28px 30px; position: relative; z-index: 1; min-width: 0; }

/* ── FONDO ── */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; }
.orb-2 { width: 400px; height: 400px; background: #2563eb; bottom: -100px; left: 10%; }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

/* ── HERO ── */
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }
.hero-left { display: flex; align-items: center; gap: 16px; }
.hero-text { display: flex; flex-direction: column; }
.hero-icon-wrap { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: #1f3a52; border-radius: 14px; flex-shrink: 0; }
.hero-icon { width: 26px; height: 26px; color: white; }
.hero-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0 0; }
.hero-actions-wrap { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex-shrink: 0; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-box { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: white; border: 1.5px solid #e5e7eb; border-radius: 10px; transition: border-color 0.2s, box-shadow 0.2s; width: 220px; }
.search-box.search-focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.search-ico { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font-size: 14px; color: #374151; background: transparent; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.select { padding: 9px 32px 9px 12px; border-radius: 10px; border: 1.5px solid #e5e7eb; font-size: 14px; background: white; appearance: none; -webkit-appearance: none; outline: none; cursor: pointer; transition: border-color 0.2s; }
.select:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: #6b7280; pointer-events: none; }
.btn { display: flex; align-items: center; gap: 8px; background: #1f3a52; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: background 0.2s, transform 0.1s; flex-shrink: 0; }
.btn:hover { background: #162b3c; transform: translateY(-1px); }
.btn-icon { width: 18px; height: 18px; }

/* ── STATS ── */
.stats { display: flex; gap: 18px; margin-bottom: 24px; }
.stat-card { background: white; flex: 1; padding: 20px 20px 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s; }
.stats-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px 0; }
.stat-card p { font-size: 30px; font-weight: 800; margin: 0; line-height: 1; }

/* ── TABLA ── */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease 0.2s, transform 0.45s ease 0.2s; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }
table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; padding: 13px 18px; white-space: nowrap; }
td { padding: 14px 18px; font-size: 14px; border-top: 1px solid #f1f5f9; }
.table-row { transition: background 0.18s; animation: rowSlideIn 0.35s ease both; }
.table-row:hover td { background: #f8fafc; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }

.table-skeleton { padding: 18px; display: grid; gap: 12px; }
.table-skeleton-row { display: grid; grid-template-columns: 1.4fr 0.7fr 0.7fr; align-items: center; gap: 16px; padding: 14px 10px; }
.skeleton-line { display: block; border-radius: 999px; background: #e5e7eb; height: 14px; }
.skeleton-name { width: 60%; height: 16px; }
.skeleton-tag { width: 90px; }
.skeleton-date { width: 80px; }

.user { display: flex; align-items: center; gap: 10px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: #e0e7ff; color: #3730a3; flex-shrink: 0; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 14px; color: #111827; }
.user-handle { font-size: 12px; color: #6b7280; }
.slug { font-size: 12.5px; background: #f3f4f6; color: #374151; padding: 3px 8px; border-radius: 6px; }

.badge-estado { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.badge-estado.activa { background: #dcfce7; color: #166534; }
.badge-estado.inactiva { background: #fee2e2; color: #991b1b; }

.actions { display: flex; gap: 8px; align-items: center; }
.action-btn { width: 32px; height: 32px; border-radius: 7px; border: none; background: #1f3a52; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; color: white; }
.action-btn svg { pointer-events: none; }
.action-btn:hover { background: #2d5580; transform: scale(1.07); }
.delete-btn:hover { background: #dc2626; }
.activate-btn { background: #16a34a; }
.activate-btn:hover { background: #15803d; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.empty-state { text-align: center; padding: 48px 20px; color: #9ca3af; }
.empty-state svg { margin: 0 auto 12px; display: block; opacity: 0.4; }
.empty-state p { font-size: 14px; margin: 0; }

/* ── MODALES ── */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.modal-top { z-index: 1050; }
.modal-content { background: white; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 30px; border-radius: 14px; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
.modal-wide { max-width: 680px; }
.modal-content h2 { font-size: 18px; font-weight: 600; margin: 0 40px 20px 0; }
.close { position: absolute; top: 16px; right: 20px; font-size: 22px; cursor: pointer; color: #9ca3af; transition: color 0.15s; }
.close:hover { color: #374151; }
.section-title { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #1f3a52; margin: 20px 0 0; padding-top: 14px; border-top: 1px solid #f1f5f9; }
.section-title:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }
.modal-content label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; margin-top: 14px; }
.field-help { display: block; font-size: 11.5px; color: #9ca3af; margin-top: 4px; }
.label-hint { color: #9ca3af; font-weight: 400; font-size: 11px; }
.modal-content input, .modal-content select { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; }
.modal-content input:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.input-error { border-color: #f87171 !important; }
.error-msg { font-size: 12px; color: #dc2626; margin-top: 4px; display: block; }
.input-wrap-modal { display: flex; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; }
.input-wrap-modal input { flex: 1; border: none !important; outline: none; padding: 10px 12px; font-size: 14px; background: transparent; box-shadow: none !important; }
.input-wrap-modal:focus-within { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.toggle-pass-modal { background: none; border: none; cursor: pointer; padding: 0 12px; color: #6b7280; font-size: 12px; font-weight: 500; }
.toggle-pass-modal:hover { color: #1f3a52; }
.pwd-hints { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.pwd-hint { font-size: 11.5px; font-weight: 500; padding: 2px 8px; border-radius: 20px; transition: background .2s, color .2s; }
.hint-ok { background: #dcfce7; color: #166534; }
.hint-no { background: #f3f4f6; color: #9ca3af; }
.modal-buttons { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; font-size: 14px; cursor: pointer; transition: background 0.15s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-submit { padding: 10px 20px; border-radius: 8px; border: none; background: #1f3a52; font-size: 14px; font-weight: 500; color: white; cursor: pointer; transition: background 0.2s, opacity 0.2s; }
.btn-submit:hover:not(:disabled) { background: #162b3c; }
.btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── ADMINS ── */
.admins-empty { padding: 28px 0; text-align: center; color: #9ca3af; font-size: 14px; }
.admins-list { display: grid; gap: 10px; }
.admin-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; }
.admin-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.admin-info .user-handle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── CONFIRM ── */
.confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; justify-content: center; align-items: center; z-index: 1100; padding: 20px; }
.confirm-box { background: white; border-radius: 14px; padding: 28px 32px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
.confirm-icon { color: #f59e0b; margin-bottom: 14px; }
.confirm-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 6px; }
.confirm-sub { font-size: 14px; color: #6b7280; margin: 0 0 14px; }
.confirm-type { margin-bottom: 8px; font-size: 13px; }
.confirm-input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 18px; }
.confirm-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
.confirm-btns { display: flex; gap: 10px; justify-content: center; }
.btn-danger { padding: 10px 20px; border-radius: 8px; border: none; background: #dc2626; color: white; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s, opacity 0.15s; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── TOAST ── */
.toast { position: fixed; bottom: 24px; right: 24px; z-index: 2000; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width: 360px; }
.toast.success { background: #16a34a; }
.toast.danger { background: #dc2626; }

/* ── TRANSICIONES ── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }

@media (max-width: 960px) {
  .page-hero { flex-direction: column; align-items: flex-start; }
  .hero-actions-wrap { width: 100%; }
  .stats { flex-direction: column; }
}
</style>