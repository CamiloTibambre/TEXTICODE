<template>
  <div class="callback-page">
    <div class="callback-card">
      <div class="google-mark">G</div>
      <h1>{{ title }}</h1>
      <p>{{ detail }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const title = ref('Procesando Google OAuth...')
const detail = ref('Estamos validando tu cuenta y preparando tu sesión segura.')

function parseBase64UrlJson(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return JSON.parse(decodeURIComponent(escape(atob(padded))))
}

function getRuta(usuario) {
  const idRol = usuario?.Id_Rol
  const rol = (usuario?.Rol || usuario?.rol || '').toLowerCase()
  if (idRol === 1 || rol === 'administrador' || rol === 'admin') return '/admin/google-calendar'
  if (idRol === 2 || rol === 'operario') return '/operario/google-calendar'
  if (idRol === 3 || rol === 'cliente') return '/cliente/google-calendar'
  return '/login'
}

onMounted(() => {
  const status = route.query.status

  if (status === 'login') {
    try {
      const usuario = parseBase64UrlJson(route.query.usuario)
      const token = String(route.query.token || '')
      if (!token || !usuario?.Id_Usuario) throw new Error('Respuesta de autenticación incompleta.')
      const sessionUser = auth.guardarSesionGoogle(token, usuario)
      title.value = 'Inicio con Google exitoso'
      detail.value = 'Redirigiendo a tu panel con Google Calendar listo.'
      setTimeout(() => router.replace(getRuta(sessionUser)), 700)
    } catch (error) {
      title.value = 'No se pudo iniciar con Google'
      detail.value = error.message
      setTimeout(() => router.replace({ name: 'Login', query: { googleError: error.message } }), 1200)
    }
    return
  }

  if (status === 'linked') {
    title.value = 'Cuenta de Google vinculada'
    detail.value = 'Ya puedes sincronizar fechas de entrega con tu calendario personal.'
    setTimeout(() => router.replace(getRuta(auth.usuario)), 900)
    return
  }

  title.value = 'No se pudo completar Google OAuth'
  detail.value = 'Intenta nuevamente desde Texticode.'
  setTimeout(() => router.replace({ name: 'Login' }), 1200)
})
</script>

<style scoped>
.callback-page { min-height: 100vh; display: grid; place-items: center; background: linear-gradient(135deg, #0f172a, #1f3a52); padding: 24px; }
.callback-card { max-width: 430px; width: 100%; text-align: center; color: white; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); border-radius: 26px; padding: 36px; box-shadow: 0 28px 80px rgba(0,0,0,.32); backdrop-filter: blur(16px); }
.google-mark { width: 72px; height: 72px; border-radius: 22px; display: grid; place-items: center; margin: 0 auto 18px; background: white; color: #4285f4; font-size: 44px; font-weight: 900; animation: pulse 1.5s ease-in-out infinite alternate; }
h1 { font-size: 24px; margin: 0 0 10px; }
p { color: rgba(255,255,255,.78); line-height: 1.6; margin: 0; }
@keyframes pulse { to { transform: translateY(-6px) scale(1.03); box-shadow: 0 16px 36px rgba(66,133,244,.35); } }
</style>
