import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Login from '../src/views/LoginView.vue'
import Callback from '../src/views/GoogleAuthCallback.vue'
import Cambiar from '../src/views/CambiarContrasena.vue'
import Sidebar from '../src/components/AppSidebar.vue'
import { montar, flushPromises, respuesta } from './helpers/montar'
import { loginUsuario, getGoogleAuthUrl } from '../src/services/api'
import { useAuthStore } from '../src/stores/auth'
import router from '../src/router'

const mockPush = jest.fn()
const mockReplace = jest.fn()
let mockQuery = {}
jest.mock('vue-router', () => ({
  ...jest.requireActual('vue-router'),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useRoute: () => ({ query: mockQuery, path: '/login' }),
}))
jest.mock('../src/services/api', () => ({ loginUsuario: jest.fn(), getGoogleAuthUrl: jest.fn() }))
let wrapper
beforeEach(() => { mockQuery = {}; mockPush.mockReset(); mockReplace.mockReset(); loginUsuario.mockReset(); getGoogleAuthUrl.mockReset() })
afterEach(() => { wrapper?.unmount(); wrapper = undefined })
function login() { const r = montar(Login, { rol: null }); wrapper = r.wrapper; return r }
test('RF-001 permite mostrar y ocultar la contraseña', async () => {
  login()
  expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  wrapper.vm.showPass = true
  await wrapper.vm.$nextTick()
  expect(wrapper.find('input[type="password"]').exists()).toBe(false)
  wrapper.vm.showPass = false
  await wrapper.vm.$nextTick()
  expect(wrapper.find('input[type="password"]').exists()).toBe(true)
})
test('RF-001 envía las credenciales escritas y persiste la sesión', async () => {
  const { auth } = login()
  loginUsuario.mockResolvedValue({ token: 'jwt-prueba', usuario: { Id_Usuario: 2, Id_Rol: 2, Rol: 'Operario' } })
  wrapper.vm.email = ' operario '
  wrapper.vm.password = 'Texticode2026!'
  await wrapper.vm.iniciarSesion()
  expect(loginUsuario).toHaveBeenCalledWith({ correo: 'operario', contrasena: 'Texticode2026!' })
  expect(auth.token).toBe('jwt-prueba')
  expect(localStorage.getItem('jwt_token')).toBe('jwt-prueba')
})
test('RF-002 guarda nonce del navegador al iniciar con Google', async () => {
  login()
  // Devuelve URL relativa para que jsdom no navegue a un servicio externo.
  getGoogleAuthUrl.mockResolvedValue({ url: '#oauth-prueba' })
  await wrapper.vm.iniciarSesionGoogle()
  const nonce = sessionStorage.getItem('google_oauth_nonce')
  expect(nonce).toMatch(/^[a-f0-9]{48}$/)
  expect(getGoogleAuthUrl).toHaveBeenCalledWith('login', nonce)
})
test.each([true, false])('RF-002 acepta callback solo si coincide nonce %s', async coincide => {
  sessionStorage.setItem('google_oauth_nonce', 'nonce-local')
  const usuario = btoa(JSON.stringify({ Id_Usuario: 2, Id_Rol: 2, Rol: 'Operario' }))
  history.replaceState(null, '', `/#status=login&nonce=${coincide ? 'nonce-local' : 'otro'}&token=jwt-prueba&usuario=${encodeURIComponent(usuario)}`)
  const r = montar(Callback, { rol: null }); wrapper = r.wrapper
  await flushPromises()
  expect(r.auth.estaLogueado).toBe(coincide)
  expect(sessionStorage.getItem('google_oauth_nonce')).toBeNull()
  expect(wrapper.text()).toContain(coincide ? 'Inicio con Google exitoso' : 'no se inició desde este navegador')
})
test('RF-003 exige ambos campos antes de llamar a la API', async () => {
  login()
  await wrapper.vm.iniciarSesion()
  expect(wrapper.text()).toContain('completa todos los campos')
  expect(loginUsuario).not.toHaveBeenCalled()
})
test('RF-003 muestra el error de credenciales de la API', async () => {
  login()
  wrapper.vm.email = 'operario'; wrapper.vm.password = 'incorrecta'
  loginUsuario.mockRejectedValue(new Error('Credenciales incorrectas.'))
  await wrapper.vm.iniciarSesion()
  expect(wrapper.text()).toContain('Credenciales incorrectas.')
})
test.each([
  ['superadmin', 4, '/superadmin/empresas'], ['Administrador', 1, '/admin/usuarios'],
  ['Operario', 2, '/operario/cuenta'], ['Cliente', 3, '/cliente/cuenta'],
])('RF-004 redirige %s a su panel', async (Rol, Id_Rol, ruta) => {
  login(); wrapper.vm.email = 'usuario'; wrapper.vm.password = 'Texticode2026!'
  loginUsuario.mockResolvedValue({ token: 'jwt-prueba', usuario: { Id_Usuario: 2, Id_Rol, Rol } })
  await wrapper.vm.iniciarSesion()
  jest.advanceTimersByTime(650)
  expect(mockPush).toHaveBeenCalledWith(ruta)
})
test('RF-005 devuelve al login a quien no tiene sesión', async () => {
  setActivePinia(createPinia())
  await router.push('/operario/tareas')
  expect(router.currentRoute.value.name).toBe('Login')
})
test('RF-005 un operario no accede al panel administrador', async () => {
  setActivePinia(createPinia())
  useAuthStore().guardarSesionGoogle('falso', { Id_Usuario: 2, Rol: 'Operario' })
  await router.push('/admin/usuarios')
  expect(router.currentRoute.value.name).toBe('Login')
  expect(useAuthStore().estaLogueado).toBe(true)
})
test('RF-005 un operario accede a sus tareas', async () => {
  setActivePinia(createPinia())
  useAuthStore().guardarSesionGoogle('falso', { Id_Usuario: 2, Rol: 'Operario' })
  await router.push('/operario/tareas')
  expect(router.currentRoute.value.name).toBe('OperarioTareas')
})
test('RF-006 rechaza correo mal formado antes de solicitar recuperación', async () => {
  login(); wrapper.vm.recuperarEmail = 'incorrecto'
  await wrapper.vm.enviarRecuperacion()
  expect(wrapper.vm.recuperarError).toContain('formato válido')
  expect(fetch).not.toHaveBeenCalled()
})
test('RF-006 solicita enlace de recuperación y muestra confirmación', async () => {
  login(); wrapper.vm.recuperarEmail = 'usuario@example.test'
  fetch.mockResolvedValue(respuesta({ mensaje: 'Enviado' }))
  await wrapper.vm.enviarRecuperacion()
  expect(wrapper.vm.recuperarEnviado).toBe(true)
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: 'usuario@example.test' })
})
test('RF-006 enlace vencido impide mostrar el formulario de cambio', async () => {
  mockQuery = { token: 'vencido' }
  fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ mensaje: 'Token inválido o expirado' }) })
  wrapper = montar(Cambiar, { rol: null }).wrapper
  await flushPromises()
  expect(wrapper.find('form').exists()).toBe(false)
})
test('RF-006 enlace válido exige contraseña segura y confirmación coincidente', async () => {
  mockQuery = { token: 'vigente' }
  fetch.mockResolvedValue(respuesta({ valido: true }))
  wrapper = montar(Cambiar, { rol: null }).wrapper
  await flushPromises()
  expect(wrapper.vm.estado).toBe('formulario')
  for (const clave of ['Ab#1', 'texticode#2026', 'Texticode#', 'Texticode2026']) {
    wrapper.vm.nuevaPassword = clave; wrapper.vm.confirmarPassword = clave
    expect(wrapper.vm.formValido).toBe(false)
  }
  wrapper.vm.nuevaPassword = 'Texticode2026!'; wrapper.vm.confirmarPassword = 'diferente'
  expect(wrapper.vm.formValido).toBe(false)
  wrapper.vm.confirmarPassword = 'Texticode2026!'
  expect(wrapper.vm.formValido).toBe(true)
})
test.each([true, false])('RF-007 confirmación de cierre aceptada %s', async acepta => {
  const r = montar(Sidebar, { props: { rol: 'operario' } }); wrapper = r.wrapper
  await wrapper.find('.logout').trigger('click')
  expect(wrapper.find('.logout-confirm').exists()).toBe(true)
  await wrapper.find(acepta ? '.btn-leave' : '.btn-stay').trigger('click')
  expect(r.auth.estaLogueado).toBe(!acepta)
  expect(localStorage.getItem('jwt_token')).toBe(acepta ? null : 'jwt-ficticio')
  if (acepta) expect(mockPush).toHaveBeenCalledWith({ name: 'Login' })
})
