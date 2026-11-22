import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../../src/stores/auth'
export { flushPromises }
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
