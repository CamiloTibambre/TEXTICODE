// ═══════════════════════════════════════════════════════════════
// MÓDULO 7 · ADMINISTRADOR – REPORTES (RF-041 a RF-043)
// Vista: src/views/admin/Reportes.vue · Integrante: Andrés Lancheros
// ═══════════════════════════════════════════════════════════════
import { montarVista, flushPromises } from './helpers/montar.js'
import * as api from '../src/services/api.js'
import Reportes from '../src/views/admin/Reportes.vue'

jest.mock('../src/services/api.js', () => ({
  getMateriales: jest.fn(), getOrdenes: jest.fn(), getUsuarios: jest.fn(), getEficienciaOperarios: jest.fn(), getHistorialInventario: jest.fn(),
}))

// Fechas a mitad de mes para que la zona horaria no cambie el mes
const o = (id, mes, estado, extra = {}) => ({
  Id_Orden: id, Producto: `Prenda ${id}`, Cliente: 'Carla Cliente', Operario: 'Oscar Operario', Estado: estado,
  Cantidad: 100, Unidades_Realizadas: estado === 'Completada' ? 100 : 40, Fecha_Limite: `2026-${mes}-15T12:00:00Z`, ...extra,
})
const ORDENES = [
  o(1, '05', 'Completada'), o(2, '06', 'Completada'), o(3, '07', 'En Proceso'), o(4, '08', 'Completada'),
  o(5, '09', 'Retrasada'), o(6, '10', 'Completada'), o(7, '10', 'En Proceso'), o(8, '11', 'En Proceso'),
]
const MATERIALES = [
  { Id_Material: 1, Nombre_Material: 'Tela Oxford azul', Categoria: 'Telas', Stock_Actual: 120, Unidad: 'metros', Stock_Minimo: 30, Stock_Maximo: 300 },
  { Id_Material: 2, Nombre_Material: 'Botones nácar', Categoria: 'Accesorios', Stock_Actual: 5, Unidad: 'unidades', Stock_Minimo: 100, Stock_Maximo: 1000 },
]
const EFICIENCIA = [{ Nombre_Completo: 'Oscar Operario', rendimiento: 'Alto', prendas_por_dia: 10, total_unidades_producidas: 900, ordenes_completadas: 4, ordenes_en_retraso: 0 }]

let pdf, zip
function jsPDFSimulado() {
  pdf = { textos: [], guardado: null }
  window.jspdf = {
    jsPDF: function () {
      return new Proxy({ internal: { pageSize: { width: 210, height: 297 }, getNumberOfPages: () => 1 } }, {
        get(obj, prop) {
          if (prop in obj) return obj[prop]
          if (prop === 'then') return undefined          // el documento no es una promesa
          if (prop === 'text') return t => pdf.textos.push([].concat(t).join(' '))
          if (prop === 'splitTextToSize') return t => [t]
          if (prop === 'save') return nombre => { pdf.guardado = nombre }
          if (prop === 'output') return () => 'blob:vista-previa'
          return () => {}
        },
      })
    },
  }
}
function JSZipSimulado() {
  zip = { archivos: {} }
  window.JSZip = class { file(n, c) { zip.archivos[n] = c } async generateAsync() { return new Blob(['xlsx']) } }
}

beforeEach(() => {
  document.body.innerHTML = ''
  jest.clearAllMocks()
  api.getOrdenes.mockResolvedValue(ORDENES)
  api.getUsuarios.mockResolvedValue([])
  api.getMateriales.mockResolvedValue(MATERIALES)
  api.getEficienciaOperarios.mockResolvedValue(EFICIENCIA)
  api.getHistorialInventario.mockResolvedValue([{ ...MATERIALES[0], Stock_Actual: '90' }])
  jsPDFSimulado(); JSZipSimulado()
  window.open = jest.fn()
  URL.createObjectURL = jest.fn(() => 'blob:descarga'); URL.revokeObjectURL = jest.fn()
})

const montar = () => montarVista(Reportes, { ruta: '/admin/reportes' })
const reporte = (vm, titulo) => vm.reportesData.find(r => r.titulo === titulo)

// ─────────────────────────────────────────────────────────────
describe('RF-041 · Ver indicadores de pedidos', () => {
  test('las tarjetas muestran pedidos totales, completados, tasa de completación y en proceso', async () => {
    const { wrapper } = await montar()
    expect(Object.fromEntries(wrapper.vm.kpis.map(k => [k.label, k.valor]))).toEqual({
      'Pedidos totales': 8, 'Pedidos completados': 4, 'Tasa de completación': 50, 'Pedidos en proceso': 3,
    })
    expect(wrapper.vm.kpis[1].nota).toBe('50% del total')
  })

  test('el gráfico muestra los últimos 6 meses con completados y pendientes', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.meses.map(m => `${m.nombre}:${m.completadas}/${m.pendientes}`))
      .toEqual(['Jun:1/0', 'Jul:0/1', 'Ago:1/0', 'Sept:0/1', 'Oct:1/1', 'Nov:0/1'])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-042 · Listar reportes por tipo y período', () => {
  test('lista los cuatro reportes: pedidos mensuales, pedidos pendientes, eficiencia e inventario', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.reportes.map(r => r.titulo)).toEqual([
      'Reporte de Pedidos Mensuales', 'Reporte de Pedidos Pendientes', 'Reporte de Eficiencia Operaria', 'Reporte de Inventario',
    ])
  })

  test.each([
    ['Pedidos', ['Reporte de Pedidos Mensuales', 'Reporte de Pedidos Pendientes']],
    ['Eficiencia', ['Reporte de Eficiencia Operaria']],
    ['Inventario', ['Reporte de Inventario']],
  ])('filtra por tipo: %s', async (tipo, esperados) => {
    const { wrapper } = await montar()
    wrapper.vm.tipoFiltro = tipo
    expect(wrapper.vm.reportes.map(r => r.titulo)).toEqual(esperados)
  })

  test('solo ofrece meses que tienen órdenes, del más reciente al más antiguo', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.mesesDisponibles).toEqual(['2026-11', '2026-10', '2026-09', '2026-08', '2026-07', '2026-06', '2026-05'])
  })

  test('al elegir un mes, los reportes de pedidos y de eficiencia se calculan solo con ese mes', async () => {
    const { wrapper } = await montar()
    wrapper.vm.mesFiltro = '2026-10'
    await flushPromises()

    expect(reporte(wrapper.vm, 'Reporte de Pedidos Mensuales').subtitulo).toBe('2 órdenes registradas · Octubre 2026')
    expect(reporte(wrapper.vm, 'Reporte de Pedidos Pendientes').subtitulo).toBe('1 pedidos pendientes · Octubre 2026')
    expect(api.getEficienciaOperarios).toHaveBeenLastCalledWith({ periodo: '2026-10' })
  })

  test('el inventario de un mes se pide al historial de movimientos', async () => {
    const { wrapper } = await montar()
    wrapper.vm.mesFiltro = '2026-10'
    await flushPromises()
    expect(api.getHistorialInventario).toHaveBeenCalledWith('2026-10')
    expect(reporte(wrapper.vm, 'Reporte de Inventario').subtitulo).toBe('1 material(es) registrado(s) · Octubre 2026')
    expect(wrapper.vm.obtenerFilasReporte(reporte(wrapper.vm, 'Reporte de Inventario'))[0].stock).toBe('90 metros')
  })

  test('sin mes elegido, el inventario usa el stock actual y cuenta los de stock bajo', async () => {
    const { wrapper } = await montar()
    expect(reporte(wrapper.vm, 'Reporte de Inventario').subtitulo).toBe('2 material(es) registrado(s) · 1 con stock bajo')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-043 · Visualizar y exportar reportes', () => {
  test('la vista previa genera el PDF y lo abre sin descargarlo', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.verReporte(reporte(wrapper.vm, 'Reporte de Pedidos Pendientes'))
    expect(window.open).toHaveBeenCalledWith('blob:vista-previa', '_blank')
    expect(pdf.guardado).toBeNull()
    expect(pdf.textos.join(' | ')).toContain('REPORTE DE PEDIDOS PENDIENTES')
  })

  test('descarga el PDF con las filas del reporte', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.descargar(reporte(wrapper.vm, 'Reporte de Pedidos Mensuales'))
    expect(pdf.guardado).toBe('reporte-de-pedidos-mensuales.pdf')
    const texto = pdf.textos.join(' | ')
    expect(texto).toContain('ORD-0001')
    expect(texto).toContain('Prenda 8')
    expect(texto).toContain('Completada')
  })

  test('exporta a Excel (.xlsx) con encabezados y datos del reporte', async () => {
    const { wrapper } = await montar()
    const enlaces = []
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { enlaces.push(this.download) })
    await wrapper.vm.exportarExcel(reporte(wrapper.vm, 'Reporte de Eficiencia Operaria'))

    expect(enlaces).toEqual(['reporte-de-eficiencia-operaria.xlsx'])
    const hoja = zip.archivos['xl/worksheets/sheet1.xml']
    for (const dato of ['Operario', 'Rendimiento', 'Prendas Dia', 'Oscar Operario', 'Alto']) expect(hoja).toContain(dato)
    expect(Object.keys(zip.archivos)).toEqual(expect.arrayContaining(['[Content_Types].xml', 'xl/workbook.xml', 'xl/styles.xml']))
  })

  test('las filas del reporte de pendientes excluyen los pedidos completados', async () => {
    const { wrapper } = await montar()
    const filas = wrapper.vm.obtenerFilasReporte(reporte(wrapper.vm, 'Reporte de Pedidos Pendientes'))
    expect(filas.map(f => f.estado)).not.toContain('Completada')
    expect(filas[0]).toEqual({ codigo: 'ORD-0003', producto: 'Prenda 3', cliente: 'Carla Cliente', operario: 'Oscar Operario', estado: 'En Proceso', progreso: '40%' })
  })
})
