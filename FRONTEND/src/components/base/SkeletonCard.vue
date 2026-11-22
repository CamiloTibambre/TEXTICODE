<!--
  SkeletonCard — placeholder para tarjetas KPI y tarjetas de contenido

  <div class="kpi-grid">
    <SkeletonCard v-for="i in 4" :key="i" variante="kpi" />
  </div>

  variante: 'kpi' (número grande) | 'contenido' (título + líneas)
-->
<template>
  <div class="tx-skel-card" :class="`tx-skel-card--${variante}`" role="status" aria-label="Cargando">
    <template v-if="variante === 'kpi'">
      <div class="tx-skel-card__row">
        <span class="tx-skel tx-skel--line" style="width: 45%"></span>
        <span class="tx-skel tx-skel--icon"></span>
      </div>
      <span class="tx-skel tx-skel--number"></span>
    </template>
    <template v-else>
      <span class="tx-skel tx-skel--line" style="width: 60%; height: 14px"></span>
      <span v-for="l in lineas" :key="l" class="tx-skel tx-skel--line" :style="{ width: `${90 - l * 12}%` }"></span>
    </template>
  </div>
</template>

<script setup>
defineProps({
  variante: { type: String, default: 'kpi', validator: v => ['kpi', 'contenido'].includes(v) },
  lineas:   { type: Number, default: 3 },
})
</script>

<style>
.tx-skel-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.tx-skel-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tx-skel--icon   { width: 32px; height: 32px; border-radius: var(--radius-md); }
.tx-skel--number { width: 38%; height: 28px; border-radius: var(--radius-md); }
</style>
