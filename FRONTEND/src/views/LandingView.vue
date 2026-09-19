<template>
  <div class="landing">

    <!-- ══ FONDO TEXTIL ANIMADO ══ -->
    <div class="bg-layer" aria-hidden="true">
      <canvas ref="fabricCanvas" class="fabric-canvas"></canvas>
      <div class="bg-gradient"></div>
      <div class="orb orb-a"></div>
      <div class="orb orb-b"></div>
      <div class="orb orb-c"></div>
      <!-- Partículas flotantes -->
      <div class="particle p1"></div>
      <div class="particle p2"></div>
      <div class="particle p3"></div>
      <div class="particle p4"></div>
      <div class="particle p5"></div>
      <div class="particle p6"></div>
    </div>

    <!-- ══ NAVBAR ══ -->
    <nav class="navbar" :class="{ 'navbar-scrolled': scrolled }">
      <div class="nav-inner">
        <div class="nav-logo">
          <img src="/img/LogoTexticode.png" alt="Texticode" class="nav-logo-img">
          <span class="nav-brand">TEXTICODE</span>
        </div>

        <div class="nav-links">
          <a v-for="link in navLinks" :key="link.id"
            :href="'#' + link.id"
            @click.prevent="scrollTo(link.id)"
            class="nav-link"
            :class="{ 'nav-link-active': activeSection === link.id }">
            {{ link.label }}
            <span class="nav-link-bar"></span>
          </a>
        </div>

        <RouterLink to="/login" class="nav-cta">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
          </svg>
          <span>Ingresar al Sistema</span>
        </RouterLink>
      </div>
    </nav>

    <!-- ══ HERO ══ -->
    <section class="hero">
      <div class="hero-tag" :class="{ 'tag-in': heroVisible }">
        <span class="hero-tag-dot"></span>
        Sistema de Gestión Textil
      </div>

      <h1 class="hero-title" :class="{ 'title-in': heroVisible }">
        <span class="line-1">Tejiendo el futuro</span>
        <span class="line-2">de la <em>producción</em></span>
        <span class="line-3">textil</span>
      </h1>

      <p class="hero-sub" :class="{ 'sub-in': heroVisible }">
        Plataforma web que digitaliza y optimiza la gestión de inventario, producción y clientes para empresas de confecciones.
      </p>

      <div class="hero-actions" :class="{ 'actions-in': heroVisible }">
        <RouterLink to="/login" class="btn-hero-primary">
          Acceder al Sistema
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
          </svg>
        </RouterLink>
        <a href="#nosotros" @click.prevent="scrollTo('nosotros')" class="btn-hero-secondary">
          Conocer más
        </a>
      </div>

      <!-- Stats flotantes -->
      <div class="hero-stats" :class="{ 'stats-in': heroVisible }">
        <div class="hero-stat">
          <div class="hero-stat-num">3</div>
          <div class="hero-stat-label">Roles de usuario</div>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <div class="hero-stat-num">49</div>
          <div class="hero-stat-label">Requisitos funcionales</div>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <div class="hero-stat-num">7</div>
          <div class="hero-stat-label">Módulos principales</div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="scroll-hint" :class="{ 'hint-in': heroVisible }">
        <div class="scroll-line"></div>
        <span>Desplázate para explorar</span>
      </div>
    </section>

    <!-- ══ SOBRE NOSOTROS ══ -->
    <section id="nosotros" class="section section-nosotros">
      <div class="section-inner">

        <div class="section-label reveal-item">
          <span class="section-label-dot"></span>
          Sobre el Proyecto
        </div>

        <div class="nosotros-grid">
          <div class="nosotros-left reveal-item reveal-left">
            <h2 class="section-title">¿Qué es <span class="accent">Texticode</span>?</h2>
            <p class="section-desc">
              Texticode es un aplicativo web desarrollado para digitalizar los procesos de gestión de inventario y producción en empresas de confecciones, eliminando el control manual que genera retrasos, errores en registros y desorden en la distribución de tareas.
            </p>
            <p class="section-desc">
              El sistema centraliza la operación en una sola plataforma con roles diferenciados para administradores, operarios y clientes, garantizando control total sobre los recursos, la producción y las entregas.
            </p>

            <div class="nosotros-pills">
              <div class="n-pill n-pill--green">
                <div class="n-pill-icon-wrap n-pill-icon-wrap--green">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                  </svg>
                </div>
                Reduce errores operativos
              </div>
              <div class="n-pill n-pill--blue">
                <div class="n-pill-icon-wrap n-pill-icon-wrap--blue">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                  </svg>
                </div>
                Ahorra tiempo en gestión
              </div>
              <div class="n-pill n-pill--purple">
                <div class="n-pill-icon-wrap n-pill-icon-wrap--purple">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>
                  </svg>
                </div>
                Centraliza la información
              </div>
              <div class="n-pill n-pill--amber">
                <div class="n-pill-icon-wrap n-pill-icon-wrap--amber">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                  </svg>
                </div>
                Acceso seguro por roles
              </div>
            </div>
          </div>

          <div class="nosotros-right reveal-item reveal-right">
            <!-- Problema y solución -->
            <div class="prob-sol-card">
              <div class="ps-section ps-problem">
                <div class="ps-header">
                  <div class="ps-icon ps-icon-red">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                    </svg>
                  </div>
                  <strong>El Problema</strong>
                </div>
                <p>Control manual del inventario y producción que genera retrasos, errores en registros y desorden en la distribución de tareas entre operarios.</p>
              </div>
              <div class="ps-divider">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                </svg>
              </div>
              <div class="ps-section ps-solution">
                <div class="ps-header">
                  <div class="ps-icon ps-icon-green">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <strong>La Solución</strong>
                </div>
                <p>Aplicativo web integral que digitaliza y automatiza la gestión, ofreciendo visibilidad en tiempo real de inventario, producción y entregas.</p>
              </div>
            </div>

            <!-- Pregunta del problema -->
            <div class="question-card reveal-item">
              <div class="q-mark">"</div>
              <p>¿Cómo desarrollar un aplicativo web que optimice la gestión de inventario y producción en la empresa de confecciones?</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FUNCIONALIDADES ══ -->
    <section id="funcionalidades" class="section section-func">
      <div class="section-inner">

        <div class="section-label reveal-item">
          <span class="section-label-dot"></span>
          Funcionalidades
        </div>

        <div class="section-head-row reveal-item">
          <h2 class="section-title">Un sistema para <span class="accent">tres roles</span></h2>
          <p class="section-sub">Cada perfil tiene su panel personalizado con las herramientas que necesita.</p>
        </div>

        <!-- Tabs de roles -->
        <div class="role-tabs reveal-item">
          <button
            v-for="role in roles"
            :key="role.id"
            class="role-tab"
            :class="{ 'role-tab-active': activeRole === role.id }"
            @click="activeRole = role.id"
          >
            <span class="tab-dot" :style="{ background: role.color }"></span>
            {{ role.label }}
          </button>
        </div>

        <Transition name="role-switch" mode="out-in">
          <div :key="activeRole" class="role-content">
            <div class="role-info-col">
              <div class="role-badge" :style="{ background: activeRoleData.color + '22', color: activeRoleData.color, borderColor: activeRoleData.color + '44' }">
                <component :is="'svg'" v-html="activeRoleData.iconSvg" class="role-badge-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"></component>
                {{ activeRoleData.label }}
              </div>
              <h3 class="role-title">{{ activeRoleData.title }}</h3>
              <p class="role-desc">{{ activeRoleData.desc }}</p>

              <div class="role-modules">
                <div v-for="mod in activeRoleData.modules" :key="mod.name" class="role-module">
                  <div class="rm-icon" :style="{ background: activeRoleData.color + '22', color: activeRoleData.color }">
                    <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14">
                      <path stroke-linecap="round" stroke-linejoin="round" :d="mod.icon"/>
                    </svg>
                  </div>
                  <div>
                    <div class="rm-name">{{ mod.name }}</div>
                    <div class="rm-desc">{{ mod.desc }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="role-reqs-col">
              <div class="reqs-header">Requisitos Funcionales Clave</div>
              <div class="req-list">
                <div v-for="(req, i) in activeRoleData.reqs" :key="i" class="req-item">
                  <span class="req-id">RF-{{ String(req.id).padStart(3,'0') }}</span>
                  <span class="req-text">{{ req.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Módulos en grid -->
        <div class="modules-grid">
          <div v-for="(mod, i) in mainModules" :key="mod.title" class="mod-card reveal-item" :style="{ transitionDelay: `${i * 80}ms` }">
            <div class="mod-icon-wrap" :style="{ background: mod.bg }">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24" :style="{ color: mod.color }">
                <path stroke-linecap="round" stroke-linejoin="round" :d="mod.icon"/>
              </svg>
            </div>
            <h4>{{ mod.title }}</h4>
            <p>{{ mod.desc }}</p>
            <div class="mod-tags">
              <span v-for="tag in mod.tags" :key="tag" class="mod-tag">{{ tag }}</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══ ALCANCES ══ -->
    <section id="alcances" class="section section-alcances">
      <div class="section-inner">

        <div class="section-label reveal-item">
          <span class="section-label-dot"></span>
          Alcances del Sistema
        </div>

        <div class="alcances-grid">
          <div class="alcances-left reveal-item reveal-left">
            <h2 class="section-title">Lo que <span class="accent">Texticode</span> hace</h2>
            <p class="section-desc">El sistema cubre los procesos core de la operación textil, con foco en digitalización, trazabilidad y control.</p>

            <div class="alcances-list">
              <div v-for="(item, i) in alcancesSi" :key="item" class="alcance-item alcance-si reveal-item" :style="{ transitionDelay: (i * 60) + 'ms' }">
                <div class="alc-icon">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                </div>
                {{ item }}
              </div>
            </div>
          </div>


        </div>

        <!-- Objetivos específicos en timeline -->
        <div class="obj-timeline">
          <div class="obj-timeline-title">Objetivos Específicos</div>
          <div class="obj-items">
            <div v-for="(obj, i) in objetivosEspecificos" :key="i" class="obj-item reveal-item" :style="{ transitionDelay: `${i * 80}ms` }">
              <div class="obj-num">{{ String(i+1).padStart(2,'0') }}</div>
              <p>{{ obj }}</p>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══ STACK TECNOLÓGICO ══ -->
    <section class="section section-stack">
      <div class="section-inner">

        <div class="section-label reveal-item">
          <span class="section-label-dot"></span>
          Stack Tecnológico
        </div>

        <h2 class="section-title text-center reveal-item">Tecnologías utilizadas</h2>

        <div class="stack-grid reveal-item">
          <div v-for="(tech, i) in techStack" :key="tech.name" class="tech-card">
            <div class="tech-icon-wrap anim-icon" :style="{ background: tech.bg, animationDelay: `${i * 0.25}s` }">
              <span class="tech-icon-text" :style="{ color: tech.color }">{{ tech.abbr }}</span>
            </div>
            <div class="tech-name">{{ tech.name }}</div>
            <div class="tech-role">{{ tech.role }}</div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══ EQUIPO ══ -->
    <section id="equipo" class="section section-equipo">
      <div class="section-inner">

        <div class="section-label reveal-item">
          <span class="section-label-dot"></span>
          El Equipo
        </div>

        <h2 class="section-title text-center reveal-item">Desarrolladores del <span class="accent">Proyecto</span></h2>
        <p class="section-sub text-center reveal-item">Equipo multidisciplinario de desarrollo de software enfocado en soluciones para el sector textil.</p>

        <div class="team-grid">
          <div v-for="(member, i) in teamMembers" :key="member.name" class="team-card reveal-item" :style="{ transitionDelay: `${i * 80}ms` }">
            <div class="team-avatar anim-icon" :style="{ background: member.bg, color: member.color, animationDelay: `${i * 0.4}s` }">
              {{ member.initials }}
            </div>
            <div class="team-name">{{ member.name }}</div>
            <div class="team-role">Desarrollador de Software</div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══ CTA FINAL ══ -->
    <section class="section section-cta">
      <div class="cta-inner reveal-item">
        <div class="cta-threads">
          <span v-for="n in 6" :key="n" class="cta-thread" :style="{ background: `hsl(${200 + n*12}, 45%, ${30+n*4}%)`, animationDelay: `${n*0.15}s` }"></span>
        </div>
        <div class="cta-content">
          <h2>Listo para gestionar<br><span class="accent">tu producción textil</span></h2>
          <p>Ingresa al sistema con tu cuenta y comienza a digitalizar tu operación hoy.</p>
          <RouterLink to="/" class="btn-cta">
            Iniciar Sesión
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
            </svg>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ══ FOOTER ══ -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img src="/img/LogoTexticode.png" alt="Texticode" class="footer-logo">
          <span>TEXTICODE © 2026</span>
        </div>
        <div class="footer-copy">Sistema de Gestión Textil · Proyecto Académico</div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const fabricCanvas = ref(null)
const heroVisible = ref(false)
const scrolled      = ref(false)
const activeSection = ref('')

const navLinks = [
  { id: 'nosotros',        label: 'Nosotros' },
  { id: 'funcionalidades', label: 'Funcionalidades' },
  { id: 'alcances',        label: 'Alcances' },
  { id: 'equipo',          label: 'Equipo' },
]
const activeRole = ref('admin')
let ctx, animFrame

// ── Fabric canvas ──
function initFabric() {
  const canvas = fabricCanvas.value
  if (!canvas) return
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
  drawFabric(0)
}

function drawFabric(t) {
  if (!ctx || !fabricCanvas.value) return
  const W = fabricCanvas.value.width
  const H = fabricCanvas.value.height
  ctx.clearRect(0, 0, W, H)
  const spacing = 36
  const wave    = 3.5
  for (let x = 0; x < W + spacing; x += spacing) {
    ctx.beginPath()
    const alpha = x % (spacing * 2) === 0 ? 0.06 : 0.035
    ctx.strokeStyle = `rgba(45,106,159,${alpha})`
    ctx.lineWidth = 0.9
    for (let y = 0; y <= H; y += 3) {
      const offset = Math.sin((y / 44) + (x / 64) + t * 0.32) * wave
      y === 0 ? ctx.moveTo(x + offset, y) : ctx.lineTo(x + offset, y)
    }
    ctx.stroke()
  }
  for (let y = 0; y < H + spacing; y += spacing) {
    ctx.beginPath()
    const alpha = y % (spacing * 2) === 0 ? 0.045 : 0.025
    ctx.strokeStyle = `rgba(31,58,82,${alpha})`
    ctx.lineWidth = 0.7
    for (let x = 0; x <= W; x += 3) {
      const offset = Math.sin((x / 44) + (y / 64) + t * 0.26) * wave
      x === 0 ? ctx.moveTo(x, y + offset) : ctx.lineTo(x, y + offset)
    }
    ctx.stroke()
  }
  animFrame = requestAnimationFrame(() => drawFabric(t + 0.01))
}

// ── Scroll ──
function onScroll() {
  scrolled.value = window.scrollY > 60
  revealOnScroll()
  const ids = ['nosotros', 'funcionalidades', 'alcances', 'equipo']
  let current = ''
  for (const id of ids) {
    const el = document.getElementById(id)
    if (el && window.scrollY >= el.offsetTop - 140) current = id
  }
  activeSection.value = current
}

function revealOnScroll() {
  document.querySelectorAll('.reveal-item').forEach(el => {
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight - 80) {
      el.classList.add('is-visible')
    }
  })
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Data ──
const roles = [
  { id: 'admin',   label: 'Administrador', color: '#1f3a52' },
  { id: 'operario',label: 'Operario',      color: '#2563eb' },
  { id: 'cliente', label: 'Cliente',       color: '#16a34a' },
]

const rolesData = {
  admin: {
    id: 'admin', label: 'Administrador', color: '#1f3a52',
    title: 'Control total de la operación',
    desc: 'El administrador gestiona todos los recursos del sistema: usuarios, inventario, producción, clientes y reportes desde un panel centralizado.',
    iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
    modules: [
      { name: 'Gestión de Usuarios', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', desc: 'Crear, editar y desactivar usuarios con roles' },
      { name: 'Gestión de Inventario', icon: 'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9', desc: 'Control de materiales, stock y alertas automáticas' },
      { name: 'Gestión de Producción', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z', desc: 'Órdenes, estados y comprobantes de entrega' },
      { name: 'Eficiencia de Operarios', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', desc: 'Métricas de rendimiento y observaciones por operario' },
      { name: 'Carga de Trabajo', icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6', desc: 'Balanceo y reasignación de órdenes entre operarios' },
      { name: 'Reportes', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', desc: 'Análisis de ventas, producción e inventario' },
    ],
    reqs: [
      { id: 1, text: 'Autenticar y autorizar usuarios con permisos por rol' },
      { id: 3, text: 'Asignar roles: Administrador, Operario, Cliente' },
      { id: 7, text: 'Registrar y actualizar materiales con datos de stock' },
      { id: 10, text: 'Monitorear eficiencia y carga de trabajo de operarios' },
      { id: 12, text: 'Generar reportes automáticos y exportar a PDF y Excel' },
    ],
  },
  operario: {
    id: 'operario', label: 'Operario', color: '#2563eb',
    title: 'Gestión de tareas y avances',
    desc: 'El operario recibe sus órdenes asignadas, reporta el avance de cada tarea y gestiona su actividad de producción en tiempo real.',
    iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>',
    modules: [
      { name: 'Cuenta Personal', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0', desc: 'Perfil, datos personales y actividad' },
      { name: 'Tareas Asignadas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', desc: 'Visualizar órdenes con prioridad y fechas' },
      { name: 'Reportar Avances', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', desc: 'Actualizar progreso, pausar y reportar incidencias' },
      { name: 'Google Calendar', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', desc: 'Sincronización de tareas con Google Calendar' },
    ],
    reqs: [
      { id: 16, text: 'Gestionar perfil: datos personales y estado' },
      { id: 20, text: 'Visualizar órdenes asignadas con detalles completos' },
      { id: 21, text: 'Monitorear estado: pendiente, en proceso, completada' },
      { id: 24, text: 'Registrar progreso y unidades completadas' },
      { id: 28, text: 'Consultar historial de reportes anteriores' },
    ],
  },
  cliente: {
    id: 'cliente', label: 'Cliente', color: '#16a34a',
    title: 'Seguimiento de pedidos en tiempo real',
    desc: 'El cliente consulta el estado de sus órdenes, descarga comprobantes de entrega y se comunica directamente con el soporte.',
    iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/>',
    modules: [
      { name: 'Cuenta Personal', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0', desc: 'Perfil, comprobantes y historial de pedidos' },
      { name: 'Pedidos y Entregas', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25', desc: 'Seguimiento en tiempo real con barras de progreso' },
      { name: 'Centro de Soporte', icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z', desc: 'Canales de atención y preguntas frecuentes' },
      { name: 'Google Calendar', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', desc: 'Sincronización de entregas con tu calendario Google' },
    ],
    reqs: [
      { id: 29, text: 'Gestionar perfil: datos y estado de cuenta' },
      { id: 30, text: 'Visualizar historial de pedidos con estados' },
      { id: 34, text: 'Monitorear entregas y confirmar recepción' },
      { id: 36, text: 'Consultar información específica de cada pedido' },
      { id: 46, text: 'Descargar comprobantes de entrega en PDF' },
    ],
  },
}

const activeRoleData = computed(() => rolesData[activeRole.value])

const mainModules = [
  { title: 'Gestión de Usuarios', desc: 'CRUD completo de usuarios con roles diferenciados y control de acceso seguro por credenciales.', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', bg: '#e0eaf2', color: '#1f3a52', tags: ['CRUD', 'Roles', 'Seguridad'] },
  { title: 'Control de Inventario', desc: 'Registro de materiales con stock actual, mínimo y máximo. Alertas automáticas para stock bajo o agotado.', icon: 'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9', bg: '#e0f0ff', color: '#2563eb', tags: ['Alertas', 'Stock', 'Categorías'] },
  { title: 'Gestión de Producción', desc: 'Órdenes de producción con seguimiento en tiempo real, asignación de operarios y control de avances.', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z', bg: '#f0fdf4', color: '#16a34a', tags: ['Órdenes', 'Avances', 'Comprobantes'] },
  { title: 'Eficiencia y Carga de Trabajo', desc: 'Métricas de rendimiento por operario, historial comparativo y balanceo automático de órdenes entre operarios.', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', bg: '#fef9c3', color: '#d97706', tags: ['Métricas', 'Rendimiento', 'Reasignación'] },
  { title: 'Reportes y Análisis', desc: 'Generación automática de reportes en PDF y Excel con estadísticas de producción, inventario y clientes.', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z', bg: '#ede9fe', color: '#7c3aed', tags: ['PDF', 'Excel', 'Gráficas'] },
  { title: 'Panel del Cliente', desc: 'Vista dedicada con seguimiento de pedidos, descarga de comprobantes de entrega y centro de soporte.', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', bg: '#e0f2fe', color: '#0369a1', tags: ['Pedidos', 'Entregas', 'Soporte'] },
  { title: 'Google Calendar', desc: 'Sincronización de fechas de entrega con Google Calendar vía OAuth2. Notificaciones por email con SendGrid.', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', bg: '#fce7f3', color: '#be185d', tags: ['OAuth2', 'SendGrid', 'Notificaciones'] },
]

const alcancesSi = [
  'Digitalización de procesos manuales de producción',
  'Optimización de tiempos y reducción de errores operativos',
  'Mayor control de recursos y gestión de inventario',
  'Control de fechas de inicio, avance y entrega de producción',
  'Reportes automáticos de inventario y producción en PDF y Excel',
  'Sistema de gestión de clientes con comprobantes de entrega',
  'Módulo de asignación de tareas para operarios',
  'Alertas de stock bajo para materiales críticos',
  'Notificaciones automáticas por email vía SendGrid',
  'Sincronización de entregas con Google Calendar (OAuth2)',
  'Métricas de eficiencia y carga de trabajo por operario',
]



const objetivosEspecificos = [
  'Controlar y registrar las fechas de inicio, avance y entrega de producción, asegurando un flujo organizado.',
  'Implementar reportes automáticos que permitan visualizar el estado del inventario, producción y rendimiento.',
  'Desarrollar un sistema de control para clientes con información de productos, tiempos y comprobantes de entrega.',
  'Implementar inicio de sesión con roles diferenciados para garantizar seguridad en el acceso.',
  'Gestionar inventario de materiales con funcionalidades de registro, edición, eliminación y alertas de stock.',
  'Diseñar un módulo de asignación de tareas para operarios con registro de avances y finalización de procesos.',
  'Integrar Google Calendar vía OAuth2 para sincronizar fechas de entrega y notificar por email con SendGrid.',
  'Monitorear la eficiencia de operarios y balancear la carga de trabajo con reasignación automática de órdenes.',
]

const techStack = [
  { name: 'Vue.js 3', abbr: 'Vue', role: 'Framework Frontend', bg: '#f0fdf4', color: '#16a34a' },
  { name: 'Vite', abbr: 'Vite', role: 'Build Tool', bg: '#fef9c3', color: '#d97706' },
  { name: 'Pinia', abbr: 'Pinia', role: 'State Management', bg: '#fef3c7', color: '#f59e0b' },
  { name: 'Node.js', abbr: 'Node', role: 'Backend Runtime', bg: '#f0fdf4', color: '#15803d' },
  { name: 'Express.js', abbr: 'Exp', role: 'API REST Framework', bg: '#f8fafc', color: '#374151' },
  { name: 'Supabase', abbr: 'SB', role: 'Base de Datos PostgreSQL', bg: '#ecfdf5', color: '#059669' },
  { name: 'JWT', abbr: 'JWT', role: 'Autenticación', bg: '#e0e7ff', color: '#4338ca' },
  { name: 'bcrypt.js', abbr: 'BC', role: 'Cifrado', bg: '#fce7f3', color: '#be185d' },
  { name: 'SendGrid', abbr: 'SG', role: 'Notificaciones Email', bg: '#e0f2fe', color: '#0369a1' },
  { name: 'Google Calendar', abbr: 'GC', role: 'Integración OAuth2', bg: '#fef3c7', color: '#b45309' },
]

const teamMembers = [
  { name: 'Andrés Lancheros', initials: 'AL', bg: '#dbeafe', color: '#1d4ed8' },
  { name: 'Camilo Tibambre', initials: 'CT', bg: '#d1fae5', color: '#065f46' },
  { name: 'Kevin Castro', initials: 'KC', bg: '#ede9fe', color: '#5b21b6' },
  { name: 'Kevin Montenegro', initials: 'KM', bg: '#fce7f3', color: '#9d174d' },
]

onMounted(() => {
  setTimeout(() => { heroVisible.value = true }, 120)
  initFabric()
  window.addEventListener('resize', initFabric)
  window.addEventListener('scroll', onScroll)
  setTimeout(revealOnScroll, 400)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', initFabric)
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
/* ════════════════════════════════════════
   VARIABLES & BASE
════════════════════════════════════════ */
.landing {
  --navy:   #0d1f2d;
  --deep:   #1f3a52;
  --mid:    #2d6a9f;
  --accent: #4a8fcc;
  --white:  #ffffff;
  --light:  #f1f5f9;
  --muted:  #6b7280;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #111827;
  background: var(--light);
  overflow-x: hidden;
}

/* ── FONDO ── */
.bg-layer { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: linear-gradient(145deg, #0a1827 0%, #152535 40%, #0d1e2f 70%, #09162a 100%); }
.fabric-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.bg-gradient { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 50% at 30% 40%, rgba(45,106,159,0.18), transparent), radial-gradient(ellipse 50% 60% at 75% 20%, rgba(31,58,82,0.22), transparent); }
.orb { position: absolute; border-radius: 50%; filter: blur(100px); }
.orb-a { width: 500px; height: 500px; background: radial-gradient(circle, rgba(45,106,159,0.2), transparent); top: -150px; left: -80px; animation: orbFloat 14s ease-in-out infinite alternate; }
.orb-b { width: 350px; height: 350px; background: radial-gradient(circle, rgba(74,143,204,0.12), transparent); bottom: -80px; right: -60px; animation: orbFloat 18s ease-in-out infinite alternate-reverse; }
.orb-c { width: 250px; height: 250px; background: radial-gradient(circle, rgba(31,58,82,0.18), transparent); top: 40%; right: 25%; animation: orbFloat 11s ease-in-out infinite alternate; }
@keyframes orbFloat { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,-25px) scale(1.06); } }

/* ── NAVBAR ── */
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0; transition: all 0.35s ease;
}
.navbar::before {
  content: ''; position: absolute; inset: 0;
  background: rgba(9,22,42,0); backdrop-filter: blur(0px);
  border-bottom: 1px solid transparent;
  transition: all 0.35s ease;
}
.navbar-scrolled::before {
  background: rgba(8,18,32,0.88);
  backdrop-filter: blur(24px) saturate(1.5);
  border-bottom-color: rgba(255,255,255,0.09);
}

.nav-inner {
  max-width: 1280px; margin: 0 auto;
  padding: 0 48px; height: 90px;
  display: flex; align-items: center;
  position: relative; z-index: 1;
}

/* Logo */
.nav-logo { display: flex; align-items: center; gap: 18px; flex-shrink: 0; }
.nav-logo-img { width: 68px; filter: brightness(0) invert(1); drop-shadow: 0 0 18px rgba(74,143,204,0.35); }
.nav-brand {
  font-size: 26px; font-weight: 900; color: white;
  letter-spacing: 4px;
  text-shadow: 0 0 40px rgba(74,143,204,0.4);
}

/* Links */
.nav-links { flex: 1; display: flex; gap: 6px; justify-content: center; }
.nav-link {
  position: relative; display: flex; flex-direction: column; align-items: center;
  color: rgba(255,255,255,0.55); font-size: 14.5px; font-weight: 500;
  text-decoration: none; padding: 10px 20px; border-radius: 10px;
  letter-spacing: 0.01em;
  transition: color 0.2s, background 0.2s;
}
.nav-link:hover { color: rgba(255,255,255,0.92); background: rgba(255,255,255,0.07); }
.nav-link-active { color: white !important; }
.nav-link-bar {
  position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
  width: 0; height: 2px; border-radius: 99px;
  background: var(--accent); transition: width 0.25s ease;
}
.nav-link-active .nav-link-bar { width: 22px; }
.nav-link:hover .nav-link-bar { width: 14px; }

/* CTA button */
.nav-cta {
  display: flex; align-items: center; gap: 9px;
  background: linear-gradient(135deg, rgba(45,106,159,0.75), rgba(31,58,82,0.85));
  color: white; text-decoration: none;
  border: 1px solid rgba(74,143,204,0.45);
  border-radius: 12px; padding: 12px 24px;
  font-size: 14px; font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
  transition: all 0.22s ease;
}
.nav-cta svg { flex-shrink: 0; opacity: 0.85; }
.nav-cta:hover {
  background: linear-gradient(135deg, rgba(74,143,204,0.8), rgba(45,106,159,0.9));
  border-color: rgba(74,143,204,0.65);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(45,106,159,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
}

/* ── HERO ── */
.hero { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 140px 32px 80px; }
.hero-tag { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.07); border-radius: 999px; padding: 6px 18px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 28px; opacity: 0; transform: translateY(-12px); transition: opacity 0.5s ease, transform 0.5s ease; }
.hero-tag.tag-in { opacity: 1; transform: none; }
.hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); animation: dotPulse 2s ease-in-out infinite; }
@keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

.hero-title { margin: 0 0 24px; display: flex; flex-direction: column; opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s; }
.hero-title.title-in { opacity: 1; transform: none; }
.line-1, .line-2, .line-3 { display: block; line-height: 1.05; }
.line-1 { font-size: clamp(38px, 6vw, 72px); font-weight: 300; color: rgba(255,255,255,0.72); }
.line-2 { font-size: clamp(44px, 7vw, 88px); font-weight: 800; color: white; letter-spacing: -0.03em; }
.line-2 em { font-style: italic; color: #60b4f2; }
.line-3 { font-size: clamp(38px, 6vw, 72px); font-weight: 800; color: white; letter-spacing: -0.03em; }

.hero-sub { font-size: clamp(15px, 2vw, 19px); color: rgba(255,255,255,0.55); max-width: 600px; line-height: 1.7; margin-bottom: 40px; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease 0.25s, transform 0.5s ease 0.25s; }
.hero-sub.sub-in { opacity: 1; transform: none; }

.hero-actions { display: flex; gap: 14px; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease 0.35s, transform 0.5s ease 0.35s; }
.hero-actions.actions-in { opacity: 1; transform: none; }

.btn-hero-primary { display: flex; align-items: center; gap: 8px; background: white; color: var(--deep); border: none; border-radius: 12px; padding: 14px 28px; font-size: 15px; font-weight: 700; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; }
.btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,255,255,0.2); }
.btn-hero-secondary { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; transition: background 0.2s, transform 0.2s; }
.btn-hero-secondary:hover { background: rgba(255,255,255,0.18); transform: translateY(-1px); }

.hero-stats { display: flex; align-items: center; gap: 32px; margin-top: 60px; padding: 22px 36px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; backdrop-filter: blur(10px); opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease 0.45s, transform 0.5s ease 0.45s; }
.hero-stats.stats-in { opacity: 1; transform: none; }
.hero-stat { text-align: center; }
.hero-stat-num { font-size: 32px; font-weight: 800; color: white; }
.hero-stat-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
.hero-stat-divider { width: 1px; height: 44px; background: rgba(255,255,255,0.15); }

.scroll-hint { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 56px; opacity: 0; transition: opacity 0.5s ease 0.6s; }
.scroll-hint.hint-in { opacity: 1; }
.scroll-line { width: 40px; height: 1px; background: rgba(255,255,255,0.25); }

/* ── SECTIONS BASE ── */
.section { position: relative; z-index: 1; padding: 96px 32px; }
.section-inner { max-width: 1200px; margin: 0 auto; }
.section-label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mid); margin-bottom: 20px; }
.section-label-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mid); }
.section-title { font-size: clamp(28px, 4vw, 44px); font-weight: 800; color: #111827; margin: 0 0 16px; line-height: 1.15; letter-spacing: -0.02em; }
.section-title .accent { color: var(--deep); }
.section-desc { font-size: 16px; color: var(--muted); line-height: 1.75; max-width: 560px; }
.section-sub { font-size: 16px; color: var(--muted); line-height: 1.7; }
.text-center { text-align: center; margin-left: auto; margin-right: auto; }

/* ── REVEAL ANIMATION ── */
.reveal-item { opacity: 0; transform: translateY(28px); transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1); }
.reveal-item.is-visible { opacity: 1; transform: none; }

/* ── NOSOTROS ── */
.section-nosotros { background: white; }
.nosotros-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: flex-start; margin-top: 32px; }
.nosotros-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }

.n-pill {
  display: flex; align-items: center; gap: 9px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 999px; padding: 7px 16px 7px 7px;
  font-size: 13px; font-weight: 600; color: var(--deep);
  transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease;
  cursor: default;
}
.n-pill:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 6px 18px rgba(0,0,0,0.09); }

/* Icon wrapper base */
.n-pill-icon-wrap {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  animation: iconFloat 4s ease-in-out infinite;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
}
.n-pill:hover .n-pill-icon-wrap {
  animation-play-state: paused;
  transform: scale(1.18) rotate(-8deg);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Green — errores */
.n-pill--green { border-color: #bbf7d0; }
.n-pill--green:hover { border-color: #86efac; box-shadow: 0 6px 18px rgba(22,163,74,0.12); }
.n-pill-icon-wrap--green { background: #dcfce7; color: #16a34a; animation-delay: 0s; }

/* Blue — tiempo */
.n-pill--blue { border-color: #bfdbfe; }
.n-pill--blue:hover { border-color: #93c5fd; box-shadow: 0 6px 18px rgba(37,99,235,0.12); }
.n-pill-icon-wrap--blue { background: #dbeafe; color: #2563eb; animation-delay: -1s; }

/* Purple — centraliza */
.n-pill--purple { border-color: #e9d5ff; }
.n-pill--purple:hover { border-color: #c4b5fd; box-shadow: 0 6px 18px rgba(109,40,217,0.12); }
.n-pill-icon-wrap--purple { background: #f3e8ff; color: #7c3aed; animation-delay: -2s; }

/* Amber — acceso */
.n-pill--amber { border-color: #fde68a; }
.n-pill--amber:hover { border-color: #fbbf24; box-shadow: 0 6px 18px rgba(217,119,6,0.12); }
.n-pill-icon-wrap--amber { background: #fef3c7; color: #d97706; animation-delay: -3s; }

.prob-sol-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
.ps-section { padding: 22px 24px; }
.ps-problem { background: #fff5f5; }
.ps-solution { background: #f0fdf4; }
.ps-header { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px; }
.ps-icon {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  animation: iconFloat 5s ease-in-out infinite;
  transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
  cursor: default;
}
.ps-icon:hover {
  transform: scale(1.25) translateY(-2px) !important;
  animation-play-state: paused;
  box-shadow: 0 6px 16px rgba(0,0,0,0.14);
}
.ps-problem .ps-icon { animation-delay: 0s; }
.ps-solution .ps-icon { animation-delay: -2.5s; }
.ps-icon-red   { background: #fee2e2; color: #dc2626; }
.ps-icon-green { background: #dcfce7; color: #16a34a; }
.ps-section p  { font-size: 14px; color: #4b5563; line-height: 1.65; margin: 0; }
.ps-divider { display: flex; align-items: center; justify-content: center; padding: 10px; background: #f3f4f6; color: #9ca3af; }

.question-card { background: linear-gradient(135deg, var(--deep), #1a4a6e); border-radius: 16px; padding: 28px 28px 24px; position: relative; overflow: hidden; }
.q-mark { font-size: 72px; font-weight: 900; color: rgba(255,255,255,0.12); line-height: 1; position: absolute; top: 12px; left: 20px; }
.question-card p { font-size: 16px; font-style: italic; color: rgba(255,255,255,0.88); line-height: 1.7; margin: 0; position: relative; z-index: 1; }

/* ── FUNCIONALIDADES ── */
.section-func { background: #f8fafc; }
.section-head-row { display: flex; flex-direction: column; margin-bottom: 32px; align-items: center; text-align: center; }

.role-tabs { display: flex; gap: 10px; margin-bottom: 32px; }
.role-tab { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: white; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.tab-dot { width: 8px; height: 8px; border-radius: 50%; }
.role-tab:hover { border-color: #d1d5db; color: #374151; }
.role-tab-active { background: var(--deep); border-color: var(--deep); color: white; box-shadow: 0 4px 16px rgba(31,58,82,0.25); }
.role-tab-active .tab-dot { background: white !important; }

.role-switch-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.role-switch-leave-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.role-switch-enter-from { opacity: 0; transform: translateY(8px); }
.role-switch-leave-to   { opacity: 0; transform: translateY(-8px); }

.role-content { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 56px; background: white; border: 1px solid #e5e7eb; border-radius: 18px; padding: 36px; }
.role-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
.role-badge-icon { width: 16px; height: 16px; }
.role-title { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 10px; }
.role-desc  { font-size: 14px; color: #6b7280; line-height: 1.7; margin-bottom: 24px; }
.role-modules { display: flex; flex-direction: column; gap: 14px; }
.role-module { display: flex; gap: 14px; align-items: flex-start; }
.rm-icon {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; overflow: visible;
  animation: iconFloat 4s ease-in-out infinite;
  transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
  cursor: default;
}
.rm-icon svg { overflow: visible; display: block; }
.rm-icon:hover {
  transform: scale(1.22) translateY(-2px) !important;
  animation-play-state: paused;
  box-shadow: 0 6px 18px rgba(0,0,0,0.13);
}
.role-module:nth-child(1) .rm-icon { animation-delay: 0s; }
.role-module:nth-child(2) .rm-icon { animation-delay: -1.3s; }
.role-module:nth-child(3) .rm-icon { animation-delay: -2.6s; }
.role-module:nth-child(4) .rm-icon { animation-delay: -0.7s; }
.rm-name { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 2px; }
.rm-desc { font-size: 12px; color: #6b7280; }

.reqs-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 16px; }
.req-list { display: flex; flex-direction: column; gap: 10px; }
.req-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; transition: background 0.15s, border-color 0.15s; }
.req-item:hover { background: white; border-color: #e5e7eb; }
.req-id { font-size: 11px; font-weight: 700; padding: 2px 8px; background: #e0eaf2; color: var(--deep); border-radius: 6px; white-space: nowrap; flex-shrink: 0; }
.req-text { font-size: 13px; color: #374151; line-height: 1.5; }

.modules-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
.mod-card { background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 22px 18px; transition: box-shadow 0.2s, transform 0.2s; }
.mod-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.07); transform: translateY(-3px); }
.mod-icon-wrap {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px; overflow: visible;
  animation: iconFloat 4.5s ease-in-out infinite;
  transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
  cursor: default;
}
.mod-icon-wrap svg { overflow: visible; display: block; }
.mod-icon-wrap:hover {
  transform: scale(1.2) translateY(-3px) !important;
  animation-play-state: paused;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}
.mod-card:nth-child(1) .mod-icon-wrap { animation-delay: 0s; }
.mod-card:nth-child(2) .mod-icon-wrap { animation-delay: -0.9s; }
.mod-card:nth-child(3) .mod-icon-wrap { animation-delay: -1.8s; }
.mod-card:nth-child(4) .mod-icon-wrap { animation-delay: -2.7s; }
.mod-card:nth-child(5) .mod-icon-wrap { animation-delay: -3.6s; }
.mod-card h4 { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px; }
.mod-card p  { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 12px; }
.mod-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.mod-tag { font-size: 11px; font-weight: 600; background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 999px; }

/* ── ALCANCES ── */
.section-alcances { background: white; }
.alcances-grid { display: grid; grid-template-columns: 1fr; gap: 40px; margin-top: 32px; margin-bottom: 56px; }
.alcances-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
.alcance-item { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #374151; font-weight: 500; padding: 10px 14px; border-radius: 10px; }
.alcance-si { background: #f0fdf4; border: 1px solid #bbf7d0; }
.alcance-no { background: #fef2f2; border: 1px solid #fecaca; }
.alc-icon {
  width: 24px; height: 24px; border-radius: 50%;
  background: #dcfce7; color: #15803d;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  animation: iconFloat 4.2s ease-in-out infinite;
  transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
  cursor: default;
}
.alc-icon:hover {
  transform: scale(1.3) translateY(-2px) !important;
  animation-play-state: paused;
  box-shadow: 0 5px 14px rgba(21,128,61,0.25);
}
.alcance-item:nth-child(1) .alc-icon { animation-delay: 0s; }
.alcance-item:nth-child(2) .alc-icon { animation-delay: -0.7s; }
.alcance-item:nth-child(3) .alc-icon { animation-delay: -1.4s; }
.alcance-item:nth-child(4) .alc-icon { animation-delay: -2.1s; }
.alcance-item:nth-child(5) .alc-icon { animation-delay: -2.8s; }
.alcance-item:nth-child(6) .alc-icon { animation-delay: -3.5s; }
.alc-icon-no { background: #fee2e2; color: #dc2626; }

.objetivo-card { background: linear-gradient(135deg, var(--deep), #1a4a6e); border-radius: 14px; padding: 22px 24px; margin-top: 24px; }
.obj-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); margin-bottom: 10px; }
.objetivo-card p { font-size: 14px; color: rgba(255,255,255,0.88); line-height: 1.7; margin: 0; }

.obj-timeline-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 24px; }
.obj-items { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.obj-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow 0.2s, transform 0.2s; }
.obj-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); transform: translateY(-2px); }
.obj-num { font-size: 22px; font-weight: 800; color: #e0eaf2; letter-spacing: -0.03em; }
.obj-item p { font-size: 13px; color: #4b5563; line-height: 1.65; margin: 0; }

/* ── STACK ── */
.section-stack { background: #f8fafc; }
.stack-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-top: 32px; }
.tech-card { background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 22px 18px; text-align: center; transition: box-shadow 0.2s, transform 0.2s; }
.tech-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); transform: translateY(-3px); }
.tech-icon-wrap { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
.tech-icon-text { font-size: 13px; font-weight: 800; letter-spacing: 0.5px; }
.tech-name { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.tech-role { font-size: 12px; color: #9ca3af; }

/* ── EQUIPO ── */
.section-equipo { background: white; }
.team-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 40px; }
.team-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px 20px; text-align: center; transition: box-shadow 0.2s, transform 0.2s; }
.team-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08); transform: translateY(-3px); }
.team-avatar { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; margin: 0 auto 16px; }
.team-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 6px; }
.team-role { font-size: 12px; color: #9ca3af; }

/* ── CTA ── */
.section-cta { padding: 80px 32px; }
.cta-inner { max-width: 900px; margin: 0 auto; background: linear-gradient(145deg, var(--navy), #1a3550); border-radius: 28px; padding: 72px 64px; text-align: center; position: relative; overflow: hidden; }
.cta-threads { position: absolute; inset: 0; pointer-events: none; }
.cta-thread { position: absolute; width: 3px; border-radius: 999px; animation: threadGrow 3s ease-in-out infinite alternate; }
.cta-thread:nth-child(1) { height: 60%; left: 8%;  top: 10%; }
.cta-thread:nth-child(2) { height: 40%; left: 22%; top: 30%; }
.cta-thread:nth-child(3) { height: 70%; left: 78%; top: 5%;  }
.cta-thread:nth-child(4) { height: 45%; left: 88%; top: 25%; }
.cta-thread:nth-child(5) { height: 55%; left: 50%; top: 0%;  }
.cta-thread:nth-child(6) { height: 35%; left: 65%; top: 45%; }
@keyframes threadGrow { from { opacity: 0.15; transform: scaleY(0.8); } to { opacity: 0.35; transform: scaleY(1); } }
.cta-content { position: relative; z-index: 1; }
.cta-inner h2 { font-size: clamp(28px, 4vw, 44px); font-weight: 800; color: white; margin-bottom: 16px; line-height: 1.2; }
.cta-inner h2 .accent { color: #60b4f2; }
.cta-inner p { font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 36px; }
.btn-cta { display: inline-flex; align-items: center; gap: 10px; background: white; color: var(--deep); border-radius: 14px; padding: 16px 36px; font-size: 16px; font-weight: 700; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; }
.btn-cta:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(255,255,255,0.18); }

/* ── FOOTER ── */
.footer { position: relative; z-index: 1; background: var(--navy); padding: 28px 32px; }
.footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
.footer-brand { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.55); font-size: 13px; font-weight: 600; }
.footer-logo { width: 28px; filter: brightness(0) invert(0.4); }
.footer-copy { font-size: 12px; color: rgba(255,255,255,0.3); }

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .modules-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 960px) {
  .nosotros-grid, .role-content { grid-template-columns: 1fr; gap: 32px; }
  .stack-grid, .team-grid { grid-template-columns: repeat(2, 1fr); }
  .modules-grid { grid-template-columns: repeat(2, 1fr); }
  .obj-items { grid-template-columns: repeat(2, 1fr); }
  .nav-links { display: none; }
}
@media (max-width: 640px) {
  .hero-actions { flex-direction: column; align-items: center; }
  .hero-stats { flex-direction: column; gap: 20px; }
  .hero-stat-divider { width: 44px; height: 1px; }
  .stack-grid { grid-template-columns: repeat(2, 1fr); }
  .team-grid { grid-template-columns: repeat(2, 1fr); }
  .role-tabs { flex-wrap: wrap; }
  .cta-inner { padding: 48px 28px; }
  .obj-items { grid-template-columns: 1fr; }
}

/* ── PARTÍCULAS FLOTANTES ── */
.particle {
  position: absolute; border-radius: 50%;
  background: rgba(74,143,204,0.18);
  pointer-events: none;
}
.p1 { width: 6px;  height: 6px;  top: 18%; left: 12%;  animation: floatP 9s ease-in-out infinite; }
.p2 { width: 4px;  height: 4px;  top: 35%; left: 78%;  animation: floatP 12s ease-in-out infinite reverse; animation-delay: -3s; }
.p3 { width: 8px;  height: 8px;  top: 60%; left: 22%;  animation: floatP 14s ease-in-out infinite; animation-delay: -6s; }
.p4 { width: 5px;  height: 5px;  top: 75%; left: 65%;  animation: floatP 10s ease-in-out infinite reverse; animation-delay: -2s; }
.p5 { width: 10px; height: 10px; top: 25%; left: 90%;  animation: floatP 16s ease-in-out infinite; animation-delay: -8s; background: rgba(45,106,159,0.14); }
.p6 { width: 5px;  height: 5px;  top: 85%; left: 40%;  animation: floatP 11s ease-in-out infinite reverse; animation-delay: -4s; }
@keyframes floatP {
  0%,100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
  33%     { transform: translate(18px, -24px) scale(1.2); opacity: 1; }
  66%     { transform: translate(-12px, 16px) scale(0.85); opacity: 0.4; }
}

/* ── DIRECTIONAL REVEALS ── */
.reveal-left  { transform: translateX(-32px) !important; }
.reveal-right { transform: translateX(32px) !important; }
.reveal-left.is-visible,
.reveal-right.is-visible { transform: translateX(0) !important; }

/* ── STAT CARD HOVER LIFT ── */
.hero-stat { cursor: default; transition: transform 0.22s ease; }
.hero-stat:hover { transform: translateY(-4px); }
.hero-stat-num { transition: color 0.2s; }
.hero-stat:hover .hero-stat-num { color: #60b4f2; }

/* ── TECH CARD HOVER LIFT ── */
.tech-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
.tech-card:hover { transform: translateY(-6px); box-shadow: 0 12px 28px rgba(0,0,0,0.1); }

/* ── ALCANCE ITEM HOVER ── */
.alcance-item { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.alcance-si:hover { transform: translateX(4px); box-shadow: 0 4px 14px rgba(21,128,61,0.1); }

/* ── FEATURE CARD HOVER (nosotros) ── */
.prob-sol-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.prob-sol-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

/* ── SECTION LABEL GLOW ── */
.section-label-dot { animation: dotPulse 2.5s ease-in-out infinite; }

/* ── HERO TAG SHIMMER ── */
.hero-tag::after {
  content: ''; position: absolute; inset: 0; border-radius: 999px;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: tagShim 3s ease-in-out infinite;
}
@keyframes tagShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.hero-tag { position: relative; overflow: hidden; }

/* ── ICON FLOAT & HOVER SCALE ── */
@keyframes iconFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  30%       { transform: translateY(-4px) rotate(1deg); }
  60%       { transform: translateY(-2px) rotate(-0.5deg); }
  80%       { transform: translateY(-5px) rotate(0.8deg); }
}

/* Clase reutilizable de animación flotante para avatares e iconos */
.anim-icon {
  animation: iconFloat 4s ease-in-out infinite;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.team-card:hover .anim-icon,
.tech-card:hover .anim-icon {
  animation-play-state: paused;
  transform: scale(1.12) translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

/* ── OBJETIVOS ESPECÍFICOS ── */
.obj-item {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.2s, background 0.2s;
}
.obj-item.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.obj-item:hover {
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(31,58,82,0.1);
  transform: translateY(-3px) !important;
  border-color: #c7d9f0;
}
.obj-num {
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #c7dff0, #e0eaf2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}
</style>