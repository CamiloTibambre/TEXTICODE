<!--
  EmptyState — estado vacío con mensaje y acción sugerida

  <EmptyState
    icono="buscar"
    titulo="No hay usuarios que coincidan"
    descripcion="Prueba con otro nombre o quita el filtro de rol."
  >
    <button class="tx-btn tx-btn--secondary" @click="limpiarFiltros">Quitar filtros</button>
  </EmptyState>

  icono: 'vacio' | 'buscar' | 'error' | 'caja' | 'documento' (o usa el slot #icono)
  compacto: versión de menor altura para dentro de tablas
-->
<template>
  <div class="tx-empty" :class="{ 'tx-empty--compact': compacto }" role="status">
    <div class="tx-empty__icon" aria-hidden="true">
      <slot name="icono">
        <span v-html="iconos[icono] || iconos.vacio"></span>
      </slot>
    </div>
    <p class="tx-empty__title">{{ titulo }}</p>
    <p v-if="descripcion" class="tx-empty__desc">{{ descripcion }}</p>
    <div v-if="$slots.default" class="tx-empty__actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  titulo:      { type: String, required: true },
  descripcion: { type: String, default: '' },
  icono:       { type: String, default: 'vacio' },
  compacto:    { type: Boolean, default: false },
})

const ico = d => `<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`
const iconos = {
  vacio:     ico('M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z'),
  buscar:    ico('m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'),
  error:     ico('M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z'),
  caja:      ico('m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9'),
  documento: ico('M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'),
}
</script>

<style>
.tx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-12) var(--space-6);
  animation: txEmptyIn var(--duration-slow) var(--ease-out) both;
}
.tx-empty--compact { padding: var(--space-8) var(--space-4); }

.tx-empty__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-brand-soft);
  color: var(--color-brand);
}
.tx-empty--compact .tx-empty__icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-3);
}

.tx-empty__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}
.tx-empty__desc {
  max-width: 380px;
  margin-top: var(--space-1);
  font-size: var(--text-base);
  color: var(--color-text-muted);
}
.tx-empty__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

@keyframes txEmptyIn {
  from { opacity: 0; transform: translateY(var(--motion-shift-sm)); }
  to   { opacity: 1; transform: none; }
}
</style>
