import Calendar from '../src/views/GoogleCalendarView.vue'
import { montar, flushPromises } from './helpers/montar'
import * as api from '../src/services/api'
jest.mock('../src/services/api', () => ({ loginUsuario: jest.fn(), getGoogleAuthUrl: jest.fn(), getGoogleCalendarStatus: jest.fn(), getGoogleConnectedUsers: jest.fn(), getGoogleUpcomingEvents: jest.fn(), syncGoogleDeliveryEvents: jest.fn(), unlinkGoogleCalendar: jest.fn(), unlinkGoogleUserAdmin: jest.fn() }))
let wrapper
beforeEach(() => {
  api.getGoogleCalendarStatus.mockResolvedValue({ connected: true, profile: { email: 'calendar@example.test' } })
  api.getGoogleConnectedUsers.mockResolvedValue({ users: [{ Id_Usuario: 3, Nombre_Completo: 'Cliente prueba', Rol: 'Cliente', Google_Email: 'cliente@example.test' }] })
  api.getGoogleUpcomingEvents.mockResolvedValue({ events: [{ id: 'e1', summary: 'Texticode entrega de camisas', start: { date: '2026-12-31' }, htmlLink: 'https://calendar.google.com/e1' }] })
  api.syncGoogleDeliveryEvents.mockResolvedValue({ total: 1, mensaje: 'Sincronizado' })
  api.unlinkGoogleCalendar.mockResolvedValue({})
  api.unlinkGoogleUserAdmin.mockResolvedValue({})
  api.getGoogleAuthUrl.mockResolvedValue({ url: '#vincular-prueba' })
})
afterEach(() => wrapper?.unmount())
async function abrir(rol) { wrapper = montar(Calendar, { rol }).wrapper; await flushPromises() }
describe.each(['Administrador', 'Operario', 'Cliente'])('Google Calendar para %s', rol => {
  test('RF-044 muestra el estado y correo vinculado', async () => {
    await abrir(rol)
    expect(wrapper.text()).toContain('calendar@example.test')
  })
  test('RF-044 permite iniciar vinculación o reautorización', async () => {
    await abrir(rol)
    await wrapper.vm.iniciarVinculacion()
    expect(api.getGoogleAuthUrl).toHaveBeenCalledWith('link')
  })
  test('RF-044 desvincula con confirmación y limpia próximos eventos', async () => {
    await abrir(rol)
    await wrapper.vm.desvincular()
    expect(confirm).toHaveBeenCalled()
    expect(api.unlinkGoogleCalendar).toHaveBeenCalled()
    expect(wrapper.vm.status.connected).toBe(false)
    expect(wrapper.vm.events).toEqual([])
  })
  test('RF-044 cancelar conserva la vinculación', async () => {
    await abrir(rol)
    confirm.mockReturnValue(false)
    await wrapper.vm.desvincular()
    expect(api.unlinkGoogleCalendar).not.toHaveBeenCalled()
  })
  test('RF-045 sincroniza y muestra cantidad de eventos', async () => {
    await abrir(rol)
    await wrapper.vm.sincronizar()
    expect(api.syncGoogleDeliveryEvents).toHaveBeenCalled()
    expect(wrapper.vm.syncResult).toContain('1 eventos creados o actualizados')
    expect(api.getGoogleUpcomingEvents).toHaveBeenCalledTimes(2)
  })
  test('RF-046 muestra próximos eventos con enlace para abrir en Google', async () => {
    await abrir(rol)
    expect(wrapper.text()).toContain('Texticode entrega de camisas')
    expect(wrapper.find('a[href="https://calendar.google.com/e1"]').exists()).toBe(true)
  })
})
test('RF-047 administrador ve y desvincula usuarios seleccionados', async () => {
  await abrir('Administrador')
  expect(api.getGoogleConnectedUsers).toHaveBeenCalled()
  expect(wrapper.text()).toContain('Cliente prueba')
  await wrapper.vm.desvincularUsuarioAdmin(wrapper.vm.connectedUsers[0])
  expect(api.unlinkGoogleUserAdmin).toHaveBeenCalledWith(3)
})
test.each(['Operario', 'Cliente'])('RF-047 %s no recibe administración de usuarios', async rol => {
  await abrir(rol)
  expect(wrapper.vm.esAdmin).toBe(false)
  expect(api.getGoogleConnectedUsers).not.toHaveBeenCalled()
  expect(wrapper.text()).not.toContain('Cliente prueba')
})
