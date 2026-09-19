<template>
  <div class="layout">
    <AppSidebar rol="admin" />

    <main class="main">

      <!-- PARTÍCULAS DE FONDO DECORATIVAS -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- TOAST -->
      <Transition name="toast">
        <div v-if="toast.visible" class="toast" :class="toast.type">
          <svg v-if="toast.type === 'success'" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          </svg>
          <svg v-else-if="toast.type === 'danger'" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
          </svg>
          <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
          </svg>
          {{ toast.msg }}
        </div>
      </Transition>

      <!-- CONFIRM DIALOG -->
      <Transition name="toast">
        <div v-if="confirmDialog.visible" class="confirm-overlay" @click.self="confirmDialog.visible = false">
          <div class="confirm-box">
            <div class="confirm-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
              </svg>
            </div>
            <p class="confirm-title">¿Eliminar usuario?</p>
            <p class="confirm-sub">Esta acción no se puede deshacer.</p>
            <div class="confirm-btns">
              <button class="btn-cancel" @click="confirmDialog.visible = false">Cancelar</button>
              <button class="btn-danger" @click="confirmarEliminar">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': animVisible }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Gestión de Usuarios'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: animVisible ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Administración y control de accesos</p>
          </div>
        </div>
        <div class="hero-actions-wrap">
          <div class="filters">
            <div class="search-box" :class="{ 'search-focus': searchFocus }">
              <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input
                v-model="busqueda"
                type="text"
                placeholder="Buscar usuarios..."
                @focus="searchFocus = true"
                @blur="searchFocus = false"
              >
            </div>
            <div class="select-wrapper">
              <select v-model="filtroRol" class="select">
                <option value="">Todos los roles</option>
                <option value="administrador">Administrador</option>
                <option value="operador">Operario</option>
                <option value="cliente">Cliente</option>
              </select>
              <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
          </div>
          <button class="btn" @click="abrirModal(null)">
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- STATS -->
      <div v-if="cargando" class="stats">
        <div v-for="i in 4" :key="i" class="stat-card skeleton-card">
          <div class="skeleton-line skeleton-sm"></div>
          <div class="skeleton-line skeleton-lg"></div>
        </div>
      </div>
      <div v-else class="stats" :class="{ 'stats-visible': animVisible }">
        <div
          v-for="(s, i) in statsCards"
          :key="i"
          class="stat-card"
          :style="{ transitionDelay: animVisible ? `${i * 80}ms` : '0ms' }"
        >
          <div class="stat-accent" :style="{ background: s.accentColor }"></div>
          <div class="stat-icon-bg" :style="{ color: s.accentColor }">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" :d="s.iconPath"/>
            </svg>
          </div>
          <h3>{{ s.label }}</h3>
          <p :style="{ color: s.accentColor }">{{ s.display }}</p>
        </div>
      </div>

      <!-- CARD PERFIL DEL ADMIN LOGUEADO -->
      <div class="admin-profile-card" :class="{ 'card-visible': animVisible }" style="transition-delay: 200ms">

        <!-- Engranajes decorativos -->
        <div class="apc-gear gear-big" :class="{ 'gear-spin': animVisible }">
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.07)" stroke-width=".8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
          </svg>
        </div>
        <div class="apc-gear gear-small" :class="{ 'gear-spin-rev': animVisible }">
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.1)" stroke-width=".8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
          </svg>
        </div>

        <!-- Cabecera: avatar + nombre + botón editar -->
        <div class="pc-header">
          <div class="pc-avatar-wrap" :class="{ 'avatar-in': animVisible }">
            <div class="pc-avatar" :style="{ background: avatarBg(adminPerfil.nombre), color: avatarColor(adminPerfil.nombre) }">
              {{ adminPerfil.iniciales }}
            </div>
          </div>
          <div class="pc-identity">
            <div class="pc-name">{{ adminPerfil.nombre }}</div>
          </div>
          <button class="pc-edit-btn" @click="abrirModalAdmin">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
            </svg>
            Editar mi perfil
          </button>
        </div>

        <!-- Divisor -->
        <div class="pc-divider"></div>

        <!-- Grid de contacto -->
        <div class="pc-contact-grid">
          <div class="pc-contact-item" v-for="(item, i) in adminContactItems" :key="item.label"
            :style="{ animationDelay: animVisible ? `${200 + i * 65}ms` : '9999s' }">
            <div class="pc-contact-icon">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" style="display:block">
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon"/>
              </svg>
            </div>
            <div class="pc-contact-info">
              <span class="pc-contact-label">{{ item.label }}</span>
              <span class="pc-contact-value" :class="{ 'pc-contact-empty': !item.raw }">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA -->
      <div class="table-box" :class="{ 'box-visible': animVisible }" style="transition-delay: 320ms">
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

        <table v-else>
          <thead>
            <tr>
              <th class="th-sortable" @click="sortBy('nombre')">
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
              <th class="th-sortable" @click="sortBy('rol')">
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
              <th class="th-sortable" @click="sortBy('fechaRegistro')">
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
                v-for="(u, idx) in usuariosOrdenados"
                :key="u.id"
                class="table-row"
                :class="{ 'row-flash': u.flash, 'row-eliminating': u.eliminating }"
                :style="{ animationDelay: `${idx * 40}ms` }"
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
                    <button class="action-btn edit-btn" @click="abrirModal(u)" title="Editar">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                      </svg>
                    </button>
                    <button class="action-btn delete-btn" @click="pedirEliminar(u.id)" title="Eliminar">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </TransitionGroup>
            <tr v-if="usuariosOrdenados.length === 0">
              <td colspan="5" class="empty-state">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                </svg>
                <p>No se encontraron usuarios</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- MODAL CREAR/EDITAR USUARIO -->
    <Transition name="modal">
      <div v-if="modalVisible" class="modal" @click.self="cerrarModal">
        <div class="modal-content">
          <h2>{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
          <span class="close" @click="cerrarModal">×</span>

          <label>Nombre Completo</label>
          <input v-model="form.nombre" type="text" placeholder="Nombre completo"
            :class="{ 'input-error': errores.nombre && formTouched }" @blur="formTouched = true"
            @keypress="soloLetras">
          <span v-if="errores.nombre && formTouched" class="error-msg">{{ errores.nombre }}</span>

          <label>Nombre de Usuario <span style="color:#9ca3af;font-weight:400;font-size:11px">(para iniciar sesión)</span></label>
          <input v-model="form.nombreUsuario" type="text" placeholder="Ej: juan.perez o juanito123"
            :class="{ 'input-error': errores.nombreUsuario && formTouched }" @blur="formTouched = true">
          <span v-if="errores.nombreUsuario && formTouched" class="error-msg">{{ errores.nombreUsuario }}</span>

          <label>Correo Electrónico</label>
          <input v-model="form.email" type="email" placeholder="correo@ejemplo.com"
            :class="{ 'input-error': errores.email && formTouched }" @blur="formTouched = true">
          <span v-if="errores.email && formTouched" class="error-msg">{{ errores.email }}</span>

          <label>Teléfono</label>
          <input v-model="form.telefono" type="tel" inputmode="numeric" maxlength="10" placeholder="3001234567"
            :class="{ 'input-error': errores.telefono && formTouched }"
            @keypress="soloNumeros" @input="limitarTelefono" @blur="formTouched = true">
          <span v-if="errores.telefono && formTouched" class="error-msg">{{ errores.telefono }}</span>

          <label>Rol</label>
          <select v-model="form.Id_Rol" :class="{ 'input-error': errores.Id_Rol && formTouched }">
            <option value="" disabled>Selecciona un rol</option>
            <!-- ✅ CORRECCIÓN: se usa todosLosRoles para permitir crear administradores -->
            <option v-for="r in todosLosRoles" :key="r.Id_Rol" :value="r.Id_Rol">{{ r.Nombre_Rol }}</option>
          </select>
          <span v-if="errores.Id_Rol && formTouched" class="error-msg">{{ errores.Id_Rol }}</span>

          <template v-if="!editando">
            <label>Contraseña</label>
            <div class="input-wrap-modal">
              <input v-model="form.contrasena" :type="mostrarPassUsuario ? 'text' : 'password'" placeholder="Contraseña del usuario"
                :class="{ 'input-error': errores.contrasena && formTouched }" @blur="formTouched = true">
              <button class="toggle-pass-modal" @click="mostrarPassUsuario = !mostrarPassUsuario" type="button">
                <svg v-if="!mostrarPassUsuario" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"/></svg>
                <svg v-else fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
              </button>
            </div>
            <div v-if="form.contrasena" class="pwd-hints">
              <span v-for="h in passwordHintsUsuario" :key="h.label" class="pwd-hint" :class="h.ok ? 'hint-ok' : 'hint-no'">
                {{ h.ok ? '✓' : '✗' }} {{ h.label }}
              </span>
            </div>
            <span v-if="errores.contrasena && formTouched" class="error-msg">{{ errores.contrasena }}</span>
          </template>

          <div v-if="form.nombre" class="user-preview">
            <div class="avatar" :style="{ background: avatarBg(form.nombre), color: avatarColor(form.nombre) }">
              {{ form.nombre.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase() }}
            </div>
            <div>
              <div class="user-name">{{ form.nombre }}</div>
              <div class="user-handle" v-if="form.nombreUsuario">@{{ form.nombreUsuario }}</div>
              <div class="user-handle">{{ form.email || 'correo@ejemplo.com' }}</div>
            </div>
          </div>

          <div class="modal-buttons">
            <button class="btn-cancel" @click="cerrarModal">Cancelar</button>
            <button class="btn-submit" @click="guardarUsuario" :disabled="guardando || (tieneErrores && formTouched)">
              {{ guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Usuario' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL EDITAR PERFIL ADMIN -->
    <Transition name="modal">
      <div v-if="modalAdminVisible" class="modal" @click.self="cerrarModalAdmin">
        <div class="modal-content">
          <h2>Editar mi Perfil</h2>
          <span class="close" @click="cerrarModalAdmin">×</span>

          <label>Nombre Completo</label>
          <input v-model="formAdmin.nombre" type="text" placeholder="Nombre completo" @keypress="soloLetras">

          <label>Nombre de Usuario <span style="color:#9ca3af;font-weight:400;font-size:12px">(para iniciar sesión)</span></label>
          <input v-model="formAdmin.nombreUsuario" type="text" placeholder="Ej: juan.perez">

          <label>Correo Electrónico</label>
          <input v-model="formAdmin.email" type="email" placeholder="correo@ejemplo.com">

          <label>Teléfono</label>
          <input v-model="formAdmin.telefono" type="tel" placeholder="+57 300 000 0000">

          <label>Nueva Contraseña <span style="color:#9ca3af;font-weight:400;font-size:12px">(dejar vacío para no cambiar)</span></label>
          <div class="input-wrap-modal">
            <input v-model="formAdmin.contrasena" :type="mostrarPassAdmin ? 'text' : 'password'" placeholder="••••••••">
            <button class="toggle-pass-modal" @click="mostrarPassAdmin = !mostrarPassAdmin" type="button">
              <svg v-if="!mostrarPassAdmin" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"/></svg>
              <svg v-else fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
            </button>
          </div>
          <div v-if="formAdmin.contrasena" class="pwd-hints">
            <span v-for="h in passwordHintsAdmin" :key="h.label" class="pwd-hint" :class="h.ok ? 'hint-ok' : 'hint-no'">
              {{ h.ok ? '✓' : '✗' }} {{ h.label }}
            </span>
          </div>

          <div class="modal-buttons">
            <button class="btn-cancel" @click="cerrarModalAdmin">Cancelar</button>
            <button class="btn-submit" @click="guardarPerfilAdmin" :disabled="guardandoAdmin">
              {{ guardandoAdmin ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore } from '../../stores/auth'
import {
  getUsuarios, getRoles, crearUsuario, actualizarUsuario, getUsuario
} from '../../services/api.js'

const auth = useAuthStore()

// ── ESTADO ──
const animVisible = ref(false)
const cargando    = ref(true)
const guardando   = ref(false)
const guardandoAdmin = ref(false)
const searchFocus = ref(false)
const busqueda    = ref('')
const filtroRol   = ref('')
const modalVisible      = ref(false)
const modalAdminVisible = ref(false)
const editando    = ref(false)
const formTouched = ref(false)
const roles       = ref([])
const usuarios    = ref([])

const confirmDialog = ref({ visible: false, id: null })
const toast         = ref({ visible: false, msg: '', type: 'success' })

// Perfil del admin logueado
const adminPerfil = ref({ nombre: '', email: '', telefono: '', iniciales: '' })

const adminContactItems = computed(() => [
  { label: 'Email',    value: adminPerfil.value.email         || '—', raw: adminPerfil.value.email,         icon: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75' },
  { label: 'Teléfono', value: adminPerfil.value.telefono      || '—', raw: adminPerfil.value.telefono,      icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z' },
  { label: 'Usuario',  value: adminPerfil.value.nombreUsuario  || '—', raw: adminPerfil.value.nombreUsuario,  icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0' },
])
const formAdmin   = ref({ nombre: '', nombreUsuario: '', email: '', telefono: '', contrasena: '' })

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

    // Perfil del admin logueado
    if (auth.idUsuario) {
      const adminData = await getUsuario(auth.idUsuario)
      const nombre = adminData.Nombre_Completo || adminData.Nombre_Usuario || ''
      adminPerfil.value = {
        nombre,
        email: adminData.Correo || '',
        telefono: adminData.Telefono || '',
        iniciales: nombre.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase(),
        Id_Rol: adminData.Id_Rol,
        nombreUsuario: adminData.Nombre_Usuario || '',
      }
    }
  } catch (e) {
    mostrarToast('Error al cargar usuarios', 'danger')
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargarDatos()
  setTimeout(() => animVisible.value = true, 50)
  setTimeout(() => animateStats(), 200)
})

// ── TOAST ──
function mostrarToast(msg, type = 'success') {
  toast.value = { visible: true, msg, type }
  setTimeout(() => toast.value.visible = false, 2800)
}

// ── CONFIRM / ELIMINAR ──
function pedirEliminar(id) { confirmDialog.value = { visible: true, id } }

async function confirmarEliminar() {
  const id = confirmDialog.value.id
  confirmDialog.value.visible = false
  const u = usuarios.value.find(u => u.id === id)
  if (!u) return
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
      animateStats()
      mostrarToast('Usuario desactivado', 'danger')
    }, 350)
  } catch (e) {
    u.eliminating = false
    mostrarToast(e.message || 'Error al desactivar', 'danger')
  }
}

// ── CONTADORES ANIMADOS ──
const statsDisplay = ref({ total: 0, administradores: 0, operarios: 0, clientes: 0 })
function animateCount(key, target) {
  let val = 0
  const steps = 80; const duration = 2000
  const intervalMs = Math.round(duration / steps)
  const step = Math.max(0.1, target / steps)
  const iv = setInterval(() => {
    val += step
    if (val >= target) { statsDisplay.value[key] = target; clearInterval(iv) }
    else statsDisplay.value[key] = Math.floor(val)
  }, intervalMs)
}
function animateStats() {
  animateCount('total',    usuarios.value.length)
  animateCount('administradores', usuarios.value.filter(u => u.rol === 'administrador').length)
  animateCount('operarios',usuarios.value.filter(u => u.rol === 'operador').length)
  animateCount('clientes', usuarios.value.filter(u => u.rol === 'cliente').length)
}

const ICON_USERS  = 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'
const ICON_ADMIN  = 'M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z'
const ICON_WRENCH = 'M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z'
const ICON_CLIENT = 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'

const statsCards = computed(() => [
  { label: 'Total Usuarios',  display: statsDisplay.value.total,          accentColor: '#1f3a52', iconPath: ICON_USERS  },
  { label: 'Administradores', display: statsDisplay.value.administradores,accentColor: '#16a34a', iconPath: ICON_ADMIN  },
  { label: 'Operarios',       display: statsDisplay.value.operarios,      accentColor: '#2563eb', iconPath: ICON_WRENCH },
  { label: 'Clientes',        display: statsDisplay.value.clientes,       accentColor: '#d97706', iconPath: ICON_CLIENT },
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

function buildHints(pwd) {
  return [
    { label: 'Mínimo 8 caracteres',        ok: pwd.length >= 8 },
    { label: 'Una letra mayúscula',         ok: /[A-Z]/.test(pwd) },
    { label: 'Un número',                   ok: /[0-9]/.test(pwd) },
    { label: 'Un carácter especial (@#$…)', ok: /[^A-Za-z0-9]/.test(pwd) },
  ]
}
const passwordHintsUsuario = computed(() => buildHints(form.value.contrasena || ''))
const passwordHintsAdmin   = computed(() => buildHints(formAdmin.value.contrasena || ''))
const mostrarPassUsuario   = ref(false)
const mostrarPassAdmin     = ref(false)

const errores = computed(() => ({
  nombre: !form.value.nombre.trim()
    ? 'El nombre es requerido'
    : /[0-9]/.test(form.value.nombre)
      ? 'El nombre no puede contener números.'
      : '',
  nombreUsuario: !form.value.nombreUsuario.trim()
    ? 'El nombre de usuario es requerido'
    : /^\d+$/.test(form.value.nombreUsuario.trim())
      ? 'El nombre de usuario no puede contener solo números'
      : '',
  email: !form.value.email.includes('@') ? 'Ingresa un email válido' : '',
  Id_Rol: !form.value.Id_Rol ? 'Selecciona un rol' : '',
  contrasena: !editando.value && !form.value.contrasena.trim()
    ? 'La contraseña es requerida'
    : validarContrasena(form.value.contrasena),
  telefono: !form.value.telefono.trim()
    ? 'El teléfono es requerido'
    : !/^\d{10}$/.test(form.value.telefono)
      ? 'El teléfono debe tener 10 dígitos'
      : '',
}))
const tieneErrores = computed(() => Object.values(errores.value).some(e => e !== ''))

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
  formTouched.value = false
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
function cerrarModal() { modalVisible.value = false; formTouched.value = false }

async function guardarUsuario() {
  formTouched.value = true
  if (tieneErrores.value) return
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
      mostrarToast('Usuario actualizado correctamente', 'info')
      await cargarDatos()
    } else {
      await crearUsuario(payload)
      mostrarToast('Usuario creado exitosamente', 'success')
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
    animateStats()
    cerrarModal()
  } catch (e) {
    mostrarToast(e.message || 'Error al guardar', 'danger')
  } finally {
    guardando.value = false
  }
}

// ── MODAL PERFIL ADMIN ──
function abrirModalAdmin() {
  formAdmin.value = {
    nombre: adminPerfil.value.nombre,
    nombreUsuario: adminPerfil.value.nombreUsuario,
    email: adminPerfil.value.email,
    telefono: adminPerfil.value.telefono,
    contrasena: '',
  }
  modalAdminVisible.value = true
}
function cerrarModalAdmin() { modalAdminVisible.value = false }

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

async function guardarPerfilAdmin() {
  if (/[0-9]/.test(formAdmin.value.nombre)) {
    mostrarToast('El nombre no puede contener números.', 'danger'); return
  }
  guardandoAdmin.value = true
  try {
    const payload = {
      Nombre_Completo: formAdmin.value.nombre,
      Nombre_Usuario: formAdmin.value.nombreUsuario || adminPerfil.value.nombreUsuario,
      Correo: formAdmin.value.email,
      Telefono: formAdmin.value.telefono || null,
      Id_Rol: adminPerfil.value.Id_Rol,
      Estado: 'activo',
      ...(formAdmin.value.contrasena.trim() ? { Contrasena: formAdmin.value.contrasena.trim() } : {}),
    }
    await actualizarUsuario(auth.idUsuario, payload)
    const nombre = formAdmin.value.nombre
    adminPerfil.value = {
      ...adminPerfil.value,
      nombre,
      nombreUsuario: formAdmin.value.nombreUsuario || adminPerfil.value.nombreUsuario,
      email: formAdmin.value.email,
      telefono: formAdmin.value.telefono,
      iniciales: nombre.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase(),
    }
    if (auth.usuario) {
      auth.usuario.Nombre_Completo = formAdmin.value.nombre
      auth.usuario.Nombre_Usuario  = formAdmin.value.nombreUsuario || auth.usuario.Nombre_Usuario
    }
    cerrarModalAdmin()
    mostrarToast('Perfil actualizado correctamente', 'success')
  } catch (e) {
    mostrarToast(e.message || 'Error al guardar', 'danger')
  } finally {
    guardandoAdmin.value = false
  }
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

/* ── HERO ── */
.page-hero {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
  opacity: 0; transform: translateY(-16px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }
.hero-left { display: flex; align-items: center; gap: 16px; }
.hero-text { display: flex; flex-direction: column; }
.hero-icon-wrap {
  position: relative; width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center;
  background: #1f3a52; border-radius: 14px; flex-shrink: 0;
}
.hero-icon { width: 26px; height: 26px; color: white; }
.hero-icon-ring { position: absolute; border-radius: 50%; border: 1.5px solid #1f3a52; opacity: 0; animation: iconPulse 3s ease-out infinite; }
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 86px; height: 86px; animation-delay: 0.8s; }
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
.hero-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; opacity: 0; transform: translateY(12px); animation: charReveal 0.4s ease forwards; }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0 0; }
.hero-actions-wrap { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex-shrink: 0; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-box {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 14px; background: white;
  border: 1.5px solid #e5e7eb; border-radius: 10px;
  transition: border-color 0.2s, box-shadow 0.2s; width: 220px;
}
.search-box.search-focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.search-ico { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font-size: 14px; color: #374151; background: transparent; }
.search-box input::placeholder { color: #9ca3af; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.select { padding: 9px 32px 9px 12px; border-radius: 10px; border: 1.5px solid #e5e7eb; font-size: 14px; background: white; appearance: none; -webkit-appearance: none; outline: none; cursor: pointer; transition: border-color 0.2s; }
.select:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: #6b7280; pointer-events: none; }
.btn { display: flex; align-items: center; gap: 8px; background: #1f3a52; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: background 0.2s, transform 0.1s; flex-shrink: 0; }
.btn:hover { background: #162b3c; transform: translateY(-1px); }
.btn:active { transform: translateY(0); }
.btn-icon { width: 18px; height: 18px; }

/* ── STATS ── */
.stats { display: flex; gap: 18px; margin-bottom: 24px; }
.stat-card { background: white; flex: 1; padding: 20px 20px 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s; }
.stats-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-3px) !important; }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: 0.07; }
.stat-icon-bg svg { width: 52px; height: 52px; }
.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px 0; }
.stat-card p { font-size: 30px; font-weight: 800; margin: 0; line-height: 1; }
.skeleton-card { pointer-events: none; min-height: 90px; }
.skeleton-line { display: block; border-radius: 999px; background: #e5e7eb; }
.skeleton-sm { width: 45%; height: 12px; margin-bottom: 16px; }
.skeleton-lg { width: 70%; height: 30px; }

/* ── CARD PERFIL ADMIN ── */
.admin-profile-card {
  background: linear-gradient(135deg, #111827 0%, #1f3a52 55%, #0f2236 100%);
  border-radius: 18px;
  padding: 26px 28px;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(22px) scale(0.97);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 32px rgba(15, 34, 54, 0.3);
  position: relative;
  overflow: hidden;
}
.admin-profile-card.card-visible { opacity: 1; transform: none; }

/* Engranajes decorativos */
.apc-gear { position: absolute; pointer-events: none; }
.apc-gear svg { width: 100%; height: 100%; }
.apc-gear.gear-big   { width: 160px; height: 160px; right: -20px; top: -30px; }
.apc-gear.gear-small { width: 80px;  height: 80px;  right: 115px; bottom: -20px; }
.gear-spin     { animation: gearTurn 20s linear infinite; }
.gear-spin-rev { animation: gearTurn 14s linear infinite reverse; }
.apc-gear.gear-big   { transform-origin: center; }
.apc-gear.gear-small { transform-origin: center; }
@keyframes gearTurn { to { transform: rotate(360deg); } }

/* Cabecera */
.pc-header {
  display: flex; align-items: center; gap: 18px;
  flex-wrap: wrap; position: relative; z-index: 1;
}
.pc-avatar-wrap {
  flex-shrink: 0; opacity: 0; transform: scale(0.5);
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
.pc-identity {
  flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0;
}
.pc-name {
  font-size: 20px; font-weight: 700; color: white;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
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

/* Grid de contacto */
.pc-contact-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; position: relative; z-index: 1;
}
.pc-contact-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; opacity: 0;
  animation: contactReveal 0.4s ease both;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}
.pc-contact-item:hover {
  background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.2); transform: translateY(-1px);
}
@keyframes contactReveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
.pc-contact-empty { color: rgba(255,255,255,0.3); font-style: italic; }

/* ── TABLA BOX ── */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; transition-delay: 320ms; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── TABLA ── */
table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; padding: 13px 18px; white-space: nowrap; }

/* ── SORT ANIMADO ── */
.th-sortable { cursor: pointer; user-select: none; transition: color 0.15s; position: relative; }
.th-sortable:hover { color: #1f3a52; }
.th-sorted { color: #1f3a52; }
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
.sort-neutral { opacity: 0.35; color: #9ca3af; transition: opacity 0.2s, transform 0.2s; }
.th-sortable:hover .sort-neutral { opacity: 0.55; }
.sort-up, .sort-down { color: #1f3a52; animation: sortIconPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes sortIconPop { from { transform: scale(0.6) rotate(-15deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }

td { padding: 14px 18px; font-size: 14px; border-top: 1px solid #f1f5f9; }
.table-row { transition: background 0.18s; animation: rowSlideIn 0.35s ease both; }
.table-row:hover td { background: #f8fafc; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
.row-flash td { background: #f0fdf4 !important; }
.row-eliminating { opacity: 0 !important; transform: translateX(20px) !important; transition: all 0.35s ease !important; }
.row-enter-active { transition: all 0.3s ease; }
.row-leave-active { transition: all 0.3s ease; }
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
.badge-role.operador { background: #e0ecff; color: #2563eb; }
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
.empty-state { text-align: center; padding: 48px 20px; color: #9ca3af; }
.empty-state svg { margin: 0 auto 12px; display: block; opacity: 0.4; }
.empty-state p { font-size: 14px; margin: 0; }

/* ── MODAL ── */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 30px; border-radius: 14px; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
.modal-content h2 { font-size: 18px; font-weight: 600; margin: 0 0 20px 0; }
.close { position: absolute; top: 16px; right: 20px; font-size: 22px; cursor: pointer; color: #9ca3af; transition: color 0.15s; background: none; border: none; }
.close:hover { color: #374151; }
.modal-content label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; margin-top: 14px; }
.modal-content input, .modal-content select { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; }
.modal-content input:focus, .modal-content select:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.input-error { border-color: #f87171 !important; }
.error-msg { font-size: 12px; color: #dc2626; margin-top: 4px; display: block; }
.input-wrap-modal { display: flex; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; }
.input-wrap-modal input { flex: 1; border: none !important; outline: none; padding: 10px 12px; font-size: 14px; background: transparent; box-shadow: none !important; }
.input-wrap-modal:focus-within { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.toggle-pass-modal { background: none; border: none; cursor: pointer; padding: 0 10px; color: #9ca3af; transition: color .15s; }
.toggle-pass-modal:hover { color: #374151; }
.pwd-hints { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.pwd-hint { font-size: 11.5px; font-weight: 500; padding: 2px 8px; border-radius: 20px; transition: background .2s, color .2s; }
.hint-ok { background: #dcfce7; color: #166534; }
.hint-no { background: #f3f4f6; color: #9ca3af; }
.user-preview { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding: 12px 14px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; }
.modal-buttons { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; font-size: 14px; cursor: pointer; transition: background 0.15s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-submit { padding: 10px 20px; border-radius: 8px; border: none; background: #1f3a52; font-size: 14px; font-weight: 500; color: white; cursor: pointer; transition: background 0.2s, opacity 0.2s; }
.btn-submit:hover:not(:disabled) { background: #162b3c; }
.btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── CONFIRM ── */
.confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; justify-content: center; align-items: center; z-index: 1100; }
.confirm-box { background: white; border-radius: 14px; padding: 28px 32px; max-width: 360px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
.confirm-icon { color: #f59e0b; margin-bottom: 14px; }
.confirm-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 6px; }
.confirm-sub   { font-size: 14px; color: #6b7280; margin: 0 0 20px; }
.confirm-btns  { display: flex; gap: 10px; justify-content: center; }
.btn-danger    { padding: 10px 20px; border-radius: 8px; border: none; background: #dc2626; color: white; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
.btn-danger:hover { background: #b91c1c; }

/* ── TOAST ── */
.toast { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.toast.success { background: #16a34a; }
.toast.danger  { background: #dc2626; }
.toast.info    { background: #2563eb; }

/* ── TRANSICIONES ── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(12px); }
.toast-leave-to   { opacity: 0; transform: translateY(12px); }

@media (max-width: 960px) {
  .page-hero { flex-direction: column; align-items: flex-start; }
  .hero-actions-wrap { width: 100%; }
  .admin-profile-card { flex-direction: column; align-items: flex-start; }
}
</style>