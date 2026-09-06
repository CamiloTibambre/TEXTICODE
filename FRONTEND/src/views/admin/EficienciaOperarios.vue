<template>
  <div class="layout">
    <AppSidebar rol="admin" />

    <main class="main">

      <!-- FONDO DECORATIVO -->
      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- TOAST -->
      <Transition name="toast">
        <div v-if="toast.visible" class="toast" :class="toast.type">
          <svg v-if="toast.type === 'success'" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          </svg>
          <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126Z"/>
          </svg>
          {{ toast.msg }}
        </div>
      </Transition>

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': animVisible }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Gestión de Operarios'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: animVisible ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Rendimiento, productividad y carga de trabajo en tiempo real</p>
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
                placeholder="Buscar operario..."
                @focus="searchFocus = true"
                @blur="searchFocus = false"
              >
            </div>
            <div class="select-wrapper" v-if="vistaActiva === 'eficiencia'">
              <select v-model="filtroRendimiento" class="select">
                <option value="">Todos los rendimientos</option>
                <option value="Alto">Alto</option>
                <option value="Medio">Medio</option>
                <option value="Bajo">Bajo</option>
              </select>
              <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
            <div class="select-wrapper" v-if="vistaActiva === 'carga'">
              <select v-model="filtroCarga" class="select">
                <option value="">Todos los estados</option>
                <option value="sobrecargado">Sobrecargados</option>
                <option value="normal">Normal</option>
                <option value="disponible">Disponibles</option>
              </select>
              <svg class="select-arrow" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
          </div>
          <button class="btn btn-refresh" @click="vistaActiva === 'eficiencia' ? cargarDatos() : cargarVistaCarga()" :disabled="cargando || cargandoCarga">
            <svg class="btn-icon" :class="{ 'spin': cargando || cargandoCarga }" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      <!-- VIEW SWITCH -->
      <div class="view-switch-wrap" :class="{ 'box-visible': animVisible }">
        <div class="view-switch-track">
          <div class="view-switch-slider" :class="{ 'slider-carga': vistaActiva === 'carga' }"></div>
          <button class="switch-btn" :class="{ active: vistaActiva === 'eficiencia' }" @click="vistaActiva = 'eficiencia'">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
            </svg>
            Eficiencia &amp; Rendimiento
          </button>
          <button class="switch-btn" :class="{ active: vistaActiva === 'carga' }" @click="cambiarVistaCarga">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/>
            </svg>
            Carga de Trabajo
            <span class="switch-badge danger" v-if="cargaResumen.sobrecargados > 0">{{ cargaResumen.sobrecargados }} ⚠</span>
          </button>
        </div>
      </div>

      <!-- VISTA EFICIENCIA -->
      <Transition name="vista">
        <section v-if="vistaActiva === 'eficiencia'" key="eficiencia">

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

          <!-- MODAL DETALLE OPERARIO -->
          <Transition name="modal">
            <div v-if="modalDetalle" class="modal" @click.self="cerrarModal">
              <div class="modal-content modal-detalle">
                <span class="close" @click="cerrarModal">×</span>

                <div v-if="operarioActivo" class="detalle-inner">

                  <div class="detalle-header">
                    <div class="detalle-avatar" :style="{ background: avatarBg(operarioActivo.Nombre_Completo), color: avatarColor(operarioActivo.Nombre_Completo) }">
                      {{ iniciales(operarioActivo.Nombre_Completo) }}
                    </div>
                    <div>
                      <div class="detalle-nombre">{{ operarioActivo.Nombre_Completo }}</div>
                      <div class="detalle-usuario">@{{ operarioActivo.Nombre_Usuario }}</div>
                      <span class="badge-rendimiento" :class="operarioActivo.rendimiento?.toLowerCase()">
                        {{ operarioActivo.rendimiento }}
                      </span>
                    </div>
                  </div>

                  <div class="detalle-metricas">
                    <div class="metrica-item">
                      <span class="metrica-label">Prendas / día</span>
                      <span class="metrica-valor azul">{{ operarioActivo.prendas_por_dia }}</span>
                    </div>
                    <div class="metrica-item">
                      <span class="metrica-label">Total producidas</span>
                      <span class="metrica-valor verde">{{ operarioActivo.total_unidades_producidas }}</span>
                    </div>
                    <div class="metrica-item">
                      <span class="metrica-label">Órdenes en retraso</span>
                      <span class="metrica-valor" :class="operarioActivo.ordenes_en_retraso > 0 ? 'rojo' : 'verde'">
                        {{ operarioActivo.ordenes_en_retraso }}
                      </span>
                    </div>
                    <div class="metrica-item">
                      <span class="metrica-label">Completadas</span>
                      <span class="metrica-valor verde">{{ operarioActivo.ordenes_completadas }}</span>
                    </div>
                    <div class="metrica-item">
                      <span class="metrica-label">En proceso</span>
                      <span class="metrica-valor azul">{{ operarioActivo.ordenes_en_proceso }}</span>
                    </div>
                    <div class="metrica-item">
                      <span class="metrica-label">Retrasadas</span>
                      <span class="metrica-valor rojo">{{ operarioActivo.ordenes_retrasadas || operarioActivo.ordenes_en_retraso || 0 }}</span>
                    </div>
                  </div>

                  <!-- HISTORIAL DE RENDIMIENTO -->
                  <div class="historial-section">
                    <div class="historial-header">
                      <div class="historial-titulo">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"/>
                        </svg>
                        Tendencia de rendimiento
                      </div>
                      <div class="historial-tabs">
                        <button
                          v-for="p in ['semana','mes','trimestre']" :key="p"
                          class="tab-btn"
                          :class="{ 'tab-active': periodoHistorial === p }"
                          @click="cargarHistorial(operarioActivo.Id_Usuario, p)"
                        >{{ p }}</button>
                      </div>
                    </div>

                    <div v-if="cargandoHistorial" class="historial-loading">
                      <div class="spinner"></div> Calculando...
                    </div>

                    <div v-else-if="historial" class="historial-body">
                      <div class="tendencia-wrap">
                        <div class="tendencia-icono" :class="historial.tendencia">
                          <svg v-if="historial.tendencia === 'subiendo'" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"/>
                          </svg>
                          <svg v-else-if="historial.tendencia === 'bajando'" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6 9 12.75l4.306-4.306a11.95 11.95 0 0 1 5.814 5.518l2.74 1.22m0 0-5.94 2.281m5.94-2.28-2.28-5.941"/>
                          </svg>
                          <svg v-else width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/>
                          </svg>
                        </div>
                        <div>
                          <div class="tendencia-label" :class="historial.tendencia">
                            {{ historial.tendencia === 'subiendo' ? 'Mejorando' : historial.tendencia === 'bajando' ? 'Bajando' : 'Estable' }}
                          </div>
                          <div class="tendencia-sub">
                            {{ historial.diferencia_prendas > 0 ? '+' : '' }}{{ historial.diferencia_prendas }} prendas/día vs {{ periodoHistorial }} anterior
                          </div>
                        </div>
                        <span class="badge-rendimiento" style="margin-left:auto" :class="historial.actual.rendimiento?.toLowerCase()">
                          {{ historial.actual.rendimiento }} este {{ periodoHistorial }}
                        </span>
                      </div>

                      <div class="historial-comparativa">
                        <div class="periodo-card periodo-actual">
                          <div class="periodo-label">Este {{ periodoHistorial }}</div>
                          <div class="periodo-stat">
                            <span class="periodo-num">{{ historial.actual.prendas_por_dia }}</span>
                            <span class="periodo-unit">prendas/día</span>
                          </div>
                          <div class="periodo-detalle">
                            ✅ {{ historial.actual.completadas }} completadas &nbsp;·&nbsp;
                            ⚠️ {{ historial.actual.retrasos }} retrasos
                          </div>
                        </div>
                        <div class="periodo-vs">vs</div>
                        <div class="periodo-card periodo-anterior">
                          <div class="periodo-label">{{ periodoHistorial === 'semana' ? 'Semana' : periodoHistorial === 'mes' ? 'Mes' : 'Trimestre' }} anterior</div>
                          <div class="periodo-stat">
                            <span class="periodo-num periodo-num-gris">{{ historial.anterior.prendas_por_dia }}</span>
                            <span class="periodo-unit">prendas/día</span>
                          </div>
                          <div class="periodo-detalle">
                            ✅ {{ historial.anterior.completadas }} completadas &nbsp;·&nbsp;
                            ⚠️ {{ historial.anterior.retrasos }} retrasos
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tabla de órdenes con observaciones inline -->
                  <div v-if="operarioActivo.ordenes_detalle?.length" class="detalle-ordenes">
                    <div class="detalle-ordenes-titulo">Órdenes asignadas</div>
                    <table class="tabla-ordenes">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Producto</th>
                          <th>Estado</th>
                          <th>Prioridad</th>
                          <th>Dificultad</th>
                          <th>Avance</th>
                          <th>Fecha límite</th>
                          <th>Obs.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="o in operarioActivo.ordenes_detalle" :key="o.Id_Orden">
                          <tr :class="{ 'orden-retraso': o.vencida }">
                            <td>{{ o.Id_Orden }}</td>
                            <td>{{ o.Producto }}</td>
                            <td><span class="badge-estado" :class="estadoClass(o.Estado)">{{ o.Estado }}</span></td>
                            <td><span class="badge-prioridad" :class="o.Prioridad?.toLowerCase()">{{ o.Prioridad }}</span></td>
                            <td><span class="badge-dificultad" :class="dificultadClass(o.Dificultad)">{{ o.Dificultad || 'Media' }}</span></td>
                            <td>
                              <div class="avance-wrap">
                                <div class="avance-bar">
                                  <div class="avance-fill" :style="{ width: avancePct(o) + '%', background: o.vencida ? '#dc2626' : '#16a34a' }"></div>
                                </div>
                                <span class="avance-txt">{{ o.Unidades_Realizadas }}/{{ o.Unidades }}</span>
                              </div>
                            </td>
                            <td :class="{ 'td-retraso': o.vencida }">
                              {{ formatFecha(o.Fecha_Limite) }}
                              <span v-if="o.vencida" class="retraso-tag">VENCIDA</span>
                            </td>
                            <td>
                              <button
                                class="btn-obs-toggle"
                                :class="{ 'active': ordenObsAbierta === o.Id_Orden }"
                                @click="toggleObsOrden(o)"
                                :title="ordenObsAbierta === o.Id_Orden ? 'Cerrar observaciones' : 'Ver / agregar observaciones'"
                              >
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
                                </svg>
                                <span v-if="obsXOrden[o.Id_Orden]?.length" class="obs-badge-mini">{{ obsXOrden[o.Id_Orden].length }}</span>
                              </button>
                            </td>
                          </tr>
                          <Transition name="obs-panel">
                            <tr v-if="ordenObsAbierta === o.Id_Orden" class="obs-row">
                              <td colspan="8" class="obs-panel-td">
                                <div class="obs-panel">
                                  <div class="obs-panel-header">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
                                    </svg>
                                    Observaciones — Orden #{{ o.Id_Orden }}: {{ o.Producto }}
                                  </div>
                                  <div v-if="cargandoObsOrden" class="obs-loading">Cargando...</div>
                                  <div v-else-if="!obsXOrden[o.Id_Orden]?.length" class="obs-empty-inline">Sin observaciones para esta orden aún.</div>
                                  <div v-else class="obs-lista-inline">
                                    <div v-for="obs in obsXOrden[o.Id_Orden]" :key="obs.Id_Observacion" class="obs-item-inline">
                                      <div class="obs-meta-inline">
                                        <span class="obs-admin-inline">{{ obs.Admin }}</span>
                                        <div class="obs-meta-right">
                                          <span class="obs-fecha-inline">{{ formatFechaObs(obs.Fecha) }}</span>
                                          <button class="btn-obs-eliminar" @click="eliminarObservacion(obs.Id_Observacion, o.Id_Orden)">
                                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                      <p class="obs-texto-inline">{{ obs.Observacion }}</p>
                                    </div>
                                  </div>
                                  <div class="obs-form-inline">
                                    <textarea
                                      v-model="nuevaObsXOrden[o.Id_Orden]"
                                      class="obs-textarea-inline"
                                      :placeholder="`Describe el problema de la orden #${o.Id_Orden}...`"
                                      maxlength="500"
                                      rows="2"
                                    ></textarea>
                                    <div class="obs-form-inline-footer">
                                      <span class="obs-chars">{{ (nuevaObsXOrden[o.Id_Orden] || '').length }}/500</span>
                                      <button
                                        class="btn-obs-guardar-inline"
                                        @click="guardarObservacionOrden(o)"
                                        :disabled="!nuevaObsXOrden[o.Id_Orden]?.trim() || guardandoObsOrden === o.Id_Orden"
                                      >{{ guardandoObsOrden === o.Id_Orden ? 'Guardando...' : 'Guardar' }}</button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </Transition>
                        </template>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="sin-ordenes">Sin órdenes asignadas</div>

                </div>

                <div v-else class="cargando-detalle">
                  <div class="spinner"></div>
                  Cargando...
                </div>

              </div>
            </div>
          </Transition>

          <!-- TABLA PRINCIPAL -->
          <div class="table-box" :class="{ 'box-visible': animVisible }" style="transition-delay:240ms">
            <div class="table-header-bar">
              <div class="table-header-left">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
                </svg>
                Ranking de Operarios
                <span class="count-badge">{{ operariosFiltrados.length }}</span>
              </div>
            </div>

            <div v-if="cargando" class="table-skeleton">
              <div v-for="i in 5" :key="i" class="table-skeleton-row">
                <span class="skeleton-avatar"></span>
                <span class="skeleton-line skeleton-user"></span>
                <span class="skeleton-line skeleton-tag"></span>
                <span class="skeleton-line skeleton-phone"></span>
                <span class="skeleton-line skeleton-date"></span>
                <span class="skeleton-line skeleton-tag"></span>
              </div>
            </div>

            <div v-else-if="error" class="error-state">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
              </svg>
              <p>{{ error }}</p>
              <button class="btn" @click="cargarDatos">Reintentar</button>
            </div>

            <table v-else>
              <thead>
                <tr>
                  <th class="th-rank">#</th>
                  <th class="th-sortable" @click="sortBy('Nombre_Completo')">
                    <span class="th-inner">Operario <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg></span>
                  </th>
                  <th class="th-sortable" @click="sortBy('prendas_por_dia')">
                    <span class="th-inner">Prendas / día <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg></span>
                  </th>
                  <th>Total producidas</th>
                  <th>En retraso</th>
                  <th>Completadas</th>
                  <th>Rendimiento</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                <TransitionGroup name="row">
                  <tr
                    v-for="(op, idx) in operariosOrdenados"
                    :key="op.Id_Usuario"
                    class="table-row"
                    :style="{ animationDelay: `${idx * 40}ms` }"
                  >
                    <td class="td-rank">
                      <span class="rank-num" :class="{ 'rank-gold': idx === 0, 'rank-silver': idx === 1, 'rank-bronze': idx === 2 }">{{ idx + 1 }}</span>
                    </td>
                    <td>
                      <div class="user">
                        <div class="avatar" :style="{ background: avatarBg(op.Nombre_Completo), color: avatarColor(op.Nombre_Completo) }">{{ iniciales(op.Nombre_Completo) }}</div>
                        <div class="user-info">
                          <span class="user-name">{{ op.Nombre_Completo }}</span>
                          <span class="user-handle">@{{ op.Nombre_Usuario }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="prendas-cell">
                        <span class="prendas-num">{{ op.prendas_por_dia }}</span>
                        <div class="mini-bar-wrap">
                          <div class="mini-bar">
                            <div class="mini-bar-fill" :style="{ width: miniBarPct(op.prendas_por_dia) + '%', background: rendimientoColor(op.rendimiento) }"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span class="num-cell">{{ op.total_unidades_producidas }}</span></td>
                    <td>
                      <span class="retraso-cell" :class="{ 'retraso-activo': op.ordenes_en_retraso > 0 }">
                        <svg v-if="op.ordenes_en_retraso > 0" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126Z"/>
                        </svg>
                        {{ op.ordenes_en_retraso }}
                      </span>
                    </td>
                    <td><span class="completadas-cell">{{ op.ordenes_completadas }}</span></td>
                    <td><span class="badge-rendimiento" :class="op.rendimiento?.toLowerCase()">{{ op.rendimiento }}</span></td>
                    <td>
                      <button class="action-btn" @click="verDetalle(op.Id_Usuario)">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </TransitionGroup>
                <tr v-if="operariosOrdenados.length === 0 && !cargando">
                  <td colspan="8" class="empty-state">
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z"/>
                    </svg>
                    <p>No se encontraron operarios</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </section>
      </Transition>

      <!-- VISTA CARGA DE TRABAJO -->
      <Transition name="vista">
        <section v-if="vistaActiva === 'carga'" key="carga" class="carga-wrap">

          <div v-if="cargandoCarga" class="stats">
            <div v-for="i in 4" :key="i" class="stat-card skeleton-card">
              <div class="skeleton-line skeleton-sm"></div>
              <div class="skeleton-line skeleton-lg"></div>
            </div>
          </div>
          <div v-else class="stats stats-visible">
            <div class="stat-card" style="transition-delay:0ms">
              <div class="stat-accent" style="background:#1f3a52"></div>
              <div class="stat-icon-bg" style="color:#1f3a52">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" :d="ICON_USERS"/></svg>
              </div>
              <h3>Total Operarios</h3>
              <p style="color:#1f3a52">{{ cargaResumen.total_operarios || 0 }}</p>
            </div>
            <div class="stat-card" style="transition-delay:80ms">
              <div class="stat-accent" style="background:#16a34a"></div>
              <div class="stat-icon-bg" style="color:#16a34a">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              </div>
              <h3>Disponibles</h3>
              <p style="color:#16a34a">{{ cargaResumen.disponibles || 0 }}</p>
            </div>
            <div class="stat-card" style="transition-delay:160ms">
              <div class="stat-accent" style="background:#2563eb"></div>
              <div class="stat-icon-bg" style="color:#2563eb">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
              </div>
              <h3>Carga Normal</h3>
              <p style="color:#2563eb">{{ cargaResumen.normales || 0 }}</p>
            </div>
            <div class="stat-card" style="transition-delay:240ms">
              <div class="stat-accent" style="background:#dc2626"></div>
              <div class="stat-icon-bg" style="color:#dc2626">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" :d="ICON_ALERT"/></svg>
              </div>
              <h3>Sobrecargados</h3>
              <p style="color:#dc2626">{{ cargaResumen.sobrecargados || 0 }}</p>
            </div>
          </div>

          <div class="table-box box-visible" style="margin-bottom:16px">
            <div class="table-header-bar">
              <div class="table-header-left">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/>
                </svg>
                Carga por operario
                <span class="count-badge">{{ cargaOperariosFiltrados.length }}</span>
              </div>
              <div class="umbrales-info">
                <span class="umbral-chip disponible">≤{{ umbrales.limite_disponible }} → Disponible</span>
                <span class="umbral-chip sobrecargado">&gt;{{ umbrales.limite_sobrecarga }} → Sobrecargado</span>
              </div>
            </div>

            <div v-if="cargandoCarga" class="table-skeleton">
              <div v-for="i in 4" :key="i" class="table-skeleton-row">
                <span class="skeleton-avatar"></span>
                <span class="skeleton-line skeleton-user"></span>
                <span class="skeleton-line skeleton-tag"></span>
                <span class="skeleton-line skeleton-phone"></span>
                <span class="skeleton-line skeleton-tag"></span>
              </div>
            </div>

            <table v-else>
              <thead>
                <tr>
                  <th>Operario</th>
                  <th>Órdenes activas</th>
                  <th>Vencidas</th>
                  <th>Alta prioridad</th>
                  <th>Barra de carga</th>
                  <th>Estado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="op in cargaOperariosFiltrados"
                  :key="op.Id_Usuario"
                  class="table-row"
                  :class="{ 'fila-sobrecarga': op.estado_carga === 'sobrecargado' }"
                >
                  <td>
                    <div class="user">
                      <div class="avatar" :style="{ background: avatarBg(op.Nombre_Completo), color: avatarColor(op.Nombre_Completo) }">{{ iniciales(op.Nombre_Completo) }}</div>
                      <div class="user-info">
                        <span class="user-name">{{ op.Nombre_Completo }}</span>
                        <span class="user-handle">@{{ op.Nombre_Usuario }}</span>
                      </div>
                    </div>
                  </td>
                  <td><span class="num-cell" :style="{ color: cargaColor(op.estado_carga) }">{{ op.ordenes_activas }}</span></td>
                  <td>
                    <span class="retraso-cell" :class="{ 'retraso-activo': op.ordenes_vencidas > 0 }">
                      <svg v-if="op.ordenes_vencidas > 0" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126Z"/>
                      </svg>
                      {{ op.ordenes_vencidas }}
                    </span>
                  </td>
                  <td>
                    <span v-if="op.ordenes_alta_prioridad > 0" class="badge-prioridad alta">{{ op.ordenes_alta_prioridad }} Alta</span>
                    <span v-else class="num-cell" style="color:#6b7280">0</span>
                  </td>
                  <td style="min-width:120px">
                    <div class="carga-bar-wrap">
                      <div class="carga-bar">
                        <div class="carga-bar-fill" :style="{ width: cargaBarPct(op.ordenes_activas) + '%', background: cargaColor(op.estado_carga) }"></div>
                      </div>
                      <span class="avance-txt">{{ op.ordenes_activas }}/{{ umbrales.limite_sobrecarga }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge-carga" :class="op.estado_carga">{{ estadoCargaLabel(op.estado_carga) }}</span>
                  </td>
                  <td>
                    <button class="action-btn" @click="verDetalleCarga(op)" title="Ver órdenes activas">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr v-if="cargaOperariosFiltrados.length === 0 && !cargandoCarga">
                  <td colspan="7" class="empty-state">
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>
                    </svg>
                    <p>No se encontraron operarios con ese filtro</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- MODAL DETALLE CARGA -->
          <Transition name="modal">
            <div v-if="modalCarga" class="modal" @click.self="modalCarga = false">
              <div class="modal-content">
                <span class="close" @click="modalCarga = false">×</span>
                <div v-if="cargaDetalle" class="detalle-inner">
                  <div class="detalle-header">
                    <div class="detalle-avatar" :style="{ background: avatarBg(cargaDetalle.Nombre_Completo), color: avatarColor(cargaDetalle.Nombre_Completo) }">
                      {{ iniciales(cargaDetalle.Nombre_Completo) }}
                    </div>
                    <div>
                      <div class="detalle-nombre">{{ cargaDetalle.Nombre_Completo }}</div>
                      <div class="detalle-usuario">@{{ cargaDetalle.Nombre_Usuario }}</div>
                      <span class="badge-carga" :class="cargaDetalle.estado_carga">{{ estadoCargaLabel(cargaDetalle.estado_carga) }}</span>
                    </div>
                  </div>
                  <div class="detalle-metricas" style="margin-bottom:20px">
                    <div class="metrica-item">
                      <span class="metrica-label">Órdenes activas</span>
                      <span class="metrica-valor" :style="{ color: cargaColor(cargaDetalle.estado_carga) }">{{ cargaDetalle.ordenes_activas }}</span>
                    </div>
                    <div class="metrica-item">
                      <span class="metrica-label">Vencidas</span>
                      <span class="metrica-valor" :class="cargaDetalle.ordenes_vencidas > 0 ? 'rojo' : 'verde'">{{ cargaDetalle.ordenes_vencidas }}</span>
                    </div>
                    <div class="metrica-item">
                      <span class="metrica-label">Alta prioridad</span>
                      <span class="metrica-valor amarillo">{{ cargaDetalle.ordenes_alta_prioridad }}</span>
                    </div>
                  </div>

                  <div v-if="cargandoCargaDetalle" class="cargando-detalle"><div class="spinner"></div> Cargando órdenes...</div>
                  <div v-else-if="cargaDetalleOrdenes.length" class="detalle-ordenes">
                    <div class="detalle-ordenes-titulo">Órdenes activas</div>
                    <table class="tabla-ordenes">
                      <thead>
                        <tr>
                          <th>#</th><th>Producto</th><th>Estado</th><th>Prioridad</th><th>Avance</th><th>Fecha límite</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="o in cargaDetalleOrdenes" :key="o.Id_Orden" :class="{ 'orden-retraso': o.vencida }">
                          <td>{{ o.Id_Orden }}</td>
                          <td>{{ o.Producto }}</td>
                          <td><span class="badge-estado" :class="estadoClass(o.Estado)">{{ o.Estado }}</span></td>
                          <td><span class="badge-prioridad" :class="o.Prioridad?.toLowerCase()">{{ o.Prioridad }}</span></td>
                          <td>
                            <div class="avance-wrap">
                              <div class="avance-bar">
                                <div class="avance-fill" :style="{ width: avancePct(o) + '%', background: o.vencida ? '#dc2626' : '#16a34a' }"></div>
                              </div>
                              <span class="avance-txt">{{ o.Unidades_Realizadas }}/{{ o.Unidades }}</span>
                            </div>
                          </td>
                          <td :class="{ 'td-retraso': o.vencida }">
                            {{ formatFecha(o.Fecha_Limite) }}
                            <span v-if="o.vencida" class="retraso-tag">VENCIDA</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="sin-ordenes">Sin órdenes activas</div>
                </div>
              </div>
            </div>
          </Transition>

        </section>
      </Transition>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import {
  getEficienciaOperarios,
  getEficienciaOperario,
  getCargaTrabajo,
} from '../../services/api.js'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

// ── ESTADO GENERAL ──
const animVisible       = ref(false)
const cargando          = ref(true)
const cargandoCarga     = ref(false)
const error             = ref('')
const searchFocus       = ref(false)
const busqueda          = ref('')
const filtroRendimiento = ref('')
const filtroCarga       = ref('')
const operarios         = ref([])
const vistaActiva       = ref('eficiencia')

// ── ESTADO EFICIENCIA ──
const modalDetalle      = ref(false)
const operarioActivo    = ref(null)
const sortKey           = ref('prendas_por_dia')
const sortDir           = ref(-1)
const ordenObsAbierta   = ref(null)
const obsXOrden         = reactive({})
const nuevaObsXOrden    = reactive({})
const cargandoObsOrden  = ref(false)
const guardandoObsOrden = ref(null)
const historial         = ref(null)
const cargandoHistorial = ref(false)
const periodoHistorial  = ref('semana')

// ── ESTADO CARGA ──
const cargaOperarios       = ref([])
const cargaResumen         = ref({})
const modalCarga           = ref(false)
const cargaDetalle         = ref(null)
const cargaDetalleOrdenes  = ref([])
const cargandoCargaDetalle = ref(false)
const umbrales             = reactive({ limite_sobrecarga: 5, limite_disponible: 2 })

const toast = ref({ visible: false, msg: '', type: 'success' })

const BASE    = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const API_KEY = import.meta.env.VITE_API_KEY || ''

// ── TOAST ──
function mostrarToast(msg, type = 'success') {
  toast.value = { visible: true, msg, type }
  setTimeout(() => toast.value.visible = false, 2800)
}

// ── FIX: Normalizar números que PostgreSQL devuelve como string ──
function normalizarOperario(op) {
  return {
    ...op,
    prendas_por_dia:            Number(op.prendas_por_dia)            || 0,
    total_unidades_producidas:  Number(op.total_unidades_producidas)   || 0,
    ordenes_en_retraso:         Number(op.ordenes_en_retraso)          || 0,
    ordenes_completadas:        Number(op.ordenes_completadas)         || 0,
    ordenes_en_proceso:         Number(op.ordenes_en_proceso)          || 0,
    ordenes_retrasadas:         Number(op.ordenes_retrasadas || op.ordenes_en_retraso) || 0,
    ordenes_con_problema:       Number(op.ordenes_con_problema)        || 0,
  }
}

// ── CARGA EFICIENCIA ──
async function cargarDatos() {
  cargando.value = true
  error.value = ''
  try {
    const data = await getEficienciaOperarios()
    // FIX: convertir strings de pg a números reales
    operarios.value = data.map(normalizarOperario)
  } catch (e) {
    error.value = e.message || 'Error al cargar los datos de eficiencia'
    mostrarToast(error.value, 'danger')
  } finally {
    cargando.value = false
  }
}

// ── CARGA TRABAJO ──
async function cargarVistaCarga() {
  cargandoCarga.value = true
  try {
    const carga = await getCargaTrabajo()
    cargaOperarios.value = carga.data || []
    cargaResumen.value   = carga.resumen || {}
  } catch (e) {
    mostrarToast(e.message || 'Error cargando la vista de carga', 'danger')
  } finally {
    cargandoCarga.value = false
  }
}

async function cambiarVistaCarga() {
  vistaActiva.value = 'carga'
  if (!cargaOperarios.value.length) await cargarVistaCarga()
}

async function verDetalleCarga(op) {
  cargaDetalle.value         = op
  cargaDetalleOrdenes.value  = []
  modalCarga.value           = true
  cargandoCargaDetalle.value = true
  try {
    const res  = await fetch(`${BASE}/carga-trabajo/operarios/${op.Id_Usuario}`, { headers: { 'x-api-key': API_KEY } })
    const json = await res.json()
    if (json.ok) cargaDetalleOrdenes.value = json.data?.ordenes_activas_detalle || []
  } catch {
    mostrarToast('Error al cargar detalle de carga', 'danger')
  } finally {
    cargandoCargaDetalle.value = false
  }
}

onMounted(async () => {
  await cargarDatos()
  setTimeout(() => { animVisible.value = true }, 50)
})

// ── VER DETALLE EFICIENCIA ──
async function verDetalle(id) {
  operarioActivo.value   = null
  ordenObsAbierta.value  = null
  historial.value        = null
  periodoHistorial.value = 'semana'
  modalDetalle.value     = true
  try {
    const data = await getEficienciaOperario(id)
    // FIX: normalizar también el detalle individual
    operarioActivo.value = normalizarOperario(data)
    cargarHistorial(id, 'semana')
  } catch (e) {
    mostrarToast('Error al cargar el detalle', 'danger')
    modalDetalle.value = false
  }
}

function cerrarModal() {
  modalDetalle.value    = false
  operarioActivo.value  = null
  ordenObsAbierta.value = null
  historial.value       = null
}

// ── HISTORIAL ──
async function cargarHistorial(id, periodo) {
  cargandoHistorial.value = true
  periodoHistorial.value  = periodo
  historial.value         = null
  try {
    const res  = await fetch(`${BASE}/eficiencia/operarios/${id}/historial?periodo=${periodo}`, { headers: { 'x-api-key': API_KEY } })
    const json = await res.json()
    if (json.ok) historial.value = json.data
  } catch { mostrarToast('Error al cargar el historial', 'danger') }
  finally { cargandoHistorial.value = false }
}

// ── OBSERVACIONES ──
async function toggleObsOrden(orden) {
  const id = orden.Id_Orden
  if (ordenObsAbierta.value === id) { ordenObsAbierta.value = null; return }
  ordenObsAbierta.value = id
  if (obsXOrden[id] !== undefined) return
  cargandoObsOrden.value = true
  try {
    const res  = await fetch(`${BASE}/eficiencia/observaciones/${operarioActivo.value.Id_Usuario}?Id_Orden=${id}`, { headers: { 'x-api-key': API_KEY } })
    const json = await res.json()
    obsXOrden[id] = json.data || []
  } catch { obsXOrden[id] = [] }
  finally { cargandoObsOrden.value = false }
}

async function guardarObservacionOrden(orden) {
  const id    = orden.Id_Orden
  const texto = nuevaObsXOrden[id]?.trim()
  if (!texto || !operarioActivo.value) return
  guardandoObsOrden.value = id
  try {
    const res = await fetch(`${BASE}/eficiencia/observaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ Id_Operario: operarioActivo.value.Id_Usuario, Id_Admin: auth.idUsuario, Id_Orden: id, Observacion: texto })
    })
    if (!res.ok) throw new Error()
    nuevaObsXOrden[id] = ''
    const res2  = await fetch(`${BASE}/eficiencia/observaciones/${operarioActivo.value.Id_Usuario}?Id_Orden=${id}`, { headers: { 'x-api-key': API_KEY } })
    const json2 = await res2.json()
    obsXOrden[id] = json2.data || []
    mostrarToast(`Observación guardada en orden #${id}`)
  } catch { mostrarToast('Error al guardar la observación', 'danger') }
  finally { guardandoObsOrden.value = null }
}

async function eliminarObservacion(idObservacion, idOrden) {
  if (!confirm('¿Eliminar esta observación? Esta acción no se puede deshacer.')) return
  try {
    const res = await fetch(`${BASE}/eficiencia/observaciones/${idObservacion}`, { method: 'DELETE', headers: { 'x-api-key': API_KEY } })
    if (!res.ok) throw new Error()
    obsXOrden[idOrden] = obsXOrden[idOrden].filter(o => o.Id_Observacion !== idObservacion)
    if (operarioActivo.value && obsXOrden[idOrden].length === 0) {
      const orden = operarioActivo.value.ordenes_detalle?.find(o => o.Id_Orden === idOrden)
      if (orden) orden.tiene_problema = false
    }
    mostrarToast('Observación eliminada')
  } catch { mostrarToast('Error al eliminar la observación', 'danger') }
}

// ── ORDENAMIENTO ──
function sortBy(key) {
  if (sortKey.value === key) sortDir.value *= -1
  else { sortKey.value = key; sortDir.value = -1 }
}

// ── FILTROS COMPUTADOS ──
const operariosFiltrados = computed(() =>
  operarios.value.filter(op => {
    const q = busqueda.value.toLowerCase()
    return (op.Nombre_Completo?.toLowerCase().includes(q) || op.Nombre_Usuario?.toLowerCase().includes(q))
        && (!filtroRendimiento.value || op.rendimiento === filtroRendimiento.value)
  })
)

const operariosOrdenados = computed(() =>
  [...operariosFiltrados.value].sort((a, b) => {
    const va = a[sortKey.value] ?? 0; const vb = b[sortKey.value] ?? 0
    return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir.value
  })
)

const cargaOperariosFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase()
  return cargaOperarios.value.filter(op =>
    (!q || op.Nombre_Completo?.toLowerCase().includes(q) || op.Nombre_Usuario?.toLowerCase().includes(q))
    && (!filtroCarga.value || op.estado_carga === filtroCarga.value)
  )
})

// ── STATS COUNTS ──
const statsCounts = computed(() => ({
  total:    operarios.value.length,
  alto:     operarios.value.filter(o => o.rendimiento === 'Alto').length,
  bajo:     operarios.value.filter(o => o.rendimiento === 'Bajo').length,
  retrasos: operarios.value.reduce((acc, o) => acc + (o.ordenes_en_retraso || 0), 0),
}))

const ICON_USERS  = 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'
const ICON_TROPHY = 'M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0'
const ICON_ALERT  = 'M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126ZM12 15.75h.007v.008H12v-.008Z'
const ICON_DOWN   = 'M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181'

const statsCards = computed(() => [
  { label: 'Total Operarios',    display: statsCounts.value.total,    accentColor: '#1f3a52', iconPath: ICON_USERS  },
  { label: 'Rendimiento Alto',   display: statsCounts.value.alto,     accentColor: '#16a34a', iconPath: ICON_TROPHY },
  { label: 'Órdenes en Retraso', display: statsCounts.value.retrasos, accentColor: '#dc2626', iconPath: ICON_ALERT  },
  { label: 'Rendimiento Bajo',   display: statsCounts.value.bajo,     accentColor: '#d97706', iconPath: ICON_DOWN   },
])

// ── HELPERS CARGA ──
function cargaColor(estado) {
  if (estado === 'disponible')   return '#16a34a'
  if (estado === 'sobrecargado') return '#dc2626'
  return '#2563eb'
}
function estadoCargaLabel(estado) {
  return { disponible: 'Disponible', normal: 'Normal', sobrecargado: 'Sobrecargado' }[estado] || estado
}
function cargaBarPct(activas) {
  return Math.min(100, Math.round((activas / (umbrales.limite_sobrecarga + 2)) * 100))
}

// ── HELPERS VISUALES ──
const PALETTES = [
  { bg: '#dbeafe', color: '#1d4ed8' }, { bg: '#fce7f3', color: '#be185d' },
  { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef9c3', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' }, { bg: '#fee2e2', color: '#991b1b' },
]
function avatarBg(n)    { return PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length].bg }
function avatarColor(n) { return PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length].color }
function iniciales(n)   { return (n || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() }

const maxPrendas = computed(() => Math.max(...operarios.value.map(o => o.prendas_por_dia || 0), 1))
function miniBarPct(val) { return Math.min(100, (val / maxPrendas.value) * 100) }
function avancePct(o)    { return o.Unidades ? Math.min(100, Math.round((o.Unidades_Realizadas / o.Unidades) * 100)) : 0 }

function rendimientoColor(r) {
  if (r === 'Alto')  return '#16a34a'
  if (r === 'Medio') return '#2563eb'
  return '#dc2626'
}
function estadoClass(estado) {
  return { 'Completada': 'completada', 'En Proceso': 'en-proceso', 'Pausado': 'pausado' }[estado] || ''
}
function dificultadClass(d) {
  return { 'Alta': 'dif-alta', 'Media': 'dif-media', 'Baja': 'dif-baja' }[d] || 'dif-media'
}
function formatFecha(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatFechaObs(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
.orb-2 { width: 400px; height: 400px; background: #16a34a; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #2563eb; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

/* ── HERO ── */
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
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
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
.hero-actions-wrap { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex-shrink: 0; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-box { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: white; border: 1.5px solid #e5e7eb; border-radius: 10px; transition: border-color 0.2s, box-shadow 0.2s; width: 220px; }
.search-box.search-focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.search-ico { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font-size: 14px; color: #374151; background: transparent; }
.search-box input::placeholder { color: #9ca3af; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.select { padding: 9px 32px 9px 12px; border-radius: 10px; border: 1.5px solid #e5e7eb; font-size: 14px; background: white; appearance: none; -webkit-appearance: none; outline: none; cursor: pointer; transition: border-color 0.2s; }
.select:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.select-arrow { position: absolute; right: 10px; width: 14px; height: 14px; color: #6b7280; pointer-events: none; }
.btn { display: flex; align-items: center; gap: 8px; background: #1f3a52; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: background 0.2s, transform 0.1s; flex-shrink: 0; }
.btn:hover:not(:disabled) { background: #162b3c; transform: translateY(-1px); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; }
.spin { animation: spinIcon 0.8s linear infinite; }
@keyframes spinIcon { to { transform: rotate(360deg); } }

/* ── VIEW SWITCH ── */
.view-switch-wrap { margin-bottom: 22px; opacity: 0; transform: translateY(10px); transition: opacity 0.4s ease, transform 0.4s ease; }
.view-switch-wrap.box-visible { opacity: 1; transform: translateY(0); }
.view-switch-track { position: relative; display: flex; background: white; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 4px; gap: 4px; box-shadow: 0 2px 12px rgba(31,58,82,0.08); width: 100%; }
.view-switch-slider { position: absolute; top: 4px; left: 4px; width: calc(50% - 6px); bottom: 4px; background: #1f3a52; border-radius: 10px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 8px rgba(31,58,82,0.3); }
.view-switch-slider.slider-carga { transform: translateX(calc(100% + 4px)); }
.switch-btn { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 24px; border-radius: 10px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #9ca3af; cursor: pointer; transition: color 0.25s ease; white-space: nowrap; flex: 1; }
.switch-btn svg { transition: stroke 0.25s ease; flex-shrink: 0; }
.switch-btn.active { color: white; }
.switch-btn.active svg { stroke: white; }
.switch-btn:not(.active):hover { color: #374151; }
.switch-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; font-size: 11px; font-weight: 700; background: rgba(255,255,255,0.25); color: white; line-height: 1; }
.switch-btn:not(.active) .switch-badge { background: #f1f5f9; color: #6b7280; }
.switch-badge.danger { background: #dc2626; color: white; }
.switch-btn.active .switch-badge.danger { background: rgba(220,38,38,0.85); }

/* ── TRANSICIÓN DE VISTAS ── */
.vista-enter-active { transition: all 0.3s ease; }
.vista-leave-active { transition: all 0.2s ease; position: absolute; width: 100%; }
.vista-enter-from { opacity: 0; transform: translateY(12px); }
.vista-leave-to   { opacity: 0; transform: translateY(-8px); }

/* ── STATS ── */
.stats { display: flex; gap: 18px; margin-bottom: 24px; }
.stat-card { background: white; flex: 1; padding: 20px 20px 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s; }
.stats-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-3px) !important; }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: 0.07; }
.stat-icon-bg svg { width: 52px; height: 52px; }
.stat-card h3 { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 10px; }
.stat-card p { font-size: 30px; font-weight: 800; margin: 0; line-height: 1; }
.skeleton-card { pointer-events: none; min-height: 90px; }
.skeleton-line { display: block; border-radius: 999px; background: #e5e7eb; animation: shimmer 1.3s ease-in-out infinite; }
@keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.skeleton-sm { width: 45%; height: 12px; margin-bottom: 16px; }
.skeleton-lg { width: 70%; height: 30px; }

/* ── TABLA BOX ── */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
.umbrales-info { display: flex; gap: 8px; flex-wrap: wrap; }
.umbral-chip { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
.umbral-chip.disponible { background: #dcfce7; color: #15803d; }
.umbral-chip.sobrecargado { background: #fee2e2; color: #b91c1c; }

/* ── TABLA ── */
table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; padding: 13px 18px; white-space: nowrap; }
.th-rank { width: 48px; text-align: center; }
.th-sortable { cursor: pointer; user-select: none; }
.th-sortable:hover { color: #1f3a52; }
.th-inner { display: inline-flex; align-items: center; gap: 6px; }
.sort-neutral { opacity: 0.35; }
td { padding: 14px 18px; font-size: 14px; border-top: 1px solid #f1f5f9; }
.table-row { transition: background 0.18s; animation: rowSlideIn 0.35s ease both; }
.table-row:hover td { background: #f8fafc; }
.fila-sobrecarga td { background: #fff8f8 !important; }
.fila-sobrecarga:hover td { background: #fee2e2 !important; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
.row-enter-active { transition: all 0.3s ease; }
.row-leave-active { transition: all 0.3s ease; }
.row-enter-from   { opacity: 0; transform: translateY(-10px); }
.row-leave-to     { opacity: 0; transform: translateX(20px); }
.td-rank { text-align: center; }
.rank-num { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; font-size: 12px; font-weight: 700; background: #f1f5f9; color: #6b7280; }
.rank-gold   { background: #fef3c7; color: #92400e; }
.rank-silver { background: #f1f5f9; color: #475569; }
.rank-bronze { background: #fde8d4; color: #9a3412; }
.user { display: flex; align-items: center; gap: 10px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 14px; color: #111827; }
.user-handle { font-size: 12px; color: #6b7280; }
.prendas-cell { display: flex; flex-direction: column; gap: 4px; }
.prendas-num { font-size: 15px; font-weight: 700; color: #111827; }
.mini-bar-wrap { width: 80px; }
.mini-bar { height: 4px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
.mini-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.num-cell { font-size: 14px; font-weight: 600; color: #374151; }
.retraso-cell { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #6b7280; }
.retraso-activo { color: #dc2626; }
.completadas-cell { font-weight: 600; color: #16a34a; }

/* ── BARRA CARGA ── */
.carga-bar-wrap { display: flex; align-items: center; gap: 8px; }
.carga-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 999px; overflow: hidden; min-width: 70px; }
.carga-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }

/* ── BADGES ── */
.badge-rendimiento { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-rendimiento.alto  { background: #dcfce7; color: #15803d; }
.badge-rendimiento.medio { background: #dbeafe; color: #1d4ed8; }
.badge-rendimiento.bajo  { background: #fee2e2; color: #b91c1c; }
.badge-carga { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-carga.disponible   { background: #dcfce7; color: #15803d; }
.badge-carga.normal       { background: #dbeafe; color: #1d4ed8; }
.badge-carga.sobrecargado { background: #fee2e2; color: #b91c1c; }
.badge-dificultad { padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.dif-alta  { background: #fce7f3; color: #9d174d; }
.dif-media { background: #ede9fe; color: #5b21b6; }
.dif-baja  { background: #ecfdf5; color: #065f46; }
.badge-estado { padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge-estado.completada { background: #dcfce7; color: #15803d; }
.badge-estado.en-proceso { background: #dbeafe; color: #1d4ed8; }
.badge-estado.pausado    { background: #fef9c3; color: #92400e; }
.badge-prioridad { padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge-prioridad.alta  { background: #fee2e2; color: #b91c1c; }
.badge-prioridad.media { background: #fef9c3; color: #92400e; }
.badge-prioridad.baja  { background: #f3f4f6; color: #374151; }

/* ── ACCIONES ── */
.action-btn { width: 32px; height: 32px; border-radius: 7px; border: none; background: #1f3a52; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.15s; }
.action-btn:hover { background: #2d5580; transform: scale(1.07); }

/* ── SKELETON ── */
.table-skeleton { padding: 18px; display: grid; gap: 12px; }
.table-skeleton-row { display: grid; grid-template-columns: 34px 1.6fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr; align-items: center; gap: 16px; padding: 14px 10px; }
.skeleton-avatar { display: block; width: 34px; height: 34px; border-radius: 999px; background: #e5e7eb; animation: shimmer 1.3s ease-in-out infinite; }
.skeleton-user  { width: 72%; height: 16px; }
.skeleton-tag   { width: 90px; height: 14px; }
.skeleton-phone { width: 70px; height: 14px; }
.skeleton-date  { width: 80px; height: 14px; }

/* ── EMPTY / ERROR ── */
.empty-state, .error-state { text-align: center; padding: 48px 20px; color: #9ca3af; }
.empty-state svg, .error-state svg { margin: 0 auto 12px; display: block; opacity: 0.4; }
.empty-state p, .error-state p { font-size: 14px; margin: 0 0 12px; }
.error-state { color: #dc2626; }

/* ── MODAL ── */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; width: 100%; max-width: 780px; max-height: 90vh; overflow-y: auto; padding: 30px; border-radius: 16px; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
.close { position: absolute; top: 16px; right: 20px; font-size: 22px; cursor: pointer; color: #9ca3af; background: none; border: none; transition: color 0.15s; }
.close:hover { color: #374151; }
.detalle-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.detalle-avatar { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; flex-shrink: 0; }
.detalle-nombre { font-size: 18px; font-weight: 700; color: #111827; }
.detalle-usuario { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.detalle-metricas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.metrica-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.metrica-label { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
.metrica-valor { font-size: 22px; font-weight: 800; }
.metrica-valor.azul    { color: #2563eb; }
.metrica-valor.verde   { color: #16a34a; }
.metrica-valor.rojo    { color: #dc2626; }
.metrica-valor.amarillo { color: #d97706; }
.detalle-ordenes-titulo { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; }
.tabla-ordenes { width: 100%; border-collapse: collapse; font-size: 13px; }
.tabla-ordenes th { text-align: left; padding: 9px 12px; background: #f9fafb; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
.tabla-ordenes td { padding: 10px 12px; border-top: 1px solid #f1f5f9; vertical-align: middle; }
.orden-retraso td { background: #fff5f5; }
.td-retraso { color: #dc2626; font-weight: 600; }
.retraso-tag { display: inline-block; background: #dc2626; color: white; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-left: 4px; vertical-align: middle; }
.avance-wrap { display: flex; align-items: center; gap: 6px; }
.avance-bar  { flex: 1; height: 5px; background: #e5e7eb; border-radius: 999px; overflow: hidden; min-width: 50px; }
.avance-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.avance-txt  { font-size: 11px; color: #6b7280; white-space: nowrap; }
.sin-ordenes { text-align: center; padding: 30px; color: #9ca3af; font-size: 14px; }
.cargando-detalle { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 60px; color: #6b7280; }
.spinner { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spinIcon 0.7s linear infinite; }

/* ── OBSERVACIONES ── */
.btn-obs-toggle { position: relative; width: 30px; height: 30px; border-radius: 7px; border: 1.5px solid #e5e7eb; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: all 0.15s; }
.btn-obs-toggle:hover { border-color: #1f3a52; color: #1f3a52; background: #f0f4f8; }
.btn-obs-toggle.active { background: #1f3a52; color: white; border-color: #1f3a52; }
.obs-badge-mini { position: absolute; top: -5px; right: -5px; background: #dc2626; color: white; font-size: 9px; font-weight: 700; min-width: 14px; height: 14px; border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 3px; line-height: 1; }
.obs-row td { padding: 0 !important; border-top: none !important; }
.obs-panel-td { padding: 0 !important; }
.obs-panel { background: #f8fafc; border-top: 2px solid #1f3a52; border-bottom: 1px solid #e5e7eb; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.obs-panel-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #1f3a52; }
.obs-loading { font-size: 12px; color: #9ca3af; }
.obs-empty-inline { font-size: 12px; color: #9ca3af; font-style: italic; }
.obs-lista-inline { display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; }
.obs-item-inline { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
.obs-meta-inline { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.obs-meta-right { display: flex; align-items: center; gap: 6px; }
.obs-admin-inline { font-size: 11px; font-weight: 700; color: #1f3a52; }
.obs-fecha-inline { font-size: 10px; color: #9ca3af; }
.obs-texto-inline { font-size: 12px; color: #374151; margin: 0; line-height: 1.5; }
.btn-obs-eliminar { width: 22px; height: 22px; border-radius: 5px; border: 1px solid #fecaca; background: #fff5f5; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #dc2626; transition: all 0.15s; flex-shrink: 0; }
.btn-obs-eliminar:hover { background: #fee2e2; border-color: #dc2626; }
.obs-form-inline { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
.obs-textarea-inline { border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 9px 12px; font-size: 12px; color: #374151; resize: vertical; outline: none; transition: border-color 0.2s; font-family: inherit; background: white; }
.obs-textarea-inline:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.08); }
.obs-form-inline-footer { display: flex; align-items: center; justify-content: space-between; }
.obs-chars { font-size: 10px; color: #9ca3af; }
.btn-obs-guardar-inline { background: #1f3a52; color: white; border: none; border-radius: 7px; padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-obs-guardar-inline:hover:not(:disabled) { background: #162d42; }
.btn-obs-guardar-inline:disabled { opacity: 0.5; cursor: not-allowed; }
.obs-panel-enter-active { transition: all 0.22s ease; }
.obs-panel-leave-active { transition: all 0.18s ease; }
.obs-panel-enter-from   { opacity: 0; transform: translateY(-6px); }
.obs-panel-leave-to     { opacity: 0; transform: translateY(-6px); }

/* ── HISTORIAL ── */
.historial-section { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; }
.historial-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
.historial-titulo { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #1f3a52; }
.historial-tabs { display: flex; gap: 4px; }
.tab-btn { padding: 4px 12px; border-radius: 999px; border: 1.5px solid #e5e7eb; background: white; font-size: 11px; font-weight: 600; color: #6b7280; cursor: pointer; text-transform: capitalize; transition: all 0.15s; }
.tab-btn:hover { border-color: #1f3a52; color: #1f3a52; }
.tab-btn.tab-active { background: #1f3a52; color: white; border-color: #1f3a52; }
.historial-loading { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9ca3af; padding: 8px 0; }
.tendencia-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; }
.tendencia-icono { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tendencia-icono.subiendo { background: #dcfce7; color: #16a34a; }
.tendencia-icono.bajando  { background: #fee2e2; color: #dc2626; }
.tendencia-icono.estable  { background: #f1f5f9; color: #6b7280; }
.tendencia-label { font-size: 14px; font-weight: 700; }
.tendencia-label.subiendo { color: #16a34a; }
.tendencia-label.bajando  { color: #dc2626; }
.tendencia-label.estable  { color: #6b7280; }
.tendencia-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.historial-comparativa { display: flex; align-items: center; gap: 10px; }
.periodo-card { flex: 1; border-radius: 10px; padding: 12px 14px; border: 1.5px solid #e5e7eb; }
.periodo-actual   { background: white; border-color: #1f3a52; }
.periodo-anterior { background: #f9fafb; }
.periodo-label  { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
.periodo-stat   { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
.periodo-num      { font-size: 22px; font-weight: 800; color: #1f3a52; }
.periodo-num-gris { font-size: 22px; font-weight: 800; color: #9ca3af; }
.periodo-unit   { font-size: 11px; color: #9ca3af; }
.periodo-detalle{ font-size: 10px; color: #6b7280; }
.periodo-vs     { font-size: 11px; font-weight: 700; color: #9ca3af; flex-shrink: 0; }

/* ── TOAST ── */
.toast { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.toast.success { background: #16a34a; }
.toast.danger  { background: #dc2626; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(12px); }
.toast-leave-to   { opacity: 0; transform: translateY(12px); }

/* ── RESPONSIVE ── */
@media (max-width: 960px) {
  .page-hero { flex-direction: column; align-items: flex-start; }
  .hero-actions-wrap { width: 100%; }
  .stats { flex-wrap: wrap; }
  .stat-card { min-width: calc(50% - 9px); }
  .detalle-metricas { grid-template-columns: repeat(2, 1fr); }
  .view-switch-track { width: 100%; }
}
</style>