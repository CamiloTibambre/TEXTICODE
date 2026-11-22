import Tareas from '../src/views/operario/TareasAsignadas.vue'
import Avances from '../src/views/operario/ReportarAvances.vue'
import { montar, flushPromises, respuesta, fase } from './helpers/montar'

jest.mock('../src/services/api', () => ({ loginUsuario: jest.fn() }))

let wrapper
afterEach(() => wrapper?.unmount())

const faseCompleta = (extra = {}) => fase({
  Materiales: [
    { Id_Material: 1, Nombre_Material: 'Algodón', Cantidad_Usada: 12 },
    { Id_Material: 2, Nombre_Material: 'Hilo', Cantidad_Usada: 4 },
  ],
  ...extra,
})
async function montarTareas(datos = [faseCompleta()], summary = null) {
  fetch.mockResolvedValue(respuesta({
    data: datos,
    pagination: { page: 1, limit: 10, total: datos.length, totalPages: 1 },
    summary: summary || { total: datos.length, pendientes: datos.length, completadas: 0, retrasadas: 0 },
  }))
  ;({ wrapper } = montar(Tareas))
  await flushPromises()
  return wrapper
}

async function montarAvances({ activas = [faseCompleta()], historial = [] } = {}) {
  fetch.mockImplementation(url => Promise.resolve(respuesta(
    String(url).includes('/historial?')
      ? { data: historial, pagination: { page: 1, limit: 10, total: historial.length, totalPages: 1 } }
      : activas
  )))
  ;({ wrapper } = montar(Avances))
  await flushPromises()
  return wrapper
}

test('Tareas usa paginación de backend y muestra contadores globales', async () => {
  await montarTareas([faseCompleta()], { total: 12, pendientes: 8, completadas: 3, retrasadas: 1 })
  expect(fetch.mock.calls[0][0]).toContain('page=1&limit=10')
  expect(wrapper.vm.totalTareas).toBe(1)
  expect(wrapper.vm.resumen.total).toBe(12)
})

test('Tareas muestra prendas asignadas sin fracción ni barra de progreso', async () => {
  await montarTareas()
  expect(wrapper.text()).toContain('Prendas a realizar:')
  expect(wrapper.text()).toContain('10')
  expect(wrapper.find('.progress-bar').exists()).toBe(false)
})

test('Tareas renderiza todos los materiales asociados', async () => {
  await montarTareas()
  expect(wrapper.text()).toContain('Algodón')
  expect(wrapper.text()).toContain('Hilo')
  expect(wrapper.findAll('.material-chip')).toHaveLength(2)
})

test('Tareas usa estado Pendiente cuando la fase no está completada', async () => {
  await montarTareas()
  expect(wrapper.vm.tareas[0].estado).toBe('pendiente')
  expect(wrapper.text()).toContain('Pendiente')
})

test('Órdenes activas muestran orden, fase y prendas sin progreso parcial', async () => {
  await montarAvances()
  expect(wrapper.text()).toContain('ORD-020')
  expect(wrapper.text()).toContain('Fase 1 · Coser mangas')
  expect(wrapper.text()).toContain('Prendas a realizar')
  expect(wrapper.find('.oc-progress').exists()).toBe(false)
})

test('El modal confirma la fase completa y conserva la nota opcional', async () => {
  await montarAvances()
  wrapper.vm.abrirModal(wrapper.vm.ordenesActivas[0])
  wrapper.vm.reporte.nota = 'Costura revisada'
  fetch.mockResolvedValueOnce(respuesta({ fase: { Estado_Fase: 'Completada' }, cuota: 10 }))
  fetch.mockResolvedValueOnce(respuesta({ data: [], pagination: { total: 0 } }))
  await wrapper.vm.enviarReporte()
  const request = fetch.mock.calls.find(call => String(call[0]).includes('/completar'))
  expect(request).toBeTruthy()
  expect(JSON.parse(request[1].body)).toEqual({ Nota_Operario: 'Costura revisada' })
  expect(wrapper.vm.ordenesActivas).toHaveLength(0)
})

test('Historial muestra datos enriquecidos y usa paginación', async () => {
  await montarAvances({ historial: [faseCompleta({
    Estado_Fase: 'Completada',
    Nota_Operario: 'Revisado por calidad',
    Fecha_Completada: '2026-11-07T12:00:00-05:00',
    Completada_A_Tiempo: true,
  })] })
  expect(wrapper.vm.historialTotal).toBe(1)
  expect(wrapper.text()).toContain('Revisado por calidad')
  expect(wrapper.text()).toContain('A tiempo')
  expect(fetch.mock.calls.some(call => String(call[0]).includes('/historial?page=1&limit=10'))).toBe(true)
})
