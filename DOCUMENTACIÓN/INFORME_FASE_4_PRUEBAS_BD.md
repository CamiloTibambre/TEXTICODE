# Fase 4.2 — pruebas negativas en PostgreSQL local

## Alcance y método

**HECHOS OBSERVADOS.** Trabajo en `codex/seguridad-escalon-1`. El clúster temporal `%TEMP%\texticode_pg17_20261009\data` estaba activo y `pg_ctl status` informó PID 24184. El listener comprobado era `127.0.0.1:5433` y su PID coincidía. No se usó el puerto 5432.

El archivo de log no contenía el nombre `texticode_test_20261009` entre las líneas consultadas (coincidencias: 0). Se usó el rol que el usuario identificó expresamente como el valor de `initdb -U`; no se dedujo a partir de un intento fallido. La identidad SQL confirmó `texticode_baseline2 | texticode_test_20261009 | 127.0.0.1/32 | 5433`; versión del servidor: PostgreSQL 17.10.

Para recuperar acceso se guardó una copia de `pg_hba.conf` dentro del clúster, SHA-256 original `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`. Se añadió temporalmente una regla `trust` limitada al rol indicado y a `127.0.0.1/32`, se cambió su contraseña por un valor aleatorio solo en memoria y se restauró `pg_hba.conf` en `finally`. Las verificaciones repetidas dieron el mismo hash original; las reglas activas volvieron a `scram-sha-256`, sin reglas `trust`. La contraseña no se imprimió ni guardó en archivo y se quitó de la variable de entorno al terminar las sesiones. No se borraron el clúster ni las copias de seguridad de `pg_hba.conf`.

## Preparación y resultados

Se creó `texticode_migrada` como clon de `texticode_baseline2`, se aplicó `DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql` y se cargaron filas sintéticas para las empresas QA A y B. Se conservaron clones independientes `texticode_f42_b1` a `texticode_f42_b7`. Cada ejecución SQL se hizo después de comprobar base, rol y endpoint.

| Prueba | Hecho observado y veredicto |
|---|---|
| B1 — cambiar de empresa un material referenciado por una orden | Rechazado; SQLSTATE `23503`, `fk_op_material_empresa`. **Pasa.** |
| B2 — orden-material B que referencia material A | Rechazado; `23503`, `fk_om_producto_empresa`. **Pasa.** |
| B3 — borrar empresa A con filas operativas | Rechazado; `23503`, `fk_material_empresa`. Tras el fallo se conservaron configuración, 3 membresías y material (`1|3|1`). **Pasa.** Un control separado borró una empresa sintética vacía y observó la cascada de configuración y membresías (`0|0|1`, fila final = usuario conservado). |
| B4 — cruces orden-material-movimiento | Tres operaciones de cruce fueron rechazadas: `fk_op_material_empresa`, `fk_material_movimiento_orden_empresa` y `fk_material_movimiento_material_empresa`; SQLSTATE `23503` en las líneas ERROR del log. **Pasa.** |
| B5 — usuario miembro solo de A asignado a orden B | UPDATE de `orden_operario` rechazado por `fk_oo_operario_empresa`, y INSERT de `usuario_orden` rechazado por `fk_uo_usuario_empresa`; `23503`. **Pasa.** |
| B6 — `SELECT * FROM material` sin filtro | La consulta terminó correctamente; conteos sintéticos A/B: `1|1`. `relrowsecurity=f`, `relforcerowsecurity=f`. **La tabla no tiene RLS habilitado en esta instancia.** El rol de prueba es el superusuario de `initdb`; el resultado no acredita permisos ni comportamiento de un rol de aplicación. |
| B7 — tablas sin empresa / enlaces globales | El inventario encontró `rol`, `tokens_recuperacion`, `usuario` sin `Id_Empresa`. Un usuario sintético enlaza mediante membresías con materiales de A y B (`2|2`). **Hecho observado; el alcance funcional global queda por decidir.** |

Hubo reintentos de captura para B1/B2/B4/B5 por errores del arnés de salida; las sentencias originales de rechazo quedaron registradas en `postgres.log`. En un reintento adicional de B4, una sentencia mal formada por el arnés obtuvo `42601`; no se considera resultado de prueba de la migración ni cambió datos. Los veredictos B4 anteriores se basan en los tres intentos válidos registrados en el log.

## A5 — escritura desde rutas del backend

**HECHO OBSERVADO POR LECTURA ESTÁTICA; backend no ejecutado.** La migración agrega `Id_Empresa` a nueve tablas como columna `INTEGER`, sin `DEFAULT` (`DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql:147-155`); luego las convierte en `NOT NULL` (`:460-485`). No hay triggers en esa migración que completen la empresa.

Los INSERT activos consultados omiten `Id_Empresa`: material y movimientos (`BACKEND/routes/materiales.js:139,158`), órdenes (`routes/ordenes.js:192`), consumos y movimientos (`routes/orden_material.js:51,60`), asignaciones (`routes/orden_operario.js:114`), usuario-orden (`routes/usuario_orden.js:45`), comprobantes (`routes/comprobantes.js:110`) y observaciones (`routes/eficiencia.js:331`). Esos INSERT no satisfacen por sí mismos la columna `NOT NULL`; por el SQL leído, fallarían si no hay otra capa que la añada. La lectura estática no prueba solicitudes HTTP ni todas las rutas de actualización. Los UPDATE leídos suelen operar por ID y no filtran por empresa, por lo que la base no los convierte en consultas aisladas.

El upsert de Google Calendar (`BACKEND/routes/googleCalendar.js:156-161`) también omite `Id_Empresa` y usa `ON CONFLICT ("Id_Usuario")`; la migración sustituye la PK por `("Id_Usuario", "Id_Empresa")` (`DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql:532-535`). Es incompatible con el conflicto declarado una vez aplicada esa clave compuesta, salvo que otra restricción única equivalente exista.

## Límites y cobertura pendiente

Datos sintéticos pequeños y secuencias desfasadas de la fixture limitaron su representatividad; se observó y propuso corregir la fixture, pero el cambio no se aplicó. Los tests fueron por grupo de prechecks/relaciones y no por cada condición individual. Solo se probó PostgreSQL 17.10; no se verificó PostgreSQL 15/16 ni una instancia Supabase. Los resultados no prueban aislamiento por actor ni aprobación para entornos compartidos.

Fase 4 no cubre aislamiento por actor ni rutas del backend sin contexto empresarial: Fases 4 y 6. Rollback y recuperación: Fase 5. Integraciones y regresión: Fases 8 y 9. Datos reales y versión de Supabase: Fase 11.

La revisión de Fase 4.1 sigue siendo pertinente: A1 observó `pg`/`Pool` con `DATABASE_URL` configurable y SSL requerido en `BACKEND/db.js`/`config/env.js`; no se leyó `.env`. A2 observó que la selección de empresa se valida al emitir JWT, pero el middleware de autenticación no revalida membresía en cada solicitud. A3 clasificó las rutas empresariales como sin aislamiento probado: consultas por ID sin filtro derivado de `req.auth.empresaId`. A4 encontró `rol`, `usuario` y `tokens_recuperacion` sin empresa; su alcance funcional debe decidirse. Ninguna de esas observaciones constituye prueba de runtime.

## Fuera de alcance y condiciones para compartir

No se ejecutaron backend, npm ni pruebas Node; no se leyó `.env`. No se ejecutaron rollback ni `DATABASE/FASE_3.sql`; no se tocó 5432, no se borraron clúster ni clones, y no se hizo push, fetch o checkout. No se modificó archivo existente.

Antes de cualquier entorno compartido se requiere: respaldo `pg_dump` previo y verificado, revisión independiente del SQL, confirmación de versión del servidor destino, ejecución de prechecks de solo lectura sobre los datos reales y autorización específica. La migración y el rollback no quedan aprobados para staging, Supabase ni producción.
