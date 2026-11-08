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
    const usuario = btoa(JSON.stringify({ Id_Usuario: 1, Rol: 'admin' }))
    window.location.hash = `status=login&nonce=nonce-de-OTRO-navegador&token=abc&usuario=${usuario}`

    const { wrapper } = await montarVista(GoogleAuthCallback, { ruta: '/google-auth/callback' })
    expect(wrapper.text()).toContain('no se inició desde este navegador')
    expect(localStorage.getItem('jwt_token')).toBeNull()
  })

  test('acepta el inicio con Google cuando el nonce coincide', async () => {
    sessionStorage.setItem('google_oauth_nonce', 'nonce-ok')
    const usuario = btoa(JSON.stringify({ Id_Usuario: 1, Rol: 'admin' }))
    window.location.hash = `status=login&nonce=nonce-ok&token=jwt-google&usuario=${usuario}`

    const { wrapper } = await montarVista(GoogleAuthCallback, { ruta: '/google-auth/callback' })
    expect(wrapper.text()).toContain('Inicio con Google exitoso')
    expect(localStorage.getItem('jwt_token')).toBe('jwt-google')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-003 · Validar credenciales', () => {
  test('exige completar ambos campos antes de enviar', async () => {
    const { wrapper } = await montarVista(LoginView, { ruta: '/login' })
    await inputUsuario(wrapper).setValue('kevin')
    await wrapper.find('button.btn-login').trigger('click')

    expect(wrapper.find('.error-msg').text()).toBe('Por favor completa todos los campos.')
    expect(api.loginUsuario).not.toHaveBeenCalled()
  })

  test('muestra el mensaje de error cuando las credenciales son incorrectas', async () => {
    api.loginUsuario.mockRejectedValue(new Error('Credenciales incorrectas.'))
    const { wrapper } = await montarVista(LoginView, { ruta: '/login' })
    await inputUsuario(wrapper).setValue('kevin')
    await inputClave(wrapper).setValue('mala')
    await wrapper.find('button.btn-login').trigger('click')
    await flushPromises()

    expect(wrapper.find('.error-msg').text()).toBe('Credenciales incorrectas.')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-004 · Redirigir según rol', () => {
  test.each([
    ['superadmin', 90, '/superadmin/empresas'],
    ['admin', 1, '/admin/usuarios'],
    ['operario', 2, '/operario/cuenta'],
    ['cliente', 3, '/cliente/cuenta'],
  ])('un %s entra a su propio panel', async (rol, idRol, destino) => {
    api.loginUsuario.mockResolvedValue({ token: 't', usuario: { Id_Usuario: 1, Nombre_Completo: 'Prueba', Rol: rol, Id_Rol: idRol } })
    const { wrapper, router } = await montarVista(LoginView, { ruta: '/login' })
    await inputUsuario(wrapper).setValue('usuario')
    await inputClave(wrapper).setValue('Clave#2026')
    await wrapper.find('button.btn-login').trigger('click')
    await flushPromises()
    jest.advanceTimersByTime(700)            // la vista espera 600 ms antes de redirigir
    await flushPromises()

    expect(router.currentRoute.value.path).toBe(destino)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-005 · Controlar acceso por rol', () => {
  let router
  async function cargarRouterReal() {
    // se carga una copia nueva del router real (lee la sesión guardada al crearse el store)
    jest.isolateModules(() => {
      const pinia = require('pinia')
      pinia.setActivePinia(pinia.createPinia())
      router = require('../src/router/index.js').default
    })
  }
  function sesionComo(rol) {
    localStorage.setItem('jwt_token', 't')
    localStorage.setItem('usuario', JSON.stringify({ Id_Usuario: 1, Rol: rol }))
  }

  test('quien no tiene sesión es devuelto al login', async () => {
    await cargarRouterReal()
    await router.push('/admin/usuarios')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  test('un operario no puede abrir pantallas del administrador (vuelve a su panel)', async () => {
    sesionComo('operario')
    await cargarRouterReal()
    await router.push('/admin/inventario')
    expect(router.currentRoute.value.name).toBe('OperarioCuenta')
  })

  test('un administrador no puede abrir pantallas del superadmin (vuelve a su panel)', async () => {
    sesionComo('admin')
    await cargarRouterReal()
    await router.push('/superadmin/empresas')
    expect(router.currentRoute.value.name).toBe('AdminUsuarios')
  })

  test('cada rol sí puede abrir su propia pantalla', async () => {
    sesionComo('cliente')
    await cargarRouterReal()
    await router.push('/cliente/soporte')
    expect(router.currentRoute.value.name).toBe('ClienteSoporte')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-006 · Recuperar contraseña', () => {
  test('desde el login se solicita el enlace por correo', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    const { wrapper } = await montarVista(LoginView, { ruta: '/login' })
    await wrapper.find('button.forgot-link').trigger('click')
    wrapper.vm.recuperarEmail = 'kevin@demo.com'
    await wrapper.vm.enviarRecuperacion()

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/recuperar-contrasena', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ email: 'kevin@demo.com' }),
    }))
    expect(wrapper.vm.recuperarEnviado).toBe(true)
  })

  test('no envía la solicitud si el correo no tiene formato válido', async () => {
    global.fetch = jest.fn()
    const { wrapper } = await montarVista(LoginView, { ruta: '/login' })
    wrapper.vm.recuperarEmail = 'kevin-sin-arroba'
    await wrapper.vm.enviarRecuperacion()
    expect(wrapper.vm.recuperarError).toBe('El correo no tiene un formato válido.')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('valida el enlace antes de mostrar el formulario: enlace vencido = no hay formulario', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 })
    const { wrapper } = await montarVista(CambiarContrasena, { ruta: '/cambiar-contrasena?token=vencido' })
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/validar-token?token=vencido')
    expect(wrapper.vm.estado).toBe('invalido')
  })

  test('con un enlace válido muestra el formulario y exige contraseña segura (8+, mayúscula, número y especial)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    const { wrapper } = await montarVista(CambiarContrasena, { ruta: '/cambiar-contrasena?token=bueno' })
    expect(wrapper.vm.estado).toBe('formulario')

    for (const debil of ['Ab#1', 'texticode#2026', 'Texticode#', 'Texticode2026']) {
      wrapper.vm.nuevaPassword = debil
      wrapper.vm.confirmarPassword = debil
      expect(wrapper.vm.formValido).toBe(false)
    }
    wrapper.vm.nuevaPassword = 'Texticode#2026'
    wrapper.vm.confirmarPassword = 'Texticode#2026'
    expect(wrapper.vm.formValido).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-007 · Cerrar sesión', () => {
  async function montarMenu() {
    localStorage.setItem('jwt_token', 'jwt-123')
    localStorage.setItem('usuario', JSON.stringify({ Id_Usuario: 1, Nombre_Usuario: 'kevin', Rol: 'admin' }))
    return montarVista(AppSidebar, { ruta: '/admin/usuarios', props: { rol: 'admin' } })
  }

  test('pide confirmación y, si se acepta, borra la sesión y vuelve al login', async () => {
    const { wrapper, router } = await montarMenu()
    const { estado, responder } = useConfirmState()

    await wrapper.find('button.logout').trigger('click')
    expect(estado.abierto).toBe(true)
    expect(estado.titulo).toBe('¿Cerrar sesión?')

    responder(true)
    await flushPromises()
    expect(localStorage.getItem('jwt_token')).toBeNull()
    expect(localStorage.getItem('usuario')).toBeNull()
    expect(router.currentRoute.value.name).toBe('Login')
  })

  test('si se cancela la confirmación, la sesión sigue abierta', async () => {
    const { wrapper, router } = await montarMenu()
    const { responder } = useConfirmState()

    await wrapper.find('button.logout').trigger('click')
    responder(false)
    await flushPromises()
    expect(localStorage.getItem('jwt_token')).toBe('jwt-123')
    expect(router.currentRoute.value.path).toBe('/admin/usuarios')
  })
})
