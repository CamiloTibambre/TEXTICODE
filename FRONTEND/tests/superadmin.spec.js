// ═══════════════════════════════════════════════════════════════
// SUPERADMIN · RF-048 Gestionar empresas · RF-049 Gestionar administradores
//            · RF-051 Consultar estadísticas de correo
// Vista: src/views/superadmin/GestionEmpresas.vue
// ═══════════════════════════════════════════════════════════════
import { montarVista, flushPromises } from './helpers/montar.js'
import { useConfirmState } from '../src/composables/useConfirm.js'
import * as api from '../src/services/api.js'
import GestionEmpresas from '../src/views/superadmin/GestionEmpresas.vue'

jest.mock('../src/services/api.js', () => ({
  getEmpresas: jest.fn(), crearEmpresa: jest.fn(), actualizarEmpresa: jest.fn(), desactivarEmpresa: jest.fn(), activarEmpresa: jest.fn(),
  getEstadisticasCorreos: jest.fn(), getAdministradoresEmpresa: jest.fn(), actualizarAdministradorEmpresa: jest.fn(),
  inactivarAdministradorEmpresa: jest.fn(), activarAdministradorEmpresa: jest.fn(),
}))

const EMPRESAS = [
  { Id_Empresa: 1, Nombre_Empresa: 'Demo',                 Slug: 'demo',                 Estado: 'activa' },
  { Id_Empresa: 5, Nombre_Empresa: 'Confecciones Andinas', Slug: 'confecciones-andinas', Estado: 'activa', Nombre_Comercial: 'Andinas', Email_Notificaciones: 'respuestas@andinas.com' },
  { Id_Empresa: 7, Nombre_Empresa: 'Textiles del Sur',     Slug: 'textiles-sur',         Estado: 'inactiva' },
]
const ADMINS = [{ Id_Usuario: 50, Nombre_Completo: 'Pedro Pérez', Nombre_Usuario: 'pperez', Correo: 'pedro@andinas.com', Telefono: '3001234567', Estado: 'activo' }]

beforeEach(() => {
  document.body.innerHTML = ''
  jest.clearAllMocks()
  api.getEmpresas.mockResolvedValue(EMPRESAS)
  api.getAdministradoresEmpresa.mockResolvedValue(ADMINS)
  for (const fn of ['crearEmpresa', 'actualizarEmpresa', 'desactivarEmpresa', 'activarEmpresa', 'actualizarAdministradorEmpresa',
    'inactivarAdministradorEmpresa', 'activarAdministradorEmpresa']) api[fn].mockResolvedValue({})
})

const montar = () => montarVista(GestionEmpresas, { ruta: '/superadmin/empresas' })

// ─────────────────────────────────────────────────────────────
describe('RF-048 · Gestionar empresas', () => {
  test('crea una empresa junto con su administrador (el slug se genera del nombre)', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirCrear()
    wrapper.vm.formCrear.nombreEmpresa = 'Confección Ñandú'
    wrapper.vm.autoSlug()
    Object.assign(wrapper.vm.formCrear, { nombreCompleto: 'Lucía Torres', nombreUsuario: 'ltorres', correo: 'lucia@nandu.com', telefono: '3011112233', contrasena: 'Nandu#2026' })
    await wrapper.vm.guardarCrear()

    expect(api.crearEmpresa).toHaveBeenCalledWith({
      empresa: { Nombre_Empresa: 'Confección Ñandú', Slug: 'confeccion-nandu' },
      administrador: { Nombre_Completo: 'Lucía Torres', Nombre_Usuario: 'ltorres', Correo: 'lucia@nandu.com', Telefono: '3011112233', Contrasena: 'Nandu#2026' },
    })
  })

  test('no crea la empresa si el administrador no tiene una contraseña segura', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirCrear()
    Object.assign(wrapper.vm.formCrear, { nombreEmpresa: 'Nueva', slug: 'nueva', nombreCompleto: 'Lucía Torres', nombreUsuario: 'ltorres', correo: 'lucia@x.com', contrasena: 'nueva' })
    await wrapper.vm.guardarCrear()
    expect(api.crearEmpresa).not.toHaveBeenCalled()
  })

  test('edita nombre, slug, nombre comercial y correo de respuestas', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirEditar(EMPRESAS[1])
    expect(wrapper.vm.formEditar).toEqual({ nombreEmpresa: 'Confecciones Andinas', slug: 'confecciones-andinas', nombreComercial: 'Andinas', emailNotificaciones: 'respuestas@andinas.com' })

    Object.assign(wrapper.vm.formEditar, { nombreEmpresa: 'Andinas SAS', slug: 'andinas-sas', nombreComercial: 'Andinas Moda', emailNotificaciones: 'hola@andinas.com' })
    await wrapper.vm.guardarEditar()
    expect(api.actualizarEmpresa).toHaveBeenCalledWith(5, {
      Nombre_Empresa: 'Andinas SAS', Slug: 'andinas-sas', Nombre_Comercial: 'Andinas Moda', Email_Notificaciones: 'hola@andinas.com',
    })
  })

  test('para desactivar hay que confirmar escribiendo el nombre de la empresa', async () => {
    const { wrapper } = await montar()
    wrapper.vm.pedirDesactivar(EMPRESAS[1])

    wrapper.vm.confirmEmpresa.texto = 'otra cosa'
    await wrapper.vm.confirmarDesactivar()
    expect(api.desactivarEmpresa).not.toHaveBeenCalled()

    wrapper.vm.confirmEmpresa.texto = 'confecciones andinas'      // sin importar mayúsculas
    await wrapper.vm.confirmarDesactivar()
    expect(api.desactivarEmpresa).toHaveBeenCalledWith(5)
  })

  test('activa una empresa inactiva', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.activar(EMPRESAS[2])
    expect(api.activarEmpresa).toHaveBeenCalledWith(7)
  })

  test('busca por nombre o slug y filtra por estado', async () => {
    const { wrapper } = await montar()
    wrapper.vm.busqueda = 'andinas'
    expect(wrapper.vm.empresasFiltradas.map(e => e.Id_Empresa)).toEqual([5])
    wrapper.vm.busqueda = 'textiles-sur'
    expect(wrapper.vm.empresasFiltradas.map(e => e.Id_Empresa)).toEqual([7])
    wrapper.vm.busqueda = ''
    wrapper.vm.filtroEstado = 'activa'
    expect(wrapper.vm.empresasFiltradas.map(e => e.Id_Empresa)).toEqual([1, 5])
    wrapper.vm.filtroEstado = 'inactiva'
    expect(wrapper.vm.empresasFiltradas.map(e => e.Id_Empresa)).toEqual([7])
  })

  test('las tarjetas cuentan empresas totales, activas e inactivas', async () => {
    const { wrapper } = await montar()
    expect(Object.fromEntries(wrapper.vm.kpis.map(k => [k.label, k.valor]))).toEqual({ 'Total empresas': 3, Activas: 2, Inactivas: 1 })
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-049 · Gestionar administradores de empresa', () => {
  test('consulta los administradores de la empresa', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.abrirAdmins(EMPRESAS[1])
    expect(api.getAdministradoresEmpresa).toHaveBeenCalledWith(5)
    expect(wrapper.vm.modalAdmins.lista[0].Nombre_Completo).toBe('Pedro Pérez')
  })

  test('edita los datos de un administrador', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.abrirAdmins(EMPRESAS[1])
    wrapper.vm.abrirEditarAdmin(ADMINS[0])
    Object.assign(wrapper.vm.formAdmin, { nombreCompleto: 'Pedro Andrés Pérez', correo: 'pedro.a@andinas.com' })
    await wrapper.vm.guardarAdmin()
    expect(api.actualizarAdministradorEmpresa).toHaveBeenCalledWith(5, 50, expect.objectContaining({
      Nombre_Completo: 'Pedro Andrés Pérez', Nombre_Usuario: 'pperez', Correo: 'pedro.a@andinas.com',
    }))
  })

  test('desactiva un administrador después de confirmar', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.abrirAdmins(EMPRESAS[1])
    const { estado, responder } = useConfirmState()
    const promesa = wrapper.vm.pedirInactivarAdmin(ADMINS[0])
    expect(estado.titulo).toBe('¿Desactivar a Pedro Pérez?')
    responder(true)
    await promesa
    expect(api.inactivarAdministradorEmpresa).toHaveBeenCalledWith(5, 50)
  })

  test('activa un administrador', async () => {
    const { wrapper } = await montar()
    await wrapper.vm.abrirAdmins(EMPRESAS[1])
    await wrapper.vm.activarAdmin({ ...ADMINS[0], Estado: 'inactivo' })
    expect(api.activarAdministradorEmpresa).toHaveBeenCalledWith(5, 50)
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-051 · Consultar estadísticas de correo', () => {
  test('muestra los correos del día en SendGrid y los enviados por empresa', async () => {
    api.getEstadisticasCorreos.mockResolvedValue({
      fecha: '2026-11-08',
      global: { enviados: 42, entregados: 40, abiertos: 18, rebotes: 1, spam: 0 },
      empresas: [{ Id_Empresa: 1, Nombre_Empresa: 'Demo', enviados: 30, errores: 1 }, { Id_Empresa: 5, Nombre_Empresa: 'Confecciones Andinas', enviados: 12, errores: 0 }],
    })
    const { wrapper } = await montar()
    wrapper.vm.abrirCorreos()
    await flushPromises()

    expect(api.getEstadisticasCorreos).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)) // hoy, en hora de Bogotá
    const texto = wrapper.text()
    expect(texto).toMatch(/Enviados\s*42/)
    expect(texto).toMatch(/Entregados\s*40/)
    expect(texto).toContain('Confecciones Andinas')
  })

  test('permite consultar otro día', async () => {
    api.getEstadisticasCorreos.mockResolvedValue({ fecha: '2026-11-01', global: null, errorGlobal: null, empresas: [] })
    const { wrapper } = await montar()
    wrapper.vm.abrirCorreos()
    wrapper.vm.modalCorreos.fecha = '2026-11-01'
    await wrapper.vm.cargarCorreos()
    expect(api.getEstadisticasCorreos).toHaveBeenLastCalledWith('2026-11-01')
  })

  test('si SendGrid falla, muestra el aviso y conserva los datos por empresa', async () => {
    api.getEstadisticasCorreos.mockResolvedValue({
      fecha: '2026-11-08', global: null, errorGlobal: 'No se pudieron consultar las estadísticas de SendGrid.',
      empresas: [{ Id_Empresa: 1, Nombre_Empresa: 'Demo', enviados: 3, errores: 0 }],
    })
    const { wrapper } = await montar()
    wrapper.vm.abrirCorreos()
    await flushPromises()
    expect(wrapper.text()).toContain('No se pudieron consultar las estadísticas de SendGrid.')
    expect(wrapper.text()).toContain('Demo')
  })
})
