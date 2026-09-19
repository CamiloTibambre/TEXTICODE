<template>
  <div class="app-shell">
    <div class="app-ambient">
      <span class="ambient-orb orb-a"></span>
      <span class="ambient-orb orb-b"></span>
      <span class="ambient-grid"></span>
    </div>

    <RouterView v-slot="{ Component, route }">
      <Transition name="route-fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  color-scheme: light;
  font-family: Inter, 'Segoe UI', sans-serif;
}

html, body, #app {
  min-height: 100%;
}

body {
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.12), transparent 30%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 48%, #edf2f7 100%);
  color: #111827;
}

.app-shell {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.app-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ambient-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.6;
  animation: ambientFloat 12s ease-in-out infinite alternate;
}

.orb-a {
  width: 420px;
  height: 420px;
  top: -120px;
  left: -80px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.18), transparent 70%);
}

.orb-b {
  width: 360px;
  height: 360px;
  bottom: -120px;
  right: -80px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 72%);
  animation-duration: 16s;
}

.ambient-grid {
  position: absolute;
  inset: 0;
  opacity: 0.24;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at center, rgba(255,255,255,0.8), transparent 90%);
}

@keyframes ambientFloat {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(16px, -20px, 0) scale(1.05); }
}
</style>
