// ═══════════════════════════════════════════════════════════════
// texticode-vue/src/main.js — ACTUALIZADO con sistema de animaciones
// ═══════════════════════════════════════════════════════════════

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// ── CSS de animaciones ──────────────────────────────────────────
import './assets/motion.css'           // ← reemplaza con el nuevo archivo

// ── Plugins de animación ────────────────────────────────────────
import { ScrollRevealPlugin } from './plugins/scrollReveal'
import { RipplePlugin }       from './plugins/scrollReveal'   // mismo archivo
import { TiltPlugin }         from './plugins/scrollReveal'   // mismo archivo

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Animaciones
app.use(ScrollRevealPlugin)
app.use(RipplePlugin)
app.use(TiltPlugin)

app.mount('#app')


/* ═══════════════════════════════════════════════════════════════
   GUÍA DE USO — Cómo usar el sistema de animaciones en tu proyecto
   ═══════════════════════════════════════════════════════════════

   ─── 1. SCROLL REVEAL (v-reveal) ───────────────────────────────

   <!-- Fade + slide-up al hacer scroll -->
   <div v-reveal>Contenido</div>

   <!-- Desde la izquierda -->
   <div v-reveal.left>Contenido</div>

   <!-- Con delay en ms -->
   <div v-reveal="{ delay: 200 }">Contenido</div>

   <!-- Stagger automático a hijos -->
   <div v-stagger="80">
     <div>Hijo 1</div>
     <div>Hijo 2</div>
     <div>Hijo 3</div>
   </div>

   ─── 2. RIPPLE (v-ripple) ───────────────────────────────────────

   <button v-ripple class="btn-primary">Click con efecto ola</button>

   <!-- Color personalizado -->
   <button v-ripple="'rgba(255,255,255,0.3)'">Click</button>

   ─── 3. TILT 3D (v-tilt) ────────────────────────────────────────

   <div v-tilt class="card">Card con efecto 3D al hover</div>

   <!-- Intensidad personalizada (grados) -->
   <div v-tilt="10" class="card">Más inclinado</div>

   ─── 4. CLASES CSS DE ANIMACIÓN ─────────────────────────────────

   <!-- Entrada al montar -->
   <div class="anim-up delay-100">Fade up con delay 100ms</div>
   <div class="anim-pop delay-200">Pop con delay 200ms</div>
   <div class="anim-left">Desde izquierda</div>

   <!-- Float suave continuo -->
   <div class="float">Flota suavemente</div>

   <!-- Glow pulsante -->
   <button class="glow-pulse btn-primary">Botón con glow</button>

   <!-- Card con shimmer al hover -->
   <div class="card card-shimmer">...</div>

   <!-- Card con glow al hover -->
   <div class="card card-glow">...</div>

   <!-- Card con lift pronunciado -->
   <div class="card card-lift">...</div>

   ─── 5. TxSelect — SELECT PERSONALIZADO ────────────────────────

   import TxSelect from './components/TxSelect.vue'

   <TxSelect
     v-model="filtroRol"
     :options="[
       { value: '',             label: 'Todos los roles' },
       { value: 'administrador', label: 'Administrador', color: '#1f3a52' },
       { value: 'operario',      label: 'Operario',      color: '#2563eb', badge: '12' },
       { value: 'cliente',       label: 'Cliente',        color: '#16a34a' },
     ]"
     placeholder="Filtrar por rol"
     icon="filter"
     :searchable="true"
   />

   ─── 6. CLASES PARA TABLAS ──────────────────────────────────────

   <!-- Agregar a tu <tbody> para hover animado -->
   <tbody>
     <tr>...</tr>   <!-- ya tiene hover automático por CSS -->
   </tbody>

   <!-- Agregar stagger a filas -->
   <tbody v-stagger="50">
     <tr v-for="item in items">...</tr>
   </tbody>

   ─── 7. STAGGER MANUAL ──────────────────────────────────────────

   <div
     v-for="(item, i) in items"
     :key="item.id"
     v-reveal
     :v-reveal="{ delay: i * 80 }"
   >
     {{ item.name }}
   </div>

   ═══════════════════════════════════════════════════════════════ */