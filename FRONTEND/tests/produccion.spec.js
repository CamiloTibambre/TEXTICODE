// ═══════════════════════════════════════════════════════════════
// MÓDULO 5 · ADMINISTRADOR – GESTIÓN DE PRODUCCIÓN (RF-024 a RF-034)
// Vista: src/views/admin/GestionProduccion.vue · Integrante: Andrés Lancheros
// ═══════════════════════════════════════════════════════════════
import { montarVista, flushPromises } from './helpers/montar.js'
import { useConfirmState } from '../src/composables/useConfirm.js'
import * as api from '../src/services/api.js'
import GestionProduccion from '../src/views/admin/GestionProduccion.vue'

const mockNotificarTarea = jest.fn()
jest.mock('../src/composables/useNotificaciones', () => ({ useNotificaciones: () => ({ notificarTarea: mockNotificarTarea }) }))
jest.mock('../src/services/api', () => ({
  getOrdenes: jest.fn(), crearOrden: jest.fn(), actualizarOrden: jest.fn(), eliminarOrden: jest.fn(),
  getUsuarios: jest.fn(), getMateriales: jest.fn(),
  getMaterialesDeOrden: jest.fn(), agregarMaterialOrden: jest.fn(), eliminarMaterialOrden: jest.fn(),
  getFasesDeOrden: jest.fn(), crearFaseOperario: jest.fn(), eliminarFaseOperario: jest.fn(),
  crearComprobante: jest.fn(),
}))

const USUARIOS = [
  { Id_Usuario: 3, Nombre_Completo: 'Carla Cliente', Rol: 'cliente' },
  { Id_Usuario: 6, Nombre_Completo: 'Bruno Díaz', Rol: 'cliente' },
  { Id_Usuario: 2, Nombre_Completo: 'Oscar Operario', Correo: 'oscar@demo.com', Rol: 'operario' },
  { Id_Usuario: 5, Nombre_Completo: 'Olga Operaria', Correo: 'olga@demo.com', Rol: 'operario' },
]
const MATERIALES = [
  { Id_Material: 1, Nombre_Material: 'Tela Oxford azul', Stock_Actual: 100, Unidad: 'metros', Id_Cliente: 3 },
  { Id_Material: 2, Nombre_Material: 'Botones nácar', Stock_Actual: 10, Unidad: 'unidades', Id_Cliente: 3 },
  { Id_Material: 3, Nombre_Material: 'Hilo negro', Stock_Actual: 50, Unidad: 'conos', Id_Cliente: 6 },
]
const orden = (id, extra) => ({
  Id_Orden: id, Id_Cliente: 3, Cliente: 'Carla Cliente', Producto: `Producto ${id}`, Descripcion: `Descripción ${id}`,
  Cantidad: 100, Unidades_Realizadas: 0, Prioridad: 'Media', Dificultad: 'Media', Estado: 'En Proceso',
  Fecha_Creacion: '2026-11-01T00:00:00Z', Fecha_Limite: '2099-12-20T00:00:00Z', ...extra,
})
const ORDENES = [
  orden(40, { Producto: 'Camisa polo', Cantidad: 150, Unidades_Realizadas: 60, Prioridad: 'Alta', Dificultad: 'Alta', Fecha_Limite: '2099-12-20T00:00:00Z' }),
  orden(41, { Id_Cliente: 6, Cliente: 'Bruno Díaz', Estado: 'Completada', Unidades_Realizadas: 100, Fecha_Limite: '2099-01-15T00:00:00Z' }),
  orden(42, { Estado: 'Retrasada', Fecha_Limite: '2026-10-01T00:00:00Z' }),
  orden(43, { Estado: 'En Proceso', Fecha_Limite: '2099-06-01T00:00:00Z' }),
]
const FASES_40 = [
  { Id_Orden_Operario: 11, Numero_Fase: 1, Descripcion_Fase: 'Corte', Id_Operario: 2, Nombre_Operario: 'Oscar Operario', Estado_Fase: 'Completada' },
  { Id_Orden_Operario: 12, Numero_Fase: 2, Descripcion_Fase: 'Costura', Id_Operario: 5, Nombre_Operario: 'Olga Operaria', Estado_Fase: 'Pendiente' },
]
const MATS_40 = [{ Id_Material: 1, Nombre_Material: 'Tela Oxford azul', Cantidad_Usada: 30 }]

beforeEach(() => {
  jest.useFakeTimers()
  document.body.innerHTML = ''
  localStorage.clear()
  localStorage.setItem('jwt_token', 't')
  localStorage.setItem('usuario', JSON.stringify({ Id_Usuario: 1, Rol: 'admin' }))
  jest.clearAllMocks()
  api.getOrdenes.mockResolvedValue(ORDENES)
  api.getUsuarios.mockResolvedValue(USUARIOS)
  api.getMateriales.mockResolvedValue(MATERIALES)
  api.getMaterialesDeOrden.mockImplementation(async id => (id === 40 ? MATS_40 : []))
  api.getFasesDeOrden.mockImplementation(async id => (id === 40 ? FASES_40 : []))
  for (const fn of ['crearOrden', 'actualizarOrden', 'eliminarOrden', 'agregarMaterialOrden', 'eliminarMaterialOrden', 'crearFaseOperario', 'eliminarFaseOperario', 'crearComprobante'])
    api[fn].mockResolvedValue({})
  api.crearOrden.mockResolvedValue({ Id_Orden: 50 })
})
afterEach(() => jest.useRealTimers())

const montar = () => montarVista(GestionProduccion, { ruta: '/admin/produccion' })
async function llenarNuevaOrden(vm, extra = {}) {
  await vm.abrirModal()
  vm.form.Id_Cliente = 3
  await vm.$nextTick()
  Object.assign(vm.form, { Producto: 'Chaqueta', Descripcion: 'Chaqueta impermeable', Cantidad: 80, Prioridad: 'Alta', Dificultad: 'Baja', Fecha_Limite: '2099-12-01', ...extra })
}
// abrirModal espera un setTimeout interno: con relojes simulados hay que avanzarlo
async function abrirEdicion(vm, o) {
  const abriendo = vm.abrirModal(o)
  await flushPromises()
  jest.runOnlyPendingTimers()
  await abriendo
}
function agregarMaterial(vm, id, cantidad) {
  vm.materialParaAgregar = id
  vm.agregarMaterial()
  vm.form.materiales_seleccionados.at(-1).cantidad = cantidad
}

// ─────────────────────────────────────────────────────────────
describe('RF-024 · Crear orden de producción', () => {
  test('crea la orden con cliente, producto, descripción, cantidad, prioridad, dificultad y fecha límite', async () => {
    const { wrapper } = await montar()
    await llenarNuevaOrden(wrapper.vm)
    agregarMaterial(wrapper.vm, 1, 20)
    await wrapper.vm.guardar()

    expect(api.crearOrden).toHaveBeenCalledWith({
      Id_Cliente: 3, Id_Material: 1, Producto: 'Chaqueta', Descripcion: 'Chaqueta impermeable', Cantidad: 80,
      Prioridad: 'Alta', Dificultad: 'Baja', Estado: 'En Proceso', Fecha_Limite: '2099-12-01',
    })
  })

  test('asigna a la nueva orden los materiales elegidos con su cantidad', async () => {
    const { wrapper } = await montar()
    await llenarNuevaOrden(wrapper.vm)
    agregarMaterial(wrapper.vm, 1, 20)
    agregarMaterial(wrapper.vm, 2, 5)
    await wrapper.vm.guardar()
    expect(api.agregarMaterialOrden.mock.calls.map(c => c[0])).toEqual([
      { Id_Orden: 50, Id_Producto: 1, Cantidad_Usada: 20 },
      { Id_Orden: 50, Id_Producto: 2, Cantidad_Usada: 5 },
    ])
  })

  test('solo ofrece los materiales del cliente elegido', async () => {
    const { wrapper } = await montar()
    await llenarNuevaOrden(wrapper.vm)
    expect(wrapper.vm.materialesFiltrados.map(m => m.Nombre_Material)).toEqual(['Tela Oxford azul', 'Botones nácar'])
  })

  test('valida cliente, descripción, cantidad, fecha límite y al menos un material', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.abrirModal()
    Object.assign(wrapper.vm.form, { Cantidad: 0 })
    await wrapper.vm.guardar()

    expect(wrapper.vm.v.error('Id_Cliente')).toBe('Elige el cliente de la orden.')
    expect(wrapper.vm.v.error('Descripcion')).toBe('Describe qué se va a fabricar.')
    expect(wrapper.vm.v.error('Cantidad')).toBe('Usa un número mayor a 0.')
    expect(wrapper.vm.v.error('Fecha_Limite')).toBe('Elige la fecha límite.')
    expect(wrapper.vm.v.error('materiales')).toBe('Agrega al menos un material.')
    expect(api.crearOrden).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-025 · Editar orden de producción', () => {
  test('carga la orden con sus materiales y fases, y guarda los cambios incluido el estado', async () => {
    const { wrapper } = await montar()
    await abrirEdicion(wrapper.vm, ORDENES[0])
    expect(wrapper.vm.form).toEqual(expect.objectContaining({ Id_Orden: 40, Producto: 'Camisa polo', Cantidad: 150, Fecha_Limite: '2099-12-20' }))
    expect(wrapper.vm.form.materiales_seleccionados).toEqual([{ Id_Material: 1, Nombre_Material: 'Tela Oxford azul', cantidad: 30 }])
    expect(wrapper.vm.form.fases).toHaveLength(2)

    wrapper.vm.form.Estado = 'Completada'
    await wrapper.vm.guardar()
    expect(api.actualizarOrden).toHaveBeenCalledWith(40, expect.objectContaining({ Estado: 'Completada', Producto: 'Camisa polo' }))
    expect(api.crearOrden).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-026 · Eliminar orden de producción', () => {
  test('pide confirmación y, al aceptar, elimina la orden de la lista', async () => {
    const { wrapper } = await montar()
    const { estado, responder } = useConfirmState()
    const promesa = wrapper.vm.solicitarEliminar(wrapper.vm.ordenes.find(o => o.Id_Orden === 42))
    expect(estado.titulo).toBe('¿Eliminar la orden #42?')
    responder(true)
    await flushPromises()
    jest.advanceTimersByTime(400)
    await promesa

    expect(api.eliminarOrden).toHaveBeenCalledWith(42)
    expect(wrapper.vm.ordenes.some(o => o.Id_Orden === 42)).toBe(false)
  })

  test('si se cancela, la orden no se elimina', async () => {
    const { wrapper } = await montar()
    const { responder } = useConfirmState()
    const promesa = wrapper.vm.solicitarEliminar(wrapper.vm.ordenes[0])
    responder(false)
    await promesa
    expect(api.eliminarOrden).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-027 · Ver detalle de la orden', () => {
  test('muestra avance, cliente, material principal, dificultad, fechas, descripción, fases con operario y materiales', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirVista(wrapper.vm.ordenes.find(o => o.Id_Orden === 40))
    await wrapper.vm.$nextTick()
    const texto = document.body.textContent

    expect(wrapper.vm.pctOrden(wrapper.vm.ordenVista)).toBe(40)              // 60 de 150 prendas
    for (const dato of ['ORD-040', 'Carla Cliente', 'Tela Oxford azul', 'Alta', '20/12/2099', '1/11/2026', 'Camisa polo',
      'Fase 1', 'Oscar Operario', 'Corte', 'Fase 2', 'Olga Operaria', 'Costura', '(30)']) {
      expect(texto).toContain(dato)
    }
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-028 · Ver tareas asignadas a operarios', () => {
  test('cada tarjeta muestra número, producto, cliente, estado, prioridad, fecha límite, fases y avance en prendas', async () => {
    const { wrapper } = await montar()
    const tarjeta = wrapper.findAll('.orden-card').find(c => c.text().includes('ORD-040')).text()
    for (const dato of ['ORD-040', 'Camisa polo', 'Carla Cliente', 'En Proceso', 'Alta', 'Vence: 20/12/2099', 'Fases a realizar: 2', '60 de 150 prendas', '40%']) {
      expect(tarjeta).toContain(dato)
    }
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-029 · Filtrar órdenes', () => {
  const ids = vm => vm.ordenesFiltradas.map(o => o.Id_Orden)

  test('sin filtros, las órdenes salen ordenadas por fecha límite', async () => {
    const { wrapper } = await montar()
    expect(ids(wrapper.vm)).toEqual([42, 41, 43, 40])
  })

  test('filtra por cliente', async () => {
    const { wrapper } = await montar()
    wrapper.vm.filtroCliente = 6
    expect(ids(wrapper.vm)).toEqual([41])
  })

  test('filtra por estado', async () => {
    const { wrapper } = await montar()
    wrapper.vm.filtroEstado = 'En Proceso'
    expect(ids(wrapper.vm)).toEqual([43, 40])
  })

  test('combina cliente y estado', async () => {
    const { wrapper } = await montar()
    wrapper.vm.filtroCliente = 3
    wrapper.vm.filtroEstado = 'Retrasada'
    expect(ids(wrapper.vm)).toEqual([42])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-030 · Asignar operarios por fases', () => {
  test('agrega fases numeradas con descripción y operario, y las guarda en la orden', async () => {
    const { wrapper } = await montar()
    await llenarNuevaOrden(wrapper.vm)
    agregarMaterial(wrapper.vm, 1, 10)
    wrapper.vm.operarioParaFase = 2; wrapper.vm.descripcionFaseNueva = 'Corte'; wrapper.vm.agregarFase()
    wrapper.vm.operarioParaFase = 5; wrapper.vm.descripcionFaseNueva = 'Costura'; wrapper.vm.agregarFase()
    expect(wrapper.vm.form.fases.map(f => `${f.Numero_Fase}:${f.Descripcion_Fase}:${f.Id_Operario}`)).toEqual(['1:Corte:2', '2:Costura:5'])

    await wrapper.vm.guardar()
    expect(api.crearFaseOperario.mock.calls.map(c => c[0])).toEqual([
      { Id_Orden: 50, Id_Operario: 2, Numero_Fase: 1, Descripcion_Fase: 'Corte' },
      { Id_Orden: 50, Id_Operario: 5, Numero_Fase: 2, Descripcion_Fase: 'Costura' },
    ])
  })

  test('no deja quitar una fase que el operario ya completó', async () => {
    const { wrapper } = await montar()
    await abrirEdicion(wrapper.vm, ORDENES[0])
    wrapper.vm.quitarFase(0)                                       // fase 1 = Completada
    expect(wrapper.vm.errorGuardar).toBe('No puedes quitar una fase que el operario ya completó.')
    expect(wrapper.vm.form.fases).toHaveLength(2)
    wrapper.vm.quitarFase(1)                                       // fase 2 = Pendiente
    expect(wrapper.vm.form.fases).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-031 · Validar stock al asignar materiales', () => {
  test('no crea la orden si se pide más cantidad de la disponible', async () => {
    const { wrapper } = await montar()
    await llenarNuevaOrden(wrapper.vm)
    agregarMaterial(wrapper.vm, 2, 15)                             // hay 10 botones
    await wrapper.vm.guardar()

    expect(wrapper.vm.errorGuardar).toBe('No hay suficiente stock de "Botones nácar": disponible 10 unidades, se necesitan 15.')
    expect(api.crearOrden).not.toHaveBeenCalled()
  })

  test('al editar, lo que la orden ya tenía reservado cuenta como disponible', async () => {
    const { wrapper } = await montar()
    await abrirEdicion(wrapper.vm, ORDENES[0])                     // tenía 30 m de tela reservados
    wrapper.vm.form.materiales_seleccionados[0].cantidad = 120     // stock 100 + 30 reservados = 130
    await wrapper.vm.guardar()
    expect(wrapper.vm.errorGuardar).toBe('')
    expect(api.actualizarOrden).toHaveBeenCalled()
  })

  test('muestra el error del servidor si el stock cambió mientras se guardaba', async () => {
    api.agregarMaterialOrden.mockRejectedValue(new Error('Stock insuficiente: hay 3 y se necesitan 20'))
    const { wrapper } = await montar()
    await llenarNuevaOrden(wrapper.vm)
    agregarMaterial(wrapper.vm, 1, 20)
    await wrapper.vm.guardar()
    expect(wrapper.vm.errorGuardar).toBe('Stock insuficiente: hay 3 y se necesitan 20')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-032 · Generar comprobante al crear la orden', () => {
  test('al crear la orden se genera su comprobante en estado Pendiente', async () => {
    const { wrapper } = await montar()
    await llenarNuevaOrden(wrapper.vm)
    agregarMaterial(wrapper.vm, 1, 10)
    await wrapper.vm.guardar()
    expect(api.crearComprobante).toHaveBeenCalledWith({ Id_Usuario: 1, Id_Orden: 50, Estado: 'Pendiente', Fecha_Limite: '2099-12-01' })
  })

  test('al editar una orden no se genera otro comprobante', async () => {
    const { wrapper } = await montar()
    await abrirEdicion(wrapper.vm, ORDENES[0])
    await wrapper.vm.guardar()
    expect(api.crearComprobante).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-033 · Notificar la tarea al operario por correo', () => {
  test('al asignar una fase se envía el correo al operario con la tarea, prioridad y fecha límite', async () => {
    const { wrapper } = await montar()
    await llenarNuevaOrden(wrapper.vm)
    agregarMaterial(wrapper.vm, 1, 10)
    wrapper.vm.operarioParaFase = 2; wrapper.vm.descripcionFaseNueva = 'Corte'; wrapper.vm.agregarFase()
    await wrapper.vm.guardar()

    expect(mockNotificarTarea).toHaveBeenCalledWith('F1 — Corte', { email: 'oscar@demo.com', nombre: 'Oscar Operario' }, 50, 'Alta', '2099-12-01')
  })

  test('las fases que ya existían no vuelven a notificarse', async () => {
    const { wrapper } = await montar()
    await abrirEdicion(wrapper.vm, ORDENES[0])
    await wrapper.vm.guardar()
    expect(mockNotificarTarea).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-034 · Ver estadísticas de producción', () => {
  test('las tarjetas muestran total, en proceso, completadas y retrasadas', async () => {
    const { wrapper } = await montar()
    expect(Object.fromEntries(wrapper.vm.kpis.map(k => [k.label, k.valor])))
      .toEqual({ 'Total órdenes': 4, 'En proceso': 2, Completadas: 1, Retrasadas: 1 })
  })
})
