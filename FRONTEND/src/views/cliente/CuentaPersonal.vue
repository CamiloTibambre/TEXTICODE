<template>
  <div style="display:flex;min-height:100vh;background:#f1f5f9;position:relative;overflow:hidden">
    <AppSidebar rol="cliente" />
 
    <div class="bg-orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>
 
    <main class="main">
 
      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': mounted }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Cuenta Personal'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: mounted ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Tu perfil y comprobantes de entrega</p>
          </div>
        </div>
      </div>
 
      <!-- CARGANDO -->
      <div v-if="cargando" class="loading-wrap">
        <div class="spinner"></div>
        <p class="loading-text">Cargando perfil...</p>
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
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="#d1d5db">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
          </svg>
          <p class="empty-title">Ingresa con tu cuenta</p>
          <p class="empty-sub">Inicia sesión con tus credenciales reales para ver tu perfil y comprobantes.</p>
        </div>
 
        <template v-else>
 
          <!-- CARD UNIFICADA con engranajes animados -->
          <div class="profile-contact-card" :class="{ 'banner-in': mounted }">
 
            <!-- Engranajes decorativos (igual que admin-profile-card) -->
            <div class="apc-gear gear-big" :class="{ 'gear-spin': mounted }">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.07)" stroke-width=".8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </div>
            <div class="apc-gear gear-small" :class="{ 'gear-spin-rev': mounted }">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.1)" stroke-width=".8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </div>
 
            <div class="pc-header">
              <!-- Avatar con paleta dinámica -->
              <div
                class="pc-avatar-wrap"
                :class="{ 'avatar-in': mounted }"
              >
                <div
                  class="pc-avatar"
                  :style="{ background: avatarBg(perfil.Nombre_Completo), color: avatarColor(perfil.Nombre_Completo) }"
                >
                  {{ iniciales }}
                </div>
              </div>
 
              <!-- Identidad: solo nombre, sin rol ni estado -->
              <div class="pc-identity">
                <div class="pc-name">{{ perfil.Nombre_Completo }}</div>
              </div>
 
              <!-- Botón editar -->
              <button class="pc-edit-btn" @click="abrirModal">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                </svg>
                Editar Perfil
              </button>
            </div>
 
            <!-- Divisor -->
            <div class="pc-divider"></div>
 
            <!-- Información de contacto -->
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
 
          <!-- STATS CARDS -->
          <div class="stats-grid" :class="{ 'stats-visible': mounted }">
            <div
              v-for="(s, i) in statsCards"
              :key="s.label"
              class="stat-card"
              :style="{ transitionDelay: mounted ? `${i * 80}ms` : '0ms' }"
            >
              <div class="stat-accent" :style="{ background: s.accent }"></div>
              <div class="stat-icon-bg" :style="{ color: s.accent }">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon"/>
                </svg>
              </div>
              <h3>{{ s.label }}</h3>
              <p :style="{ color: s.accent }">{{ s.display }}</p>
            </div>
          </div>
 
          <!-- TABLA COMPROBANTES -->
          <section class="table-box" :class="{ 'box-visible': mounted }" style="transition-delay: 280ms;">
            <div class="table-header-bar">
              <div class="table-header-left">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                </svg>
                Mis Comprobantes de Entrega
                <span class="count-badge">{{ ordenesOrdenadas.length }}</span>
              </div>
            </div>
 
            <div v-if="cargandoComprobantes" class="loading-inline-wrap">
              <div class="skeleton-row" v-for="i in 3" :key="i"></div>
            </div>
 
            <template v-else>
              <table>
                <thead>
                  <tr>
                    <th class="th-sort" @click="sortOrdenes('numero')">N.° Orden <span class="sort-icon">{{ sortIcon('numero') }}</span></th>
                    <th class="th-sort" @click="sortOrdenes('fecha')">Fecha de Entrega <span class="sort-icon">{{ sortIcon('fecha') }}</span></th>
                    <th>Producto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <TransitionGroup name="row">
                    <tr
                      v-for="(o, idx) in ordenesOrdenadas"
                      :key="o.id"
                      class="table-row"
                      :class="{ 'row-flash': o.flash }"
                      :style="{ animationDelay: `${idx * 45}ms` }"
                    >
                      <td><span class="order-num-pill">#{{ o.numero }}</span></td>
                      <td>{{ o.fecha }}</td>
                      <td>{{ o.productos }}</td>
                      <td><span class="badge" :class="o.estadoClass">{{ o.estado }}</span></td>
                      <td>
                        <div class="actions">
                          <button class="action-btn view-btn" title="Ver detalle" @click="verDetalle(o)">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                            </svg>
                          </button>
                          <button class="action-btn download-btn" title="Descargar PDF" @click="descargarPDF(o)" :disabled="o.descargando">
                            <svg v-if="!o.descargando" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                            </svg>
                            <svg v-else class="spin" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </TransitionGroup>
                </tbody>
              </table>
 
              <div v-if="ordenesOrdenadas.length === 0" class="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" width="40" height="40">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p>No tienes comprobantes registrados.</p>
              </div>
            </template>
          </section>
 
        </template>
      </template>
    </main>
 
    <!-- MODAL COMPROBANTE PROFESIONAL -->
    <Transition name="modal">
      <div v-if="ordenSeleccionada" class="modal" @click.self="ordenSeleccionada = null">
        <div class="cp-wrap">
          <div class="cp-head">
            <div class="cp-head-left">
              <img src="data:image/png;base64,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" class="cp-logo-img" alt="Texticode logo" />
              <div>
                <div class="cp-empresa-nombre">TEXTICODE</div>
                <div class="cp-empresa-datos">Bogotá, Colombia &nbsp;|&nbsp; texticode@correo.com &nbsp;|&nbsp; +57 300 000 0000</div>
              </div>
            </div>
            <div class="cp-head-right">
              <div class="cp-doc-titulo">COMPROBANTE DE ENTREGA</div>
              <div class="cp-doc-numero">N.° {{ ordenSeleccionada.numero }}</div>
            </div>
          </div>

          <div class="cp-linea-doble"></div>

          <div class="cp-info-row">
            <div class="cp-info-bloque">
              <div class="cp-label">CLIENTE</div>
              <div class="cp-valor-grande">{{ ordenSeleccionada.cliente }}</div>
              <div class="cp-valor-sub" v-if="perfil.Correo">{{ perfil.Correo }}</div>
              <div class="cp-valor-sub" v-if="perfil.Telefono">Tel: {{ perfil.Telefono }}</div>
            </div>
            <div class="cp-info-bloque cp-info-bloque--center">
              <div class="cp-label">FECHA DE EMISIÓN</div>
              <div class="cp-valor-grande">{{ fechaHoy }}</div>
              <div class="cp-label" style="margin-top:14px">FECHA DE ENTREGA</div>
              <div class="cp-valor-grande">{{ ordenSeleccionada.fecha }}</div>
            </div>
            <div class="cp-info-bloque cp-info-bloque--right">
              <div class="cp-label">ESTADO DEL PEDIDO</div>
              <div class="cp-estado-caja" :class="ordenSeleccionada.estadoClass">{{ ordenSeleccionada.estado }}</div>
              <div class="cp-label" style="margin-top:14px">ORDEN DE REFERENCIA</div>
              <div class="cp-valor-grande">#{{ ordenSeleccionada.numero }}</div>
            </div>
          </div>

          <div class="cp-linea-simple"></div>

          <table class="cp-tabla">
            <thead>
              <tr>
                <th class="cp-th cp-th--num">#</th>
                <th class="cp-th">Descripción del producto / servicio</th>
                <th class="cp-th cp-th--centro">Cantidad</th>
                <th class="cp-th cp-th--right">Estado entrega</th>
              </tr>
            </thead>
            <tbody>
              <tr class="cp-tr">
                <td class="cp-td cp-td--num">01</td>
                <td class="cp-td">
                  <div class="cp-prod-nombre">{{ ordenSeleccionada.productos }}</div>
                </td>
                <td class="cp-td cp-td--centro">{{ ordenSeleccionada.cantidad || 1 }}</td>
                <td class="cp-td cp-td--right">
                  <span class="cp-entrega-badge" :class="ordenSeleccionada.estadoClass">
                    {{ ordenSeleccionada.estado === 'Entregado' ? '✓ Entregado' : '⏳ Pendiente' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="cp-linea-simple"></div>

          <div class="cp-bottom">
            <div class="cp-observaciones">
              <div class="cp-label">OBSERVACIONES</div>
              <div class="cp-obs-caja">{{ ordenSeleccionada.observaciones || 'Ninguna observación registrada para este pedido.' }}</div>
            </div>
            <div class="cp-firmas">
              <div class="cp-firma-bloque">
                <div class="cp-firma-linea"></div>
                <div class="cp-firma-nombre">Entregado por</div>
                <div class="cp-firma-cargo">TEXTICODE S.A.S.</div>
              </div>
              <div class="cp-firma-bloque">
                <div class="cp-firma-linea"></div>
                <div class="cp-firma-nombre">Recibido por</div>
                <div class="cp-firma-cargo">{{ ordenSeleccionada.cliente }}</div>
              </div>
            </div>
          </div>

          <div class="cp-pie">
            <span>Este documento es un comprobante oficial de entrega emitido por TEXTICODE.</span>
            <span>Generado el {{ fechaHoy }}</span>
          </div>

          <div class="cp-acciones">
            <button class="btn-secondary" @click="ordenSeleccionada = null">Cerrar</button>
            <button class="btn-primary btn-icon-row" @click="descargarPDF(ordenSeleccionada)" :disabled="ordenSeleccionada.descargando">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              {{ ordenSeleccionada.descargando ? 'Generando...' : 'Descargar PDF' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
 
    <!-- MODAL EDITAR PERFIL -->
    <Transition name="modal">
      <div v-if="modalVisible" class="modal" @click.self="cerrarModal">
        <div class="modal-container">
          <div class="modal-header">
            <span class="modal-title">Editar Perfil</span>
            <button class="modal-close" @click="cerrarModal">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group"><label class="form-label">Nombre Completo</label><input v-model="formEdicion.Nombre_Completo" type="text" class="form-input" @keypress="soloLetras"></div>
            <div class="form-group"><label class="form-label">Correo Electrónico</label><input v-model="formEdicion.Correo" type="email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input v-model="formEdicion.Telefono" type="tel" class="form-input"></div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <div class="input-wrap">
                <input v-model="formEdicion.Contrasena" :type="mostrarPassword ? 'text' : 'password'" class="form-input" placeholder="••••••••">
                <button class="toggle-pass" @click="mostrarPassword = !mostrarPassword" type="button">
                  <svg v-if="!mostrarPassword" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
                  <svg v-else fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                </button>
              </div>
              <div v-if="formEdicion.Contrasena" class="pwd-hints">
                <span v-for="h in passwordHints" :key="h.label" class="pwd-hint" :class="h.ok ? 'hint-ok' : 'hint-no'">
                  {{ h.ok ? '✓' : '✗' }} {{ h.label }}
                </span>
              </div>
              <p class="pwd-note">Déjala vacía si no deseas cambiarla.</p>
            </div>
          </div>
          <div v-if="errorGuardar" class="error-inline">{{ errorGuardar }}</div>
          <div class="modal-footer">
            <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
            <button class="btn-guardar" :disabled="guardando" @click="guardarCambios">{{ guardando ? 'Guardando...' : 'Guardar Cambios' }}</button>
          </div>
        </div>
      </div>
    </Transition>
 
    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast.visible" class="toast" :class="'toast-' + toast.type">{{ toast.msg }}</div>
    </Transition>
  </div>
</template>
 
<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore } from '../../stores/auth'
import { getUsuario, actualizarUsuario, getOrdenesDeCliente, getComprobantes } from '../../services/api'
 
const auth = useAuthStore()
 
const mounted              = ref(false)
const cargando             = ref(true)
const cargandoComprobantes = ref(false)
const error                = ref('')
const errorGuardar         = ref('')
const guardando            = ref(false)
const modalVisible         = ref(false)
const mostrarPassword      = ref(false)
const toast                = ref({ visible: false, msg: '', type: 'success' })
const ordenSeleccionada    = ref(null)
const perfil               = ref({})
const ordenes              = ref([])
const formEdicion          = ref({})
const fechaHoy             = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
 
const displayOrdenes    = ref(0)
const displayEntregadas = ref(0)
const displayPendientes = ref(0)
 
// ── PALETA DE AVATARES (igual que el primer código) ──
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
 
function animateCount(targetRef, target) {
  let val = 0
  const steps = 80; const duration = 2000
  const intervalMs = Math.round(duration / steps)
  const step = Math.max(0.1, target / steps)
  const id = setInterval(() => {
    val += step
    if (val >= target) { targetRef.value = target; clearInterval(id) }
    else targetRef.value = Math.floor(val)
  }, intervalMs)
}
 
const iniciales = computed(() =>
  (perfil.value.Nombre_Completo || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
)
 
const ICON_ORDERS = 'm9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z'
const ICON_CHECK  = 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_CLOCK  = 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
 
const statsCards = computed(() => [
  { label: 'Órdenes totales', display: displayOrdenes.value,    accent: '#1f3a52', icon: ICON_ORDERS },
  { label: 'Entregadas',      display: displayEntregadas.value, accent: '#16a34a', icon: ICON_CHECK  },
  { label: 'Pendientes',      display: displayPendientes.value, accent: '#d97706', icon: ICON_CLOCK  },
])
 
const contactItems = computed(() => [
  { label: 'Email',    value: perfil.value.Correo         || '—', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
  { label: 'Teléfono', value: perfil.value.Telefono       || '—', icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25Z' },
  { label: 'Usuario',  value: perfil.value.Nombre_Usuario || '—', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0' },
])
 
const sortKeyOrdenes = ref('numero')
const sortDirOrdenes = ref(1)
function sortOrdenes(key) {
  sortKeyOrdenes.value === key ? (sortDirOrdenes.value *= -1) : (sortKeyOrdenes.value = key, sortDirOrdenes.value = 1)
}
function sortIcon(key) {
  if (sortKeyOrdenes.value !== key) return '⇅'
  return sortDirOrdenes.value === 1 ? '↑' : '↓'
}
const ordenesOrdenadas = computed(() =>
  [...ordenes.value].sort((a, b) => {
    const k = sortKeyOrdenes.value
    return (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * sortDirOrdenes.value
  })
)
 
async function cargarDatos() {
  cargando.value = true; error.value = ''
  try {
    if (!auth.idUsuario) { perfil.value = {}; ordenes.value = []; return }
    perfil.value = await getUsuario(auth.idUsuario)
    cargandoComprobantes.value = true
    try {
      const [dataOrdenes, dataComprobantes] = await Promise.all([
        getOrdenesDeCliente(auth.idUsuario),
        getComprobantes(),
      ])
      const mapaComp = {}
      dataComprobantes.forEach(c => { mapaComp[c.Id_Orden] = c })
      ordenes.value = (Array.isArray(dataOrdenes) ? dataOrdenes : []).map(o => {
        const comp = mapaComp[o.Id_Orden]
        const estadoComp = comp?.Estado || o.Estado
        const esEntregado = estadoComp === 'Entregado' || o.Estado === 'Completada'
        return {
          id: o.Id_Orden,
          numero: String(o.Id_Orden).padStart(4, '0'),
          cliente: perfil.value.Nombre_Completo || '',
          fecha: o.Fecha_Limite?.split('T')[0] || '—',
          productos: o.Producto || o.Descripcion || '—',
          cantidad: o.Cantidad || 1,
          observaciones: o.Observaciones || '',
          estado: esEntregado ? 'Entregado' : 'Pendiente',
          estadoClass: esEntregado ? 'success' : 'danger',
          flash: false,
          descargando: false,
        }
      })
    } catch { ordenes.value = [] }
    finally { cargandoComprobantes.value = false }
  } catch (e) {
    error.value = e.message || 'Error al cargar el perfil.'
  } finally {
    cargando.value = false
  }
}
 
onMounted(async () => {
  await cargarDatos()
  requestAnimationFrame(() => requestAnimationFrame(() => {
    mounted.value = true
    animateCount(displayOrdenes,    ordenes.value.length)
    animateCount(displayEntregadas, ordenes.value.filter(o => o.estadoClass === 'success').length)
    animateCount(displayPendientes, ordenes.value.filter(o => o.estadoClass === 'danger').length)
  }))
})
 
function verDetalle(o) { ordenSeleccionada.value = o }

// ── DESCARGA PDF REAL (igual que GestionClientes) ──
async function descargarPDF(orden) {
  orden.descargando = true
  try {
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
      })
    }

    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W = doc.internal.pageSize.width
    const ML = 14
    const MR = W - 14

    const AZUL   = [15, 34, 54]
    const BLANCO = [255, 255, 255]
    const GRIS_T = [75, 85, 99]
    const NEGRO  = [17, 24, 39]
    const GRIS_BG= [249, 250, 251]
    const GRIS_LN= [243, 244, 246]

    // Cabecera azul
    doc.setFillColor(...AZUL)
    doc.rect(0, 0, W, 32, 'F')

    const logoB64 = 'data:image/png;base64,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'
    try { doc.addImage(logoB64, 'PNG', ML, 4, 20, 20) } catch(_) { /* logo opcional */ }

    doc.setTextColor(...BLANCO)
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('TEXTICODE', ML + 24, 15)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.setTextColor(147, 197, 253)
    doc.text('Bogotá, Colombia  ·  texticode@correo.com  ·  +57 300 000 0000', ML + 24, 22)

    doc.setTextColor(...BLANCO)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('COMPROBANTE DE ENTREGA', MR, 14, { align: 'right' })
    doc.setFontSize(16)
    doc.text(`N.° ${orden.numero}`, MR, 24, { align: 'right' })

    doc.setDrawColor(...AZUL)
    doc.setLineWidth(0.3)
    doc.line(ML, 34, MR, 34)

    let y = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRIS_T)
    doc.text('CLIENTE', ML, y)
    y += 5
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NEGRO)
    doc.text(orden.cliente, ML, y)
    y += 5
    if (perfil.value.Correo) {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRIS_T)
      doc.text(perfil.value.Correo, ML, y)
      y += 4
    }
    if (perfil.value.Telefono) {
      doc.text('Tel: ' + perfil.value.Telefono, ML, y)
      y += 4
    }

    const col2X = W / 2 + 10
    let y2 = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('FECHA DE EMISIÓN', col2X, y2)
    y2 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text(fechaHoy, col2X, y2)
    y2 += 8
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('FECHA DE ENTREGA', col2X, y2)
    y2 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text(orden.fecha, col2X, y2)

    const col3X = MR
    let y3 = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('ESTADO DEL PEDIDO', col3X, y3, { align: 'right' })
    y3 += 6
    const esEntregado = orden.estadoClass === 'success'
    const badgeW = 30
    const badgeX = col3X - badgeW
    doc.setFillColor(esEntregado ? 209 : 255, esEntregado ? 250 : 237, esEntregado ? 229 : 213)
    doc.roundedRect(badgeX, y3 - 4.5, badgeW, 7, 1.5, 1.5, 'F')
    doc.setTextColor(esEntregado ? 6 : 146, esEntregado ? 95 : 64, esEntregado ? 70 : 14)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text(orden.estado, badgeX + badgeW / 2, y3, { align: 'center' })
    y3 += 10
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('ORDEN DE REFERENCIA', col3X, y3, { align: 'right' })
    y3 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text('#' + orden.numero, col3X, y3, { align: 'right' })

    y = Math.max(y, y2, y3) + 10

    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2)
    doc.line(ML, y, MR, y)
    y += 6

    const colNumW = 14
    const colEstW = 38
    const colCantW = 28
    const colDescW = MR - ML - colNumW - colCantW - colEstW
    const colX = [ML, ML + colNumW, ML + colNumW + colDescW, ML + colNumW + colDescW + colCantW]
    doc.setFillColor(...AZUL)
    doc.rect(ML, y, MR - ML, 8, 'F')
    doc.setTextColor(...BLANCO); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
    doc.text('#', colX[0] + 2, y + 5.5)
    doc.text('DESCRIPCION DEL PRODUCTO / SERVICIO', colX[1] + 2, y + 5.5)
    doc.text('CANTIDAD', colX[2] + colCantW / 2, y + 5.5, { align: 'center' })
    doc.text('ESTADO ENTREGA', colX[3] + colEstW / 2, y + 5.5, { align: 'center' })
    y += 8

    const rowH = 10
    doc.setFillColor(...BLANCO)
    doc.rect(ML, y, MR - ML, rowH, 'F')
    doc.setTextColor(156, 163, 175); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.text('01', colX[0] + 2, y + 6.5)
    doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'bold')
    doc.text(orden.productos, colX[1] + 2, y + 6.5, { maxWidth: colDescW - 4 })
    doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.text(String(orden.cantidad || 1), colX[2] + colCantW / 2, y + 6.5, { align: 'center' })
    const tbadgeW = 28
    const tbadgeX = colX[3] + (colEstW - tbadgeW) / 2
    doc.setFillColor(esEntregado ? 209 : 255, esEntregado ? 250 : 237, esEntregado ? 229 : 213)
    doc.roundedRect(tbadgeX, y + 2.5, tbadgeW, 6, 1, 1, 'F')
    doc.setTextColor(esEntregado ? 6 : 146, esEntregado ? 95 : 64, esEntregado ? 70 : 14)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
    doc.text(esEntregado ? 'Entregado' : 'Pendiente', tbadgeX + tbadgeW / 2, y + 7, { align: 'center' })
    y += rowH + 8

    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('OBSERVACIONES', ML, y)
    y += 5
    doc.setFillColor(...GRIS_BG)
    doc.rect(ML, y, (MR - ML) / 2 - 4, 18, 'F')
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO); doc.setFontSize(9)
    doc.text(orden.observaciones || 'Ninguna observación registrada.', ML + 2, y + 5, { maxWidth: (MR - ML) / 2 - 8 })

    const firmaX1 = (MR - ML) / 2 + ML + 10
    const firmaX2 = MR - 28
    y += 20
    doc.setLineWidth(0.4); doc.setDrawColor(55, 65, 81)
    doc.line(firmaX1, y, firmaX1 + 44, y)
    doc.line(firmaX2 - 6, y, firmaX2 + 22, y)
    y += 4
    doc.setFontSize(8); doc.setTextColor(...GRIS_T)
    doc.text('Entregado por', firmaX1 + 22, y, { align: 'center' })
    doc.text('Recibido por', firmaX2 + 8, y, { align: 'center' })
    y += 4
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NEGRO); doc.setFontSize(8.5)
    doc.text('TEXTICODE S.A.S.', firmaX1 + 22, y, { align: 'center' })
    doc.text(orden.cliente, firmaX2 + 8, y, { align: 'center' })

    const pH = doc.internal.pageSize.height
    doc.setFillColor(...AZUL)
    doc.rect(0, pH - 12, W, 12, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(147, 197, 253)
    doc.text('Documento de uso oficial · TEXTICODE S.A.S.', ML, pH - 5)
    doc.text(`Generado el ${fechaHoy}`, MR, pH - 5, { align: 'right' })

    doc.save(`comprobante-${orden.numero}.pdf`)
    mostrarToast(`Comprobante ${orden.numero} descargado correctamente`)
  } catch (err) {
    console.error('Error generando PDF:', err)
    mostrarToast('Error al generar el PDF', 'danger')
  } finally {
    orden.descargando = false
  }
}
function abrirModal() { formEdicion.value = { ...perfil.value, Contrasena: '' }; mostrarPassword.value = false; errorGuardar.value = ''; modalVisible.value = true }
function cerrarModal() { modalVisible.value = false; errorGuardar.value = '' }
function validarContrasena(contrasena) {
  if (!contrasena || !contrasena.trim()) return null
  if (contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(contrasena)) return 'Debe tener al menos una letra mayúscula.'
  if (!/[0-9]/.test(contrasena)) return 'Debe tener al menos un número.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena)) return 'Debe tener al menos un carácter especial (@, #, $, etc.).'
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
function soloLetras(e) {
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÄËÏÖÜäëïöüÑñ\s'-]$/.test(e.key)) e.preventDefault()
}

async function guardarCambios() {
  if (!formEdicion.value.Nombre_Completo?.trim() || !formEdicion.value.Correo?.trim()) { errorGuardar.value = 'Nombre y correo son obligatorios.'; return }
  if (/[0-9]/.test(formEdicion.value.Nombre_Completo)) { errorGuardar.value = 'El nombre no puede contener números.'; return }
  if (formEdicion.value.Contrasena) {
    const errorPass = validarContrasena(formEdicion.value.Contrasena)
    if (errorPass) { errorGuardar.value = errorPass; return }
  }
  guardando.value = true; errorGuardar.value = ''
  try {
    const payload = { Id_Rol: perfil.value.Id_Rol, Nombre_Completo: formEdicion.value.Nombre_Completo, Nombre_Usuario: perfil.value.Nombre_Usuario, Correo: formEdicion.value.Correo, Telefono: formEdicion.value.Telefono || null, Estado: perfil.value.Estado, Contrasena: formEdicion.value.Contrasena || null }
    await actualizarUsuario(auth.idUsuario, payload)
    perfil.value = { ...perfil.value, ...payload }
    if (auth.usuario) auth.usuario.Nombre_Completo = formEdicion.value.Nombre_Completo
    cerrarModal(); mostrarToast('Perfil actualizado correctamente', 'success')
  } catch (e) { errorGuardar.value = e.message || 'Error al guardar.' }
  finally { guardando.value = false }
}
function mostrarToast(msg, type = 'success') { toast.value = { visible: true, msg, type }; setTimeout(() => { toast.value.visible = false }, 2800) }
</script>
 
<style scoped>
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
 
.main { flex: 1; padding: 28px 30px; overflow-y: auto; position: relative; z-index: 1; }
 
/* ── HERO ── */
.page-hero { display: flex; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
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
 
/* ══════════════════════════════════════════
   CARD PERFIL CON ENGRANAJES ANIMADOS
══════════════════════════════════════════ */
.profile-contact-card {
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
.profile-contact-card.banner-in { opacity: 1; transform: none; }
 
/* Engranajes decorativos (tomados del primer código) */
.apc-gear { position: absolute; pointer-events: none; }
.apc-gear svg { width: 100%; height: 100%; }
.apc-gear.gear-big   { width: 160px; height: 160px; right: -20px; top: -30px; }
.apc-gear.gear-small { width: 80px;  height: 80px;  right: 115px; bottom: -20px; }
.gear-spin     { animation: gearTurn 20s linear infinite; }
.gear-spin-rev { animation: gearTurn 14s linear infinite reverse; }
.apc-gear.gear-big   { transform-origin: center; }
.apc-gear.gear-small { transform-origin: center; }
@keyframes gearTurn { to { transform: rotate(360deg); } }
 
/* ── CABECERA ── */
.pc-header {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}
 
/* Avatar con paleta dinámica */
.pc-avatar-wrap {
  flex-shrink: 0;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.5s ease 0.1s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
}
.pc-avatar-wrap.avatar-in { opacity: 1; transform: scale(1); }
.pc-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  border: 2.5px solid rgba(255,255,255,0.25);
  box-shadow: 0 0 0 4px rgba(255,255,255,0.06), 0 6px 18px rgba(0,0,0,0.3);
}
 
/* Identidad: solo nombre */
.pc-identity {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.pc-name {
  font-size: 20px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
 
/* Botón editar */
.pc-edit-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255,255,255,0.12);
  color: white;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  backdrop-filter: blur(6px);
  transition: background 0.2s, transform 0.15s;
  position: relative;
  z-index: 1;
}
.pc-edit-btn:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }
 
/* Divisor */
.pc-divider {
  margin: 22px 0 18px;
  border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 1;
}
 
/* ── GRID DE CONTACTO ── */
.pc-contact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  position: relative;
  z-index: 1;
}
 
.pc-contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  opacity: 0;
  animation: contactReveal 0.4s ease both;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}
.pc-contact-item:hover {
  background: rgba(255,255,255,0.13);
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-1px);
}
@keyframes contactReveal {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
 
.pc-contact-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
 
.pc-contact-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pc-contact-label {
  font-size: 10px;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}
.pc-contact-value {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
 
/* ── STATS ── */
.stats-grid { display: flex; gap: 18px; margin-bottom: 20px; }
.stat-card { background: white; flex: 1; padding: 20px 20px 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s; }
.stats-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-3px) !important; }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: 0.07; }
.stat-icon-bg svg { width: 52px; height: 52px; }
.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px 0; }
.stat-card p  { font-size: 30px; font-weight: 800; margin: 0; line-height: 1; }
 
/* ── TABLA ── */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; margin-bottom: 20px; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }
table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; padding: 13px 18px; white-space: nowrap; }
.th-sort { cursor: pointer; user-select: none; transition: color 0.15s; }
.th-sort:hover { color: #1f3a52; }
.sort-icon { font-size: 11px; margin-left: 4px; opacity: 0.6; }
td { padding: 14px 18px; font-size: 14px; color: #374151; border-top: 1px solid #f1f5f9; }
.table-row { transition: background 0.18s; animation: rowSlideIn 0.35s ease both; }
.table-row:hover td { background: #f8fafc; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes rowFlash { 0% { background: #d1fae5; } 100% { background: transparent; } }
.row-flash { animation: rowFlash 1.2s ease !important; }
.order-num-pill { display: inline-block; background: #f1f5f9; color: #1f3a52; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; }
tr:hover .order-num-pill { background: #e0ecff; color: #2563eb; }
.badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.success { background: #dcfce7; color: #15803d; }
.danger  { background: #fee2e2; color: #b91c1c; }
.actions { display: flex; gap: 8px; align-items: center; }
.action-btn { width: 32px; height: 32px; border-radius: 7px; border: none; background: #1f3a52; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.15s; }
.action-btn svg { pointer-events: none; }
.view-btn:hover     { background: #2d5580; transform: scale(1.07); }
.download-btn:hover { background: #1d4ed8; transform: scale(1.07); }
 
/* ── SKELETON / LOADING / EMPTY ── */
.loading-inline-wrap { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.skeleton-row { height: 48px; border-radius: 8px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 44px 0; color: #9ca3af; font-size: 14px; }
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 16px; position: relative; z-index: 1; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 14px; color: #9ca3af; }
.error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; color: #991b1b; font-size: 14px; margin-bottom: 20px; position: relative; z-index: 1; }
.btn-retry { margin-left: auto; background: #991b1b; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 13px; cursor: pointer; }
.empty-session { display: flex; flex-direction: column; align-items: center; padding: 80px 24px; gap: 12px; text-align: center; position: relative; z-index: 1; }
.empty-title { font-size: 16px; font-weight: 600; color: #374151; }
.empty-sub   { font-size: 13px; color: #9ca3af; max-width: 320px; line-height: 1.6; }
 
/* ── MODAL ── */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-container { background: white; border-radius: 16px; width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-title  { font-size: 16px; font-weight: 700; color: #111827; }
.modal-close  { background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f3f4f6; }
.modal-body   { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid #f3f4f6; }
.form-group   { display: flex; flex-direction: column; gap: 5px; }
.form-label   { font-size: 12px; font-weight: 600; color: #374151; }
.form-input   { border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 14px; color: #111827; outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.input-wrap   { display: flex; align-items: center; border: 1.5px solid #e5e7eb; border-radius: 8px; }
.input-wrap:focus-within { border-color: #1f3a52; }
.input-wrap .form-input { flex: 1; border: none; outline: none; box-shadow: none !important; }
.toggle-pass  { background: none; border: none; cursor: pointer; padding: 0 10px; color: #9ca3af; }
.toggle-pass:hover { color: #374151; }
.pwd-hints { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.pwd-hint { font-size: 11.5px; font-weight: 500; padding: 2px 8px; border-radius: 20px; transition: background .2s, color .2s; }
.hint-ok { background: #dcfce7; color: #166534; }
.hint-no { background: #f3f4f6; color: #9ca3af; }
.pwd-note { font-size: 11px; color: #9ca3af; margin-top: 4px; }
.btn-cancelar { background: white; color: #374151; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 18px; font-size: 13px; cursor: pointer; }
.btn-cancelar:hover { background: #f3f4f6; }
.btn-guardar  { background: #1f3a52; color: white; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-guardar:hover:not(:disabled) { background: #162b3c; }
.btn-guardar:disabled { opacity: 0.6; cursor: not-allowed; }
.error-inline { color: #dc2626; font-size: 13px; padding: 4px 24px; }
.detalle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detalle-item { display: flex; flex-direction: column; gap: 4px; }
.detalle-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
 
/* ── TOAST ── */
.toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 2000; }
.toast-success { background: #166534; color: white; }
.toast-danger  { background: #991b1b; color: white; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.row-enter-active, .row-leave-active { transition: opacity 0.3s ease; }
.row-enter-from, .row-leave-to { opacity: 0; }
 
/* ── RESPONSIVE ── */
@media (max-width: 960px) {
  .main { padding: 20px 16px; }
  .stats-grid { flex-direction: column; }
  .pc-contact-grid { grid-template-columns: 1fr 1fr; }
  .pc-edit-btn { width: 100%; justify-content: center; }
}
@media (max-width: 600px) {
  .pc-contact-grid { grid-template-columns: 1fr; }
}

/* ══ COMPROBANTE PROFESIONAL (igual que GestionClientes) ══ */
.cp-wrap { background: #fff; width: 700px; max-width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 4px; box-shadow: 0 8px 40px rgba(0,0,0,.18); font-family: 'Georgia', 'Times New Roman', serif; }
.cp-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 32px; background: #0f2236; }
.cp-head-left { display: flex; align-items: center; gap: 14px; }
.cp-logo-img { width: 50px; height: 50px; object-fit: contain; flex-shrink: 0; }
.cp-empresa-nombre { font-size: 20px; font-weight: 700; letter-spacing: 3px; color: #fff; font-family: Arial, sans-serif; }
.cp-empresa-datos  { font-size: 11px; color: #93c5fd; margin-top: 3px; font-family: Arial, sans-serif; }
.cp-head-right { text-align: right; }
.cp-doc-titulo { font-size: 13px; font-weight: 600; letter-spacing: 2px; color: #93c5fd; font-family: Arial, sans-serif; text-transform: uppercase; }
.cp-doc-numero { font-size: 26px; font-weight: 700; color: #fff; font-family: Arial, sans-serif; margin-top: 4px; }
.cp-linea-doble { border: none; border-top: 3px double #1f3b57; margin: 0 32px; }
.cp-linea-simple { border: none; border-top: 1px solid #d1d5db; margin: 0 32px; }
.cp-info-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; padding: 22px 32px; border-bottom: 1px solid #e5e7eb; }
.cp-info-bloque { padding-right: 20px; }
.cp-info-bloque--center { border-left: 1px solid #e5e7eb; padding-left: 20px; border-right: 1px solid #e5e7eb; padding-right: 20px; }
.cp-info-bloque--right  { padding-left: 20px; padding-right: 0; }
.cp-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; font-family: Arial, sans-serif; margin-bottom: 5px; }
.cp-valor-grande { font-size: 14px; color: #111827; line-height: 1.4; }
.cp-valor-sub    { font-size: 12px; color: #6b7280; margin-top: 2px; font-family: Arial, sans-serif; }
.cp-estado-caja { display: inline-block; padding: 5px 14px; border-radius: 2px; font-size: 12px; font-weight: 700; font-family: Arial, sans-serif; letter-spacing: .5px; margin-top: 4px; }
.cp-estado-caja.success { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.cp-estado-caja.danger  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
.cp-tabla { width: 100%; border-collapse: collapse; margin: 0; }
.cp-th { padding: 10px 12px 10px 32px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #fff; background: #1f3b57; text-transform: uppercase; font-family: Arial, sans-serif; text-align: left; }
.cp-th--num { width: 44px; padding-left: 32px; }
.cp-th--centro { text-align: center; }
.cp-th--right { text-align: right; padding-right: 32px; }
.cp-tr { border-bottom: 1px solid #f3f4f6; }
.cp-tr:nth-child(even) { background: #f9fafb; }
.cp-td { padding: 13px 12px 13px 32px; font-size: 13px; color: #374151; vertical-align: top; }
.cp-td--num    { color: #9ca3af; font-size: 12px; width: 44px; font-family: Arial, sans-serif; }
.cp-td--centro { text-align: center; font-family: Arial, sans-serif; }
.cp-td--right  { text-align: right; padding-right: 32px; }
.cp-prod-nombre { font-weight: 600; color: #111827; }
.cp-entrega-badge { font-size: 11px; font-weight: 600; font-family: Arial, sans-serif; padding: 3px 10px; border-radius: 2px; }
.cp-entrega-badge.success { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.cp-entrega-badge.danger  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
.cp-bottom { display: flex; gap: 32px; padding: 22px 32px 28px; }
.cp-observaciones { flex: 1; }
.cp-obs-caja { margin-top: 8px; padding: 12px; border: 1px solid #e5e7eb; font-size: 12px; color: #374151; line-height: 1.6; min-height: 64px; font-family: Arial, sans-serif; }
.cp-firmas { display: flex; gap: 28px; align-items: flex-end; flex-shrink: 0; }
.cp-firma-bloque { text-align: center; }
.cp-firma-linea  { width: 130px; border-top: 1px solid #374151; margin-bottom: 6px; }
.cp-firma-nombre { font-size: 11px; color: #374151; font-family: Arial, sans-serif; }
.cp-firma-cargo  { font-size: 11px; font-weight: 600; color: #1f3b57; font-family: Arial, sans-serif; }
.cp-pie { background: #1f3b57; padding: 10px 32px; display: flex; justify-content: space-between; font-size: 10px; color: #93c5fd; font-family: Arial, sans-serif; letter-spacing: .3px; }
.cp-acciones { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 32px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
.btn-primary { background: #1f3b57; color: white; padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; transition: background .2s; font-size: 14px; }
.btn-primary:hover:not(:disabled) { background: #2d5580; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #f3f4f6; color: #374151; padding: 8px 14px; border-radius: 8px; border: 1px solid #e5e7eb; cursor: pointer; transition: background .2s; font-size: 14px; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-icon-row { display: flex; align-items: center; gap: 8px; }

/* Spinner para botón descargar */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.72s linear infinite; }
.action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
</style>