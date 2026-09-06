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

      <!-- STATS -->
      <div class="stats-grid" :class="{ 'stats-visible': mounted }">
        <div
          v-for="(s, i) in stats"
          :key="i"
          class="stat-card"
          :style="{ transitionDelay: mounted ? `${i * 80}ms` : '0ms' }"
        >
          <div class="stat-accent" :style="{ background: s.accentColor }"></div>
          <div class="stat-icon-bg" :style="{ color: s.accentColor }">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" :d="s.iconPath"/>
            </svg>
          </div>
          <div class="stat-lbl">{{ s.label }}</div>
          <div class="stat-num" :style="{ color: s.accentColor }">{{ s.display }}</div>
        </div>
      </div>

      <!-- CARGANDO -->
      <div v-if="cargando" class="loading-wrap">
        <div class="spinner"></div>
        <p>Cargando órdenes...</p>
      </div>

      <!-- TABLA -->
      <div v-else class="table-box" :class="{ 'box-visible': mounted }">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>
            </svg>
            Órdenes de Producción
            <span class="count-badge">{{ ordenesFiltradas.length }}</span>
          </div>
          <!-- FILTRO POR CLIENTE Y ESTADO -->
          <div class="table-header-right">
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
        </div>

        <div v-if="ordenesFiltradas.length === 0" class="empty-state">
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="#d1d5db">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>
          </svg>
          <p>{{ (filtroCliente || filtroEstado) ? 'No hay órdenes con los filtros seleccionados.' : 'No hay órdenes registradas aún.' }}</p>
        </div>

        <table v-else>
          <thead>
            <tr>
              <th @click="doSort('Id_Orden')" class="th-sort"># <span>{{ sIcon('Id_Orden') }}</span></th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Materiales</th>
              <th @click="doSort('Estado')" class="th-sort">Estado <span>{{ sIcon('Estado') }}</span></th>
              <th @click="doSort('Fecha_Limite')" class="th-sort">Fecha Límite <span>{{ sIcon('Fecha_Limite') }}</span></th>
              <th>Cantidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <TransitionGroup name="row" :key="filterKey">
              <tr
                v-for="(o, idx) in ordenesFiltradas"
                :key="o.Id_Orden"
                class="table-row"
                :class="{ 'row-eliminando': o._eliminando }"
                :style="{ animationDelay: `${idx * 40}ms` }"
              >
                <td>
                  <span class="order-num-pill">#{{ o.Id_Orden }}</span>
                </td>
                <td>{{ o.Cliente || '—' }}</td>
                <td>{{ o.Producto || '—' }}</td>
                <td>
                  <div class="materiales-chips">
                    <template v-if="o.materialesExtra && o.materialesExtra.length">
                      <span
                        v-for="m in o.materialesExtra.slice(0, 2)"
                        :key="m.Id_Material ?? m.Id_Producto"
                        class="badge-material"
                      >
                        {{ m.Nombre_Material || m.Nombre_Producto || '—' }}
                      </span>
                      <span
                        v-if="o.materialesExtra.length > 2"
                        class="badge-material badge-material--mas"
                        @mouseenter="showTooltip($event, o.materialesExtra)"
                        @mouseleave="hideTooltip"
                      >
                        +{{ o.materialesExtra.length - 2 }} más
                      </span>
                    </template>
                    <span v-else class="text-muted">{{ o.NombreMaterial || '—' }}</span>
                  </div>
                </td>
                <td><span class="badge-estado" :class="claseEstado(o.Estado)">{{ o.Estado }}</span></td>
                <td :class="{ 'fecha-vencida': estaVencida(o.Fecha_Limite) }">{{ formatFecha(o.Fecha_Limite) }}</td>
                <td>{{ o.Cantidad }}</td>
                <td>
                  <div class="acciones">
                    <button class="action-btn btn-ver"      @click="verDetalle(o)"        title="Ver detalle">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                      </svg>
                    </button>
                    <button class="action-btn btn-editar"   @click="abrirModal(o)"        title="Editar">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                      </svg>
                    </button>
                    <button class="action-btn btn-eliminar" @click="solicitarEliminar(o)" title="Eliminar">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" shape-rendering="geometricPrecision" style="display:block">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </TransitionGroup>
          </tbody>
        </table>
      </div>
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
                    <input
                      v-model.number="item.cantidad"
                      type="number"
                      min="1"
                      class="chip-cant-input"
                      placeholder="0"
                    >
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
                  <option value="">+ Agregar material...</option>
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
              <label class="form-label">Operario</label>
              <select v-model="form.Id_Operario" class="form-input">
                <option value="">Sin asignar</option>
                <option v-for="op in operarios" :key="op.Id_Usuario" :value="op.Id_Usuario">
                  {{ op.Nombre_Completo }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Producto</label>
              <input v-model="form.Producto" class="form-input" type="text" placeholder="Ej: Camiseta Polo Azul">
            </div>

            <div class="form-group">
              <label class="form-label">Descripción <span class="req">*</span></label>
              <input v-model="form.Descripcion" class="form-input" :class="{ 'input-error': tocado && !form.Descripcion }" type="text" placeholder="Ej: Camisetas Polo Azules x 50">
              <span v-if="tocado && !form.Descripcion" class="error-msg">La descripción es requerida</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cantidad <span class="req">*</span></label>
                <input v-model.number="form.Cantidad" class="form-input" type="number" min="1" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Prioridad</label>
                <select v-model="form.Prioridad" class="form-input">
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>

            <!-- ── DIFICULTAD ── -->
            <div class="form-group">
              <label class="form-label">
                Dificultad
                <span class="label-hint">— afecta el cálculo de rendimiento del operario</span>
              </label>
              <select v-model="form.Dificultad" class="form-input">
                <option value="Baja">Baja — prendas simples (medias, boxer, pantalonetas)</option>
                <option value="Media">Media — prendas estándar (camisas, pantalones, pijamas)</option>
                <option value="Alta">Alta — prendas complejas (chaquetas, uniformes, sudaderas, hoodies)</option>
              </select>
            </div>

            <!-- ── ESTADO (solo visible al editar) ── -->
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

    <!-- MODAL DETALLE -->
    <Transition name="modal">
      <div v-if="detalleOrden" class="modal-overlay" @click.self="detalleOrden = null">
        <div class="modal-container">
          <div class="modal-header">
            <span class="modal-title">Orden #{{ detalleOrden.Id_Orden }}</span>
            <button class="modal-close" @click="detalleOrden = null">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body detalle-grid">
            <div class="detalle-item"><span class="detalle-label">Cliente</span><span>{{ detalleOrden.Cliente || '—' }}</span></div>
            <div class="detalle-item"><span class="detalle-label">Producto</span><span>{{ detalleOrden.Producto || '—' }}</span></div>
            <div class="detalle-item"><span class="detalle-label">Descripción</span><span>{{ detalleOrden.Descripcion }}</span></div>
            <div class="detalle-item"><span class="detalle-label">Cantidad</span><span>{{ detalleOrden.Cantidad }}</span></div>
            <div class="detalle-item">
              <span class="detalle-label">Estado</span>
              <span class="badge-estado" :class="claseEstado(detalleOrden.Estado)">{{ detalleOrden.Estado }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Operario</span>
              <span>{{ operarios.find(op => op.Id_Usuario == detalleOrden.Id_Operario)?.Nombre_Completo || 'Sin asignar' }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Prioridad</span>
              <span>{{ detalleOrden.Prioridad }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Dificultad</span>
              <span>{{ detalleOrden.Dificultad || 'Media' }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Fecha de Creación</span>
              <span>{{ formatFechaDetalle(detalleOrden.Fecha_Creacion) }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Fecha Límite</span>
              <span :class="{ 'fecha-vencida': estaVencida(detalleOrden.Fecha_Limite) }">{{ formatFecha(detalleOrden.Fecha_Limite) }}</span>
            </div>
            <div class="detalle-item detalle-full">
              <span class="detalle-label">Materiales utilizados</span>
              <div class="detalle-materiales">
                <div
                  v-if="detalleOrden.materialesExtra && detalleOrden.materialesExtra.length"
                  class="chips-wrap"
                >
                  <span
                    v-for="m in detalleOrden.materialesExtra"
                    :key="m.Id_Material ?? m.Id_Producto"
                    class="chip-material chip-detalle"
                  >
                    {{ m.Nombre_Material || m.Nombre_Producto }}
                    <span v-if="m.Cantidad_Usada" class="chip-qty">× {{ m.Cantidad_Usada }}</span>
                  </span>
                </div>
                <span v-else class="text-muted">{{ detalleOrden.NombreMaterial || '—' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancelar" @click="detalleOrden = null">Cerrar</button>
            <button class="btn-guardar" @click="abrirModal(detalleOrden); detalleOrden = null">Editar</button>
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

    <!-- TOOLTIP MATERIALES (teleport para evitar overflow clipping) -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="mat-tooltip"
        :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
      >
        <span
          v-for="(m, i) in tooltip.items"
          :key="i"
          class="mat-tooltip-chip"
        >{{ m.Nombre_Material || m.Nombre_Producto || '—' }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import {
  getOrdenes, crearOrden, actualizarOrden, eliminarOrden,
  getUsuarios, getMateriales,
  getMaterialesDeOrden, agregarMaterialOrden, eliminarMaterialOrden,
  crearComprobante
} from '../../services/api'
import { useAuthStore } from '../../stores/auth'

import { useNotificaciones } from '../../composables/useNotificaciones'
const { notificarTarea } = useNotificaciones()

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const auth = useAuthStore()

// ── ESTADO ────────────────────────────────────────────────────
const mounted       = ref(false)
const cargando      = ref(true)
const errorGuardar  = ref('')
const guardando     = ref(false)
const tocado        = ref(false)
const modalVisible  = ref(false)
const editando      = ref(false)
const detalleOrden  = ref(null)
const confirmOrden  = ref(null)
const toastMsg      = ref('')
const toastType     = ref('toast-success')

const ordenes     = ref([])
const clientes    = ref([])
const materiales  = ref([])
const operarios   = ref([])
const statsDisplay = ref({ total: 0, proceso: 0, completadas: 0, retrasadas: 0 })

const materialParaAgregar = ref('')
const sortKey = ref('Id_Orden')
const sortDir = ref(1)
const filtroCliente = ref('')
const filtroEstado  = ref('')
const statTimers = new Map()

// ── TOOLTIP MATERIALES ────────────────────────────────────────
const tooltip = ref({ visible: false, x: 0, y: 0, items: [] })
function showTooltip(event, items) {
  const rect = event.target.getBoundingClientRect()
  tooltip.value = {
    visible: true,
    x: rect.left,
    y: rect.bottom + window.scrollY + 6,
    items,
  }
}
function hideTooltip() {
  tooltip.value.visible = false
}

const formVacio = () => ({
  Id_Orden:                 null,
  Id_Cliente:               '',
  Id_Operario:              '',
  _operarioOriginal:        '',
  Producto:                 '',
  Descripcion:              '',
  Cantidad:                 1,
  Prioridad:                'Media',
  Dificultad:               'Media',
  Estado:                   'En Proceso',
  Fecha_Limite:             '',
  Fecha_Creacion:           null,
  materiales_seleccionados: [],
})

const form = ref(formVacio())

// ── Materiales disponibles ────────────────────────────────────
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

    const ordenesConMat = await Promise.all(
      dataOrdenes.map(async o => {
        try {
          const mats = await getMaterialesDeOrden(o.Id_Orden)
          return { ...o, materialesExtra: Array.isArray(mats) ? mats : [] }
        } catch {
          return { ...o, materialesExtra: [] }
        }
      })
    )
    ordenes.value = ordenesConMat
    animateStats()
  } catch (err) {
    ordenes.value = []
    animateStats()
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargarDatos()
  setTimeout(() => mounted.value = true, 50)
})

// ── FIX CLAVE: el watch de Id_Cliente NO debe borrar materiales
// cuando abrirModal acaba de asignarlos. Usamos un flag para ignorarlo.
const _ignorarWatchCliente = ref(false)
watch(() => form.value.Id_Cliente, () => {
  if (_ignorarWatchCliente.value) return
  form.value.materiales_seleccionados = []
  materialParaAgregar.value = ''
})

onBeforeUnmount(() => {
  statTimers.forEach(t => clearInterval(t))
  statTimers.clear()
})

// ── STATS ─────────────────────────────────────────────────────
const ICON_LIST  = 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z'
const ICON_PROC  = 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'
const ICON_CHECK = 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_ALERT = 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z'

const stats = computed(() => [
  { label: 'Total Órdenes', display: statsDisplay.value.total,       accentColor: '#1f3a52', iconPath: ICON_LIST  },
  { label: 'En Proceso',    display: statsDisplay.value.proceso,     accentColor: '#2563eb', iconPath: ICON_PROC  },
  { label: 'Completadas',   display: statsDisplay.value.completadas, accentColor: '#16a34a', iconPath: ICON_CHECK },
  { label: 'Retrasadas',    display: statsDisplay.value.retrasadas,  accentColor: '#dc2626', iconPath: ICON_ALERT },
])

function animateCount(key, target) {
  clearInterval(statTimers.get(key))
  let val = 0
  const steps = 80; const duration = 2000
  const intervalMs = Math.round(duration / steps)
  const step = Math.max(0.1, target / steps)
  const timer = setInterval(() => {
    val += step
    if (val >= target) { statsDisplay.value[key] = target; clearInterval(timer); statTimers.delete(key) }
    else statsDisplay.value[key] = Math.floor(val)
  }, intervalMs)
  statTimers.set(key, timer)
}

function animateStats() {
  animateCount('total',       ordenes.value.length)
  animateCount('proceso',     ordenes.value.filter(o => o.Estado === 'En Proceso').length)
  animateCount('completadas', ordenes.value.filter(o => o.Estado === 'Completada').length)
  animateCount('retrasadas',  ordenes.value.filter(o => o.Estado === 'Retrasada').length)
}

// ── FILTRADO / ORDENAMIENTO ───────────────────────────────────
const filterKey = ref(0)
watch([filtroCliente, filtroEstado], () => { filterKey.value++ })

const ordenesFiltradas = computed(() => {
  let lista = [...ordenes.value]
  if (filtroCliente.value) {
    lista = lista.filter(o => o.Id_Cliente == filtroCliente.value)
  }
  if (filtroEstado.value) {
    lista = lista.filter(o => o.Estado === filtroEstado.value)
  }
  lista.sort((a, b) => {
    const va = a[sortKey.value], vb = b[sortKey.value]
    if (va == null) return 1
    if (vb == null) return -1
    return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir.value
  })
  return lista
})

function doSort(key) {
  if (sortKey.value === key) sortDir.value *= -1
  else { sortKey.value = key; sortDir.value = 1 }
}
function sIcon(key) {
  if (sortKey.value !== key) return '⇅'
  return sortDir.value === 1 ? '↑' : '↓'
}

// ── HELPERS DE FECHA ──────────────────────────────────────────
function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
  })
}
function formatFechaDetalle(fecha) {
  if (!fecha) return '—'
  try {
    return new Date(fecha).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  } catch { return '—' }
}
function estaVencida(fecha) {
  if (!fecha) return false
  return new Date(fecha) < new Date()
}
function claseEstado(e) {
  return { 'En Proceso': 'estado-proceso', 'Completada': 'estado-completada', 'Retrasada': 'estado-retrasada' }[e] || ''
}
function clasePrioridad(p) {
  return { 'Alta': 'prio-alta', 'Media': 'prio-media', 'Baja': 'prio-baja' }[p] || ''
}
function claseDificultad(d) {
  return { 'Alta': 'dif-alta', 'Media': 'dif-media', 'Baja': 'dif-baja' }[d] || 'dif-media'
}

// ── MODAL ─────────────────────────────────────────────────────
async function abrirModal(o) {
  tocado.value       = false
  editando.value     = !!o
  errorGuardar.value = ''
  materialParaAgregar.value = ''

  if (o) {
    let matsActuales = []
    try {
      const mats = await getMaterialesDeOrden(o.Id_Orden)
      matsActuales = (Array.isArray(mats) ? mats : []).map(m => ({
        Id_Material:     m.Id_Material ?? m.Id_Producto,
        Nombre_Material: m.Nombre_Material ?? m.Nombre_Producto ?? '—',
        cantidad:        m.Cantidad_Usada ?? 1,
      }))
    } catch { matsActuales = [] }

    // ── FIX: bloquear el watch mientras asignamos el form ──
    _ignorarWatchCliente.value = true
    form.value = {
      Id_Orden:                 o.Id_Orden,
      Id_Cliente:               o.Id_Cliente,
      Id_Operario:              o.Id_Operario          || '',
      _operarioOriginal:        o.Id_Operario          || '',
      Producto:                 o.Producto             || '',
      Descripcion:              o.Descripcion          || '',
      Cantidad:                 o.Cantidad,
      Prioridad:                o.Prioridad            || 'Media',
      Dificultad:               o.Dificultad           || 'Media',
      Estado:                   o.Estado               || 'En Proceso',
      Fecha_Limite:             o.Fecha_Limite?.split('T')[0] || o.Fecha_Limite || '',
      Fecha_Creacion:           o.Fecha_Creacion       || null,
      materiales_seleccionados: matsActuales,
    }
    await new Promise(r => setTimeout(r, 0))
    _ignorarWatchCliente.value = false

  } else {
    form.value = formVacio()
  }
  modalVisible.value = true
}

function cerrarModal() {
  modalVisible.value = false
  tocado.value       = false
  errorGuardar.value = ''
  materialParaAgregar.value = ''
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
    Id_Operario:  form.value.Id_Operario  || null,
    Producto:     form.value.Producto     || null,
    Descripcion:  form.value.Descripcion,
    Cantidad:     form.value.Cantidad,
    Prioridad:    form.value.Prioridad    || 'Media',
    Dificultad:   ['Alta', 'Media', 'Baja'].includes(form.value.Dificultad)
                    ? form.value.Dificultad
                    : 'Media',
    Estado:       form.value.Estado       || 'En Proceso',
    Fecha_Limite: form.value.Fecha_Limite,
  }

  console.log('[DEBUG] payload enviado:', JSON.stringify(payload))

  try {
    let idOrden = form.value.Id_Orden

    if (editando.value) {
      await actualizarOrden(idOrden, payload)

      const operarioCambio = payload.Id_Operario &&
                             payload.Id_Operario != form.value._operarioOriginal
      if (operarioCambio) {
        const operario = operarios.value.find(op => op.Id_Usuario == payload.Id_Operario)
        if (operario?.Correo) {
          await notificarTarea(
            `${payload.Producto ? payload.Producto + ' — ' : ''}${payload.Descripcion}`,
            { email: operario.Correo, nombre: operario.Nombre_Completo },
            idOrden,
            payload.Prioridad,
            payload.Fecha_Limite
          )
        }
      }

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

      if (payload.Id_Operario) {
        const operario = operarios.value.find(op => op.Id_Usuario == payload.Id_Operario)
        if (operario?.Correo) {
          await notificarTarea(
            `${payload.Producto ? payload.Producto + ' — ' : ''}${payload.Descripcion}`,
            { email: operario.Correo, nombre: operario.Nombre_Completo },
            idOrden,
            payload.Prioridad,
            payload.Fecha_Limite
          )
        }
      }
    }

    // Gestionar materiales
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

    showToast(editando.value ? 'Orden actualizada correctamente' : 'Orden creada y comprobante generado', 'toast-success')
    await cargarDatos()
    cerrarModal()
  } catch (e) {
    errorGuardar.value = e.message || 'Error al guardar la orden.'
  } finally {
    guardando.value = false
  }
}

// ── DETALLE ───────────────────────────────────────────────────
function verDetalle(o) { detalleOrden.value = o }

// ── ELIMINAR ──────────────────────────────────────────────────
function solicitarEliminar(o) { confirmOrden.value = o }

async function confirmarEliminar() {
  const o = confirmOrden.value
  confirmOrden.value = null
  o._eliminando = true
  try {
    await eliminarOrden(o.Id_Orden)
    await new Promise(r => setTimeout(r, 350))
    ordenes.value = ordenes.value.filter(x => x.Id_Orden !== o.Id_Orden)
    animateStats()
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
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
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
.btn-nueva { display: flex; align-items: center; gap: 6px; background: #1f3a52; color: white; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; flex-shrink: 0; }
.btn-nueva:hover  { background: #162d42; transform: translateY(-1px); }
.btn-nueva:active { transform: translateY(0); }

/* ── STATS ── */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 28px; }
.stat-card { background: white; border-radius: 14px; padding: 20px 20px 20px 24px; border: 1px solid #e5e7eb; position: relative; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s; }
.stats-visible .stat-card { opacity: 1; transform: translateY(0); }
.stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-3px) !important; }
.stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
.stat-icon-bg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); opacity: 0.07; }
.stat-icon-bg svg { width: 52px; height: 52px; }
.stat-lbl { font-size: 13px; color: #6b7280; font-weight: 500; margin-bottom: 10px; }
.stat-num { font-size: 30px; font-weight: 800; line-height: 1; }

/* ── CARGANDO ── */
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 14px; color: #9ca3af; font-size: 14px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #1f3a52; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── TABLA BOX ── */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; overflow: visible; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; transition-delay: 280ms; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-box > .table-header-bar { border-radius: 14px 14px 0 0; }
table { border-radius: 0 0 14px 14px; overflow: hidden; table-layout: fixed; width: 100%; }
th:nth-child(1)  { width: 70px; }
th:nth-child(2)  { width: 14%; }
th:nth-child(3)  { width: 14%; }
th:nth-child(4)  { width: 20%; }
th:nth-child(5)  { width: 11%; }
th:nth-child(6)  { width: 11%; }
th:nth-child(7)  { width: 7%; }
th:nth-child(8)  { width: 110px; }
td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
td:nth-child(4)  { white-space: normal; }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; gap: 12px; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; flex-shrink: 0; }
.table-header-left svg { color: #1f3a52; }
.table-header-right { display: flex; align-items: center; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

/* ── FILTRO CLIENTE ── */
.filtro-cliente-wrap { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 5px 10px; transition: border-color 0.2s, box-shadow 0.2s; }
.filtro-cliente-wrap:focus-within { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.08); }
.filtro-icon { color: #9ca3af; flex-shrink: 0; }
.filtro-cliente-select { border: none; outline: none; font-size: 13px; color: #374151; background: transparent; cursor: pointer; min-width: 160px; max-width: 220px; }
.filtro-cliente-select option { color: #374151; }
.filtro-clear { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 2px; border-radius: 50%; transition: background 0.15s, color 0.15s; flex-shrink: 0; }
.filtro-clear:hover { background: #fee2e2; color: #dc2626; }

/* ── TABLA ── */
table { width: 100%; border-collapse: collapse; }
thead tr { background: #f9fafb; }
th { padding: 12px 14px; font-size: 11px; font-weight: 600; color: #6b7280; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
th.th-sort { cursor: pointer; user-select: none; transition: color 0.15s; }
th.th-sort:hover { color: #1f3a52; }
td { padding: 12px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; }
tr:last-child td { border-bottom: none; }
.table-row { transition: background 0.18s, opacity 0.25s, transform 0.25s; animation: rowFadeIn 0.28s ease both; }
.table-row:hover td { background: #f8fafc; }
@keyframes rowFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.row-eliminando { opacity: 0.4; pointer-events: none; transition: opacity 0.35s; }
.fecha-vencida  { color: #dc2626; font-weight: 600; }
.order-num-pill { display: inline-block; background: #f1f5f9; color: #1f3a52; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; transition: background 0.15s; }
tr:hover .order-num-pill { background: #e0ecff; color: #2563eb; }

/* ── MATERIALES EN TABLA ── */
.materiales-chips { display: flex; flex-wrap: wrap; gap: 4px; max-width: 200px; }
.badge-material { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; white-space: nowrap; }
.badge-material--mas { background: #f8fafc; color: #94a3b8; cursor: default; }
.badge-material--mas:hover { background: #f1f5f9; color: #475569; }

/* ── TOOLTIP ── */
.mat-tooltip { position: absolute; z-index: 9999; background: #1e293b; border-radius: 10px; padding: 10px 14px; min-width: 150px; max-width: 260px; box-shadow: 0 8px 32px rgba(0,0,0,0.28); display: flex; flex-direction: column; gap: 5px; pointer-events: none; animation: tooltipIn 0.15s ease; }
@keyframes tooltipIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.mat-tooltip-chip { display: block; font-size: 12px; font-weight: 500; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mat-tooltip-chip::before { content: '• '; color: #60a5fa; }

/* chips en modal detalle */
.chip-material { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.chip-qty      { font-weight: 400; color: #60a5fa; }
.chip-detalle  { background: #f0fdf4; color: #166534; border-color: #bbf7d0; font-size: 12px; padding: 3px 12px; }
.text-muted    { font-size: 13px; color: #9ca3af; }

/* BADGES */
.badge-estado { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.estado-proceso    { background: #dbeafe; color: #1e40af; }
.estado-completada { background: #dcfce7; color: #166534; }
.estado-retrasada  { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

/* ── ACCIONES ── */
.acciones { display: flex; gap: 6px; align-items: center; }
.action-btn { width: 32px; height: 32px; border: none; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; color: white; -webkit-font-smoothing: antialiased; }
.action-btn svg { pointer-events: none; filter: drop-shadow(0 0 0.3px rgba(255,255,255,0.4)); }
.btn-ver      { background: #1f3a52; } .btn-ver:hover      { background: #2d5580; transform: scale(1.07); }
.btn-editar   { background: #1f3a52; } .btn-editar:hover   { background: #2d5580; transform: scale(1.07); }
.btn-eliminar { background: #1f3a52; } .btn-eliminar:hover { background: #b91c1c; transform: scale(1.07); }

/* ── EMPTY STATE ── */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; gap: 10px; color: #9ca3af; font-size: 14px; }

/* ── MODAL ── */
.modal-overlay   { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-container { background: white; border-radius: 16px; width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-title  { font-size: 16px; font-weight: 700; color: #111827; }
.modal-close  { background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f3f4f6; }
.modal-body   { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid #f3f4f6; }

/* FORM */
.form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 12px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px; }
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

/* DETALLE */
.detalle-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detalle-item  { display: flex; flex-direction: column; gap: 4px; }
.detalle-full  { grid-column: 1 / -1; }
.detalle-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
.detalle-materiales { margin-top: 6px; }

/* CONFIRM */
.confirm-box  { background: white; border-radius: 16px; width: 380px; max-width: 95vw; padding: 28px 24px; text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.confirm-icon { margin-bottom: 12px; }
.confirm-box h3 { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
.confirm-box p  { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
.confirm-btns   { display: flex; gap: 10px; }
.btn-danger { flex: 1; background: #dc2626; color: white; border: none; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-danger:hover { background: #b91c1c; }

/* TOAST */
.toast { position: fixed; bottom: 24px; right: 24px; display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.toast-success { background: #166534; color: white; }
.toast-danger  { background: #991b1b; color: white; }

/* TRANSITIONS */
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.row-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.row-leave-active { transition: opacity 0.15s ease; position: absolute; }
.row-enter-from   { opacity: 0; transform: translateY(8px); }
.row-leave-to     { opacity: 0; }

@media (max-width: 960px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .page-hero  { flex-direction: column; align-items: flex-start; }
  .table-header-bar { flex-wrap: wrap; gap: 10px; }
  .filtro-cliente-select { min-width: 120px; }
}
</style>