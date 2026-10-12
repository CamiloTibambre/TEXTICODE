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
