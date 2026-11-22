<template>
  <div class="layout">

    <main class="main">

      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <PageHeader
        titulo="Gestión de Producción"
        :subtitulo="cargando ? 'Cargando órdenes…' : `${ordenes.length} órdenes registradas`"
        icono="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
      >
        <template #acciones>
          <div class="filtro-cliente-wrap">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="filtro-icon" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
            </svg>
            <select v-model="filtroCliente" class="filtro-cliente-select" aria-label="Filtrar por cliente">
              <option value="">Todos los clientes</option>
              <option v-for="c in clientes" :key="c.Id_Usuario" :value="c.Id_Usuario">
                {{ c.Nombre_Completo }}
              </option>
            </select>
            <button v-if="filtroCliente" type="button" class="filtro-clear" aria-label="Quitar filtro de cliente" @click="filtroCliente = ''">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <button type="button" class="tx-btn tx-btn--primary" @click="abrirModal(null)">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Nueva orden
          </button>
        </template>
      </PageHeader>

      <!-- KPIs: cada tarjeta filtra por estado -->
      <div class="kpi-grid" role="group" aria-label="Filtrar órdenes por estado">
        <KpiCard
          v-for="(k, i) in kpis"
          :key="k.label"
          :label="k.label"
          :valor="k.valor"
          :icono="k.icono"
          :tono="k.tono"
          :activo="filtroEstado === k.filtro"
          :cargando="cargando"
          :indice="i"
          @click="filtroEstado = k.filtro"
        />
      </div>

      <!-- CARGANDO -->
      <div v-if="cargando" class="cards-list">
        <SkeletonCard v-for="i in 6" :key="i" variante="contenido" :lineas="3" />
      </div>

      <!-- LISTA DE TARJETAS -->
      <EmptyState
        v-else-if="ordenesFiltradas.length === 0"
        :icono="(filtroCliente || filtroEstado) ? 'buscar' : 'documento'"
        :titulo="(filtroCliente || filtroEstado) ? 'No hay órdenes con estos filtros' : 'Todavía no hay órdenes'"
        :descripcion="(filtroCliente || filtroEstado) ? 'Prueba con otro estado o cliente.' : 'Crea la primera orden de producción para empezar a hacer seguimiento.'"
        class="empty-card"
      >
        <button v-if="filtroCliente || filtroEstado" type="button" class="tx-btn tx-btn--secondary" @click="filtroCliente = ''; filtroEstado = ''">Quitar filtros</button>
        <button v-else type="button" class="tx-btn tx-btn--primary" @click="abrirModal(null)">Crear orden</button>
      </EmptyState>

      <div v-else class="cards-list">
        <TransitionGroup name="row" :key="filterKey">
          <div
            v-for="(o, idx) in ordenesFiltradas"
            :key="o.Id_Orden"
            class="orden-card"
            :class="{ 'card-eliminando': o._eliminando }"
            :style="{ '--row-i': Math.min(idx, 12) }"
          >
            <div class="orden-card-top">
              <span class="order-num-pill">ORD-{{ String(o.Id_Orden).padStart(3,'0') }}</span>
              <span class="badge-prioridad" :class="clasePrioridad(o.Prioridad)">{{ o.Prioridad }}</span>
              <span class="badge-estado" :class="claseEstado(o.Estado)">{{ o.Estado }}</span>
              <div class="orden-card-acciones">
                <button type="button" class="icon-view-btn" @click="abrirVista(o)" :aria-label="`Ver detalle de la orden ${o.Id_Orden}`" title="Ver detalle">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  </svg>
                </button>
                <button type="button" class="icon-edit-btn" @click="abrirModal(o)" :aria-label="`Editar orden ${o.Id_Orden}`" title="Editar">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                  </svg>
                </button>
                <button type="button" class="icon-del-btn" @click="solicitarEliminar(o)" :aria-label="`Eliminar orden ${o.Id_Orden}`" title="Eliminar">
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
                    :style="{ width: '100%', transform: `scaleX(${pctOrden(o) / 100})` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

    </main>

    <!-- ══ MODAL CREAR / EDITAR ══ -->
    <BaseModal
      :open="modalVisible"
      :titulo="editando ? 'Editar orden' : 'Nueva orden de producción'"
      :descripcion="editando ? `ORD-${String(form.Id_Orden).padStart(3, '0')} · Si agregas fases, sus operarios reciben aviso por correo.` : 'Datos de la orden a la izquierda; materiales y fases a la derecha.'"
      tamano="xl"
      :cerrar-al-clic-fuera="false"
      @update:open="val => !val && cerrarModal()"
    >
      <form id="form-orden" class="tx-form" novalidate @submit.prevent="guardar">
        <Transition name="tx-field-msg">
          <p v-if="errorGuardar" class="tx-form-alert" role="alert">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/></svg>
            <span>{{ errorGuardar }}</span>
          </p>
        </Transition>

        <div class="orden-form-cols">
          <!-- Columna izquierda: datos de la orden -->
          <fieldset class="tx-form-section">
            <legend class="tx-form-section__title">Datos de la orden</legend>
            <div class="tx-form-grid">
              <BaseField label="Cliente" requerido completo :error="v.error('Id_Cliente')" v-slot="{ attrs }">
                <select v-bind="attrs" v-model="form.Id_Cliente" class="tx-input" required @blur="v.tocar('Id_Cliente')">
                  <option value="">Selecciona un cliente</option>
                  <option v-for="c in clientes" :key="c.Id_Usuario" :value="c.Id_Usuario">{{ c.Nombre_Completo }}</option>
                </select>
              </BaseField>

              <BaseField label="Producto" opcional completo v-slot="{ attrs }">
                <input v-bind="attrs" v-model="form.Producto" class="tx-input" type="text" placeholder="Ej: Camisa polo talla M" autocomplete="off">
              </BaseField>

              <BaseField label="Descripción" requerido completo :error="v.error('Descripcion')" v-slot="{ attrs }">
                <textarea v-bind="attrs" v-model="form.Descripcion" class="tx-input orden-desc" rows="2" required
                  placeholder="Qué se va a fabricar y detalles importantes" @blur="v.tocar('Descripcion')"></textarea>
              </BaseField>

              <BaseField label="Cantidad de prendas" requerido :error="v.error('Cantidad')" v-slot="{ attrs }">
                <input v-bind="attrs" v-model.number="form.Cantidad" class="tx-input" type="number" min="1" inputmode="numeric" required @blur="v.tocar('Cantidad')">
              </BaseField>

              <BaseField label="Fecha límite" requerido :error="v.error('Fecha_Limite')" v-slot="{ attrs }">
                <input v-bind="attrs" v-model="form.Fecha_Limite" class="tx-input" type="date" required @blur="v.tocar('Fecha_Limite')">
              </BaseField>

              <BaseField label="Prioridad" v-slot="{ attrs }">
                <select v-bind="attrs" v-model="form.Prioridad" class="tx-input">
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </BaseField>

              <BaseField label="Dificultad" v-slot="{ attrs }">
                <select v-bind="attrs" v-model="form.Dificultad" class="tx-input">
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </BaseField>

              <BaseField v-if="editando" label="Estado" completo v-slot="{ attrs }">
                <select v-bind="attrs" v-model="form.Estado" class="tx-input">
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completada">Completada</option>
                  <option value="Retrasada">Retrasada</option>
                </select>
              </BaseField>
            </div>
          </fieldset>

          <!-- Columna derecha: materiales y fases -->
          <div class="orden-form-side">
            <fieldset class="tx-form-section">
              <legend class="tx-form-section__title">Materiales <span class="tx-field__req" aria-hidden="true">*</span></legend>

              <TransitionGroup v-if="form.materiales_seleccionados.length > 0" name="chip" tag="ul" class="chips-wrap" aria-label="Materiales de la orden">
                <li v-for="(item, idx) in form.materiales_seleccionados" :key="item.Id_Material" class="chip-selected">
                  <span class="chip-nombre">{{ item.Nombre_Material }}</span>
                  <label class="chip-cantidad-wrap">
                    <span class="chip-cant-lbl">Cant.</span>
                    <input v-model.number="item.cantidad" type="number" min="1" class="chip-cant-input" placeholder="0"
                      :aria-label="`Cantidad de ${item.Nombre_Material}`">
                  </label>
                  <button type="button" class="chip-remove" :aria-label="`Quitar ${item.Nombre_Material}`" title="Quitar" @click="quitarMaterial(idx)">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </li>
              </TransitionGroup>

              <BaseField :label="form.materiales_seleccionados.length ? 'Agregar otro material' : 'Agregar material'"
                :error="v.error('materiales')"
                :hint="!form.Id_Cliente ? 'Primero elige el cliente: solo se listan sus materiales.' : materialesFiltrados.length ? '' : 'Este cliente no tiene más materiales disponibles.'"
                v-slot="{ attrs }">
                <div class="material-add-row">
                  <select v-bind="attrs" v-model="materialParaAgregar" class="tx-input material-select"
                    :disabled="!form.Id_Cliente" @blur="v.tocar('materiales')">
                    <option value="">Selecciona un material…</option>
                    <option v-for="m in materialesFiltrados" :key="m.Id_Material" :value="m.Id_Material">
                      {{ m.Nombre_Material }} (stock: {{ m.Stock_Actual }} {{ m.Unidad }})
                    </option>
                  </select>
                  <button type="button" class="tx-btn tx-btn--secondary" :disabled="!materialParaAgregar" @click="agregarMaterial">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                    Agregar
                  </button>
                </div>
              </BaseField>
            </fieldset>

            <fieldset class="tx-form-section">
              <legend class="tx-form-section__title">Operarios y fases</legend>

              <TransitionGroup v-if="form.fases.length > 0" name="chip" tag="ul" class="chips-wrap" aria-label="Fases de la orden">
                <li v-for="(f, idx) in form.fases" :key="f.Id_Orden_Operario || `n-${idx}-${f.Id_Operario}`" class="chip-selected chip-fase-item">
                  <span class="chip-nombre">F{{ f.Numero_Fase }} · {{ nombreOperario(f.Id_Operario) }}</span>
                  <span v-if="f.Descripcion_Fase" class="chip-fase-desc">{{ f.Descripcion_Fase }}</span>
                  <button type="button" class="chip-remove"
                    :aria-label="`Quitar fase ${f.Numero_Fase} de ${nombreOperario(f.Id_Operario)}`"
                    :title="f.Estado_Fase === 'Completada' ? 'Ya completada: no se puede quitar' : 'Quitar'"
                    :disabled="f.Estado_Fase === 'Completada'" @click="quitarFase(idx)">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </li>
              </TransitionGroup>
              <p v-else class="tx-field__hint orden-sin-fases">Sin fases todavía. Cada fase es un paso de producción con su operario.</p>

              <div class="fase-add-grid">
                <BaseField label="Operario" v-slot="{ attrs }">
                  <select v-bind="attrs" v-model="operarioParaFase" class="tx-input">
                    <option value="">Seleccionar…</option>
                    <option v-for="op in operarios" :key="op.Id_Usuario" :value="op.Id_Usuario">{{ op.Nombre_Completo }}</option>
                  </select>
                </BaseField>
                <BaseField label="N.° fase" v-slot="{ attrs }">
                  <input v-bind="attrs" v-model.number="numeroFaseNueva" type="number" min="1" inputmode="numeric" class="tx-input">
                </BaseField>
                <BaseField label="Qué hace en esta fase" opcional completo v-slot="{ attrs }">
                  <div class="material-add-row">
                    <input v-bind="attrs" v-model="descripcionFaseNueva" type="text" class="tx-input" placeholder="Ej: Corte de piezas"
                      @keydown.enter.prevent="agregarFase">
                    <button type="button" class="tx-btn tx-btn--secondary" :disabled="!operarioParaFase" @click="agregarFase">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                      Agregar fase
                    </button>
                  </div>
                </BaseField>
              </div>
            </fieldset>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" class="tx-btn tx-btn--secondary" :disabled="guardando" @click="cerrarModal">Cancelar</button>
        <button type="submit" form="form-orden" class="tx-btn tx-btn--primary" :disabled="guardando">
          <span v-if="guardando" class="tx-spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear orden' }}
        </button>
      </template>
    </BaseModal>

    <!-- ══ DETALLE (panel lateral) ══ -->
    <BaseDrawer
      :open="verVisible"
      :titulo="ordenVista?.Producto || ordenVista?.Descripcion || 'Orden'"
      :descripcion="ordenVista ? `ORD-${String(ordenVista.Id_Orden).padStart(3, '0')}` : ''"
      ancho="lg"
      @update:open="val => !val && cerrarVista()"
    >
          <div class="view-body">

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
                    :style="{ width: '100%', transform: `scaleX(${(ordenVista ? pctOrden(ordenVista) : 0) / 100})` }"
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
    </BaseDrawer>

  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import {
  getOrdenes, crearOrden, actualizarOrden, eliminarOrden,
  getUsuarios, getMateriales,
  getMaterialesDeOrden, agregarMaterialOrden, eliminarMaterialOrden,
  getFasesDeOrden, crearFaseOperario, eliminarFaseOperario,
  crearComprobante
} from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import EmptyState from '../../components/base/EmptyState.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseDrawer from '../../components/base/BaseDrawer.vue'
import BaseField from '../../components/base/BaseField.vue'
import { useValidacion } from '../../composables/useValidacion'
import SkeletonCard from '../../components/base/SkeletonCard.vue'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const toast     = useToast()
const confirmar = useConfirm()

import { useNotificaciones } from '../../composables/useNotificaciones'
const { notificarTarea } = useNotificaciones()

const auth = useAuthStore()

// ── ESTADO ────────────────────────────────────────────────────
const cargando      = ref(true)
const errorGuardar  = ref('')
const guardando     = ref(false)
const modalVisible  = ref(false)
const editando      = ref(false)
const verVisible    = ref(false)
const ordenVista    = ref(null)

const ordenes    = ref([])
const clientes   = ref([])
const materiales = ref([])
const operarios  = ref([])
// Cuánto tenía reservado la orden que se está editando de cada
// material (Id_Material -> cantidad), usado para validar stock en
// guardar() sin bloquear una re-edición válida. Vacío al crear una
// orden nueva (no hay nada reservado todavía).
const materialesOriginalesOrden = ref({})

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

// ── Validación del formulario ───────────────────────────────────
const errores = computed(() => ({
  Id_Cliente:   !form.value.Id_Cliente ? 'Elige el cliente de la orden.' : '',
  Descripcion:  !String(form.value.Descripcion || '').trim() ? 'Describe qué se va a fabricar.' : '',
  Cantidad:     !(Number(form.value.Cantidad) >= 1) ? 'Usa un número mayor a 0.' : '',
  Fecha_Limite: !form.value.Fecha_Limite ? 'Elige la fecha límite.' : '',
  materiales:   form.value.materiales_seleccionados.length === 0
    ? 'Agrega al menos un material.'
    : form.value.materiales_seleccionados.some(m => !(Number(m.cantidad) >= 1))
      ? 'Cada material necesita una cantidad mayor a 0.'
      : '',
}))
const v = useValidacion(errores)

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
  errorGuardar.value = ''
}
function quitarMaterial(idx) {
  form.value.materiales_seleccionados.splice(idx, 1)
}

// ── Fases / operarios ───────────────────────────────────────────
function agregarFase() {
  if (!operarioParaFase.value) return
  errorGuardar.value = ''
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
  const f = form.value.fases[idx]
  if (f && f.Estado_Fase === 'Completada') {
    errorGuardar.value = 'No puedes quitar una fase que el operario ya completó.'
    return
  }
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

onMounted(cargarDatos)

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

const ICON_TOTAL = 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z'
const ICON_SYNC  = 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'
const ICON_OK    = 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
const ICON_WARN  = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'

const kpis = computed(() => [
  { label: 'Total órdenes', valor: estadisticas.value.total,       icono: ICON_TOTAL, tono: 'brand',   filtro: '' },
  { label: 'En proceso',    valor: estadisticas.value.enProceso,   icono: ICON_SYNC,  tono: 'info',    filtro: 'En Proceso' },
  { label: 'Completadas',   valor: estadisticas.value.completadas, icono: ICON_OK,    tono: 'success', filtro: 'Completada' },
  { label: 'Retrasadas',    valor: estadisticas.value.retrasadas,  icono: ICON_WARN,  tono: 'danger',  filtro: 'Retrasada' },
])

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
  v.reiniciar()
  editando.value      = !!o
  errorGuardar.value  = ''
  materialParaAgregar.value  = ''
  operarioParaFase.value     = ''
  descripcionFaseNueva.value = ''
  // Cuánto tenía reservado ESTA orden de cada material, antes de
  // editar. Se usa al validar stock en guardar(): esa cantidad se
  // devuelve al inventario antes de volver a descontarse, así que no
  // debe contar como "no disponible" al reeditar la misma orden.
  materialesOriginalesOrden.value = {}

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
      matsActuales.forEach(m => {
        materialesOriginalesOrden.value[m.Id_Material] = m.cantidad
      })
    } catch { matsActuales = [] }
    try {
      const fases = await getFasesDeOrden(o.Id_Orden)
      fasesActuales = (Array.isArray(fases) ? fases : [])
        .map(f => ({
          Id_Orden_Operario: f.Id_Orden_Operario,   
          Id_Orden_Operario: f.Id_Orden_Operario,
          Estado_Fase:       f.Estado_Fase,
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
  errorGuardar.value  = ''
  materialParaAgregar.value = ''
  operarioParaFase.value    = ''
}

// ── GUARDAR ───────────────────────────────────────────────────
async function guardar() {
  errorGuardar.value = ''
  if (!(await v.validar())) return

  // Validar stock ANTES de tocar la orden — así, si algo no alcanza,
  // no queda una orden a medias (creada/editada pero sin sus
  // materiales). Al editar, lo que esta misma orden ya tenía reservado
  // (materialesOriginalesOrden) se devuelve antes de reasignar, así
  // que cuenta como disponible; el backend sigue validando de nuevo
  // con el dato real al momento de guardar (esto es solo para avisar
  // antes, no reemplaza esa validación).
  for (const mat of form.value.materiales_seleccionados) {
    const infoMaterial = materiales.value.find(m => m.Id_Material === mat.Id_Material)
    const yaReservado  = materialesOriginalesOrden.value[mat.Id_Material] || 0
    const disponible   = (Number(infoMaterial?.Stock_Actual) || 0) + yaReservado
    if (mat.cantidad > disponible) {
      errorGuardar.value = `No hay suficiente stock de "${mat.Nombre_Material}": disponible ${disponible}${infoMaterial?.Unidad ? ' ' + infoMaterial.Unidad : ''}, se necesitan ${mat.cantidad}.`
      return
    }
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
      // Antes esto tenía un try/catch que solo hacía console.warn: con
      // la validación de stock que ahora hace el backend (POST
      // /orden-material bloquea si no hay suficiente), tragarse el
      // error aquí dejaría la orden "guardada" sin avisar que el
      // material nunca se asignó ni se descontó. Se deja que el error
      // suba al catch de guardar() de más abajo, que sí lo muestra en
      // errorGuardar. (La orden en sí ya quedó creada/actualizada antes
      // de este punto — eso no se revierte; si esto te preocupa, se
      // puede mover la validación de stock a ANTES de crear la orden.)
      await agregarMaterialOrden({
        Id_Orden:       idOrden,
        Id_Producto:    mat.Id_Material,
        Cantidad_Usada: mat.cantidad || 1,
      })
    }

    // Fases: sincronizar SIN borrar las que no cambiaron
    // (borrar y recrear reiniciaba las fases ya completadas y se perdia el historial).
    let fasesExistentes = []
    try { fasesExistentes = (await getFasesDeOrden(idOrden)) || [] } catch { /* continuar */ }

    const idsEnForm = new Set(
      form.value.fases.map(f => f.Id_Orden_Operario).filter(Boolean)
    )

    // Quitar solo las fases que el admin removio en el modal
    for (const f of fasesExistentes) {
      if (!idsEnForm.has(f.Id_Orden_Operario)) {
        try { await eliminarFaseOperario(f.Id_Orden_Operario) }
        catch (e) { console.warn('No se pudo quitar la fase:', e.message) }
      }
    }

    let notificado = false
    for (const fase of form.value.fases) {
      if (fase.Id_Orden_Operario) continue   // ya existe: no se toca
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

    toast.success(editando.value ? 'Cambios guardados.' : 'Orden creada.')
    await cargarDatos()
    cerrarModal()
  } catch (e) {
    errorGuardar.value = e.message || 'No se pudo guardar la orden. Revisa los datos e inténtalo de nuevo.'
  } finally {
    guardando.value = false
  }
}

// ── ELIMINAR ──
async function solicitarEliminar(o) {
  const ok = await confirmar({
    titulo: `¿Eliminar la orden #${o.Id_Orden}?`,
    mensaje: `Es de ${o.Cliente || 'un cliente sin nombre'}. Esta acción no se puede deshacer.`,
    textoConfirmar: 'Eliminar orden',
    tono: 'danger',
  })
  if (!ok) return
  o._eliminando = true
  try {
    await eliminarOrden(o.Id_Orden)
    await new Promise(r => setTimeout(r, 300))
    ordenes.value = ordenes.value.filter(x => x.Id_Orden !== o.Id_Orden)
    toast.success(`Orden #${o.Id_Orden} eliminada.`)
  } catch {
    o._eliminando = false
    toast.error('No se pudo eliminar la orden. Inténtalo de nuevo.')
  }
}
</script>

<style scoped>
/* ── FORMULARIO DE ORDEN (fase 7) ── */
.orden-form-cols { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: var(--space-6); align-items: start; }
.orden-form-side { display: flex; flex-direction: column; gap: var(--space-5); padding-left: var(--space-6); border-left: 1px solid var(--color-border); }
.orden-form-side .tx-form-section + .tx-form-section { padding-top: var(--space-5); }
.orden-desc { min-height: 64px; }
.orden-sin-fases { margin-bottom: var(--space-3); }
.chips-wrap { list-style: none; margin: 0 0 var(--space-3); padding: 0; }
.material-add-row { display: flex; gap: var(--space-2); }
.material-add-row .tx-input { flex: 1; min-width: 0; }
.material-add-row .tx-btn { flex-shrink: 0; }
.fase-add-grid { display: grid; grid-template-columns: minmax(0, 1fr) 96px; gap: var(--space-3); }
.chip-remove:disabled { opacity: 0.35; cursor: not-allowed; }
.chip-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.chip-leave-active { transition: opacity var(--duration-fast) var(--ease-in), transform var(--duration-fast) var(--ease-in); position: absolute; }
.chip-enter-from, .chip-leave-to { opacity: 0; transform: scale(0.94); }
.chip-move { transition: transform var(--duration-base) var(--ease-out); }

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

/* ── FILTROS ── */
.filtro-cliente-wrap { display: flex; align-items: center; gap: 6px; height: var(--control-height); background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); padding: 0 10px; transition: border-color var(--duration-fast), box-shadow var(--duration-fast); }
.filtro-cliente-wrap:focus-within { border-color: var(--focus-ring-color); box-shadow: var(--focus-ring); }
.filtro-icon { color: var(--color-text-muted); flex-shrink: 0; }
.filtro-cliente-select { border: none; outline: none; font: inherit; font-size: var(--text-base); color: var(--color-text-secondary); background: transparent; cursor: pointer; min-width: 160px; max-width: 220px; }
.filtro-clear { background: none; border: none; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; padding: 2px; border-radius: 50%; transition: background 0.15s, color 0.15s; flex-shrink: 0; }
.filtro-clear:hover { background: #fee2e2; color: #b91c1c; }

/* ── LISTA DE TARJETAS ── */
/* Grilla: aprovecha el ancho (2-3 columnas en escritorio) en vez de una sola columna */
.cards-list {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-4);
  align-items: start;
  padding-bottom: var(--space-8);
}

.orden-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; animation: rowFadeIn var(--duration-base) var(--ease-out) both; animation-delay: calc(var(--row-i, 0) * 30ms); transition: box-shadow var(--duration-fast), transform var(--duration-fast) var(--ease-out), opacity var(--duration-base); }
.orden-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
@keyframes rowFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.card-eliminando { opacity: 0.35; pointer-events: none; }

.orden-card-top { display: flex; align-items: center; gap: 6px; padding: 10px 10px 10px 16px; border-bottom: 1px solid var(--color-border); }
.order-num-pill { font-size: 12px; font-weight: 700; color: #1f3a52; background: #f1f5f9; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; }
.badge-prioridad { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.prio-alta  { background: #fef9c3; color: #92400e; }
.prio-media { background: #fef9c3; color: #92400e; }
.prio-baja  { background: #f0fdf4; color: #166534; }
/* Acciones ligeras: no compiten con el contenido de la tarjeta */
.icon-view-btn, .icon-edit-btn, .icon-del-btn { width: 32px; height: 32px; border-radius: var(--radius-md); border: none; background: transparent; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background var(--duration-fast), color var(--duration-fast), transform var(--duration-fast) var(--ease-out); }
.orden-card-acciones { display: flex; gap: 2px; margin-left: auto; flex-shrink: 0; }
.icon-view-btn:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.icon-view-btn:active, .icon-edit-btn:active, .icon-del-btn:active { transform: scale(0.92); }
.icon-edit-btn:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.icon-del-btn:hover { background: var(--color-danger-soft); color: var(--color-danger); }
.badge-estado { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.estado-proceso    { background: #dbeafe; color: #1e40af; }
.estado-completada { background: #dcfce7; color: #166534; }
.estado-retrasada  { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

.orden-card-body { padding: 12px 16px 16px; }
.orden-titulo { font-size: 17px; font-weight: 700; color: #111827; margin: 0 0 2px; }
.orden-cliente { font-size: 13px; color: #6b7280; margin: 0 0 12px; }

.chips-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.orden-fases-info { font-size: 13px; color: #6b7280; margin: 0 0 12px; }
.orden-fases-label { color: #6b7280; margin-right: 4px; }
.chip-mat  { font-size: 12px; font-weight: 500; padding: 4px 12px; border-radius: 999px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; white-space: nowrap; }
.chip-mat-qty { color: var(--color-text-muted); font-weight: 400; }

.orden-vence { font-size: var(--text-xs); color: var(--color-text-muted); text-align: right; margin-bottom: 6px; }

.orden-progreso { margin-top: 4px; }
.orden-progreso-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.orden-progreso-txt { font-size: 14px; color: #374151; }
.orden-progreso-pct { font-size: 14px; font-weight: 700; color: #1f3a52; }
.orden-progreso-bar { width: 100%; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.orden-progreso-fill { height: 100%; background: #1f3a52; border-radius: 999px; transform-origin: left; transition: transform var(--duration-slower) var(--ease-out); }
.orden-progreso-fill.fill-proceso   { background: #7c3aed; }
.orden-progreso-fill.fill-retrasada { background: #dc2626; }
.orden-progreso-fill.fill-completo  { background: #16a34a; }

/* ── EMPTY STATE ── */
.empty-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }

/* ── MODAL ── */

/* ── MODAL VER DETALLE ── */
.view-body         { display: flex; flex-direction: column; gap: var(--space-6); }
.view-badges       { display: flex; gap: 8px; }
.view-section      { display: flex; flex-direction: column; gap: 10px; }
.view-section-title{ font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.3px; }
.view-info-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
.view-info-item    { display: flex; flex-direction: column; gap: 2px; }
.view-info-label   { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
.view-info-value   { font-size: 13.5px; color: #111827; font-weight: 600; }
.view-desc-box     { margin: 0; font-size: 13.5px; color: #374151; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; line-height: 1.5; }
.view-empty-txt    { margin: 0; font-size: 13px; color: var(--color-text-muted); font-style: italic; }
.view-fases-list   { display: flex; flex-direction: column; gap: 10px; }
.view-fase-card    { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.view-fase-top     { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.view-fase-left    { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.view-fase-pill    { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: #ede9fe; color: #5b21b6; white-space: nowrap; }
.view-fase-operario{ font-size: 13.5px; font-weight: 700; color: #111827; }
.view-fase-estado  { font-size: 12px; font-weight: 600; white-space: nowrap; }
.view-fase-estado.completada { color: #15803d; }
.view-fase-estado.pendiente  { color: var(--color-text-muted); }
.view-fase-desc    { margin: 0; font-size: 13px; color: #374151; }
.view-fase-cant    { font-size: 12px; color: var(--color-text-muted); }

/* FORM */

/* CHIPS MATERIALES (modal) */
.chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; min-height: 46px; }
.chip-selected { display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 5px 10px 5px 14px; font-size: 12px; color: #1d4ed8; font-weight: 600; }
.chip-nombre { white-space: nowrap; }
.chip-cantidad-wrap { display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #bfdbfe; border-radius: 6px; padding: 2px 6px; }
.chip-cant-lbl   { font-size: 10px; color: #60a5fa; font-weight: 500; white-space: nowrap; }
.chip-cant-input { width: 44px; border: none; outline: none; background: transparent; font-size: 12px; font-weight: 700; color: #1d4ed8; text-align: center; }
.chip-remove { background: none; border: none; cursor: pointer; color: #2563eb; display: flex; align-items: center; padding: 2px; border-radius: 50%; transition: background 0.15s, color 0.15s; }
.chip-remove:hover { background: #dbeafe; color: #1d4ed8; }
.material-add-row { display: flex; gap: 8px; align-items: center; }
.material-select  { flex: 1; }

/* CHIPS FASES (modal) */
.chip-fase-item { background: #f5f3ff; border-color: #ddd6fe; color: #5b21b6; }
.chip-fase-desc { font-size: 11px; font-weight: 400; color: #7c3aed; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* TRANSITIONS */
.row-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.row-leave-active { transition: opacity var(--duration-fast) var(--ease-in); animation: none; position: absolute; }
.row-enter-from   { opacity: 0; transform: translateY(8px); }
.row-leave-to     { opacity: 0; }

@media (max-width: 700px) {
  .main { padding: 20px 14px 90px; }
  .view-info-grid { grid-template-columns: 1fr; }
}
</style>