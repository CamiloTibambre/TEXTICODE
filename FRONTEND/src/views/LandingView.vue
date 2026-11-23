<template>
  <div class="lp" :class="{ 'lp--dark': esOscuro }" ref="root">

    <!-- ══════════ NAV ══════════ -->
    <header class="nav" :class="{ 'nav--solid': scrolled }">
      <div class="nav__inner">
        <a href="#inicio" class="nav__brand" @click.prevent="irA('inicio')" aria-label="Texticode, inicio">
          <svg class="nav__logo" viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <mask id="tx-mask-nav">
                <rect width="48" height="48" fill="#fff"/>
                <circle cx="22" cy="22" r="13.2" fill="none" stroke="#000" stroke-width="1.6"/>
                <circle cx="18.2" cy="18.2" r="2.5" fill="#000"/><circle cx="25.8" cy="18.2" r="2.5" fill="#000"/>
                <circle cx="18.2" cy="25.8" r="2.5" fill="#000"/><circle cx="25.8" cy="25.8" r="2.5" fill="#000"/>
                <path d="M31.4 26.5 43.6 32.1 38.2 34.2 43.6 39.6 41.1 41.8 36 36.4 33.7 40.5Z" fill="#000" stroke="#000" stroke-width="3.4" stroke-linejoin="round"/>
              </mask>
            </defs>
            <circle cx="22" cy="22" r="18" fill="currentColor" mask="url(#tx-mask-nav)"/>
            <path d="M31.4 26.5 43.6 32.1 38.2 34.2 43.6 39.6 41.1 41.8 36 36.4 33.7 40.5Z" fill="currentColor" stroke="currentColor" stroke-width="0.8" stroke-linejoin="round"/>
          </svg>
          <span>Texticode</span>
        </a>

        <nav class="nav__links" aria-label="Secciones">
          <a v-for="l in links" :key="l.id" :href="`#${l.id}`" @click.prevent="irA(l.id)"
             class="nav__link" :class="{ 'is-active': seccionActiva === l.id }">{{ l.label }}</a>
        </nav>

        <button type="button" class="theme-btn" @click="alternarTema"
                :aria-label="esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                :title="esOscuro ? 'Modo claro' : 'Modo oscuro'">
          <Transition name="theme-ico" mode="out-in">
            <svg v-if="esOscuro" key="sol" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>
            <svg v-else key="luna" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>
          </Transition>
        </button>
        <RouterLink to="/login" class="btn btn--red btn--sm">Iniciar sesión</RouterLink>
      </div>
    </header>

    <main>
      <!-- ══════════ HERO ══════════ -->
      <section id="inicio" class="hero" ref="heroEl">
        <div class="hero__grid" aria-hidden="true"></div>
        <div class="hero__glow" aria-hidden="true"></div>

        <div class="hero__copy">
          <p class="eyebrow anim-in" style="--d: 0ms">Gestión de producción textil</p>
          <h1 class="hero__title anim-in" style="--d: 80ms">
            Cada puntada,<br><span class="txt-red">bajo control.</span>
          </h1>
          <p class="hero__sub anim-in" style="--d: 180ms">
            Órdenes, inventario, operarios y entregas de tu taller en una sola plataforma.
            Lo que pasa en planta, lo ves al instante.
          </p>
          <div class="hero__ctas anim-in" style="--d: 280ms">
            <RouterLink to="/login" class="btn btn--red">Empezar ahora</RouterLink>
            <a href="#recorrido" class="btn btn--link" @click.prevent="irA('recorrido')">
              Ver cómo funciona
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
            </a>
          </div>
        </div>

        <!-- Maqueta de la app: se endereza al hacer scroll -->
        <div class="hero__stage" :style="estiloMaqueta" aria-hidden="true">
          <div class="app">
            <div class="app__side">
              <div class="app__logo"></div>
              <span v-for="n in 6" :key="n" class="app__nav" :class="{ 'is-on': n === 5 }"></span>
              <div class="app__switch"><i></i><i class="on"></i><i></i></div>
            </div>
            <div class="app__main">
              <div class="app__head">
                <div class="app__icon"></div>
                <div>
                  <b>Gestión de Producción</b>
                  <small>6 órdenes registradas</small>
                </div>
                <span class="app__btn">Nueva orden</span>
              </div>
              <div class="app__kpis">
                <div v-for="k in kpisMaqueta" :key="k.l" class="app__kpi">
                  <span class="app__kpi-ico" :class="k.c"></span>
                  <div><small>{{ k.l }}</small><b :class="k.c">{{ k.v }}</b></div>
                </div>
              </div>
              <div class="app__cards">
                <div v-for="o in ordenesMaqueta" :key="o.id" class="app__card">
                  <div class="app__card-top">
                    <span class="pill pill--id">{{ o.id }}</span>
                    <span class="pill" :class="`pill--${o.prioC}`">{{ o.prio }}</span>
                    <span class="pill" :class="`pill--${o.estC}`">{{ o.est }}</span>
                  </div>
                  <b>{{ o.prod }}</b>
                  <small>{{ o.cli }}</small>
                  <div class="app__prog">
                    <span>{{ o.hechas }} de {{ o.total }} prendas</span>
                    <em :class="o.estC">{{ Math.round(o.hechas / o.total * 100) }}%</em>
                  </div>
                  <div class="bar"><i :class="o.estC" :style="{ width: (o.hechas / o.total * 100) + '%' }"></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════ FRANJA ROJA ══════════ -->
      <div class="ribbon" aria-hidden="true">
        <div class="ribbon__track">
          <template v-for="r in 2" :key="r">
            <span v-for="p in procesos" :key="p + r">{{ p }}<i>✦</i></span>
          </template>
        </div>
      </div>

      <!-- ══════════ DECLARACIÓN (palabras que se encienden) ══════════ -->
      <section class="statement" ref="statementEl">
        <p class="statement__text">
          <span v-for="(w, i) in palabras" :key="i"
                class="statement__word" :class="{ 'is-lit': i < palabrasEncendidas, 'is-red': w.rojo }">{{ w.t + ' ' }}</span>
        </p>
      </section>

      <!-- ══════════ RECORRIDO DE UNA ORDEN (sticky) ══════════ -->
      <section id="recorrido" class="story" ref="storyEl">
        <div class="story__inner">
          <div class="story__sticky">
            <div class="device">
              <div class="device__bar"><i></i><i></i><i></i><span>texticode.app</span></div>

              <div class="device__screen">
                <Transition name="screen" mode="out-in">
                  <!-- 1. Orden creada -->
                  <div v-if="paso === 0" key="0" class="scr">
                    <p class="scr__label">Nueva orden</p>
                    <div class="field"><small>Cliente</small><b>Colegio San Mateo</b></div>
                    <div class="field"><small>Producto</small><b>Camisa oxford · 120 und.</b></div>
                    <div class="field-row">
                      <div class="field"><small>Prioridad</small><b class="txt-amber">Alta</b></div>
                      <div class="field"><small>Entrega</small><b>24 nov</b></div>
                    </div>
                    <div class="chips"><span>Tela oxford azul</span><span>Hilo azul marino</span></div>
                    <span class="scr__cta">Crear orden</span>
                  </div>

                  <!-- 2. Asignación -->
                  <div v-else-if="paso === 1" key="1" class="scr">
                    <p class="scr__label">Fases y operarios</p>
                    <div v-for="f in fases" :key="f.n" class="phase">
                      <span class="phase__n">{{ f.n }}</span>
                      <div><b>{{ f.t }}</b><small>{{ f.op }}</small></div>
                      <span class="avatar" :style="{ background: f.c }">{{ f.ini }}</span>
                    </div>
                    <p class="scr__note">Cada operario ve solo sus tareas.</p>
                  </div>

                  <!-- 3. Avance en tiempo real -->
                  <div v-else-if="paso === 2" key="2" class="scr">
                    <p class="scr__label">Avance en planta <span class="live"><i></i>En vivo</span></p>
                    <div class="big-num">84<small>/120</small></div>
                    <div class="bar bar--lg"><i class="azul" style="width:70%"></i></div>
                    <div class="steps3">
                      <span class="done">Corte</span><span class="now">Bordado</span><span>Confección</span>
                    </div>
                    <div class="toast"><span class="dot"></span>Ana Rojas reportó 12 prendas bordadas</div>
                  </div>

                  <!-- 4. Entrega -->
                  <div v-else key="3" class="scr scr--center">
                    <div class="check">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
                    </div>
                    <b class="scr__big">Orden entregada</b>
                    <small class="muted">ORD-014 · 120 de 120 prendas</small>
                    <div class="receipt">
                      <span>Comprobante de entrega</span>
                      <span class="receipt__pdf">PDF</span>
                    </div>
                  </div>
                </Transition>
              </div>

              <div class="device__dots">
                <i v-for="n in 4" :key="n" :class="{ 'is-on': paso === n - 1 }"></i>
              </div>
            </div>
          </div>

          <div class="story__steps">
            <p class="eyebrow">El recorrido de una orden</p>
            <article v-for="(s, i) in pasos" :key="i" class="step" :class="{ 'is-active': paso === i }" :data-paso="i">
              <span class="step__num">0{{ i + 1 }}</span>
              <h3>{{ s.t }}</h3>
              <p>{{ s.d }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ══════════ BENTO ══════════ -->
      <section id="funciones" class="bento-sec">
        <header class="sec-head reveal">
          <p class="eyebrow">Todo en un lugar</p>
          <h2>Pensado para el ritmo<br>de un taller real.</h2>
        </header>

        <div class="bento">
          <!-- Inventario -->
          <article class="tile tile--wide reveal">
            <div class="tile__copy">
              <h3>Inventario que avisa antes de que falte.</h3>
              <p>Stock por material y por cliente, con alertas cuando algo baja del mínimo.</p>
            </div>
            <div class="stock">
              <div v-for="m in materiales" :key="m.n" class="stock__row">
                <span>{{ m.n }}</span>
                <div class="bar"><i :class="m.c" :style="{ width: m.p + '%' }"></i></div>
                <em :class="m.c">{{ m.p }}%</em>
              </div>
            </div>
          </article>

          <!-- Tiempo real -->
          <article class="tile tile--red reveal">
            <div class="pulse" aria-hidden="true"><i></i><i></i><i></i></div>
            <h3>En tiempo real.</h3>
            <p>Cuando un operario reporta avance, el administrador y el cliente lo ven al momento.</p>
          </article>

          <!-- Eficiencia -->
          <article class="tile reveal">
            <h3>Eficiencia por operario.</h3>
            <p>Rendimiento, carga de trabajo y órdenes en retraso.</p>
            <div class="chart" aria-hidden="true">
              <i v-for="(h, i) in barras" :key="i" :style="{ '--h': h + '%', '--i': i }"></i>
            </div>
          </article>

          <!-- Calendar -->
          <article class="tile reveal">
            <h3>Tu agenda, sincronizada.</h3>
            <p>Entregas y tareas directo en Google Calendar.</p>
            <div class="cal" aria-hidden="true">
              <span v-for="d in 14" :key="d" :class="{ 'is-ev': [3, 6, 10].includes(d), 'is-today': d === 8 }">{{ d + 16 }}</span>
            </div>
          </article>

          <!-- Reportes -->
          <article class="tile reveal">
            <h3>Reportes en un clic.</h3>
            <p>Pedidos, producción e inventario, listos en PDF o Excel.</p>
            <div class="files" aria-hidden="true">
              <span class="file file--pdf">PDF</span>
              <span class="file file--xls">XLS</span>
            </div>
          </article>

          <!-- Seguridad -->
          <article class="tile tile--wide tile--full tile--split reveal">
            <div class="tile__copy">
              <h3>Cada quien ve lo que le corresponde.</h3>
              <p>Acceso por roles y datos separados por empresa. Tu información no se cruza con la de nadie más.</p>
            </div>
            <div class="lock" aria-hidden="true">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>
            </div>
          </article>
        </div>
      </section>

      <!-- ══════════ ROLES ══════════ -->
      <section id="roles" class="roles">
        <header class="sec-head reveal">
          <p class="eyebrow">Una plataforma, tres miradas</p>
          <h2>Hecho para todo tu equipo.</h2>
        </header>

        <div class="roles__grid">
          <article v-for="(r, i) in rolesLanding" :key="r.t" class="role reveal" :style="{ '--d': i * 90 + 'ms' }">
            <span class="role__tag" :class="r.c">{{ r.tag }}</span>
            <h3>{{ r.t }}</h3>
            <p>{{ r.d }}</p>
            <ul>
              <li v-for="x in r.items" :key="x">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
                {{ x }}
              </li>
            </ul>
          </article>
        </div>
      </section>

      <!-- ══════════ CTA FINAL ══════════ -->
      <section class="cta">
        <div class="cta__threads" aria-hidden="true">
          <i v-for="n in 7" :key="n" :style="{ '--n': n }"></i>
        </div>
        <div class="cta__copy reveal">
          <h2>Tu taller,<br>a otro ritmo.</h2>
          <p>Entra con tu cuenta y lleva la producción del papel a la pantalla.</p>
          <RouterLink to="/login" class="btn btn--white">Iniciar sesión</RouterLink>
        </div>
      </section>
    </main>

    <!-- ══════════ FOOTER ══════════ -->
    <footer class="foot">
      <div class="foot__inner">
        <div class="foot__brand">
          <svg class="nav__logo" viewBox="0 0 48 48" aria-hidden="true">
          <defs>
            <mask id="tx-mask-foot">
              <rect width="48" height="48" fill="#fff"/>
              <circle cx="22" cy="22" r="13.2" fill="none" stroke="#000" stroke-width="1.6"/>
              <circle cx="18.2" cy="18.2" r="2.5" fill="#000"/><circle cx="25.8" cy="18.2" r="2.5" fill="#000"/>
              <circle cx="18.2" cy="25.8" r="2.5" fill="#000"/><circle cx="25.8" cy="25.8" r="2.5" fill="#000"/>
              <path d="M31.4 26.5 43.6 32.1 38.2 34.2 43.6 39.6 41.1 41.8 36 36.4 33.7 40.5Z" fill="#000" stroke="#000" stroke-width="3.4" stroke-linejoin="round"/>
            </mask>
          </defs>
          <circle cx="22" cy="22" r="18" fill="currentColor" mask="url(#tx-mask-foot)"/>
          <path d="M31.4 26.5 43.6 32.1 38.2 34.2 43.6 39.6 41.1 41.8 36 36.4 33.7 40.5Z" fill="currentColor" stroke="currentColor" stroke-width="0.8" stroke-linejoin="round"/>
          </svg>
          <span>Texticode</span>
        </div>
        <nav class="foot__links" aria-label="Pie de página">
          <a v-for="l in links" :key="l.id" :href="`#${l.id}`" @click.prevent="irA(l.id)">{{ l.label }}</a>
          <RouterLink to="/login">Iniciar sesión</RouterLink>
        </nav>
      </div>
      <div class="foot__bottom">
        <span>© 2026 Texticode</span>
        <span>Desarrollado por Andrés Lancheros, Camilo Tibambre, Kevin Castro y Kevin Montenegro · SENA</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { useTheme } from '../composables/useTheme'

// ── Tema (comparte la preferencia con la app) ──────────────────
const { esOscuro, setModo } = useTheme()
function alternarTema() { setModo(esOscuro.value ? 'claro' : 'oscuro') }

// ── Navegación ────────────────────────────────────────────────
const links = [
  { id: 'recorrido', label: 'Cómo funciona' },
  { id: 'funciones', label: 'Funciones' },
  { id: 'roles',     label: 'Para tu equipo' },
]
const scrolled      = ref(false)
const seccionActiva = ref('')

function irA(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', block: 'start' })
}

const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// ── Datos de la maqueta ───────────────────────────────────────
const kpisMaqueta = [
  { l: 'Total órdenes', v: 6, c: '' },
  { l: 'En proceso',    v: 4, c: 'azul' },
  { l: 'Completadas',   v: 1, c: 'verde' },
  { l: 'Retrasadas',    v: 1, c: 'rojo' },
]
const ordenesMaqueta = [
  { id: 'ORD-014', prio: 'Alta',  prioC: 'amber', est: 'En proceso', estC: 'azul',  prod: 'Camisa oxford',      cli: 'Colegio San Mateo',  hechas: 84, total: 120 },
  { id: 'ORD-011', prio: 'Media', prioC: 'amber', est: 'Retrasada',  estC: 'rojo',  prod: 'Overol industrial',  cli: 'Metalúrgica Andina', hechas: 20, total: 60 },
  { id: 'ORD-009', prio: 'Media', prioC: 'amber', est: 'Completada', estC: 'verde', prod: 'Delantal de cocina', cli: 'Restaurante Brasa',  hechas: 45, total: 45 },
  { id: 'ORD-017', prio: 'Baja',  prioC: 'verde', est: 'En proceso', estC: 'azul',  prod: 'Chaqueta de dotación', cli: 'Clínica del Norte', hechas: 30, total: 80 },
  { id: 'ORD-018', prio: 'Baja',  prioC: 'verde', est: 'En proceso', estC: 'azul',  prod: 'Gorra bordada',      cli: 'Café La Molienda',   hechas: 50, total: 150 },
  { id: 'ORD-016', prio: 'Baja',  prioC: 'verde', est: 'En proceso', estC: 'azul',  prod: 'Polo bordado',       cli: 'Café La Molienda',   hechas: 0,  total: 200 },
]

const procesos = ['Entregas a tiempo', 'Menos papeleo', 'Control total', 'Más productividad', 'Clientes tranquilos', 'Decisiones con datos', 'Cero planillas', 'Todo en tiempo real']

// ── Declaración ───────────────────────────────────────────────
const frase = 'Del rollo de tela a la entrega final, *todo* *tu* *taller* cabe en una sola pantalla. Sin planillas sueltas, sin llamadas para preguntar cómo va un pedido.'
const palabras = frase.split(' ').map(t => ({ t: t.replace(/\*/g, ''), rojo: t.startsWith('*') }))
const palabrasEncendidas = ref(0)

// ── Recorrido ─────────────────────────────────────────────────
const pasos = [
  { t: 'Se crea la orden.',          d: 'Cliente, producto, cantidades, materiales y fecha de entrega quedan registrados en un solo formulario.' },
  { t: 'Se reparte el trabajo.',     d: 'Divides la orden en fases (corte, bordado, confección) y asignas cada una al operario indicado.' },
  { t: 'La planta reporta avances.', d: 'Cada operario actualiza sus prendas terminadas y el progreso se refleja al instante para todos.' },
  { t: 'Se entrega y se certifica.', d: 'Al completar la orden se genera el comprobante de entrega en PDF, listo para el cliente.' },
]
const fases = [
  { n: 1, t: 'Corte',      op: 'Luis Pérez',  ini: 'LP', c: '#4F86B8' },
  { n: 2, t: 'Bordado',    op: 'Ana Rojas',   ini: 'AR', c: '#B83A2E' },
  { n: 3, t: 'Confección', op: 'Marta Gil',   ini: 'MG', c: '#3F9B62' },
]
const paso = ref(0)

// ── Bento ─────────────────────────────────────────────────────
const materiales = [
  { n: 'Tela oxford azul', p: 82, c: 'azul' },
  { n: 'Dril caqui',       p: 46, c: 'amber' },
  { n: 'Hilo dorado',      p: 12, c: 'rojo' },
]
const barras = [42, 68, 55, 88, 73, 95, 61]

// ── Roles ─────────────────────────────────────────────────────
const rolesLanding = [
  { tag: 'Administrador', c: 'rojo',  t: 'Control total.',
    d: 'La vista completa del negocio, desde los usuarios hasta los reportes.',
    items: ['Usuarios, clientes e inventario', 'Órdenes por fases y operarios', 'Eficiencia y carga de trabajo', 'Reportes en PDF y Excel'] },
  { tag: 'Operario', c: 'azul', t: 'Foco en la tarea.',
    d: 'Solo lo que le toca hacer hoy, sin ruido.',
    items: ['Tareas asignadas con prioridad', 'Reporte de avances en segundos', 'Pausas e incidencias', 'Agenda en Google Calendar'] },
  { tag: 'Cliente', c: 'verde', t: 'Tranquilidad.',
    d: 'Sabe cómo va su pedido sin tener que preguntar.',
    items: ['Estado de pedidos en vivo', 'Comprobantes de entrega', 'Alertas de materiales', 'Centro de soporte'] },
]

// ── Scroll: maqueta, palabras, pasos, reveals ─────────────────
const heroEl      = ref(null)
const statementEl = ref(null)
const storyEl     = ref(null)
const heroProg    = ref(0)

const estiloMaqueta = computed(() => {
  const p = heroProg.value          // 0 → 1 mientras se baja el hero
  const rot = 22 * (1 - p)
  const scale = 0.9 + 0.1 * p
  const y = 40 * (1 - p)
  return { transform: `perspective(1600px) rotateX(${rot}deg) translateY(${y}px) scale(${scale})` }
})

let rafId = 0
function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    const vh = window.innerHeight
    scrolled.value = window.scrollY > 24

    // Hero: la maqueta se endereza
    if (heroEl.value) {
      const r = heroEl.value.getBoundingClientRect()
      heroProg.value = reducido() ? 1 : Math.min(1, Math.max(0, -r.top / (vh * 0.55) + 0.15))
    }

    // Declaración: palabras que se encienden
    if (statementEl.value) {
      const r = statementEl.value.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.25)))
      palabrasEncendidas.value = reducido() ? palabras.length : Math.round(p * palabras.length)
    }

    // Recorrido: paso activo según el bloque más cercano al centro
    const steps = storyEl.value?.querySelectorAll('.step') || []
    const foco = window.innerWidth <= 860 ? vh * 0.78 : vh / 2
    let mejor = 0, dist = Infinity
    steps.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const d = Math.abs(r.top + r.height / 2 - foco)
      if (d < dist) { dist = d; mejor = i }
    })
    paso.value = mejor

    // Sección activa del menú
    let act = ''
    for (const l of links) {
      const el = document.getElementById(l.id)
      if (el && el.getBoundingClientRect().top < vh * 0.4) act = l.id
    }
    seccionActiva.value = act
  })
}

let observer = null
onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); observer.unobserve(e.target) }
    })
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
  document.querySelectorAll('.lp .reveal').forEach(el => observer.observe(el))

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   LANDING — paleta Grafito Industrial
   Siempre oscura, independiente del tema de la app.
   ═══════════════════════════════════════════════════════════════ */
.lp {
  /* ── MODO CLARO: paleta original Texticode (azul petróleo) ── */
  --bg:        #F5F7FA;
  --grafito:   #F9FAFB;
  --sup:       #FFFFFF;
  --sup-hov:   #F1F5F9;
  --campo:     #F9FAFB;
  --borde:     #E2E8F0;
  --borde-hov: #CBD5E1;
  --grid:      #E2E8F0;
  --grid-soft: rgba(226, 232, 240, 0.7);
  --txt:       #111827;
  --txt-2:     #4B5563;
  --muted:     #6B7280;
  --unlit:     #D5DCE5;
  --acc:       #1F3A52;
  --acc-hov:   #244B6A;
  --acento:    #2D6A9F;
  --link-hov:  #1F3A52;
  --azul:      #2D6A9F;
  --verde:     #15803D;
  --amber:     #B45309;
  --rojo-st:   #B91C1C;
  --s-azul:    #DBEAFE;
  --s-verde:   #DCFCE7;
  --s-amber:   #FEF3C7;
  --s-rojo:    #FEE2E2;
  --b-rojo:    #FECACA;
  --b-verde:   #BBF7D0;
  --b-azul:    #BFDBFE;
  --nav-bg:    rgba(245, 247, 250, 0.78);
  --nav-borde: rgba(226, 232, 240, 0.9);
  --sombra:    0 40px 100px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.02);
  --sombra-acc: 0 10px 30px rgba(31, 58, 82, 0.28);
  --glow:      rgba(45, 106, 159, 0.16);
  --grad-txt:  linear-gradient(100deg, #1F3A52 0%, #2D6A9F 55%, #4A8FCC 100%);
  --grad-tile: linear-gradient(160deg, #2D5580 0%, #1F3A52 45%, #0F2236 100%);
  --grad-cta:  radial-gradient(120% 140% at 0% 0%, #2D6A9F 0%, #1F3A52 45%, #0F2236 100%);
  --lock-bg:   radial-gradient(circle at 30% 25%, #FFFFFF, #E8EEF4);
  --blanco-hov: #E8EEF4;
  --logo-color: #1F3A52;
  --ease:      cubic-bezier(0.22, 1, 0.36, 1);

  background: var(--bg);
  color: var(--txt);
  font-family: var(--font-sans, Inter, system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
  transition: background-color 0.4s ease, color 0.4s ease;
}

/* ── MODO OSCURO: Grafito Industrial ── */
.lp.lp--dark {
  --bg:        #15191E;
  --grafito:   #23272E;
  --sup:       #292F36;
  --sup-hov:   #343A43;
  --campo:     #22282E;
  --borde:     #414A53;
  --borde-hov: #4C5661;
  --grid:      #343E43;
  --grid-soft: rgba(52, 62, 67, 0.45);
  --txt:       #F2F4F1;
  --txt-2:     #B6C0C8;
  --muted:     #8D98A2;
  --unlit:     #3A4149;
  --acc:       #B83A2E;
  --acc-hov:   #D14B3E;
  --acento:    #D14B3E;
  --link-hov:  #A6C8E6;
  --azul:      #78A9D4;
  --verde:     #7FCB97;
  --amber:     #E3B672;
  --rojo-st:   #E8867C;
  --s-azul:    rgba(120, 169, 212, 0.15);
  --s-verde:   rgba(127, 203, 151, 0.14);
  --s-amber:   rgba(227, 182, 114, 0.15);
  --s-rojo:    rgba(209, 75, 62, 0.18);
  --b-rojo:    rgba(232, 134, 124, 0.4);
  --b-verde:   rgba(127, 203, 151, 0.35);
  --b-azul:    rgba(120, 169, 212, 0.5);
  --nav-bg:    rgba(21, 25, 30, 0.72);
  --nav-borde: rgba(65, 74, 83, 0.55);
  --sombra:    0 40px 120px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  --sombra-acc: 0 10px 30px rgba(184, 58, 46, 0.35);
  --glow:      rgba(184, 58, 46, 0.28);
  --grad-txt:  linear-gradient(100deg, #D14B3E 0%, #B83A2E 55%, #E3897F 100%);
  --grad-tile: linear-gradient(160deg, #C4443A 0%, #B83A2E 45%, #8F2C23 100%);
  --grad-cta:  radial-gradient(120% 140% at 0% 0%, #D14B3E 0%, #B83A2E 45%, #7E261E 100%);
  --lock-bg:   radial-gradient(circle at 30% 25%, #3D4550, #15191E);
  --blanco-hov: #F2F4F1;
  --logo-color: #F2F4F1;
}

.txt-red   { background: var(--grad-txt); -webkit-background-clip: text; background-clip: text; color: transparent; }
.txt-amber { color: var(--amber); }
.muted     { color: var(--muted); }

.eyebrow {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--acento);
  margin-bottom: 18px;
}

/* ── Botones ───────────────────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 48px; padding: 0 26px;
  border-radius: 999px;
  font-size: 1rem; font-weight: 600;
  text-decoration: none;
  transition: background 0.2s, transform 0.2s var(--ease), box-shadow 0.2s, color 0.2s;
}
.btn:active { transform: scale(0.97); }
.btn--sm    { height: 36px; padding: 0 18px; font-size: 0.875rem; }
.btn--red   { background: var(--acc); color: #fff; }
.btn--red:hover { background: var(--acc-hov); box-shadow: var(--sombra-acc); }
.btn--link  { color: var(--azul); padding: 0 8px; }
.btn--link:hover { color: var(--link-hov); }
.btn--link svg { transition: transform 0.25s var(--ease); }
.btn--link:hover svg { transform: translateY(2px); }
.btn--white { background: #fff; color: var(--acc); }
.btn--white:hover { background: var(--blanco-hov); box-shadow: 0 12px 34px rgba(0, 0, 0, 0.25); }
.btn:focus-visible, .nav__link:focus-visible, .foot a:focus-visible { outline: 2px solid var(--azul); outline-offset: 3px; }

/* ══════════ NAV ══════════ */
.nav {
  position: fixed; inset: 0 0 auto; z-index: 50;
  transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
  border-bottom: 1px solid transparent;
}
.nav--solid {
  background: var(--nav-bg);
  backdrop-filter: saturate(160%) blur(18px);
  -webkit-backdrop-filter: saturate(160%) blur(18px);
  border-bottom-color: var(--nav-borde);
}
.nav__inner {
  max-width: 1180px; margin: 0 auto; height: 64px; padding: 0 24px;
  display: flex; align-items: center; gap: 32px;
}
.nav__brand { display: flex; align-items: center; gap: 10px; color: var(--txt); text-decoration: none; font-weight: 700; letter-spacing: -0.01em; font-size: 1.0625rem; }
.nav__logo  { width: 30px; height: 30px; flex-shrink: 0; color: var(--logo-color); }
.nav__links { display: flex; gap: 28px; margin-left: auto; }
.nav__inner > .theme-btn { margin-left: -8px; }
.nav__link  { color: var(--txt-2); text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
.nav__link:hover, .nav__link.is-active { color: var(--txt); }

.theme-btn {
  width: 36px; height: 36px; border-radius: 50%;
  display: grid; place-items: center;
  border: 1px solid var(--borde); background: var(--sup); color: var(--txt-2);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s var(--ease);
}
.theme-btn:hover { color: var(--txt); border-color: var(--borde-hov); }
.theme-btn:active { transform: scale(0.92); }
.theme-btn:focus-visible { outline: 2px solid var(--azul); outline-offset: 3px; }
.theme-ico-enter-active, .theme-ico-leave-active { transition: opacity 0.2s, transform 0.25s var(--ease); }
.theme-ico-enter-from { opacity: 0; transform: rotate(-60deg) scale(0.6); }
.theme-ico-leave-to   { opacity: 0; transform: rotate(60deg) scale(0.6); }

/* ══════════ HERO ══════════ */
.hero {
  position: relative;
  min-height: 100vh;
  padding: 150px 24px 0;
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  isolation: isolate;
}
.hero__grid {
  position: absolute; inset: 0; z-index: -2;
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 56px 56px;
  opacity: 0.45;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 80%);
}
.hero__glow {
  position: absolute; z-index: -1;
  width: 900px; height: 480px; left: 50%; bottom: 4%;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, var(--glow), transparent);
  filter: blur(20px);
}
.hero__copy { max-width: 880px; }
.hero__title {
  font-size: clamp(3rem, 8vw, 6.5rem);
  line-height: 0.98;
  font-weight: 700;
  letter-spacing: -0.045em;
  margin-bottom: 26px;
}
.hero__sub {
  font-size: clamp(1.0625rem, 1.6vw, 1.3125rem);
  line-height: 1.5;
  color: var(--txt-2);
  max-width: 620px; margin: 0 auto 36px;
}
.hero__ctas { display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap; }

.anim-in { opacity: 0; transform: translateY(18px); animation: lpIn 0.9s var(--ease) forwards; animation-delay: var(--d, 0ms); }
@keyframes lpIn { to { opacity: 1; transform: none; } }

.hero__stage {
  width: min(1120px, 100%);
  margin-top: 72px;
  transform-origin: 50% 0%;
  will-change: transform;
}

/* ── Maqueta de la app ─────────────────────────────────────── */
.app {
  display: grid; grid-template-columns: 64px 1fr;
  background: var(--bg);
  border: 1px solid var(--borde);
  border-radius: 18px;
  overflow: hidden;
  text-align: left;
  box-shadow: var(--sombra);
  font-size: 12px;
}
.app__side { background: var(--grafito); padding: 18px 12px; display: flex; flex-direction: column; gap: 10px; align-items: center; border-right: 1px solid var(--sup-hov); }
.app__logo { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--txt-2); margin-bottom: 14px; }
.app__nav  { width: 36px; height: 30px; border-radius: 8px; background: transparent; position: relative; }
.app__nav::after { content: ''; position: absolute; inset: 10px 9px; border-radius: 3px; background: var(--borde); }
.app__nav.is-on { background: var(--sup-hov); box-shadow: inset 3px 0 0 var(--acc); }
.app__nav.is-on::after { background: var(--txt-2); }
.app__switch { margin-top: auto; display: grid; gap: 3px; }
.app__switch i { width: 30px; height: 6px; border-radius: 3px; background: var(--sup-hov); }
.app__switch i.on { background: var(--borde); }

.app__main { padding: 22px; background-image: linear-gradient(var(--grid-soft) 1px, transparent 1px), linear-gradient(90deg, var(--grid-soft) 1px, transparent 1px); background-size: 28px 28px; }
.app__head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.app__head b { display: block; font-size: 17px; letter-spacing: -0.01em; }
.app__head small { color: var(--txt-2); }
.app__icon { width: 36px; height: 36px; border-radius: 10px; background: var(--acc); }
.app__btn  { margin-left: auto; background: var(--acc); color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: 600; }

.app__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
.app__kpi  { display: flex; gap: 10px; align-items: center; padding: 12px; background: var(--sup); border: 1px solid var(--borde); border-radius: 10px; }
.app__kpi small { color: var(--txt-2); display: block; }
.app__kpi b { font-size: 20px; line-height: 1.1; }
.app__kpi-ico { width: 28px; height: 28px; border-radius: 7px; background: var(--sup-hov); flex-shrink: 0; }
.app__kpi-ico.azul  { background: var(--s-azul); }
.app__kpi-ico.verde { background: var(--s-verde); }
.app__kpi-ico.rojo  { background: var(--s-rojo); }

.app__cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.app__card  { background: var(--sup); border: 1px solid var(--borde); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 3px; }
.app__card b { font-size: 13.5px; margin-top: 6px; }
.app__card small { color: var(--muted); margin-bottom: 8px; }
.app__card-top { display: flex; gap: 5px; padding-bottom: 8px; border-bottom: 1px solid var(--borde); }
.app__prog { display: flex; justify-content: space-between; color: var(--txt-2); margin-bottom: 4px; }
.app__prog em { font-style: normal; font-weight: 700; }

.pill { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.pill--id    { background: var(--sup-hov); color: var(--txt-2); border-radius: 5px; font-family: ui-monospace, monospace; }
.pill--amber { background: var(--s-amber); color: var(--amber); }
.pill--azul  { background: var(--s-azul); color: var(--azul); }
.pill--verde { background: var(--s-verde); color: var(--verde); }
.pill--rojo  { background: var(--s-rojo); color: var(--rojo-st); border: 1px solid var(--b-rojo); }

.azul  { color: var(--azul); }
.verde { color: var(--verde); }
.rojo  { color: var(--rojo-st); }
.amber { color: var(--amber); }

.bar { height: 6px; border-radius: 999px; background: var(--sup-hov); overflow: hidden; }
.bar i { display: block; height: 100%; border-radius: inherit; background: var(--azul); }
.bar i.verde { background: var(--verde); }
.bar i.rojo  { background: var(--rojo-st); }
.bar i.amber { background: var(--amber); }
.bar--lg { height: 10px; }

/* ══════════ FRANJA ROJA ══════════ */
.ribbon {
  margin-top: 120px;
  background: var(--acc);
  color: #fff;
  overflow: hidden;
  transform: rotate(-2deg) scale(1.04);
  box-shadow: var(--sombra-acc);
}
.ribbon__track { display: flex; width: max-content; animation: marquee 32s linear infinite; }
.ribbon__track span {
  display: inline-flex; align-items: center; gap: 30px;
  padding: 22px 15px;
  font-size: clamp(1.375rem, 2.6vw, 2.125rem);
  font-weight: 700; letter-spacing: -0.02em; white-space: nowrap;
}
.ribbon__track i { font-style: normal; font-size: 0.6em; opacity: 0.7; }
@keyframes marquee { to { transform: translateX(-50%); } }

/* ══════════ DECLARACIÓN ══════════ */
.statement { max-width: 1040px; margin: 0 auto; padding: 200px 24px 160px; }
.statement__text {
  font-size: clamp(2rem, 4.6vw, 3.75rem);
  line-height: 1.12;
  font-weight: 700;
  letter-spacing: -0.035em;
}
.statement__word { color: var(--unlit); transition: color 0.35s ease; }
.statement__word.is-lit { color: var(--txt); }
.statement__word.is-lit.is-red { color: var(--acento); }

/* ══════════ RECORRIDO ══════════ */
.story { padding: 40px 24px 120px; }
.story__inner {
  max-width: 1180px; margin: 0 auto;
  display: grid; grid-template-columns: 1.05fr 1fr; gap: 80px;
  align-items: start;
}
.story__sticky { position: sticky; top: calc(50vh - 260px); }
.story__steps  { padding: 18vh 0 22vh; }
.step {
  min-height: 62vh;
  display: flex; flex-direction: column; justify-content: center;
  opacity: 0.28;
  transition: opacity 0.5s var(--ease);
}
.step.is-active { opacity: 1; }
.step__num { font-size: 0.875rem; font-weight: 700; color: var(--acento); letter-spacing: 0.08em; margin-bottom: 14px; }
.step h3 { font-size: clamp(2rem, 3.6vw, 3rem); line-height: 1.05; letter-spacing: -0.035em; margin-bottom: 18px; }
.step p  { font-size: 1.1875rem; line-height: 1.55; color: var(--txt-2); max-width: 440px; }

.device {
  background: var(--grafito);
  border: 1px solid var(--borde);
  border-radius: 24px;
  padding: 14px;
  box-shadow: var(--sombra);
}
.device__bar { display: flex; align-items: center; gap: 6px; padding: 4px 6px 14px; }
.device__bar i { width: 10px; height: 10px; border-radius: 50%; background: var(--sup-hov); }
.device__bar i:first-child { background: var(--acc); }
.device__bar span { margin-left: 10px; font-size: 12px; color: var(--muted); background: var(--bg); padding: 4px 12px; border-radius: 999px; }
.device__screen {
  height: 420px;
  background: var(--bg);
  border-radius: 14px;
  padding: 30px;
  overflow: hidden;
  background-image: linear-gradient(var(--grid-soft) 1px, transparent 1px), linear-gradient(90deg, var(--grid-soft) 1px, transparent 1px);
  background-size: 32px 32px;
}
.device__dots { display: flex; justify-content: center; gap: 8px; padding-top: 14px; }
.device__dots i { width: 7px; height: 7px; border-radius: 999px; background: var(--borde); transition: width 0.35s var(--ease), background 0.35s; }
.device__dots i.is-on { width: 24px; background: var(--acento); }

.screen-enter-active, .screen-leave-active { transition: opacity 0.35s var(--ease), transform 0.35s var(--ease); }
.screen-enter-from { opacity: 0; transform: translateY(14px); }
.screen-leave-to   { opacity: 0; transform: translateY(-10px); }

.scr { display: flex; flex-direction: column; gap: 12px; height: 100%; }
.scr--center { align-items: center; justify-content: center; text-align: center; }
.scr__label { font-size: 13px; font-weight: 600; color: var(--txt-2); text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; justify-content: space-between; }
.scr__cta { margin-top: auto; align-self: flex-start; background: var(--acc); color: #fff; font-weight: 600; padding: 11px 22px; border-radius: 10px; font-size: 14px; }
.scr__note { margin-top: auto; color: var(--muted); font-size: 14px; }
.scr__big { font-size: 26px; letter-spacing: -0.02em; margin-top: 18px; }
.field { background: var(--campo); border: 1px solid var(--borde); border-radius: 10px; padding: 10px 14px; flex: 1; }
.field small { display: block; color: var(--muted); font-size: 11.5px; margin-bottom: 2px; }
.field b { font-size: 15px; }
.field-row { display: flex; gap: 12px; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chips span { font-size: 12.5px; padding: 6px 12px; border-radius: 999px; background: var(--sup-hov); border: 1px solid var(--borde); color: var(--txt-2); }

.phase { display: flex; align-items: center; gap: 14px; background: var(--sup); border: 1px solid var(--borde); border-radius: 12px; padding: 14px 16px; }
.phase b { display: block; font-size: 15px; }
.phase small { color: var(--muted); font-size: 13px; }
.phase__n { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: var(--sup-hov); color: var(--txt-2); font-weight: 700; font-size: 13px; }
.avatar { margin-left: auto; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 12px; }

.live { display: inline-flex; align-items: center; gap: 6px; text-transform: none; letter-spacing: 0; color: var(--verde); font-size: 12.5px; }
.live i { width: 8px; height: 8px; border-radius: 50%; background: var(--verde); animation: blink 1.6s ease-in-out infinite; }
@keyframes blink { 50% { opacity: 0.25; } }
.big-num { font-size: 84px; font-weight: 700; letter-spacing: -0.05em; line-height: 1; margin-top: 18px; }
.big-num small { font-size: 32px; color: var(--muted); letter-spacing: -0.02em; }
.steps3 { display: flex; gap: 8px; margin-top: 6px; }
.steps3 span { flex: 1; text-align: center; font-size: 12.5px; padding: 8px; border-radius: 8px; background: var(--sup); color: var(--muted); border: 1px solid var(--borde); }
.steps3 .done { color: var(--verde); border-color: var(--b-verde); }
.steps3 .now  { color: var(--azul);  border-color: var(--b-azul); background: var(--s-azul); }
.toast { margin-top: auto; display: flex; align-items: center; gap: 10px; background: var(--sup); border: 1px solid var(--borde); border-radius: 12px; padding: 12px 14px; font-size: 13.5px; color: var(--txt-2); }
.toast .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--acento); flex-shrink: 0; }

.check { width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; background: var(--s-verde); color: var(--verde); box-shadow: 0 0 0 10px var(--s-verde); }
.receipt { margin-top: 28px; display: flex; align-items: center; gap: 16px; background: var(--sup); border: 1px solid var(--borde); border-radius: 12px; padding: 14px 18px; font-size: 14px; }
.receipt__pdf { background: var(--acc); color: #fff; font-weight: 700; font-size: 11px; padding: 4px 8px; border-radius: 6px; }

/* ══════════ ENCABEZADOS DE SECCIÓN ══════════ */
.sec-head { text-align: center; max-width: 820px; margin: 0 auto 64px; }
.sec-head h2 { font-size: clamp(2.5rem, 5.4vw, 4.5rem); line-height: 1.02; letter-spacing: -0.045em; font-weight: 700; }

/* ══════════ BENTO ══════════ */
.bento-sec { padding: 120px 24px; }
.bento {
  max-width: 1180px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;
}
.tile {
  position: relative;
  background: var(--sup);
  border: 1px solid var(--borde);
  border-radius: 28px;
  padding: 36px;
  overflow: hidden;
  min-height: 320px;
  display: flex; flex-direction: column;
  transition: transform 0.4s var(--ease), border-color 0.3s;
}
.tile:hover { transform: translateY(-4px); border-color: var(--borde-hov); }
.tile h3 { font-size: 1.625rem; line-height: 1.15; letter-spacing: -0.025em; margin-bottom: 10px; }
.tile p  { color: var(--txt-2); font-size: 1rem; line-height: 1.5; }
.tile--wide { grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: center; }
.tile--full { grid-column: 1 / -1; min-height: 260px; }
.tile--red  { background: var(--grad-tile); border-color: transparent; color: #fff; justify-content: flex-end; }
.tile--red p { color: rgba(255,255,255,.85); }

.stock { display: flex; flex-direction: column; gap: 16px; background: var(--bg); border: 1px solid var(--borde); border-radius: 18px; padding: 22px; }
.stock__row { display: grid; grid-template-columns: 120px 1fr 40px; gap: 12px; align-items: center; font-size: 13.5px; color: var(--txt-2); }
.stock__row em { font-style: normal; font-weight: 700; text-align: right; }
.stock .bar { height: 8px; }

.pulse { position: absolute; top: 34px; left: 36px; width: 70px; height: 70px; }
.pulse i { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(255,255,255,.6); animation: ring 2.6s var(--ease) infinite; }
.pulse i:nth-child(2) { animation-delay: 0.85s; }
.pulse i:nth-child(3) { animation-delay: 1.7s; }
.pulse::after { content: ''; position: absolute; inset: 27px; border-radius: 50%; background: #fff; }
@keyframes ring { from { transform: scale(0.3); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }

.chart { margin-top: auto; display: flex; align-items: flex-end; gap: 8px; height: 110px; padding-top: 20px; }
.chart i { flex: 1; height: var(--h); border-radius: 6px 6px 3px 3px; background: linear-gradient(180deg, var(--azul), var(--s-azul)); transform-origin: bottom; transform: scaleY(0.15); transition: transform 0.9s var(--ease); transition-delay: calc(var(--i) * 70ms); }
.chart i:nth-child(6) { background: linear-gradient(180deg, var(--acento), var(--s-rojo)); }
.tile.is-in .chart i { transform: scaleY(1); }

.cal { margin-top: auto; display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; padding-top: 20px; }
.cal span { aspect-ratio: 1; display: grid; place-items: center; border-radius: 8px; font-size: 12px; color: var(--muted); background: var(--bg); }
.cal .is-ev    { background: var(--s-azul); color: var(--azul); font-weight: 700; }
.cal .is-today { background: var(--acc); color: #fff; font-weight: 700; }

.files { margin-top: auto; display: flex; gap: 14px; padding-top: 24px; }
.file { width: 74px; height: 92px; border-radius: 10px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 14px; font-weight: 800; font-size: 13px; position: relative; background: var(--bg); border: 1px solid var(--borde); }
.file::before { content: ''; position: absolute; top: 14px; left: 14px; right: 14px; height: 4px; border-radius: 2px; background: var(--borde); box-shadow: 0 10px 0 var(--borde), 0 20px 0 var(--borde); }
.file--pdf { color: var(--rojo-st); transform: rotate(-6deg); }
.file--xls { color: var(--verde); transform: rotate(5deg) translateY(6px); }

.tile--split .lock { justify-self: center; width: 150px; height: 150px; border-radius: 40px; display: grid; place-items: center; color: var(--txt); background: var(--lock-bg); border: 1px solid var(--borde); box-shadow: var(--sombra); }

/* ══════════ ROLES ══════════ */
.roles { padding: 120px 24px 140px; }
.roles__grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.role {
  background: var(--sup); border: 1px solid var(--borde); border-radius: 28px; padding: 36px;
  transition-delay: var(--d);
}
.role__tag { display: inline-block; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; margin-bottom: 26px; }
.role__tag.rojo  { background: var(--s-rojo); }
.lp:not(.lp--dark) .role__tag.rojo { background: #E8EEF4; color: var(--acc); }
.role__tag.azul  { background: var(--s-azul); }
.role__tag.verde { background: var(--s-verde); }
.role h3 { font-size: 2rem; letter-spacing: -0.035em; margin-bottom: 10px; }
.role p  { color: var(--txt-2); line-height: 1.5; margin-bottom: 26px; }
.role ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--borde); padding-top: 22px; }
.role li { display: flex; gap: 10px; align-items: center; font-size: 0.9375rem; color: var(--txt); }
.role li svg { color: var(--verde); flex-shrink: 0; }

/* ══════════ CTA ══════════ */
.cta {
  position: relative;
  margin: 0 24px 24px;
  border-radius: 36px;
  background: var(--grad-cta);
  padding: 140px 24px;
  text-align: center;
  overflow: hidden;
  isolation: isolate;
}
.cta__threads { position: absolute; inset: 0; z-index: -1; }
.cta__threads i {
  position: absolute; left: -10%; right: -10%;
  top: calc(var(--n) * 12%);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
  transform: rotate(-6deg);
  animation: thread 7s ease-in-out infinite alternate;
  animation-delay: calc(var(--n) * -0.8s);
}
@keyframes thread { to { transform: rotate(-3deg) translateY(18px); } }
.cta h2 { font-size: clamp(3rem, 7vw, 5.75rem); line-height: 0.98; letter-spacing: -0.05em; color: #fff; margin-bottom: 22px; }
.cta p  { color: rgba(255,255,255,.85); font-size: 1.1875rem; max-width: 520px; margin: 0 auto 36px; }

/* ══════════ FOOTER ══════════ */
.foot { max-width: 1180px; margin: 0 auto; padding: 56px 24px 40px; }
.foot__inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding-bottom: 28px; border-bottom: 1px solid var(--sup-hov); }
.foot__brand { display: flex; align-items: center; gap: 10px; font-weight: 700; }
.foot__links { display: flex; gap: 26px; flex-wrap: wrap; }
.foot a { color: var(--txt-2); text-decoration: none; font-size: 0.875rem; }
.foot a:hover { color: var(--txt); }
.foot__bottom { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding-top: 22px; font-size: 0.8125rem; color: var(--muted); }

/* ══════════ REVEAL ══════════ */
.reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.9s var(--ease), transform 0.9s var(--ease); }
.reveal.is-in { opacity: 1; transform: none; }

/* ══════════ RESPONSIVE ══════════ */
@media (max-width: 1024px) {
  .app__cards { grid-template-columns: repeat(2, 1fr); }
  .app__cards .app__card:nth-child(n+5) { display: none; }
  .bento { grid-template-columns: repeat(2, 1fr); }
  .tile--wide { grid-column: span 2; }
  .roles__grid { grid-template-columns: 1fr; max-width: 620px; }
}
@media (max-width: 860px) {
  .nav__links { display: none; }
  .nav__inner { justify-content: space-between; }
  .hero { padding-top: 120px; }
  .app { grid-template-columns: 1fr; }
  .app__side { display: none; }
  .app__kpis { grid-template-columns: repeat(2, 1fr); }
  .story__inner { grid-template-columns: 1fr; gap: 0; }
  .story__sticky { top: 76px; z-index: 2; }
  .device__screen { height: 280px; padding: 18px; font-size: 13px; }
  .big-num { font-size: 56px; margin-top: 6px; }
  .step h3 { font-size: 1.75rem; }
  .story__steps { padding: 6vh 0 10vh; }
  .step { min-height: 55vh; background: linear-gradient(transparent, var(--bg) 30%); }
  .statement { padding: 140px 24px 100px; }
}
@media (max-width: 640px) {
  .app__cards { grid-template-columns: 1fr; }
  .app__cards .app__card:nth-child(n+3) { display: none; }
  .bento { grid-template-columns: 1fr; }
  .tile--wide, .tile--full { grid-column: auto; grid-template-columns: 1fr; }
  .tile { padding: 28px; border-radius: 22px; }
  .cta { border-radius: 26px; padding: 100px 20px; margin: 0 12px 12px; }
  .foot__bottom { flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .anim-in, .reveal { opacity: 1; transform: none; animation: none; transition: none; }
  .ribbon__track, .pulse i, .cta__threads i, .live i { animation: none; }
  .chart i { transform: none; transition: none; }
  .hero__stage { transform: none !important; }
}
</style>
