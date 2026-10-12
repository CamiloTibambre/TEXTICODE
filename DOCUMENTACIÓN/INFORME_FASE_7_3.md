# Fase 7.3 — `orden_material` y movimientos de stock

## Alcance y estado

Se ajustaron `BACKEND/routes/orden_material.js` y únicamente los dos `console.log` de depuración indicados en `BACKEND/routes/ordenes.js`. Se añadieron la suite `BACKEND/test/orden-material-aislamiento.test.js` y el script `DATABASE/PRUEBAS_SQL_ORDEN_MATERIAL_7_3.sql`. Las suites Node y Q1–Q7 pasaron en mocks y clones locales PostgreSQL 17.10. **Validación en base desechable; NO aprobación para Supabase, staging ni producción.**

## Limpieza de logs (punto 0)

- Antes del cambio, `ordenes.js:24` imprimía `SE EJECUTÓ GET /ORDENES` y `:42` imprimía `ORDENES: []`/la lista. Se eliminaron solamente esos dos `console.log`; se conservaron los `console.error`.
- `git log -S` encuentra ambas cadenas en `607fad0` (`2026-09-06`, `Arreglo estado pausadas por Retrasadas`) y también existen en el padre de `33a01ff` (commit 7.2). **Hecho:** ya existían antes del paso 7.2.
- No se encontraron `console.log` ni `console.error` en `orden_material.js` ni `materiales.js`; no se modificó `materiales.js`.

## Aislamiento y cambio mínimo

- GET filtra `orden_material.Id_Empresa` del contexto y enlaza `material` también por empresa (`orden_material.js:9–19`). POST obtiene la empresa de `req.auth.empresaId`, sin confiar en body/query/params (`:29–32`).
- La lectura de stock del POST y del PUT usa empresa más `FOR UPDATE` (`:39–42`, `:110–112`). Cada UPDATE de stock incluye empresa (`:61–64`, `:137–140`, `:180–183`).
- Los INSERT de `orden_material` y `material_movimiento` llevan `Id_Empresa` (`:55–68`, `:142–144`, `:185–187`). La inserción de enlace usa ambas FKs compuestas `fk_om_orden_empresa` y `fk_om_producto_empresa` (migración `:522–524`); un `23503` se traduce a 400 genérico sin filtrar el nombre del constraint (`orden_material.js:75–77`). Un material ajeno no pasa el SELECT por empresa y responde 404. No se añadió un precheck adicional; se confía en el filtro del material y las FKs compuestas para la orden.
- PUT y DELETE restringen la asignación por orden, producto y empresa. El alias `"Cantidad" AS "Cantidad_Usada"` conserva la forma interna de la respuesta (`:98–101`, `:126–129`, `:168–172`). Los misses responden 404 antes de tocar stock. Se conserva el contrato HTTP y la validación existente.
- **Corrección de esquema necesaria:** el esquema inicial define `orden_material."Cantidad"` (`ESQUEMA_INICIAL_REPRODUCIBLE.sql:73–78`); no define `Cantidad_Usada`. PUT/DELETE ahora leen, actualizan y devuelven la columna existente con alias, sin cambiar el nombre que usa el cuerpo/ruta del backend.
- `/api/orden-material` está montada con `requireAuth` y `requireRoles('admin')` (`index.js:48`); `requireAuth` rechaza al superadmin en rutas operativas (`auth.js:108–111`). `index.js` no requirió cambios.

## Pruebas Node

Comando: `node --test BACKEND/test/orden-material-aislamiento.test.js BACKEND/test/fase-6-contexto-empresa.test.js BACKEND/test/fase-6-2-superadmin.test.js BACKEND/test/materiales-aislamiento.test.js BACKEND/test/ordenes-aislamiento.test.js`. La última ejecución terminó con **56 aprobadas, 0 fallidas, código 0**. Los tests del nuevo archivo sustituyen Express y el pool; no cargan `db.js`, `.env`, red ni procesos externos.

En una primera corrida, 55/56 pasaron y OM9 falló porque la aserción buscaba una etiqueta renderizada literalmente en vez del template dinámico que contiene la suite TX. Se ajustó únicamente la aserción de existencia para que reflejara el texto real y se repitió el comando completo: 56/56.

## Resultados PostgreSQL

Cada Q corrió en su propio clon de `texticode_migrada`, en PostgreSQL 17.10, rol `texticode_test_20261009`, `127.0.0.1:5433`. Identidad confirmada por base. Todas las ejecuciones emitieron `Qn OK`; `psql` salió con código 0. El script contiene un bloque DO por caso.

| Caso | Evidencia observada | Veredicto |
|---|---|---|
| Q1 | `Q1 OK`; un enlace visible por cada empresa, con JOIN por empresa | APROBADA |
| Q2 | `Q2 OK`; UPDATE/DELETE cruzados afectaron 0 filas; stock B antes/después igual | APROBADA |
| Q3 | `Q3 OK`; el bloque verificó SQLSTATE `23503` al usar material B con empresa A | APROBADA |
| Q4 | `Q4 OK`; el bloque verificó SQLSTATE `23503` al usar orden B con empresa A | APROBADA |
| Q5 | `Q5 OK`; `PREPARE` sin tipos ejecutó las cadenas de lectura, asignación, edición, devolución y movimientos, incluyendo búsquedas con parámetros NULL | APROBADA |
| Q6 | `Q6 OK`; consulta de control sin filtro de empresa devolvió las dos filas sintéticas | APROBADA |
| Q7 | `Q7 OK`; transacción completa dejó stock 8, una asignación y un movimiento; fallo inducido `23503` tras INSERT y UPDATE dejó los tres conteos/valores iguales al estado previo al fallo | APROBADA |

Los parámetros NULL se usaron en búsquedas y cambios sin coincidencia para comprobar inferencia de tipo; ningún SQL alcanzó `42P18`. POST rechaza valores falsy de `Cantidad_Usada`, PUT rechaza `null`, y los demás parámetros de las sentencias tienen tipo inferible por la columna comparada/asignada. No se añadió ningún cast.

## Transacciones

Las rutas POST, PUT y DELETE abren transacción antes de las lecturas/escrituras. Los retornos tempranos 404/400 dentro de la transacción hacen `ROLLBACK`; éxito hace `COMMIT`; el `catch` revierte y el `finally` libera el cliente. Referencias: POST `:36–80`, PUT `:94–156`, DELETE `:163–197`.

| Ruta | Éxito | 404/validación | Error SQL | Excepción | Liberación |
|---|---|---|---|---|---|
| POST | COMMIT | ROLLBACK | ROLLBACK | ROLLBACK | `finally`, una vez |
| PUT | COMMIT | ROLLBACK | ROLLBACK | ROLLBACK | `finally`, una vez |
| DELETE | COMMIT | ROLLBACK | ROLLBACK | ROLLBACK | `finally`, una vez |

OM7 ejercita esos cuatro caminos por ruta; OM8 verifica que un fallo al insertar el movimiento después del INSERT de asignación y el descuento no deja escrituras confirmadas, y libera una vez. GET no abre transacción.

## Concurrencia y valores de stock (solo análisis)

- **Hecho observado:** POST bloquea la fila del material con `SELECT ... FOR UPDATE`, consulta saldo y compara consumo (`orden_material.js:39–50`); el lock se conserva hasta COMMIT/ROLLBACK. PUT bloquea asignación y luego material (`:96–112`) antes de comparar delta (`:117–124`). El descuento/abono escribe con UPDATE atómico y filtro empresarial (`:61–64`, `:137–140`, `:180–183`).
- **Inferencia acotada:** para consumos positivos y un saldo inicial no negativo, dos asignaciones concurrentes al mismo material se serializan sobre la fila bloqueada; el segundo POST/PUT compara el saldo actualizado. Por ese camino no debería llevarlo bajo cero.
- **Límite observado:** el handler solo rechaza `Cantidad_Usada` falsy en POST y nula en PUT (`:30–33`, `:89–91`); no rechaza explícitamente cantidades negativas. El esquema no tiene un CHECK de saldo/cantidad en las tablas descritas. Por tanto no afirmo una garantía general de que todo estado/dato permanezca no negativo, especialmente ante otros escritores o datos preexistentes. No se cambió validación (fuera de alcance).

## Órdenes borradas y dependientes

El DELETE de órdenes sigue siendo físico (`ordenes.js:287–294`). La FK heredada de `orden_material.Id_Orden` tiene `ON DELETE CASCADE` en el esquema inicial (`ESQUEMA_INICIAL_REPRODUCIBLE.sql:73–78`) y la migración añade la FK compuesta hacia orden (`MIGRACION_FASE_3_DEFINITIVA.sql:522–524`) sin acción CASCADE explícita. **Hecho:** una asignación puede eliminarse en cascada con la fila de orden por la FK heredada. **Hecho:** cada asignación de este módulo registra `material_movimiento.Id_Orden` (`orden_material.js:66–68`), cuya FK inicial no declara CASCADE (`ESQUEMA_INICIAL_REPRODUCIBLE.sql:62–69`). **Inferencia:** una orden con movimientos referenciándola puede tener el DELETE físico rechazado por esa FK; si se elimina sin movimientos, el cascade de `orden_material` no devuelve por sí mismo el stock. No se alteró el comportamiento del DELETE ni se hizo una prueba destructiva.

## Patrón para los módulos siguientes

`orden-operario` y `usuario-orden` deben derivar empresa del contexto autenticado; incluir `Id_Empresa` en todas sus escrituras; filtrar raíces, JOINs y subconsultas por esa empresa; acotar UPDATE/DELETE y devolver 404 para filas ajenas; y mapear violaciones de FKs compuestas sin revelar nombres internos. Las FKs compuestas existentes son `fk_oo_orden_empresa` (`MIGRACION_FASE_3_DEFINITIVA.sql:527`) y `fk_uo_orden_empresa` (`:531`).

## No cubierto y estado

No se ejecutó el backend ni se hicieron solicitudes HTTP integradas; no se cubren frontend, aplicación móvil, integración externa, otras rutas de existencias, cargas concurrentes reales, versiones PostgreSQL 15/16, Supabase, staging ni producción. No se modificaron `materiales.js`, `index.js`, los routers de operarios/usuarios, la migración, rollback o seed.

Se trabajó en `codex/fase-6-contexto-empresa`, sin checkout, fetch ni push. El hash original/restaurado de `pg_hba.conf` fue `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`. El trust temporal se limitó a `texticode_test_20261009` desde `127.0.0.1/32`, con respaldo, `try/finally` y hash previo/posterior coincidente.
