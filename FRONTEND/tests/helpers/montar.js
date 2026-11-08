// Monta una vista con Pinia y un router de prueba.
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

const Vacio = { template: '<div />' }

export function crearRouterPrueba() {
  const rutas = ['/', '/login', '/cambiar-contrasena', '/admin/usuarios', '/superadmin/empresas',
    '/operario/cuenta', '/cliente/cuenta', '/google-auth/callback',
    '/admin/google-calendar', '/operario/google-calendar', '/cliente/google-calendar'].map(path => ({ path, component: Vacio }))
  rutas[1].name = 'Login'
  return createRouter({ history: createMemoryHistory(), routes: rutas })
}

export async function montarVista(Componente, { ruta = '/', props = {} } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = crearRouterPrueba()
  router.push(ruta)
  await router.isReady()
  const wrapper = mount(Componente, {
    props,
    attachTo: document.body,
    global: { plugins: [pinia, router], stubs: { teleport: true } },
  })
  await flushPromises()
  return { wrapper, router, pinia }
}

export { flushPromises }
