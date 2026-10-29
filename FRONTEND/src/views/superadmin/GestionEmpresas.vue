<template>
  <div class="layout">

    <main class="main">

      <!-- FONDO DECORATIVO -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="bg-grid"></div>
      </div>

      <PageHeader
        titulo="Gestión de Empresas"
        subtitulo="Administración global de empresas y sus administradores"
        :icono="ICON_EMPRESA"
      >
        <template #acciones>
          <div class="filters">
            <div class="search-box" :class="{ 'search-focus': searchFocus }">
              <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input v-model="busqueda" type="search" placeholder="Buscar por nombre o slug" aria-label="Buscar empresas por nombre o slug"
                @focus="searchFocus = true" @blur="searchFocus = false">
            </div>
            <div class="select-wrapper">
              <select v-model="filtroEstado" class="select" aria-label="Filtrar por estado">
                <option value="">Todos los estados</option>
                <option value="activa">Activas</option>
                <option value="inactiva">Inactivas</option>
              </select>
              <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
          </div>
          <button type="button" class="tx-btn tx-btn--secondary" @click="abrirCorreos">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
            </svg>
            Correos
          </button>
          <button type="button" class="tx-btn tx-btn--primary" @click="abrirCrear">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Nueva empresa
          </button>
        </template>
      </PageHeader>

      <div class="kpi-grid">
        <KpiCard
          v-for="(k, i) in kpis"
          :key="k.label"
          v-bind="k"
          :activo="filtroEstado === k.filtro"
          :cargando="cargando"
          :indice="i"
          @click="filtroEstado = k.filtro"
        />
      </div>

      <!-- TABLA -->
      <div class="table-box">
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

        <div v-else class="tx-table-scroll">
        <table>
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
            <tr v-for="(e, idx) in visibles" :key="e.Id_Empresa" class="table-row" :style="{ '--row-i': Math.min(idx, 12) }">
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
                  <button type="button" class="action-btn" @click="abrirAdmins(e)" :aria-label="`Administradores de ${e.Nombre_Empresa}`" title="Administradores">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" :d="ICON_USERS"/>
                    </svg>
                  </button>
                  <button type="button" class="action-btn edit-btn" @click="abrirEditar(e)" :aria-label="`Editar ${e.Nombre_Empresa}`" title="Editar">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                    </svg>
                  </button>
                  <button v-if="e.Estado !== 'activa'" type="button" :aria-label="`Activar ${e.Nombre_Empresa}`" class="action-btn activate-btn" :disabled="activandoId === e.Id_Empresa" @click="activar(e)" title="Activar">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                  </button>
                  <button v-if="e.Estado === 'activa'" type="button" class="action-btn delete-btn" @click="pedirDesactivar(e)" :aria-label="`Desactivar ${e.Nombre_Empresa}`" title="Desactivar">
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
        <BasePagination
          v-if="!cargando"
          v-model:pagina="pagina"
          v-model:por-pagina="porPagina"
          :total="empresasFiltradas.length"
          etiqueta="empresas"
        />
      </div>
    </main>

    <!-- MODAL: NUEVA EMPRESA + ADMINISTRADOR -->
    <BaseModal
      :open="modalCrear"
      titulo="Nueva empresa"
      descripcion="Se crea junto con su primer administrador, que podrá iniciar sesión de inmediato."
      tamano="lg"
      :cerrar-al-clic-fuera="false"
      @update:open="val => !val && cerrarCrear()"
    >
      <form id="form-empresa-crear" class="tx-form" novalidate @submit.prevent="guardarCrear">
        <fieldset class="tx-form-section">
          <legend class="tx-form-section__title">Empresa</legend>
          <div class="tx-form-grid">
            <BaseField label="Nombre de la empresa" requerido :error="vCrear.error('nombreEmpresa')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formCrear.nombreEmpresa" type="text" class="tx-input" placeholder="Ej: Textiles del Norte"
                autocomplete="organization" required @input="autoSlug" @blur="vCrear.tocar('nombreEmpresa')">
            </BaseField>
            <BaseField label="Identificador (slug)" requerido :error="vCrear.error('slug')"
              hint="Se genera solo. Minúsculas, números y guiones." v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formCrear.slug" type="text" class="tx-input" placeholder="textiles-del-norte"
                autocapitalize="none" spellcheck="false" required @input="slugManual = true" @blur="vCrear.tocar('slug')">
            </BaseField>
          </div>
        </fieldset>

        <fieldset class="tx-form-section">
          <legend class="tx-form-section__title">Administrador de la empresa</legend>
          <div class="tx-form-grid">
            <BaseField label="Nombre completo" requerido completo :error="vCrear.error('nombreCompleto')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formCrear.nombreCompleto" type="text" class="tx-input" placeholder="Ej: Laura Gómez"
                autocomplete="off" required @blur="vCrear.tocar('nombreCompleto')">
            </BaseField>
            <BaseField label="Usuario para iniciar sesión" requerido :error="vCrear.error('nombreUsuario')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formCrear.nombreUsuario" type="text" class="tx-input" placeholder="Ej: admin_textiles"
                autocapitalize="none" spellcheck="false" autocomplete="off" required @blur="vCrear.tocar('nombreUsuario')">
            </BaseField>
            <BaseField label="Teléfono" opcional :error="vCrear.error('telefono')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formCrear.telefono" type="tel" inputmode="numeric" maxlength="10" class="tx-input"
                placeholder="3001234567" autocomplete="off"
                @input="formCrear.telefono = soloDigitos(formCrear.telefono)" @blur="vCrear.tocar('telefono')">
            </BaseField>
            <BaseField label="Correo electrónico" requerido completo :error="vCrear.error('correo')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formCrear.correo" type="email" class="tx-input" placeholder="admin@empresa.com"
                autocomplete="off" required @blur="vCrear.tocar('correo')">
            </BaseField>
            <BaseField label="Contraseña" requerido completo :error="vCrear.error('contrasena')" v-slot="{ attrs }">
              <BasePassword v-bind="attrs" v-model="formCrear.contrasena" requisitos :reglas="hintsPassCrear" required
                placeholder="La usará para iniciar sesión" @blur="vCrear.tocar('contrasena')" />
            </BaseField>
          </div>
        </fieldset>
      </form>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="cerrarCrear">Cancelar</button>
        <button type="submit" form="form-empresa-crear" class="tx-btn tx-btn--primary" :disabled="guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Creando…' : 'Crear empresa' }}
        </button>
      </template>
    </BaseModal>

    <!-- MODAL: EDITAR EMPRESA -->
    <BaseModal
      :open="modalEditar"
      titulo="Editar empresa"
      :descripcion="formEditar.nombreEmpresa || ''"
      tamano="lg"
      :cerrar-al-clic-fuera="false"
      @update:open="val => !val && cerrarEditar()"
    >
      <form id="form-empresa-editar" class="tx-form" novalidate @submit.prevent="guardarEditar">
        <fieldset class="tx-form-section">
          <legend class="tx-form-section__title">Empresa</legend>
          <div class="tx-form-grid">
            <BaseField label="Nombre de la empresa" requerido :error="vEditar.error('nombreEmpresa')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formEditar.nombreEmpresa" type="text" class="tx-input" required @blur="vEditar.tocar('nombreEmpresa')">
            </BaseField>
            <BaseField label="Identificador (slug)" requerido :error="vEditar.error('slug')" v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formEditar.slug" type="text" class="tx-input" autocapitalize="none" spellcheck="false"
                required @blur="vEditar.tocar('slug')">
            </BaseField>
          </div>
        </fieldset>

        <fieldset class="tx-form-section">
          <legend class="tx-form-section__title">Correos a clientes y operarios</legend>
          <div class="tx-form-grid">
            <BaseField label="Nombre comercial" opcional :error="vEditar.error('nombreComercial')"
              hint="Lo ven los destinatarios como remitente y en el asunto." v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formEditar.nombreComercial" type="text" maxlength="80" class="tx-input"
                placeholder="Vacío = nombre de la empresa" @blur="vEditar.tocar('nombreComercial')">
            </BaseField>
            <BaseField label="Correo de respuestas" opcional :error="vEditar.error('emailNotificaciones')"
              hint="Aquí llegan las respuestas a los correos automáticos." v-slot="{ attrs }">
              <input v-bind="attrs" v-model="formEditar.emailNotificaciones" type="email" maxlength="160" class="tx-input"
                placeholder="contacto@empresa.com" @blur="vEditar.tocar('emailNotificaciones')">
            </BaseField>
          </div>
        </fieldset>
      </form>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="cerrarEditar">Cancelar</button>
        <button type="submit" form="form-empresa-editar" class="tx-btn tx-btn--primary" :disabled="guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </template>
    </BaseModal>

    <!-- PANEL: ADMINISTRADORES DE LA EMPRESA -->
    <BaseDrawer
      :open="modalAdmins.visible"
      titulo="Administradores"
      :descripcion="modalAdmins.empresa?.Nombre_Empresa || ''"
      ancho="lg"
      @update:open="val => !val && cerrarAdmins()"
    >
      <div v-if="modalAdmins.cargando" class="admins-list" aria-busy="true">
        <div v-for="n in 2" :key="n" class="admin-row">
          <span class="tx-skel tx-skel--circle"></span>
          <span class="admin-info"><span class="tx-skel tx-skel--line" style="width: 40%"></span><span class="tx-skel tx-skel--line" style="width: 70%"></span></span>
        </div>
      </div>
      <EmptyState
        v-else-if="modalAdmins.lista.length === 0"
        titulo="Sin administradores"
        descripcion="Esta empresa todavía no tiene administradores."
        compacto
      />
      <ul v-else class="admins-list">
        <li v-for="a in modalAdmins.lista" :key="a.Id_Usuario" class="admin-row">
          <div class="avatar" aria-hidden="true">{{ iniciales(a.Nombre_Completo) }}</div>
          <div class="admin-info">
            <span class="user-name">{{ a.Nombre_Completo }}</span>
            <span class="user-handle">@{{ a.Nombre_Usuario }} · {{ a.Correo }}</span>
            <span class="user-handle">{{ a.Telefono || 'Sin teléfono' }}</span>
          </div>
          <span class="badge-estado" :class="a.Estado === 'activo' ? 'activa' : 'inactiva'">{{ a.Estado === 'activo' ? 'Activo' : 'Inactivo' }}</span>
          <div class="actions">
            <button type="button" class="action-btn edit-btn" @click="abrirEditarAdmin(a)" :aria-label="`Editar a ${a.Nombre_Completo}`" title="Editar">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true" style="display:block"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
            </button>
            <button v-if="a.Estado !== 'activo'" type="button" :aria-label="`Activar a ${a.Nombre_Completo}`" class="action-btn activate-btn" :disabled="activandoAdminId === a.Id_Usuario" @click="activarAdmin(a)" title="Activar">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true" style="display:block"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
            </button>
            <button v-if="a.Estado === 'activo'" type="button" class="action-btn delete-btn" @click="pedirInactivarAdmin(a)" :aria-label="`Desactivar a ${a.Nombre_Completo}`" title="Desactivar">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true" style="display:block"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            </button>
          </div>
        </li>
      </ul>
    </BaseDrawer>

    <!-- MODAL: EDITAR ADMINISTRADOR (se abre encima del panel) -->
    <BaseModal
      :open="modalAdmin"
      titulo="Editar administrador"
      :descripcion="modalAdmins.empresa?.Nombre_Empresa || ''"
      tamano="lg"
      :cerrar-al-clic-fuera="false"
      @update:open="val => !val && cerrarEditarAdmin()"
    >
      <form id="form-admin-editar" class="tx-form" novalidate @submit.prevent="guardarAdmin">
        <div class="tx-form-grid">
          <BaseField label="Nombre completo" requerido completo :error="vAdmin.error('nombreCompleto')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="formAdmin.nombreCompleto" type="text" class="tx-input" required @blur="vAdmin.tocar('nombreCompleto')">
          </BaseField>
          <BaseField label="Usuario para iniciar sesión" requerido :error="vAdmin.error('nombreUsuario')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="formAdmin.nombreUsuario" type="text" class="tx-input" autocapitalize="none" spellcheck="false"
              required @blur="vAdmin.tocar('nombreUsuario')">
          </BaseField>
          <BaseField label="Teléfono" opcional :error="vAdmin.error('telefono')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="formAdmin.telefono" type="tel" inputmode="numeric" maxlength="10" class="tx-input"
              @input="formAdmin.telefono = soloDigitos(formAdmin.telefono)" @blur="vAdmin.tocar('telefono')">
          </BaseField>
          <BaseField label="Correo electrónico" requerido completo :error="vAdmin.error('correo')" v-slot="{ attrs }">
            <input v-bind="attrs" v-model="formAdmin.correo" type="email" class="tx-input" required @blur="vAdmin.tocar('correo')">
          </BaseField>
          <BaseField label="Nueva contraseña" opcional completo :error="vAdmin.error('contrasena')"
            hint="Déjala vacía para no cambiarla." v-slot="{ attrs }">
            <BasePassword v-bind="attrs" v-model="formAdmin.contrasena" requisitos :reglas="hintsPassAdmin"
              @blur="vAdmin.tocar('contrasena')" />
          </BaseField>
        </div>
      </form>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="cerrarEditarAdmin">Cancelar</button>
        <button type="submit" form="form-admin-editar" class="tx-btn tx-btn--primary" :disabled="guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </template>
    </BaseModal>

    <!-- MODAL: ESTADÍSTICAS DE CORREO -->
    <BaseModal
      :open="modalCorreos.visible"
      titulo="Correos enviados"
      descripcion="Envíos de SendGrid y por empresa en el día elegido."
      tamano="lg"
      @update:open="val => !val && cerrarCorreos()"
    >
      <div class="correos-fecha">
        <BaseField label="Día" v-slot="{ attrs }">
          <input v-bind="attrs" v-model="modalCorreos.fecha" type="date" class="tx-input" @change="cargarCorreos">
        </BaseField>
      </div>

      <div v-if="modalCorreos.cargando" class="correos-grid" aria-busy="true">
        <span v-for="n in 5" :key="n" class="tx-skel correos-skel"></span>
      </div>
      <template v-else-if="modalCorreos.datos">
        <h3 class="correos-sub">Cuenta completa de SendGrid</h3>
        <div v-if="modalCorreos.datos.global" class="correos-grid">
          <div class="correos-card"><span>Enviados</span><strong>{{ modalCorreos.datos.global.enviados }}</strong></div>
          <div class="correos-card"><span>Entregados</span><strong>{{ modalCorreos.datos.global.entregados }}</strong></div>
          <div class="correos-card"><span>Abiertos</span><strong>{{ modalCorreos.datos.global.abiertos }}</strong></div>
          <div class="correos-card"><span>Rebotes</span><strong>{{ modalCorreos.datos.global.rebotes }}</strong></div>
          <div class="correos-card"><span>Spam</span><strong>{{ modalCorreos.datos.global.spam }}</strong></div>
        </div>
        <p v-else class="correos-aviso">{{ modalCorreos.datos.errorGlobal || 'Sin datos de SendGrid para este día.' }}</p>

        <h3 class="correos-sub">Por empresa</h3>
        <table class="correos-tabla">
          <thead><tr><th scope="col">Empresa</th><th scope="col">Enviados</th><th scope="col">Con error</th></tr></thead>
          <tbody>
            <tr v-for="x in modalCorreos.datos.empresas" :key="x.Id_Empresa">
              <td>{{ x.Nombre_Empresa }}</td><td>{{ x.enviados }}</td><td>{{ x.errores }}</td>
            </tr>
          </tbody>
        </table>
        <p class="correos-nota">Los envíos por empresa se cuentan desde que se activó el registro; los de SendGrid abarcan toda la cuenta.</p>
      </template>
      <EmptyState v-else titulo="No pudimos cargar las estadísticas" descripcion="Revisa tu conexión e inténtalo de nuevo." icono="error" compacto>
        <button type="button" class="tx-btn tx-btn--secondary" @click="cargarCorreos">Reintentar</button>
      </EmptyState>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" @click="cerrarCorreos">Cerrar</button>
      </template>
    </BaseModal>

    <!-- CONFIRMAR: DESACTIVAR EMPRESA (hay que escribir el nombre) -->
    <BaseModal
      :open="confirmEmpresa.visible"
      :titulo="`¿Desactivar «${confirmEmpresa.empresa?.Nombre_Empresa || ''}»?`"
      descripcion="Todos sus usuarios dejarán de poder iniciar sesión. Podrás volver a activarla después."
      tamano="sm"
      rol="alertdialog"
      @update:open="val => !val && (confirmEmpresa.visible = false)"
    >
      <form id="form-desactivar-empresa" novalidate @submit.prevent="confirmarDesactivar">
        <BaseField label="Escribe el nombre de la empresa para confirmar" v-slot="{ attrs }">
          <input v-bind="attrs" v-model="confirmEmpresa.texto" class="tx-input" type="text" autocomplete="off"
            :placeholder="confirmEmpresa.empresa?.Nombre_Empresa">
        </BaseField>
      </form>
      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="confirmEmpresa.visible = false">Cancelar</button>
        <button type="submit" form="form-desactivar-empresa" class="tx-btn tx-btn--danger" :disabled="!nombreConfirmado || guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Desactivando…' : 'Desactivar empresa' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseDrawer from '../../components/base/BaseDrawer.vue'
import BaseField from '../../components/base/BaseField.vue'
import BasePassword from '../../components/base/BasePassword.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import { useValidacion } from '../../composables/useValidacion'
import { useConfirm } from '../../composables/useConfirm'
import BasePagination from '../../components/base/BasePagination.vue'
import { usePagination } from '../../composables/usePagination'
import { useToast } from '../../composables/useToast'
import { ref, computed, onMounted, watch } from 'vue'
import {
  getEmpresas, crearEmpresa, actualizarEmpresa, desactivarEmpresa, activarEmpresa,
  getEstadisticasCorreos,
  getAdministradoresEmpresa, actualizarAdministradorEmpresa, inactivarAdministradorEmpresa, activarAdministradorEmpresa,
} from '../../services/api.js'

const ICON_EMPRESA = 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21'
const ICON_USERS = 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'

// ── ESTADO GENERAL ──
const cargando    = ref(true)
const guardando   = ref(false)
const searchFocus = ref(false)
const busqueda    = ref('')
const filtroEstado = ref('')
const empresas    = ref([])
const toast       = useToast()

const confirmar = useConfirm()
function mostrarToast(msg, type = 'success') {
  if (type === 'danger' || type === 'error') toast.error(msg)
  else toast.success(msg)
}

// ── HELPERS ──
function iniciales(nombre) {
  return String(nombre || '?').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
}
// La BD guarda timestamps en UTC (sin zona). Se muestran siempre en hora de Bogotá.
function formatearFecha(f) {
  if (!f) return '—'
  const txt = String(f)
  const iso = /(Z|[+-]\d{2}:?\d{2})$/.test(txt) ? txt : txt.replace(' ', 'T') + 'Z'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
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

const { pagina, porPagina, visibles, reiniciar } = usePagination(empresasFiltradas, { porPagina: 10, clave: 'empresas' })
watch([busqueda, filtroEstado], reiniciar)
// Las tarjetas filtran la tabla por estado
const kpis = computed(() => [
  { label: 'Total empresas', valor: empresas.value.length, icono: ICON_EMPRESA, tono: 'brand', filtro: '' },
  { label: 'Activas',   valor: empresas.value.filter(e => e.Estado === 'activa').length, icono: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', tono: 'success', filtro: 'activa' },
  { label: 'Inactivas', valor: empresas.value.filter(e => e.Estado !== 'activa').length, icono: 'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636', tono: 'danger', filtro: 'inactiva' },
])

async function cargarEmpresas() {
  cargando.value = true
  try {
    empresas.value = await getEmpresas()
  } catch (e) {
    mostrarToast(e.message || 'No se pudieron cargar las empresas. Revisa tu conexión e inténtalo de nuevo.', 'danger')
  } finally {
    cargando.value = false
  }
}

onMounted(cargarEmpresas)

// ── CREAR EMPRESA + ADMIN ──
const modalCrear = ref(false)
const slugManual = ref(false)
const formVacioCrear = () => ({ nombreEmpresa: '', slug: '', nombreCompleto: '', nombreUsuario: '', correo: '', telefono: '', contrasena: '' })
const formCrear = ref(formVacioCrear())

const erroresCrear = computed(() => ({
  ...validarEmpresa(formCrear.value.nombreEmpresa, formCrear.value.slug),
  ...validarPersona(formCrear.value, { passwordObligatoria: true }),
}))
const hintsPassCrear = computed(() => reglasPassword(formCrear.value.contrasena))
const vCrear = useValidacion(erroresCrear)

function autoSlug() {
  if (!slugManual.value) formCrear.value.slug = slugify(formCrear.value.nombreEmpresa)
}
function abrirCrear() {
  formCrear.value = formVacioCrear()
  vCrear.reiniciar()
  slugManual.value = false
  modalCrear.value = true
}
function cerrarCrear() { modalCrear.value = false }

async function guardarCrear() {
  if (!(await vCrear.validar())) return
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
    mostrarToast('Empresa creada con su administrador.')
    await cargarEmpresas()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo crear la empresa. Revisa los datos e inténtalo de nuevo.', 'danger')
  } finally {
    guardando.value = false
  }
}

// ── EDITAR EMPRESA ──
const modalEditar = ref(false)
const idEditar = ref(null)
const formEditar = ref({ nombreEmpresa: '', slug: '', nombreComercial: '', emailNotificaciones: '' })
const erroresEditar = computed(() => {
  const f = formEditar.value
  const e = validarEmpresa(f.nombreEmpresa, f.slug)
  if (f.nombreComercial && f.nombreComercial.trim().length > 80) e.nombreComercial = 'Máximo 80 caracteres.'
  if (f.emailNotificaciones && !RE_CORREO.test(f.emailNotificaciones.trim())) e.emailNotificaciones = 'El correo no tiene un formato válido.'
  return e
})
const vEditar = useValidacion(erroresEditar)

function abrirEditar(e) {
  idEditar.value = e.Id_Empresa
  formEditar.value = {
    nombreEmpresa: e.Nombre_Empresa,
    slug: e.Slug,
    nombreComercial: e.Nombre_Comercial || '',
    emailNotificaciones: e.Email_Notificaciones || '',
  }
  vEditar.reiniciar()
  modalEditar.value = true
}
function cerrarEditar() { modalEditar.value = false }

async function guardarEditar() {
  if (!(await vEditar.validar())) return
  guardando.value = true
  try {
    await actualizarEmpresa(idEditar.value, {
      Nombre_Empresa: formEditar.value.nombreEmpresa.trim(),
      Slug: formEditar.value.slug.trim().toLowerCase(),
      Nombre_Comercial: formEditar.value.nombreComercial.trim(),
      Email_Notificaciones: formEditar.value.emailNotificaciones.trim(),
    })
    modalEditar.value = false
    mostrarToast('Empresa actualizada.')
    await cargarEmpresas()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo actualizar la empresa. Inténtalo de nuevo.', 'danger')
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
    mostrarToast('Empresa desactivada.')
    await cargarEmpresas()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo desactivar la empresa. Inténtalo de nuevo.', 'danger')
  } finally {
    guardando.value = false
  }
}

const activandoId = ref(null)
async function activar(e) {
  activandoId.value = e.Id_Empresa
  try {
    await activarEmpresa(e.Id_Empresa)
    mostrarToast('Empresa activada.')
    await cargarEmpresas()
  } catch (err) {
    mostrarToast(err.message || 'No se pudo activar la empresa. Inténtalo de nuevo.', 'danger')
  } finally {
    activandoId.value = null
  }
}

// ── ADMINISTRADORES DE UNA EMPRESA ──
// ── ESTADÍSTICAS DE CORREO ──
const modalCorreos = ref({ visible: false, fecha: '', cargando: false, datos: null })

function hoyBogota() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}
async function cargarCorreos() {
  modalCorreos.value.cargando = true
  try {
    modalCorreos.value.datos = await getEstadisticasCorreos(modalCorreos.value.fecha || undefined)
  } catch (e) {
    modalCorreos.value.datos = null
    mostrarToast(e.message || 'No se pudieron cargar las estadísticas. Inténtalo de nuevo.', 'error')
  } finally {
    modalCorreos.value.cargando = false
  }
}
function abrirCorreos() {
  modalCorreos.value = { visible: true, fecha: hoyBogota(), cargando: false, datos: null }
  cargarCorreos()
}
function cerrarCorreos() { modalCorreos.value.visible = false }

const modalAdmins = ref({ visible: false, empresa: null, lista: [], cargando: false })

async function cargarAdmins() {
  const emp = modalAdmins.value.empresa
  if (!emp) return
  modalAdmins.value.cargando = true
  try {
    modalAdmins.value.lista = await getAdministradoresEmpresa(emp.Id_Empresa)
  } catch (e) {
    mostrarToast(e.message || 'No se pudieron cargar los administradores. Inténtalo de nuevo.', 'danger')
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
const idAdmin = ref(null)
const formAdmin = ref({ nombreCompleto: '', nombreUsuario: '', correo: '', telefono: '', contrasena: '' })
const erroresAdmin = computed(() => validarPersona(formAdmin.value, { passwordObligatoria: false }))
const hintsPassAdmin = computed(() => reglasPassword(formAdmin.value.contrasena))
const vAdmin = useValidacion(erroresAdmin)

function abrirEditarAdmin(a) {
  idAdmin.value = a.Id_Usuario
  formAdmin.value = {
    nombreCompleto: a.Nombre_Completo || '',
    nombreUsuario: a.Nombre_Usuario || '',
    correo: a.Correo || '',
    telefono: a.Telefono || '',
    contrasena: '',
  }
  vAdmin.reiniciar()
  modalAdmin.value = true
}
function cerrarEditarAdmin() { modalAdmin.value = false }

async function guardarAdmin() {
  if (!(await vAdmin.validar())) return
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
    mostrarToast('Administrador actualizado.')
    await cargarAdmins()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo actualizar el administrador. Inténtalo de nuevo.', 'danger')
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
    mostrarToast('Administrador activado.')
    await cargarAdmins()
  } catch (err) {
    mostrarToast(err.message || 'No se pudo activar el administrador. Inténtalo de nuevo.', 'danger')
  } finally {
    activandoAdminId.value = null
  }
}

// desactivar administrador
async function pedirInactivarAdmin(a) {
  const ok = await confirmar({
    titulo: `¿Desactivar a ${a.Nombre_Completo}?`,
    mensaje: 'Ya no podrá iniciar sesión. Puedes volver a activarlo cuando quieras.',
    textoConfirmar: 'Desactivar administrador',
    tono: 'danger',
  })
  if (!ok) return
  guardando.value = true
  try {
    await inactivarAdministradorEmpresa(modalAdmins.value.empresa.Id_Empresa, a.Id_Usuario)
    mostrarToast('Administrador desactivado.')
    await cargarAdmins()
  } catch (e) {
    mostrarToast(e.message || 'No se pudo desactivar el administrador. Inténtalo de nuevo.', 'danger')
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

.filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-box { display: flex; align-items: center; gap: 8px; height: var(--control-height); padding: 0 12px; background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); transition: border-color var(--duration-fast), box-shadow var(--duration-fast); width: 240px; }
.search-box.search-focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.search-ico { width: 16px; height: 16px; color: var(--color-text-muted); flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: transparent; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.select { height: var(--control-height); padding: 0 32px 0 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border-strong); font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: var(--color-surface); appearance: none; -webkit-appearance: none; outline: none; cursor: pointer; transition: border-color var(--duration-fast), box-shadow var(--duration-fast); }
.select:focus { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: var(--color-text-muted); pointer-events: none; }

/* ── TABLA ── */
.table-box { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-xs); margin-bottom: var(--space-6); overflow: hidden; animation: tableIn var(--duration-slow) var(--ease-out) 120ms both; }
@keyframes tableIn { from { opacity: 0; transform: translateY(var(--motion-shift-md)); } to { opacity: 1; transform: none; } }
.table-header-bar { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }
table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; padding: 13px 18px; white-space: nowrap; }
td { padding: 14px 18px; font-size: 14px; border-top: 1px solid #f1f5f9; }
.table-row { transition: background 0.18s; animation: rowSlideIn var(--duration-base) var(--ease-out) both; animation-delay: calc(var(--row-i, 0) * 25ms); }
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

.empty-state { text-align: center; padding: 48px 20px; color: var(--color-text-muted); }
.empty-state svg { margin: 0 auto 12px; display: block; opacity: 0.4; }
.empty-state p { font-size: 14px; margin: 0; }

/* ── MODALES ── */

/* ── ADMINS ── */
.admins-list { display: grid; gap: 10px; }
.admin-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; }
.admin-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.admin-info .user-handle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── TRANSICIONES ── */


/* ── CORREOS ── */
.correos-fecha { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.correos-fecha label { font-size: 13px; color: #6b7280; }
.correos-fecha input { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.correos-sub { font-size: 14px; margin: 16px 0 8px; color: #1f3a52; }
.correos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
.correos-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.correos-card span { font-size: 12px; color: #6b7280; }
.correos-card strong { font-size: 22px; color: #111827; }
.correos-aviso, .correos-nota { font-size: 12px; color: var(--color-text-muted); margin: 8px 0 0; }
.correos-tabla { width: 100%; border-collapse: collapse; font-size: 14px; }
.correos-tabla th, .correos-tabla td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f0f1f3; }
.correos-tabla th { font-size: 12px; color: #6b7280; text-transform: uppercase; }
</style>