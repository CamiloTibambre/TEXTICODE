# Cierre de Fase 3 — migración multiempresa

## Alcance y estado

**Validada en base desechable; NO aprobada para Supabase, staging ni producción.** La evidencia de cierre resume los informes de las rondas 4B y 4C y el SQL definitivo. No constituye aprobación del rollback.

## Artefacto

- `DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql` — 33.034 bytes; SHA-256 `2A7BF9BF06FD241CD4CB0A526ABE237CFC8E9F479B5D5B6225E71D32FCB08B88` (Get-FileHash -Algorithm SHA256).
- Construido a partir de `DOCUMENTACIÓN/BORRADOR_SQL_MULTIEMPRESA_REVISION_4.sql` (estructura y restricciones) y `DATABASE/MIGRACION_FASE_3_EJECUTABLE.sql` (invariantes B-01..B-18), según la revisión registrada para 4C.

## Entorno y método

PostgreSQL 17.10, loopback `127.0.0.1:5433`. El clúster desechable está separado del servicio habitual: el puerto 5433, la dirección loopback explícita y las reglas locales `scram-sha-256` delimitan la conexión; se usó una base clonada y sintética. Identidad comprobada mediante `SELECT current_database(), current_user, inet_server_addr(), inet_server_port();`; se rechazaba continuar si no correspondía a la base/usuario de prueba, `127.0.0.1` y `5433`. Se conservaron la base de referencia y los clones.

## Resultados de la ronda 4C

| ID | Veredicto observado | SQLSTATE / huella |
|---|---|---|
| A-1 | Pasa: migración completa; 9/9 tablas operativas con `Id_Empresa` no nulo; conteos de las 12 tablas preservados y hashes de datos de columnas originales iguales. | Éxito; huellas iguales. |
| A-2 | Pasa: material, cliente y operario de otra empresa rechazados. | `23503`, FK compuesta prevista. |
| A-3 | Pasa: mismo nombre de material en empresas distintas permitido; duplicado en la misma empresa rechazado. | Aceptación; `23505`, `material_empresa_nombre_unique`. |
| A-4 | Corrección 4C pasa: prechecks abortan antes de mutar; huellas antes/después idénticas. En 4B, un huérfano hizo fallar la migración tras tres `COMMIT`, dejando cambios parciales (tres tablas y nueve columnas `Id_Empresa`); se corrigió al poner prechecks y DDL dentro de una transacción atómica. | 4B: `23503`, `fk_material_movimiento_material_empresa`, cambio parcial. 4C: `P0001` y huellas idénticas. En 4C se cubrieron 11 grupos de prechecks; un caso por grupo, no cada predicado. |
| A-5 | Pasa como rechazo esperado de repetición; la migración no es idempotente. | `P0001`; detectó 12 objetos existentes; huellas idénticas. |
| A-6 | Pasa: inserts con secuencias por defecto generaron IDs siguientes (material 6, orden 4). | Éxito. |
| B-1 | Pasa: seis relaciones cruzadas en tablas dependientes fueron rechazadas. | `23503`, FKs compuestas previstas en `orden_material`, `usuario_orden`, `orden_operario`, `comprobantes`, `observacion_operario` y `material_movimiento`. |

Las huellas de A-4/A-5 compararon columnas, restricciones, índices, conteos y hashes de datos. A-4c rechazó un segundo principal con `23505` (`usuario_empresa_principal_unique`). La ronda 4B había verificado A-1/A-2/A-3/B-1; A-4 de esa ronda reveló el defecto parcial que se corrigió en 4C.

## Invariantes incluidas (B-01..B-18)

- **B-01:** `Id_Empresa` no nulo en las nueve tablas operativas.
- **B-02..B-05:** orden con material, cliente y operario de su empresa; material con cliente de su empresa.
- **B-06..B-08:** movimiento con material y orden de la empresa y consistencia entre ambos.
- **B-09..B-11:** `orden_material` con orden e insumo de la misma empresa y relación coherente.
- **B-12..B-13:** `orden_operario` con orden de la empresa y operario con membresía activa.
- **B-14..B-15:** `usuario_orden` con orden de la empresa y usuario perteneciente a ella.
- **B-16:** comprobante con orden y usuario pertenecientes a la empresa.
- **B-17:** observaciones coherentes con orden, empresa y membresías activas de administrador/operario.
- **B-18:** tokens de Calendar alineados con la membresía principal activa única del usuario.

El SQL añade prechecks propios antes de alterar el esquema: catálogo limpio; rol/respaldo válido; huérfanos, duplicados de material o membresías no activas/inexistentes relacionados con las filas existentes de usuario, material, orden, movimientos, tablas dependientes, observaciones y tokens. Están agrupados por tabla/objeto y se probaron por grupo.

## Limitaciones y supuestos

- Validación en PostgreSQL 17.10; no verificada en PostgreSQL 15 ni 16.
- Migración de ejecución única: la repetición se rechaza sin cambios.
- Los prechecks se probaron por grupo, no por cada condición individual.
- El fixture tenía diez secuencias desfasadas; se alinearon para esta prueba. Se propuso añadir `setval` tras insertar el fixture, pero ese cambio no se aplicó a los artefactos de migración.
- Datos sintéticos y pequeños; no son representativos de datos reales.
- Test Node: `node --test BACKEND\test\migration-validation.test.js`; 5 pasaron, 0 fallaron. El archivo leído completo usa solo `node:test`, `node:assert/strict` y un simulador en memoria; no lee `.env`, no hace red ni conexiones de base de datos, ni inicia procesos externos.

## Fuera de alcance

- Aislamiento por actor y rutas backend sin contexto empresarial: Fases 4 y 6.
- Rollback y recuperación: Fase 5.
- Integraciones y regresión: Fases 8 y 9.
- Datos reales y versión de Supabase: Fase 11.

Fases 1 y 2: **DESCARTADAS por inexistencia del analizador en el repositorio, su historial y las ubicaciones revisadas; no aprobadas**. Las cifras 25 métricas / 74 columnas / 72 cubiertas / 2 tokens OAuth y H-01..H-08 no tienen respaldo en el repositorio.

## Condiciones previas a cualquier entorno compartido

Respaldar con `pg_dump` y verificar el respaldo; revisión independiente del SQL; confirmar la versión del servidor destino; ejecutar los prechecks en solo lectura sobre los datos reales; obtener autorización específica. Hasta cumplir esas condiciones, este cierre no aprueba despliegue en Supabase, staging ni producción.
