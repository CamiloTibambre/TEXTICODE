// Tokens JWT y usuarios de sesión para cada rol.
import { signAuthToken } from '../../middleware/auth.js'

const EMPRESA = 1

const base = (id, idRol, rol) => ({
  Id_Usuario: id, Nombre_Usuario: rol, Nombre_Completo: `Usuario ${rol}`, Correo: `${rol}@demo.com`,
  Estado: 'activo', Id_Rol: idRol, Rol: rol,
  Membresia_Id_Empresa: EMPRESA, Nombre_Empresa: 'Demo', Membresia_Id_Rol: idRol, Membresia_Rol: rol,
  Membresia_Rol_Estado: null,
})

export const USUARIOS_SESION = {
  admin:    base(1, 1, 'admin'),
  operario: base(2, 2, 'operario'),
  cliente:  base(3, 3, 'cliente'),
}

/** Prepara la BD simulada para que requireAuth acepte el token y devuelve el header Authorization. */
export function iniciarSesionComo(db, rol) {
  const u = USUARIOS_SESION[rol]
  db.cuando('LEFT JOIN usuario_empresa', [u])
  return 'Bearer ' + signAuthToken({ Id_Usuario: u.Id_Usuario, Id_Rol: u.Id_Rol, Nombre_Usuario: u.Nombre_Usuario, Id_Empresa: EMPRESA })
}

/** Sesión del superadmin global (sin empresa). */
export function iniciarSesionSuperadmin(db) {
  db.cuando('AS "Tiene_Membresias"', [{ Id_Usuario: 99, Estado: 'activo', Rol: 'superadmin', Tiene_Membresias: false }])
  return 'Bearer ' + signAuthToken({ Id_Usuario: 99, Id_Rol: 90, Nombre_Usuario: 'superadmin' })
}
