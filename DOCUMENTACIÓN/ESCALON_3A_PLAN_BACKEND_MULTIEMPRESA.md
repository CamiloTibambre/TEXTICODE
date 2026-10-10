# TEXTICODE - Escalon 3A: plan backend multiempresa

> Estado: preparacion tecnica.
> No se modifico codigo funcional.
> No se ejecuto SQL contra Supabase.
> Alcance: backend, base de datos y pruebas.

## 1. Lectura base

Documentos revisados:

- `DOCUMENTACIÓN/ESCALON_2_ARQUITECTURA_MULTIEMPRESA.md`
- `DOCUMENTACIÓN/BORRADOR_SQL_MULTIEMPRESA_REVISION.sql`

Nuevo borrador preparado:

- `DOCUMENTACIÓN/BORRADOR_SQL_MULTIEMPRESA_REVISION_2.sql`

El borrador original se conserva intacto.

## 2. Decisiones tecnicas adoptadas para revision

### Identidad y membresia

- `usuario` se mantiene como identidad global.
- `rol` se mantiene como catalogo global.
- `usuario_empresa` define empresa, rol y estado real de autorizacion.
- `usuario.Id_Rol` queda como dato legado durante transicion; no debe ser la fuente final de autorizacion multiempresa.

### Empresa activa

La empresa activa debe determinarse en backend:

1. Login identifica usuario.
2. Backend consulta membresias activas en `usuario_empresa`.
3. Si existe una sola membresia activa, emite token con esa empresa.
4. Si existen varias, el login debe devolver una respuesta de seleccion de empresa o usar `Es_Principal`.
5. Cualquier seleccion de empresa se valida contra `usuario_empresa`.

El frontend/Flutter no deben poder autorizar operaciones enviando `Id_Empresa` libremente en body/query.

### Google Calendar

Decision recomendada para backend/base:

- `google_calendar_tokens` pasa a ser por usuario + empresa.
- PK futura: `("Id_Usuario", "Id_Empresa")`.
- Todas las funciones actuales que consultan por `Id_Usuario` deben recibir tambien `Id_Empresa`.

Impacto directo:

- `ensureGoogleSchema`
- `upsertGoogleTokens`
- `getConnectedGoogleRow`
- `refreshAccessToken`
- `/api/google/status`
- `/api/google/unlink`
- `/api/google/settings`
- `/api/google/connected-users`
- `/api/google/unlink-user/:idUsuario`
- `/api/calendar/*`

## 3. Autenticacion actual

Hay dos endpoints de login:

- `POST /api/auth/login`
- `POST /api/usuarios/login`

Ambos consultan `usuario`, validan contraseña y firman JWT con `signAuthToken`.

Problema actual para multiempresa:

- `signAuthToken` firma `id`, `rol`, `usuario`.
- `requireAuth` recarga `usuario.Id_Rol`.
- `requireRoles` autoriza por `req.auth.rol` y `req.auth.rolNombre`.
- No existe empresa activa ni membresia en `req.auth`.

Cambio recomendado:

- Centralizar login en un helper compartido.
- Mantener temporalmente ambos endpoints si el frontend/Flutter dependen de ellos.
- Ambos deben devolver el mismo contrato multiempresa.
- Marcar `/api/usuarios/login` como legacy en documentacion interna si se decide mantenerlo.

## 4. Contrato JWT propuesto

Payload minimo:

```json
{
  "id": 10,
  "usuario": "nombre_usuario",
  "empresa": 1,
  "rol": 1,
  "rolNombre": "Administrador"
}
```

Para usuarios con multiples membresias:

```json
{
  "requiresEmpresaSelection": true,
  "usuario": { "Id_Usuario": 10, "Nombre_Usuario": "..." },
  "empresas": [
    { "Id_Empresa": 1, "Nombre_Empresa": "...", "Id_Rol": 1, "Rol": "Administrador" }
  ]
}
```

Endpoint futuro sugerido:

- `POST /api/auth/select-empresa`

Body:

```json
{ "Id_Empresa": 1 }
```

Regla:

- Solo emite JWT si el usuario autenticado o token temporal pertenece a esa empresa.

## 5. Middleware backend propuesto

### `requireAuth`

Responsabilidades futuras:

- Verificar JWT.
- Cargar usuario activo.
- Verificar membresia activa para `payload.empresa`.
- Popular:

```js
req.auth = {
  id,
  usuario,
  empresaId,
  rol,
  rolNombre,
  membresia,
  user
}
```

### `requireRoles`

Debe leer rol desde membresia activa, no desde `usuario.Id_Rol`.

### `requireEmpresa`

Middleware nuevo sugerido.

Responsabilidad:

- Garantizar `req.auth.empresaId`.
- Rechazar tokens sin empresa en rutas empresariales.

### Helpers de recursos

Crear helpers para no repetir SQL:

- `getOrdenEmpresa(idOrden, empresaId)`
- `getMaterialEmpresa(idMaterial, empresaId)`
- `assertUsuarioEnEmpresa(idUsuario, empresaId)`
- `assertOrdenOperarioEmpresa(idOrdenOperario, empresaId)`

## 6. Rutas que requieren filtro por empresa

### Usuarios

- `GET /api/usuarios`
- `GET /api/usuarios/:id`
- `POST /api/usuarios`
- `PUT /api/usuarios/:id`
- `PATCH /api/usuarios/:id/inactivar`
- `DELETE /api/usuarios/:id`

Regla:

- Admin gestiona usuarios dentro de `req.auth.empresaId`.
- Crear usuario debe crear identidad si no existe y membresia en `usuario_empresa`.

### Materiales

- Todas las rutas de `materiales`.
- Filtrar por `material.Id_Empresa`.
- Validar que `Id_Cliente` pertenezca a la empresa.

### Ordenes

- Todas las rutas de `ordenes`.
- Filtrar por `orden_produccion.Id_Empresa`.
- Validar `Id_Cliente`, `Id_Operario`, `Id_Material` contra empresa.

### Orden material

- Todas las operaciones deben validar:
  - orden pertenece a empresa.
  - material pertenece a empresa.
  - movimiento generado conserva empresa.

### Orden operario

- Todas las operaciones deben validar:
  - orden pertenece a empresa.
  - operario pertenece a empresa.
  - fase pertenece a empresa.

### Usuario orden

- Orden y usuario deben pertenecer a misma empresa.

### Comprobantes

- Heredar/filtrar por `Id_Empresa`.
- Cliente solo ve comprobantes de sus ordenes dentro de empresa activa.

### Eficiencia y carga

- Reportes siempre deben partir de empresa activa.
- Las agregaciones deben filtrar `orden_produccion.Id_Empresa` y membresias de operarios.

### Google Calendar y calendar.route

- Tokens por usuario+empresa.
- Sync solo usa ordenes de empresa activa.
- Admin solo lista/desvincula usuarios de empresa activa.

### Practica

- En produccion ya responde 404.
- En desarrollo/admin debe filtrar por empresa o quedar deshabilitada durante multiempresa.

## 7. Transacciones y RLS

Si se incorpora RLS con `current_setting('app.current_empresa_id')`, el backend debe cambiar su patron de acceso.

Opcion recomendada:

- Crear helper `withEmpresaContext(empresaId, callback)`.
- Obtener client del pool.
- `BEGIN`.
- `SELECT set_config('app.current_empresa_id', $1, true)`.
- Ejecutar callback con ese client.
- `COMMIT` / `ROLLBACK`.

Riesgo:

- El backend actual usa `pool.query` directamente en muchas rutas.
- RLS con `SET LOCAL` no sera confiable si se mezcla `pool.query` fuera de transaccion.

Decision recomendada:

- Primera implementacion: filtros SQL obligatorios por empresa.
- Segunda capa: RLS solo despues de adaptar rutas criticas o helpers de DB.

## 8. Contrato API para Vue y Flutter

Coordinacion requerida con companeros, pero sin modificar frontend/Flutter en esta etapa.

Cambios esperados:

- Login puede devolver `requiresEmpresaSelection`.
- Token incluye empresa activa.
- Puede existir endpoint para seleccionar/cambiar empresa.
- Las respuestas de usuario deben incluir empresa activa y rol en esa empresa.
- El cliente no debe enviar `Id_Empresa` en CRUD ordinario.
- Si hay selector de empresa, debe usar endpoint dedicado.

Contrato sugerido login simple:

```json
{
  "token": "...",
  "usuario": {
    "Id_Usuario": 1,
    "Nombre_Usuario": "...",
    "Id_Empresa": 1,
    "Empresa": "Empresa Principal",
    "Id_Rol": 1,
    "Rol": "Administrador"
  }
}
```

Contrato sugerido multiples empresas:

```json
{
  "requiresEmpresaSelection": true,
  "selectionToken": "...",
  "empresas": [
    { "Id_Empresa": 1, "Nombre_Empresa": "A", "Id_Rol": 1, "Rol": "Administrador" },
    { "Id_Empresa": 2, "Nombre_Empresa": "B", "Id_Rol": 2, "Rol": "Operario" }
  ]
}
```

## 9. Plan de pruebas

### Unitarias

- `signAuthToken` incluye empresa y rol de membresia.
- `verifyAuthToken` rechaza token sin empresa en rutas empresariales.
- `requireRoles` usa rol de membresia activa.
- `requireEmpresa` rechaza usuario sin membresia.
- Usuario con multiples membresias no recibe empresa arbitraria.
- Token ausente, invalido y expirado conservan 401.
- Helper de seleccion de empresa rechaza empresa no asignada.

### Integracion HTTP sin DB real destructiva

Con DB de test o mocks:

- Login usuario con una membresia devuelve JWT con empresa.
- Login usuario con dos membresias devuelve seleccion.
- Seleccion de empresa autorizada emite JWT.
- Seleccion de empresa ajena devuelve 403.
- Ruta admin con cliente/operario devuelve 403.

### Integracion con staging

Requiere base confirmada como staging y cuentas QA.

Dataset minimo:

- Empresa A y Empresa B.
- Admin A/B.
- Operario A/B.
- Cliente A/B.
- Material A/B con mismo nombre.
- Orden A/B.
- Fase A/B.
- Comprobante A/B.
- Google token A/B si aplica.

Pruebas:

- Admin A no lista usuarios B.
- Admin A no ve material B.
- Admin A no actualiza orden B.
- Cliente A no ve orden B cambiando `Id_Orden`.
- Operario A no ve tarea B cambiando `Id_Operario`.
- Admin A no asigna operario B a orden A.
- Admin A no usa material B en orden A.
- Reportes A no incluyen datos B.
- Google Calendar A no lista/desvincula usuarios B.
- Comprobante B no es accesible por cliente A.

### Pruebas de base de datos

- FK rechaza orden con material de otra empresa.
- FK rechaza orden con cliente sin membresia en empresa.
- FK rechaza fase con operario de otra empresa.
- FK rechaza usuario_orden cruzado.
- FK rechaza comprobante cruzado.
- Indice unico permite mismo nombre de material en empresas distintas.
- Indice unico parcial bloquea dos empresas principales para el mismo usuario.

### RLS

Solo despues de implementar contexto:

- Con `app.current_empresa_id=A`, consultas a material B no retornan filas.
- Inserts/updates con empresa B bajo contexto A fallan.
- Validar usando el mismo rol de conexion que usa `pg`.

## 10. Archivos backend a modificar en implementacion real

- `BACKEND/middleware/auth.js`
- `BACKEND/middleware/roles.js`
- `BACKEND/middleware/empresa.js` nuevo
- `BACKEND/routes/auth.route.js`
- `BACKEND/routes/usuarios.js`
- `BACKEND/routes/materiales.js`
- `BACKEND/routes/ordenes.js`
- `BACKEND/routes/orden_material.js`
- `BACKEND/routes/orden_operario.js`
- `BACKEND/routes/usuario_orden.js`
- `BACKEND/routes/comprobantes.js`
- `BACKEND/routes/eficiencia.js`
- `BACKEND/routes/carga_trabajo.js`
- `BACKEND/routes/googleCalendar.js`
- `BACKEND/routes/calendar.route.js`
- `BACKEND/routes/practica.routes.js`
- `BACKEND/db.js` o helper nuevo para transacciones/contexto
- `BACKEND/test/*.js`

No modificar en esta etapa:

- Frontend Vue.
- Flutter.
- Estilos, vistas o diseno.

## 11. Riesgos pendientes

- No se ha confirmado que la DB actual sea staging independiente.
- No hay cuentas QA autorizadas para login real.
- El cambio de Google Calendar por empresa requiere sincronizar SQL y backend en el mismo ciclo.
- Las FKs compuestas pueden fallar si los datos actuales contienen inconsistencias no detectadas.
- RLS requiere cambiar patron de DB o puede dar falsa sensacion de seguridad.
- `usuario.Id_Rol` puede causar confusion durante transicion; debe definirse como legado o mantenerse sincronizado temporalmente.

## 12. Pasos para iniciar implementacion real

1. Confirmar staging y backup.
2. Crear cuentas QA autorizadas.
3. Ejecutar validaciones previas del SQL en modo lectura.
4. Aprobar `BORRADOR_SQL_MULTIEMPRESA_REVISION_2.sql` o generar migracion final.
5. Implementar middleware de empresa y auth multiempresa.
6. Adaptar rutas backend por grupos.
7. Agregar pruebas unitarias.
8. Aplicar migracion en staging.
9. Ejecutar pruebas A/B.
10. Coordinar contrato API con Vue/Flutter.
11. Preparar commit solo cuando backend, DB y pruebas pasen.
