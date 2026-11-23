// Ayudantes para montar vistas Vue con Pinia en las pruebas del frontend.
// - montarVista(): con router de prueba en memoria (estilo main)
// - montar(): con sesión simulada en el store y RouterLink/AppSidebar en stub (estilo rama de Camilo)
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useAuthStore } from '../../src/stores/auth'

const Vacio = { template: '<div />' }

export function crearRouterPrueba() {
  const rutas = ['/', '/login', '/cambiar-contrasena', '/admin/usuarios', '/superadmin/empresas',
    '/operario/tareas', '/cliente/pedidos', '/google-auth/callback'].map(path => ({ path, component: Vacio }))
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

export function montar(vista, { rol = 'Operario', props = {}, sidebar = true } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  if (rol) auth.guardarSesionGoogle('jwt-ficticio', { Id_Usuario: 2, Id_Rol: { Administrador: 1, Operario: 2, Cliente: 3, superadmin: 4 }[rol], Nombre_Completo: 'Usuario de prueba', Rol: rol })
  const wrapper = mount(vista, { props, global: { plugins: [pinia], mocks: { $route: { path: '/operario/tareas' } }, stubs: { AppSidebar: sidebar, RouterLink: { template: '<a><slot /></a>' } } } })
  return { wrapper, auth }
}

export const respuesta = data => ({ ok: true, status: 200, json: async () => data })
export const fase = (extra = {}) => ({ Id_Orden_Operario: 10, Id_Orden: 20, Numero_Fase: 1, Producto: 'Camisas', Descripcion_Fase: 'Coser mangas', Cliente: 'Cliente prueba', NombreMaterial: 'Algodón', Fecha_Limite: '2026-12-31T00:00:00', Prioridad: 'Alta', Cuota: 10, Cantidad: 20, Cantidad_Realizada: 4, Estado_Fase: 'Pendiente', ...extra })

export { flushPromises }
