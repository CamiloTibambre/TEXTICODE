// ═══════════════════════════════════════════════════════════════
// MÓDULO 1 · AUTENTICACIÓN (RF-001 a RF-007) — pruebas del FRONTEND
// Se monta cada vista Vue en un navegador simulado (jsdom).
// ═══════════════════════════════════════════════════════════════
import { montarVista, flushPromises } from './helpers/montar.js'
import { useConfirmState } from '../src/composables/useConfirm.js'
import * as api from '../src/services/api.js'
import LoginView from '../src/views/LoginView.vue'
import CambiarContrasena from '../src/views/CambiarContrasena.vue'
import GoogleAuthCallback from '../src/views/GoogleAuthCallback.vue'
import AppSidebar from '../src/components/AppSidebar.vue'

jest.mock('../src/services/api.js', () => ({
  loginUsuario: jest.fn(),
  getGoogleAuthUrl: jest.fn(),
}))

beforeEach(() => {
  jest.useFakeTimers()
  localStorage.clear()
  sessionStorage.clear()
  document.body.innerHTML = ''
  jest.clearAllMocks()
})
afterEach(() => jest.useRealTimers())

const inputUsuario = w => w.find('input[placeholder="Tu nombre de usuario"]')
const inputClave = w => w.find('input[placeholder="••••••••"]')

// ─────────────────────────────────────────────────────────────
describe('RF-001 · Iniciar sesión', () => {
  test('el campo de contraseña se puede mostrar y ocultar', async () => {
    const { wrapper } = await montarVista(LoginView, { ruta: '/login' })
    const boton = wrapper.find('button.toggle-pass')

    expect(inputClave(wrapper).attributes('type')).toBe('password')
    await boton.trigger('click')
    expect(inputClave(wrapper).attributes('type')).toBe('text')
    expect(boton.attributes('aria-label')).toBe('Ocultar contraseña')
    await boton.trigger('click')
    expect(inputClave(wrapper).attributes('type')).toBe('password')
  })

  test('envía el nombre de usuario y la contraseña escritos y guarda la sesión', async () => {
    api.loginUsuario.mockResolvedValue({ token: 'jwt-123', usuario: { Id_Usuario: 1, Nombre_Completo: 'Kevin Wagner', Rol: 'admin', Id_Rol: 1 } })
    const { wrapper } = await montarVista(LoginView, { ruta: '/login' })

    await inputUsuario(wrapper).setValue('kevin')
    await inputClave(wrapper).setValue('Texticode#2026')
    await wrapper.find('button.btn-login').trigger('click')
    await flushPromises()

    expect(api.loginUsuario).toHaveBeenCalledWith({ correo: 'kevin', contrasena: 'Texticode#2026' })
    expect(localStorage.getItem('jwt_token')).toBe('jwt-123')
  })

  test('quita los espacios sobrantes del nombre de usuario antes de enviarlo', async () => {
    api.loginUsuario.mockResolvedValue({ token: 't', usuario: { Id_Usuario: 1, Rol: 'admin', Id_Rol: 1 } })
    const { wrapper } = await montarVista(LoginView, { ruta: '/login' })

    await inputUsuario(wrapper).setValue(' kevin ')
    await inputClave(wrapper).setValue('Texticode#2026')
    await wrapper.find('button.btn-login').trigger('click')
    await flushPromises()

    expect(api.loginUsuario).toHaveBeenCalledWith({ correo: 'kevin', contrasena: 'Texticode#2026' })
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-002 · Iniciar sesión con Google', () => {
  test('al pulsar "Google" guarda un nonce en este navegador y lo envía al pedir la URL', async () => {
    api.getGoogleAuthUrl.mockResolvedValue({ url: '#google' })
    const { wrapper } = await montarVista(LoginView, { ruta: '/login' })

    await wrapper.find('button.btn-google').trigger('click')
    await flushPromises()

    const nonce = sessionStorage.getItem('google_oauth_nonce')
    expect(nonce).toMatch(/^[a-f0-9]{48}$/)
    expect(api.getGoogleAuthUrl).toHaveBeenCalledWith('login', nonce)
  })

  test('rechaza un inicio con Google que no se originó en este mismo navegador', async () => {
    sessionStorage.setItem('google_oauth_nonce', 'nonce-de-este-navegador')
    const usuario = btoa(JSON.stringify({