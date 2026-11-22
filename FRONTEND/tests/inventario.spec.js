// ═══════════════════════════════════════════════════════════════
// MÓDULO 4 · ADMINISTRADOR – GESTIÓN DE INVENTARIO (RF-019 a RF-023)
// Vista: src/views/admin/GestionInventario.vue
// ═══════════════════════════════════════════════════════════════
import { montarVista } from './helpers/montar.js'
import { useConfirmState } from '../src/composables/useConfirm.js'
import * as api from '../src/services/api.js'
import GestionInventario from '../src/views/admin/GestionInventario.vue'

jest.mock('../src/services/api.js', () => ({
  getMateriales: jest.fn(), crearMaterial: jest.fn(), actualizarMaterial: jest.fn(), eliminarMaterial: jest.fn(), getUsuarios: jest.fn(),
}))

const MATERIALES = [
  { Id_Material: 1, Nombre_Material: 'Tela Oxford azul', Categoria: 'Telas',      Stock_Actual: 120, Unidad: 'metros',   Stock_Minimo: 30, Stock_Maximo: 300, Id_Cliente: 3, Nombre_Cliente: 'Carla Cliente', Fecha: '2026-11-01T10:00:00Z' },
  { Id_Material: 2, Nombre_Material: 'Hilo negro',       Categoria: 'Hilos',      Stock_Actual: 5,   Unidad: 'conos',    Stock_Minimo: 10, Stock_Maximo: 50,  Id_Cliente: null, Nombre_Cliente: null, Fecha: '2026-10-20T10:00:00Z' },
  { Id_Material: 3, Nombre_Material: 'Botones nácar',    Categoria: 'Accesorios', Stock_Actual: 0,   Unidad: 'unidades', Stock_Minimo: 100, Stock_Maximo: 1000, Id_Cliente: 4, Nombre_Cliente: 'Bruno Díaz', Fecha: '2026-11-05T10:00:00Z' },
  { Id_Material: 4, Nombre_Material: 'Tela Lino',        Categoria: 'Telas',      Stock_Actual: 400, Unidad: 'metros',   Stock_Minimo: 50, Stock_Maximo: 200, Id_Cliente: null, Nombre_Cliente: null, Fecha: '2026-09-15T10:00:00Z' },
]

beforeEach(() => {
  jest.useFakeTimers()
  document.body.innerHTML = ''
  jest.clearAllMocks()
  api.getMateriales.mockResolvedValue(MATERIALES)
  api.getUsuarios.mockResolvedValue([{ Id_Usuario: 3, Nombre_Completo: 'Carla Cliente', Rol: 'cliente', Estado: 'activo' }])
  api.crearMaterial.mockResolvedValue({ Id_Material: 9 })
  api.actualizarMaterial.mockResolvedValue({})
  api.eliminarMaterial.mockResolvedValue({})
})
afterEach(() => jest.useRealTimers())

const montar = () => montarVista(GestionInventario, { ruta: '/admin/inventario' })
const nombres = lista => lista.map(m => m.nombre)

// ─────────────────────────────────────────────────────────────
describe('RF-019 · Registrar material', () => {
  test('envía nombre, categoría, stock, unidad, mínimo, máximo y cliente asociado', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirModal()
    Object.assign(wrapper.vm.form, { nombre: 'Cremalleras', categoria: 'Accesorios', stock: 40, unidad: 'unidades', minimo: 10, maximo: 200, Id_Cliente: 3 })
    await wrapper.vm.guardar()

    expect(api.crearMaterial).toHaveBeenCalledWith({
      Nombre_Material: 'Cremalleras', Categoria: 'Accesorios', Stock_Actual: 40, Unidad: 'unidades',
      Stock_Minimo: 10, Stock_Maximo: 200, Id_Cliente: 3,
    })
  })

  test('las categorías disponibles son telas, hilos y accesorios', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.categorias).toEqual(['Telas', 'Hilos', 'Accesorios'])
  })

  test('el estado no se escribe a mano: se calcula solo a partir del stock', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.calcularEstado({ stock: 40, minimo: 10 }).estado).toBe('En Stock')
    expect(wrapper.vm.form).not.toHaveProperty('estado')
  })

  test('valida los campos obligatorios y que el máximo no sea menor que el mínimo', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirModal()
    Object.assign(wrapper.vm.form, { nombre: '', categoria: '', unidad: '', minimo: 50, maximo: 20 })
    await wrapper.vm.guardar()

    expect(wrapper.vm.v.error('nombre')).toBe('Escribe el nombre del material.')
    expect(wrapper.vm.v.error('categoria')).toBe('Elige una categoría.')
    expect(wrapper.vm.v.error('maximo')).toBe('Debe ser mayor o igual al mínimo.')
    expect(api.crearMaterial).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-020 · Editar material', () => {
  test('carga el material en el formulario y guarda los cambios', async () => {
    const { wrapper } = await montar()
    const hilo = wrapper.vm.materiales.find(m => m.id === 2)
    wrapper.vm.abrirModal(hilo)
    expect(wrapper.vm.editando).toBe(true)
    expect(wrapper.vm.form).toEqual(expect.objectContaining({ nombre: 'Hilo negro', stock: 5, minimo: 10, maximo: 50 }))

    wrapper.vm.form.stock = 30
    await wrapper.vm.guardar()
    expect(api.actualizarMaterial).toHaveBeenCalledWith(2, expect.objectContaining({ Nombre_Material: 'Hilo negro', Stock_Actual: 30 }))
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-021 · Eliminar material', () => {
  test('pide confirmación y, al aceptar, elimina el material de la lista', async () => {
    const { wrapper } = await montar()
    const { estado, responder } = useConfirmState()
    const hilo = wrapper.vm.materiales.find(m => m.id === 2)

    const promesa = wrapper.vm.eliminar(hilo)
    expect(estado.titulo).toBe('¿Eliminar "Hilo negro"?')
    responder(true)
    await promesa
    jest.advanceTimersByTime(400)

    expect(api.eliminarMaterial).toHaveBeenCalledWith(2)
    expect(nombres(wrapper.vm.materiales)).not.toContain('Hilo negro')
  })

  test('si se cancela, el material no se elimina', async () => {
    const { wrapper } = await montar()
    const { responder } = useConfirmState()
    const promesa = wrapper.vm.eliminar(wrapper.vm.materiales[0])
    responder(false)
    await promesa
    expect(api.eliminarMaterial).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-022 · Buscar, filtrar y ordenar materiales', () => {
  test('busca por nombre', async () => {
    const { wrapper } = await montar()
    wrapper.vm.busqueda = 'tela'
    expect(nombres(wrapper.vm.materialesFiltrados)).toEqual(['Tela Lino', 'Tela Oxford azul'])
    wrapper.vm.busqueda = 'HILO'                                // sin importar mayúsculas
    expect(nombres(wrapper.vm.materialesFiltrados)).toEqual(['Hilo negro'])
  })

  test('filtra por categoría', async () => {
    const { wrapper } = await montar()
    wrapper.vm.categoriaFiltro = 'Hilos'
    expect(nombres(wrapper.vm.materialesFiltrados)).toEqual(['Hilo negro'])
  })

  test.each([
    ['nombre',    m => m.nombre,    ['Botones nácar', 'Hilo negro', 'Tela Lino', 'Tela Oxford azul']],
    ['categoria', m => m.categoria, ['Accesorios', 'Hilos', 'Telas', 'Telas']],
    ['stock',     m => m.stock,     [0, 5, 120, 400]],
    ['estado',    m => m.estado,    ['Agotado', 'En Stock', 'En Stock', 'Stock Bajo']],
    ['fecha',     m => m.fecha,     ['2026-09-15', '2026-10-20', '2026-11-01', '2026-11-05']],
  ])('ordena por %s', async (columna, campo, esperado) => {
    const { wrapper } = await montar()
    if (columna !== 'nombre') wrapper.vm.doSort(columna)
    expect(wrapper.vm.materialesFiltrados.map(campo)).toEqual(esperado)
    wrapper.vm.doSort(columna)                                  // segundo clic: orden inverso
    expect(wrapper.vm.materialesFiltrados.map(campo)).toEqual([...esperado].reverse())
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-023 · Ver niveles y alertas de stock', () => {
  test.each([
    [0, 100, 'Agotado'],
    [5, 10, 'Stock Bajo'],
    [120, 30, 'En Stock'],
  ])('stock %i con mínimo %i → %s', async (stock, minimo, esperado) => {
    const { wrapper } = await montar()
    expect(wrapper.vm.calcularEstado({ stock, minimo }).estado).toBe(esperado)
  })

  test('la barra de nivel se calcula frente al stock máximo (y no pasa de 100 %)', async () => {
    const { wrapper } = await montar()
    const porNombre = n => wrapper.vm.materiales.find(m => m.nombre === n)
    expect(wrapper.vm.stockPct(porNombre('Tela Oxford azul'))).toBe(40)   // 120 de 300
    expect(wrapper.vm.stockPct(porNombre('Hilo negro'))).toBe(10)         // 5 de 50
    expect(wrapper.vm.stockPct(porNombre('Tela Lino'))).toBe(100)         // 400 de 200 → tope 100
  })

  test('el panel de alertas lista los materiales con stock bajo o agotado', async () => {
    const { wrapper } = await montar()
    expect(nombres(wrapper.vm.alertas)).toEqual(['Hilo negro', 'Botones nácar'])
    expect(wrapper.vm.agotados).toBe(1)
    expect(wrapper.find('.alert-banner').text()).toContain('2 materiales necesitan reposición')
  })

  test('la tabla de alertas muestra el cliente asociado a cada material', async () => {
    const { wrapper } = await montar()
    wrapper.vm.soloAlertas = true
    await wrapper.vm.$nextTick()
    const filas = wrapper.findAll('tbody tr').map(tr => tr.text())
    expect(filas.find(f => f.includes('Botones nácar'))).toContain('Bruno Díaz')
    expect(filas).toHaveLength(2)
  })
})
