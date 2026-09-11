import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

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

const app = express()

app.use(cors({ 
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://localhost:5173',
  ] 
}))
app.use(express.json({ limit: '10mb' }))

app.use('/api/usuarios',         usuariosRouter)
app.use('/api/materiales',       materialesRouter)
app.use('/api/ordenes',          ordenesRouter)
app.use('/api/comprobantes',     comprobantesRouter)
app.use('/api/roles',            rolesRouter)
app.use('/api/orden-material',   ordenMaterialRouter)
app.use('/api/orden-operario',   ordenOperarioRouter)
app.use('/api/usuario-orden',    usuarioOrdenRouter)
app.use('/api/notificaciones',   notificacionesRouter)
app.use('/api/auth',             authRouter)
app.use('/api/practica',         practicaRouter)
app.use('/api/eficiencia',       eficienciaRouter)
app.use('/api/carga-trabajo',    cargaTrabajoRoutes)
app.use('/api/google',           googleCalendarRouter)

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

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
