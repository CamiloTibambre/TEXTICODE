import express from 'express'
import cors from 'cors'
import { env, validateEnv } from './config/env.js'
import { requireAuth } from './middleware/auth.js'
import { requireRoles } from './middleware/roles.js'
import { checkDatabaseConnection } from './db.js'

import usuariosRouter       from './routes/usuarios.js'
import materialesRouter     from './routes/materiales.js'
import ordenesRouter        from './routes/ordenes.js'
import comprobantesRouter   from './routes/comprobantes.js'
import rolesRouter          from './routes/roles.js'
import ordenMaterialRouter  from './routes/orden_material.js'
import ordenOperarioRouter  from './routes/orden_operario.js'
import usuarioOrdenRouter   from './routes/usuario_orden.js'
import notificacionesRouter from './routes/notificaciones.js'
import authRouter           from './routes/auth.route.js'
import practicaRouter       from './routes/practica.routes.js'
import eficienciaRouter     from './routes/eficiencia.js'
import cargaTrabajoRoutes   from './routes/carga_trabajo.js'
import googleCalendarRouter from './routes/googleCalendar.js'
import calendarRouter       from './routes/calendar.route.js'
import empresasRouter       from './routes/empresas.js'

const app = express()

app.use(cors({ 
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://localhost:5173',
  ] 
}))
app.use(express.json({ limit: '10mb' }))

app.get('/health', async (req, res) => {
  res.json({ ok: true, service: 'texticode-api' })
})

app.use('/api/usuarios',         usuariosRouter)
app.use('/api/materiales',       requireAuth, materialesRouter)
app.use('/api/ordenes',          requireAuth, ordenesRouter)
app.use('/api/comprobantes',     requireAuth, comprobantesRouter)
app.use('/api/roles',            requireAuth, requireRoles('admin'), rolesRouter)
app.use('/api/orden-material',   requireAuth, requireRoles('admin'), ordenMaterialRouter)
app.use('/api/orden-operario',   requireAuth, ordenOperarioRouter)
app.use('/api/usuario-orden',    requireAuth, usuarioOrdenRouter)
app.use('/api/notificaciones',   requireAuth, requireRoles('admin'), notificacionesRouter)
app.use('/api/auth',             authRouter)
app.use('/api/empresas',         empresasRouter)
app.use('/api/practica',         requireAuth, practicaRouter)
app.use('/api/eficiencia',       requireAuth, requireRoles('admin'), eficienciaRouter)
app.use('/api/carga-trabajo',    requireAuth, requireRoles('admin'), cargaTrabajoRoutes)
app.use('/api/google',           googleCalendarRouter)
app.use('/api/calendar',         calendarRouter)

app.get('/', (req, res) => {
  res.json({
    mensaje: '✅ Texticode API funcionando',
    endpoints: [
      'GET  /api/usuarios',
      'GET  /api/materiales',
      'GET  /api/ordenes',
      'GET  /api/comprobantes',
      'GET  /api/roles',
      'GET  /api/orden-material/orden/:id',
      'GET  /api/orden-operario/orden/:id',
      'GET  /api/orden-operario/operario/:id',
      'GET  /api/usuario-orden/orden/:id',
      'POST /api/notificaciones/estado',
      'POST /api/auth/recuperar-contrasena',
      'GET  /api/practica/usuarios/:Id_Usuario',
      'GET  /api/practica/ordenes/:Id_Orden',
      'GET  /api/practica/ordenes/:Id_Orden/materiales',
      'GET  /api/practica/ordenes/:Id_Orden/comprobante',
      'GET  /api/practica/clientes/:Id_Cliente/materiales',
      'GET  /api/practica/ordenes?estado=',
      'GET  /api/practica/materiales?categoria=',
      'GET  /api/practica/usuarios?page=&limit=',
      'GET  /api/practica/comprobantes?estado=&fecha=',
      'GET  /api/practica/ordenes?orden=Prioridad&dir=desc',
      'GET  /api/eficiencia/operarios',
      'GET  /api/eficiencia/operarios/:id',
      'GET  /api/eficiencia/operarios?rendimiento=Alto|Medio|Bajo',
      'GET  /api/eficiencia/operarios?estado=Completada|En Proceso|Pausado',
      'GET  /api/eficiencia/operarios?limite=5',
      'GET  /api/google/auth-url?action=link|login',
      'POST /api/google/sync/delivery-events',
    ]
  })
})

const PORT = env.port

export { app }

export async function startServer() {
  validateEnv()
  try {
    await checkDatabaseConnection()
  } catch (err) {
    console.error('❌ Error conectando a Supabase:', err.message)
    process.exit(1)
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  })
}

if (process.env.NODE_ENV !== 'test') {
  startServer()
}

