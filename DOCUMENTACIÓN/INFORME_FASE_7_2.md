# Fase 7.2 — Aislamiento del módulo de órdenes

## Alcance y resultado

Se modificó únicamente `BACKEND/routes/ordenes.js` para derivar la empresa de `req.auth.empresaId` en lecturas, cambios y creación de órdenes. Los ensayos sintéticos O1–O8 y Q1–Q6 pasaron. Esto es evidencia del router bajo pruebas con dobles y de SQL en PostgreSQL desechable; **no declara aprobada la aplicación ni el despliegue en un entorno compartido**.

## Cambios y evidencia del router

- `actualizarOrdenesRetrasadas(empresaId)` limita el UPDATE a la empresa recibida (líneas 8–16). Todas sus llamadas desde rutas pasan la empresa del contexto autenticado.
- Los cuatro listados y la lectura por ID filtran `orden_produccion.Id_Empresa`; los JOIN con `material` y las subconsultas de `orden_operario`/`usuario_orden` enlazan por empresa (líneas 27–166). Un ID de orden de otra empresa queda como inexistente en GET por ID (404, línea 122).
- POST incorpora `Id_Empresa` al INSERT desde el token (líneas 179–215). PUT y DELETE agregan empresa al predicado de fila (líneas 234–295); sin coincidencia responden 404.
- Los comentarios de POST y PUT especifican que se ignoran valores de empresa enviados por el cliente (líneas 182–183 y 233–234). La respuesta genérica 400 para FK `23503` no expone nombres de restricciones (líneas 218–220 y 279–281).
- Se conservó la eliminación física existente. El router no abre transacciones; O7 quedó documentada como no aplicable (prueba estática).
- No fue necesario cambiar `index.js`: `/api/ordenes` ya se monta con `requireAuth` (lectura previa del backend).

## Pruebas de código y SQL

`node --test BACKEND/test/ordenes-aislamiento.test.js BACKEND/test/materiales-aislamiento.test.js BACKEND/test/fase-6-contexto-empresa.test.js BACKEND/test/fase-6-2-superadmin.test.js` terminó con **47 aprobadas, 0 fallidas, código 0**. Los tests sustituyen Express, el pool y middleware al importar los routers; no levantan backend ni conexiones.

Las consultas se ejecutaron con el archivo `DATABASE/PRUEBAS_SQL_ORDENES_7_2.sql`, en clones distintos de `texticode_migrada`, todos verificados como PostgreSQL 17.10, rol `texticode_test_20261009`, `127.0.0.1:5433`:

| Caso | Evidencia/verificación | Resultado final |
|---|---|---|
| Q1 | `Q1 OK`; una orden sintética por empresa en el filtro respectivo | APROBADA |
| Q2 | `Q2 OK`; GET cruzado vacío; UPDATE de estado y DELETE cruzados con 0 filas | APROBADA |
| Q3 | `Q3 OK`; inserción con cliente de B y empresa A capturó FK `23503` | APROBADA |
| Q4 | `Q4 OK`; inserción con operario de B y empresa A capturó FK `23503` | APROBADA |
| Q5 | `Q5 OK`; INSERT con empresa A y UPDATE con predicado de empresa afectó 1 fila | APROBADA |
| Q6 | `Q6 OK`; consulta de control sin predicado empresarial vio ambas órdenes sintéticas | APROBADA |

La primera versión del control Q6 contó también datos preexistentes del clon y falló por esperar un total global de dos. Se corrigió para contar las dos órdenes sintéticas sin filtrar por empresa, y se repitió Q1–Q6 con seis bloques DO separados: todos emitieron `Qn OK` y `psql` terminó con código 0. Los cambios y fixtures de SQL se revierten al final de cada ejecución.

## Parámetros NULL sin tipos declarados

Se ejecutaron `PREPARE` sin lista de tipos y `EXECUTE` con NULL en PostgreSQL 17.10; `psql` código 0. No apareció `42P18`:

- Órdenes POST: `$3` (operario) y `$4` (producto), nulos opcionales con tipo inferido por las columnas destino (`ordenes.js:203–214`).
- Órdenes PUT: `$3`, `$4`, `$10` y `$11` se probaron como NULL; el contexto de asignación/`COALESCE` infirió tipos (`ordenes.js:246–275`). En parámetros de campos requeridos que se omitan, `pg` puede convertir `undefined` a NULL; sus asignaciones también tienen contexto de columna, aunque sus efectos de validación no se probaron aquí.
- Materiales (solo lectura): `$7` `Id_Cliente` se probó como NULL en INSERT y UPDATE; se infirió como el tipo de la columna (`materiales.js:143–154`, `206–223`). Los demás valores omitidos del PUT no fueron cubiertos por ese EXECUTE.

## Eliminación y restricciones observadas

El handler continúa ejecutando DELETE físico con filtro por ID y empresa (`ordenes.js:291–300`). En el catálogo del clon Q6 se observaron FKs heredadas `ON DELETE CASCADE` desde `orden_material`, `orden_operario`, `usuario_orden`, `comprobantes` y `observacion_operario`. La FK heredada `material_movimiento_Id_Orden_fkey` tiene acción `NO ACTION`. Las FKs compuestas nuevas hacia orden (`fk_material_movimiento_orden_empresa`, `fk_om_orden_empresa`, `fk_oo_orden_empresa`, `fk_uo_orden_empresa`, `fk_comp_orden_empresa`, `fk_obs_orden_empresa`) también aparecen `NO ACTION` por omisión en el catálogo; sus definiciones están en `MIGRACION_FASE_3_DEFINITIVA.sql:518–541`. La consulta de catálogo es evidencia de las acciones declaradas; no se hizo una prueba de borrado con cada tipo de dependiente. En particular, la referencia de `material_movimiento` puede impedir borrar una orden que tenga movimientos; el handler conserva su respuesta de error existente.

## Contexto de autenticación e integraciones observado

`index.js:54–55` monta `/api/google` y `/api/calendar`; no se cambió.

- Google: `/auth-url` y `/callback` no tienen `requireAuth` en el registro de ruta (`googleCalendar.js:198,229`); el callback implementa el flujo OAuth. `/status`, `/unlink`, `/settings`, `/sync/delivery-events`, `/events/upcoming`, `/connected-users` y `/unlink-user/:idUsuario` sí declaran `requireAuth`; las dos últimas rutas de administración también exigen rol admin (`:293,317,322,507,529,566,581`).
- Calendar: `/status`, `/connect` POST/DELETE, `/sync` y `/sync/:idOrden` declaran `requireAuth` (`calendar.route.js:18,29,46,53,80`). Esta revisión confirma middleware en las rutas; no probó llamadas externas ni el aislamiento de sus efectos.

## Patrón para el siguiente módulo

Para `orden-material`, obtener empresa solo de `req.auth.empresaId`; acotar tanto el UPDATE/DELETE del recurso raíz como cada lectura, JOIN, subconsulta y escritura de dependientes; enlazar orden y material por ID más `Id_Empresa`; traducir `23503` sin revelar nombres internos; tratar un recurso ajeno como 404. No confiar en `Id_Empresa` recibido en body/query/params. La migración define `fk_om_orden_empresa` y `fk_om_producto_empresa` (`:522–524`), por lo que el backend debe enviar la empresa en ambas referencias.

## Límites

- La validación SQL se hizo en clones locales pequeños con PostgreSQL 17.10, no en Supabase, staging, producción ni con datos reales. La versión 15/16 y la versión de destino no se verificaron.
- Las pruebas Node son unitarias con dobles; no cubren una solicitud HTTP integrada ni las integraciones Google/Calendar.
- Q1–Q6 son datos sintéticos y verifican las consultas del ensayo, no todos los caminos del backend ni cargas concurrentes.
- No cubre ni modifica `orden-material`, `orden-operario`, `usuario-orden`, `comprobantes`, eficiencia, frontend, app móvil ni el backend en ejecución.
- No se cambió `materiales.js`, la migración ni el rollback. No se ejecutó el backend.
