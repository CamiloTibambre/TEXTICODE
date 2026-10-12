# Fase 7.1 — módulo materiales

## Hechos observados

- Rama: `codex/fase-6-contexto-empresa`. El montaje existente de `/api/materiales` ya aplica `requireAuth` en `BACKEND/index.js:41`; por eso `index.js` no se modificó. `requireAuth` deriva `req.auth.empresaId` del token y la membresía (`BACKEND/middleware/auth.js:61-126`) y rechaza al superadmin con 403 (`:110-111`).
- Se modificó únicamente `BACKEND/routes/materiales.js`; se añadieron `BACKEND/test/materiales-aislamiento.test.js`, este informe y `DATABASE/PRUEBAS_SQL_MATERIALES_7_1.sql`. No se creó helper.
- Las lecturas de material y movimiento filtran por empresa autenticada; las escrituras usan ese mismo valor en los INSERT/UPDATE. El usuario unido (`usuario`) es global en el esquema y no tiene `Id_Empresa`; el movimiento del reporte exige además que movimiento y material coincidan en empresa.
- La migración define `material_empresa_nombre_unique` sobre `("Id_Empresa", "Nombre_Material")` (`DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql:506`), `fk_material_cliente_empresa` (`:516`) y las FKs compuestas de movimientos hacia material y orden (`:519-520`). El código mapea `23505` a 409 y `23503` a un 400 genérico que no revela nombres internos.

## Pruebas unitarias

Se revisó la cadena de imports antes de ejecutar. El test nuevo sustituye los imports de `express`, `db.js` y `roles.js` antes de importar el router; las regresiones 6.1 y 6.2 sustituyen sus dependencias por dobles. No se importó `config/env.js`/`dotenv`, no se abrieron conexiones ni sockets, no se llamó red real y no se lanzaron procesos externos desde esos tests. Se ejecutó solamente:

```text
node --test BACKEND/test/materiales-aislamiento.test.js BACKEND/test/fase-6-contexto-empresa.test.js BACKEND/test/fase-6-2-superadmin.test.js
```

Salida literal resumida por caso (el proceso terminó con código 1):

| ID | Salida observada |
|---|---|
| M1 | `✔ M1 y M7: listado filtra con empresa del token e ignora empresa cliente` |
| M2 | `✔ M2: material de otra empresa se comporta como inexistente (404)` |
| M3 | `✔ M3/M4: INSERT usa empresa del token; duplicado da 409 y nombre disponible da 201` |
| M4 | Incluido en el caso anterior; la rama duplicada se simuló lanzando `23505` desde el doble. No es evidencia de una violación real de PostgreSQL. |
| M5 | `✖ M5: PUT y DELETE de id ajeno devuelven 404 sin ejecutar cambios`; error literal: `AssertionError: The expression evaluated to a falsy value: assert.ok(state.queries[0].sql.includes('"Id_Empresa" = $2'))` (archivo `BACKEND/test/materiales-aislamiento.test.js:106`). El test ya había comprobado el 404 del primer caso, pero falló porque el primer registro de consultas es `BEGIN`; el caso DELETE no llegó a ejecutarse. La prueba no se alteró después del fallo. |
| M6 | `✔ M6: lecturas e inserts de movimientos incluyen empresa del token` |
| M7 | Incluido con M1; body/query/params con empresa ajena se ignoran en el caso del listado. |
| M8 | `✔ M8: las suites de regresión existentes contienen P1–P8 y S1–S11` |
| P1–P8 | Las ocho pruebas existentes de Fase 6.1 imprimieron `✔`; salidas observables desde `P1: login deriva la empresa única...` hasta `P8: usuario inactivo...`. |
| S1–S11 | Las once pruebas existentes de Fase 6.2 imprimieron `✔`; salidas observables desde `S1: superadmin global...` hasta `S11: no superadmin...`. |

Resumen literal del runner: `tests 28`, `pass 27`, `fail 1`, `cancelled 0`, `skipped 0`, `todo 0`, `EXIT_CODE=1`.

## Consultas PostgreSQL Q1–Q5

El clúster respondió identidad `postgres|texticode_test_20261009|127.0.0.1/32|5433|PostgreSQL 17.10 on x86_64-windows, compiled by msvc-19.44.35227, 64-bit`. Se crearon cinco clones independientes desde `texticode_migrada`: `f71m_q1_e44c3bda`, `f71m_q2_e44c3bda`, `f71m_q3_e44c3bda`, `f71m_q4_e44c3bda` y `f71m_q5_e44c3bda`, cada uno con dos empresas y dos materiales sintéticos.

| ID | Resultado | Evidencia |
|---|---|---|
| Q1 | NO EJECUTADA | El archivo se detuvo lógicamente en el metacomando `\if :q1`: `unrecognized value ":q1" for "\if expression": Boolean expected`. |
| Q2 | NO EJECUTADA | Mismo error en `\if :q2`; no se ejecutaron SELECT/UPDATE/DELETE de Q2. |
| Q3 | NO EJECUTADA | Mismo error en `\if :q3`; no se ejecutó INSERT de movimiento ni se observó SQLSTATE. |
| Q4 | NO EJECUTADA | Mismo error en `\if :q4`; no se probó la restricción unique en PostgreSQL. |
| Q5 | NO EJECUTADA | Mismo error en `\if :q5`; las sentencias no llegaron a prepararse. |

El runner de PowerShell reportó `PSQL_EXIT_Q1=0` hasta `PSQL_EXIT_Q5=0`, pese al error de metacomando; esos códigos no validan las consultas. No se corrigió ni se volvió a ejecutar el archivo después del fallo. `pg_hba.conf` se respaldó en `%TEMP%\texticode_pg17_20261009\pg_hba.phase71.backup` (SHA-256 `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`), se habilitó temporalmente `trust` solo para `texticode_test_20261009` desde `127.0.0.1/32` y se restauró en `finally`; el hash restaurado fue idéntico. Los clones se conservan.

## Revisión de Google y Calendar

Montajes sin middleware global: `/api/google` en `BACKEND/index.js:54` y `/api/calendar` en `:55`.

| Ruta | Clasificación | Evidencia |
|---|---|---|
| `GET /api/google/auth-url?action=login` | PÚBLICA NECESARIA | `googleCalendar.js:198-225`; inicia el flujo OAuth de login. |
| `GET /api/google/auth-url?action=link` | PÚBLICA SOSPECHOSA | La ruta no lleva `requireAuth`; valida un bearer con `verifyAuthToken` (`:203-212`), pero no comprueba membresía activa mediante middleware. Genera URL para vincular. |
| `GET /api/google/callback` | PÚBLICA NECESARIA | Callback OAuth sin `requireAuth`; valida el `state` firmado (`:229-239`). Acepta `code/state` y escribe tokens vía `upsertGoogleTokens` (`:249`, `:277`). Es una ruta pública que escribe en BD dentro del flujo OAuth. |
| `GET /api/google/status` | PROTEGIDA | `requireAuth`, `:293`. |
| `DELETE /api/google/unlink` | PROTEGIDA | `requireAuth`, `:317`. |
| `PATCH /api/google/settings` | PROTEGIDA | `requireAuth`, `:322`. |
| `POST /api/google/sync/delivery-events` | PROTEGIDA | `requireAuth`, `:507`. |
| `GET /api/google/events/upcoming` | PROTEGIDA | `requireAuth`, `:529`. |
| `GET /api/google/connected-users` | PROTEGIDA | `requireAuth` + `requireRoles('admin')`, `:566`. |
| `DELETE /api/google/unlink-user/:idUsuario` | PROTEGIDA | `requireAuth` + `requireRoles('admin')`, `:581`. |
| `GET /api/calendar/status` | PROTEGIDA | `requireAuth`, `calendar.route.js:18`. |
| `POST /api/calendar/connect` | PROTEGIDA | `requireAuth`, `:29`; vincula tokens en BD (`:37`). |
| `DELETE /api/calendar/connect` | PROTEGIDA | `requireAuth`, `:46`; elimina token en BD (`:48`). |
| `POST /api/calendar/sync` | PROTEGIDA | `requireAuth`, `:53`; sincroniza eventos externos y actualiza marcas de sincronización (`:67`). |
| `POST /api/calendar/sync/:idOrden` | PROTEGIDA | `requireAuth`, `:80`. |

## Patrón y límites

Patrón para órdenes: tomar empresa de `req.auth.empresaId`; añadir `Id_Empresa` a toda consulta de tablas empresariales y a todos sus INSERT; en joins multiempresa, igualar también la empresa de las tablas relacionadas; tratar recurso ajeno como inexistente; mapear SQLSTATE sin filtrar nombres internos. No se creó helper.

No cubre los demás módulos, frontend ni app móvil; no se probó contra el backend en ejecución y el backend no se ejecutó. El módulo/aislamiento NO queda aprobado: M5 falló por el arnés y Q1–Q5 quedaron sin ejecutar por el error del archivo SQL. Fuera de alcance: modificar `index.js`, otras rutas, migración, rollback, seed o integración completa.

## Estado y confirmaciones

Estado de trabajo anterior al commit: rama `codex/fase-6-contexto-empresa`; `git log --oneline -3`: `ccbd1d1`, `9e212a1`, `4789021`. `git status --short` y el commit se reportan en el resumen de entrega.

Confirmación: no se ejecutó el backend, no se leyó ningún `.env`, no se usó el puerto 5432, no hubo push, fetch ni cambio de rama, y no se tocaron la migración definitiva, el rollback ni el seed. Se leyeron únicamente los archivos permitidos del router, middleware, db, pruebas, migración/esquema y montaje de Google/Calendar, además del prompt de Fase 7.1.

## Fase 7.1b — cierre de M5, transacciones y Q1–Q6

### Cambios de este paso

- M5: el test filtra de `state.queries` los comandos de control `BEGIN`, `COMMIT` y `ROLLBACK`; sobre las consultas restantes verifica SQL con empresa, parámetro `42`, respuesta 404 y cero mutaciones, tanto para PUT como para DELETE. Así evita tratar `BEGIN` como si fuera la consulta del recurso.
- Se añadieron pruebas con dobles para los cierres transaccionales de POST, PUT y DELETE. No se modificó `BACKEND/routes/materiales.js`.
- Se reemplazó el SQL condicional con metacomandos por un único bloque `DO` sin metacomandos psql. El nombre de cada clon selecciona exactamente un caso y el bloque termina en `RAISE NOTICE 'Qn OK'` solo tras validar sus aserciones; en caso contrario lanza una excepción. Q6 ejecuta el control sin filtro de empresa.
- El primer intento de Q2/Q4/Q5 reportó SQLSTATE `42804` porque el harness pasó `NULL` sin tipo a través de `EXECUTE ... USING`. Se tiparon esos parámetros como `NULL::integer` en el harness (sin alterar las cadenas SQL del router) y se repitieron esos casos en sus clones. Las repeticiones dieron `Qn OK` y código cero.

### Salida literal de `node --test`

Comando ejecutado: `node --test BACKEND/test/materiales-aislamiento.test.js BACKEND/test/fase-6-contexto-empresa.test.js BACKEND/test/fase-6-2-superadmin.test.js`. El router se importó con dobles para Express, pool y roles; los regresores 6.1/6.2 sustituyen sus imports sensibles. No se cargaron dotenv/env, conexiones, red ni procesos externos.

```text
✔ preparación usa dobles en memoria y no importa env.js, db.js ni procesos externos (1.3398ms)
✔ S1: superadmin global sin membresía obtiene token sin empresa (1.0578ms)
✔ S2: superadmin consultado en BD recibe 403 en requireAuth operativo (0.5428ms)
✔ S3: admin de empresa recibe 403 en requireSuperadmin (0.6246ms)
✔ S4: falta de token recibe 401 en requireSuperadmin (0.3931ms)
✔ S5: claim superadmin con rol distinto en BD recibe 403 (0.3389ms)
✔ S6: crea empresa, configuración, admin y membresía en transacción; no devuelve hash (2.3668ms)
✔ S7: error a mitad de creación ejecuta rollback y no conserva filas simuladas (0.4905ms)
✔ S8: nombre duplicado y slug duplicado responden 409 (0.804ms)
✔ S9: baja de empresa con datos es desactivación y no DELETE físico (0.8818ms)
✔ S10: admin no puede asignar rol superadmin por /api/usuarios (0.6223ms)
✔ S11: no superadmin no puede gestionar rol superadmin ni modificar ese usuario (0.7915ms)
✔ prepara módulos con dobles: no importa env.js, db.js ni módulos externos de red (17.6097ms)
✔ P1: login deriva la empresa única e ignora la empresa del cliente; select-empresa queda deprecado e ignora su empresa (1.7489ms)
✔ P2: login sin membresía activa responde HTTP 403 (0.1791ms)
✔ P3: login con membresía inactiva responde HTTP 403 (0.2108ms)
✔ P4: requireAuth devuelve 403 si se desactiva la membresía después de emitir el token (0.3595ms)
✔ P5: requireAuth devuelve 403 si la empresa del token no coincide con la membresía (0.1899ms)
✔ P6: requireAuth conserva empresaId del token aunque body, query y params indiquen otra (0.2084ms)
✔ P7: token ausente, vencido e con firma inválida mantienen rechazo HTTP 401 (0.4072ms)
✔ P8: usuario inactivo sigue en 403 y un rol distinto conserva el rol del token como antes (0.4649ms)
✔ preparación aislada: reemplaza express/db/roles y no importa env.js, db.js ni procesos externos (1.5202ms)
✔ M1 y M7: listado filtra con empresa del token e ignora empresa cliente (1.2712ms)
✔ M2: material de otra empresa se comporta como inexistente (404) (0.3986ms)
✔ M3/M4: INSERT usa empresa del token; duplicado da 409 y nombre disponible da 201 (0.7155ms)
✔ M5: PUT y DELETE de id ajeno devuelven 404 sin ejecutar cambios (0.5044ms)
✔ M6: lecturas e inserts de movimientos incluyen empresa del token (0.5278ms)
✔ M8: las suites de regresión existentes contienen P1–P8 y S1–S11 (8.0698ms)
✔ TX POST éxito: confirma transacción y libera una vez (0.2874ms)
✔ TX POST error SQL: revierte y libera una vez (0.1505ms)
✔ TX POST excepción: revierte y libera una vez (0.149ms)
✔ TX PUT éxito: confirma transacción y libera una vez (0.0847ms)
✔ TX PUT 404: revierte y libera una vez (0.0851ms)
✔ TX PUT error SQL: revierte y libera una vez (0.09ms)
✔ TX PUT excepción: revierte y libera una vez (0.0538ms)
✔ TX DELETE éxito: confirma transacción y libera una vez (0.084ms)
✔ TX DELETE 404: revierte y libera una vez (0.0601ms)
✔ TX DELETE error SQL: revierte y libera una vez (0.1141ms)
✔ TX DELETE excepción: revierte y libera una vez (0.0967ms)
ℹ tests 39
ℹ suites 0
ℹ pass 39
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 344.8172
EXIT_CODE=0
```

### Auditoría de transacciones

Hecho observado al leer el router: los tres handlers abren el cliente antes del `try`, ejecutan `BEGIN` dentro del `try`, envían `COMMIT` en éxito, y el `catch` envía `ROLLBACK`; los tres cierran `client.release()` en `finally`. PUT y DELETE también ejecutan `ROLLBACK` en los dos retornos 404 previos al catch. Las pruebas simulan cada camino y afirman un único `release()` y cierre `COMMIT`/`ROLLBACK`.

| Ruta | Éxito | 404 | Error SQL | Excepción |
|---|---|---|---|---|
| POST `materiales.js:131-179` | COMMIT, release ×1 | No aplica: valida campos antes de conectar (`:135-138`) | ROLLBACK, release ×1 | ROLLBACK, release ×1 |
| PUT `materiales.js:183-263` | COMMIT, release ×1 | ROLLBACK, release ×1 por SELECT vacío o `rowCount=0` (`:199-202`, `:227-230`) | ROLLBACK, release ×1 | ROLLBACK, release ×1 |
| DELETE `materiales.js:271-312` | COMMIT, release ×1 | ROLLBACK, release ×1 por SELECT vacío o `rowCount=0` (`:281-284`, `:291-294`) | ROLLBACK, release ×1 | ROLLBACK, release ×1 |

En los caminos cubiertos no se encontró fuga. Si `pool.connect()` falla antes de entregar el cliente, no existe cliente que liberar; queda fuera de la transacción. Las pruebas usan dobles, no conexiones del backend.

### Resultados PostgreSQL

Cada caso se ejecutó con psql conectado al clon cuyo nombre aparece en la tabla, no a `postgres`. La identidad de cada clon indicó usuario `texticode_test_20261009`, dirección `127.0.0.1/32`, puerto `5433` y PostgreSQL `17.10`.

| Caso | Clon | Salida comprobada | Veredicto |
|---|---|---|---|
| Q1 | `f71b_q1_1241a86f` | `Q1 OK A=1 B=1`, psql `0` | APROBADA |
| Q2 | `f71b_q2_1241a86f` | `Q2 OK GET=0 PUT=0 DELETE=0`, psql `0` | APROBADA |
| Q3 | `f71b_q3_1241a86f` | `Q3 OK SQLSTATE=23503`, psql `0` | APROBADA |
| Q4 | `f71b_q4_1241a86f` | `Q4 OK same-company=23505 other-company=inserted`, psql `0` | APROBADA |
| Q5 | `f71b_q5_1241a86f` | `Q5 OK all router statements executed`, psql `0` | APROBADA |
| Q6 | `f71b_q6_1241a86f` | `Q6 OK unfiltered_rows=2`, psql `0` | APROBADA |

Q2 confirmó cero filas en GET, UPDATE y la actualización lógica de DELETE con empresa A frente al ID de B. Q5 ejecutó las cadenas SQL del router con parámetros sintéticos. Estas pruebas son sobre clones locales desechables; no validan datos reales ni entornos compartidos.

`pg_hba.conf` se respaldó antes de cada recuperación de acceso; la regla temporal fue únicamente `trust` para `texticode_test_20261009` desde `127.0.0.1/32`, con restauración en `finally`. SHA-256 restaurado: `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`. Se conservaron los clones.

### Google y Calendar

Revisión estática, sin cambios: `BACKEND/index.js:54-55` monta los routers sin autenticación global. En `googleCalendar.js`, `GET /auth-url?action=login` es PÚBLICA NECESARIA (`:198-225`); rama `action=link` se clasifica PÚBLICA SOSPECHOSA porque la ruta no aplica `requireAuth` y `verifyAuthToken` no revalida membresía activa (`:203-212`). `GET /callback` es PÚBLICA NECESARIA para OAuth; valida `state` firmado y escribe tokens (`:229-239`, `:249`, `:277`). Las rutas `GET /status` (`:293`), `DELETE /unlink` (`:317`), `PATCH /settings` (`:322`), `POST /sync/delivery-events` (`:507`), `GET /events/upcoming` (`:529`), `GET /connected-users` (`:566`) y `DELETE /unlink-user/:idUsuario` (`:581`) son PROTEGIDAS por `requireAuth`; las dos últimas exigen además rol admin.

En `calendar.route.js`, son PROTEGIDAS `GET /status` (`:18`), `POST /connect` (`:29`), `DELETE /connect` (`:46`), `POST /sync` (`:53`) y `POST /sync/:idOrden` (`:80`). `POST /connect` escribe tokens (`:37`); `DELETE /connect` elimina la fila (`:48`); `/sync` actualiza marcas de sincronización (`:67`). No se observó otra ruta en esos routers.

### Límites y estado de 7.1b

No se ejecutó backend, no se cubren los demás módulos, frontend, app móvil ni integración completa. No se declara aprobado el módulo ni el aislamiento. En este paso se leyeron `BACKEND/routes/materiales.js`, `BACKEND/routes/googleCalendar.js`, `BACKEND/routes/calendar.route.js`, `BACKEND/index.js`, el test de materiales y los regresores 6.1/6.2; no se leyó ningún `.env`.

La rama siguió siendo `codex/fase-6-contexto-empresa`. El detalle del commit nuevo, `git status --short` y `git log --oneline -3` está en el resumen de entrega de 7.1b.
