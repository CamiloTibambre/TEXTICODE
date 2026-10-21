# TEXTICODE - Escalon 2: preparacion de arquitectura multiempresa

> Estado: documento de diseno para revision.
> No ejecutar migraciones desde este documento.
> No se realizaron escrituras en Supabase durante esta fase.

## 1. Contexto validado

La auditoria previa observo el esquema real `public` de Supabase. Las tablas existentes de TEXTICODE son:

- `usuario`
- `rol`
- `material`
- `material_movimiento`
- `orden_produccion`
- `orden_material`
- `orden_operario`
- `usuario_orden`
- `comprobantes`
- `observacion_operario`
- `google_calendar_tokens`
- `tokens_recuperacion`

No existe actualmente una entidad `empresa`, `tenant` u organizacion equivalente. La separacion actual se basa en roles y relaciones con `usuario`, especialmente `Id_Cliente`, `Id_Operario` e `Id_Usuario`.

El backend usa `pg` contra PostgreSQL/Supabase. Por tanto, la autorizacion debe aplicarse en el servidor y en las consultas SQL. RLS puede ser una defensa adicional, pero no debe considerarse la unica capa de aislamiento.

## 2. Tablas nuevas propuestas

### `empresa`

Representa a la empresa de confeccion que usa TEXTICODE como cliente SaaS.

Campos propuestos:

- `Id_Empresa`: llave primaria.
- `Nombre_Empresa`: nombre visible.
- `Slug`: identificador corto opcional para URL, soporte o seleccion de empresa.
- `Estado`: `activa`, `inactiva` o equivalente.
- `Fecha_Creacion`: auditoria basica.

Justificacion: hoy no existe una entidad que delimite propiedad de usuarios, materiales, ordenes, produccion o reportes. Esta tabla sera el limite principal de aislamiento.

### `empresa_config`

Configuracion independiente por empresa.

Campos propuestos:

- `Id_Empresa`: PK y FK a `empresa`.
- `Zona_Horaria`
- `Moneda`
- `Nombre_Comercial`
- `Email_Notificaciones`
- `Config_JSON`: JSONB para opciones futuras controladas.
- `Updated_At`

Justificacion: evita mezclar ajustes globales con codigo o variables de entorno. Permite que cada empresa configure notificaciones, zona horaria, preferencias de reportes y opciones sin crear columnas nuevas por cada ajuste.

### `usuario_empresa`

Membresia de usuarios dentro de empresas.

Campos propuestos:

- `Id_Usuario`: FK a `usuario`.
- `Id_Empresa`: FK a `empresa`.
- `Id_Rol`: FK a `rol`.
- `Estado`: `activo` / `inactivo`.
- `Es_Principal`: indica empresa por defecto para login.
- `Fecha_Registro`
- PK compuesta: `("Id_Usuario", "Id_Empresa")`.

Justificacion: permite varios administradores por empresa, roles por empresa y una futura posibilidad de usuarios asociados a mas de una empresa. Tambien evita depender de un rol global fijo en `usuario.Id_Rol`.

## 3. Usuarios, roles y empresa activa

Modelo recomendado:

- Mantener `rol` como catalogo global.
- Mantener `usuario` como identidad global por ahora.
- Usar `usuario_empresa` para definir rol y pertenencia dentro de una empresa.
- El login debe resolver las membresias activas del usuario.
- Si el usuario tiene una sola empresa activa, el JWT puede emitirse con esa empresa activa.
- Si el usuario tiene varias empresas, el backend debe exigir seleccion segura de empresa y validar que pertenece a ella.

El JWT futuro deberia incluir como minimo:

- `id`: usuario autenticado.
- `empresa`: empresa activa validada por servidor.
- `rol`: rol del usuario dentro de esa empresa.

El frontend y Flutter no deben enviar libremente `Id_Empresa` para autorizar operaciones. Pueden enviar una seleccion de empresa solo durante el cambio de contexto, y el backend debe validarla contra `usuario_empresa`.

## 4. Clasificacion de tablas actuales

### Tablas raiz que deben tener `Id_Empresa` directo

- `material`: inventario pertenece directamente a una empresa. Aunque hoy puede tener `Id_Cliente`, ese cliente final no debe ser confundido con empresa SaaS.
- `orden_produccion`: entidad central de pedidos/produccion; debe filtrar por empresa en casi todas las rutas.

### Tablas de identidad y membresia

- `usuario`: identidad global. No necesita necesariamente `Id_Empresa` directo si se usa `usuario_empresa`.
- `rol`: catalogo global. No requiere `Id_Empresa` si los roles son estandar.
- `usuario_empresa`: nueva tabla para membresias y roles por empresa.

### Tablas que pueden heredar empresa de forma segura

- `material_movimiento`: hereda por `Id_Material` y/o `Id_Orden`.
- `orden_material`: hereda por `Id_Orden`; su `Id_Producto` debe pertenecer a material de la misma empresa.
- `orden_operario`: hereda por `Id_Orden`; ademas el `Id_Operario` debe pertenecer a la misma empresa.
- `usuario_orden`: hereda por `Id_Orden`; el usuario asignado debe pertenecer a la misma empresa.
- `comprobantes`: hereda por `Id_Orden`; `Id_Usuario` debe estar autorizado dentro de esa empresa.
- `observacion_operario`: hereda por `Id_Orden`; `Id_Admin` e `Id_Operario` deben pertenecer a la misma empresa.
- `tokens_recuperacion`: hereda por `Id_Usuario`; no contiene recurso empresarial directo.

### Tabla que requiere decision

- `google_calendar_tokens`: actualmente es por usuario. Si la integracion es personal, puede seguir por usuario y validarse por membresia activa. Si una misma persona puede usar calendarios distintos por empresa, debe incluir `Id_Empresa` y usar PK compuesta `("Id_Usuario", "Id_Empresa")`.

Recomendacion: agregar `Id_Empresa` a `google_calendar_tokens`, porque la sincronizacion de entregas es una funcion de contexto empresarial y puede tener configuraciones/calendarios diferentes por empresa.

## 5. Restricciones, unicos e indices a revisar

### `usuario`

Actual:

- `usuario_Correo_key` unico global.
- `usuario_Nombre_Usuario_key` unico global.

Decision pendiente:

- Si una persona puede pertenecer a varias empresas, el correo debe seguir siendo unico global.
- Si se desea permitir que dos empresas creen usuarios con el mismo correo de manera independiente, entonces se requiere un modelo distinto y mas complejo.

Recomendacion inicial: mantener `Correo` unico global para simplificar login web/Flutter y evitar duplicidad de identidad.

### `material`

Actual:

- `material_Nombre_Material_key` unico global.

Cambio necesario:

- Reemplazar por unico compuesto `("Id_Empresa", "Nombre_Material")`.

Justificacion: dos empresas deben poder tener materiales con el mismo nombre.

### `rol`

Actual:

- `rol_Nombre_Rol_key` unico global.

Recomendacion:

- Mantener global si los roles son estandar: admin, operario, cliente.

### `orden_operario`

Actual:

- unico `("Id_Orden", "Numero_Fase", "Id_Operario")`.

Recomendacion:

- Puede mantenerse, porque `Id_Orden` ya debe pertenecer a una empresa.

### Indices nuevos recomendados

- `usuario_empresa("Id_Empresa", "Id_Rol", "Estado")`
- `usuario_empresa("Id_Usuario", "Estado")`
- `material("Id_Empresa", "Activo")`
- `orden_produccion("Id_Empresa", "Estado")`
- `orden_produccion("Id_Empresa", "Id_Cliente")`
- `orden_produccion("Id_Empresa", "Id_Operario")`
- `google_calendar_tokens("Id_Empresa", "Id_Usuario")` si se agrega empresa.

## 6. Estrategia para asociar registros existentes

Objetivo: mover el estado actual a una primera empresa sin perder informacion.

Plan propuesto:

1. Confirmar que la base es staging o crear copia de seguridad verificable.
2. Crear una empresa inicial, por ejemplo `Empresa Principal`.
3. Crear una configuracion base en `empresa_config`.
4. Asociar todos los usuarios actuales a esa empresa en `usuario_empresa`, preservando el rol actual `usuario.Id_Rol`.
5. Agregar `Id_Empresa` nullable a tablas raiz: `material`, `orden_produccion` y posiblemente `google_calendar_tokens`.
6. Completar `Id_Empresa` de registros existentes con la empresa inicial.
7. Validar conteos y relaciones.
8. Convertir `Id_Empresa` a NOT NULL donde aplique.
9. Crear FKs, indices y constraints compuestas.
10. Actualizar backend para exigir empresa activa en consultas.
11. Solo despues habilitar RLS defensivo.

Recuperacion:

- Ejecutar primero en staging.
- Tomar backup antes de migrar.
- Separar migracion en pasos reversibles.
- Guardar conteos previos por tabla.
- Preparar rollback para quitar FKs/indices nuevos y restaurar constraints globales si falla antes de liberar.

## 7. Autorizacion del servidor

Regla central:

La empresa activa se deriva de la identidad autenticada y de `usuario_empresa`. Nunca se confia en un `Id_Empresa` recibido libremente desde frontend o Flutter.

Middleware futuro:

- `requireAuth`: valida JWT y carga usuario.
- `requireEmpresa`: valida empresa activa en JWT o seleccion enviada a endpoint de cambio de empresa.
- `requireEmpresaRole`: valida rol dentro de `usuario_empresa`.
- `requireResourceEmpresa`: valida que el recurso consultado pertenezca a la empresa activa.

Patron de consulta:

- Toda consulta a recurso empresarial debe filtrar por `Id_Empresa`.
- Si la tabla hereda empresa, la consulta debe hacer JOIN con la tabla raiz.
- Las rutas por identificador deben comprobar empresa en la misma consulta que lee el recurso.

Ejemplo conceptual:

```sql
SELECT *
FROM orden_produccion
WHERE "Id_Orden" = $1
  AND "Id_Empresa" = $2;
```

Para tablas derivadas:

```sql
SELECT oo.*
FROM orden_operario oo
JOIN orden_produccion op ON op."Id_Orden" = oo."Id_Orden"
WHERE oo."Id_Orden_Operario" = $1
  AND op."Id_Empresa" = $2;
```

## 8. Aislamiento por modulo

### Usuarios

- Admin solo gestiona usuarios de su empresa.
- Crear usuario debe crear o vincular identidad y membresia en `usuario_empresa`.
- Cliente final sigue siendo usuario con rol cliente dentro de una empresa.

### Materiales

- Listado, detalle, movimientos y alertas deben filtrar por empresa.
- `Id_Cliente` en material no reemplaza `Id_Empresa`.

### Ordenes y pedidos

- Todas las rutas por `Id_Orden`, cliente u operario deben cruzar empresa.
- No basta con validar que el usuario sea cliente/operario; tambien debe pertenecer a la misma empresa.

### Tareas

- `orden_operario` debe validarse por orden y empresa.
- El operario debe estar activo en `usuario_empresa` para esa empresa.

### Comprobantes

- Deben heredarse por orden y empresa.
- Cliente solo puede ver comprobantes de ordenes propias dentro de la empresa activa.

### Reportes, eficiencia y carga

- Deben partir siempre de `Id_Empresa`.
- Las agregaciones no deben mezclar empresas.

### Google Calendar

- Las rutas personales operan sobre usuario + empresa activa.
- Rutas administrativas solo admin de la empresa.
- `connected-users` debe listar solo usuarios de la empresa activa.

### Recuperacion de contraseña

- Puede mantenerse por usuario global.
- El correo de recuperacion no debe revelar si el usuario existe.
- Despues del login, se resuelve empresa activa.

## 9. RLS como defensa adicional

RLS recomendado pero no suficiente.

Razon:

- El backend usa `pg`.
- Si se conecta como un rol con privilegios amplios o service role, RLS puede no aplicarse como se espera.
- Las politicas deben probarse con el mismo rol real usado por la aplicacion.

Estrategia:

- Definir una variable de sesion por request, por ejemplo `app.current_empresa_id`.
- Usar transacciones por request o `SET LOCAL`.
- Politicas RLS comparan `Id_Empresa` con `current_setting('app.current_empresa_id', true)`.
- Para tablas derivadas, usar `EXISTS` contra la tabla raiz.
- Mantener filtros de empresa en SQL del backend aunque RLS exista.

## 10. Plan de pruebas Empresa A/B

Datos de prueba requeridos:

- Empresa A y Empresa B.
- Admin A y Admin B.
- Operario A y Operario B.
- Cliente A y Cliente B.
- Material A y Material B con nombres repetidos.
- Orden A y Orden B.
- Fase/tarea A y B.
- Comprobante A y B.

Pruebas:

- Admin A lista usuarios: no aparecen usuarios B.
- Admin A intenta leer `GET /api/usuarios/:idB`: 403 o 404 controlado.
- Cliente A intenta `GET /api/ordenes/:idOrdenB`: 403 o 404.
- Operario A intenta `GET /api/orden-operario/operario/:idOperarioB`: 403.
- Admin A intenta modificar material B: 403 o 404.
- Admin A intenta reasignar fase B a operario A: bloqueado.
- Reportes de A no incluyen conteos de B.
- Eficiencia/carga de A no incluye operarios B.
- Google Calendar de A no lista ni desvincula usuarios B.
- Flutter usa el mismo token/empresa activa y recibe los mismos codigos.
- Cambiar manualmente `Id_Empresa` en body o query no otorga acceso.

Pruebas que se pueden preparar antes de migrar:

- Tests unitarios de middleware de empresa.
- Tests de construccion de filtros SQL.
- Tests negativos de token y rol.

Pruebas que requieren migracion:

- Aislamiento real Empresa A/B.
- RLS real.
- Login multiempresa.
- Cambio de empresa activa.

## 11. Archivos a modificar en una futura implementacion

### Backend

- `BACKEND/config/env.js`
- `BACKEND/middleware/auth.js`
- `BACKEND/middleware/roles.js`
- Nuevo middleware probable: `BACKEND/middleware/empresa.js`
- `BACKEND/index.js`
- `BACKEND/routes/auth.route.js`
- `BACKEND/routes/usuarios.js`
- `BACKEND/routes/materiales.js`
- `BACKEND/routes/ordenes.js`
- `BACKEND/routes/comprobantes.js`
- `BACKEND/routes/orden_operario.js`
- `BACKEND/routes/usuario_orden.js`
- `BACKEND/routes/orden_material.js`
- `BACKEND/routes/eficiencia.js`
- `BACKEND/routes/carga_trabajo.js`
- `BACKEND/routes/googleCalendar.js`
- `BACKEND/routes/calendar.route.js`
- `BACKEND/routes/practica.routes.js`
- `BACKEND/test/*.js`

### Frontend

- `FRONTEND/src/stores/auth.js`
- `FRONTEND/src/services/api.js`
- Vistas admin que gestionan usuarios, materiales, produccion, reportes, eficiencia y carga.
- Vistas cliente que consultan pedidos/comprobantes.
- Vistas operario que consultan tareas y avances.
- Componentes de seleccion de empresa si un usuario tiene varias membresias.

### Flutter

No se encontro el proyecto Flutter en este checkout. En la implementacion deberan actualizarse, como minimo:

- Cliente HTTP/API.
- Flujo de login.
- Persistencia de JWT y empresa activa.
- Interceptores de autorizacion.
- Pantallas de tareas, pedidos, calendario y reportes si existen.

## 12. Procedimiento seguro para confirmar entorno

No asumir que `NODE_ENV=staging` demuestra que la base sea staging.

Procedimiento recomendado:

1. Verificar en Supabase Dashboard el Project Ref y nombre del proyecto.
2. Comparar host de `DATABASE_URL` con el proyecto esperado.
3. Confirmar con el responsable que ese Project Ref es staging.
4. Crear una tabla o vista de metadatos de entorno en futuras migraciones, por ejemplo `app_environment`, solo cuando se aprueben escrituras.
5. Mantener credenciales separadas para produccion y staging.
6. Bloquear migraciones si `NODE_ENV` y el Project Ref no coinciden con una lista permitida.

## 13. Cuentas de prueba autorizadas

Opciones seguras:

- Crear cuentas de prueba en staging, nunca en produccion.
- Usar correos con dominio controlado, por ejemplo `qa+admin-a@...`.
- Marcar usuarios con nombres claramente identificables: `qa_admin_empresa_a`, etc.
- No reutilizar cuentas reales.
- No cambiar contrasenas de usuarios reales.
- Documentar credenciales en un gestor seguro, no en el repositorio ni en chat.

## 14. Riesgos y decisiones pendientes

Riesgos:

- La base conectada aun debe confirmarse como staging independiente.
- No hay login real validado con cuentas de prueba.
- RLS actual es incompleta y no aisla empresas.
- Algunas restricciones unicas son globales y bloquearan datos repetidos entre empresas.
- Google Calendar requiere decision de alcance: usuario global o usuario por empresa.
- Flutter no esta en este checkout, por lo que su impacto solo puede estimarse.

Decisiones pendientes:

- Correo unico global vs correo unico por empresa.
- Si un usuario puede pertenecer a varias empresas.
- Si Google Calendar sera personal global o por empresa.
- Convencion para ocultar recurso ajeno: 403 vs 404.
- Nombre y campos finales de `empresa_config`.
- Estrategia de RLS con rol usado por `pg`.

## 15. Orden recomendado de ejecucion

1. Confirmar que la DB es staging.
2. Crear cuentas de prueba autorizadas en staging.
3. Ejecutar login real y pruebas de rol actuales.
4. Aprobar migracion multiempresa en staging.
5. Crear `empresa`, `empresa_config`, `usuario_empresa`.
6. Backfill a empresa inicial.
7. Agregar `Id_Empresa` a tablas raiz.
8. Ajustar constraints e indices.
9. Actualizar backend con empresa activa y filtros.
10. Agregar tests Empresa A/B.
11. Actualizar frontend.
12. Actualizar Flutter.
13. Implementar RLS defensivo.
14. Validar staging completo.
15. Preparar plan de produccion con backup y rollback.
