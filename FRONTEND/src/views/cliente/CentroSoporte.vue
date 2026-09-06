<template>
  <div style="display:flex;min-height:100vh;background:#f1f5f9;position:relative;overflow:hidden">
    <AppSidebar rol="cliente" />

    <!-- FONDO DECORATIVO -->
    <div class="bg-orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>

    <main class="main">

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': mounted }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span
                v-for="(ch, i) in 'Centro de Soporte'"
                :key="i"
                class="title-char"
                :style="{ animationDelay: mounted ? `${i * 35}ms` : '9999s' }"
              >{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Contáctanos y resuelve tus dudas fácilmente.</p>
          </div>
        </div>
      </div>

      <!-- CANALES + FAQs -->
      <section class="contact-section">

        <!-- CANALES -->
        <article
          class="info-card"
          :class="{ 'card-visible': mounted }"
          style="transition-delay: 200ms"
        >
          <div class="table-header-bar">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
            </svg>
            Canales de atención
          </div>
          <div class="card-inner">
            <div class="contact-list">

              <a class="contact-link" href="tel:+5744445555"
                :class="{ 'link-in': mounted }"
                style="animation-delay: 300ms">
                <div class="contact-row">
                  <span class="icon" style="background:#eff6ff;color:#2563eb">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.79 14.8 16.37 14.67 16.85 14.86C18.06 15.34 19.4 15.6 20.75 15.6C21.44 15.6 22 16.16 22 16.85V20.75C22 21.44 21.44 22 20.75 22C10.92 22 2 13.08 2 3.25C2 2.56 2.56 2 3.25 2H7.15C7.84 2 8.4 2.56 8.4 3.25C8.4 4.6 8.66 5.94 9.14 7.15C9.33 7.63 9.2 8.21 8.82 8.59L6.62 10.79Z"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Teléfono</strong>
                    <span class="val">+57 (4) 444-5555</span>
                  </div>
                </div>
              </a>

              <a class="contact-link" href="https://wa.me/573001234567" target="_blank"
                :class="{ 'link-in': mounted }"
                style="animation-delay: 380ms">
                <div class="contact-row">
                  <span class="icon" style="background:#f0fdf4;color:#16a34a">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </span>
                  <div>
                    <strong>WhatsApp</strong>
                    <span class="val">+57 300 123 4567</span>
                  </div>
                </div>
              </a>

              <a class="contact-link" href="mailto:soporte@texticode.com"
                :class="{ 'link-in': mounted }"
                style="animation-delay: 460ms">
                <div class="contact-row">
                  <span class="icon" style="background:#fdf4ff;color:#7c3aed">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 5H21C21.5523 5 22 5.44772 22 6V18C22 18.5523 21.5523 19 21 19H3C2.44772 19 2 18.5523 2 18V6C2 5.44772 2.44772 5 3 5Z" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M22 6L12 13L2 6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Email</strong>
                    <span class="val">soporte@texticode.com</span>
                  </div>
                </div>
              </a>

              <div class="contact-link static"
                :class="{ 'link-in': mounted }"
                style="animation-delay: 540ms">
                <div class="contact-row">
                  <span class="icon" style="background:#fefce8;color:#b45309">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6V12L16 14" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Horario</strong>
                    <span class="val">Lunes a viernes · 8:00 AM - 6:00 PM</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </article>

        <!-- FAQ -->
        <article
          class="info-card"
          :class="{ 'card-visible': mounted }"
          style="transition-delay: 350ms"
        >
          <div class="table-header-bar">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/>
            </svg>
            Preguntas frecuentes
          </div>
          <div class="card-inner">
            <div class="faq-list">
              <div
                v-for="(faq, i) in faqs"
                :key="faq.id"
                class="faq-item"
                :class="{ 'faq-in': mounted }"
                :style="{ animationDelay: mounted ? `${420 + i * 65}ms` : '9999s' }"
              >
                <div class="faq-question">{{ faq.pregunta }}</div>
                <div class="faq-answer">{{ faq.respuesta }}</div>
              </div>
            </div>
          </div>
        </article>

      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'

const mounted = ref(false)

onMounted(() => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    mounted.value = true
  }))
})

const faqs = [
  { id: 1, pregunta: '¿Cómo puedo rastrear mi pedido?', respuesta: 'Ve a tu cuenta personal o a la sección de pedidos para revisar el estado actualizado.' },
  { id: 2, pregunta: '¿Dónde descargo mis comprobantes?', respuesta: 'Los comprobantes aparecen cuando el administrador marca tu orden como completada.' },
  { id: 3, pregunta: '¿Qué hago si necesito un cambio?', respuesta: 'Contáctanos por WhatsApp o correo y menciona tu número de orden.' },
  { id: 4, pregunta: '¿Por qué no veo comprobantes todavía?', respuesta: 'Se generan cuando la orden es completada.' },
  { id: 5, pregunta: '¿Cómo veo el progreso?', respuesta: 'En "Pedidos y Entregas" verás el estado en tiempo real.' },
  { id: 6, pregunta: '¿Cuándo se genera mi comprobante?', respuesta: 'Al crear tu orden y se descarga cuando esté entregada.' },
  { id: 7, pregunta: '¿Puedo actualizar mis datos?', respuesta: 'Sí, desde "Cuenta Personal".' },
  { id: 8, pregunta: '¿Qué significa orden retrasada?', respuesta: 'Que la orden superó su fecha límite de entrega y está en seguimiento prioritario para completarse lo antes posible.' },
]
</script>

<style scoped>
/* ── FONDO DECORATIVO ── */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: #2563eb; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #16a34a; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

.main { flex: 1; padding: 28px 30px; overflow-y: auto; position: relative; z-index: 1; }

/* ── HERO ── */
.page-hero { display: flex; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }
.hero-left { display: flex; align-items: center; gap: 16px; }
.hero-text { display: flex; flex-direction: column; }
.hero-icon-wrap { position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: #1f3a52; border-radius: 14px; flex-shrink: 0; }
.hero-icon { width: 26px; height: 26px; color: white; }
.hero-icon-ring { position: absolute; border-radius: 50%; border: 1.5px solid #1f3a52; opacity: 0; animation: iconPulse 3s ease-out infinite; }
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 86px; height: 86px; animation-delay: 0.8s; }
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
.hero-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; opacity: 0; transform: translateY(12px); animation: charReveal 0.4s ease forwards; }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0 0; }

/* ── CARDS ── */
.contact-section { display: grid; gap: 18px; }
.info-card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
.info-card.card-visible { opacity: 1; transform: translateY(0); }

.table-header-bar { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-bar svg { color: #1f3a52; flex-shrink: 0; }
.card-inner { padding: 20px; }

/* ── CONTACTOS ── */
.contact-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

.contact-link { text-decoration: none; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; color: #0f172a; display: block; opacity: 0; transform: translateY(10px); animation: itemReveal 0.4s ease both; transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s; }
.contact-link.link-in { animation-play-state: running; }
.contact-link:not(.static):hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: #c7d9f0; }
.contact-link.static { cursor: default; }
@keyframes itemReveal { to { opacity: 1; transform: translateY(0); } }

.contact-row { display: flex; align-items: center; gap: 12px; }
.contact-row .icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.contact-row strong { display: block; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
.contact-row .val { display: block; font-size: 12px; color: #64748b; }

/* ── FAQ ── */
.faq-list { display: flex; flex-direction: column; gap: 10px; }
.faq-item { padding: 14px 16px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; opacity: 0; transform: translateX(-10px); animation: faqReveal 0.4s ease both; transition: background 0.2s, border-color 0.2s, transform 0.15s; }
.faq-item:hover { background: #fff; border-color: #c7d9f0; transform: translateX(2px); }
@keyframes faqReveal { to { opacity: 1; transform: translateX(0); } }
.faq-question { font-weight: 700; font-size: 14px; margin-bottom: 5px; color: #0f172a; display: flex; align-items: center; gap: 8px; }
.faq-question::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #1f3a52; flex-shrink: 0; }
.faq-answer { color: #475569; font-size: 13px; line-height: 1.6; padding-left: 14px; }

@media (max-width: 800px) {
  .main { padding: 20px 16px; }
  .contact-list { grid-template-columns: 1fr; }
}
</style>