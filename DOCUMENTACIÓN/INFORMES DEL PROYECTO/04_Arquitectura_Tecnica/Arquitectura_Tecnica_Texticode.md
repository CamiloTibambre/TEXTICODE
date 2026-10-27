# 🏗️ ARQUITECTURA TÉCNICA Y ESPECIFICACIONES
## Texticode — Sistema de Gestión de Producción Textil · Documentación Técnica

**Fecha:** 25 de octubre de 2026
**Versión:** 1.1
**Autor(es):** Kevin Montenegro · Andrés Felipe Lancheros · Camilo Andrés Tibambre · Kevin Andrés Castro
**Programa:** Tecnólogo en Análisis y Desarrollo de Software (ADSO) · SENA CEET · Ficha 3278639
**Docente:** Ing. Edwin Marín
**Estado:** En revisión

**Repositorio documentado:** `CamiloTibambre/TEXTICODE`, rama `main`, commit `88c8a68` (21/10/2026, "Merge pull request #118 · Migracion Docker").

> **Cómo se elaboró este documento.** Todo lo que aparece aquí se tomó del código real del repositorio y del esquema real de la base de datos, exportado del contenedor `texticode-db`. Las métricas (build, Lighthouse, pruebas automáticas, pruebas de SQL y de RLS) se midieron el 22/10/2026 y sus salidas se adjuntan como evidencia. Lo que todavía no existe en producción está marcado como **(Propuesta)** o **(Futuro)**.

---

## Tabla de contenido

1. Resumen Ejecutivo
2. Stack Tecnológico
3. Arquitectura de la Aplicación
4. Base de Datos
5. APIs y Endpoints
6. Seguridad
7. Rendimiento y Optimización
8. Integraciones Externas
9. Configuración y Despliegue
10. Monitoreo y Logs
11. Anexos (dependencias, comandos, glosario, aprobación)

---

## 1. Resumen Ejecutivo

**Texticode** es una plataforma web y móvil para talleres de confección. Gestiona usuarios, clientes, inventario de insumos, órdenes de producción por fases, comprobantes de entrega, eficiencia de operarios y notificaciones. La usan cuatro tipos de usuario: **superadministrador** (crea y administra empresas), **administrador** de cada empresa, **operario** y **cliente**. Funciona como **SaaS multiempresa**: una sola instalación aloja varias empresas y cada una solo ve sus propios datos. La arquitectura separa una SPA en Vue 3, publicada en Vercel, de una API REST en Node.js/Express que corre en un contenedor Docker y se conecta a PostgreSQL 17.

```
Paradigma:      SPA (Single Page Application) + API REST
Arquitectura:   Cliente-servidor en 3 capas (presentación · API · datos), multiempresa (multi-tenant)
Tipo:           Aplicación web cloud-ready, contenerizada con Docker
Escalabilidad:  Frontend horizontal automática (CDN de Vercel); backend sin estado (JWT),
                escalable horizontalmente agregando contenedores detrás de un balanceador
```

**¿Por qué no es "JAMstack + Serverless" como el documento de referencia?** El sistema EBS usa Supabase como *Backend as a Service* y no tiene servidor propio. Texticode sí tiene un backend propio en Express, porque necesita reglas de negocio que no caben en consultas directas desde el navegador: aislamiento por empresa, descuento de stock dentro de una transacción, envío de correos y OAuth con Google. Supabase se usa solo como **PostgreSQL gestionado**, no como API.

### Características principales (implementadas)

| Característica | Evidencia en el código |
|----------------|------------------------|
| **Multiempresa** con aislamiento de datos | Columna `Id_Empresa` en las 11 tablas que dependen de una empresa; `requireAuth` toma la empresa del JWT (`middleware/auth.js`) |
| **Control de acceso por rol** (4 roles) | `requireRoles`, `requireSelfParamOrRoles`, `requireSuperadmin`; rutas con `meta.rol` en Vue Router |
| **Inventario con kárdex** | Cada entrada o salida queda en `material_movimiento`; el stock se descuenta dentro de una transacción |
| **Producción por fases** con seguimiento del operario | Tabla `orden_operario`, endpoint `PATCH /api/orden-operario/:id/completar` |
| **Notificaciones por correo** | `services/emailService.js` con SendGrid |
| **Integración con Google** (login y Calendar) | `routes/googleCalendar.js`, `POST /api/auth/google/mobile` |
| **Reportes PDF/Excel** desde el navegador | jsPDF y JSZip cargados bajo demanda en `Reportes.vue` y `GestionClientes.vue` |
| **Cliente web y móvil** con el mismo API | SPA Vue 3 y app Flutter `texticode_mobile` |

### Principios de diseño

| Principio | Cómo se aplica en Texticode |
|-----------|-----------------------------|
| **Security by Design** | La empresa activa **nunca** viene del cliente: se toma del token firmado y se vuelve a validar contra `usuario_empresa` en cada petición. Las FK compuestas `(Id, Id_Empresa)` impiden en la base de datos relacionar registros de dos empresas distintas. |
| **API First** | La web y la app móvil consumen exactamente los mismos endpoints REST (`/api/*`); no hay lógica de negocio duplicada en los clientes. |
| **Separation of Concerns** | Vistas Vue → `services/api.js` → rutas Express → middleware → servicios → `db.js`. Cada capa tiene una sola responsabilidad (ver sección 3). |

> **Pregunta para pensar: ¿característica o principio?** Una *característica* es algo que el sistema **hace** y que el usuario percibe ("descuenta stock automáticamente"). Un *principio de diseño* es una **regla que guía las decisiones** del equipo al construirlo ("la empresa siempre sale del token, nunca del body"). Los principios no se ven en pantalla, pero explican por qué el código está escrito como está.

---

## 2. Stack Tecnológico

### 2.1 Tecnologías por capa

Versiones tomadas de `npm ls` sobre los `package-lock.json` del repositorio (22/10/2026).

| Capa | Tecnología | Versión instalada | Para qué se usa |
|------|------------|-------------------|-----------------|
| Frontend · framework | Vue | 3.5.43 | Componentes de interfaz (Composition API, `<script setup>`) |
| Frontend · enrutamiento | Vue Router | 4.6.4 | Rutas por rol, carga diferida de vistas |
| Frontend · estado global | Pinia | 2.3.1 | Sesión del usuario (`stores/auth.js`) |
| Frontend · empaquetador | Vite | 6.4.3 | Servidor de desarrollo con HTTPS y build de producción |
| Frontend · plugin | @vitejs/plugin-vue | 5.2.4 | Compilar archivos `.vue` |
| Backend · runtime | Node.js | 24 (imagen `node:24-slim`) | Ejecutar la API |
| Backend · framework | Express | 4.22.1 | Servidor HTTP y enrutamiento REST |
| Backend · base de datos | pg (node-postgres) | 8.21.0 | Pool de conexiones y consultas parametrizadas |
| Backend · autenticación | jsonwebtoken / bcryptjs | 9.0.3 / 3.0.3 | Firmar JWT y cifrar contraseñas |
| Backend · correo | @sendgrid/mail | 8.1.6 | Correos transaccionales |
| Backend · utilidades | cors / dotenv | 2.8.6 / 16.6.1 | Política de orígenes y variables de entorno |
| Base de datos | PostgreSQL | 17.6 (Supabase) · 17 (Docker) | Persistencia relacional |
| Contenedores | Docker + Docker Compose | Docker Desktop (Personal) | Ejecutar base de datos y backend |
| Hosting del frontend | Vercel | Hobby en desarrollo · Pro en producción | CDN y HTTPS del build estático (en producción, también el API; ver 2.6) |
| App móvil | Flutter | — | Cliente `texticode_mobile` (repositorio aparte) |
| Control de versiones | Git + GitHub | — | Historial, ramas y pull requests |

> ⚠️ **Ojo con las versiones (hallazgo).** `FRONTEND/package.json` declara `"vue": "^3.4.0"`, pero lo que realmente se instala es **3.5.43**, porque el `^` acepta cualquier versión menor compatible. Este documento cita las versiones **instaladas**, que son las que corren. Por la misma razón, el `README` del frontend no debe decir "Vite 5": en el lock está la 6.4.3.

### 2.2 ¿Por qué Vue 3?

1. **Curva de aprendizaje y productividad:** con `<script setup>` y la Composition API, cada vista concentra plantilla, lógica y estilos en un solo archivo `.vue`. El proyecto tiene 19 vistas organizadas por rol.
2. **Reactividad incorporada:** `ref` y `computed` actualizan la interfaz sin librerías extra; la sesión vive en una sola *store* de Pinia.
3. **Carga diferida nativa:** `component: () => import('...')` en Vue Router divide el código por vista sin configurar nada más (sección 7).

### 2.3 ¿Por qué Express con PostgreSQL (y no Supabase como BaaS)?

1. **Reglas de negocio transaccionales:** asignar material a una orden debe validar stock, descontarlo y registrar el movimiento **en una sola transacción** (`BEGIN … COMMIT`). Desde el navegador con `supabase-js` serían tres llamadas separadas (ver la actividad de la sección 5).
2. **Multiempresa controlado en un solo lugar:** el middleware `requireAuth` resuelve la empresa del usuario y todas las consultas filtran por `Id_Empresa`.
3. **Portabilidad:** el mismo backend funciona contra Supabase en la nube o contra PostgreSQL local en Docker solo cambiando `DATABASE_URL` (`db.js` activa SSL únicamente si el host es remoto).

### 2.4 Comparación: Vite vs. Webpack (vue-cli)

| Criterio | Vite 6 (usado) | Webpack (vue-cli) |
|----------|----------------|-------------------|
| Arranque en desarrollo | Sirve módulos ES nativos; no empaqueta todo al inicio | Empaqueta todo el proyecto antes de arrancar |
| Recarga en caliente (HMR) | Solo recompila el módulo cambiado | Recompila el paquete afectado |
| Build de producción medido | **3,66 s** para 77 módulos (ver 7.3) | — |
| Configuración | `vite.config.js` de 27 líneas (alias, HTTPS y proxy) | `vue.config.js` + configuración de loaders |
| Estado del proyecto | Activo; `vue-cli` está en modo mantenimiento | — |

### 2.5 Comparación: Supabase vs. Firebase como base de datos en la nube

| Criterio | Supabase (usado) | Firebase (Firestore) |
|----------|------------------|----------------------|
| Modelo de datos | **Relacional (PostgreSQL):** FK, JOIN, transacciones | Documentos NoSQL, sin JOIN ni FK |
| Encaje con Texticode | Órdenes ↔ materiales ↔ fases ↔ comprobantes: relaciones fuertes | Habría que desnormalizar y duplicar datos |
| Conexión desde Express | Conexión PostgreSQL estándar con `pg` | SDK propietario |
| Portabilidad | `pg_dump` → el mismo esquema corre en Docker (así se hizo) | Exportación propietaria |

### 2.6 Planes y costos

Hay dos escenarios: el **desarrollo académico**, que es el que corre hoy, y la **producción para un cliente**, que es lo que se cotiza a ISATEX J&M S.A.S en la propuesta comercial del 25/10/2026.

**Desarrollo (situación actual)**

| Servicio | Plan | Costo mensual | Condición |
|----------|------|---------------|-----------|
| Vercel (frontend) | Hobby | USD 0 | Solo uso personal y **no comercial** [V1] |
| Supabase (PostgreSQL en la nube) | Free | USD 0 | El proyecto se **pausa tras 1 semana** de inactividad [V2] |
| Docker Desktop | Personal | USD 0 | Gratuito para uso educativo y empresas pequeñas |
| SendGrid (correo) | Prueba gratuita | USD 0 | El plan gratuito permanente **se retiró en 2025** [V3]; sirve para pruebas, no para operar |
| Google Cloud (OAuth y Calendar API) | Sin costo | USD 0 | Dentro de las cuotas gratuitas de la API |
| GitHub | Free | USD 0 | — |
| **Total** | | **USD 0** | |

**Producción para ISATEX J&M S.A.S (propuesta comercial)**

Los planes gratuitos no sirven para una empresa en operación: Vercel Hobby prohíbe el uso comercial, la base de datos no se puede pausar y SendGrid ya no tiene plan gratuito. Por eso en producción se pasa a planes de pago:

| Servicio | Plan | USD/mes | COP/mes con IVA 19 % (TRM $3.163,76) |
|----------|------|---------|--------------------------------------|
| Vercel (frontend **y** API Express como Vercel Functions) | Pro, 1 puesto | 20 | $169.000 (junto con Supabase) |
| Supabase (PostgreSQL 17 gestionado, respaldos diarios) | Pro | 25 | (incluido arriba) |
| SendGrid (correo transaccional) | Essentials, 50.000 correos | 19,95 | $76.000 |
| Google Cloud (OAuth y Calendar API) | Sin costo | 0 | $0 |
| Soporte y mantenimiento del equipo | — | — | $130.000 |
| **Total de operación** | | | **$375.000** |

**¿Dónde corre el backend en producción?** Vercel ejecuta aplicaciones Express como *Vercel Functions* sin servidor propio [V4], así que el API se publica en el mismo plan Pro y no se paga un hosting aparte. Para esto, la conexión a PostgreSQL debe usar el *pooler* de Supabase (modo transacción), porque cada función abre conexiones cortas. La imagen Docker se mantiene para el desarrollo local y como plan B (Render o Railway) si ISATEX llegara a necesitar procesos de larga duración.

Fuentes: [V1] Vercel, *Hobby Plan*, https://vercel.com/docs/plans/hobby · [V2] Supabase, *Pricing*, https://supabase.com/pricing · [V3] Dreamlit, *SendGrid Alternatives (2026)*, https://dreamlit.ai/blog/best-sendgrid-alternatives · [V4] Vercel, *Express on Vercel*, https://vercel.com/docs/frameworks/backend/express · TRM del 21/10/2026 (Portafolio).

### 2.7 Estrategia de ramas en Git

El repositorio `CamiloTibambre/TEXTICODE` tiene **484 commits** desde el 04/03/2026, **157 pull requests fusionados** y **28 ramas remotas**. El flujo real es *GitHub Flow con ramas por integrante*:

```
main  ←── rama protegida de integración; solo recibe Pull Requests
 ├── kvnwagner_rama, LanchaRama, Camilo_Rama_3, Andres_castro_RAMA   (rama de trabajo por integrante)
 └── codex/<funcionalidad>   (ramas de funcionalidad: codex/fase-6-contexto-empresa,
                              codex/seguridad-escalon-1, codex/implementar-google-calendar-api ...)
```

1. Cada integrante trabaja en su rama o en una rama `codex/<funcionalidad>`.
2. Se abre un Pull Request hacia `main` (ejemplo: PR #117 `codex/fase-6-contexto-empresa`, PR #118 `kvnwagner_rama`).
3. Otro integrante revisa y fusiona.

> **Mejora propuesta:** borrar las ramas ya fusionadas (hay varias `codex/...` duplicadas con sufijos aleatorios) y adoptar el prefijo `feature/` que sugiere la guía para las nuevas.

---

## 3. Arquitectura de la Aplicación

### 3.1 Diagrama de arquitectura

![Diagrama de arquitectura de Texticode](img/arquitectura.png)

Versión en texto:

```
USUARIO (navegador)                 APP MÓVIL (Flutter)
   │ HTTPS                               │
   ▼                                     │
VERCEL (CDN) → index.html + JS/CSS       │
   │  fetch + JWT (Bearer)               │ HTTP + JWT
   ▼                                     ▼
BACKEND EXPRESS (Docker: texticode-backend, puerto 3001)
   cors → express.json → requireAuth → requireRoles → ruta → servicio → db.js
   │ SQL parametrizado (pg)        │ HTTPS                   │ HTTPS
   ▼                               ▼                         ▼
POSTGRESQL 17                    SENDGRID                 GOOGLE OAUTH / CALENDAR
(Docker texticode-db o Supabase)
```

### 3.2 Estructura real de carpetas

Generada desde el repositorio, sin `node_modules` ni `dist`.

```
TEXTICODE/
├── docker-compose.yml          # Orquesta db (postgres:17) + backend (node:24-slim)
├── BACKEND/
│   ├── Dockerfile              # Imagen del API: npm ci --omit=dev, puerto 3001
│   ├── index.js                # App Express: CORS, montaje de routers, /health
│   ├── db.js                   # Pool de pg; SSL automático solo si la BD es remota
│   ├── config/env.js           # Lee y valida variables de entorno (falla si falta JWT_SECRET)
│   ├── middleware/
│   │   ├── auth.js             # Firma/verifica JWT, requireAuth, requireSuperadmin
│   │   ├── roles.js            # requireRoles, requireSelfParamOrRoles
│   │   └── empresa.js          # requireEmpresa, isSameEmpresa
│   ├── routes/                 # 16 routers: usuarios, materiales, ordenes, orden_material,
│   │                           # orden_operario, comprobantes, empresas, auth, eficiencia,
│   │                           # carga_trabajo, notificaciones, googleCalendar, calendar, ...
│   ├── services/               # Lógica reutilizable: auth, ordenes, materiales, email, rendimiento
│   └── test/                   # 12 archivos de pruebas con node:test (87 casos)
├── FRONTEND/
│   ├── index.html
│   ├── vite.config.js          # Alias @, HTTPS local (certs/) y proxy /api → :3001
│   ├── public/img/             # Logos
│   └── src/
│       ├── main.js             # Crea la app, registra Pinia, Router y plugins de animación
│       ├── App.vue             # Contenedor raíz con <RouterView> y transición
│       ├── router/index.js     # Rutas públicas y protegidas por rol + guard beforeEach
│       ├── stores/auth.js      # Pinia: token, usuario, rol, login y logout
│       ├── services/api.js     # Cliente HTTP único (fetch + Authorization: Bearer)
│       ├── composables/        # useNotificaciones.js
│       ├── components/         # AppSidebar.vue, TxSelect.vue
│       ├── plugins/            # scrollReveal.js (directivas v-reveal, v-ripple, v-tilt)
│       ├── assets/motion.css   # Sistema de animaciones
│       └── views/
│           ├── LandingView, LoginView, CambiarContrasena, GoogleAuthCallback, GoogleCalendarView
│           ├── admin/          # GestionUsuarios, GestionClientes, GestionInventario,
│           │                   # GestionProduccion, EficienciaOperarios, Reportes
│           ├── operario/       # CuentaPersonal, TareasAsignadas, ReportarAvances
│           ├── cliente/        # CuentaPersonal, PedidosEntregas, CentroSoporte, AlertasMateriales
│           └── superadmin/     # GestionEmpresas
└── DATABASE/                   # Scripts SQL: esquema reproducible, migración multiempresa,
                                # rollback, datos sintéticos, pruebas por módulo, seed superadmin
```

> **Actividad de análisis (estructura EBS vs. Texticode).** EBS usa `pages/`, `context/`, `hooks/` y `services`. En Texticode los equivalentes son `views/` (páginas), `stores/` con Pinia (en lugar de Context API), `composables/` (en lugar de hooks) y `services/api.js`. No existe una carpeta `context/`, y por eso no se documenta.

### 3.3 Flujo de datos: "Asignar material a una orden de producción"

Se eligió esta funcionalidad porque recorre todas las capas y es una **transacción real** de varias operaciones.

![Diagrama de secuencia: asignar material a una orden](img/flujo_material.png)

**Paso 1–2 · Vista (`views/admin/GestionProduccion.vue`).** Al guardar la orden, la vista recorre los materiales seleccionados y llama al servicio:

```javascript
for (const mat of form.value.materiales_seleccionados) {
  await agregarMaterialOrden({
    Id_Orden:       idOrden,
    Id_Producto:    mat.Id_Material,
    Cantidad_Usada: mat.cantidad || 1,
  })
}
```

**Paso 3 · Servicio HTTP (`services/api.js`).** Un único cliente agrega el token y convierte las respuestas de error en excepciones:

```javascript
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function request(url, options = {}) {
  const { headers = {}, ...rest } = options
  const res = await fetch(`${BASE}${url}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en la API')
  return data
}
export const agregarMaterialOrden = (body) =>
  request('/orden-material', { method: 'POST', body: JSON.stringify(body) })
```

**Paso 4 · Middleware (`index.js`).** La ruta está montada así: `app.use('/api/orden-material', requireAuth, requireRoles('admin'), ordenMaterialRouter)`. `requireAuth` verifica la firma del JWT, vuelve a consultar el usuario y su membresía activa en la base de datos y deja en `req.auth.empresaId` la empresa del token.

**Pasos 5–8 · Ruta (`routes/orden_material.js`).** Transacción con bloqueo de la fila del material para evitar que dos administradores descuenten el mismo stock al mismo tiempo:

```javascript
const client = await pool.connect()
try {
  await client.query('BEGIN')
  const matRes = await client.query(
    'SELECT "Stock_Actual" FROM material WHERE "Id_Material" = $1 AND "Id_Empresa" = $2 FOR UPDATE',
    [Id_Producto, empresaId])
  if (Number(matRes.rows[0].Stock_Actual) < Cantidad_Usada) {
    await client.query('ROLLBACK')
    return res.status(400).json({ error: `Stock insuficiente: ...` })
  }
  await client.query(`INSERT INTO orden_material (...) VALUES ($1, $2, $3, $4)`, [...])
  await client.query(`UPDATE material SET "Stock_Actual" = "Stock_Actual" - $1 WHERE ...`, [...])
  await client.query(`INSERT INTO material_movimiento (...) VALUES ($1, 'Salida', $2, $3, ..., $4)`, [...])
  await client.query('COMMIT')
  res.status(201).json({ mensaje: 'Material agregado a la orden' })
} catch (err) {
  await client.query('ROLLBACK')
  if (err.code === '23505') return res.status(409).json({ error: 'Ese material ya está en la orden' })
  if (err.code === '23503') return res.status(400).json({ error: 'La orden o el material no existe o no pertenece a esta empresa' })
  res.status(500).json({ error: err.message })
} finally {
  client.release()
}
```

**Pasos 9–11 · Respuesta.** Con `201`, la vista recarga la lista de órdenes. Con `400` o `409`, `request()` lanza un `Error` que la vista muestra en `errorGuardar`.

### 3.4 Estado global e inicio de sesión

El estado global es la **sesión**, en una *store* de Pinia (`stores/auth.js`):

| Elemento | Implementación |
|----------|----------------|
| Datos | `token` (JWT) y `usuario` (Id, nombre, rol, empresa) |
| Persistencia | `localStorage` (`jwt_token`, `usuario`) para sobrevivir a una recarga |
| Derivados | `rol` (normalizado a minúsculas), `idUsuario`, `estaLogueado` |
| Acciones | `loginConCredenciales(correo, contrasena)`, `guardarSesionGoogle()`, `setToken()`, `logout()` |

**Flujo de inicio de sesión:** `LoginView` → `auth.loginConCredenciales()` → `POST /api/auth/login` → `services/auth.service.js` (`processLogin`) compara la contraseña con `bcrypt`, busca la **única** membresía activa del usuario en `usuario_empresa` y firma un JWT con `{ id, rol, empresa, rolNombre }` que vence en **8 horas**. El token se guarda y `api.js` lo envía en cada petición como `Authorization: Bearer <token>`.

### 3.5 Rutas de la SPA

El guard `router.beforeEach` envía a `/login` a quien no tiene sesión o no tiene el rol de la ruta. Si alguien con sesión entra a `/` o `/login`, lo redirige a su panel.

| Ruta | Vista | Acceso |
|------|-------|--------|
| `/` | LandingView | 🌐 Pública |
| `/login` | LoginView | 🌐 Pública |
| `/cambiar-contrasena` | CambiarContrasena | 🌐 Pública (requiere token del correo) |
| `/google-auth/callback` | GoogleAuthCallback | 🌐 Pública (retorno de OAuth) |
| `/superadmin/empresas` | GestionEmpresas | 🔒 superadmin |
| `/admin/usuarios`, `/admin/clientes`, `/admin/inventario`, `/admin/produccion`, `/admin/eficiencia`, `/admin/reportes`, `/admin/google-calendar` | Vistas de administración | 🔒 admin |
| `/operario/cuenta`, `/operario/tareas`, `/operario/avances`, `/operario/google-calendar` | Vistas de operario | 🔒 operario |
| `/cliente/cuenta`, `/cliente/pedidos`, `/cliente/soporte`, `/cliente/alertas`, `/cliente/google-calendar` | Vistas de cliente | 🔒 cliente |
| `/:pathMatch(.*)*` | Redirige a `/` | — |

> La protección del router es **solo de experiencia de usuario**. La seguridad real está en el backend (sección 6): aunque alguien modifique `localStorage` para "ser admin", el API rechaza el token porque está firmado y se revalida contra la base de datos.

---

## 4. Base de Datos

### 4.1 Inventario de tablas

El esquema real tiene **15 tablas**, **5 tipos ENUM**, **51 llaves foráneas**, **16 índices secundarios**, **2 funciones** y **1 trigger**. Se obtuvo con `pg_dump --schema-only` del contenedor `texticode-db`, que es una copia del proyecto de Supabase (PostgreSQL 17.6).

| Tabla | Propósito | Llave primaria | RLS |
|-------|-----------|----------------|-----|
| `empresa` | Empresas (tenants) de la plataforma | `Id_Empresa` | ✅ |
| `empresa_config` | Zona horaria, moneda y correo de cada empresa (1:1) | `Id_Empresa` | ✅ |
| `rol` | Catálogo: Administrador, Operario, Cliente, superadmin | `Id_Rol` | ✅ |
| `usuario` | Personas con acceso (contraseña con bcrypt) | `Id_Usuario` | ✅ |
| `usuario_empresa` | Membresía: a qué empresa pertenece cada usuario y con qué rol | `(Id_Usuario, Id_Empresa)` | ✅ |
| `material` | Insumos con stock, mínimo, máximo y cliente dueño | `Id_Material` | ❌ |
| `material_movimiento` | Kárdex: entradas y salidas de inventario | `Id_Movimiento` | ✅ |
| `orden_produccion` | Pedidos de producción | `Id_Orden` | ❌ |
| `orden_operario` | Fases de cada orden asignadas a operarios | `Id_Orden_Operario` | ✅ |
| `orden_material` | Materiales consumidos por orden (N:M) | `(Id_Orden, Id_Producto)` | ❌ |
| `usuario_orden` | Usuarios asignados a una orden con su función (N:M) | `(Id_Usuario, Id_Orden)` | ✅ |
| `comprobantes` | Comprobantes de entrega por orden | `Id_Comprobante` | ❌ |
| `observacion_operario` | Observaciones del administrador sobre un operario | `Id_Observacion` | ❌ |
| `google_calendar_tokens` | Tokens OAuth de Google por usuario | `(Id_Usuario, Id_Empresa)` | ❌ |
| `tokens_recuperacion` | Tokens de un solo uso para recuperar contraseña | `id` | ❌ |

**Tipos ENUM:** `estado_orden` (En Proceso, Completada, Retrasada) · `prioridad_orden` y `dificultad_orden` (Baja, Media, Alta) · `estado_comprobante` (Pendiente, Entregado) · `estado_usuario` (activo, inactivo).

### 4.2 Definición (CREATE TABLE) de las tablas principales

Extracto fiel del esquema. Las secuencias (`SERIAL`) y restricciones se muestran en su forma equivalente compacta. El esquema completo está en el Anexo D.

```sql
CREATE TABLE empresa (
  "Id_Empresa"     SERIAL PRIMARY KEY,
  "Nombre_Empresa" VARCHAR(160) NOT NULL,
  "Slug"           VARCHAR(80)  NOT NULL UNIQUE,
  "Estado"         VARCHAR(20)  NOT NULL DEFAULT 'activa' CHECK ("Estado" IN ('activa','inactiva')),
  "Fecha_Creacion" TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  "Updated_At"     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE usuario (
  "Id_Usuario"      SERIAL PRIMARY KEY,
  "Id_Rol"          INTEGER NOT NULL REFERENCES rol("Id_Rol") ON UPDATE CASCADE ON DELETE CASCADE,
  "Nombre_Completo" VARCHAR(100) NOT NULL,
  "Nombre_Usuario"  VARCHAR(50)  NOT NULL UNIQUE,
  "Correo"          VARCHAR(120) NOT NULL UNIQUE,
  "Telefono"        VARCHAR(20),
  "Estado"          estado_usuario NOT NULL DEFAULT 'activo',
  "Contrasena"      VARCHAR(255) NOT NULL,          -- hash bcrypt, nunca texto plano
  "Fecha_Registro"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_empresa (
  "Id_Usuario"     INTEGER NOT NULL REFERENCES usuario("Id_Usuario") ON DELETE CASCADE,
  "Id_Empresa"     INTEGER NOT NULL REFERENCES empresa("Id_Empresa") ON DELETE CASCADE,
  "Id_Rol"         INTEGER NOT NULL REFERENCES rol("Id_Rol"),
  "Estado"         VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK ("Estado" IN ('activo','inactivo')),
  "Es_Principal"   BOOLEAN NOT NULL DEFAULT false,
  "Fecha_Registro" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("Id_Usuario", "Id_Empresa"),
  CONSTRAINT usuario_empresa_un_usuario_unique UNIQUE ("Id_Usuario")  -- una empresa por usuario
);

CREATE TABLE material (
  "Id_Material"     SERIAL PRIMARY KEY,
  "Nombre_Material" VARCHAR(100) NOT NULL,
  "Categoria"       VARCHAR(80)  NOT NULL,
  "Stock_Actual"    INTEGER NOT NULL DEFAULT 0,
  "Unidad"          VARCHAR(30)  NOT NULL,
  "Stock_Minimo"    INTEGER NOT NULL DEFAULT 0 CHECK ("Stock_Minimo" >= 0),
  "Stock_Maximo"    INTEGER NOT NULL DEFAULT 0,
  "Fecha"           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "Id_Cliente"      INTEGER REFERENCES usuario("Id_Usuario") ON UPDATE CASCADE ON DELETE SET NULL,
  "Activo"          BOOLEAN NOT NULL DEFAULT true,  -- soft delete
  "Id_Empresa"      INTEGER NOT NULL REFERENCES empresa("Id_Empresa"),
  CONSTRAINT material_id_empresa_unique UNIQUE ("Id_Material", "Id_Empresa"),
  FOREIGN KEY ("Id_Cliente", "Id_Empresa") REFERENCES usuario_empresa("Id_Usuario", "Id_Empresa")
);

CREATE TABLE orden_produccion (
  "Id_Orden"            SERIAL PRIMARY KEY,
  "Id_Cliente"          INTEGER NOT NULL,
  "Id_Material"         INTEGER NOT NULL,
  "Id_Operario"         INTEGER,
  "Producto"            VARCHAR(100),
  "Cantidad"            INTEGER NOT NULL,
  "Prioridad"           prioridad_orden  NOT NULL DEFAULT 'Media',
  "Dificultad"          dificultad_orden NOT NULL DEFAULT 'Media',
  "Estado"              estado_orden     NOT NULL DEFAULT 'En Proceso',
  "Fecha_Limite"        DATE NOT NULL,
  "Descripcion"         VARCHAR(150) NOT NULL,
  "Unidades"            INTEGER,
  "Unidades_Realizadas" INTEGER,
  "Fecha_Creacion"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "Id_Empresa"          INTEGER NOT NULL REFERENCES empresa("Id_Empresa"),
  CONSTRAINT orden_produccion_id_empresa_unique UNIQUE ("Id_Orden", "Id_Empresa"),
  FOREIGN KEY ("Id_Cliente")  REFERENCES usuario("Id_Usuario")  ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("Id_Operario") REFERENCES usuario("Id_Usuario")  ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY ("Id_Material") REFERENCES material("Id_Material") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("Id_Cliente",  "Id_Empresa") REFERENCES usuario_empresa("Id_Usuario", "Id_Empresa"),
  FOREIGN KEY ("Id_Operario", "Id_Empresa") REFERENCES usuario_empresa("Id_Usuario", "Id_Empresa"),
  FOREIGN KEY ("Id_Material", "Id_Empresa") REFERENCES material("Id_Material", "Id_Empresa")
);

CREATE TABLE orden_operario (
  "Id_Orden_Operario"  SERIAL PRIMARY KEY,
  "Id_Orden"           INTEGER NOT NULL REFERENCES orden_produccion("Id_Orden") ON DELETE CASCADE,
  "Id_Operario"        INTEGER NOT NULL REFERENCES usuario("Id_Usuario"),
  "Numero_Fase"        INTEGER NOT NULL CHECK ("Numero_Fase" > 0),
  "Descripcion_Fase"   TEXT,
  "Cantidad_Realizada" INTEGER NOT NULL DEFAULT 0 CHECK ("Cantidad_Realizada" >= 0),
  "Estado_Fase"        TEXT NOT NULL DEFAULT 'Pendiente'
                       CHECK ("Estado_Fase" IN ('Pendiente','En Proceso','Completada')),
  "Nota_Operario"      TEXT,
  "Fecha_Completada"   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "Id_Empresa"         INTEGER NOT NULL REFERENCES empresa("Id_Empresa"),
  UNIQUE ("Id_Orden", "Numero_Fase", "Id_Operario"),
  FOREIGN KEY ("Id_Orden", "Id_Empresa")    REFERENCES orden_produccion("Id_Orden", "Id_Empresa"),
  FOREIGN KEY ("Id_Operario", "Id_Empresa") REFERENCES usuario_empresa("Id_Usuario", "Id_Empresa")
);

CREATE TABLE orden_material (                       -- tabla intermedia N:M orden ↔ material
  "Id_Orden"       INTEGER NOT NULL REFERENCES orden_produccion("Id_Orden") ON UPDATE CASCADE ON DELETE CASCADE,
  "Id_Producto"    INTEGER NOT NULL REFERENCES material("Id_Material")      ON UPDATE CASCADE ON DELETE CASCADE,
  "Cantidad_Usada" INTEGER NOT NULL,
  "Id_Empresa"     INTEGER NOT NULL REFERENCES empresa("Id_Empresa"),
  PRIMARY KEY ("Id_Orden", "Id_Producto"),
  FOREIGN KEY ("Id_Orden", "Id_Empresa")    REFERENCES orden_produccion("Id_Orden", "Id_Empresa"),
  FOREIGN KEY ("Id_Producto", "Id_Empresa") REFERENCES material("Id_Material", "Id_Empresa")
);

CREATE TABLE material_movimiento (                  -- kárdex de inventario
  "Id_Movimiento" SERIAL PRIMARY KEY,
  "Id_Material"   INTEGER NOT NULL REFERENCES material("Id_Material") ON DELETE CASCADE,
  "Tipo"          VARCHAR(20) NOT NULL,             -- Creacion | Entrada | Salida
  "Cantidad"      NUMERIC NOT NULL,                 -- negativa en salidas
  "Fecha"         TIMESTAMP NOT NULL DEFAULT now(),
  "Nota"          TEXT,
  "Id_Orden"      INTEGER REFERENCES orden_produccion("Id_Orden") ON DELETE SET NULL,
  "Id_Empresa"    INTEGER NOT NULL REFERENCES empresa("Id_Empresa")
);

CREATE TABLE comprobantes (
  "Id_Comprobante" SERIAL PRIMARY KEY,
  "Id_Usuario"     INTEGER NOT NULL REFERENCES usuario("Id_Usuario") ON UPDATE CASCADE ON DELETE CASCADE,
  "Id_Orden"       INTEGER NOT NULL REFERENCES orden_produccion("Id_Orden") ON UPDATE CASCADE ON DELETE CASCADE,
  "Estado"         estado_comprobante NOT NULL DEFAULT 'Pendiente',
  "Fecha_Limite"   DATE DEFAULT CURRENT_DATE,
  "Id_Empresa"     INTEGER NOT NULL REFERENCES empresa("Id_Empresa"),
  FOREIGN KEY ("Id_Orden", "Id_Empresa")   REFERENCES orden_produccion("Id_Orden", "Id_Empresa"),
  FOREIGN KEY ("Id_Usuario", "Id_Empresa") REFERENCES usuario_empresa("Id_Usuario", "Id_Empresa")
);
```

**Patrón clave del multiempresa: FK compuestas.** Cada tabla operativa tiene `UNIQUE (Id, Id_Empresa)` y sus hijas referencian el **par** `(Id, Id_Empresa)`. Así la base de datos misma impide, por ejemplo, asignar a una orden de la empresa A un material de la empresa B, aunque el backend tuviera un error.

### 4.3 Relaciones

![Modelo entidad-relación de Texticode](img/modelo_er.png)

```
rol (1) ────< (N) usuario (1) ──── (1) usuario_empresa >──── (1) empresa
empresa (1) ────< (N) material | orden_produccion | ... (todas las tablas operativas)
usuario_empresa (1) ────< (N) orden_produccion   (como cliente y como operario)
orden_produccion (1) ────< (N) orden_operario    (fases)
orden_produccion (1) ────< (N) orden_material >──── (1) material      ← relación N:M
orden_produccion (1) ────< (N) usuario_orden  >──── (1) usuario       ← relación N:M
orden_produccion (1) ────< (N) comprobantes
material (1) ────< (N) material_movimiento                            ← kárdex
```

`orden_material` cumple el mismo papel que `detalles_factura` en EBS: resuelve la relación **muchos a muchos** entre órdenes y materiales y guarda la cantidad de cada línea.

> **Pregunta para pensar 1: ¿por qué guardar el precio en el detalle si el producto ya lo tiene?** Porque el detalle es una **foto del momento** de la venta. Si mañana cambia `precio_venta`, las facturas viejas no deben cambiar su total. En Texticode pasa lo mismo con `orden_material.Cantidad_Usada` y con `material_movimiento.Cantidad`: registran cuánto se consumió **en ese momento**, aunque luego cambie el stock o la configuración del material.

> **Pregunta para pensar 2: ¿por qué RESTRICT con clientes y CASCADE con detalles?** Un cliente con facturas es información de negocio que no debe desaparecer por un clic, así que se **bloquea** el borrado. Un detalle no tiene sentido sin su factura, así que se borra **en cascada**. En Texticode, `orden_operario → orden_produccion` es `CASCADE` (una fase no existe sin su orden) y `orden_produccion.Id_Operario → usuario` es `SET NULL` (si un operario se elimina, la orden se conserva sin operario).

### 4.4 Hallazgo en las reglas ON DELETE (probado)

Al probar las reglas en la base local (Anexo D, prueba P3) apareció un **error real**:

```
DELETE FROM orden_produccion WHERE "Id_Orden" = 1;
ERROR:  update or delete on table "orden_produccion" violates foreign key constraint
        "fk_oo_orden_empresa" on table "orden_operario"
```

**Causa:** `orden_operario` tiene dos FK hacia la orden. La simple (`Id_Orden`) tiene `ON DELETE CASCADE`, pero la compuesta (`Id_Orden, Id_Empresa`), agregada en la migración multiempresa, quedó con la regla por defecto, `NO ACTION`, que **bloquea** el borrado. Lo mismo ocurre con `orden_material`, `usuario_orden`, `comprobantes`, `material_movimiento` y `observacion_operario`. **Consecuencia:** `DELETE /api/ordenes/:id` falla con error 500 para cualquier orden que tenga fases, materiales o comprobantes.

**Corrección propuesta** (`DATABASE/propuestas/04_correccion_fk_cascade.sql`, probada en local):

```sql
ALTER TABLE orden_operario DROP CONSTRAINT fk_oo_orden_empresa,
  ADD CONSTRAINT fk_oo_orden_empresa FOREIGN KEY ("Id_Orden","Id_Empresa")
  REFERENCES orden_produccion("Id_Orden","Id_Empresa") ON DELETE CASCADE;
-- (igual para orden_material, usuario_orden y comprobantes)

-- El kárdex y las observaciones conservan el historial: solo Id_Orden pasa a NULL
ALTER TABLE material_movimiento DROP CONSTRAINT fk_material_movimiento_orden_empresa,
  ADD CONSTRAINT fk_material_movimiento_orden_empresa FOREIGN KEY ("Id_Orden","Id_Empresa")
  REFERENCES orden_produccion("Id_Orden","Id_Empresa") ON DELETE SET NULL ("Id_Orden");
```

Resultado tras aplicarla: `DELETE 1`, 0 fases huérfanas, y el movimiento de inventario se conserva con `Id_Orden = NULL` y `Id_Empresa = 1`. La sintaxis `SET NULL (columna)` existe desde PostgreSQL 15, así que es compatible con Supabase (17.6).

### 4.5 Índices

| Índice | Columnas | Búsqueda que acelera |
|--------|----------|----------------------|
| `idx_orden_produccion_empresa_estado` | `(Id_Empresa, Estado)` | Tablero de producción filtrado por estado (`GET /ordenes/estado/:estado`) |
| `idx_orden_produccion_empresa_operario` | `(Id_Empresa, Id_Operario)` | "Mis tareas" del operario (`GET /ordenes/operario/:id`) |
| `idx_orden_produccion_empresa_cliente` | `(Id_Empresa, Id_Cliente)` | "Mis pedidos" del cliente |
| `idx_material_empresa_activo` | `(Id_Empresa, Activo)` | Inventario sin materiales dados de baja |
| `idx_material_movimiento_material_fecha` | `(Id_Material, Fecha)` | Kárdex de un material en orden cronológico y reporte histórico por período |
| `idx_orden_operario_historial` | `(Id_Operario, Fecha_Completada DESC) WHERE Fecha_Completada IS NOT NULL` | Historial de fases completadas (índice **parcial**: solo indexa las filas completadas) |
| `idx_usuario_empresa_empresa_rol_estado` | `(Id_Empresa, Id_Rol, Estado)` | Listar operarios o clientes activos de una empresa |
| `material_empresa_nombre_unique` | `UNIQUE (Id_Empresa, Nombre_Material)` | Impide materiales duplicados **dentro** de una empresa (dos empresas sí pueden tener "Dril azul") |

Todos los índices compuestos empiezan por `Id_Empresa` porque **todas** las consultas operativas filtran primero por empresa.

### 4.6 Trigger

```sql
CREATE FUNCTION set_orden_operario_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orden_operario_updated_at
  BEFORE UPDATE ON orden_operario
  FOR EACH ROW EXECUTE FUNCTION set_orden_operario_updated_at();
```

**Prueba (P1):** se actualizó `Cantidad_Realizada` de una fase y `updated_at` quedó posterior a `created_at` sin que el backend lo enviara (`updated_at_actualizado = t`).

### 4.7 Función SQL de negocio

```sql
CREATE FUNCTION actualizar_ordenes_retrasadas() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE orden_produccion
  SET "Estado" = 'Retrasada'
  WHERE "Fecha_Limite" < CURRENT_DATE
    AND "Estado" = 'En Proceso';
END;
$$;

-- Uso
SELECT actualizar_ordenes_retrasadas();
```

**Prueba (P2):** la orden 1 (vencida hace 3 días) pasó de `En Proceso` a `Retrasada`; la orden 2 (vence en 10 días) siguió `En Proceso`.

**Cómo se usa hoy:** el backend aplica la misma regla **filtrada por empresa** (`actualizarOrdenesRetrasadas(empresaId)` en `routes/ordenes.js`) justo antes de listar órdenes, es decir, bajo demanda. La función SQL actualiza **todas** las empresas a la vez, así que es la candidata para un trabajo diario con `pg_cron` **(Futuro)**.

### 4.8 Soft delete

`material.Activo` y `usuario.Estado = 'inactivo'` implementan el borrado lógico. Los usuarios se inactivan con `PATCH /api/usuarios/:id/inactivar` y las empresas se desactivan (`DELETE /api/empresas/:id` cambia `Estado` a `inactiva`). Así se conserva el historial de órdenes y movimientos.

### 4.9 Ejecución y pruebas

El esquema se cargó sin errores en un PostgreSQL limpio junto con datos sintéticos (2 empresas, 5 usuarios, 3 materiales, 2 órdenes y 2 fases). Luego se ejecutaron las pruebas P1–P7. Los scripts están en `DATABASE/propuestas/` y la salida completa en el Anexo D.

---

## 5. APIs y Endpoints

### 5.1 Diseño del API

A diferencia de EBS, Texticode **no** usa la API REST autogenerada de Supabase: expone su propia **API REST en Express** bajo `/api`. Convenciones:

| Método | Acción | SQL equivalente | Respuesta |
|--------|--------|-----------------|-----------|
| `GET` | Consultar | `SELECT` | `200` + JSON |
| `POST` | Crear | `INSERT` | `201` + Id creado |
| `PUT` | Reemplazar o actualizar | `UPDATE` | `200` |
| `PATCH` | Acción puntual (inactivar, completar, activar) | `UPDATE` | `200` |
| `DELETE` | Eliminar o desactivar | `DELETE` / soft delete | `200` |

Errores: `400` (datos inválidos o stock insuficiente), `401` (sin sesión o sesión expirada), `403` (sin permiso o empresa no autorizada), `404`, `409` (duplicado) y `500`. El cuerpo siempre es `{ "error": "mensaje" }`.

### 5.2 Catálogo de endpoints (16 módulos)

| Módulo | Endpoints | Protección |
|--------|-----------|------------|
| `/api/auth` | `POST /login`, `POST /google/mobile`, `POST /recuperar-contrasena`, `GET /validar-token`, `POST /cambiar-contrasena` | Pública |
| `/api/empresas` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/activar`, `GET/PUT /:id/administradores/...` | superadmin |
| `/api/usuarios` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/inactivar`, `DELETE /:id` | admin (o el mismo usuario en `GET/PUT /:id`) |
| `/api/materiales` | `GET /`, `GET /:id`, `GET /cliente/:idCliente`, `GET /alertas/stock-bajo`, `GET /:id/movimientos`, `GET /reportes/historial`, `POST`, `PUT`, `DELETE` | admin (cliente: solo sus materiales) |
| `/api/ordenes` | `GET /`, `GET /:id`, `GET /operario/:id`, `GET /cliente/:id`, `GET /estado/:estado`, `POST`, `PUT`, `DELETE` | admin (operario y cliente: solo las suyas) |
| `/api/orden-material` | `GET /orden/:idOrden`, `POST /`, `PUT /:idOrden/:idProducto`, `DELETE /:idOrden/:idProducto` | admin |
| `/api/orden-operario` | `GET /orden/:id`, `GET /operario/:id`, `GET /operario/:id/historial`, `POST`, `PUT`, `PATCH /:id/completar`, `DELETE` | admin (operario: sus fases) |
| `/api/comprobantes` | `GET /`, `GET /:id`, `GET /cliente/:idCliente`, `POST`, `PUT`, `DELETE` | admin (cliente: los suyos) |
| `/api/usuario-orden` | `GET /orden/:id`, `GET /usuario/:id`, `POST`, `DELETE` | admin |
| `/api/eficiencia` | `GET /operarios`, `GET /operarios/:id`, `GET /operarios/:id/historial`, observaciones (`GET/POST/DELETE`) | admin |
| `/api/carga-trabajo` | `GET /`, `GET /sugerencias`, `POST /reasignar`, `POST /aplicar-sugerencias`, `PATCH /umbrales`, ... | admin |
| `/api/notificaciones` | `POST /estado`, `POST /comprobante`, `POST /tarea`, `GET /estadisticas` | admin |
| `/api/google`, `/api/calendar` | OAuth (`/auth-url`, `/callback`), estado, sincronización de eventos | Sesión |
| `/api/roles` | `GET /`, `GET /:id` · `POST/PUT/DELETE` | Lectura: admin · Escritura: ver hallazgo en 6.6 |
| `/api/practica` | Consultas con JOIN, filtros, orden y paginación | Sesión |
| `/health` | Estado del servicio | Pública |

### 5.3 CRUD de las tablas principales: formato URL y formato JavaScript

**Materiales**

```text
GET    /api/materiales                       → lista de la empresa (admin)
GET    /api/materiales/alertas/stock-bajo    → Stock_Actual <= Stock_Minimo
POST   /api/materiales        { Nombre_Material, Categoria, Stock_Actual, Unidad, Stock_Minimo, Stock_Maximo, Id_Cliente }
PUT    /api/materiales/12     { ...campos editables }
DELETE /api/materiales/12     → baja con movimiento de salida en el kárdex
```

```javascript
import { getMateriales, getStockBajo, crearMaterial, actualizarMaterial, eliminarMaterial } from '@/services/api'
const materiales = await getMateriales()
const alertas    = await getStockBajo()
await crearMaterial({ Nombre_Material: 'Dril azul', Categoria: 'Telas', Stock_Actual: 200,
                      Unidad: 'Metros', Stock_Minimo: 50, Stock_Maximo: 500, Id_Cliente: null })
```

**Órdenes de producción**

```text
GET    /api/ordenes                     → todas las de la empresa (admin)
GET    /api/ordenes/operario/7          → las del operario 7 (el propio operario o admin)
GET    /api/ordenes/estado/Retrasada    → filtro por estado
POST   /api/ordenes   { Id_Cliente, Id_Material, Id_Operario, Producto, Descripcion, Cantidad,
                        Prioridad, Fecha_Limite, Estado, Dificultad }
PUT    /api/ordenes/15  { ... }
DELETE /api/ordenes/15
```

```javascript
import { getOrdenes, getOrdenesDeOperario, crearOrden } from '@/services/api'
const mias = await getOrdenesDeOperario(auth.idUsuario)
const { Id_Orden } = await crearOrden({ Id_Cliente: 3, Id_Material: 1, Cantidad: 50,
  Descripcion: 'Overol dril talla M', Fecha_Limite: '2026-11-15', Prioridad: 'Alta' })
```

**Fases del operario**

```text
PATCH /api/orden-operario/21/completar   { Nota_Operario: "Corte terminado" }
```

```javascript
await completarFaseOperario(21, { Nota_Operario: 'Corte terminado' })
```

### 5.4 Consultas con JOIN

**1. Orden con nombre del cliente, del material y del operario** (`GET /api/ordenes`, `routes/ordenes.js`):

```sql
SELECT op.*,
       u."Nombre_Completo"   AS "Cliente",
       m."Nombre_Material"   AS "NombreMaterial",
       opr."Nombre_Completo" AS "Operario"
FROM orden_produccion op
INNER JOIN usuario  u   ON op."Id_Cliente"  = u."Id_Usuario"
INNER JOIN material m   ON op."Id_Material" = m."Id_Material" AND m."Id_Empresa" = op."Id_Empresa"
LEFT  JOIN usuario  opr ON op."Id_Operario" = opr."Id_Usuario"     -- LEFT: la orden puede no tener operario
WHERE op."Id_Empresa" = $1
ORDER BY op."Fecha_Limite" ASC;
```

**2. Materiales de una orden con su unidad** (`GET /api/orden-material/orden/:idOrden`):

```sql
SELECT om.*, m."Nombre_Material", m."Unidad"
FROM orden_material om
INNER JOIN material m ON om."Id_Producto" = m."Id_Material" AND m."Id_Empresa" = om."Id_Empresa"
WHERE om."Id_Orden" = $1 AND om."Id_Empresa" = $2;
```

Las dos usan **parámetros posicionales** (`$1`, `$2`): el texto del usuario nunca se concatena dentro del SQL.

### 5.5 "Hook" de paginación (composable de Vue)

En Vue, el equivalente a un *hook* de React es un **composable**. Este consume el endpoint paginado real del backend (`GET /api/practica/usuarios?page=&limit=`, que hace `LIMIT/OFFSET` filtrando por la empresa del token).

```javascript
// src/composables/usePaginacion.js
import { ref, computed, watch } from 'vue'

export function usePaginacion(fetcher, tamano = 10) {
  const items    = ref([])
  const pagina   = ref(1)
  const cargando = ref(false)
  const error    = ref(null)
  const hayMas   = computed(() => items.value.length === tamano)

  async function cargar() {
    cargando.value = true
    error.value = null
    try {
      items.value = await fetcher({ page: pagina.value, limit: tamano })
    } catch (e) {
      error.value = e.message || 'No se pudieron cargar los datos'
      items.value = []
    } finally {
      cargando.value = false
    }
  }
  function siguiente() { if (hayMas.value) pagina.value++ }
  function anterior()  { if (pagina.value > 1) pagina.value-- }
  watch(pagina, cargar, { immediate: true })

  return { items, pagina, cargando, error, hayMas, siguiente, anterior, recargar: cargar }
}

// services/api.js
export const getUsuariosPaginados = ({ page = 1, limit = 10 } = {}) =>
  request(`/practica/usuarios?page=${page}&limit=${limit}`)
```

```vue
<script setup>
import { usePaginacion } from '@/composables/usePaginacion'
import { getUsuariosPaginados } from '@/services/api'
const { items, pagina, cargando, error, hayMas, siguiente, anterior } = usePaginacion(getUsuariosPaginados, 10)
</script>
<template>
  <p v-if="cargando">Cargando…</p>
  <p v-else-if="error" class="error">{{ error }}</p>
  <ul v-else><li v-for="u in items" :key="u.Id_Usuario">{{ u.Nombre_Completo }}</li></ul>
  <button :disabled="pagina === 1" @click="anterior">Anterior</button>
  <span>Página {{ pagina }}</span>
  <button :disabled="!hayMas" @click="siguiente">Siguiente</button>
</template>
```

**Prueba (22/10/2026):** con 12 registros y páginas de 5, el composable devolvió `1–5`, `6–10` y `11–12`. `siguiente()` en la última página no avanzó, y ante un error del servidor dejó `error = "Sesión expirada."`, `items = []` y `cargando = false`. **Estado:** composable nuevo **(Propuesta)**, entregado junto a este documento para integrarlo en `GestionUsuarios.vue`.

### 5.6 Manejo de errores en el cliente

`request()` convierte cualquier respuesta no exitosa en `throw new Error(data.error)`. Cada vista envuelve la llamada en `try/catch` y muestra el mensaje en su estado de error (`errorGuardar`, `error.value`, etc.). Los fallos de red (`TypeError: Failed to fetch`) llegan al mismo `catch`.

### 5.7 🕵️ Actividad "Encuentra el error" (documento de referencia EBS)

**1. `GET /productos?stock_actual=lt.stock_minimo` no funciona.** En PostgREST (la API REST de Supabase), el valor después del operador es un **literal**: el filtro compara `stock_actual < 'stock_minimo'` (un texto), no contra la otra columna. PostgreSQL intenta convertir `'stock_minimo'` a número y la petición falla con error 400. PostgREST no permite comparar dos columnas en un filtro. **Alternativas:** una vista (`CREATE VIEW productos_bajo_stock AS SELECT * FROM productos WHERE stock_actual < stock_minimo`) consultada como `GET /productos_bajo_stock`, o una función RPC. *En Texticode este caso se resuelve en el backend:* `GET /api/materiales/alertas/stock-bajo` ejecuta `WHERE m."Stock_Actual" <= m."Stock_Minimo"` directamente en SQL.

**2. `supabase.raw(...)` no existe en `supabase-js`.** El cliente no tiene ningún método `raw` para insertar SQL dentro de un `update`. Además, construir la expresión con `${invoiceData.total}` sería una invitación a la inyección. **Alternativa correcta:** una función en la base de datos y llamarla por RPC, para que el incremento sea atómico:

```sql
CREATE FUNCTION incrementar_saldo(p_cliente uuid, p_monto numeric) RETURNS void
LANGUAGE sql AS $$ UPDATE clientes SET saldo_actual = saldo_actual + p_monto WHERE id = p_cliente $$;
```

```javascript
await supabase.rpc('incrementar_saldo', { p_cliente: clienteId, p_monto: invoiceData.total })
```

**3. Reto extra: "Crear Factura Completa" no es una transacción.** Son tres peticiones HTTP independientes. Si la segunda falla, la primera **ya quedó guardada**: queda una factura sin detalles o un saldo sin actualizar, sin `ROLLBACK` posible desde el navegador. La solución es una sola función RPC que haga todo dentro de la base de datos (PostgreSQL ejecuta la función completa en una transacción).

**Autoevaluación en Texticode.** El endpoint `POST /api/orden-material` sí es transaccional (sección 3.3). Pero el **flujo completo** de "Guardar orden" en `GestionProduccion.vue` tiene exactamente el problema del reto: llama por separado a `crearOrden` → `crearComprobante` → `eliminarMaterialOrden` (por cada material) → `agregarMaterialOrden` (por cada material) → fases. El propio comentario del código lo reconoce: *"La orden en sí ya quedó creada/actualizada antes de este punto — eso no se revierte"*. **(Propuesta):** un endpoint `POST /api/ordenes/completa` que reciba orden, materiales y fases y los guarde en **una sola transacción** del backend.

---

## 6. Seguridad

![Modelo de seguridad por capas](img/seguridad_capas.png)

### 6.1 Autenticación

| Mecanismo | Implementación |
|-----------|----------------|
| Contraseñas | Hash **bcrypt** (`bcryptjs`, 10 rondas); nunca se guardan ni se devuelven en texto plano |
| Política de contraseña | Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (`validarContrasena`, abajo) |
| Sesión | **JWT** firmado con `JWT_SECRET` (HS256), vigencia `JWT_EXPIRES = 8h`; payload `{ id, rol, empresa, rolNombre }` |
| Revalidación | En **cada** petición, `requireAuth` vuelve a leer de la base de datos el usuario, su estado y su membresía activa. Un usuario inactivado pierde el acceso de inmediato, aunque su token no haya vencido |
| Recuperación | Token aleatorio de un solo uso (`tokens_recuperacion`, con vencimiento) enviado por SendGrid |
| Google | OAuth 2.0; en móvil se verifica el `idToken` contra `oauth2.googleapis.com/tokeninfo` |

**Función de validación de formulario (real, `routes/auth.route.js`):**

```javascript
function validarContrasena(contrasena) {
  if (contrasena.length < 8)               return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(contrasena))           return 'La contraseña debe tener al menos una letra mayúscula.'
  if (!/[0-9]/.test(contrasena))           return 'La contraseña debe tener al menos un número.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena))
    return 'La contraseña debe tener al menos un carácter especial (@, #, $, etc.).'
  return null
}
```

### 6.2 Autorización: matriz de permisos por rol

L = leer · C = crear · E = editar · B = borrar · "propio" = solo sus registros.

| Tabla / recurso | Superadmin | Administrador | Operario | Cliente |
|-----------------|-----------|---------------|----------|---------|
| `empresa` | L C E B (desactivar) | — | — | — |
| `usuario` (de su empresa) | Admins de cada empresa | L C E B | L E propio | L E propio |
| `material` | — | L C E B | L | L propio (`Id_Cliente`) |
| `orden_produccion` | — | L C E B | L propio (`Id_Operario`) | L propio (`Id_Cliente`) |
| `orden_operario` (fases) | — | L C E B | L propio · completar | — |
| `orden_material` | — | L C E B | — | — |
| `comprobantes` | — | L C E B | — | L propio |
| `rol` | — | L | — | — |
| Eficiencia, carga de trabajo, notificaciones | — | L C E | — | — |

Se implementa con tres *middlewares*: `requireRoles('admin')`, `requireSelfParamOrRoles('idOperario', 'admin')` (deja pasar al admin o al dueño del recurso) y `requireSuperadmin`. El superadmin **no tiene empresa**, así que `requireAuth` le niega todas las rutas operativas (`403 El superadmin no tiene acceso a rutas operativas`).

### 6.3 Aislamiento multiempresa (la seguridad real hoy)

1. El `Id_Empresa` **solo** sale del JWT firmado (`req.auth.empresaId`). Body, query y params no pueden reemplazarlo.
2. Cada consulta operativa incluye `AND "Id_Empresa" = $n`.
3. Las FK compuestas impiden relacionar datos de dos empresas en la base de datos.
4. **Pruebas automáticas:** `BACKEND/test/*-aislamiento.test.js` verifica, módulo por módulo, que un recurso de otra empresa responde `404` sin modificar nada.

**Resultado de `npm test` (22/10/2026): 87 pruebas · 82 pasan · 5 fallan.** Las 5 fallas no son vulnerabilidades: son pruebas **desactualizadas**. Cuatro siguen esperando el diseño anterior, donde un usuario podía pertenecer a varias empresas y elegir una al iniciar sesión, pero el equipo decidió en octubre que cada usuario pertenece a **una sola** empresa. La quinta busca una línea de `import` que cambió tras un *refactor*. **(Pendiente):** actualizar esas 5 pruebas.

### 6.4 Row Level Security (RLS)

**Estado actual en la base de datos:** RLS está **activada en 8 tablas** (`empresa`, `empresa_config`, `rol`, `usuario`, `usuario_empresa`, `material_movimiento`, `orden_operario`, `usuario_orden`), con una sola política (`rol`: lectura para todos). Como no tienen políticas para los roles `anon` ni `authenticated`, esas tablas quedan **cerradas** a la API REST pública de Supabase (*deny-by-default*). El backend no se ve afectado porque se conecta con el rol dueño de las tablas, que no está sujeto a RLS.

**Riesgo identificado:** las **7 tablas restantes** (`material`, `orden_produccion`, `orden_material`, `comprobantes`, `observacion_operario`, `google_calendar_tokens`, `tokens_recuperacion`) **no** tienen RLS. Supabase concede por defecto permisos sobre el esquema `public` a los roles `anon` y `authenticated`. Si alguien obtuviera la URL del proyecto y la `anon key`, podría leerlas por la API REST, incluidos tokens de Google y de recuperación de contraseña. Texticode **no** publica la `anon key` (el frontend no usa `supabase-js`), lo que reduce el riesgo pero no lo elimina.

**Decisión del equipo (octubre de 2026):** aislar por filtros en el backend y no depender de RLS por ahora. Para cumplir el principio *Security by Design* se diseñó y **probó** una capa adicional **(Propuesta, no aplicada en producción)**:

```sql
-- Rol de aplicación SIN privilegio para saltarse RLS
CREATE ROLE texticode_app NOLOGIN NOBYPASSRLS;

-- Contexto de la petición, fijado por el backend al iniciar cada transacción:
--   SELECT set_config('app.empresa_id', $1, true), set_config('app.usuario_id', $2, true), set_config('app.rol', $3, true);
CREATE FUNCTION app_empresa_id() RETURNS integer LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.empresa_id', true), '')::integer $$;

ALTER TABLE material ENABLE ROW LEVEL SECURITY;   -- y las otras 6 tablas sin RLS

-- material: todos leen solo su empresa; solo el administrador modifica; nadie borra (soft delete)
CREATE POLICY material_select_empresa ON material FOR SELECT TO texticode_app
  USING ("Id_Empresa" = app_empresa_id());
CREATE POLICY material_update_admin ON material FOR UPDATE TO texticode_app
  USING ("Id_Empresa" = app_empresa_id() AND app_rol() IN ('admin','administrador'))
  WITH CHECK ("Id_Empresa" = app_empresa_id());
CREATE POLICY material_no_delete ON material FOR DELETE TO texticode_app USING (false);

-- orden_operario: el admin ve las fases de su empresa; el operario solo las suyas
CREATE POLICY fases_select ON orden_operario FOR SELECT TO texticode_app
  USING ("Id_Empresa" = app_empresa_id()
         AND (app_rol() IN ('admin','administrador') OR "Id_Operario" = app_usuario_id()));
CREATE POLICY fases_update ON orden_operario FOR UPDATE TO texticode_app
  USING ("Id_Empresa" = app_empresa_id()
         AND (app_rol() IN ('admin','administrador') OR "Id_Operario" = app_usuario_id()))
  WITH CHECK ("Id_Empresa" = app_empresa_id());
```

**Pruebas con usuarios de distinto rol** (base local con el esquema real, 22/10/2026):

| Prueba | Contexto | Resultado obtenido | ¿Correcto? |
|--------|----------|--------------------|------------|
| P4 | **Administrador**, empresa 1 | Ve 2 materiales, 2 órdenes y 2 fases. `UPDATE` de su material: **1 fila**. `UPDATE` del material de la empresa 2: **0 filas** | ✅ |
| P5 | **Operario** (usuario 2), empresa 1 | Ve 2 materiales, **1** orden y **1** fase (las suyas). `UPDATE material`: **0 filas** (no puede modificar inventario). `UPDATE` de su fase: **1 fila**. `UPDATE` de la fase de otro operario: **0 filas** | ✅ |
| P6 | **Administrador**, empresa 2 | Ve 1 material ("Antifluido blanco") y **0** órdenes de la empresa 1 | ✅ |
| P7 | Sin contexto de empresa | 0 materiales, 0 tokens; `DELETE material`: **0 filas** | ✅ |

> **Pregunta para pensar: ¿funciona `auth.jwt() ->> 'role' = 'admin'` si el rol se guarda en `user_metadata`?** **No.** En el JWT de Supabase, `role` es un *claim* reservado que vale `"authenticated"` o `"anon"` (el rol de PostgreSQL con el que se ejecuta la consulta). Lo que se guarda en `user_metadata` queda **anidado** en `auth.jwt() -> 'user_metadata' ->> 'role'`, y además el propio usuario puede editar `user_metadata` desde el cliente, así que **no es confiable** para autorizar. La forma correcta es guardar el rol en `app_metadata` (solo lo modifica el servidor) y leerlo con `auth.jwt() -> 'app_metadata' ->> 'role'`, o agregar un *custom claim* con un **Custom Access Token Hook** de Supabase. Texticode evita este problema porque firma su propio JWT en el backend.

### 6.5 Variables de entorno

Valores **de ejemplo**, nunca los reales. El archivo `.env` está en `.gitignore`.

```bash
# BACKEND/.env
DATABASE_URL=postgresql://usuario:contraseña@host:5432/texticode   # obligatoria
JWT_SECRET=cadena_aleatoria_de_al_menos_32_caracteres             # obligatoria
JWT_EXPIRES=8h
FRONTEND_URL=https://texticode-lime.vercel.app
PORT=3001
DB_SSL=                      # vacío = automático (SSL solo si el host es remoto)
SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM_EMAIL=notificaciones@ejemplo.com
SENDGRID_FROM_NAME=Texticode
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback

# FRONTEND/.env  (las variables VITE_ quedan visibles en el navegador: nunca poner secretos aquí)
VITE_API_URL=http://localhost:3001/api

# .env.docker  (contenedor de PostgreSQL)
POSTGRES_USER=texticode
POSTGRES_PASSWORD=cambiar_esta_clave
POSTGRES_DB=texticode
```

`config/env.js` hace que el backend **no arranque** si faltan `DATABASE_URL` o `JWT_SECRET`.

### 6.6 Otras protecciones y hallazgos

| Amenaza | Protección en Texticode | Estado |
|---------|-------------------------|--------|
| Inyección SQL | Consultas parametrizadas (`$1`, `$2`) en todos los routers | ✅ |
| XSS en correos | `esc()` escapa `& < > " '` antes de insertar datos en el HTML de SendGrid | ✅ |
| XSS en la SPA | Vue escapa por defecto toda interpolación `{{ }}` | ✅ |
| CORS | Solo `FRONTEND_URL` y `localhost:5173` | ✅ |
| Robo de token | El JWT vive en `localStorage`; un XSS podría leerlo | ⚠️ (Propuesta) cookie `HttpOnly` |
| Headers de seguridad | Express no envía `Content-Security-Policy`, `X-Frame-Options` ni `Strict-Transport-Security` | ⚠️ (Propuesta) middleware `helmet` |
| Fuerza bruta en `/login` | No hay límite de intentos | ⚠️ (Propuesta) `express-rate-limit` |
| Llave privada en Git | `FRONTEND/certs/localhost.key` está versionada: el patrón `certs/*.key` del `.gitignore` raíz solo aplica a `/certs` | ⚠️ Corregir a `**/certs/*.key` (certificado autofirmado de desarrollo; riesgo bajo) |
| Roles inmodificables por API | `POST/PUT/DELETE /api/roles` exigen `superadmin`, pero el router está montado detrás de `requireAuth`, que rechaza al superadmin: nadie puede modificar roles desde el API | ⚠️ Decidir: dejar el catálogo fijo (y quitar esas rutas) o montarlas con `requireSuperadmin` |
| Credencial en Git | `docker-compose.yml` incluye la contraseña del PostgreSQL **local** en `DATABASE_URL` | ⚠️ Moverla a `.env.docker` |
| RLS incompleta | 7 tablas sin RLS en Supabase | ⚠️ Aplicar la propuesta de 6.4 |

✅ **Lista de chequeo:** sin claves reales en este documento · `.env` en `.gitignore` · RLS probada con dos roles (en local) · RLS completa en producción: pendiente.

---

## 7. Rendimiento y Optimización

### 7.1 Técnicas implementadas

| Técnica | Dónde | Problema que resuelve en Texticode |
|---------|-------|-------------------------------------|
| **Code splitting / lazy loading** | `router/index.js`: las 21 rutas usan `component: () => import('...')` | Un operario no descarga el código de Reportes ni de Gestión de Empresas. El build genera un archivo JS **por vista** |
| **Carga bajo demanda de librerías pesadas** | `Reportes.vue`, `GestionClientes.vue`, `PedidosEntregas.vue` agregan el `<script>` de jsPDF y JSZip **solo al exportar** | jsPDF y JSZip no pesan en la carga inicial de ninguna pantalla |
| **Paginación en el servidor** | `GET /api/practica/usuarios?page=&limit=` (`LIMIT/OFFSET`) y composable `usePaginacion` (sección 5.5) | No traer todos los usuarios de una vez |
| **Índices compuestos por empresa** | Sección 4.5 | Las consultas filtradas por `Id_Empresa` no recorren la tabla completa |
| **Optimización de imágenes** | `public/img/LogoTexticode.png` **(Propuesta medida)** | Ver 7.2 |

### 7.2 Lighthouse: antes y después

**Condiciones:** Lighthouse 12.8.2, build de producción (`npm run build`) servido localmente con compresión, perfil **móvil** (CPU 4× más lenta, red 4G lenta: 150 ms de RTT y 1,6 Mbps) y perfil **escritorio**. Fecha: 22/10/2026.

**Diagnóstico:** el logo `LogoTexticode.png` pesa **1,43 MB** (1024×1024 px) y se muestra como máximo a 124 px. Lighthouse lo marca como la principal oportunidad: 1.413 KiB desperdiciados.
**Optimización:** se redimensionó a 384×384 px (3× el tamaño mostrado, nítido en pantallas retina) con paleta de 256 colores: **9 KB**, con el mismo nombre de archivo para no tocar el código.

| Página · perfil | Performance antes → después | LCP antes → después | Peso total antes → después |
|-----------------|-----------------------------|---------------------|----------------------------|
| Landing · móvil | **66 → 92** | 9,2 s → 2,3 s | 1.527 KiB → 104 KiB |
| Login · móvil | **70 → 95** | 9,0 s → 2,1 s | 1.524 KiB → 101 KiB |
| Landing · escritorio | 94 → **100** | 1,6 s → 0,5 s | 1.527 KiB → 104 KiB |
| Login · escritorio | 94 → **100** | 1,6 s → 0,5 s | 1.524 KiB → 101 KiB |

| Métrica (Landing, móvil) | Antes | Después |
|--------------------------|-------|---------|
| First Contentful Paint (FCP) | 1,9 s | 1,9 s |
| Largest Contentful Paint (LCP) | 9,2 s | 2,3 s |
| Total Blocking Time (TBT) | 240 ms | 160 ms |
| Cumulative Layout Shift (CLS) | 0 | 0 |
| Speed Index | 5,0 s | 4,9 s |
| Accesibilidad / Buenas prácticas / SEO | 95 / 96 / 83 | 95 / 96 / 83 |

Con el cambio, el LCP móvil queda por debajo del umbral "bueno" de Google (2,5 s). Las mediciones son **locales**, no del dominio de Vercel; en producción el CDN puede variar los tiempos, pero el ahorro de peso es el mismo.

### 7.3 Tamaño del build (`npm run build`, Vite 6.4.3)

`✓ 77 modules transformed · built in 3.66s` → 44 archivos en `dist/assets/`: **756 KB de JS** y **336 KB de CSS** sin comprimir, divididos por vista.

| Archivo | Tamaño | gzip | Observación |
|---------|--------|------|-------------|
| `index-*.js` (Vue, Router, Pinia, núcleo) | 124,14 kB | 47,27 kB | Se descarga siempre |
| `GestionClientes-*.js` | 100,36 kB | 58,95 kB | Vista más pesada |
| `CuentaPersonal-*.js` (cliente) | 81,54 kB | 46,58 kB | |
| `Reportes-*.js` | 73,31 kB | 37,74 kB | |
| `EficienciaOperarios-*.js` | 48,79 kB | 12,57 kB | |
| `LandingView-*.js` | 32,48 kB | 9,95 kB | Primera vista pública |
| `LoginView-*.js` | 16,48 kB | 5,30 kB | |
| `index.html` | 0,59 kB | 0,38 kB | |

**(Futuro):** revisar `GestionClientes` y `CuentaPersonal` (comprimen poco, lo que sugiere datos embebidos como imágenes en base64) y agregar *debounce* de 300 ms a los buscadores de las tablas.

---

## 8. Integraciones Externas

### 8.1 Servicios implementados

| Servicio | Para qué | Cómo se conecta | Credencial | Dónde vive la clave |
|----------|----------|-----------------|------------|---------------------|
| **PostgreSQL (Supabase / Docker)** | Persistencia | `pg.Pool` con `DATABASE_URL` | Usuario y contraseña de la BD | Solo backend |
| **SendGrid** | Correos de cambio de estado de orden, comprobantes, tareas al operario y recuperación de contraseña | `@sendgrid/mail` | `SENDGRID_API_KEY` | Solo backend |
| **Google OAuth 2.0** | Inicio de sesión con Google (web y móvil) | Redirección OAuth + intercambio de código en `oauth2.googleapis.com/token` | `GOOGLE_CLIENT_ID` (pública) y `GOOGLE_CLIENT_SECRET` | El *secret* solo en el backend |
| **Google Calendar API** | Crear eventos de fechas de entrega en el calendario del usuario | REST `googleapis.com/calendar/v3` con el `access_token` del usuario (se renueva con el `refresh_token`) | Tokens por usuario en `google_calendar_tokens` | Base de datos (backend) |
| **cdnjs (jsPDF 2.5.1, JSZip 3.10.1)** | Generar PDF y ZIP en el navegador | `<script>` insertado bajo demanda | Ninguna | — |

**Regla aplicada:** toda acción que requiere una clave secreta (enviar correo, intercambiar código OAuth, renovar tokens) pasa por el backend. El navegador solo conoce `VITE_API_URL`.

### 8.2 Integración documentada completa: SendGrid (`services/emailService.js`)

```javascript
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FROM = { email: process.env.SENDGRID_FROM_EMAIL, name: process.env.SENDGRID_FROM_NAME || 'Texticode' }

// Escapa texto antes de meterlo en el HTML del correo (evita inyección de HTML/enlaces)
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function notificarCambioEstado({ destinatario, nombreCliente, idOrden, nuevoEstado, ... }) {
  const meta = ESTADO_META[nuevoEstado]             // emoji, color y texto por estado
  const msg = {
    to: destinatario,
    from: FROM,
    subject: `${meta.emoji} Orden #${idOrden}: ${meta.label}`,
    html: baseTemplate({ titulo: ..., contenido: ..., color: meta.color }),
  }
  await sgMail.send(msg)
}
```

**Flujo:** el administrador cambia el estado de una orden → la vista llama `POST /api/notificaciones/estado` (protegido con `requireAuth` + `requireRoles('admin')`) → la ruta busca el correo del cliente **dentro de la empresa del token** → `notificarCambioEstado()` → SendGrid entrega el correo. Las otras funciones del servicio son `enviarComprobante()`, `notificarTareaOperario()` y `obtenerEstadisticas()`.

### 8.3 Roadmap de integraciones (Futuro)

| Integración | Para qué | Estado |
|-------------|----------|--------|
| **Backend publicado en la nube** (Express como Vercel Functions en el plan Pro; ver 2.6) | Que la SPA de Vercel funcione completa desde Internet; hoy el API corre en Docker local | (Propuesta, producción ISATEX) |
| **WhatsApp Business API** | Avisar al cliente cuando su pedido esté listo | (Futuro) |
| **Sentry** | Recibir alertas con el detalle de los errores de los usuarios (sección 10) | (Futuro) |
| **`pg_cron` en Supabase** | Ejecutar `actualizar_ordenes_retrasadas()` cada día | (Futuro) |

---

## 9. Configuración y Despliegue

### 9.1 Instalación desde cero (entorno de desarrollo)

**Requisitos:** Git, Docker Desktop y Node.js 20 o superior.

```bash
# 1. Clonar
git clone https://github.com/CamiloTibambre/TEXTICODE.git
cd TEXTICODE

# 2. Variables de entorno (ver valores de ejemplo en la sección 6.5)
#    - .env.docker          → POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#    - BACKEND/.env         → JWT_SECRET, SENDGRID_*, GOOGLE_*, FRONTEND_URL
#    - FRONTEND/.env        → VITE_API_URL=http://localhost:3001/api

# 3. Esquema inicial de la base: copiar el volcado del esquema en DATABASE/docker/
#    (00_supabase_compat.sql y 01_texticode.sql; están en .gitignore porque contienen datos).
#    Docker los ejecuta automáticamente la PRIMERA vez que crea el volumen.

# 4. Levantar base de datos + backend
docker compose up -d --build
docker compose ps                     # texticode-db (healthy) y texticode-backend (Up)
curl http://localhost:3001/health     # {"ok":true,"service":"texticode-api"}

# 5. Frontend
cd FRONTEND
npm install
npm run dev                           # https://localhost:5173 (certificado autofirmado en certs/)
```

**Cómo se conectan:** dentro de Docker, el backend usa el host `db` y el puerto interno `5432` (`DATABASE_URL` en `docker-compose.yml`). Desde el PC, la base queda expuesta en el puerto **5433** para no chocar con un PostgreSQL local. El backend espera a que la base esté sana (`depends_on: condition: service_healthy`).

### 9.2 Scripts de `package.json`

| Proyecto | Script | Qué hace |
|----------|--------|----------|
| FRONTEND | `npm run dev` | Servidor de desarrollo Vite con HTTPS y proxy `/api` → `localhost:3001` |
| FRONTEND | `npm run build` | Build de producción en `dist/` |
| FRONTEND | `npm run preview` | Sirve `dist/` localmente para probar el build |
| BACKEND | `npm start` | `node index.js` (lo que ejecuta el contenedor) |
| BACKEND | `npm run dev` | `node --watch index.js` (reinicia al guardar) |
| BACKEND | `npm test` | `node --test` (87 pruebas, sección 6.3) |

### 9.3 Despliegue del frontend en Vercel

1. En Vercel: **Add New → Project** e importar el repositorio de GitHub.
2. **Root Directory:** `FRONTEND` · **Framework Preset:** Vite · **Build Command:** `npm run build` · **Output Directory:** `dist`.
3. **Settings → Environment Variables:** `VITE_API_URL` = URL pública del backend (Production y Preview).
4. **Deploy.** Cada `git push` a la rama conectada vuelve a publicar automáticamente.
5. URL de producción: **https://texticode-lime.vercel.app**

**Backend en producción:** hoy el API corre en el contenedor Docker del equipo de desarrollo. Por eso la SPA publicada en Vercel carga, pero las funciones que necesitan el API solo operan con el backend local en ejecución. Para producción se propone publicar el API Express como Vercel Functions en el plan Pro, con la conexión por el *pooler* de Supabase (secciones 2.6 y 8.3).

### 9.4 Rewrites en una SPA (hallazgo verificado)

Texticode usa `createWebHistory()` (URLs limpias como `/login`), pero el proyecto **no tiene `vercel.json`**. El 22/10/2026 se comprobó: `https://texticode-lime.vercel.app/` carga, mientras que abrir directamente `https://texticode-lime.vercel.app/login` devuelve un **error 4xx** (no encontrado).

> **Pregunta para pensar: ¿qué pasa sin la regla de rewrite?** Vercel recibe la petición `/login` y busca un **archivo** llamado `login` en `dist/`. No existe, porque todas las rutas las resuelve Vue Router **dentro** de `index.html`, así que responde 404. Navegar con clics funciona porque el router cambia la URL sin pedirle nada al servidor. Solo falla al **recargar** o al abrir un enlace directo.

**Corrección (entregada con este documento):** `FRONTEND/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 9.5 CI/CD (Opcional)

El repositorio no tiene GitHub Actions. **(Propuesta):** `.github/workflows/ci.yml`, que instala, ejecuta las pruebas del backend y compila el frontend en cada Pull Request:

```yaml
name: CI
on: [pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci && npm test
        working-directory: BACKEND
        env: { NODE_ENV: test, DATABASE_URL: postgres://x:y@localhost:5432/none, JWT_SECRET: ci_secret }
      - run: npm ci && npm run build
        working-directory: FRONTEND
```

### 9.6 🧪 Prueba de fuego

| Paso | Resultado |
|------|-----------|
| Clonar el repositorio en un equipo limpio (Linux) | ✅ |
| `npm ci` + `npm run build` del frontend siguiendo solo esta sección | ✅ Build en 3,66 s |
| `npm ci` + `npm test` del backend | ✅ Ejecuta (82/87, ver 6.3) |
| Cargar el esquema en un PostgreSQL limpio | ✅ Requirió el archivo de compatibilidad de Supabase (`00_supabase_compat.sql`), por eso se documenta en 9.1, paso 3 |
| Instalación completa por un compañero | ☐ Pendiente: registrar nombre, fecha y pasos donde se trabó |

---

## 10. Monitoreo y Logs

### 10.1 Dónde se revisa cada servicio

| Servicio | Dónde se ven los logs | Comando o ruta |
|----------|----------------------|----------------|
| Backend (Docker) | Salida estándar del contenedor | `docker logs -f texticode-backend` · Docker Desktop → Containers → texticode → backend |
| Base de datos (Docker) | Logs de PostgreSQL | `docker logs -f texticode-db` |
| Base de datos (Supabase) | Panel de Supabase | Logs → Postgres / API |
| Frontend (Vercel) | Logs de build y de peticiones | Proyecto → Deployments → (despliegue) → Build Logs / Runtime Logs |
| Navegador | Consola de DevTools | F12 → Console / Network |
| Salud del API | Endpoint de *health check* | `GET /health` → `{"ok":true,"service":"texticode-api"}` |

Al arrancar, el backend confirma a qué base se conectó: `✅ Conectado a PostgreSQL local (Docker) → base "texticode", puerto 5432`. Si no puede conectarse, termina con `process.exit(1)` y Docker lo reinicia (`restart: unless-stopped`).

### 10.2 Logger con niveles **(Propuesta, entregada)**

```javascript
// src/utils/logger.js — en producción solo se muestran warn y error
const NIVELES = { debug: 0, info: 1, warn: 2, error: 3 }
const MINIMO = import.meta.env.PROD ? NIVELES.warn : NIVELES.debug

function escribir(nivel, mensaje, contexto) {
  if (NIVELES[nivel] < MINIMO) return
  const marca = `[Texticode][${nivel.toUpperCase()}] ${new Date().toISOString()}`
  const salida = console[nivel === 'debug' ? 'log' : nivel]
  contexto !== undefined ? salida(marca, mensaje, contexto) : salida(marca, mensaje)
}
export const logger = {
  debug: (m, c) => escribir('debug', m, c), info: (m, c) => escribir('info', m, c),
  warn:  (m, c) => escribir('warn',  m, c), error: (m, c) => escribir('error', m, c),
}
```

### 10.3 ErrorBoundary en Vue **(Propuesta, implementada y probada)**

Texticode no tenía manejo global de errores: si una vista fallaba al montarse, la pantalla quedaba **en blanco**. En Vue 3, el equivalente al `ErrorBoundary` de React es un componente con el *hook* `onErrorCaptured`:

```vue
<!-- src/components/ErrorBoundary.vue -->
<template>
  <slot v-if="!error" />
  <div v-else class="eb" role="alert">
    <h2>Algo salió mal en esta pantalla</h2>
    <p>El resto de Texticode sigue funcionando. Puedes reintentar o volver al inicio.</p>
    <button @click="reintentar">Reintentar</button>
    <button @click="irAlInicio">Ir al inicio</button>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { logger } from '../utils/logger'

const error = ref(null)
const router = useRouter()

onErrorCaptured((err, instancia, info) => {
  error.value = err
  logger.error('Error capturado por ErrorBoundary', {
    mensaje: err?.message, componente: instancia?.$options?.__name, info,
    ruta: router.currentRoute.value.fullPath,
  })
  return false            // ya se manejó: no propagar
})
function reintentar() { error.value = null }
function irAlInicio() { error.value = null; router.push('/') }
router.afterEach(() => { error.value = null })
</script>
```

Se envuelve el `<RouterView>` en `App.vue` y se agrega un manejador global en `main.js`:

```javascript
app.config.errorHandler = (err, instancia, info) => {
  logger.error('Error no controlado en Vue', { mensaje: err?.message, info })
}
window.addEventListener('unhandledrejection', (e) => {
  logger.error('Promesa rechazada sin manejar', { motivo: e.reason?.message || String(e.reason) })
})
```

**Cómo se probó (22/10/2026):** se agregó temporalmente la ruta `/prueba-error` con una vista que lanza `throw new Error('Error provocado a propósito…')` en su `setup`. Se generaron dos builds de producción y se abrieron con un navegador automatizado (Playwright + Chromium):

| Build | Texto visible en `#app` | Consola |
|-------|------------------------|---------|
| Sin ErrorBoundary (código actual) | `""` (pantalla en blanco) | `Error: Error provocado a propósito…` |
| Con ErrorBoundary | "Algo salió mal en esta pantalla…" + botones | `[Texticode][ERROR] … Error capturado por ErrorBoundary {componente: PruebaError, ruta: /prueba-error}` |

| Antes | Después |
|-------|---------|
| ![Pantalla en blanco sin ErrorBoundary](img/errorboundary_antes.png) | ![Pantalla de respaldo con ErrorBoundary](img/errorboundary_despues.png) |

La ruta de prueba se eliminó después. Los archivos `ErrorBoundary.vue`, `logger.js`, `App.vue` y `main.js` se entregan completos para reemplazar en el repositorio.

### 10.4 Procedimiento: un usuario reporta "la app no carga"

1. **¿Carga el frontend?** Abrir `https://texticode-lime.vercel.app`. Si no carga, revisar en Vercel el último despliegue (falló el build o hay un despliegue nuevo con error) y hacer *Rollback* al anterior desde **Deployments**.
2. **¿Es una ruta directa?** Si `/` funciona pero `/login` o `/admin/...` dan 404 al recargar, falta el `vercel.json` (sección 9.4).
3. **¿Responde el API?** `curl <API>/health`. Si no responde: `docker compose ps` y `docker logs texticode-backend --tail 100`.
4. **¿Hay base de datos?** Si el log del backend muestra `❌ Error conectando a Supabase`, revisar `docker logs texticode-db`, el estado `healthy` y la variable `DATABASE_URL`.
5. **¿Es la sesión?** En DevTools → Network, ver si las peticiones devuelven `401 Sesión expirada` (volver a iniciar sesión) o `403 Membresía empresarial inactiva` (empresa o usuario desactivados por el administrador).
6. **¿Es CORS?** Un error de CORS en la consola indica que `FRONTEND_URL` del backend no coincide con el dominio desde el que se abre la app.
7. **¿Falla una sola pantalla?** Con el ErrorBoundary, el usuario ve el mensaje de respaldo; el detalle queda en la consola con la marca `[Texticode][ERROR]`.
8. Registrar el incidente y la causa en el tablero Scrum (lista **Impedimentos**).

---

## 11. Anexos

### Anexo A · Dependencias

**FRONTEND/package.json**

```json
"dependencies": {
  "pinia": "^2.1.0",
  "vue": "^3.4.0",
  "vue-router": "^4.3.0"
},
"devDependencies": {
  "@vitejs/plugin-vue": "^5.0.0",
  "vite": "^6.4.3"
}
```

**BACKEND/package.json**

```json
"dependencies": {
  "@sendgrid/mail": "^8.1.6",
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.3",
  "pg": "^8.21.0"
},
"overrides": { "qs": "6.16.0" }
```

### Anexo B · Comandos útiles

```bash
# Desarrollo
docker compose up -d --build          # levantar base + backend
docker compose down                   # detener (el volumen de datos se conserva)
docker compose logs -f backend        # ver logs del API
cd FRONTEND && npm run dev            # frontend en https://localhost:5173
cd BACKEND && npm test                # pruebas automáticas

# Base de datos
docker exec -it texticode-db psql -U texticode -d texticode
docker exec texticode-db pg_dump -U texticode -s -d texticode > esquema.sql    # solo estructura
docker exec texticode-db pg_dump -U texticode -Fc -d texticode > respaldo.dump # respaldo completo

# Git
git checkout -b feature/nombre-funcionalidad
git add . && git commit -m "feat: descripción"
git push origin feature/nombre-funcionalidad   # luego abrir Pull Request hacia main

# Despliegue
cd FRONTEND && npm run build && npm run preview   # probar el build antes de publicar
```

### Anexo C · Glosario

| Término | Explicación |
|---------|-------------|
| **SPA** | Aplicación de una sola página: el navegador carga un solo `index.html` y Vue cambia el contenido sin recargar. |
| **API REST** | Conjunto de URLs (`/api/ordenes`) que reciben y devuelven JSON usando los métodos HTTP como verbos. |
| **Endpoint** | Una URL concreta del API con su método, por ejemplo `POST /api/orden-material`. |
| **Multiempresa (multi-tenant)** | Una sola instalación que atiende a varias empresas, cada una aislada de las demás. |
| **Tenant** | Cada empresa cliente de la plataforma, identificada por `Id_Empresa`. |
| **JWT** | Token firmado que prueba quién es el usuario; el servidor verifica la firma en cada petición. |
| **bcrypt** | Algoritmo para cifrar contraseñas de forma irreversible y lenta a propósito, para resistir ataques. |
| **Middleware** | Función de Express que se ejecuta antes de la ruta, por ejemplo para verificar la sesión o el rol. |
| **Llave foránea compuesta** | FK formada por dos columnas, como `(Id_Orden, Id_Empresa)`, que obliga a que el padre sea de la misma empresa. |
| **ON DELETE CASCADE / SET NULL / NO ACTION** | Qué le pasa al hijo al borrar el padre: se borra, queda en NULL o se impide el borrado. |
| **Índice** | Estructura que permite encontrar filas sin recorrer toda la tabla, como el índice de un libro. |
| **Índice parcial** | Índice que solo incluye las filas que cumplen una condición (`WHERE Fecha_Completada IS NOT NULL`). |
| **Trigger** | Código de la base de datos que se ejecuta solo ante un evento, como antes de un `UPDATE`. |
| **Transacción** | Grupo de operaciones que se confirman todas (`COMMIT`) o no se aplica ninguna (`ROLLBACK`). |
| **SELECT … FOR UPDATE** | Bloquea las filas leídas hasta el fin de la transacción para que nadie más las modifique al mismo tiempo. |
| **RLS** | Row Level Security: reglas dentro de PostgreSQL que deciden qué filas puede ver o cambiar cada rol. |
| **Soft delete** | "Borrar" marcando un estado (`Activo = false`, `inactivo`) en lugar de eliminar la fila. |
| **Kárdex** | Registro cronológico de entradas y salidas de inventario (`material_movimiento`). |
| **Code splitting / lazy loading** | Dividir el JavaScript por vista y descargar cada parte solo cuando se necesita. |
| **LCP** | Largest Contentful Paint: cuánto tarda en verse el elemento más grande de la pantalla. |
| **CLS** | Cumulative Layout Shift: cuánto se "mueve" el contenido mientras carga. |
| **Composable** | Función reutilizable de Vue 3 con estado reactivo; equivale a un *hook* de React. |
| **ErrorBoundary** | Componente que atrapa los errores de sus hijos y muestra una pantalla de respaldo. |
| **Docker / contenedor** | Paquete aislado con la aplicación y todo lo que necesita para ejecutarse igual en cualquier equipo. |
| **Docker Compose** | Archivo que define y levanta varios contenedores juntos (base de datos + backend). |
| **CDN** | Red de servidores que entrega los archivos estáticos desde el punto más cercano al usuario. |
| **Rewrite** | Regla del servidor que responde `index.html` a cualquier ruta para que el router de la SPA la resuelva. |
| **CORS** | Política del navegador que solo deja llamar al API desde los dominios que el servidor autoriza. |
| **CI/CD** | Integración y despliegue continuos: probar y publicar automáticamente con cada cambio. |

### Anexo D · Evidencias y archivos entregados

| Archivo | Contenido |
|---------|-----------|
| `evidencias/esquema_real.sql` | Esquema completo (`pg_dump --schema-only`, sin datos) |
| `evidencias/pruebas_bd.txt` | Salida de las pruebas P1–P7 (trigger, función, ON DELETE y RLS por rol) |
| `evidencias/prueba_fk.txt` | Prueba de la corrección de llaves foráneas |
| `evidencias/build_output.txt` | Salida completa de `npm run build` |
| `evidencias/tests_backend.txt` | Salida completa de `npm test` (87 pruebas) |
| `evidencias/prueba_paginacion.txt` | Prueba del composable `usePaginacion` |
| `evidencias/lighthouse/*.json` | 8 reportes de Lighthouse (antes y después, móvil y escritorio) |
| `DATABASE/propuestas/01_datos_prueba.sql` … `04_correccion_fk_cascade.sql` | Datos sintéticos, propuesta de RLS, pruebas y corrección de FK |
| `FRONTEND/…` | `ErrorBoundary.vue`, `logger.js`, `usePaginacion.js`, `App.vue`, `main.js`, `api.js`, `vercel.json` y el logo optimizado, listos para reemplazar |

### Anexo E · Aprobación

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Autor | Kevin Montenegro | ________ | __/__/____ |
| Autor | Andrés Felipe Lancheros | ________ | __/__/____ |
| Autor | Camilo Andrés Tibambre | ________ | __/__/____ |
| Autor | Kevin Andrés Castro | ________ | __/__/____ |
| Revisor (compañero) | ________________ | ________ | __/__/____ |
| Docente | Ing. Edwin Marín | ________ | __/__/____ |
