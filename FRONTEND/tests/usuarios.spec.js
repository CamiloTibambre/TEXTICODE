// ═══════════════════════════════════════════════════════════════
// MÓDULO 2 · ADMINISTRADOR – GESTIÓN DE USUARIOS (RF-008 a RF-014)
// Vista: src/views/admin/GestionUsuarios.vue y src/components/PerfilDrawer.vue
// ═══════════════════════════════════════════════════════════════
import { montarVista, flushPromises } from './helpers/montar.js'
import { useConfirmState } from '../src/composables/useConfirm.js'
import * as api from '../src/services/api.js'
import GestionUsuarios from '../src/views/admin/GestionUsuarios.vue'
import PerfilDrawer from '../src/components/PerfilDrawer.vue'

jest.mock('../src/services/api.js', () => ({
  getUsuarios: jest.fn(), getRoles: jest.fn(), crearUsuario: jest.fn(), actualizarUsuario: jest.fn(), getUsuario: jest.fn(),
}))

const ROLES = [
  { Id_Rol: 1, Nombre_Rol: 'admin' }, { Id_Rol: 2, Nombre_Rol: 'operario' }, { Id_Rol: 3, Nombre_Rol: 'cliente' },
]
const USUARIOS = [
  { Id_Usuario: 1, Nombre_Completo: 'Ana Admin',      Nombre_Usuario: 'ana',   Correo: 'ana@demo.com',   Telefono: '+57 300 000 0001', Rol: 'admin',    Estado: 'activo',   Fecha_Registro: '2026-01-10' },
  { Id_Usuario: 2, Nombre_Completo: 'Oscar Operario', Nombre_Usuario: 'oscar', Correo: 'oscar@demo.com', Telefono: '+57 300 000 0002', Rol: 'operario', Estado: 'activo',   Fecha_Registro: '2026-02-11' },
  { Id_Usuario: 3, Nombre_Completo: 'Carla Cliente',  Nombre_Usuario: 'carla', Correo: 'carla@demo.com', Telefono: '+57 300 000 0003', Rol: 'cliente',  Estado: 'activo',   Fecha_Registro: '2026-03-12' },
  { Id_Usuario: 4, Nombre_Completo: 'Bruno Cliente',  Nombre_Usuario: 'bruno', Correo: 'bruno@demo.com', Telefono: '+57 300 000 0004', Rol: 'cliente',  Estado: 'activo',   Fecha_Registro: '2026-04-13' },
  { Id_Usuario: 5, Nombre_Completo: 'Iván Inactivo',  Nombre_Usuario: 'ivan',  Correo: 'ivan@demo.com',  Telefono: '+57 300 000 0005', Rol: 'operario', Estado: 'inactivo', Fecha_Registro: '2026-05-14' },
]

beforeEach(() => {
  jest.useFakeTimers()
  localStorage.clear()
  document.body.innerHTML = ''
  jest.clearAllMocks()
  api.getUsuarios.mockResolvedValue(USUARIOS)
  api.getRoles.mockResolvedValue(ROLES)
  api.crearUsuario.mockResolvedValue({ mensaje: 'Usuario creado' })
  api.actualizarUsuario.mockResolvedValue({ mensaje: 'Usuario actualizado' })
})
afterEach(() => jest.useRealTimers())

const montar = () => montarVista(GestionUsuarios, { ruta: '/admin/usuarios' })
function llenarFormulario(vm, datos = {}) {
  Object.assign(vm.form, {
    nombre: 'Laura Gómez', nombreUsuario: 'laura.gomez', email: 'laura@demo.com',
    telefono: '3001234567', Id_Rol: 2, contrasena: 'Operaria#2026', ...datos,
  })
}

// ─────────────────────────────────────────────────────────────
describe('RF-008 · Crear usuario', () => {
  test('envía nombre, usuario, correo, teléfono (+57), rol y contraseña al crear', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirModal()
    llenarFormulario(wrapper.vm)
    await wrapper.vm.guardarUsuario()

    expect(api.crearUsuario).toHaveBeenCalledWith({
      Nombre_Completo: 'Laura Gómez', Nombre_Usuario: 'laura.gomez', Correo: 'laura@demo.com',
      Telefono: '+57 300 123 4567', Id_Rol: 2, Estado: 'activo', Contrasena: 'Operaria#2026',
    })
  })

  test('el teléfono debe tener exactamente 10 dígitos', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirModal()
    llenarFormulario(wrapper.vm, { telefono: '300123' })
    await wrapper.vm.guardarUsuario()

    expect(wrapper.vm.v.error('telefono')).toBe('El teléfono debe tener 10 dígitos.')
    expect(api.crearUsuario).not.toHaveBeenCalled()
  })

  test('exige una contraseña segura', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirModal()
    llenarFormulario(wrapper.vm, { contrasena: 'operaria' })
    await wrapper.vm.guardarUsuario()

    expect(wrapper.vm.v.error('contrasena')).toBe('Debe tener al menos una mayúscula.')
    expect(api.crearUsuario).not.toHaveBeenCalled()
  })

  test('no deja crear sin correo válido', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirModal()
    llenarFormulario(wrapper.vm, { email: 'laura-demo.com' })
    await wrapper.vm.guardarUsuario()
    expect(api.crearUsuario).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-009 · Editar usuario', () => {
  test('al editar, el formulario se carga con los datos actuales del usuario', async () => {
    const { wrapper } = await montar()
    const oscar = wrapper.vm.usuarios.find(u => u.id === 2)
    wrapper.vm.abrirModal(oscar)

    expect(wrapper.vm.editando).toBe(true)
    expect(wrapper.vm.form).toEqual(expect.objectContaining({
      nombre: 'Oscar Operario', nombreUsuario: 'oscar', email: 'oscar@demo.com', telefono: '3000000002', Id_Rol: 2,
    }))
  })

  test('guarda los cambios de nombre, usuario, correo, teléfono y rol', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirModal(wrapper.vm.usuarios.find(u => u.id === 2))
    Object.assign(wrapper.vm.form, { nombre: 'Oscar Ruiz', nombreUsuario: 'oruiz', email: 'oruiz@demo.com', telefono: '3119998877', Id_Rol: 3 })
    await wrapper.vm.guardarUsuario()

    expect(api.actualizarUsuario).toHaveBeenCalledWith(2, expect.objectContaining({
      Nombre_Completo: 'Oscar Ruiz', Nombre_Usuario: 'oruiz', Correo: 'oruiz@demo.com', Telefono: '+57 311 999 8877', Id_Rol: 3,
    }))
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-010 · Asignar rol', () => {
  test('el selector de rol ofrece todos los roles, incluido administrador', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.todosLosRoles.map(r => r.Nombre_Rol)).toEqual(['admin', 'operario', 'cliente'])
  })

  test('si no se elige un rol, no se puede guardar', async () => {
    const { wrapper } = await montar()
    wrapper.vm.abrirModal()
    llenarFormulario(wrapper.vm, { Id_Rol: '' })
    await wrapper.vm.guardarUsuario()
    expect(wrapper.vm.v.error('Id_Rol')).toBe('Elige un rol.')
    expect(api.crearUsuario).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-011 · Desactivar usuario', () => {
  test('pide confirmación y, al aceptar, envía el estado "inactivo" y lo quita de la lista', async () => {
    const { wrapper } = await montar()
    const { estado, responder } = useConfirmState()

    const promesa = wrapper.vm.pedirEliminar(2)
    expect(estado.abierto).toBe(true)
    expect(estado.titulo).toBe('¿Desactivar a Oscar Operario?')
    responder(true)
    await promesa
    jest.advanceTimersByTime(400)

    expect(api.actualizarUsuario).toHaveBeenCalledWith(2, expect.objectContaining({ Estado: 'inactivo' }))
    expect(wrapper.vm.usuarios.some(u => u.id === 2)).toBe(false)
  })

  test('si se cancela, no se desactiva nada', async () => {
    const { wrapper } = await montar()
    const { responder } = useConfirmState()
    const promesa = wrapper.vm.pedirEliminar(2)
    responder(false)
    await promesa
    expect(api.actualizarUsuario).not.toHaveBeenCalled()
  })

  test('los usuarios desactivados no aparecen en la lista', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.usuarios.map(u => u.nombre)).not.toContain('Iván Inactivo')
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-012 · Buscar, filtrar y ordenar usuarios', () => {
  test('busca por nombre', async () => {
    const { wrapper } = await montar()
    wrapper.vm.busqueda = 'oscar'
    expect(wrapper.vm.usuariosFiltrados.map(u => u.nombre)).toEqual(['Oscar Operario'])
  })

  test('busca por correo', async () => {
    const { wrapper } = await montar()
    wrapper.vm.busqueda = 'carla@'
    expect(wrapper.vm.usuariosFiltrados.map(u => u.email)).toEqual(['carla@demo.com'])
  })

  test.each([
    ['administrador', ['Ana Admin']],
    ['operador', ['Oscar Operario']],
    ['cliente', ['Carla Cliente', 'Bruno Cliente']],
  ])('filtra por rol: %s', async (rol, esperados) => {
    const { wrapper } = await montar()
    wrapper.vm.filtroRol = rol
    expect(wrapper.vm.usuariosFiltrados.map(u => u.nombre)).toEqual(esperados)
  })

  test('ordena por usuario (A-Z y Z-A al volver a pulsar)', async () => {
    const { wrapper } = await montar()
    expect(wrapper.vm.usuariosOrdenados.map(u => u.nombre)).toEqual(['Ana Admin', 'Bruno Cliente', 'Carla Cliente', 'Oscar Operario'])
    wrapper.vm.sortBy('nombre')
    expect(wrapper.vm.usuariosOrdenados[0].nombre).toBe('Oscar Operario')
  })

  test('ordena por rol', async () => {
    const { wrapper } = await montar()
    wrapper.vm.sortBy('rol')
    expect(wrapper.vm.usuariosOrdenados.map(u => u.rol)).toEqual(['administrador', 'cliente', 'cliente', 'operador'])
  })

  test('ordena por fecha de registro (de la más antigua a la más reciente)', async () => {
    api.getUsuarios.mockResolvedValue([
      { ...USUARIOS[0], Fecha_Registro: '2026-03-12T15:00:00Z' },
      { ...USUARIOS[1], Fecha_Registro: '2026-02-05T15:00:00Z' },
      { ...USUARIOS[2], Fecha_Registro: '2026-11-20T15:00:00Z' },
    ])
    const { wrapper } = await montar()
    wrapper.vm.sortBy('fechaRegistro')     // mismo clic que la columna "Fecha de registro"
    expect(wrapper.vm.usuariosOrdenados.map(u => u.nombre)).toEqual(['Oscar Operario', 'Ana Admin', 'Carla Cliente'])
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-013 · Ver estadísticas de usuarios', () => {
  test('las tarjetas muestran total, administradores, operarios y clientes', async () => {
    const { wrapper } = await montar()
    const tarjetas = Object.fromEntries(wrapper.vm.kpis.map(k => [k.label, k.valor]))
    expect(tarjetas).toEqual({ 'Total usuarios': 4, Administradores: 1, Operarios: 1, Clientes: 2 })
  })
})

// ─────────────────────────────────────────────────────────────
describe('RF-014 · Editar perfil propio del administrador', () => {
  async function abrirPerfil() {
    localStorage.setItem('jwt_token', 't')
    localStorage.setItem('usuario', JSON.stringify({ Id_Usuario: 1, Nombre_Usuario: 'ana', Rol: 'admin' }))
    api.getUsuario.mockResolvedValue({ Id_Usuario: 1, Nombre_Completo: 'Ana Admin', Nombre_Usuario: 'ana', Correo: 'ana@demo.com', Telefono: '+57 300 000 0001', Id_Rol: 1 })
    const { wrapper } = await montarVista(PerfilDrawer, { props: { open: false } })
    await wrapper.setProps({ open: true })
    await flushPromises()
    return wrapper
  }

  test('consulta los datos del administrador en sesión', async () => {
    const wrapper = await abrirPerfil()
    expect(api.getUsuario).toHaveBeenCalledWith(1)
    expect(wrapper.vm.perfil).toEqual(expect.objectContaining({ nombre: 'Ana Admin', email: 'ana@demo.com' }))
  })

  test('edita nombre, usuario, correo, teléfono y contraseña', async () => {
    const wrapper = await abrirPerfil()
    wrapper.vm.empezarEdicion()
    Object.assign(wrapper.vm.form, { nombre: 'Ana María Admin', nombreUsuario: 'anamaria', email: 'anamaria@demo.com', telefono: '3005556666', contrasena: 'Perfil#2026' })
    await wrapper.vm.guardar()

    expect(api.actualizarUsuario).toHaveBeenCalledWith(1, expect.objectContaining({
      Nombre_Completo: 'Ana María Admin', Nombre_Usuario: 'anamaria', Correo: 'anamaria@demo.com', Telefono: '3005556666', Contrasena: 'Perfil#2026',
    }))
    expect(JSON.parse(localStorage.getItem('usuario')).Nombre_Usuario).toBe('anamaria')
  })

  test('no guarda si la nueva contraseña no cumple los requisitos', async () => {
    const wrapper = await abrirPerfil()
    wrapper.vm.empezarEdicion()
    wrapper.vm.form.contrasena = 'corta'
    await wrapper.vm.guardar()
    expect(api.actualizarUsuario).not.toHaveBeenCalled()
  })
})
