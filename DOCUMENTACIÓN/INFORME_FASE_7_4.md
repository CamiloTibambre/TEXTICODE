# Fase 7.4 — orden-operario y usuario-orden

## Estado y alcance

HECHO OBSERVADO: se añadieron filtros de empresa y escrituras con `Id_Empresa` derivada de `req.auth.empresaId` en `BACKEND/routes/orden_operario.js` y `BACKEND/routes/usuario_orden.js`. No se declara aprobado el aislamiento ni los módulos. Q7 falla contra el esquema reproducible. La Fase 7.4 queda validada parcialmente en clones desechables; no es aprobación para entornos compartidos.

HECHO OBSERVADO: superadmin recibe 403 en el middleware operativo de `BACKEND/middleware/auth.js:110-111`; ambas rutas siguen montadas tras `requireAuth` en `BACKEND/index.js:46-47`. No se modificaron esos archivos.

## Revisión estática del punto 0

### a) `Cantidad_Usada`

HECHO OBSERVADO: `git log --all --oneline -S 'Cantidad_Usada' -- 'BACKEND/routes/*.js'` encuentra `7c8ff43`, `d2c0627` y `3d97763`; el uso ya está en el código de `7c8ff43` y fue eliminado del SQL de orden-material por `3d97763` (usa `orden_material."Cantidad"`). `rg` en `DATABASE/ESQUEMA_INICIAL_REPRODUCIBLE.sql` y `DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql` no encuentra una definición de `Cantidad_Usada`.

### b) Columnas y tablas que no aparecen en los dos esquemas revisados

HECHO OBSERVADO: se examinaron 21 archivos JavaScript de `BACKEND/routes/` y `BACKEND/services/`, comparando referencias SQL calificadas, columnas de `INSERT` y `UPDATE` con la estructura de ambos SQL. Estos hallazgos son COLUMNA INEXISTENTE con alta confianza en ese esquema; no se corrigieron fuera de los dos routers autorizados.

| Archivo: línea | Referencia inexistente |
|---|---|
| `BACKEND/routes/calendar.route.js:68` | `google_calendar_tokens.Last_Sync_At` |
| `BACKEND/routes/carga_trabajo.js:61,226` | `orden_operario.Descripcion_Fase` |
| `BACKEND/routes/eficiencia.js:17` | `orden_operario.Cantidad_Realizada` |
| `BACKEND/routes/googleCalendar.js:143,158` | `google_calendar_tokens.Token_Type` |
| `BACKEND/routes/googleCalendar.js:158` | `google_calendar_tokens.Calendar_Id`, `.Sync_Enabled`, `.Last_Login_Google` |
| `BACKEND/routes/googleCalendar.js:328` | `google_calendar_tokens.Sync_Enabled`, `.Calendar_Id` |
| `BACKEND/routes/googleCalendar.js:519` | `google_calendar_tokens.Last_Sync_At` |
| `BACKEND/routes/googleCalendar.js:571-572` | `google_calendar_tokens.Sync_Enabled`, `.Last_Login_Google`, `.Last_Sync_At` |
| `BACKEND/routes/orden_operario.js:118,296` | `orden_operario.Descripcion_Fase` |
| `BACKEND/routes/orden_operario.js:226` | `orden_operario.Fecha_Completada`, `.updated_at` |
| `BACKEND/routes/orden_operario.js:397,400` | `orden_operario.Cantidad_Realizada`, `.Fecha_Completada` |
| `BACKEND/routes/practica.routes.js:45` | `orden_material.Cantidad_Usada` |
| `BACKEND/routes/usuario_orden.js:49` | `usuario_orden.Funcion` |
| `BACKEND/services/rendimiento.js:47,50-51` | `orden_operario.Fecha_Completada`, `.Cantidad_Realizada` |

HECHO OBSERVADO: el inventario estático no encontró una tabla referenciada en estas consultas que falte de ambos esquemas. POSIBLE: SQL dinámico, concatenado o referencias indirectas no inferibles por el barrido estático no se pueden certificar como completos mediante esta comparación.

### c) Interpretación

HECHO OBSERVADO: el esquema reproducible declara que representa la estructura pre-migración existente y varias referencias del backend no aparecen en él; además, Q7 confirmó una ausencia en ejecución (`Descripcion_Fase`).

SUPOSICIÓN: esto es compatible con defectos preexistentes del código, con diferencias entre el esquema reproducible y el real, o con ambas causas. Sin consultar el esquema real de producción no se puede distinguir entre ellas.

## Cambios y reglas aplicadas

- Las lecturas de `orden_operario` y `usuario_orden` filtran `Id_Empresa` desde `req.auth.empresaId`; las tablas empresariales unidas se enlazan o filtran por el mismo tenant. Para `usuario`, que es global y no tiene `Id_Empresa` en los esquemas, se usa `usuario_empresa` para acotar su membresía a la empresa de la fila.
- Los dos `INSERT` incluyen `Id_Empresa` del token. Los errores de FK compuesta `23503` se traducen a 400 genérico; los duplicados conservan 409. El body/query/params con empresa se ignora.
- PUT/DELETE de `orden_operario` y DELETE de `usuario_orden` incluyen empresa; fila ausente o ajena devuelve 404.
- La ruta de completar fase conserva validación de pertenencia del operario y acota todas sus lecturas/escrituras al tenant.
- `orden_operario.js:8-31` envía correo al completar una orden; la consulta ahora queda acotada por empresa. Se reporta la integración, no se modifica el servicio de correo. No hay notificación/calendario en `usuario_orden.js`.
- Fuera de alcance: diferencias de esquema en rutas/services ajenos, reglas de estado de membresía, autenticación y módulos posteriores.

## Pruebas Node

HECHO OBSERVADO: se ejecutó únicamente la siguiente orden desde `BACKEND`; las importaciones de los dos nuevos tests sustituyen Express, base de datos y middleware por dobles. El resultado literal completo:

`node --test test/fase-6-contexto-empresa.test.js test/fase-6-2-superadmin.test.js test/materiales-aislamiento.test.js test/ordenes-aislamiento.test.js test/orden-material-aislamiento.test.js test/orden-operario-aislamiento.test.js test/usuario-orden-aislamiento.test.js`

```text
✔ preparación usa dobles en memoria y no importa env.js, db.js ni procesos externos (0.9022ms)
✔ S1: superadmin global sin membresía obtiene token sin empresa (1.4768ms)
✔ S2: superadmin consultado en BD recibe 403 en requireAuth operativo (0.3635ms)
✔ S3: admin de empresa recibe 403 en requireSuperadmin (0.4263ms)
✔ S4: falta de token recibe 401 en requireSuperadmin (0.1384ms)
✔ S5: claim superadmin con rol distinto en BD recibe 403 (0.2408ms)
✔ S6: crea empresa, configuración, admin y membresía en transacción; no devuelve hash (2.3059ms)
✔ S7: error a mitad de creación ejecuta rollback y no conserva filas simuladas (0.4119ms)
✔ S8: nombre duplicado y slug duplicado responden 409 (0.8217ms)
✔ S9: baja de empresa con datos es desactivación y no DELETE físico (0.543ms)
✔ S10: admin no puede asignar rol superadmin por /api/usuarios (0.5114ms)
✔ S11: no superadmin no puede gestionar rol superadmin ni modificar ese usuario (0.6027ms)
✔ prepara módulos con dobles: no importa env.js, db.js ni módulos externos de red (17.881ms)
✔ P1: login deriva la empresa única e ignora la empresa del cliente; select-empresa queda deprecado e ignora su empresa (1.4986ms)
✔ P2: login sin membresía activa responde HTTP 403 (0.1467ms)
✔ P3: login con membresía inactiva responde HTTP 403 (0.1804ms)
✔ P4: requireAuth devuelve 403 si se desactiva la membresía después de emitir el token (0.3176ms)
✔ P5: requireAuth devuelve 403 si la empresa del token no coincide con la membresía (0.1331ms)
✔ P6: requireAuth conserva empresaId del token aunque body, query y params indiquen otra (0.1478ms)
✔ P7: token ausente, vencido e con firma inválida mantienen rechazo HTTP 401 (0.3355ms)
✔ P8: usuario inactivo sigue en 403 y un rol distinto conserva el rol del token como antes (0.3145ms)
✔ preparación aislada: reemplaza express/db/roles y no importa env.js, db.js ni procesos externos (1.2056ms)
✔ M1 y M7: listado filtra con empresa del token e ignora empresa cliente (0.9639ms)
✔ M2: material de otra empresa se comporta como inexistente (404) (0.3992ms)
✔ M3/M4: INSERT usa empresa del token; duplicado da 409 y nombre disponible da 201 (0.4753ms)
✔ M5: PUT y DELETE de id ajeno devuelven 404 sin ejecutar cambios (0.3236ms)
✔ M6: lecturas e inserts de movimientos incluyen empresa del token (0.2135ms)
✔ M8: las suites de regresión existentes contienen P1–P8 y S1–S11 (5.4624ms)
✔ TX POST éxito: confirma transacción y libera una vez (0.3644ms)
✔ TX POST error SQL: revierte y libera una vez (0.1935ms)
✔ TX POST excepción: revierte y libera una vez (0.1907ms)
✔ TX PUT éxito: confirma transacción y libera una vez (0.0823ms)
✔ TX PUT 404: revierte y libera una vez (0.1387ms)
✔ TX PUT error SQL: revierte y libera una vez (0.1095ms)
✔ TX PUT excepción: revierte y libera una vez (0.0868ms)
✔ TX DELETE éxito: confirma transacción y libera una vez (0.0886ms)
✔ TX DELETE 404: revierte y libera una vez (0.0421ms)
✔ TX DELETE error SQL: revierte y libera una vez (0.1227ms)
✔ TX DELETE excepción: revierte y libera una vez (0.0505ms)
✔ preparación aislada: router usa dobles y no importa db/env ni procesos externos (0.6368ms)
✔ OM1/OM6: listado enlaza material por empresa e ignora empresa del cliente (0.8047ms)
✔ OM2: material ajeno es 404; orden ajena falla con 400 y la transacción no confirma escrituras (2.1571ms)
✔ OM3: POST incluye empresa del token en orden_material y material_movimiento (0.3201ms)
✔ OM4: cada UPDATE de stock acota Id_Material e Id_Empresa (1.6897ms)
✔ OM5: editar y quitar asignación ajena devuelven 404 sin mutar stock (0.5927ms)
✔ OM8: error al insertar movimiento revierte asignación y descuento anteriores (0.3382ms)
✔ OM7: cada ruta transaccional libera una vez y confirma/revierte según camino (1.0894ms)
✔ OM9: suites de regresión previas incluyen P, S, M, TX y O (6.7618ms)
✔ OP aislamiento: carga router con dependencias sustituidas y sin db/env/procesos (0.5317ms)
✔ OP1/OP5: listados toman empresa del token y parametrizan filtros (0.4119ms)
✔ OP3: POST inserta Id_Empresa del token; OP2 mapea FK ajena a 400 sin escribir progreso (0.5077ms)
✔ OP4: editar y quitar ajeno devuelven 404 sin mutación (0.3621ms)
✔ OP6: cada ruta transaccional confirma éxito y revierte 404/error, libera una vez (1.4127ms)
✔ preparación aislada: sustituye express/db/roles y registra las rutas sin importar env ni procesos (0.7181ms)
✔ O1: los listados y la actualización de retrasadas usan empresa del token (1.19ms)
✔ O2: una orden de otra empresa devuelve 404 en GET/PUT/DELETE (0.4981ms)
✔ O3/O6: INSERT toma Id_Empresa del token e ignora valores falsificados del cliente (13.1392ms)
✔ O4: violación de FK compuesta devuelve 400 sin exponer nombre de restricción (0.4478ms)
✔ O5: PUT incluye empresa en UPDATE, incluido el cambio de Estado (0.3258ms)
✔ O7: el router órdenes no abre transacciones ni usa connect() (4.2945ms)
✔ O8: suites previas cubren P1–P8, S1–S11 y M1–M8 (1.3977ms)
✔ UO aislamiento: importa con mocks y registra rutas sin conectar ni ejecutar procesos (2.0652ms)
✔ UO1/UO5: listados filtran con empresa del token e ignoran empresa del cliente (0.5219ms)
✔ UO3/UO2: POST deriva empresa del token y asignación cruzada devuelve error claro (0.3112ms)
✔ UO4: DELETE ajeno usa tenant y devuelve 404 sin mutación (0.1471ms)
ℹ tests 65
ℹ suites 0
ℹ pass 65
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 776.6912
```

HECHO OBSERVADO: Node no ejecutó el backend, no importó `.env` y los tests nuevos usaron mocks. Resultado: 65 aprobados, 0 fallidos, código 0.

## Pruebas PostgreSQL

HECHO OBSERVADO: PostgreSQL 17.10 respondió en `127.0.0.1:5433`; cada Q corrió en su propio clon `texticode_74_q1` … `texticode_74_q8` de `texticode_migrada`. Identidad antes de cada caso: `current_database() | inet_server_addr() | inet_server_port() | current_user` → `texticode_74_qN | 127.0.0.1/32 | 5433 | texticode_test_20261009`. Se usó `psql -v ON_ERROR_STOP=1 -v VERBOSITY=verbose -f -`. Fixtures sintéticos, sin tocar la base plantilla.

| Caso | Evidencia literal / resultado | Veredicto |
|---|---|---|
| Q1 | `Q1 OK`; conteo 1 para lista de A y 1 para B | APROBADA |
| Q2 | `Q2 OK`; UPDATE 0 filas y DELETE 0 filas al filtrar B con empresa A | APROBADA |
| Q3 | `Q3 OK`; FK compuesta rechaza operario de B con empresa A, SQLSTATE 23503 | APROBADA |
| Q4 | `Q4 OK`; FK compuesta rechaza orden de B con empresa A, SQLSTATE 23503 | APROBADA |
| Q5 | `Q5 OK`; FK compuesta rechaza usuario de B con empresa A, SQLSTATE 23503 | APROBADA |
| Q6 | `Q6 OK: membership inactive accepted`; INSERT afectó 1 fila | APROBADA como observación; BRECHA de estado activo |
| Q7 | psql exit 3: `ERROR: 42703: no existe la columna «Descripcion_Fase» en la relación «orden_operario»`; línea 1 del PREPARE de INSERT. No se emitió `Q7 OK`. | FALLIDA |
| Q8 | `Q8 OK: count 2`; consulta sin filtro empresarial devolvió filas de ambas empresas | APROBADA |

Q1 evidencia psql: `NOTICE: 00000: Q1 OK`; Q2–Q5 igualmente emitieron su `NOTICE ... Qn OK`. Q6 emitió `NOTICE: 00000: Q6 OK: membership inactive accepted`. Q8 emitió `NOTICE: 00000: Q8 OK: count 2`. El test está en `DATABASE/PRUEBAS_SQL_ORDEN_OPERARIO_7_4.sql`.

HECHO OBSERVADO: `usuario_empresa.Estado` acepta `'inactivo'`; las FKs compuestas exigen que exista la fila de membresía, pero no verifican su estado. Q6 probó que la asociación usuario-orden se inserta con membresía inactiva. La migración B-13 describe el precheck para el estado de las filas históricas, no un trigger para escrituras posteriores.

## Transacciones

| Ruta | Éxito | 404/validación | Error SQL/excepción | Liberación |
|---|---|---|---|---|
| `orden_operario` POST | COMMIT | validación ocurre antes de abrir conexión; FK -> ROLLBACK | ROLLBACK | `finally` |
| `orden_operario` PUT | COMMIT | sin fila -> ROLLBACK | ROLLBACK | `finally` |
| `orden_operario` DELETE | COMMIT | sin fila -> ROLLBACK | ROLLBACK | `finally` |
| `orden_operario` PATCH completar | COMMIT | sin fila / permiso -> ROLLBACK | ROLLBACK | `finally` |
| `usuario_orden` GET/POST/DELETE | no abre transacción | respuesta directa | manejador de error | no usa cliente dedicado |

HECHO OBSERVADO: las pruebas de mocks verificaron POST/PUT/DELETE/PATCH de orden-operario en éxito, 404 y error inyectado, con liberación una vez. La ejecución de `pool.connect()` se hace antes del `try`; si la adquisición de conexión falla, no se inicia transacción ni existe cliente que liberar. El comportamiento ante caída de conexión que impida `ROLLBACK` no fue probado. No se afirma verificación de cada excepción posible.

## Para comprobantes y eficiencia; límites

- Mantener empresa exclusivamente desde `req.auth.empresaId`; filtrar cada tabla empresarial y cada join empresarial; relacionar usuarios globales por `usuario_empresa`; incluir `Id_Empresa` en INSERT; mapear FK compuesta a error claro sin filtrar nombres de constraints; responder 404 en recursos ajenos.
- Revisar las columnas del esquema antes de ejecutar SQL: el barrido encontró, entre otros, campos ausentes en rutas de eficiencia y calendario. El siguiente paso no debe inferir que esta fase validó esos módulos.
- No cubre membresía inactiva como regla de autorización para asignaciones, esquema real/Supabase, rendimiento/concurrencia, pruebas de integración HTTP, correo entregado, módulos de comprobantes/eficiencia ni aprobación compartida.

## Estado de trabajo

- Rama: `codex/fase-6-contexto-empresa`.
- `pg_hba.conf` SHA-256 antes: `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`.
- `pg_hba.conf` SHA-256 tras restauración: `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`.
- Clones temporales conservados para fases posteriores.
- No se ejecutó el backend ni npm; sí se ejecutaron los casos SQL expresamente autorizados sobre clones. No se leyó `.env`; no se usó el puerto 5432; no hubo push, fetch ni cambio de rama; no se modificaron migración, rollback ni seed; no se borró el clúster ni los clones.
- Archivo leído fuera de la lista del repositorio: `BACKEND/package.json`, consultado para identificar la ubicación/nombre del conjunto de tests. No se modificó.
