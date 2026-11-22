// ═══════════════════════════════════════════════════════════════
// MÓDULO 6 · ADMINISTRADOR – EFICIENCIA Y CARGA DE TRABAJO (RF-035 a RF-040)
// Vista: src/views/admin/EficienciaOperarios.vue · Integrante: Andrés Lancheros
// ═══════════════════════════════════════════════════════════════
import { montarVista, flushPromises } from './helpers/montar.js'
import { useConfirmState } from '../src/composables/useConfirm.js'
import * as api from '../src/services/api.js'
import EficienciaOperarios from '../src/views/admin/EficienciaOperarios.vue'

jest.mock('../src/services/api.js', () => ({
  getEficienciaOperarios: jest.fn(), getEficienciaOperario: jest.fn(), getCargaTrabajo: jest.fn(), reasignarOrdenPorCarga: jest.fn(),
}))

// PostgreSQL devuelve los conteos como texto: la vista debe convertirlos a número
const op = (id, nombre, usuario, ppd, rendimiento, extra = {}) => ({
  Id_Usuario: id, Nombre_Completo: nombre, Nombre_Usuario: usuario, prendas_por_dia: ppd, rendimiento,
  total_unidades_producidas: '300', ordenes_en_retraso: '1', ordenes_completadas: '4', ordenes_en_proceso: '2', ...extra,
})
const RANKING = [
  op(2, 'Oscar Operario', 'oscar', 10, 'Alto', { total_unidades_producidas: '900', ordenes_en_retraso: '0' }),
  op(4, 'Iván Operario', 'ivan', 3.3, 'Medio', { ordenes_completadas: '9' }),
  op(3, 'Olga Operaria', 'olga', 0.3, 'Bajo', { ordenes_en_retraso: '3' }),
]
const DETALLE = {
  ...RANKING[0],
  ordenes_detalle: [
    { Id_Orden: 40, Producto: 'Camisa polo', Prioridad: 'Alta', Dificultad: 'Alta', Unidades_Realizadas: 30, Unidades: 75, Fecha_Limite: '2020-01-10', vencida: true },
    { Id_Orden: 41, Producto: 'Pantalón dril', Prioridad: 'Media', Dificultad: 'Baja', Unidades_Realizadas: 10, Unidades: 10, Fecha_Limite: '2099-01-10', vencida: false },
  ],
}
const HISTORIAL = {
  periodo: 'semana', dias: 7, tendencia: 'subiendo', diferencia_prendas: 6.7,
  actual: { prendas_por_dia: 10, completadas: 3, retrasos: 0, rendimiento: 'Alto' },
  anterior: { prendas_por_dia: 3.3, completadas: 1, retrasos: 1 },
}
const cargaOp = (id, nombre, activas, estado) => ({ Id_Usuario: id, Nombre_Completo: nombre, Nombre_Usuario: nombre.toLowerCase(), ordenes_activas: activas, ordenes_vencidas: 0, estado_carga: estado })
const CARGA = {
  resumen: { total_operarios: 4, sobrecargados: 1, normales: 1, disponibles: 2 },
  data: [cargaOp(2, 'Oscar', 9, 'sobrecargado'), cargaOp(5, 'Nora', 6, 'normal'), cargaOp(3, 'Olga', 3, 'disponible'), cargaOp(4, 'Iván', 1, 'disponible')],
}

let observaciones
function fetchSimulado() {
  return jest.fn(async (url, opciones = {}) => {
    const responder = (data, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => data })
    if (url.includes('/historial')) return responder({ ok: true, data: { ...HISTORIAL, periodo: new URL(url).searchParams.get('periodo') } })
    if (url.includes('/carga-trabajo/operarios/')) return responder({ ok: true, data: { ordenes_activas_detalle: [{ Id_Orden: 40, Producto: 'Camisa polo' }, { Id_Orden: 44, Producto: 'Chaqueta' }] } })
    if (url.includes('/eficiencia/observaciones') && opciones.method === 'POST') {
      const body = JSON.parse(opciones.body); observaciones.push({ Id_Observacion: 90 + observaciones.length, Id_Orden: body.Id_Orden, Observacion: body.Observacion })
      return responder({ ok: true })
    }
    if (url.includes('/eficiencia/observaciones') && opciones.method === 'DELETE') return responder({ ok: true })
    if (url.includes('/eficiencia/observaciones/')) return responder({ ok: true, data: observaciones })
    return responder({}, false)
  })
}

beforeEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
  localStorage.setItem('jwt_token', 't')
  localStorage.setItem('usuario', JSON.stringify({ Id_Usuario: 1, Rol: 'admin' }))
  jest.clearAllMocks()
  observaciones = []
  global.fetch = fetchSimulado()
  api.getEficienciaOperarios.mockResolvedValue(RANKING)
  api.getEficienciaOperario.mockResolvedValue(DETALLE)
  api.getCargaTrabajo.mockResolvedValue(CARGA)
  api.reasignarOrdenPorCarga.mockResolvedValue({ ok: true, mensaje: 'Orden #40 reasignada a Iván' })
})

const montar = () => montarVista(EficienciaOperarios, { ruta: '/admin/eficiencia' })
const nombres = lista => lista.map(o => o.Nombre_Completo)

// ─────────────────────────────────────────────────────────────
describe('RF-035 · Consultar ranking de eficiencia', () => {
  test('muestra el ranking por prendas por día con total producido, retrasos, completadas y rendimiento', async () => {
    const { wrapper } = await montar()
    expect(nombres(wrapper.vm.operariosOrdenados)).toEqual(['Oscar Operario', 'Iván Operario', 'Olga Operaria'])
    expect(wrapper.vm.operariosOrdenados[0]).toEqual(expect.objectContaining({
      prendas_por_dia: 10, total_unidades_producidas: 900, ordenes_en_retraso: 0, ordenes_completadas: 4, rendimiento: 'Alto',
    }))
  })

  test('busca por nombre o usuario', async () => {
    const { wrapper } = await montar()
    wrapper.vm.busqueda = 'olga'
    expect(nombres(wrapper.vm.operariosOrdenados)).toEqual(['Olga Operaria'])
  })

  test('filtra por rendimiento', async () => {
    const { wrapper } = await montar()
    wrapper.vm.filtroRendimiento = 'Medio'
    expect(nombres(wrapper.vm.operariosOrdenados)).toEqual(['Iván Operario'])
  })

  test('ordena por cualquier columna (y al revés con el segundo clic)', async () => {
    const { wrapper } = await montar()
    wrapper.vm.sortBy('ordenes_completadas')
    expect(nombres(wrapper.vm.operariosOrdenados)[0]).toBe('Iván Operario')
    wrapper.vm.sortBy('ordenes_completadas')
    expect(nombres(wrapper.vm.operariosOrdenados).at(-1)).toBe('Iván Operario')
    wrapper.vm.sortBy('ordenes_en_retraso')
    expect(nombres(wrapper.vm.operariosOrdenados)[0]).toBe('Olga Operaria')
  })

  test('las tarjetas cuentan operarios, rendimiento alto, bajo y órdenes en retraso', async () => {
    const { wrapper } = await montar()
    expect(Object.fromEntries(wrapper.vm.kpisEficiencia.map(k => [k.label, k.valor])))
      .toEqual({ 'Total operarios': 3, 'Rendimiento alto': 1, 'Rendimiento bajo': 1, 'Órdenes en retraso': 4 })
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-036 · Ver avance por operario', () => {
  test('el detalle muestra el avance de cada orden (realizadas vs total), prioridad, dificultad y fecha, marcando las vencidas', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.verDetalle(2)
    await flushPromises()

    expect(api.getEficienciaOperario).toHaveBeenCalledWith(2)
    const [vencida, alDia] = wrapper.vm.operarioActivo.ordenes_detalle
    expect(wrapper.vm.avancePct(vencida)).toBe(40)                  // 30 de 75
    expect(wrapper.vm.avancePct(alDia)).toBe(100)
    const filas = [...document.querySelectorAll('.detalle-ordenes tbody tr')].map(tr => tr.textContent)
    const fila40 = filas.find(f => f.includes('Camisa polo'))
    expect(fila40).toContain('VENCIDA')
    expect(fila40).toContain('Alta')
    expect(filas.find(f => f.includes('Pantalón dril'))).not.toContain('VENCIDA')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-037 · Ver tendencia de rendimiento', () => {
  test('al abrir el detalle compara la semana actual con la anterior e indica si mejora', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.verDetalle(2)
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/eficiencia/operarios/2/historial?periodo=semana'), expect.any(Object))
    expect(wrapper.vm.historial.tendencia).toBe('subiendo')
    const texto = document.body.textContent
    expect(texto).toContain('Mejorando')
    expect(texto).toContain('+6.7 prendas/día vs semana anterior')
  })

  test.each(['mes', 'trimestre'])('permite cambiar el periodo de comparación a %s', async (periodo) => {
    const { wrapper } = await montar()
    await wrapper.vm.verDetalle(2)
    await wrapper.vm.cargarHistorial(2, periodo)
    expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining(`historial?periodo=${periodo}`), expect.any(Object))
    expect(wrapper.vm.periodoHistorial).toBe(periodo)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-038 · Registrar observaciones sobre operarios', () => {
  test('agrega una observación a una orden del operario y la muestra', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.verDetalle(2)
    const orden = wrapper.vm.operarioActivo.ordenes_detalle[0]
    await wrapper.vm.toggleObsOrden(orden)
    wrapper.vm.nuevaObsXOrden[40] = 'Revisar costuras del lote'
    await wrapper.vm.guardarObservacionOrden(orden)

    const post = global.fetch.mock.calls.find(([, o]) => o?.method === 'POST')
    expect(JSON.parse(post[1].body)).toEqual({ Id_Operario: 2, Id_Admin: 1, Id_Orden: 40, Observacion: 'Revisar costuras del lote' })
    expect(wrapper.vm.obsXOrden[40].map(o => o.Observacion)).toEqual(['Revisar costuras del lote'])
  })

  test('no envía observaciones vacías', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.verDetalle(2)
    wrapper.vm.nuevaObsXOrden[40] = '   '
    await wrapper.vm.guardarObservacionOrden(wrapper.vm.operarioActivo.ordenes_detalle[0])
    expect(global.fetch.mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false)
  })

  test('elimina una observación después de confirmar', async () => {
    observaciones = [{ Id_Observacion: 90, Id_Orden: 40, Observacion: 'Revisar costuras del lote' }]
    const { wrapper } = await montar()
    await wrapper.vm.verDetalle(2)
    await wrapper.vm.toggleObsOrden(wrapper.vm.operarioActivo.ordenes_detalle[0])
    const { estado, responder } = useConfirmState()

    const promesa = wrapper.vm.eliminarObservacion(90, 40)
    expect(estado.titulo).toBe('¿Eliminar esta observación?')
    responder(true)
    await promesa
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/eficiencia/observaciones/90'), expect.objectContaining({ method: 'DELETE' }))
    expect(wrapper.vm.obsXOrden[40]).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-039 · Consultar carga de trabajo', () => {
  test('muestra a los operarios como disponibles, normales o sobrecargados con sus tarjetas', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.cambiarVistaCarga()
    await flushPromises()

    expect(Object.fromEntries(wrapper.vm.kpisCarga.map(k => [k.label, k.valor])))
      .toEqual({ 'Total operarios': 4, Disponibles: 2, 'Carga normal': 1, Sobrecargados: 1 })
    expect(wrapper.vm.estadoCargaLabel('sobrecargado')).toBe('Sobrecargado')
  })

  test('filtra por estado de carga', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.cambiarVistaCarga()
    wrapper.vm.filtroCarga = 'disponible'
    expect(nombres(wrapper.vm.cargaOperariosFiltrados)).toEqual(['Olga', 'Iván'])
  })

  test('muestra el detalle de las órdenes activas del operario', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.cambiarVistaCarga()
    await wrapper.vm.verDetalleCarga(CARGA.data[0])
    expect(wrapper.vm.cargaDetalleOrdenes.map(o => o.Id_Orden)).toEqual([40, 44])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-040 · Reasignar órdenes', () => {
  test('desde un sobrecargado sugiere operarios no sobrecargados, empezando por el de menor carga', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.cambiarVistaCarga()
    wrapper.vm.abrirReasignacion()
    expect(nombres(wrapper.vm.operariosSobrecargados)).toEqual(['Oscar'])
    await wrapper.vm.seleccionarOperarioReasign(CARGA.data[0])
    expect(nombres(wrapper.vm.operariosSugeridos)).toEqual(['Iván', 'Olga', 'Nora'])
  })

  test('reasigna la orden al operario elegido y la quita de la lista del sobrecargado', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.cambiarVistaCarga()
    await wrapper.vm.seleccionarOperarioReasign(CARGA.data[0])
    await wrapper.vm.reasignarOrden({ Id_Orden: 40 }, CARGA.data[3])

    expect(api.reasignarOrdenPorCarga).toHaveBeenCalledWith({ Id_Orden: 40, Id_Operario_Destino: 4 })
    expect(wrapper.vm.ordenesReasignActivo.map(o => o.Id_Orden)).toEqual([44])
    expect(api.getCargaTrabajo).toHaveBeenCalledTimes(2)              // se recalcula la carga
  })
})
