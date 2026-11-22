// ═══════════════════════════════════════════════════════════════
// MÓDULO 3 · ADMINISTRADOR – GESTIÓN DE CLIENTES (RF-015 a RF-018)
// Vista: src/views/admin/GestionClientes.vue
// ═══════════════════════════════════════════════════════════════
import { montarVista } from './helpers/montar.js'
import * as api from '../src/services/api.js'
import GestionClientes from '../src/views/admin/GestionClientes.vue'

jest.mock('../src/services/api.js', () => ({ getUsuarios: jest.fn(), getOrdenes: jest.fn(), getComprobantes: jest.fn() }))

const USUARIOS = [
  { Id_Usuario: 3, Nombre_Completo: 'Carla Cliente', Correo: 'carla@demo.com', Telefono: '+57 300 111 2222', Rol: 'cliente', Estado: 'activo' },
  { Id_Usuario: 4, Nombre_Completo: 'Bruno Díaz',    Correo: 'bruno@demo.com', Telefono: '+57 300 333 4444', Rol: 'cliente', Estado: 'activo' },
  { Id_Usuario: 6, Nombre_Completo: 'Zoe Inactiva',  Correo: 'zoe@demo.com',   Telefono: '+57 300 555 6666', Rol: 'cliente', Estado: 'inactivo' },
  { Id_Usuario: 2, Nombre_Completo: 'Oscar Operario', Correo: 'oscar@demo.com', Telefono: '—', Rol: 'operario', Estado: 'activo' },
]
const ORDENES = [
  { Id_Orden: 40, Id_Cliente: 3, Producto: 'Camisa polo', Descripcion: 'Camisa polo bordada', Cantidad: 150, Estado: 'Completada', Fecha_Limite: '2026-11-20T00:00:00Z', Observaciones: 'Entregar en caja' },
  { Id_Orden: 41, Id_Cliente: 3, Producto: 'Pantalón dril', Cantidad: 80, Estado: 'En Proceso', Fecha_Limite: '2026-12-01T00:00:00Z' },
  { Id_Orden: 42, Id_Cliente: 4, Producto: 'Chaqueta', Cantidad: 20, Estado: 'Completada', Fecha_Limite: '2026-10-15T00:00:00Z' },
]
const COMPROBANTES = [
  { Id_Comprobante: 12, Id_Orden: 40, Estado: 'Entregado' },
  { Id_Comprobante: 13, Id_Orden: 41, Estado: 'Pendiente' },
  { Id_Comprobante: 14, Id_Orden: 42, Estado: 'Entregado' },
]

beforeEach(() => {
  document.body.innerHTML = ''
  jest.clearAllMocks()
  delete window.jspdf
  api.getUsuarios.mockResolvedValue(USUARIOS)
  api.getOrdenes.mockResolvedValue(ORDENES)
  api.getComprobantes.mockResolvedValue(COMPROBANTES)
})

const montar = () => montarVista(GestionClientes, { ruta: '/admin/clientes' })

// ─────────────────────────────────────────────────────────────
describe('RF-015 · Consultar listado de clientes', () => {
  test('lista solo clientes activos con nombre, correo y teléfono', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.clientes).toEqual([
      expect.objectContaining({ nombre: 'Carla Cliente', email: 'carla@demo.com', telefono: '+57 300 111 2222' }),
      expect.objectContaining({ nombre: 'Bruno Díaz', email: 'bruno@demo.com', telefono: '+57 300 333 4444' }),
    ])
    expect(wrapper.text()).toContain('Carla Cliente')
    expect(wrapper.text()).not.toContain('Zoe Inactiva')
  })

  test('el contador muestra cuántos clientes activos hay', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.kpis.find(k => k.label === 'Clientes activos').valor).toBe(2)
  })

  test('busca por nombre o por correo', async () => {
    const { wrapper } = await montar()
    wrapper.vm.busqueda = 'bruno'
    expect(wrapper.vm.clientesFiltradosOrdenados.map(c => c.nombre)).toEqual(['Bruno Díaz'])
    wrapper.vm.busqueda = 'carla@demo'
    expect(wrapper.vm.clientesFiltradosOrdenados.map(c => c.nombre)).toEqual(['Carla Cliente'])
  })

  test('ordena por nombre y por correo', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.clientesFiltradosOrdenados.map(c => c.nombre)).toEqual(['Bruno Díaz', 'Carla Cliente'])
    wrapper.vm.sortClientes('nombre')
    expect(wrapper.vm.clientesFiltradosOrdenados.map(c => c.nombre)).toEqual(['Carla Cliente', 'Bruno Díaz'])
    wrapper.vm.sortClientes('email')
    expect(wrapper.vm.clientesFiltradosOrdenados.map(c => c.email)).toEqual(['bruno@demo.com', 'carla@demo.com'])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-016 · Consultar comprobantes por cliente', () => {
  test('al desplegar un cliente se ven solo los comprobantes de sus órdenes completadas', async () => {
    const { wrapper } = await montar()
    const comps = wrapper.vm.comprobantesDeCliente(3)
    expect(comps).toHaveLength(1)                    // la orden 41 está en proceso: no aparece
    expect(comps[0]).toEqual(expect.objectContaining({ numero: '0012', fecha: '20/11/2026', estado: 'Completada' }))
  })

  test('el desplegable se abre y se cierra', async () => {
    const { wrapper } = await montar()
    wrapper.vm.toggleCliente(3)
    expect(wrapper.vm.clientesExpandido[3]).toBe(true)
    wrapper.vm.toggleCliente(3)
    expect(wrapper.vm.clientesExpandido[3]).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-017 · Ver detalle del comprobante', () => {
  test('abre el comprobante en el formato oficial con cliente, fecha, producto, cantidad, estado, observaciones y firmas', async () => {
    const { wrapper } = await montar()
    wrapper.vm.verDetalle(wrapper.vm.comprobantesDeCliente(3)[0])
    await wrapper.vm.$nextTick()

    const modal = wrapper.find('.modal')
    expect(modal.exists()).toBe(true)
    const texto = modal.text()
    for (const dato of ['N.° 0012', 'Carla Cliente', 'carla@demo.com', '20/11/2026', 'Camisa polo', '150', 'Completada', 'Entregar en caja', 'Entregado por']) {
      expect(texto).toContain(dato)
    }
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-018 · Descargar comprobante en PDF', () => {
  function jsPDFSimulado() {
    const llamadas = { texto: [], guardado: null }
    window.jspdf = {
      jsPDF: function () {
        return new Proxy({ internal: { pageSize: { width: 210, height: 297 } } }, {
          get(obj, prop) {
            if (prop in obj) return obj[prop]
            if (prop === 'text') return (t) => llamadas.texto.push(String(t))
            if (prop === 'save') return (nombre) => { llamadas.guardado = nombre }
            return () => {}
          },
        })
      },
    }
    return llamadas
  }

  test('genera el PDF con los datos del comprobante y lo descarga con su número', async () => {
    const pdf = jsPDFSimulado()
    const { wrapper } = await montar()
    const orden = wrapper.vm.comprobantesDeCliente(3)[0]
    await wrapper.vm.descargarPDF(orden)

    expect(pdf.guardado).toBe('comprobante-0012.pdf')
    const texto = pdf.texto.join(' | ')
    expect(texto).toContain('Carla Cliente')
    expect(texto).toContain('Camisa polo')
    expect(orden.descargando).toBe(false)
  })
})
