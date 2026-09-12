<template>
  <div class="layout">
    <AppSidebar rol="admin" />

    <main class="main">

      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': mounted }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Gestión de Producción'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: mounted ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">{{ ordenes.length }} órdenes registradas</p>
          </div>
        </div>
        <button class="btn-nueva" @click="abrirModal(null)">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Nueva Orden
        </button>
      </div>

      <!-- TARJETAS DE ESTADÍSTICAS -->
      <div class="stats-grid" :class="{ 'box-visible': mounted }">
        <div class="stat-card stat-total">
          <div class="stat-info">
            <span class="stat-number">{{ estadisticas.total }}</span>
            <span class="stat-label">Total Órdenes</span>
          </div>
          <div class="stat-icon-wrap stat-icon-total">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
          </div>
        </div>

        <div class="stat-card stat-proceso">
          <div class="stat-info">
            <span class="stat-number">{{ estadisticas.enProceso }}</span>
            <span class="stat-label">En Proceso</span>
          </div>
          <div class="stat-icon-wrap stat-icon-proceso">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
          </div>
        </div>

        <div class="stat-card stat-completada">
          <div class="stat-info">
            <span class="stat-number">{{ estadisticas.completadas }}</span>
            <span class="stat-label">Completadas</span>
          </div>
          <div class="stat-icon-wrap stat-icon-completada">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </div>
        </div>

        <div class="stat-card stat-retrasada">
          <div class="stat-info">
            <span class="stat-number">{{ estadisticas.retrasadas }}</span>
            <span class="stat-label">Retrasadas</span>
          </div>
          <div class="stat-icon-wrap stat-icon-retrasada">
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="filtros-bar" :class="{ 'box-visible': mounted }">
        <div class="filtro-cliente-wrap">
          <select v-model="filtroEstado" class="filtro-cliente-select">
            <option value="">Todos los estados</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Completada">Completada</option>
            <option value="Retrasada">Retrasada</option>
          </select>
          <button v-if="filtroEstado" class="filtro-clear" @click="filtroEstado = ''" title="Limpiar filtro estado">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="filtro-cliente-wrap">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="filtro-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
          </svg>
          <select v-model="filtroCliente" class="filtro-cliente-select">
            <option value="">Todos los clientes</option>
            <option v-for="c in clientes" :key="c.Id_Usuario" :value="c.Id_Usuario">
              {{ c.Nombre_Completo }}
            </option>
          </select>
          <button v-if="filtroCliente" class="filtro-clear" @click="filtroCliente = ''" title="Limpiar filtro cliente">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- CARGANDO -->
      <div v-if="cargando" class="loading-wrap">
        <div class="spinner"></div>
        <p>Cargando órdenes...</p>
      </div>

      <!-- LISTA DE TARJETAS -->
      <div v-else class="cards-list" :class="{ 'box-visible': mounted }">

        <div v-if="ordenesFiltradas.length === 0" class="empty-state">
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="#d1d5db">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>
          </svg>
          <p>{{ (filtroCliente || filtroEstado) ? 'No hay órdenes con los filtros seleccionados.' : 'No hay órdenes registradas aún.' }}</p>
        </div>

        <TransitionGroup name="row" :key="filterKey">
          <div
            v-for="(o, idx) in ordenesFiltradas"
            :key="o.Id_Orden"
            class="orden-card"
            :class="{ 'card-eliminando': o._eliminando }"
            :style="{ animationDelay: `${idx * 40}ms` }"
          >
            <div class="orden-card-top">
              <span class="order-num-pill">ORD-{{ String(o.Id_Orden).padStart(3,'0') }}</span>
              <span class="badge-prioridad" :class="clasePrioridad(o.Prioridad)">{{ o.Prioridad }}</span>
              <span class="badge-estado" :class="claseEstado(o.Estado)">{{ o.Estado }}</span>
              <div class="orden-card-acciones">
                <button class="icon-view-btn" @click="abrirVista(o)" title="Ver detalle">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  </svg>
                </button>
                <button class="icon-edit-btn" @click="abrirModal(o)" title="Editar">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                  </svg>
                </button>
                <button class="icon-del-btn" @click="solicitarEliminar(o)" title="Eliminar">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="orden-card-body">
              <h3 class="orden-titulo">{{ o.Producto || o.Descripcion }}</h3>
              <p class="orden-cliente">{{ o.Cliente || '—' }}</p>

              <p v-if="o.fasesExtra && o.fasesExtra.length" class="orden-fases-info">
                <span class="orden-fases-label">Fases a realizar:</span>
                {{ o.fasesExtra.length }}
              </p>

              <div class="orden-vence">Vence: {{ formatFechaCorta(o.Fecha_Limite) }}</div>

              <div class="orden-progreso">
                <div class="orden-progreso-row">
                  <span class="orden-progreso-txt">{{ o.Unidades_Realizadas ?? 0 }} de {{ o.Unidades ?? o.Cantidad }} prendas</span>
                  <span class="orden-progreso-pct">{{ pctOrden(o) }}%</span>
                </div>
                <div class="orden-progreso-bar">
                  <div
                    class="orden-progreso-fill"
                    :class="{
                      'fill-completo': pctOrden(o) >= 100,
                      'fill-proceso': o.Estado === 'En Proceso' && pctOrden(o) < 100,
                      'fill-retrasada': o.Estado === 'Retrasada' && pctOrden(o) < 100,
                    }"
                    :style="{ width: pctOrden(o) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- FAB NUEVA ORDEN -->
      <button class="fab-nueva" @click="abrirModal(null)" title="Nueva orden">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke-width="2.4" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
      </button>
    </main>

    <!-- ══ MODAL CREAR / EDITAR ══ -->
    <Transition name="modal">
      <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-container">
          <div class="modal-header">
            <span class="modal-title">{{ editando ? 'Editar Orden' : 'Nueva Orden de Producción' }}</span>
            <button class="modal-close" @click="cerrarModal">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <p class="modal-subtitulo">Completa los campos para registrar la orden</p>

          <div class="modal-body">

            <div class="form-group">
              <label class="form-label">Cliente <span class="req">*</span></label>
              <select v-model="form.Id_Cliente" class="form-input" :class="{ 'input-error': tocado && !form.Id_Cliente }">
                <option value="">Selecciona un cliente</option>
                <option v-for="c in clientes" :key="c.Id_Usuario" :value="c.Id_Usuario">
                  {{ c.Nombre_Completo }}
                </option>
              </select>
              <span v-if="tocado && !form.Id_Cliente" class="error-msg">El cliente es requerido</span>
            </div>

            <!-- MATERIALES — multi selección -->
            <div class="form-group">
              <label class="form-label">
                Materiales <span class="req">*</span>
                <span class="label-hint">— selecciona uno o más</span>
              </label>
              <div v-if="form.materiales_seleccionados.length > 0" class="chips-wrap">
                <div
                  v-for="(item, idx) in form.materiales_seleccionados"
                  :key="item.Id_Material"
                  class="chip-selected"
                >
                  <span class="chip-nombre">{{ item.Nombre_Material }}</span>
                  <div class="chip-cantidad-wrap">
                    <label class="chip-cant-lbl">Cant.</label>
                    <input v-model.number="item.cantidad" type="number" min="1" class="chip-cant-input" placeholder="0">
                  </div>
                  <button class="chip-remove" @click="quitarMaterial(idx)" title="Quitar">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="material-add-row">
                <select
                  v-model="materialParaAgregar"
                  class="form-input material-select"
                  :class="{ 'input-error': tocado && form.materiales_seleccionados.length === 0 }"
                >
                  <option value="">Selecciona un material...</option>
                  <option
                    v-for="m in materialesFiltrados"
                    :key="m.Id_Material"
                    :value="m.Id_Material"
                  >
                    {{ m.Nombre_Material }} (stock: {{ m.Stock_Actual }} {{ m.Unidad }})
                  </option>
                </select>
                <button
                  class="btn-add-material"
                  @click="agregarMaterial"
                  :disabled="!materialParaAgregar"
                  title="Agregar material"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                  </svg>
                  Agregar
                </button>
              </div>
              <span v-if="tocado && form.materiales_seleccionados.length === 0" class="error-msg">
                Selecciona al menos un material
              </span>
            </div>

            <div class="form-group">
              <label class="form-label">Producto</label>
              <input v-model="form.Producto" class="form-input" type="text" placeholder="Nombre del producto">
            </div>

            <div class="form-group">
              <label class="form-label">Descripción <span class="req">*</span></label>
              <input v-model="form.Descripcion" class="form-input" :class="{ 'input-error': tocado && !form.Descripcion }" type="text" placeholder="Descripción detallada">
              <span v-if="tocado && !form.Descripcion" class="error-msg">La descripción es requerida</span>
            </div>

            <div class="form-group">
              <label class="form-label">Cantidad <span class="req">*</span></label>
              <input v-model.number="form.Cantidad" class="form-input" type="number" min="1" placeholder="0">
            </div>

            <!-- OPERARIOS Y FASES -->
            <div class="form-group">
              <label class="form-label">
                Operarios y Fases
                <span class="label-hint">— una fase por paso de producción</span>
              </label>

              <div v-if="form.fases.length > 0" class="chips-wrap">
                <div v-for="(f, idx) in form.fases" :key="idx" class="chip-selected chip-fase-item">
                  <span class="chip-nombre">F{{ f.Numero_Fase }} · {{ nombreOperario(f.Id_Operario) }}</span>
                  <span v-if="f.Descripcion_Fase" class="chip-fase-desc">{{ f.Descripcion_Fase }}</span>
                  <button class="chip-remove" @click="quitarFase(idx)" title="Quitar">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="fase-add-row">
                <select v-model="operarioParaFase" class="form-input fase-op-select">
                  <option value="">Seleccionar operario</option>
                  <option v-for="op in operarios" :key="op.Id_Usuario" :value="op.Id_Usuario">
                    {{ op.Nombre_Completo }}
                  </option>
                </select>
                <input v-model.number="numeroFaseNueva" type="number" min="1" class="form-input fase-num-input" placeholder="N.°">
                <input v-model="descripcionFaseNueva" type="text" class="form-input fase-desc-input" placeholder="Descripción...">
                <button class="btn-add-material fase-add-btn" @click="agregarFase" :disabled="!operarioParaFase">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                  </svg>
                  Agregar
                </button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Prioridad</label>
                <select v-model="form.Prioridad" class="form-input">
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Dificultad</label>
                <select v-model="form.Dificultad" class="form-input">
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>

            <div class="form-group" v-if="editando">
              <label class="form-label">Estado</label>
              <select v-model="form.Estado" class="form-input">
                <option value="En Proceso">En Proceso</option>
                <option value="Completada">Completada</option>
                <option value="Retrasada">Retrasada</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Fecha Límite <span class="req">*</span></label>
              <input v-model="form.Fecha_Limite" class="form-input" type="date">
            </div>

          </div>
          <div v-if="errorGuardar" class="error-inline">{{ errorGuardar }}</div>
          <div class="modal-footer">
            <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
            <button class="btn-guardar" @click="guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Orden' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══ MODAL VER DETALLE ══ -->
    <Transition name="modal">
      <div v-if="verVisible" class="modal-overlay" @click.self="cerrarVista">
        <div class="modal-container view-container">
          <div class="modal-header">
            <div class="view-header-text">
              <span class="view-ordnum">ORD-{{ ordenVista ? String(ordenVista.Id_Orden).padStart(3,'0') : '' }}</span>
              <span class="modal-title view-titulo">{{ ordenVista?.Producto || ordenVista?.Descripcion }}</span>
            </div>
            <button class="modal-close" @click="cerrarVista">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="modal-body view-body">

            <div class="view-badges">
              <span class="badge-estado" :class="claseEstado(ordenVista?.Estado)">{{ ordenVista?.Estado }}</span>
              <span class="badge-prioridad" :class="clasePrioridad(ordenVista?.Prioridad)">Prioridad {{ ordenVista?.Prioridad }}</span>
            </div>

            <div class="view-section">
              <span class="view-section-title">Progreso de fabricación</span>
              <div class="orden-progreso">
                <div class="orden-progreso-row">
                  <span class="orden-progreso-txt">{{ ordenVista?.Unidades_Realizadas ?? 0 }} de {{ ordenVista?.Unidades ?? ordenVista?.Cantidad }} prendas</span>
                  <span class="orden-progreso-pct">{{ ordenVista ? pctOrden(ordenVista) : 0 }}%</span>
                </div>
                <div class="orden-progreso-bar">
                  <div
                    class="orden-progreso-fill"
                    :class="{
                      'fill-completo': ordenVista && pctOrden(ordenVista) >= 100,
                      'fill-proceso': ordenVista && ordenVista.Estado === 'En Proceso' && pctOrden(ordenVista) < 100,
                      'fill-retrasada': ordenVista && ordenVista.Estado === 'Retrasada' && pctOrden(ordenVista) < 100,
                    }"
                    :style="{ width: (ordenVista ? pctOrden(ordenVista) : 0) + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="view-section">
              <span class="view-section-title">Información general</span>
              <div class="view-info-grid">
                <div class="view-info-item">
                  <span class="view-info-label">Cliente</span>
                  <span class="view-info-value">{{ ordenVista?.Cliente || '—' }}</span>
                </div>
                <div class="view-info-item">
                  <span class="view-info-label">Material principal</span>
                  <span class="view-info-value">{{ materialPrincipal(ordenVista) }}</span>
                </div>
                <div class="view-info-item">
                  <span class="view-info-label">Dificultad</span>
                  <span class="view-info-value">{{ ordenVista?.Dificultad || '—' }}</span>
                </div>
                <div class="view-info-item">
                  <span class="view-info-label">Fecha de creación</span>
                  <span class="view-info-value">{{ formatFechaCorta(ordenVista?.Fecha_Creacion) }}</span>
                </div>
                <div class="view-info-item">
                  <span class="view-info-label">Fecha límite</span>
                  <span class="view-info-value">{{ formatFechaCorta(ordenVista?.Fecha_Limite) }}</span>
                </div>
              </div>
            </div>

            <div class="view-section">
              <span class="view-section-title">Descripción</span>
              <p class="view-desc-box">{{ ordenVista?.Descripcion || '—' }}</p>
            </div>

            <div class="view-section">
              <span class="view-section-title">Fases y operarios</span>
              <div v-if="ordenVista?.fasesExtra && ordenVista.fasesExtra.length" class="view-fases-list">
                <div v-for="f in ordenVista.fasesExtra" :key="f.Id_Orden_Operario" class="view-fase-card">
                  <div class="view-fase-top">
                    <div class="view-fase-left">
                      <span class="view-fase-pill">Fase {{ f.Numero_Fase }}</span>
                      <span class="view-fase-operario">{{ f.Nombre_Operario }}</span>
                    </div>
                    <span
                      v-if="f.Estado"
                      class="view-fase-estado"
                      :class="f.Estado === 'Completada' ? 'completada' : 'pendiente'"
                    >{{ f.Estado }}</span>
                  </div>
                  <p v-if="f.Descripcion_Fase" class="view-fase-desc">{{ f.Descripcion_Fase }}</p>
                  <span v-if="f.Cantidad_Realizada !== undefined && f.Cantidad_Realizada !== null" class="view-fase-cant">
                    Cantidad realizada: {{ f.Cantidad_Realizada }}
                  </span>
                </div>
              </div>
              <p v-else class="view-empty-txt">Sin fases asignadas</p>
            </div>

            <div class="view-section">
              <span class="view-section-title">Materiales</span>
              <div v-if="ordenVista?.materialesExtra && ordenVista.materialesExtra.length" class="chips-row">
                <span
                  v-for="m in ordenVista.materialesExtra"
                  :key="m.Id_Material ?? m.Id_Producto"
                  class="chip-mat"
                >
                  {{ m.Nombre_Material || m.Nombre_Producto || '—' }}
                  <span v-if="m.Cantidad_Usada" class="chip-mat-qty">({{ m.Cantidad_Usada }})</span>
                </span>
              </div>
              <p v-else class="view-empty-txt">Sin materiales asignados</p>
            </div>

          </div>
        </div>
      </div>
    </Transition>

    <!-- CONFIRM ELIMINAR -->
    <Transition name="modal">
      <div v-if="confirmOrden" class="modal-overlay" @click.self="confirmOrden = null">
        <div class="confirm-box">
          <div class="confirm-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#dc2626" width="36" height="36">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
          </div>
          <h3>¿Eliminar orden?</h3>
          <p>Se eliminará la orden <strong>#{{ confirmOrden.Id_Orden }}</strong> de <strong>{{ confirmOrden.Cliente }}</strong>. Esta acción no se puede deshacer.</p>
          <div class="confirm-btns">
            <button class="btn-cancelar" @click="confirmOrden = null">Cancelar</button>
            <button class="btn-danger"   @click="confirmarEliminar">Sí, eliminar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast" :class="toastType">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16">
          <path v-if="toastType === 'toast-success'" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import {
  getOrdenes, crearOrden, actualizarOrden, eliminarOrden,
  getUsuarios, getMateriales,
  getMaterialesDeOrden, agregarMaterialOrden, eliminarMaterialOrden,
  getFasesDeOrden, crearFaseOperario, eliminarFaseOperario,
  crearComprobante
} from '../../services/api'
import { useAuthStore } from '../../stores/auth'

import { useNotificaciones } from '../../composables/useNotificaciones'
const { notificarTarea } = useNotificaciones()

const auth = useAuthStore()

// ── ESTADO ────────────────────────────────────────────────────
const mounted       = ref(false)
const cargando      = ref(true)
const errorGuardar  = ref('')
const guardando     = ref(false)
const tocado        = ref(false)
const modalVisible  = ref(false)
const editando      = ref(false)
const confirmOrden  = ref(null)
const verVisible    = ref(false)
const ordenVista    = ref(null)
const toastMsg      = ref('')
const toastType     = ref('toast-success')

const ordenes    = ref([])
const clientes   = ref([])
const materiales = ref([])
const operarios  = ref([])

const materialParaAgregar = ref('')
const operarioParaFase    = ref('')
const numeroFaseNueva     = ref(1)
const descripcionFaseNueva = ref('')

const filtroCliente = ref('')
const filtroEstado  = ref('')

const formVacio = () => ({
  Id_Orden:                 null,
  Id_Cliente:               '',
  Producto:                 '',
  Descripcion:              '',
  Cantidad:                 1,
  Prioridad:                'Media',
  Dificultad:               'Media',
  Estado:                   'En Proceso',
  Fecha_Limite:             '',
  Fecha_Creacion:           null,
  materiales_seleccionados: [],
  fases:                    [],
})

const form = ref(formVacio())

// ── Materiales disponibles para el cliente seleccionado ────────
const materialesDisponibles = computed(() => {
  const yaSeleccionados = new Set(form.value.materiales_seleccionados.map(m => m.Id_Material))
  return materiales.value.filter(m => !yaSeleccionados.has(m.Id_Material))
})
const materialesFiltrados = computed(() => {
  if (!form.value.Id_Cliente) return []
  return materialesDisponibles.value.filter(m => m.Id_Cliente == form.value.Id_Cliente)
})

function agregarMaterial() {
  if (!materialParaAgregar.value) return
  const mat = materiales.value.find(m => m.Id_Material == materialParaAgregar.value)
  if (!mat) return
  form.value.materiales_seleccionados.push({
    Id_Material:     mat.Id_Material,
    Nombre_Material: mat.Nombre_Material,
    cantidad:        1,
  })
  materialParaAgregar.value = ''
}
function quitarMaterial(idx) {
  form.value.materiales_seleccionados.splice(idx, 1)
}

// ── Fases / operarios ───────────────────────────────────────────
function agregarFase() {
  if (!operarioParaFase.value) return
  form.value.fases.push({
    Id_Operario:      operarioParaFase.value,
    Numero_Fase:      numeroFaseNueva.value || (form.value.fases.length + 1),
    Descripcion_Fase: descripcionFaseNueva.value?.trim() || '',
  })
  operarioParaFase.value    = ''
  descripcionFaseNueva.value = ''
  numeroFaseNueva.value      = form.value.fases.length + 1
}
function quitarFase(idx) {
  form.value.fases.splice(idx, 1)
}
function nombreOperario(id) {
  return operarios.value.find(op => op.Id_Usuario == id)?.Nombre_Completo || '—'
}

// ── CARGA INICIAL ─────────────────────────────────────────────
async function cargarDatos() {
  cargando.value = true
  try {
    const [dataOrdenes, dataUsuarios, dataMateriales] = await Promise.all([
      getOrdenes(),
      getUsuarios(),
      getMateriales(),
    ])

    clientes.value   = dataUsuarios.filter(u => (u.Rol || '').toLowerCase() === 'cliente')
    operarios.value  = dataUsuarios.filter(u => (u.Rol || '').toLowerCase() === 'operario')
    materiales.value = dataMateriales

    const ordenesCompletas = await Promise.all(
      dataOrdenes.map(async o => {
        let materialesExtra = []
        let fasesExtra = []
        try {
          const mats = await getMaterialesDeOrden(o.Id_Orden)
          materialesExtra = Array.isArray(mats) ? mats : []
        } catch { materialesExtra = [] }
        try {
          const fases = await getFasesDeOrden(o.Id_Orden)
          fasesExtra = (Array.isArray(fases) ? fases : []).sort((a, b) => a.Numero_Fase - b.Numero_Fase)
        } catch { fasesExtra = [] }
        return { ...o, materialesExtra, fasesExtra }
      })
    )
    ordenes.value = ordenesCompletas
  } catch (err) {
    ordenes.value = []
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargarDatos()
  setTimeout(() => mounted.value = true, 50)
})

const _ignorarWatchCliente = ref(false)
watch(() => form.value.Id_Cliente, () => {
  if (_ignorarWatchCliente.value) return
  form.value.materiales_seleccionados = []
  materialParaAgregar.value = ''
})

onBeforeUnmount(() => {})

// ── ESTADÍSTICAS GLOBALES ─────────────────────────────────────
const estadisticas = computed(() => {
  const lista = ordenes.value
  return {
    total:       lista.length,
    enProceso:   lista.filter(o => o.Estado === 'En Proceso').length,
    completadas: lista.filter(o => o.Estado === 'Completada').length,
    retrasadas:  lista.filter(o => o.Estado === 'Retrasada').length,
  }
})

function pctOrden(o) {
  const total = Number(o.Unidades ?? o.Cantidad ?? 0)
  if (!total) return 0
  return Math.min(100, Math.round((Number(o.Unidades_Realizadas ?? 0) / total) * 100))
}

// ── FILTRADO ──────────────────────────────────────────────────
const filterKey = ref(0)
watch([filtroCliente, filtroEstado], () => { filterKey.value++ })

const ordenesFiltradas = computed(() => {
  let lista = [...ordenes.value]
  if (filtroCliente.value) lista = lista.filter(o => o.Id_Cliente == filtroCliente.value)
  if (filtroEstado.value)  lista = lista.filter(o => o.Estado === filtroEstado.value)
  lista.sort((a, b) => new Date(a.Fecha_Limite) - new Date(b.Fecha_Limite))
  return lista
})

// ── HELPERS DE FECHA / ESTILO ─────────────────────────────────
function formatFechaCorta(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function estaVencida(fecha) {
  if (!fecha) return false
  return new Date(fecha) < new Date()
}
function claseEstado(e) {
  return { 'En Proceso': 'estado-proceso', 'Completada': 'estado-completada', 'Retrasada': 'estado-retrasada' }[e] || ''
}
function clasePrioridad(p) {
  return { 'Alta': 'prio-alta', 'Media': 'prio-media', 'Baja': 'prio-baja' }[p] || 'prio-media'
}

// ── VER DETALLE ───────────────────────────────────────────────
function abrirVista(o) {
  ordenVista.value = o
  verVisible.value = true
}
function cerrarVista() {
  verVisible.value = false
  ordenVista.value = null
}
function materialPrincipal(o) {
  if (!o) return '—'
  return o.Nombre_Material
    || o.materialesExtra?.[0]?.Nombre_Material
    || o.materialesExtra?.[0]?.Nombre_Producto
    || '—'
}

// ── MODAL ─────────────────────────────────────────────────────
async function abrirModal(o) {
  tocado.value        = false
  editando.value      = !!o
  errorGuardar.value  = ''
  materialParaAgregar.value  = ''
  operarioParaFase.value     = ''
  descripcionFaseNueva.value = ''

  if (o) {
    let matsActuales = []
    let fasesActuales = []
    try {
      const mats = await getMaterialesDeOrden(o.Id_Orden)
      matsActuales = (Array.isArray(mats) ? mats : []).map(m => ({
        Id_Material:     m.Id_Material ?? m.Id_Producto,
        Nombre_Material: m.Nombre_Material ?? m.Nombre_Producto ?? '—',
        cantidad:        m.Cantidad_Usada ?? 1,
      }))
    } catch { matsActuales = [] }
    try {
      const fases = await getFasesDeOrden(o.Id_Orden)
      fasesActuales = (Array.isArray(fases) ? fases : [])
        .map(f => ({
          Id_Operario:      f.Id_Operario,
          Numero_Fase:      f.Numero_Fase,
          Descripcion_Fase: f.Descripcion_Fase || '',
        }))
        .sort((a, b) => a.Numero_Fase - b.Numero_Fase)
    } catch { fasesActuales = [] }

    _ignorarWatchCliente.value = true
    form.value = {
      Id_Orden:                 o.Id_Orden,
      Id_Cliente:               o.Id_Cliente,
      Producto:                 o.Producto             || '',
      Descripcion:              o.Descripcion          || '',
      Cantidad:                 o.Cantidad,
      Prioridad:                o.Prioridad            || 'Media',
      Dificultad:               o.Dificultad           || 'Media',
      Estado:                   o.Estado               || 'En Proceso',
      Fecha_Limite:             o.Fecha_Limite?.split('T')[0] || o.Fecha_Limite || '',
      Fecha_Creacion:           o.Fecha_Creacion       || null,
      materiales_seleccionados: matsActuales,
      fases:                    fasesActuales,
    }
    numeroFaseNueva.value = fasesActuales.length + 1
    await new Promise(r => setTimeout(r, 0))
    _ignorarWatchCliente.value = false

  } else {
    form.value = formVacio()
    numeroFaseNueva.value = 1
  }
  modalVisible.value = true
}

function cerrarModal() {
  modalVisible.value = false
  tocado.value        = false
  errorGuardar.value  = ''
  materialParaAgregar.value = ''
  operarioParaFase.value    = ''
}

// ── GUARDAR ───────────────────────────────────────────────────
async function guardar() {
  tocado.value = true

  if (!form.value.Id_Cliente || form.value.materiales_seleccionados.length === 0 || !form.value.Descripcion || !form.value.Fecha_Limite) {
    errorGuardar.value = 'Completa todos los campos obligatorios y selecciona al menos un material.'
    return
  }

  guardando.value    = true
  errorGuardar.value = ''

  const idMaterialPrincipal = form.value.materiales_seleccionados[0].Id_Material

  const payload = {
    Id_Cliente:   form.value.Id_Cliente,
    Id_Material:  idMaterialPrincipal,
    Producto:     form.value.Producto     || null,
    Descripcion:  form.value.Descripcion,
    Cantidad:     form.value.Cantidad,
    Prioridad:    form.value.Prioridad    || 'Media',
    Dificultad:   ['Alta', 'Media', 'Baja'].includes(form.value.Dificultad) ? form.value.Dificultad : 'Media',
    Estado:       form.value.Estado       || 'En Proceso',
    Fecha_Limite: form.value.Fecha_Limite,
  }

  try {
    let idOrden = form.value.Id_Orden

    if (editando.value) {
      await actualizarOrden(idOrden, payload)
    } else {
      const res = await crearOrden(payload)
      idOrden = res.Id_Orden

      try {
        await crearComprobante({
          Id_Usuario:   auth.idUsuario,
          Id_Orden:     idOrden,
          Estado:       'Pendiente',
          Fecha_Limite: form.value.Fecha_Limite,
        })
      } catch (compErr) {
        console.warn('No se pudo crear el comprobante automáticamente:', compErr.message)
      }
    }

    // ── Materiales: reemplazar los existentes ──
    try {
      const matsExistentes = await getMaterialesDeOrden(idOrden)
      for (const m of (matsExistentes || [])) {
        const idProd = m.Id_Material ?? m.Id_Producto
        await eliminarMaterialOrden(idOrden, idProd)
      }
    } catch { /* continuar */ }

    for (const mat of form.value.materiales_seleccionados) {
      try {
        await agregarMaterialOrden({
          Id_Orden:       idOrden,
          Id_Producto:    mat.Id_Material,
          Cantidad_Usada: mat.cantidad || 1,
        })
      } catch (e) {
        console.warn('No se pudo agregar material a orden_material:', e.message)
      }
    }

    // ── Fases: reemplazar las existentes ──
    try {
      const fasesExistentes = await getFasesDeOrden(idOrden)
      for (const f of (fasesExistentes || [])) {
        await eliminarFaseOperario(f.Id_Orden_Operario)
      }
    } catch { /* continuar */ }

    let notificado = false
    for (const fase of form.value.fases) {
      try {
        await crearFaseOperario({
          Id_Orden:         idOrden,
          Id_Operario:      fase.Id_Operario,
          Numero_Fase:      fase.Numero_Fase,
          Descripcion_Fase: fase.Descripcion_Fase || null,
        })
        const operario = operarios.value.find(op => op.Id_Usuario == fase.Id_Operario)
        if (operario?.Correo) {
          await notificarTarea(
            `F${fase.Numero_Fase} — ${fase.Descripcion_Fase || payload.Descripcion}`,
            { email: operario.Correo, nombre: operario.Nombre_Completo },
            idOrden,
            payload.Prioridad,
            payload.Fecha_Limite
          )
        }
      } catch (e) {
        console.warn('No se pudo crear la fase:', e.message)
      }
    }

    showToast(editando.value ? 'Orden actualizada correctamente' : 'Orden creada correctamente', 'toast-success')
    await cargarDatos()
    cerrarModal()
  } catch (e) {
    errorGuardar.value = e.message || 'Error al guardar la orden.'
  } finally {
    guardando.value = false
  }
}

// ── ELIMINAR ──────────────────────────────────────────────────
function solicitarEliminar(o) { confirmOrden.value = o }

async function confirmarEliminar() {
  const o = confirmOrden.value
  confirmOrden.value = null
  o._eliminando = true
  try {
    await eliminarOrden(o.Id_Orden)
    await new Promise(r => setTimeout(r, 300))
    ordenes.value = ordenes.value.filter(x => x.Id_Orden !== o.Id_Orden)
    showToast(`Orden #${o.Id_Orden} eliminada`, 'toast-danger')
  } catch {
    o._eliminando = false
    showToast('Error al eliminar la orden', 'toast-danger')
  }
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = 'toast-success') {
  toastMsg.value  = msg
  toastType.value = type
  setTimeout(() => { toastMsg.value = '' }, 3500)
}
</script>

<style scoped>
/* ── LAYOUT ── */
.layout { display: flex; min-height: 100vh; background: #f1f5f9; position: relative; overflow: hidden; }
.main   { flex: 1; padding: 28px 30px; overflow-y: auto; position: relative; z-index: 1; }

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

/* ── HERO HEADER ── */
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }
.hero-left { display: flex; align-items: center; gap: 16px; }
.hero-text { display: flex; flex-direction: column; }
.hero-icon-wrap { position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: #1f3a52; border-radius: 14px; flex-shrink: 0; }
.hero-icon { width: 26px; height: 26px; color: white; }
.hero-icon-ring { position: absolute; border-radius: 50%; border: 1.5px solid #1f3a52; opacity: 0; animation: iconPulse 3s ease-out infinite; }
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 86px; height: 86px; animation-delay: 0.8s; }
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
.hero-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; opacity: 0; transform: translateY(12px); animation: charReveal 0.4s ease forwards; }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0 0; }
.btn-nueva { display: flex; align-items: center; gap: 6px; background: #1f3a52; color: white; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; flex-shrink: 0; }
.btn-nueva:hover  { background: #162d42; transform: translateY(-1px); }
.btn-nueva:active { transform: translateY(0); }

/* ── TARJETAS DE ESTADÍSTICAS ── */
.stats-grid { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 20px; opacity: 0; transform: translateY(12px); transition: opacity 0.4s ease, transform 0.4s ease; }
.stats-grid.box-visible { opacity: 1; transform: translateY(0); }
.stat-card { flex: 1; min-width: 220px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px 20px 20px 24px; transition: box-shadow 0.2s, transform 0.15s; }
.stat-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.05); transform: translateY(-1px); }
.stat-info { display: flex; flex-direction: column; gap: 2px; }
.stat-number { font-size: 30px; font-weight: 800; color: #111827; line-height: 1; }
.stat-label  { font-size: 13px; color: #6b7280; font-weight: 500; }
.stat-icon-wrap { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.stat-total      { border-left: 3px solid #1f3a52; }
.stat-icon-total { background: #eef2f6; color: #1f3a52; }

.stat-proceso      { border-left: 3px solid #7c3aed; }
.stat-icon-proceso { background: #ede9fe; color: #7c3aed; }

.stat-completada      { border-left: 3px solid #16a34a; }
.stat-icon-completada { background: #dcfce7; color: #16a34a; }

.stat-retrasada      { border-left: 3px solid #dc2626; }
.stat-icon-retrasada { background: #fee2e2; color: #dc2626; }

/* ── FILTROS ── */
.filtros-bar { display: flex; justify-content: flex-start; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; opacity: 0; transform: translateY(10px); transition: opacity 0.4s ease, transform 0.4s ease; }
.filtros-bar.box-visible { opacity: 1; transform: translateY(0); }
.filtro-cliente-wrap { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 7px 10px; transition: border-color 0.2s, box-shadow 0.2s; }
.filtro-cliente-wrap:focus-within { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.08); }
.filtro-icon { color: #9ca3af; flex-shrink: 0; }
.filtro-cliente-select { border: none; outline: none; font-size: 13px; color: #374151; background: transparent; cursor: pointer; min-width: 150px; max-width: 220px; }
.filtro-clear { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 2px; border-radius: 50%; transition: background 0.15s, color 0.15s; flex-shrink: 0; }
.filtro-clear:hover { background: #fee2e2; color: #dc2626; }

/* ── CARGANDO ── */
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 14px; color: #9ca3af; font-size: 14px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── LISTA DE TARJETAS ── */
.cards-list { display: flex; flex-direction: column; gap: 16px; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; padding-bottom: 40px; }
.cards-list.box-visible { opacity: 1; transform: translateY(0); }

.orden-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; animation: rowFadeIn 0.3s ease both; transition: box-shadow 0.2s, transform 0.2s, opacity 0.3s; }
.orden-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); }
@keyframes rowFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.card-eliminando { opacity: 0.35; pointer-events: none; }

.orden-card-top { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; }
.order-num-pill { font-size: 12px; font-weight: 700; color: #1f3a52; background: #f1f5f9; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; }
.badge-prioridad { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.prio-alta  { background: #fef9c3; color: #92400e; }
.prio-media { background: #fef9c3; color: #92400e; }
.prio-baja  { background: #f0fdf4; color: #166534; }
.icon-view-btn, .icon-edit-btn, .icon-del-btn { width: 32px; height: 32px; border-radius: 7px; border: none; background: #1f3a52; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s, transform 0.15s; }
.orden-card-acciones { display: flex; gap: 8px; margin-left: auto; }
.icon-view-btn:hover { background: #2d5580; transform: scale(1.06); }
.icon-edit-btn:hover { background: #2d5580; transform: scale(1.06); }
.icon-del-btn:hover { background: #dc2626; transform: scale(1.06); }
.badge-estado { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.estado-proceso    { background: #dbeafe; color: #1e40af; }
.estado-completada { background: #dcfce7; color: #166534; }
.estado-retrasada  { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

.orden-card-body { padding: 14px 18px 18px; }
.orden-titulo { font-size: 17px; font-weight: 700; color: #111827; margin: 0 0 2px; }
.orden-cliente { font-size: 13px; color: #6b7280; margin: 0 0 12px; }

.chips-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.chip-fase { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; background: #ede9fe; color: #5b21b6; white-space: nowrap; }
.orden-fases-info { font-size: 13px; color: #6b7280; margin: 0 0 12px; }
.orden-fases-label { color: #6b7280; margin-right: 4px; }
.chip-mat  { font-size: 12px; font-weight: 500; padding: 4px 12px; border-radius: 999px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; white-space: nowrap; }
.chip-mat-qty { color: #94a3b8; font-weight: 400; }

.orden-vence { font-size: 12px; color: #9ca3af; text-align: right; margin-bottom: 6px; }

.orden-progreso { margin-top: 4px; }
.orden-progreso-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.orden-progreso-txt { font-size: 14px; color: #374151; }
.orden-progreso-pct { font-size: 14px; font-weight: 700; color: #1f3a52; }
.orden-progreso-bar { width: 100%; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.orden-progreso-fill { height: 100%; background: #1f3a52; border-radius: 999px; transition: width 0.6s ease; }
.orden-progreso-fill.fill-proceso   { background: #7c3aed; }
.orden-progreso-fill.fill-retrasada { background: #dc2626; }
.orden-progreso-fill.fill-completo  { background: #16a34a; }

/* ── FAB ── */
.fab-nueva { position: fixed; bottom: 28px; right: 28px; width: 56px; height: 56px; border-radius: 50%; background: #1f3a52; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 24px rgba(31,58,82,0.4); transition: background 0.2s, transform 0.15s; z-index: 50; }
.fab-nueva:hover { background: #162d42; transform: scale(1.06); }
.fab-nueva:active { transform: scale(0.96); }

/* ── EMPTY STATE ── */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; gap: 10px; color: #9ca3af; font-size: 14px; background: white; border: 1px solid #e5e7eb; border-radius: 16px; }

/* ── MODAL ── */
.modal-overlay   { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal-container { background: white; border-radius: 16px; width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-title  { font-size: 16px; font-weight: 700; color: #111827; }
.modal-subtitulo { font-size: 12.5px; color: #9ca3af; padding: 2px 24px 0; }
.modal-close  { background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f3f4f6; }
.modal-body   { padding: 16px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid #f3f4f6; }

/* ── MODAL VER DETALLE ── */
.view-container   { width: 520px; }
.view-header-text { display: flex; flex-direction: column; gap: 2px; }
.view-ordnum       { font-size: 11px; font-weight: 700; color: #9ca3af; font-family: 'Courier New', monospace; }
.view-titulo       { font-size: 18px; }
.view-body         { padding-bottom: 24px; gap: 20px; }
.view-badges       { display: flex; gap: 8px; }
.view-section      { display: flex; flex-direction: column; gap: 10px; }
.view-section-title{ font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.3px; }
.view-info-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
.view-info-item    { display: flex; flex-direction: column; gap: 2px; }
.view-info-label   { font-size: 11px; color: #9ca3af; font-weight: 500; }
.view-info-value   { font-size: 13.5px; color: #111827; font-weight: 600; }
.view-desc-box     { margin: 0; font-size: 13.5px; color: #374151; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; line-height: 1.5; }
.view-empty-txt    { margin: 0; font-size: 13px; color: #9ca3af; font-style: italic; }
.view-fases-list   { display: flex; flex-direction: column; gap: 10px; }
.view-fase-card    { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.view-fase-top     { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.view-fase-left    { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.view-fase-pill    { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: #ede9fe; color: #5b21b6; white-space: nowrap; }
.view-fase-operario{ font-size: 13.5px; font-weight: 700; color: #111827; }
.view-fase-estado  { font-size: 12px; font-weight: 600; white-space: nowrap; }
.view-fase-estado.completada { color: #16a34a; }
.view-fase-estado.pendiente  { color: #9ca3af; }
.view-fase-desc    { margin: 0; font-size: 13px; color: #374151; }
.view-fase-cant    { font-size: 12px; color: #9ca3af; }

/* FORM */
.form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 12px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.label-hint { font-weight: 400; color: #9ca3af; font-size: 11px; }
.req        { color: #dc2626; }
.form-input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #111827; outline: none; transition: border-color 0.2s; background: white; }
.form-input:focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.08); }
.input-error  { border-color: #ef4444; }
.error-msg    { font-size: 11px; color: #dc2626; }
.error-inline { color: #dc2626; font-size: 13px; padding: 4px 24px; }

.btn-cancelar { background: white; color: #374151; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 18px; font-size: 13px; cursor: pointer; transition: background 0.15s; }
.btn-cancelar:hover { background: #f3f4f6; }
.btn-guardar  { background: #1f3a52; color: white; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-guardar:hover:not(:disabled) { background: #162d42; }
.btn-guardar:disabled { opacity: 0.6; cursor: not-allowed; }

/* CHIPS MATERIALES (modal) */
.chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; min-height: 46px; }
.chip-selected { display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 5px 10px 5px 14px; font-size: 12px; color: #1d4ed8; font-weight: 600; }
.chip-nombre { white-space: nowrap; }
.chip-cantidad-wrap { display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #bfdbfe; border-radius: 6px; padding: 2px 6px; }
.chip-cant-lbl   { font-size: 10px; color: #60a5fa; font-weight: 500; white-space: nowrap; }
.chip-cant-input { width: 44px; border: none; outline: none; background: transparent; font-size: 12px; font-weight: 700; color: #1d4ed8; text-align: center; }
.chip-remove { background: none; border: none; cursor: pointer; color: #93c5fd; display: flex; align-items: center; padding: 2px; border-radius: 50%; transition: background 0.15s, color 0.15s; }
.chip-remove:hover { background: #dbeafe; color: #1d4ed8; }
.material-add-row { display: flex; gap: 8px; align-items: center; }
.material-select  { flex: 1; }
.btn-add-material { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; background: #1f3a52; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
.btn-add-material:hover:not(:disabled) { background: #162d42; }
.btn-add-material:disabled { opacity: 0.45; cursor: not-allowed; }

/* CHIPS FASES (modal) */
.chip-fase-item { background: #f5f3ff; border-color: #ddd6fe; color: #5b21b6; }
.chip-fase-desc { font-size: 11px; font-weight: 400; color: #7c3aed; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fase-add-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.fase-op-select { flex: 1.4; min-width: 150px; }
.fase-num-input { width: 60px; text-align: center; flex-shrink: 0; }
.fase-desc-input { flex: 1.6; min-width: 140px; }
.fase-add-btn { flex-shrink: 0; }

/* CONFIRM */
.confirm-box  { background: white; border-radius: 16px; width: 380px; max-width: 95vw; padding: 28px 24px; text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.confirm-icon { margin-bottom: 12px; }
.confirm-box h3 { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
.confirm-box p  { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
.confirm-btns   { display: flex; gap: 10px; }
.btn-danger { flex: 1; background: #dc2626; color: white; border: none; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-danger:hover { background: #b91c1c; }

/* TOAST */
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.toast-success { background: #166534; color: white; }
.toast-danger  { background: #991b1b; color: white; }

/* TRANSITIONS */
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.row-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.row-leave-active { transition: opacity 0.15s ease; position: absolute; }
.row-enter-from   { opacity: 0; transform: translateY(8px); }
.row-leave-to     { opacity: 0; }

@media (max-width: 700px) {
  .main { padding: 20px 14px 90px; }
  .page-hero { flex-direction: column; align-items: flex-start; }
  .stats-grid { gap: 10px; }
  .stat-card { min-width: calc(50% - 5px); padding: 14px; }
  .stat-number { font-size: 22px; }
  .fase-add-row { flex-direction: column; align-items: stretch; }
  .fase-num-input { width: 100%; }
  .view-info-grid { grid-template-columns: 1fr; }
}
</style>