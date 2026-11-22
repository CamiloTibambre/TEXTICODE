import PerfilDrawer from '../src/components/PerfilDrawer.vue'
import router from '../src/router'
import { montar, flushPromises } from './helpers/montar'
import * as api from '../src/services/api'

jest.mock('../src/services/api', () => ({
  loginUsuario: jest.fn(),
  getUsuario: jest.fn(),
  actualizarUsuario: jest.fn(),
  getGoogleAuthUrl: jest.fn(),
  getGoogleCalendarStatus: jest.fn(),
  unlinkGoogleCalendar: jest.fn(),
}))

let wrapper
beforeEach(() => {
  api.getUsuario.mockResolvedValue({
    Id_Usuario: 2, Id_Rol: 2, Nombre_Completo: 'Usuario de prueba',
    Nombre_Usuario: 'prueba', Correo: 'usuario@example.test', Telefono: null,
  })
  api.getGoogleCalendarStatus.mockResolvedValue({
    connected: true,
    profile: { email: 'calendar@example.test' },
  })
})
afterEach(() => wrapper?.unmount())

describe.each(['Administrador', 'Operario', 'Cliente', 'superadmin'])('Google desde el perfil para %s', rol => {
  test('muestra la cuenta vinculada sin sincronización manual', async () => {
    wrapper = montar(PerfilDrawer, { rol, props: { open: false } }).wrapper
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(wrapper.vm.google.connected).toBe(true)
    expect(wrapper.vm.google.profile.email).toBe('calendar@example.test')
    expect(api.getGoogleCalendarStatus).toHaveBeenCalled()
  })
})

test('las rutas independientes de Calendar fueron eliminadas', () => {
  const paths = router.getRoutes().map(route => route.path)
  expect(paths).not.toContain('/admin/google-calendar')
  expect(paths).not.toContain('/operario/google-calendar')
  expect(paths).not.toContain('/cliente/google-calendar')
})
