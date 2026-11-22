import { Server } from 'socket.io'
import { verifyAuthToken } from '../middleware/auth.js'

let io = null

export function inicializarRealtime(server, allowedOrigins = []) {
  io = new Server(server, {
    cors: { origin: allowedOrigins.filter(Boolean), methods: ['GET', 'POST'] },
  })

  io.use((socket, next) => {
    try {
      const header = socket.handshake.headers.authorization || ''
      const token = socket.handshake.auth?.token || (header.startsWith('Bearer ') ? header.slice(7) : null)
      const payload = verifyAuthToken(token)
      if (payload.empresa == null) return next(new Error('Se requiere una empresa activa.'))
      socket.data.auth = payload
      socket.join(`empresa:${payload.empresa}`)
      next()
    } catch {
      next(new Error('Sesión inválida.'))
    }
  })

  return io
}

export function emitirFaseActualizada(empresaId, datos) {
  if (!io || empresaId == null) return
  io.to(`empresa:${empresaId}`).emit('fase:actualizada', datos)
}
