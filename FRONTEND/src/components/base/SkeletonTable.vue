<!--
  SkeletonTable — placeholder mientras carga una tabla

  <SkeletonTable v-if="cargando" :filas="6" :columnas="5" />
  <table v-else>...</table>

  La primera columna simula avatar + nombre; la última, botones de acción.
-->
<template>
  <div class="tx-skel-table" role="status" aria-live="polite" :aria-label="etiqueta">
    <div class="tx-skel-table__head" :style="grid">
      <span v-for="c in columnas" :key="`h${c}`" class="tx-skel tx-skel--line tx-skel--head"></span>
    </div>
    <div v-for="f in filas" :key="f" class="tx-skel-table__row" :style="grid">
      <div v-for="c in columnas" :key="c" class="tx-skel-table__cell">
        <template v-if="c === 1 && conAvatar">
          <span class="tx-skel tx-skel--circle"></span>
          <span class="tx-skel tx-skel--line" :style="{ width: ancho(f, c) }"></span>
        </template>
        <template v-else-if="c === columnas && conAcciones">
          <span class="tx-skel tx-skel--btn"></span>
          <span class="tx-skel tx-skel--btn"></span>
        </template>
        <span v-else class="tx-skel tx-skel--line" :style="{ width: ancho(f, c) }"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filas:       { type: Number,  default: 6 },
  columnas:    { type: Number,  default: 4 },
  conAvatar:   { type: Boolean, default: true },
  conAcciones: { type: Boolean, default: true },
  etiqueta:    { type: String,  default: 'Cargando datos' },
})

const grid = computed(() => ({
  gridTemplateColumns: `1.6fr repeat(${Math.max(props.columnas - 1, 0)}, 1fr)`,
}))

// Anchos variados pero estables (no cambian entre renders)
function ancho(f, c) {
  return `${55 + ((f * 7 + c * 13) % 40)}%`
}
</script>

<style>
.tx-skel-table { width: 100%; }
.tx-skel-table__head,
.tx-skel-table__row {
  display: grid;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
}
.tx-skel-table__head {
  padding-block: var(--space-3);
  background: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border);
}
.tx-skel-table__row { border-bottom: 1px solid var(--color-border); min-height: 56px; }
.tx-skel-table__row:last-child { border-bottom: none; }
.tx-skel-table__cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

/* Los bloques base (.tx-skel, .tx-skel--line…) viven en assets/components.css */
</style>
