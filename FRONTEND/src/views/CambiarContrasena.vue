<template>
  <div class="login-page">

    <!-- ══ FONDO: tejido animado ══ -->
    <div class="bg-layer">
      <canvas ref="fabricCanvas" class="fabric-canvas"></canvas>

      <svg class="bg-lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2d6a9f" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#2d6a9f" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1f3a52" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#1f3a52" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path class="svgline l1" d="M-100,220 C300,120 700,380 1100,240 S1540,100 1640,280" fill="none" stroke="url(#lg1)" stroke-width="1.2"/>
        <path class="svgline l2" d="M-100,440 C350,320 680,540 1000,420 S1380,280 1640,460" fill="none" stroke="url(#lg1)" stroke-width="0.8"/>
        <path class="svgline l3" d="M1640,180 C1240,80 820,320 520,200 S120,60 -100,240" fill="none" stroke="url(#lg2)" stroke-width="1.2"/>
        <path class="svgline l4" d="M-100,680 C380,580 760,760 1060,660 S1400,540 1640,700" fill="none" stroke="url(#lg2)" stroke-width="0.7"/>
        <line x1="280" y1="0" x2="240" y2="900" stroke="#2d6a9f" stroke-opacity="0.06" stroke-width="0.8"/>
        <line x1="560" y1="0" x2="600" y2="900" stroke="#2d6a9f" stroke-opacity="0.04" stroke-width="0.8"/>
        <line x1="1000" y1="0" x2="960" y2="900" stroke="#2d6a9f" stroke-opacity="0.05" stroke-width="0.8"/>
        <line x1="1260" y1="0" x2="1300" y2="900" stroke="#2d6a9f" stroke-opacity="0.04" stroke-width="0.8"/>
      </svg>

      <div class="bg-gradient"></div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <!-- ══ CARD ══ -->
    <div class="login-card" :class="{ 'card-visible': cardVisible, 'card-error': shakeError }">

      <div class="card-top-border"></div>
      <div class="progress-bar" :class="{ active: cargando }">
        <div class="progress-fill"></div>
      </div>

      <!-- Logo -->
      <div class="logo-wrap" :class="{ visible: cardVisible }">
        <div class="logo-ring ring-outer">
          <span class="ring-spark spark-1"></span>
          <span class="ring-spark spark-2"></span>
        </div>
        <div class="logo-glow"></div>
        <img src="/img/LogoTexticode.png" alt="Texticode" class="logo-img">
      </div>

      <!-- ══ ESTADO: validando ══ -->
      <template v-if="estado === 'validando'">
        <h1 :class="{ visible: cardVisible }">Verificando enlace</h1>
        <p class="subtitle" :class="{ visible: cardVisible }">Un momento por favor...</p>
        <div class="form" :class="{ visible: cardVisible }">
          <div class="spinner-wrap">
            <svg class="spin" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
          </div>
        </div>
      </template>

      <!-- ══ ESTADO: inválido ══ -->
      <template v-else-if="estado === 'invalido'">
        <h1 :class="{ visible: cardVisible }">Enlace inválido</h1>
        <p class="subtitle" :class="{ visible: cardVisible }">Este enlace ya fue usado o expiró</p>
        <div class="form" :class="{ visible: cardVisible }">
          <div class="estado-icon-wrap error-icon">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
            </svg>
          </div>
          <p class="estado-desc">Solicita un nuevo enlace desde el login.</p>
          <button class="btn-login" @click="irAlLogin">
            <span class="btn-shimmer"></span>
            <span class="btn-text">
              Volver al login
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
              </svg>
            </span>
          </button>
        </div>
      </template>

      <!-- ══ ESTADO: formulario ══ -->
      <template v-else-if="estado === 'formulario'">
        <h1 :class="{ visible: cardVisible }">Nueva contraseña</h1>
        <p class="subtitle" :class="{ visible: cardVisible }">Ingresa y confirma tu nueva contraseña</p>

        <div class="form" :class="{ visible: cardVisible }">

          <div class="form-group" :class="{ focused: focusPass1 }">
            <label>Nueva contraseña</label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
              </svg>
              <input
                v-model="nuevaPassword"
                :type="verPass1 ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                @focus="focusPass1 = true"
                @blur="focusPass1 = false"
                @keyup.enter="cambiarPassword"
              />
              <button class="toggle-pass" @click="verPass1 = !verPass1" type="button" tabindex="-1">
                <svg v-if="!verPass1" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                </svg>
                <svg v-else fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
                </svg>
              </button>
            </div>
            <div class="strength-wrap" v-if="nuevaPassword">
              <div class="strength-bar">
                <div class="strength-fill" :class="fuerzaClase" :style="{ width: fuerzaPct + '%' }"></div>
              </div>
              <span class="strength-label" :class="fuerzaClase">{{ fuerzaTexto }}</span>
            </div>
            <div class="pass-hints" v-if="nuevaPassword">
              <span :class="nuevaPassword.length >= 8 ? 'hint-ok' : 'hint-no'">{{ nuevaPassword.length >= 8 ? '✓' : '✗' }} Mínimo 8 caracteres</span>
              <span :class="/[A-Z]/.test(nuevaPassword) ? 'hint-ok' : 'hint-no'">{{ /[A-Z]/.test(nuevaPassword) ? '✓' : '✗' }} Una mayúscula</span>
              <span :class="/[0-9]/.test(nuevaPassword) ? 'hint-ok' : 'hint-no'">{{ /[0-9]/.test(nuevaPassword) ? '✓' : '✗' }} Un número</span>
              <span :class="/[!@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/.test(nuevaPassword) ? 'hint-ok' : 'hint-no'">{{ /[!@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/.test(nuevaPassword) ? '✓' : '✗' }} Un carácter especial</span>
            </div>
          </div>

          <div class="form-group" :class="{ focused: focusPass2, 'has-error': confirmarPassword && nuevaPassword !== confirmarPassword }">
            <label>Confirmar contraseña</label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
              <input
                v-model="confirmarPassword"
                :type="verPass2 ? 'text' : 'password'"
                placeholder="Repite la contraseña"
                @focus="focusPass2 = true"
                @blur="focusPass2 = false"
                @keyup.enter="cambiarPassword"
              />
              <button class="toggle-pass" @click="verPass2 = !verPass2" type="button" tabindex="-1">
                <svg v-if="!verPass2" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                </svg>
                <svg v-else fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
                </svg>
              </button>
            </div>
            <Transition name="err">
              <div v-if="confirmarPassword && nuevaPassword !== confirmarPassword" class="error-msg" style="margin-top:8px;margin-bottom:0">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                </svg>
                Las contraseñas no coinciden
              </div>
            </Transition>
          </div>

          <Transition name="err">
            <div v-if="errorGeneral" class="error-msg">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
              </svg>
              {{ errorGeneral }}
            </div>
          </Transition>

          <button class="btn-login" @click="cambiarPassword" :disabled="cargando || !formValido" :class="{ loading: cargando }">
            <span class="btn-shimmer"></span>
            <span v-if="!cargando" class="btn-text">
              Cambiar contraseña
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
              </svg>
            </span>
            <span v-else class="btn-spinner">
              <svg class="spin" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              Actualizando...
            </span>
          </button>
        </div>
      </template>

      <!-- ══ ESTADO: éxito ══ -->
      <template v-else-if="estado === 'exito'">
        <h1 :class="{ visible: cardVisible }">¡Listo!</h1>
        <p class="subtitle" :class="{ visible: cardVisible }">Tu contraseña fue actualizada</p>
        <div class="form" :class="{ visible: cardVisible }">
          <div class="estado-icon-wrap success-icon">
            <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </div>
          <p class="estado-desc">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <button class="btn-login" @click="irAlLogin">
            <span class="btn-shimmer"></span>
            <span class="btn-text">
              Ir al login
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
              </svg>
            </span>
          </button>
        </div>
      </template>

      <p class="card-footer" :class="{ visible: cardVisible }">
        Texticode © 2026 · Sistema de gestión textil
      </p>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div class="toast success" v-if="toastMsg">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
        {{ toastMsg }}
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route  = useRoute()

const estado            = ref('validando')
const nuevaPassword     = ref('')
const confirmarPassword = ref('')
const verPass1          = ref(false)
const verPass2          = ref(false)
const focusPass1        = ref(false)
const focusPass2        = ref(false)
const cargando          = ref(false)
const errorGeneral      = ref('')
const cardVisible       = ref(false)
const shakeError        = ref(false)
const toastMsg          = ref('')
const fabricCanvas      = ref(null)
const token             = ref('')

let ctx, animFrame

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
  const spacing = 32
  const wave    = 3
  for (let x = 0; x < W + spacing; x += spacing) {
    ctx.beginPath()
    const alpha = x % (spacing * 2) === 0 ? 0.065 : 0.04
    ctx.strokeStyle = `rgba(45,106,159,${alpha})`
    ctx.lineWidth = 0.9
    for (let y = 0; y <= H; y += 3) {
      const offset = Math.sin((y / 40) + (x / 60) + t * 0.35) * wave
      y === 0 ? ctx.moveTo(x + offset, y) : ctx.lineTo(x + offset, y)
    }
    ctx.stroke()
  }
  for (let y = 0; y < H + spacing; y += spacing) {
    ctx.beginPath()
    const alpha = y % (spacing * 2) === 0 ? 0.045 : 0.025
    ctx.strokeStyle = `rgba(31,58,82,${alpha})`
    ctx.lineWidth = 0.75
    for (let x = 0; x <= W; x += 3) {
      const offset = Math.sin((x / 40) + (y / 60) + t * 0.28) * wave
      x === 0 ? ctx.moveTo(x, y + offset) : ctx.lineTo(x, y + offset)
    }
    ctx.stroke()
  }
  for (let x = 0; x < W + spacing; x += spacing) {
    for (let y = 0; y < H + spacing; y += spacing) {
      const pulse = Math.sin(t * 0.65 + x * 0.04 + y * 0.04) * 0.5 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, 1.0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(45,106,159,${0.04 + pulse * 0.08})`
      ctx.fill()
    }
  }
  animFrame = requestAnimationFrame(() => drawFabric(t + 0.011))
}

const fuerzaPct   = computed(() => {
  const p = nuevaPassword.value; if (!p) return 0
  let s = 0
  if (p.length >= 8)           s += 25
  if (p.length >= 12)          s += 15
  if (/[A-Z]/.test(p))        s += 20
  if (/[0-9]/.test(p))        s += 20
  if (/[^A-Za-z0-9]/.test(p)) s += 20
  return Math.min(s, 100)
})
const fuerzaClase = computed(() => fuerzaPct.value < 40 ? 'weak' : fuerzaPct.value < 70 ? 'medium' : 'strong')
const fuerzaTexto = computed(() => fuerzaPct.value < 40 ? 'Débil' : fuerzaPct.value < 70 ? 'Media' : 'Fuerte')
const formValido = computed(() => {
  const p = nuevaPassword.value
  return p.length >= 8 &&
    /[A-Z]/.test(p) &&
    /[0-9]/.test(p) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) &&
    p === confirmarPassword.value
})

function triggerShake() {
  shakeError.value = true
  setTimeout(() => shakeError.value = false, 500)
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => toastMsg.value = '', 3000)
}

function irAlLogin() { router.push('/login') }

onMounted(async () => {
  initFabric()
  window.addEventListener('resize', initFabric)
  setTimeout(() => cardVisible.value = true, 80)

  token.value = route.query.token || ''
  if (!token.value) { estado.value = 'invalido'; return }

  try {
    const res = await fetch(`/api/auth/validar-token?token=${token.value}`)
    estado.value = res.ok ? 'formulario' : 'invalido'
  } catch {
    estado.value = 'formulario'
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', initFabric)
})

async function cambiarPassword() {
  if (!formValido.value) { triggerShake(); return }
  cargando.value = true; errorGeneral.value = ''
  try {
    const res  = await fetch('/api/auth/cambiar-contrasena', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value, nuevaPassword: nuevaPassword.value })
    })
    const data = await res.json()
    if (res.ok) { estado.value = 'exito'; showToast('¡Contraseña actualizada correctamente!') }
    else        { errorGeneral.value = data.mensaje || 'Error al cambiar la contraseña.'; triggerShake() }
  } catch {
    errorGeneral.value = 'Error de conexión. Intenta de nuevo.'; triggerShake()
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; background: #060f17;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.bg-layer { position: absolute; inset: 0; z-index: 0; }
.fabric-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.bg-lines { position: absolute; inset: 0; width: 100%; height: 100%; }
.svgline { stroke-dasharray: 800; stroke-dashoffset: 800; animation: drawline 3s ease forwards; }
.l1{animation-delay:0.1s} .l2{animation-delay:0.3s} .l3{animation-delay:0.5s} .l4{animation-delay:0.7s}
@keyframes drawline { to { stroke-dashoffset: 0; } }
.bg-gradient {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 50% at 20% 50%, rgba(45,106,159,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 40% 60% at 80% 30%, rgba(31,58,82,0.25) 0%, transparent 60%);
}
.orb { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
.orb-1 { width:500px;height:500px;background:radial-gradient(circle,rgba(45,106,159,0.22) 0%,transparent 65%);top:-150px;left:-100px;animation:floatorb 12s ease-in-out infinite alternate; }
.orb-2 { width:380px;height:380px;background:radial-gradient(circle,rgba(31,58,82,0.3) 0%,transparent 65%);bottom:-100px;right:-80px;animation:floatorb 9s ease-in-out infinite alternate-reverse; }
.orb-3 { width:280px;height:280px;background:radial-gradient(circle,rgba(29,78,120,0.15) 0%,transparent 65%);top:50%;right:30%;animation:floatorb 15s ease-in-out infinite alternate;animation-delay:-5s; }
@keyframes floatorb { from{transform:translate(0,0) scale(1)} to{transform:translate(22px,-28px) scale(1.08)} }

.login-card {
  position:relative;z-index:1;background:rgba(255,255,255,0.98);border-radius:20px;
  padding:36px 34px 28px;width:100%;max-width:396px;
  box-shadow:0 24px 64px rgba(0,0,0,0.45),0 1px 0 rgba(255,255,255,0.08),0 0 0 1px rgba(45,106,159,0.08);
  opacity:0;transform:translateY(20px) scale(0.98);
  transition:opacity 0.5s cubic-bezier(0.4,0,0.2,1),transform 0.5s cubic-bezier(0.4,0,0.2,1);
}
.login-card.card-visible { opacity:1;transform:translateY(0) scale(1); }
.login-card.card-error   { animation:shake 0.42s ease; }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }

.card-top-border {
  position:absolute;top:0;left:0;right:0;height:3px;border-radius:20px 20px 0 0;
  background:linear-gradient(90deg,#1f3a52,#2d6a9f,#4a8fcc,#2d6a9f,#1f3a52);
  background-size:300% 100%;animation:bordermove 4s linear infinite;
}
@keyframes bordermove { 0%{background-position:0% 0} 100%{background-position:300% 0} }

.progress-bar { position:absolute;top:3px;left:0;right:0;height:2px;overflow:hidden; }
.progress-fill { height:100%;width:0%;background:linear-gradient(90deg,#1f3a52,#2d6a9f,#1f3a52);background-size:200%;border-radius:99px;transition:width 1.1s cubic-bezier(0.4,0,0.2,1); }
.progress-bar.active .progress-fill { width:85%;animation:shimbar 1.2s linear infinite; }
@keyframes shimbar { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

.logo-wrap {
  text-align:center;margin-bottom:18px;position:relative;height:148px;
  display:flex;align-items:center;justify-content:center;
  opacity:0;transform:translateY(-8px);transition:opacity 0.4s ease 0.1s,transform 0.4s ease 0.1s;
}
.logo-wrap.visible { opacity:1;transform:none; }
.logo-ring { position:absolute;top:50%;left:50%;border-radius:50%;border:1px solid transparent;pointer-events:none; }
.ring-outer { width:144px;height:144px;margin-left:-72px;margin-top:-72px;border-color:rgba(45,106,159,0.1);border-top-color:rgba(45,106,159,0.35);animation:spinring 6s linear infinite; }
@keyframes spinring { to{transform:rotate(360deg)} }
.ring-spark { position:absolute;top:50%;left:50%;width:4px;height:4px;border-radius:50%;background:rgba(45,106,159,0.8);box-shadow:0 0 4px 1px rgba(45,106,159,0.4);transform-origin:0 0;animation:orbitspark 6s linear infinite; }
.spark-1{animation-delay:0s} .spark-2{animation-delay:-3s}
@keyframes orbitspark { 0%{transform:rotate(0deg) translateX(69px) translateX(-2px);opacity:0.8} 30%{opacity:0.3} 60%{opacity:0.7} 100%{transform:rotate(360deg) translateX(69px) translateX(-2px);opacity:0.8} }
.logo-glow { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100px;height:44px;background:radial-gradient(ellipse,rgba(45,106,159,0.12) 0%,transparent 70%);filter:blur(10px);animation:logoglowpulse 4s ease-in-out infinite;z-index:1; }
@keyframes logoglowpulse { 0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.9;transform:translate(-50%,-50%) scale(1.15)} }
.logo-img { width:124px;position:relative;z-index:2; }

h1 { font-size:21px;font-weight:700;color:#0d1f2d;letter-spacing:-0.03em;text-align:center;margin-bottom:5px;opacity:0;transform:translateY(6px);transition:opacity 0.4s ease 0.18s,transform 0.4s ease 0.18s; }
h1.visible { opacity:1;transform:none; }
.subtitle { font-size:13px;color:#6b7280;text-align:center;margin-bottom:26px;opacity:0;transform:translateY(5px);transition:opacity 0.4s ease 0.26s,transform 0.4s ease 0.26s; }
.subtitle.visible { opacity:1;transform:none; }

.form { opacity:0;transform:translateY(8px);transition:opacity 0.4s ease 0.33s,transform 0.4s ease 0.33s; }
.form.visible { opacity:1;transform:none; }

.form-group { margin-bottom:15px; }
.form-group label { display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px;transition:color 0.2s; }
.form-group.focused label { color:#1f3a52; }
.form-group.has-error label { color:#dc2626; }

.input-wrap { display:flex;align-items:center;border:1.5px solid #e5e7eb;border-radius:10px;background:#f9fafb;transition:border-color 0.2s,box-shadow 0.2s,background 0.2s; }
.form-group.focused .input-wrap { border-color:#1f3a52;background:white;box-shadow:0 0 0 3px rgba(31,58,82,0.1); }
.form-group.has-error .input-wrap { border-color:#f87171;box-shadow:0 0 0 3px rgba(248,113,113,0.1); }

.input-icon { width:16px;height:16px;color:#9ca3af;margin-left:13px;flex-shrink:0;transition:color 0.2s; }
.form-group.focused .input-icon { color:#1f3a52; }

.input-wrap input { flex:1;padding:12px 10px 12px 9px;border:none;outline:none;background:transparent;font-size:14px;color:#111827;font-family:inherit; }
.input-wrap input::placeholder { color:#c4c9d4; }

.toggle-pass { background:none;border:none;cursor:pointer;padding:0 13px;color:#9ca3af;display:flex;align-items:center;transition:color 0.15s; }
.toggle-pass:hover { color:#374151; }

.strength-wrap { display:flex;align-items:center;gap:8px;margin-top:7px; }
.strength-bar { flex:1;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden; }
.strength-fill { height:100%;border-radius:2px;transition:width 0.3s,background 0.3s; }
.strength-fill.weak   { background:#ef4444; }
.strength-fill.medium { background:#f59e0b; }
.strength-fill.strong { background:#22c55e; }
.strength-label { font-size:11.5px;font-weight:600; }
.strength-label.weak   { color:#ef4444; }
.strength-label.medium { color:#f59e0b; }
.strength-label.strong { color:#22c55e; }
.pass-hints { display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:8px; }
.pass-hints span { font-size:11.5px;font-weight:500; }
.hint-ok { color:#16a34a; }
.hint-no { color:#9ca3af; }

.error-msg { display:flex;align-items:center;gap:6px;color:#dc2626;font-size:12.5px;font-weight:500;margin-bottom:13px;padding:9px 12px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca; }
.err-enter-active { transition:all 0.22s ease; }
.err-leave-active { transition:all 0.18s ease; }
.err-enter-from,.err-leave-to { opacity:0;transform:translateY(-4px); }

.btn-login { width:100%;padding:13px;margin-top:4px;background:linear-gradient(135deg,#1f3a52 0%,#2d5478 100%);color:white;border:none;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;transition:all 0.22s;position:relative;overflow:hidden; }
.btn-shimmer { position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.09) 50%,transparent 65%);background-size:200% 100%;animation:btnshim 2.8s ease infinite; }
@keyframes btnshim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.btn-login:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 8px 24px rgba(31,58,82,0.4);background:linear-gradient(135deg,#264a67 0%,#336289 100%); }
.btn-login:active:not(:disabled) { transform:translateY(0); }
.btn-login:disabled { opacity:0.7;cursor:not-allowed; }
.btn-text,.btn-spinner { display:flex;align-items:center;justify-content:center;gap:8px;position:relative; }

.spinner-wrap { display:flex;justify-content:center;padding:24px 0;color:#2d6a9f; }
.estado-icon-wrap { display:flex;justify-content:center;margin-bottom:12px; }
.success-icon { color:#2d6a9f;animation:popIn 0.4s cubic-bezier(0.22,1,0.36,1); }
.error-icon   { color:#dc2626;animation:popIn 0.4s cubic-bezier(0.22,1,0.36,1); }
@keyframes popIn { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
.estado-desc { text-align:center;font-size:13px;color:#6b7280;margin-bottom:18px;line-height:1.55; }

.card-footer { text-align:center;font-size:11px;color:#c4c9d4;margin-top:14px;opacity:0;transition:opacity 0.4s ease 0.62s; }
.card-footer.visible { opacity:1; }

@keyframes spin { to{transform:rotate(360deg)} }
.spin { animation:spin 0.72s linear infinite; }

.toast { position:fixed;bottom:28px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:11px 20px;border-radius:99px;font-size:13px;font-weight:600;color:white;background:#1f3a52;border:1px solid rgba(45,106,159,0.4);box-shadow:0 8px 28px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.05);backdrop-filter:blur(10px);z-index:100;white-space:nowrap; }
.toast.success { background:linear-gradient(135deg,#1f3a52,#2d6a9f); }
.toast-enter-active { transition:all 0.3s cubic-bezier(0.22,1,0.36,1); }
.toast-leave-active { transition:all 0.25s ease; }
.toast-enter-from   { opacity:0;transform:translateX(-50%) translateY(12px); }
.toast-leave-to     { opacity:0;transform:translateX(-50%) translateY(4px); }
</style>