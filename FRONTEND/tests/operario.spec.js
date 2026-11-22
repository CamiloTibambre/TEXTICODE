import Tareas from '../src/views/operario/TareasAsignadas.vue'
import Avances from '../src/views/operario/ReportarAvances.vue'
import { montar, flushPromises, respuesta, fase } from './helpers/montar'
jest.mock('../src/services/api', () => ({ loginUsuario: jest.fn() }))
let wrapper
afterEach(() => wrapper?.unmount())
async function tareas(datos = [fase()]) {
  fetch.mockResolvedValue(respuesta(datos))
  ;({ wrapper } = montar(Tareas))
  await flushPromises()
  jest.advanceTimersByTime(4000)
  await wrapper.vm.$nextTick()
  return wrapper
}
async function avances(historial = []) {
  fetch.mockImplementation(url => Promise.resolve(respuesta(url.endsWith('/historial') ? historial : [fase()])))
  ;({ wrapper } = montar(Avances))
  await flushPromises()
  return wrapper
}
test('RF-055 consulta fases propias y muestra contadores por estado', async () => {
  await tareas([fase(), fase({ Id_Orden_Operario: 11, Estado_Fase: 'Completada' }), fase({ Id_Orden_Operario: 12, Fecha_Limite: '2026-01-01' })])
  expect(fetch.mock.calls[0][0]).toContain('/operario/2')
  expect(wrapper.vm.displayTotal).toBe(3)
  expect(wrapper.vm.displayEnProceso).toBe(1)
  expect(wrapper.vm.displayCompletadas).toBe(1)
  expect(wrapper.vm.displayRetrasadas).toBe(1)
})
test('RF-055 muestra lista vacía cuando no hay tareas', async () => {
  await tareas([])
  expect(wrapper.vm.tareasFiltradas).toHaveLength(0)
})
test('RF-056 muestra producto, instrucciones, material y cliente', async () => {
  await tareas()
  for (const texto of ['Camisas', 'Coser mangas', 'Algodón', 'Cliente prueba']) expect(wrapper.text()).toContain(texto)
})
test.each(['Alta', 'Media', 'Baja'])('RF-057 muestra prioridad %s y fecha de entrega', async Prioridad => {
  await tareas([fase({ Prioridad })])
  expect(wrapper.vm.tareas[0]).toMatchObject({ prioridad: Prioridad.toLowerCase(), entrega: '2026-12-31' })
  expect(wrapper.text().toLowerCase()).toContain(Prioridad.toLowerCase())
})
test('RF-057 resalta tarea vencida', async () => {
  await tareas([fase({ Fecha_Limite: '2026-01-01' })])
  expect(wrapper.vm.tareas[0].vencida).toBe(true)
  expect(wrapper.text()).toContain('Retrasada')
})
test.each([{ Estado_Fase: 'Pendiente', Cantidad_Realizada: 4, progreso: 40, estado: 'en-proceso' }, { Estado_Fase: 'Completada', Cantidad_Realizada: 10, progreso: 100, estado: 'completado' }])('RF-058 muestra estado $estado y porcentaje $progreso', async ({ progreso, estado, ...extra }) => {
  await tareas([fase(extra)])
  expect(wrapper.vm.tareas[0]).toMatchObject({ progreso, estado })
  expect(wrapper.text()).toContain(`${progreso}%`)
})
test('RF-059 busca por instrucciones de la fase', async () => {
  await tareas([fase(), fase({ Id_Orden_Operario: 11, Descripcion_Fase: 'Cortar tela' })])
  await wrapper.find('input[placeholder="Buscar tareas..."]').setValue('cortar')
  expect(wrapper.vm.tareasFiltradas).toHaveLength(1)
  expect(wrapper.text()).not.toContain('Coser mangas')
})
test('RF-059 combina filtros de estado y prioridad', async () => {
  await tareas([fase(), fase({ Id_Orden_Operario: 11, Prioridad: 'Baja' })])
  await wrapper.findAll('select')[0].setValue('en-proceso')
  await wrapper.findAll('select')[1].setValue('alta')
  expect(wrapper.vm.tareasFiltradas).toHaveLength(1)
})
test('RF-059 búsqueda sin coincidencias devuelve lista vacía', async () => {
  await tareas()
  await wrapper.find('input').setValue('inexistente')
  expect(wrapper.vm.tareasFiltradas).toHaveLength(0)
})
test('RF-060 calcula el porcentaje antes de enviar avance parcial', async () => {
  await avances()
  wrapper.vm.abrirModal(wrapper.vm.ordenesActivas[0])
  wrapper.vm.reporte.cantidad = 6
  await wrapper.vm.$nextTick()
  expect(wrapper.vm.resultadoTexto).toBe('60%')
  fetch.mockResolvedValue(respuesta({ fase: { Estado_Fase: 'Pendiente' } }))
  await wrapper.vm.enviarReporte()
  expect(JSON.parse(fetch.mock.calls.at(-1)[1].body).Cantidad_Realizada).toBe(6)
  expect(wrapper.vm.ordenesActivas[0].progreso).toBe(60)
})
test('RF-060 completar la cuota quita la fase de activas y la agrega al historial', async () => {
  await avances()
  wrapper.vm.abrirModal(wrapper.vm.ordenesActivas[0])
  wrapper.vm.reporte.cantidad = 10
  fetch.mockResolvedValue(respuesta({ fase: { Estado_Fase: 'Completada' } }))
  await wrapper.vm.enviarReporte()
  expect(wrapper.vm.ordenesActivas).toHaveLength(0)
  expect(wrapper.vm.historial).toHaveLength(1)
})
test.each([-1, 11, 1.5])('RF-060 impide enviar cantidad inválida %s', async cantidad => {
  await avances()
  wrapper.vm.abrirModal(wrapper.vm.ordenesActivas[0])
  wrapper.vm.reporte.cantidad = cantidad
  fetch.mockClear()
  await wrapper.vm.enviarReporte()
  expect(fetch).not.toHaveBeenCalled()
})
test.each(['Costura revisada', ''])('RF-061 envía la nota opcional %s', async nota => {
  await avances()
  wrapper.vm.abrirModal(wrapper.vm.ordenesActivas[0])
  wrapper.vm.reporte.nota = nota
  fetch.mockResolvedValue(respuesta({ fase: { Estado_Fase: 'Pendiente' } }))
  await wrapper.vm.enviarReporte()
  expect(JSON.parse(fetch.mock.calls.at(-1)[1].body).Nota_Operario).toBe(nota)
})
test('RF-062 muestra fases completadas con fecha y nota en la pestaña historial', async () => {
  await avances([fase({ Estado_Fase: 'Completada', Nota_Operario: 'Revisado por calidad', Fecha_Completada: '2026-11-07T12:00:00-05:00' })])
  const boton = wrapper.findAll('button').find(b => b.text().includes('Historial'))
  await boton.trigger('click')
  expect(wrapper.vm.tabActivo).toBe('historial')
  expect(wrapper.text()).toContain('Revisado por calidad')
  expect(wrapper.vm.historial[0].fecha).toContain('2026')
})
test('RF-062 historial vacío se representa sin registros ficticios', async () => {
  await avances([])
  expect(wrapper.vm.historial).toEqual([])
})
