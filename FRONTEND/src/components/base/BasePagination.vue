<!--
  BasePagination — controles de paginación para tablas y listas

  <BasePagination
    v-model:pagina="pagina"
    v-model:por-pagina="porPagina"
    :total="lista.length"
    etiqueta="usuarios"
  />

  Se oculta sola si todo cabe en una página y no hay selector que mostrar.
-->
<template>
  <nav v-if="total > opcionesTamano[0]" class="tx-pag" :aria-label="`Paginación de ${etiqueta}`">
    <p class="tx-pag__info" aria-live="polite">
      <strong>{{ desde }}–{{ hasta }}</strong> de {{ total }} {{ etiqueta }}
    </p>

    <div class="tx-pag__controls">
      <label class="tx-pag__size">
        <span>Por página</span>
        <select :value="porPagina" @change="$emit('update:porPagina', Number($event.target.value))">
          <option v-for="n in opcionesTamano" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>

      <div class="tx-pag__pages">
        <button
          type="button"
          class="tx-pag__btn"
          :disabled="pagina <= 1"
          aria-label="Página anterior"
          @click="ir(pagina - 1)"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>

        <template v-for="(p, i) in paginasVisibles" :key="`${p}-${i}`">
          <span v-if="p === '…'" class="tx-pag__gap" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            class="tx-pag__btn tx-pag__num"
            :class="{ 'is-active': p === pagina }"
            :aria-current="p === pagina ? 'page' : undefined"
            :aria-label="`Página ${p}`"
            @click="ir(p)"
          >{{ p }}</button>
        </template>

        <button
          type="button"
          class="tx-pag__btn"
          :disabled="pagina >= totalPaginas"
          aria-label="Página siguiente"
          @click="ir(pagina + 1)"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pagina:    { type: Number, required: true },
  porPagina: { type: Number, required: true },
  total:     { type: Number, required: true },
  etiqueta:  { type: String, default: 'resultados' },
  opcionesTamano: { type: Array, default: () => [10, 25, 50] },
})
const emit = defineEmits(['update:pagina', 'update:porPagina'])

const totalPaginas = computed(() => Math.max(1, Math.ceil(props.total / props.porPagina)))
const desde = computed(() => (props.total === 0 ? 0 : (props.pagina - 1) * props.porPagina + 1))
const hasta = computed(() => Math.min(props.pagina * props.porPagina, props.total))

// 1 … 4 5 6 … 12  (máximo 7 botones)
const paginasVisibles = computed(() => {
  const t = totalPaginas.value
  const a = props.pagina
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
  const set = new Set([1, t, a - 1, a, a + 1])
  if (a <= 3) [2, 3, 4].forEach(n => set.add(n))
  if (a >= t - 2) [t - 1, t - 2, t - 3].forEach(n => set.add(n))
  const nums = [...set].filter(n => n >= 1 && n <= t).sort((x, y) => x - y)
  const out = []
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
})

function ir(p) {
  const destino = Math.min(Math.max(1, p), totalPaginas.value)
  if (destino !== props.pagina) emit('update:pagina', destino)
}
</script>

<style>
.tx-pag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3) var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-muted);
}
.tx-pag__info {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.tx-pag__info strong { color: var(--color-text-secondary); font-weight: var(--weight-semibold); }

.tx-pag__controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.tx-pag__size {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.tx-pag__size select {
  height: var(--control-height-sm);
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.tx-pag__size select:focus-visible { outline: var(--focus-outline); outline-offset: 1px; }

.tx-pag__pages {
  display: flex;
  align-items: center;
  gap: 2px;
}
.tx-pag__btn {
  display: grid;
  place-items: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  font: inherit;
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-out);
}
.tx-pag__btn:hover:not(:disabled):not(.is-active) { background: var(--color-surface-hover); color: var(--color-text); }
.tx-pag__btn:active:not(:disabled) { transform: scale(0.94); }
.tx-pag__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tx-pag__btn.is-active {
  background: var(--color-brand);
  color: var(--color-on-brand);
  font-weight: var(--weight-semibold);
}
.tx-pag__gap {
  min-width: 24px;
  text-align: center;
  color: var(--color-text-muted);
}
</style>
