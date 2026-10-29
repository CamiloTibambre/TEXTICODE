<!--
  PageHeader — encabezado compacto de cada vista (≈56px de alto)

  <PageHeader titulo="Gestión de Usuarios" subtitulo="Administración y control de accesos" :icono="ICON_USERS">
    <template #acciones>
      <button class="tx-btn tx-btn--primary">Nuevo usuario</button>
    </template>
  </PageHeader>

  icono: el atributo "d" de un <path> SVG (24x24, estilo outline)
-->
<template>
  <header class="page-header">
    <div class="page-header__main">
      <span v-if="icono" class="page-header__icon" aria-hidden="true">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" :d="icono" />
        </svg>
      </span>
      <div class="page-header__text">
        <h1 class="page-header__title">{{ titulo }}</h1>
        <p v-if="subtitulo" class="page-header__sub">{{ subtitulo }}</p>
      </div>
    </div>
    <div v-if="$slots.acciones" class="page-header__actions">
      <slot name="acciones" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  titulo:    { type: String, required: true },
  subtitulo: { type: String, default: '' },
  icono:     { type: String, default: '' },
})
</script>

<style>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4) var(--space-6);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
  animation: pageHeaderIn var(--duration-slow) var(--ease-out) both;
}
.page-header__main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}
.page-header__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-hover));
  color: var(--color-on-brand);
  box-shadow: var(--shadow-brand);
}
.page-header__text { min-width: 0; }
.page-header__title {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  color: var(--color-text);
  letter-spacing: -0.01em;
}
.page-header__sub {
  margin-top: 2px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

@keyframes pageHeaderIn {
  from { opacity: 0; transform: translateY(calc(var(--motion-shift-sm) * -1)); }
  to   { opacity: 1; transform: none; }
}
</style>
