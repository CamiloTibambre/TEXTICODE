<!--
  PrintHost — se monta UNA vez en App.vue. Muestra la animación de
  "impresora" mientras se genera y descarga un comprobante (useImpresion).
-->
<template>
  <Teleport to="body">
    <Transition name="ph">
      <div v-if="estado.visible" class="ph" role="status" aria-live="polite">
        <div :key="estado.ciclo" class="ph__card" :class="`is-${estado.fase}`">

          <div class="printer" aria-hidden="true">
            <!-- Hoja en blanco entrando por arriba -->
            <div class="printer__feed"><span class="sheet-in"></span></div>

            <!-- Cuerpo de la impresora -->
            <div class="printer__body">
              <span class="printer__shine"></span>
              <span class="printer__light"></span>
              <span class="printer__btn"></span>
              <span class="printer__btn printer__btn--2"></span>
              <span class="printer__slot"></span>
            </div>

            <!-- Comprobante saliendo -->
            <div class="printer__out">
              <div class="paper">
                <div class="paper__head">
                  <span class="paper__logo"></span>
                  <span class="paper__brand">TEXTICODE</span>
                  <span class="paper__num">{{ estado.numero }}</span>
                </div>
                <div class="paper__body">
                  <p class="paper__title">COMPROBANTE DE ENTREGA</p>
                  <div class="paper__row"><i style="width: 46%"></i><i style="width: 28%"></i></div>
                  <div class="paper__row"><i style="width: 60%"></i></div>
                  <div class="paper__table"></div>
                  <div class="paper__row"><i style="width: 70%"></i><i style="width: 14%"></i></div>
                  <div class="paper__row"><i style="width: 52%"></i><i style="width: 14%"></i></div>
                  <div class="paper__sign"><i></i><i></i></div>
                </div>
                <span class="paper__stamp">ENTREGADO</span>
              </div>
            </div>
          </div>

          <p class="ph__title">
            <template v-if="estado.fase === 'imprimiendo'">Imprimiendo comprobante…</template>
            <template v-else-if="estado.fase === 'listo'">¡Listo! Descargando PDF</template>
            <template v-else>No se pudo imprimir</template>
          </p>
          <p class="ph__sub">
            <template v-if="estado.fase === 'error'">Inténtalo de nuevo en un momento.</template>
            <template v-else>{{ estado.numero }}<template v-if="estado.cliente"> · {{ estado.cliente }}</template></template>
          </p>
          <div class="ph__progress"><i></i></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useImpresion } from '../../composables/useImpresion'
const { estado } = useImpresion()
</script>

<style scoped>
/* ── Capa ───────────────────────────────────────────────────── */
.ph {
  position: fixed;
  inset: 0;
  z-index: var(--z-toast, 2000);
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.ph-enter-active, .ph-leave-active { transition: opacity 0.25s ease; }
.ph-enter-active .ph__card, .ph-leave-active .ph__card { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.ph-enter-from, .ph-leave-to { opacity: 0; }
.ph-enter-from .ph__card { transform: translateY(16px) scale(0.96); }
.ph-leave-to .ph__card   { transform: scale(0.97); }

.ph__card {
  width: 320px;
  max-width: 100%;
  padding: 30px 28px 26px;
  border-radius: 22px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
  text-align: center;
}
.ph__title {
  margin-top: 18px;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text, #111827);
}
.ph__sub {
  margin-top: 4px;
  font-size: 0.8125rem;
  color: var(--color-text-muted, #6b7280);
  min-height: 1.2em;
}
.ph__progress {
  margin-top: 16px;
  height: 4px;
  border-radius: 999px;
  background: var(--color-surface-hover, #f3f4f6);
  overflow: hidden;
}
.ph__progress i {
  display: block;
  height: 100%;
  width: 100%;
  border-radius: inherit;
  background: var(--color-brand, #1f3a52);
  transform-origin: left;
  transform: scaleX(0);
  animation: progreso 2.6s cubic-bezier(0.45, 0, 0.25, 1) forwards;
}
.is-listo .ph__progress i { animation: none; transform: scaleX(1); background: #16a34a; transition: background 0.3s; }
.is-error .ph__progress i { animation: none; transform: scaleX(1); background: #dc2626; }
.is-listo .ph__title { color: #15803d; }
.is-error .ph__title { color: var(--color-danger, #b91c1c); }
:root[data-theme="dark"] .is-listo .ph__title { color: #7FCB97; }
:root[data-theme="dark"] .is-listo .ph__progress i { background: #6CC08A; }
@keyframes progreso { to { transform: scaleX(1); } }

/* ── Impresora ──────────────────────────────────────────────── */
.printer {
  position: relative;
  width: 220px;
  height: 250px;
  margin: 0 auto;
}

/* Hoja en blanco que entra por arriba */
.printer__feed {
  position: absolute;
  left: 50%;
  top: 0;
  width: 150px;
  height: 46px;
  margin-left: -75px;
  overflow: hidden;
}
.sheet-in {
  position: absolute;
  inset: 0;
  top: 6px;
  border-radius: 4px 4px 0 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  animation: entrar 2.6s steps(14, end) forwards;
}
@keyframes entrar { to { transform: translateY(100%); } }

.printer__body {
  position: absolute;
  left: 0;
  right: 0;
  top: 38px;
  height: 92px;
  border-radius: 18px 18px 14px 14px;
  background: linear-gradient(180deg, #3B4756 0%, #2A333F 55%, #1F2731 100%);
  box-shadow:
    0 18px 30px rgba(15, 23, 42, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -3px 0 rgba(0, 0, 0, 0.25);
  z-index: 2;
  animation: vibrar 0.16s linear infinite;
}
.is-listo .printer__body, .is-error .printer__body { animation: none; }
@keyframes vibrar {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(0.6px, -0.4px); }
  75% { transform: translate(-0.6px, 0.4px); }
}
.printer__shine {
  position: absolute;
  left: 16px; right: 16px; top: 10px;
  height: 14px;
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0));
}
.printer__light {
  position: absolute;
  right: 22px; top: 34px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
  animation: parpadeo 0.7s ease-in-out infinite;
}
.is-listo .printer__light { animation: none; }
.is-error .printer__light { animation: none; background: #ef4444; box-shadow: 0 0 10px #ef4444; }
@keyframes parpadeo { 50% { opacity: 0.25; } }
.printer__btn {
  position: absolute;
  right: 40px; top: 33px;
  width: 16px; height: 10px;
  border-radius: 4px;
  background: #4B5767;
}
.printer__btn--2 { right: 62px; }
.printer__slot {
  position: absolute;
  left: 26px; right: 26px; bottom: 16px;
  height: 8px;
  border-radius: 999px;
  background: #10151B;
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.6);
}

/* Salida del comprobante: arranca dentro de la ranura y baja a saltos,
   como una impresora real */
.printer__out {
  position: absolute;
  left: 50%;
  top: 110px;            /* a la altura de la ranura */
  width: 160px;
  height: 150px;
  margin-left: -80px;
  overflow: hidden;
  z-index: 1;
}
.paper {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
  border: 1px solid #e2e8f0;
  border-top: none;
  overflow: hidden;
  padding-top: 14px;   /* margen que queda dentro de la ranura al terminar */
  transform: translateY(-100%);
  animation: salir 2.6s cubic-bezier(0.5, 0, 0.5, 1) forwards;
}
@keyframes salir {
  0%   { transform: translateY(-100%); }
  12%  { transform: translateY(-86%); }
  20%  { transform: translateY(-86%); }
  34%  { transform: translateY(-64%); }
  42%  { transform: translateY(-64%); }
  56%  { transform: translateY(-40%); }
  64%  { transform: translateY(-40%); }
  80%  { transform: translateY(-14%); }
  86%  { transform: translateY(-14%); }
  100% { transform: translateY(0); }
}

/* Contenido del comprobante (colores del documento real) */
.paper__head {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  background: #0f2236;
}
.paper__logo  { width: 11px; height: 11px; border-radius: 50%; background: #fff; flex-shrink: 0; }
.paper__brand { font: 800 7px/1 Arial, sans-serif; letter-spacing: 0.12em; color: #fff; }
.paper__num   { margin-left: auto; font: 700 7px/1 Arial, sans-serif; color: #93c5fd; }
.paper__body  { padding: 8px 9px; }
.paper__title { font: 700 6.5px/1 Arial, sans-serif; letter-spacing: 0.1em; color: #1f3a52; margin-bottom: 7px; }
.paper__row   { display: flex; justify-content: space-between; gap: 6px; margin-bottom: 6px; }
.paper__row i { display: block; height: 4px; border-radius: 2px; background: #cbd5e1; }
.paper__table { height: 9px; border-radius: 2px; background: #1f3a52; margin: 8px 0 7px; }
.paper__sign  { display: flex; justify-content: space-between; margin-top: 14px; }
.paper__sign i { width: 42%; height: 1px; background: #94a3b8; }

/* Sello al terminar */
.paper__stamp {
  position: absolute;
  right: 10px;
  bottom: 28px;
  padding: 3px 7px;
  border: 2px solid #16a34a;
  border-radius: 4px;
  font: 800 8px/1 Arial, sans-serif;
  letter-spacing: 0.08em;
  color: #16a34a;
  background: rgba(220, 252, 231, 0.85);
  transform: rotate(-12deg) scale(2.2);
  opacity: 0;
}
.is-listo .paper__stamp { animation: sello 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) forwards; }
@keyframes sello {
  to { opacity: 1; transform: rotate(-12deg) scale(1); }
}

/* Movimiento reducido: sin saltos, la hoja aparece completa */
@media (prefers-reduced-motion: reduce) {
  .printer__body, .printer__light { animation: none; }
  .paper { animation: none; transform: none; }
  .sheet-in { animation: none; transform: translateY(100%); }
  .ph__progress i { animation-duration: 0.3s; }
}
</style>
