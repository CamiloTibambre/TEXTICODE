<!--
  KpiCard — tarjeta de indicador compacta (≈76px de alto)

  <div class="kpi-grid">
    <KpiCard v-for="(k, i) in kpis" :key="k.label" v-bind="k" :indice="i" :cargando="cargando" />
  </div>

  Props:
    label     — "Total usuarios"
    valor     — número (se anima al cambiar)
    texto     — muestra un texto en lugar del número (ej. "Vinculado")
    sufijo    — "%", " u", etc. (opcional)
    icono     — atributo "d" de un <path> SVG
    tono      — 'brand' | 'success' | 'info' | 'warning' | 'danger' | 'violet'
    nota      — texto pequeño bajo el número (opcional)
    activo    — resalta la tarjeta (útil cuando funciona como filtro)
    cargando  — muestra el esqueleto
    indice    — posición, para la entrada escalonada
  Si se pasa @click, la tarjeta se vuelve un botón (filtro rápido).
-->
<template>
  <component
    :is="clicable ? 'button' : 'div'"
    :type="clicable ? 'button' : undefined"
    class="kpi-card"
    :class="[`kpi-card--${tono}`, { 'kpi-card--clickable': clicable, 'kpi-card--active': activo }]"
    :style="{ '--i': indice }"
    :aria-pressed="clicable ? activo : undefined"
    @click="clicable && $emit('click')"
  >
    <template v-if="cargando">
      <span class="tx-skel kpi-card__skel-icon"></span>
      <span class="kpi-card__body">
        <span class="tx-skel tx-skel--line" style="width: 70%"></span>
        <span class="tx-skel kpi-card__skel-num"></span>
      </span>
    </template>
    <template v-else>
      <span class="kpi-card__icon" aria-hidden="true">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" :d="icono" />
        </svg>
      </span>
      <span class="kpi-card__body">
        <span class="kpi-card__label">{{ label }}</span>
        <span class="kpi-card__value" :class="{ 'kpi-card__value--text': texto }">{{ texto || `${formateado}${sufijo}` }}</span>
        <span v-if="nota" class="kpi-card__note">{{ nota }}</span>
      </span>
    </template>
  </component>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'
import { useCountUp } from '../composables/useCountUp'

const props = defineProps({
  label:    { type: String, required: true },
  valor:    { type: Number, default: 0 },
  texto:    { type: String, default: '' },
  sufijo:   { type: String, default: '' },
  icono:    { type: String, default: '' },
  tono:     { type: String, default: 'brand' },
  nota:     { type: String, default: '' },
  activo:   { type: Boolean, default: false },
  cargando: { type: Boolean, default: false },
  indice:   { type: Number, default: 0 },
  decimales:{ type: Number, default: 0 },
})
defineEmits(['click'])

const instancia = getCurrentInstance()
const clicable = computed(() => !!instancia?.vnode.props?.onClick)

const animado = useCountUp(() => props.valor, { decimales: props.decimales })
const formateado = computed(() =>
  animado.value.toLocaleString('es-CO', { maximumFractionDigits: props.decimales })
)
</script>

<style>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.kpi-card {
  --kpi-color: var(--color-brand);
  --kpi-soft:  var(--color-brand-soft);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 76px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  font: inherit;
  text-align: left;
  color: inherit;
  box-shadow: var(--shadow-xs);
  animation: kpiIn var(--duration-slow) var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * var(--stagger-step));
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow   var(--duration-fast) var(--ease-standard),
    transform    var(--duration-fast) var(--ease-out);
}
.kpi-card--success { --kpi-color: var(--color-success); --kpi-soft: var(--color-success-soft); }
.kpi-card--info    { --kpi-color: var(--color-info);    --kpi-soft: var(--color-info-soft); }
.kpi-card--warning { --kpi-color: var(--color-warning); --kpi-soft: var(--color-warning-soft); }
.kpi-card--danger  { --kpi-color: var(--color-danger);  --kpi-soft: var(--color-danger-soft); }
.kpi-card--violet  { --kpi-color: #6d28d9;              --kpi-soft: #ede9fe; }

.kpi-card--clickable { cursor: pointer; }
.kpi-card--clickable:hover {
  border-color: var(--kpi-color);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.kpi-card--clickable:active { transform: scale(0.98); }
.kpi-card--active {
  border-color: var(--kpi-color);
  box-shadow: inset 0 0 0 1px var(--kpi-color);
}

.kpi-card__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--kpi-soft);
  color: var(--kpi-color);
}
.kpi-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.kpi-card__label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-card__value {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  line-height: 1.1;
  color: var(--kpi-color);
  font-variant-numeric: tabular-nums;
}
.kpi-card__value--text { font-size: var(--text-lg); line-height: 1.4; }
.kpi-card__note {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.kpi-card__skel-icon { width: 40px; height: 40px; border-radius: var(--radius-md); }
.kpi-card__skel-num  { width: 40%; height: 24px; margin-top: 4px; border-radius: var(--radius-sm); }

@keyframes kpiIn {
  from { opacity: 0; transform: translateY(var(--motion-shift-md)); }
  to   { opacity: 1; transform: none; }
}
</style>
