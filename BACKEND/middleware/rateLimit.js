// Limitador de intentos en memoria (ventana fija) para rutas sensibles como login y recuperación.
// Es por proceso: si la API corre en varias instancias, cada una lleva su propia cuenta.

function claveCliente(req) {
  return req.ip || req.socket?.remoteAddress || 'desconocido'
}

/**
 * @param {object} opciones
 * @param {number} opciones.ventanaMs Duración de la ventana en milisegundos
 * @param {number} opciones.max Intentos permitidos por ventana y clave
 * @param {(req) => string} [opciones.clave] Clave adicional (p. ej. el correo) que se suma a la IP
 * @param {string} [opciones.mensaje]
 */
export function rateLimit({ ventanaMs, max, clave, mensaje = 'Demasiados intentos. Intenta de nuevo más tarde.' }) {
  const contadores = new Map()

  // Limpieza periódica para que el mapa no crezca sin límite.
  const limpieza = setInterval(() => {
    const ahora = Date.now()
    for (const [k, v] of contadores) {
      if (v.reinicio <= ahora) contadores.delete(k)
    }
  }, ventanaMs)
  limpieza.unref?.()

  return (req, res, next) => {
    const extra = clave ? String(clave(req) || '').trim().toLowerCase() : ''
    const k = `${claveCliente(req)}|${extra}`
    const ahora = Date.now()

    let entrada = contadores.get(k)
    if (!entrada || entrada.reinicio <= ahora) {
      entrada = { cuenta: 0, reinicio: ahora + ventanaMs }
      contadores.set(k, entrada)
    }
    entrada.cuenta++

    if (entrada.cuenta > max) {
      res.set('Retry-After', String(Math.ceil((entrada.reinicio - ahora) / 1000)))
      return res.status(429).json({ error: mensaje, mensaje })
    }
    return next()
  }
}

const QUINCE_MIN = 15 * 60 * 1000
const UNA_HORA = 60 * 60 * 1000

const identificadorLogin = req => req.body?.correo || req.body?.usuario || req.body?.nombreUsuario || ''

// Por IP + cuenta: frena la fuerza bruta contra un usuario concreto.
export const limiteLoginCuenta = rateLimit({ ventanaMs: QUINCE_MIN, max: 10, clave: identificadorLogin })
// Por IP: frena el barrido de muchas cuentas desde un mismo origen.
export const limiteLoginIp = rateLimit({ ventanaMs: QUINCE_MIN, max: 50 })
export const limiteRecuperacion = rateLimit({
  ventanaMs: UNA_HORA,
  max: 5,
  mensaje: 'Demasiadas solicitudes de recuperación. Intenta de nuevo en una hora.',
})
export const limiteTokenRecuperacion = rateLimit({ ventanaMs: QUINCE_MIN, max: 20 })
