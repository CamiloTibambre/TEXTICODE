# Fase 4.1 — inventario de aislamiento y pruebas negativas

## 1. Alcance y método

**HECHO OBSERVADO.** Rama `codex/seguridad-escalon-1`; `git status --short` estaba limpio antes de este informe. Leí código bajo `BACKEND` sin abrir `.env*`, excluí `node_modules` y no ejecuté backend, npm ni pruebas. Revisé el SQL definitivo y el esquema reproducible solo para justificar expectativas estáticas.

La instancia de PostgreSQL responde en `127.0.0.1:5433` (`Test-NetConnection` devolvió `True`) y existe `%TEMP%\texticode_pg17_20261009\data`. `pg_ctl.exe` está en `C:\Program Files\PostgreSQL\17\bin`; no se reinició porque el puerto respondía. La consulta de identidad autorizada, `SELECT current_database(), current_user, inet_server_addr(), inet_server_port();`, no pudo completarse: `psql` devolvió `fe_sendauth: no password supplied`. Por tanto no se pudo verificar base/rol/dirección/puerto mediante SQL, ni se creó `texticode_migrada`, se aplicó la migración o se creó clon alguno. Se detuvieron las pruebas de base de datos antes de cualquier DDL o DML. No se buscó ni leyó una contraseña.

## 2. A1 — conexión a datos

**HECHO OBSERVADO.** `BACKEND/db.js:1-11` importa `pg`, crea `Pool` con `connectionString: env.databaseUrl` y configura `ssl: { rejectUnauthorized: false }`. No importa `supabase-js` ni usa REST. `BACKEND/config/env.js:1-34` carga `dotenv` y exige `DATABASE_URL` y `JWT_SECRET`; también lee `JWT_EXPIRES`, `FRONTEND_URL`, `PORT`, `NODE_ENV`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `SENDGRID_API_KEY` y `SENDGRID_FROM_EMAIL`. No se leyeron valores de `.env`.

**Conclusión estática:** la URL de `pg` permite seleccionar un destino mediante `DATABASE_URL` externo al código. Para PostgreSQL local también debe ser compatible con el SSL configurado; esa conexión no se verificó. No se afirma que la conexión local funcione sin cambios de configuración.

## 3. A2 — contexto empresarial

**HECHO OBSERVADO.** `BACKEND/middleware/auth.js:9-26` firma JWT con `id`, `rol`, `usuario` y, si el objeto de usuario lo contiene, `empresa` y `empresaNombre`. `:61-99` verifica el JWT, vuelve a consultar usuario/rol, y construye `req.auth.empresaId` a partir de `payload.empresa`; no consulta ni vuelve a validar la membresía empresarial en cada petición.

El inicio de sesión acepta `idEmpresa`/`Id_Empresa` en el body (`routes/auth.route.js:31-43`, `routes/usuarios.js:69-80`). El servicio obtiene membresías activas (`services/auth.service.js:79-93`) y valida la empresa solicitada contra ellas (`:137-152`). La selección posterior también verifica membresía (`:184-245`) antes de emitir el JWT (`:251-272`). La selección viene del cliente, pero el código leído sí comprueba pertenencia en esos flujos.

Existe `requireEmpresa` (`middleware/empresa.js:5-18`) y `isSameEmpresa` (`:27-32`), pero la búsqueda en `BACKEND/index.js` y rutas no encontró su uso. Las rutas montadas usan `requireAuth`/roles, no ese middleware empresarial (`index.js:39-53`). No se encontró uso de `empresaId` o `Id_Empresa` del body/query/params en rutas de negocio fuera de los dos flujos de login/selección indicados. La autenticación usa el dato del JWT sin revalidar membresía por solicitud: queda como interrogante para Fase 6.

## 4. A3 — rutas y evidencia de aislamiento

Los métodos y caminos están expresados en relación con el prefijo de montaje. “Admin” significa middleware de rol administrador; “autenticado” significa `requireAuth`; los controles internos `requireRoles`/`requireSelfParamOrRoles` se indican aparte. Las rutas empresariales de la tabla consultan tablas tenant sin filtro derivado de `req.auth.empresaId` en el SQL de sus controladores.

| Prefijo y rutas activas (método + ruta) | Rol/gate | Tablas principales | Clasificación y evidencia |
|---|---|---|---|
| `/api/materiales`: GET `/`, `/reportes/historial`, `/cliente/:idCliente`, `/alertas/stock-bajo`, `/:id`, `/:id/movimientos`; POST `/`; PUT `/:id`; DELETE `/:id` | Autenticado; varios endpoints admin, cliente restringido por ID | material, material_movimiento, usuario | **SIN AISLAMIENTO**. SQL sin `Id_Empresa`: `routes/materiales.js:11-119,139-276`. El cliente se filtra por `Id_Cliente`, no por empresa (`:59-74`). |
| `/api/ordenes`: GET `/`, `/operario/:idOperario`, `/cliente/:idCliente`, `/:id`, `/estado/:estado`; POST `/`; PUT `/:id`; DELETE `/:id` | Autenticado; admin en lista/estado/escrituras; self-or-admin en listados por usuario | orden_produccion, usuario, material, orden_operario, usuario_orden | **SIN AISLAMIENTO**. Los SELECT/UPDATE/DELETE usan IDs/estado y no empresa: `routes/ordenes.js:22-278`. |
| `/api/comprobantes`: GET `/`, `/cliente/:idCliente`, `/:id`; POST `/`; PUT `/:id`; DELETE `/:id` | Autenticado; admin en lista/escrituras; self-or-admin por cliente | comprobantes, orden_produccion, usuario | **SIN AISLAMIENTO**. Joins/operaciones sin condición empresarial: `routes/comprobantes.js:8-139`. |
| `/api/orden-material`: GET `/orden/:idOrden`; POST `/`; PUT `/:idOrden/:idProducto`; DELETE `/:idOrden/:idProducto` | Autenticado + admin | orden_material, material, material_movimiento | **SIN AISLAMIENTO**. Filtra por IDs de orden/material, no empresa: `routes/orden_material.js:7-165`. |
| `/api/orden-operario`: POST `/`; GET `/orden/:idOrden`, `/operario/:idOperario`, `/operario/:idOperario/historial`; PUT `/:id`; DELETE `/:id`; PATCH `/:id/completar` | Autenticado; admin en varias operaciones; self-or-admin por operario | orden_operario, orden_produccion, usuario, material, fases | **SIN AISLAMIENTO**. Lecturas/escrituras por IDs sin empresa: `routes/orden_operario.js:12-390`. |
| `/api/usuario-orden`: GET `/orden/:idOrden`, `/usuario/:idUsuario`; POST `/`; DELETE `/:idUsuario/:idOrden` | Autenticado; admin en lista por orden/escrituras; self-or-admin por usuario | usuario_orden, orden_produccion, usuario | **SIN AISLAMIENTO**. `routes/usuario_orden.js:8-60`. |
| `/api/practica`: GET `/usuarios/:Id_Usuario`, `/ordenes/:Id_Orden`, `/ordenes/:Id_Orden/materiales`, `/ordenes/:Id_Orden/comprobante`, `/clientes/:Id_Cliente/materiales`, `/ordenes`, `/materiales`, `/usuarios`, `/comprobantes` | Autenticado; además admin si no es producción; en producción responde 404 | usuario, orden_produccion, orden_material, material, comprobantes | **SIN AISLAMIENTO** cuando habilitada. Filtros por IDs/categoría/estado/paginación sin empresa: `routes/practica.routes.js:7-14,21-140`. |
| `/api/eficiencia`: GET `/operarios/:id`, `/operarios`, `/observaciones/:id`, `/operarios/:id/historial`; POST `/observaciones`; DELETE `/observaciones/:id` | Autenticado + admin | usuario, rol, orden_produccion, orden_operario, observacion_operario, fases | **SIN AISLAMIENTO**. Consultas y mutaciones sin filtro empresarial: `routes/eficiencia.js:100-499`. |
| `/api/carga-trabajo`: GET `/`, `/sugerencias`, `/operarios/:id`; POST `/reasignar`, `/reasignar-multiple`, `/aplicar-sugerencias`; PATCH `/fases/:id/operario`, `/umbrales`, `/ordenes/:id/operario`, `/operarios/:id/estado` | Autenticado + admin | orden_produccion, orden_operario, usuario, rol, fases | **SIN AISLAMIENTO**. SQL por orden/operario/IDs sin empresa: `routes/carga_trabajo.js:322-631`. |
| `/api/calendar`: GET `/status`; POST `/connect`, `/sync`, `/sync/:idOrden`; DELETE `/connect` | `requireAuth` por ruta | google_calendar_tokens, orden_produccion, orden_operario, usuario_orden | **SIN AISLAMIENTO**. Token consultado/actualizado/borrado por usuario, sin empresa: `routes/calendar.route.js:18-89`; sincronización de órdenes por usuario/ID sin filtro de empresa. |
| `/api/google`: GET `/status`, `/events/upcoming`, `/connected-users`; DELETE `/unlink`, `/unlink-user/:idUsuario`; PATCH `/settings`; POST `/sync/delivery-events` | Auth en rutas; admin también para connected-users/unlink-user | google_calendar_tokens, usuario, rol, orden_produccion, orden_operario, usuario_orden | **SIN AISLAMIENTO**. Tokens por `Id_Usuario`, listados globales y consultas de órdenes sin filtro de empresa: `routes/googleCalendar.js:293-585`. |
| `/api/notificaciones`: POST `/estado`, `/comprobante`, `/tarea`; GET `/estadisticas` | Autenticado + admin por montaje | No hay consulta de tenant en el controlador; envía correo | **CONFÍA EN EL CLIENTE** para los datos del aviso: acepta `ordenId`, email, nombre, tarea/productos y PDF del body sin comprobar orden/membresía en BD (`routes/notificaciones.js:22-149`). |
| `/api/usuarios`: GET `/`, `/:id`; POST `/login`, `/`; PUT `/:id`; PATCH `/:id/inactivar`; DELETE `/:id` | Auth/rol por ruta; login público | usuario, rol | **INDETERMINADO** para aislamiento empresarial: `usuario` no tiene `Id_Empresa` en el esquema; varias rutas operan la identidad global por ID. Código `routes/usuarios.js:34-199`. |
| `/api/auth`: POST `/login`, `/select-empresa`, `/google/mobile`, `/recuperar-contrasena`, `/cambiar-contrasena`; GET `/validar-token` | Login/selección/recuperación públicos con validación propia | usuario, rol, usuario_empresa, empresa, tokens_recuperacion | **INDETERMINADO** como aislamiento de recursos. Login/selección valida membresía; recuperación se vincula al usuario global. `routes/auth.route.js:31-369`, `services/auth.service.js:79-272`. |
| `/api/roles`: GET `/`, `/:id`; POST `/`; PUT `/:id`; DELETE `/:id` | Autenticado + admin por montaje | rol | **INDETERMINADO**: catálogo global sin `Id_Empresa`; el código no define si el catálogo debe ser compartido o por empresa. `routes/roles.js:7-63`. |
| `/api/google`: GET `/auth-url`, `/callback` | Sin `requireAuth` en ruta; `/auth-url` valida bearer solo para acción link; callback valida `state` OAuth | usuario, google_calendar_tokens | **INDETERMINADO** como aislamiento empresarial; flujo de OAuth global por usuario/email y no incluye filtro de empresa. `routes/googleCalendar.js:198-290`. |

**Conteo estático de rutas declaradas (99):** 75 SIN AISLAMIENTO; 4 CONFÍA EN EL CLIENTE; 20 INDETERMINADO; 0 PROTEGIDO CON EVIDENCIA de filtro por empresa derivada del servidor. No se contó el comentario de ruta de `googleCalendar.js:73`. `/health` y `/` (`index.js:35,55`) son dos endpoints públicos auxiliares sin consulta de datos empresariales.

**Rutas críticas sin aislamiento:** se enumeran en las filas clasificadas SIN AISLAMIENTO: todos los endpoints de materiales, órdenes, comprobantes, orden-material, orden-operario, usuario-orden, práctica, eficiencia, carga-trabajo, calendar y las siete operaciones de datos de `/api/google`. Los cuatro endpoints de notificaciones confían en IDs/destinatarios del body sin asociarlos a la empresa o validar la orden. La existencia de `services/materiales.service.js` y `services/ordenes.service.js` con filtros por empresa no protege estas rutas: no se encontraron importaciones de esos servicios en los controladores `routes/materiales.js`/`routes/ordenes.js`; esos controladores ejecutan SQL propio.

## 5. A4 — tablas sin `Id_Empresa`

**HECHO OBSERVADO en los DDL versionados, no en catálogo conectado:** el SQL añade `Id_Empresa` a nueve tablas operativas (`MIGRACION_FASE_3_DEFINITIVA.sql:147-155`) y crea `empresa`, `empresa_config` y `usuario_empresa` (`:69-105`). Las tres tablas preexistentes que no reciben esa columna son:

| Tabla | Relación observada | Lectura factual / cuestión de alcance |
|---|---|---|
| `rol` | FK de `usuario`; catálogo de nombres de rol (`ESQUEMA_INICIAL_REPRODUCIBLE.sql:12-29`) | Tabla sin empresa; si el catálogo es deliberadamente global queda por decidir. |
| `usuario` | Identidad y FK de rol; se relaciona con empresas a través de `usuario_empresa` (`:18-29`; migración `:92-105`) | Una identidad puede asociarse a membresías empresariales; no tiene empresa propia. Intención/riesgo de datos globales queda por decidir. |
| `tokens_recuperacion` | Contiene `Id_Usuario` y FK a `usuario`; no recibe `Id_Empresa` (`ESQUEMA_INICIAL_REPRODUCIBLE.sql:131-145`) | Recuperación ligada al usuario global; política de alcance empresarial no definida por el DDL. |

No se observó una instrucción `ENABLE ROW LEVEL SECURITY` en el esquema reproducible ni en la migración. Eso prueba que estos archivos no habilitan RLS; sin poder consultar el clúster no se afirma el estado efectivo de RLS/policies del servidor.

## 6. B1–B7 — pruebas negativas

**Ninguna prueba B se ejecutó.** Para cada una, “resultado real” es no obtenido; no hay SQLSTATE ni conteos observados. Las expectativas siguientes son lectura del DDL y no veredictos experimentales.

| ID | Esperado justificado por código/DDL | Resultado real y veredicto |
|---|---|---|
| B1 — cambiar `Id_Empresa` de material A a B con hijos de A | Las FKs compuestas a material incluyen `Id_Empresa` y no declaran `ON UPDATE CASCADE` (`MIGRACION_FASE_3_DEFINITIVA.sql:497-512`); el comportamiento por defecto de PostgreSQL es NO ACTION. Esperado: rechazo `23503` si hay hijos que referencian la clave A. | No ejecutada; SQLSTATE no observado. **POR DEFINIR (experimental)**. |
| B2 — insertar dependiente de empresa B apuntando a padre A | FKs compuestas declaradas para orden/material y tablas dependientes (`:497-529`). Esperado: `23503` en la FK compuesta que no encuentre `(Id, Id_Empresa)`. | No ejecutada; constraint/SQLSTATE reales no observados. **POR DEFINIR (experimental)**. |
| B3 — borrar empresa con datos | DDL usa `ON DELETE CASCADE` desde `empresa` solo para `empresa_config.Id_Empresa` y `usuario_empresa.Id_Empresa` (`:80-105`). Las nueve FKs directas de tablas operativas a `empresa` no especifican cascada (`:460-485`), por lo que datos allí deben impedir el borrado (`23503`, por defecto). Si el borrado pudiera completarse, config y membresías serían cascadas. Con filas operativas, se espera que la sentencia completa falle y no deje esas cascadas aplicadas. | No ejecutada; cascadas/bloqueo no observados en BD. **POR DEFINIR (experimental; riesgo potencial de cascada documentado por DDL)**. |
| B4 — cruces indirectos orden → material → movimiento | Orden tiene FK compuesta al material (`:497-500`); movimiento tiene FKs compuestas a material y orden (`:506-508`). Un cruce de empresa en cualquiera de esos pares debe fallar `23503`. | No ejecutada; eslabón/constraint/SQLSTATE reales no observados. **POR DEFINIR (experimental)**. |
| B5 — usuario de A como operario o usuario de orden B | `orden_operario` vincula `(Id_Operario, Id_Empresa)` y `usuario_orden` vincula `(Id_Usuario, Id_Empresa)` a la membresía (`:514-520`). Esperado: falta de membresía B rechazada por FK compuesta, `23503`. | No ejecutada. **POR DEFINIR (experimental; hay FK que lo cubre en el SQL)**. |
| B6 — `SELECT * FROM material` sin filtro | El SQL no crea RLS ni obliga filtros de lectura; si el rol puede seleccionar y hay filas A/B, la consulta sin `WHERE` las devolvería. La autorización SQL del rol dedicado también debe comprobarse. | No ejecutada; no hay conteo ni verificación de RLS/grants. **POR DEFINIR (experimental)**. |
| B7 — uso indirecto de tablas sin empresa | `usuario` es el nodo global que conecta membresías de varias empresas; `tokens_recuperacion` refiere a ese usuario y `rol` es compartida por `usuario`/membresías. El DDL permite esas relaciones indirectas; su intención de negocio y los datos efectivos no se establecen solo con el esquema. | No ejecutada; no se consultaron filas. **POR DEFINIR (experimental y de alcance)**. |

## 7. Qué garantiza y qué no

El DDL puede impedir que se persistan varias referencias directas cruzadas cuando se usan las FKs compuestas B-02..B-18. También define unicidad dentro de empresa para nombre de material y membresía principal. No filtra `SELECT`, no activa RLS y no obliga al pool del backend a incluir empresa en cada query. En consecuencia, no evita lecturas globales ni actualizaciones/borrados por ID desde SQL sin filtro. **Aislamiento completo no demostrado.**

## 8. Opciones de diseño (sin implementación)

1. **Filtros backend obligatorios:** capa/helper común que tome empresa solo de `req.auth`, valide membresía y aplique `Id_Empresa` a lecturas y escrituras. Ventaja: encaja con `pg` y centraliza consultas. Coste/riesgo: rutas que omitan la capa vuelven a quedar abiertas; requiere migrar y revisar cada controlador.
2. **RLS en PostgreSQL:** políticas por tabla y variable de sesión de empresa. Ventaja: defensa en la BD incluso ante una query olvidada. Coste: establecer el contexto con `SET LOCAL` dentro de transacciones en el pool y evitar fuga de contexto entre conexiones; crear y probar políticas/grants. El backend usa `pg` directo, no REST/supabase-js, por lo que puede establecer contexto SQL; debe verificarse la configuración real de Supabase antes de decidir.
3. **Ambas:** filtros explícitos más RLS. Añade defensa en profundidad, con mayor costo de implementación y pruebas de sesión/roles/policies. Ninguna opción se implementó ni aprobó aquí.

## 9. Pendientes para Fase 6 y limitaciones

Fase 6 debe revisar: middleware `requireAuth` y membresía no revalidada por solicitud; uso/ausencia de `requireEmpresa`; las 75 rutas SIN AISLAMIENTO enumeradas; las cuatro rutas de notificación que aceptan destinatario/orden del body; alcance de usuarios, roles y recuperación global; y autorización de Google Calendar por empresa. Ninguna ruta del backend fue ejecutada: las rutas se clasificaron por lectura estática. Las pruebas B tampoco se ejecutaron por fallo de autenticación al verificar identidad de PostgreSQL; no deben interpretarse como aprobadas ni fallidas.

## 10. Confirmación

No hubo conexión autenticada ni cambio de datos en PostgreSQL; no se tocó 5432 ni otro destino. No se leyó `.env` ni archivo de credenciales; no se ejecutó backend, npm, pruebas, migración, FASE_3 original ni rollback. No se reinició ni borró el clúster o clones. No se hizo push, fetch ni checkout. Este informe es el único archivo nuevo; no se modificó ni borró archivo existente.
