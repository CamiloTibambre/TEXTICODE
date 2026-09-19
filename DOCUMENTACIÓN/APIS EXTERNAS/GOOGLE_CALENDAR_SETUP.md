# Integración Google Calendar API para Texticode

## Arquitectura implementada

Texticode usa el flujo profesional de **vincular cuenta existente con Google**:

1. El administrador crea el usuario, correo, rol y contraseña temporal.
2. El usuario inicia sesión en Texticode.
3. Desde **Google Calendar** el usuario presiona **Vincular cuenta con Google**.
4. Google devuelve tokens OAuth 2.0 y Texticode los guarda en `google_calendar_tokens`.
5. Desde ese momento el usuario puede:
   - iniciar sesión con Google sin crear cuentas nuevas;
   - sincronizar fechas límite de entregas con su Google Calendar;
   - recibir recordatorios por email y popup;
   - consultar próximos eventos de Texticode;
   - desvincular Google cuando lo necesite.
6. El administrador puede ver qué usuarios ya vincularon Google.

> Seguridad: Google Login **no crea usuarios automáticamente**. Si la cuenta de Google no está vinculada a un usuario existente, el acceso se rechaza.

## Configuración en Google Cloud Console

1. Crear o seleccionar un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Ir a **APIs & Services > Library** y habilitar **Google Calendar API**.
3. Ir a **OAuth consent screen**:
   - User type: External, si será usado por usuarios fuera del dominio.
   - App name: Texticode.
   - Support email: correo del administrador.
   - Authorized domains: dominio real de producción.
   - Scopes requeridos:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
4. Ir a **Credentials > Create Credentials > OAuth client ID**.
5. Application type: **Web application**.
6. Authorized JavaScript origins:
   - Desarrollo: `http://localhost:5173`
   - Producción: `https://tu-dominio.com`
7. Authorized redirect URIs:
   - Desarrollo: `http://localhost:3001/api/google/callback`
   - Producción: `https://tu-api.com/api/google/callback`
8. Copiar **Client ID** y **Client Secret** al `.env` del backend.

## Variables de entorno del backend

```env
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback
GOOGLE_ALLOW_DIFFERENT_EMAILS=false
```

## Endpoints principales

- `GET /api/google/auth-url?action=link`: inicia vinculación para usuario logueado.
- `GET /api/google/auth-url?action=login`: inicia Google Login para usuarios ya vinculados.
- `GET /api/google/callback`: callback OAuth configurado en Google Console.
- `GET /api/google/status`: consulta si el usuario ya vinculó Google.
- `POST /api/google/sync/delivery-events`: crea/actualiza eventos de entrega.
- `GET /api/google/events/upcoming`: consulta próximos eventos Texticode.
- `GET /api/google/connected-users`: listado administrativo de usuarios vinculados.
- `DELETE /api/google/unlink`: desvincula Google.

## Tabla usada

La integración usa `google_calendar_tokens`. Si la tabla existe, el backend agrega automáticamente columnas faltantes:

- `Google_Id`
- `Last_Login_Google`
- `Last_Sync_At`

## Funciones destacadas

- OAuth 2.0 con `access_type=offline` para obtener refresh token.
- Validación con JWT en endpoints privados.
- Eventos idempotentes: no duplica eventos porque guarda `texticodeOrderId` en `extendedProperties.private`.
- Eventos de día completo basados en `Fecha_Limite`.
- Descripción enriquecida con orden, producto, prioridad, cantidad, cliente y operario.
- Colores por prioridad:
  - Alta: rojo.
  - Media: amarillo.
  - Baja: verde.
- Recordatorios:
  - email 48 horas antes;
  - popup 24 horas antes.
