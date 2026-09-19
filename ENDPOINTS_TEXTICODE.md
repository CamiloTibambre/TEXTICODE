# 📡 Endpoints — Texticode API

> **Base URL local:** `http://localhost:3001`  
> **Auth APIs internas:** Header `x-api-key: texticode-2026`  
> **Auth Google Calendar:** Header `Authorization: Bearer <JWT>`  
> **Content-Type:** `application/json`

**Leyenda de métodos:**
🔵 `GET` &nbsp;&nbsp; 🟢 `POST` &nbsp;&nbsp; 🟠 `PATCH` &nbsp;&nbsp; 🔴 `DELETE`

---

## 🚀 Instalación y configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd texticode-vue
```

### 2. Instalar dependencias

**Backend:**
```bash
cd texticode-api
npm install
```

**Frontend:**
```bash
cd ../texticode-vue
npm install
```

### 3. Variables de entorno

Crear `texticode-api/.env`:
```env
PORT=3001
DATABASE_URL=postgresql://...
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback
GOOGLE_CALENDAR_TIMEZONE=America/Bogota
API_KEY_EFICIENCIA=texticode-2026
GOOGLE_ALLOW_DIFFERENT_EMAILS=true
FRONTEND_URL=https://localhost:5173
```

Crear `texticode-vue/.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_API_KEY=texticode-2026
```

### 4. Certificados SSL (solo para el frontend)

Desde **Git Bash**, dentro de la carpeta `texticode-vue/`:
```bash
mkdir certs
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -keyout certs/localhost.key -out certs/localhost.crt -days 365 -nodes -subj "/CN=localhost"
```

### 5. Correr el proyecto

```bash
# Terminal 1 — Backend
cd texticode-api
npm run dev

# Terminal 2 — Frontend
cd texticode-vue
npm run dev
```

---

## 🗄️ Base de datos

El backend se conecta a **Supabase PostgreSQL** mediante la variable `DATABASE_URL`. No requiere configuración adicional fuera del `.env`.

---

> ⚠️ **Nota:** Este documento solo incluye los 19 endpoints que fueron ejecutados y revisados manualmente. El resto de endpoints existentes en el backend no está documentado aquí.

---

## 📋 Índice general de endpoints

| API | Método | Endpoint |
|---|---|---|
| Autenticación | 🟢 `POST` | `http://localhost:3001/api/auth/login` |
| Autenticación | 🟢 `POST` | `http://localhost:3001/api/auth/recuperar-contrasena` |
| SendGrid | 🔵 `GET` | `http://localhost:3001/api/notificaciones/estadisticas` |
| SendGrid | 🟢 `POST` | `http://localhost:3001/api/notificaciones/tarea` |
| Google Calendar | 🔵 `GET` | `http://localhost:3001/api/google/auth-url` |
| Google Calendar | 🔵 `GET` | `http://localhost:3001/api/google/status` |
| Google Calendar | 🟢 `POST` | `http://localhost:3001/api/google/sync/delivery-events` |
| Google Calendar | 🟠 `PATCH` | `http://localhost:3001/api/google/settings` |
| Google Calendar | 🔴 `DELETE` | `http://localhost:3001/api/google/unlink` |
| Carga de Trabajo | 🔵 `GET` | `http://localhost:3001/api/carga-trabajo` |
| Carga de Trabajo | 🔵 `GET` | `http://localhost:3001/api/carga-trabajo/operarios/:id` |
| Carga de Trabajo | 🟢 `POST` | `http://localhost:3001/api/carga-trabajo/reasignar` |
| Carga de Trabajo | 🟢 `POST` | `http://localhost:3001/api/carga-trabajo/reasignar-multiple` |
| Carga de Trabajo | 🟠 `PATCH` | `http://localhost:3001/api/carga-trabajo/umbrales` |
| Carga de Trabajo | 🟠 `PATCH` | `http://localhost:3001/api/carga-trabajo/operarios/:id/estado` |
| Eficiencia | 🔵 `GET` | `http://localhost:3001/api/eficiencia/operarios` |
| Eficiencia | 🔵 `GET` | `http://localhost:3001/api/eficiencia/operarios/:id` |
| Eficiencia | 🟢 `POST` | `http://localhost:3001/api/eficiencia/observaciones` |
| Eficiencia | 🔴 `DELETE` | `http://localhost:3001/api/eficiencia/observaciones/:id` |

---

## 🌐 APIs Externas

> Endpoints que dependen de servicios/autenticación externa al backend interno (login de usuarios, envío de correos y Google Calendar).

### 🔐 Autenticación

> Ruta base: `http://localhost:3001/api/auth`

| Método | Endpoint | Descripción |
|---|---|---|
| 🟢 `POST` | `http://localhost:3001/api/auth/login` | Inicia sesión con correo y contraseña |
| 🟢 `POST` | `http://localhost:3001/api/auth/recuperar-contrasena` | Envía correo de recuperación de contraseña |

---

#### 🟢 `POST` &nbsp; `http://localhost:3001/api/auth/login`

Inicia sesión con correo y contraseña.

**Body:**
```json
{
  "correo": "andreslanck@gmail.com",
  "contrasena": "Lancheros1"
}
```

**Respuesta exitosa:**
```json
{
  "token": "<JWT>",
  "usuario": {
    "Id_Usuario": 1,
    "Nombre_Completo": "Andrés Lancheros",
    "Correo": "andreslanck@gmail.com",
    "Rol": "administrador"
  }
}
```

---

#### 🟢 `POST` &nbsp; `http://localhost:3001/api/auth/recuperar-contrasena`

Envía un correo de recuperación de contraseña al email indicado.

**Body:**
```json
{
  "email": "camilotibambre@gmail.com"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "mensaje": "Correo de recuperación enviado correctamente."
}
```

---

### 📧 SendGrid

> Ruta base: `http://localhost:3001/api/notificaciones`  
> Auth: Header `x-api-key: texticode-2026`  
> Servicio de envío de correos transaccionales (notificación de tareas y métricas de envío).

| Método | Endpoint | Descripción |
|---|---|---|
| 🔵 `GET` | `http://localhost:3001/api/notificaciones/estadisticas` | Consulta métricas de envío de correos |
| 🟢 `POST` | `http://localhost:3001/api/notificaciones/tarea` | Notifica a un operario una nueva tarea |

---

#### 🔵 `GET` &nbsp; `http://localhost:3001/api/notificaciones/estadisticas`

Consulta las métricas de envío de correos (proxy sobre `/v3/stats` de SendGrid) para una fecha dada.

**Query params:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `fecha` | `string` | Formato `YYYY-MM-DD`. Si se omite, usa la fecha actual (zona horaria `America/Bogota`). |

**Respuesta exitosa:**
```json
{
  "success": true,
  "estadisticas": {
    "fecha": "2026-07-02",
    "enviados": 5,
    "entregados": 5,
    "abiertos": 4,
    "clicks": 0,
    "rebotes": 0,
    "spam": 0
  }
}
```

> ⚠️ SendGrid agrega estas métricas por lotes, no en tiempo real: pueden tardar unos minutos en reflejar envíos recientes.

---

#### 🟢 `POST` &nbsp; `http://localhost:3001/api/notificaciones/tarea`

Notifica a un operario que se le asignó una nueva tarea de producción.

**Body:**
```json
{
  "operarioEmail": "stevanwagner99@gmail.com",
  "operarioNombre": "Stevan Wagner",
  "tarea": "Confección de blusas",
  "ordenId": 143,
  "prioridad": "Alta",
  "fechaLimite": "2026-06-30"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "enviado": true,
  "destinatario": "stevanwagner99@gmail.com",
  "tarea": "Confección de blusas"
}
```

---

### 🔵 Google Calendar OAuth

> Ruta base: `http://localhost:3001/api/google`  
> Autenticación: JWT en header `Authorization: Bearer <token>` (excepto rutas públicas como `/auth-url`)

| Método | Endpoint | Descripción |
|---|---|---|
| 🔵 `GET` | `http://localhost:3001/api/google/auth-url` | Genera la URL de autorización de Google OAuth2 |
| 🔵 `GET` | `http://localhost:3001/api/google/status` | Consulta el estado de vinculación de la cuenta |
| 🟢 `POST` | `http://localhost:3001/api/google/sync/delivery-events` | Sincroniza entregas con Google Calendar |
| 🟠 `PATCH` | `http://localhost:3001/api/google/settings` | Actualiza preferencias de sincronización |
| 🔴 `DELETE` | `http://localhost:3001/api/google/unlink` | Desvincula la cuenta de Google |

---

#### 🔵 `GET` &nbsp; `http://localhost:3001/api/google/auth-url?action=login`

Genera la URL de autorización de Google OAuth2.

**Query params:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `action` | `string` | `login` o `link` (default: `link`) |

**Respuesta exitosa:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "scopes": ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar"]
}
```

---

#### 🔵 `GET` &nbsp; `http://localhost:3001/api/google/status`

Consulta el estado de la vinculación de la cuenta de Google Calendar del usuario autenticado.

**Headers:**

| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <JWT>` |

**Respuesta exitosa:**
```json
{
  "connected": true,
  "profile": {
    "email": "andreslanck@gmail.com",
    "calendarId": "primary",
    "syncEnabled": true,
    "lastLoginGoogle": "2026-07-03T06:50:46.908Z",
    "lastSyncAt": "2026-05-25T17:36:03.965Z",
    "updatedAt": "2026-07-03T06:50:46.908Z",
    "scopes": [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ]
  }
}
```

---

#### 🟢 `POST` &nbsp; `http://localhost:3001/api/google/sync/delivery-events`

Sincroniza las entregas (órdenes) pendientes con eventos en Google Calendar del usuario autenticado.

**Headers:**

| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <JWT>` |

**Body:** *(sin body — la sincronización toma las entregas pendientes directamente del backend)*

**Respuesta exitosa:**
```json
{
  "mensaje": "Entregas sincronizadas con Google Calendar.",
  "total": 1,
  "results": [
    {
      "id": "fighkqd3seal182ctae7q3jfo0",
      "htmlLink": "https://www.google.com/calendar/event?eid=ZmlnaGtxZDNzZWFsMTgyY3RhZTdxM2pmbzAgYW5kcmVzbGFuY2tAZ21haWwuY29t",
      "status": "updated",
      "orderId": 139
    }
  ]
}
```

---

#### 🟠 `PATCH` &nbsp; `http://localhost:3001/api/google/settings`

Actualiza las preferencias de sincronización de Google Calendar del usuario autenticado.

**Headers:**

| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <JWT>` |

**Body:**
```json
{
  "syncEnabled": true,
  "calendarId": "primary"
}
```

**Respuesta exitosa:**
```json
{
  "mensaje": "Preferencias de Google Calendar actualizadas."
}
```

---

#### 🔴 `DELETE` &nbsp; `http://localhost:3001/api/google/unlink`

Desvincula la cuenta de Google Calendar del usuario autenticado.

**Headers:**

| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <JWT>` |

**Respuesta exitosa:**
```json
{
  "mensaje": "Cuenta de Google desvinculada correctamente."
}
```

---

## 🏭 APIs Internas

> Endpoints propios del backend, protegidos con `x-api-key: texticode-2026`.

### ⚖️ Carga de Trabajo

> Ruta base: `http://localhost:3001/api/carga-trabajo`

| Método | Endpoint | Descripción |
|---|---|---|
| 🔵 `GET` | `http://localhost:3001/api/carga-trabajo` | Lista operarios activos con su carga de trabajo |
| 🔵 `GET` | `http://localhost:3001/api/carga-trabajo/operarios/:id` | Detalle de carga de un operario específico |
| 🟢 `POST` | `http://localhost:3001/api/carga-trabajo/reasignar` | Reasigna una orden a otro operario |
| 🟢 `POST` | `http://localhost:3001/api/carga-trabajo/reasignar-multiple` | Reasigna múltiples órdenes |
| 🟠 `PATCH` | `http://localhost:3001/api/carga-trabajo/umbrales` | Actualiza umbrales de sobrecarga/disponibilidad |
| 🟠 `PATCH` | `http://localhost:3001/api/carga-trabajo/operarios/:id/estado` | Activa o desactiva un operario |

---

#### 🔵 `GET` &nbsp; `http://localhost:3001/api/carga-trabajo`

Lista todos los operarios activos con su carga de trabajo actual.

**Query params:**

| Parámetro | Tipo | Valores válidos |
|-----------|------|-----------------|
| `estado` | `string` | `sobrecargado`, `normal`, `disponible` |

**Respuesta exitosa:**
```json
{
  "ok": true,
  "filtro_aplicado": null,
  "resumen": {
    "total_operarios": 5,
    "sobrecargados": 2,
    "normales": 2,
    "disponibles": 1
  },
  "data": [
    {
      "Id_Usuario": 3,
      "Nombre_Completo": "Carlos López",
      "ordenes_activas": 7,
      "ordenes_vencidas": 1,
      "ordenes_alta_prioridad": 2,
      "estado_carga": "sobrecargado"
    }
  ]
}
```

---

#### 🔵 `GET` &nbsp; `http://localhost:3001/api/carga-trabajo/operarios/50`

Detalle de carga de trabajo de un operario específico con sus órdenes activas.

**Respuesta exitosa:**
```json
{
  "ok": true,
  "data": {
    "Id_Usuario": 50,
    "Nombre_Completo": "Ana Torres",
    "ordenes_activas": 4,
    "ordenes_vencidas": 0,
    "ordenes_alta_prioridad": 1,
    "estado_carga": "normal",
    "ordenes_activas_detalle": [
      {
        "Id_Orden": 15,
        "Producto": "Camisa",
        "Estado": "En Proceso",
        "Prioridad": "Alta",
        "Fecha_Limite": "2026-06-20",
        "vencida": false
      }
    ]
  }
}
```

---

#### 🟢 `POST` &nbsp; `http://localhost:3001/api/carga-trabajo/reasignar`

Reasigna una orden activa a otro operario.

**Body:**
```json
{
  "Id_Orden": 137,
  "Id_Operario_Destino": 50
}
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "mensaje": "Orden #137 reasignada correctamente a Ana Torres",
  "data": {
    "Id_Orden": 137,
    "Producto": "Camisa",
    "operario_anterior": 3,
    "operario_nuevo": { "id": 50, "nombre": "Ana Torres" }
  }
}
```

---

#### 🟢 `POST` &nbsp; `http://localhost:3001/api/carga-trabajo/reasignar-multiple`

Reasigna múltiples órdenes en una sola petición.

**Body:**
```json
{
  "movimientos": [
    { "Id_Orden": 140, "Id_Operario_Destino": 47 },
    { "Id_Orden": 145, "Id_Operario_Destino": 43 }
  ]
}
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "total_procesados": 2,
  "total_errores": 0,
  "resultados": [
    { "Id_Orden": 140, "Producto": "Camisa", "Id_Operario_Destino": 47, "ok": true },
    { "Id_Orden": 145, "Producto": "Pantalón", "Id_Operario_Destino": 43, "ok": true }
  ],
  "errores": []
}
```

---

#### 🟠 `PATCH` &nbsp; `http://localhost:3001/api/carga-trabajo/umbrales`

Actualiza los umbrales que definen cuándo un operario está sobrecargado o disponible.

**Body:**
```json
{
  "limite_sobrecarga": 6,
  "limite_disponible": 2
}
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "mensaje": "Umbrales actualizados",
  "umbrales": {
    "limite_sobrecarga": 6,
    "limite_disponible": 2
  }
}
```

---

#### 🟠 `PATCH` &nbsp; `http://localhost:3001/api/carga-trabajo/operarios/43/estado`

Activa o desactiva un operario.

**Body:**
```json
{
  "Estado": "activo"
}
```

**Valores válidos para `Estado`:** `activo`, `inactivo`

**Respuesta exitosa:**
```json
{
  "ok": true,
  "mensaje": "Operario actualizado a estado \"activo\"",
  "data": {
    "Id_Usuario": 43,
    "Nombre_Completo": "Carlos López",
    "Estado": "activo"
  }
}
```

---

### 📊 Eficiencia de Operarios

> Ruta base: `http://localhost:3001/api/eficiencia`

| Método | Endpoint | Descripción |
|---|---|---|
| 🔵 `GET` | `http://localhost:3001/api/eficiencia/operarios` | Lista operarios activos con métricas de eficiencia |
| 🔵 `GET` | `http://localhost:3001/api/eficiencia/operarios/:id` | Detalle de eficiencia de un operario |
| 🟢 `POST` | `http://localhost:3001/api/eficiencia/observaciones` | Registra una observación de desempeño |
| 🔴 `DELETE` | `http://localhost:3001/api/eficiencia/observaciones/:id` | Elimina una observación |

---

#### 🔵 `GET` &nbsp; `http://localhost:3001/api/eficiencia/operarios`

Lista todos los operarios activos con sus métricas de eficiencia.

**Query params:**

| Parámetro | Tipo | Valores válidos |
|-----------|------|-----------------|
| `rendimiento` | `string` | `Alto`, `Medio`, `Bajo` |
| `estado` | `string` | `Completada`, `En Proceso`, `Pausado` |
| `limite` | `number` | Número positivo |

**Respuesta exitosa:**
```json
{
  "ok": true,
  "total": 2,
  "filtros_aplicados": {
    "rendimiento": null,
    "estado": null,
    "limite": null
  },
  "data": [
    {
      "Id_Usuario": 3,
      "Nombre_Completo": "Carlos López",
      "prendas_por_dia": 12,
      "total_unidades_producidas": 240,
      "ordenes_en_retraso": 0,
      "ordenes_completadas": 8,
      "ordenes_en_proceso": 3,
      "ordenes_pausadas": 0,
      "ordenes_con_problema": 0,
      "rendimiento": "Alto"
    }
  ]
}
```

---

#### 🔵 `GET` &nbsp; `http://localhost:3001/api/eficiencia/operarios/47`

Detalle completo de eficiencia de un operario con historial de órdenes y observaciones.

**Respuesta exitosa:**
```json
{
  "ok": true,
  "data": {
    "Id_Usuario": 47,
    "Nombre_Completo": "Ana Torres",
    "prendas_por_dia": 10,
    "total_unidades_producidas": 180,
    "ordenes_en_retraso": 1,
    "ordenes_completadas": 6,
    "rendimiento": "Medio",
    "ordenes_detalle": [
      {
        "Id_Orden": 142,
        "Producto": "Camisa",
        "Estado": "En Proceso",
        "Prioridad": "Alta",
        "Dificultad": "Media",
        "Unidades_Realizadas": 20,
        "Unidades": 50,
        "vencida": false,
        "tiene_problema": false,
        "observaciones": []
      }
    ]
  }
}
```

---

#### 🟢 `POST` &nbsp; `http://localhost:3001/api/eficiencia/observaciones`

Registra una observación sobre el desempeño de un operario en una orden.

**Body:**
```json
{
  "Id_Operario": 47,
  "Id_Admin": 42,
  "Id_Orden": 142,
  "Observacion": "No reportó avances en 3 días."
}
```

> ⚠️ `Observacion` máximo 500 caracteres.

**Respuesta exitosa:**
```json
{
  "ok": true,
  "mensaje": "Observación registrada correctamente",
  "data": {
    "Id_Observacion": 7,
    "Id_Operario": 47,
    "Id_Orden": 142,
    "Id_Admin": 42,
    "Observacion": "No reportó avances en 3 días."
  }
}
```

---

#### 🔴 `DELETE` &nbsp; `http://localhost:3001/api/eficiencia/observaciones/4`

Elimina una observación por su ID.

**Respuesta exitosa:**
```json
{
  "ok": true,
  "mensaje": "Observación eliminada correctamente"
}
```

---

*Documentación generada para el proyecto Texticode — Backend Node/Express + Supabase PostgreSQL*