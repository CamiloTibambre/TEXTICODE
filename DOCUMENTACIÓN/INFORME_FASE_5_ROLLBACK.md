# Informe Fase 5 — recuperación y rollback en base desechable

## Estado y alcance

**Hecho observado.** Pruebas ejecutadas en PostgreSQL 17.10, solo en el clúster temporal `127.0.0.1:5433`, con el rol `texticode_test_20261009`. La migración definitiva conserva SHA-256 `4809D6F36AAEB7FA5970C18A5EB0FB6FE869BA6D178ADB28FE52C2D01C395DCB`. Los archivos de respaldo están fuera del repositorio, bajo `%TEMP%\texticode_pg17_20261009\`.

El borrador de rollback **no está aprobado**. Los veredictos “APROBADA” de la tabla significan que ese caso de prueba cumplió su resultado esperado; no aprueban el rollback, la migración ni su uso en una base compartida.

## Cambios de la migración y reversibilidad

| Cambio observado en `MIGRACION_FASE_3_DEFINITIVA.sql` | Reversibilidad |
|---|---|
| Transacción única, prechecks de catálogo y referencias, y validaciones B-01 a B-18 | Reversible: los prechecks/validaciones no dejan objetos ni datos persistentes; una excepción revierte la transacción. |
| Crea `empresa` (PK serial, slug único, check de estado), `empresa_config` (PK/FK a empresa con `ON DELETE CASCADE`) y `usuario_empresa` (PK usuario/empresa, FKs a usuario/empresa/rol, check de estado) | Reversible con condición: el rollback elimina las tres tablas y sus filas. Se pierden empresas, configuraciones y membresías agregadas durante la fase. |
| Crea `usuario_empresa_un_usuario_unique`, `usuario_empresa_principal_unique` (índice parcial), `idx_usuario_empresa_empresa_rol_estado` e `idx_usuario_empresa_usuario_estado` | Reversible: se retiran con la tabla; la unicidad de usuario se retira explícitamente antes de eliminarla. |
| Siembra empresa principal y configuración; inserta una membresía principal para cada usuario existente, normalizando el estado y usando rol 3 si `Id_Rol` era nulo | Reversible con condición: la información nueva de empresa/membresía se elimina con las tablas. El SQL no establece `DEFAULT Id_Empresa` en las tablas operativas. |
| Agrega `Id_Empresa` a `material`, `orden_produccion`, `material_movimiento`, `orden_material`, `orden_operario`, `usuario_orden`, `comprobantes`, `observacion_operario` y `google_calendar_tokens`; hace backfill desde empresa principal, orden/material relacionados o empresa principal como fallback | Reversible con condición: quitar columnas pierde toda atribución empresarial y cualquier reasignación posterior. Las filas originales permanecen; no se reconstruyen sus valores de empresa al revertir. |
| Marca las nueve columnas `Id_Empresa` como `NOT NULL` y agrega sus nueve FKs simples a `empresa` | Reversible: se eliminan las FKs y las columnas. |
| Agrega `material_id_empresa_unique` y `orden_produccion_id_empresa_unique` | Reversible: se eliminan antes de quitar las columnas. |
| Retira `material_Nombre_Material_key` y crea el índice único `material_empresa_nombre_unique` sobre empresa/nombre | Reversible con condición: la unicidad global solo puede restaurarse si no hay nombres repetidos. R5 ejercita el bloqueo correspondiente. |
| Agrega 18 FKs compuestas para las relaciones de orden-producción, material, movimientos, orden-material, orden-operario, usuario-orden, comprobantes, observaciones y tokens | Reversible: el borrador las elimina antes de retirar las claves compuestas y columnas. |
| Sustituye la PK de `google_calendar_tokens` (`Id_Usuario`) por (`Id_Usuario`, `Id_Empresa`) y agrega `fk_gct_usuario_empresa` | Reversible con condición: la PK antigua requiere una sola fila por usuario. La membresía única hace inalcanzable la colisión entre empresas en el esquema probado. |
| Crea siete índices operativos: dos de material, tres de orden-producción, uno de orden-operario y uno de comprobantes | Reversible: el borrador los elimina explícitamente. |

El borrador también verifica que las tablas/columnas y los 31 constraints esperados existan antes de cambiar nada. Aborta si no detecta la migración, si el catálogo está incompleto, si hay datos operativos en varias empresas, nombres de material repetidos o más de una fila de token por usuario, o si ya existe una PK/constraint incompatible con la restauración.

## Resultados R1–R8

Huella = SHA-256 de la serialización de columnas, constraints, índices y, para cada tabla, conteo y hash MD5 de sus filas JSON ordenadas. La huella previa limpia observada fue `46DA3B5791DF0C858E3B04DE4BFEC5910FF12593BC65806679619FB0757F0988`.

| Prueba | Esperado y fundamento | Hecho observado | Veredicto del caso |
|---|---|---|---|
| R1 — M1 fidelidad | Restaurar el dump debe reproducir la huella del clon previo. | Dump custom de `f5r1_src` a `f5r1_baseline2.dump` (43.169 bytes) y restauración en `f5r1_restore`. Huellas iguales: `46DA…0988`. Comandos: `pg_dump -h 127.0.0.1 -p 5433 -U texticode_test_20261009 -d f5r1_src -Fc -f <archivo>`; `pg_restore -h 127.0.0.1 -p 5433 -U texticode_test_20261009 --no-owner --no-privileges --exit-on-error -d f5r1_restore <archivo>`. Dump 196 ms; restauración 230 ms. | APROBADA |
| R2 — M1 recuperación | Restaurar el respaldo previo en una base nueva debe excluir las filas agregadas después del dump; el dump conserva el estado anterior. | En `f5r2_source`, se creó empresa B y un material sintético después del dump. El respaldo custom `f5r2_pre_migration.dump` (43.181 bytes) se restauró en `f5r2_restore`; su huella (`46DA…0988`) coincide con el estado previo. La fila post-respaldo de material no está en el destino. Restauración: 228 ms. La preparación final se envió por stdin a `psql` con `ON_ERROR_STOP` y `VERBOSITY=verbose`; terminó con código 0. | APROBADA |
| R3 — M2 limpio | En ausencia de datos nuevos, revertir debe recuperar la huella previa. | Migración y rollback en `f5r3_20261011` terminaron con código 0. Huella posterior idéntica a baseline: `46DA…0988`. | APROBADA |
| R4 — empresa B vacía | Al no haber operaciones en B, el rollback puede proceder; elimina los objetos empresariales nuevos. | En `f5r4_20261011` había 2 empresas y 2 configuraciones antes del rollback; este terminó con código 0. La huella volvió a `46DA…0988`. Se eliminaron la empresa B y su configuración, además de las filas de las tablas creadas por la migración. | APROBADA |
| R5 — nombres repetidos | La unicidad global antigua no puede restaurarse; el precheck (b) debe abortar sin cambios. | En `f5r5_20261011` hubo 1 grupo de nombres duplicados. Salida: SQLSTATE `P0001`, `PRECHECK (b) material: 1 nombres están repetidos...`; `psql` código 3. Huella antes/después idéntica: `B3E70B44EFE9F9C6D914395A38BAF524114854D6852C6BAA5BF16F5A2F2C8F57`. | APROBADA |
| R6 — colisión de tokens | Si se construye el estado del precheck (c), debe abortar sin cambios; si el esquema lo impide, queda por definir. | No se pudo construir. Al intentar una segunda membresía para el mismo usuario en empresa B, PostgreSQL devolvió `23505`, constraint `usuario_empresa_un_usuario_unique`. Esa regla, junto con la PK compuesta de tokens y su FK a membresía, impide el caso entre empresas en el esquema probado. El precheck (c) no se ejecutó. | POR DEFINIR |
| R7 — datos en A y B | El precheck (a) debe abortar si varias empresas tienen datos operativos. | En `f5r7_20261011` el conteo fue 2 empresas con filas operativas. Salida: `P0001`, `PRECHECK (a) datos operativos: 2 empresas distintas...`; `psql` código 3. Huellas iguales antes/después: `98B1FE63AFE840E0C0A108B75D3C15A4C9A6D08FC24BEBD9D51D61A571D9C0AA`. | APROBADA |
| R8 — idempotencia | La primera ejecución procede; la segunda debe detenerse limpiamente sin alterar el estado. | En `f5r8_20261011`, primera ejecución código 0. Segunda ejecución: `P0001`, `ROLLBACK NO APLICABLE` (tablas=0, columnas=0), `psql` código 3. Huella igual antes/después de la segunda: `46DA…0988`. | APROBADA |

**Incidencia de preparación R2.** Dos intentos previos de invocar SQL con quoting nativo de PowerShell no prepararon los datos; el segundo fue rechazado porque los identificadores llegaron sin comillas. Tras la autorización expresa, se consultó `information_schema.columns` y se envió la sentencia con here-string de comillas simples por stdin. La ejecución final de la preparación fue exitosa; no se cambió el rollback por esos errores del harness.

## Recomendación y condiciones de detención

**Inferencia a partir de estas pruebas:** M1 es el mecanismo principal más seguro entre los dos probados: conserva un estado anterior identificable y la restauración en base nueva reprodujo su huella, incluso después de cambios posteriores en la base origen. M2 solo es una opción condicionada a que todos los prechecks pasen; aun así, elimina columnas de atribución, membresías y configuraciones. Ninguno de los resultados aprueba su uso en un entorno compartido.

Detener la recuperación si el destino/puerto/identidad no coincide, no se puede verificar el dump y la restauración, las huellas difieren, la versión de PostgreSQL destino no está confirmada, el esquema no coincide con los prechecks, hay varias empresas con datos operativos, hay nombres duplicados o colisión de tokens, o falta respaldo previo verificado y autorización específica. No ejecutar este borrador en una base compartida.

## Límites y cobertura posterior

- Solo se observó PostgreSQL 17.10; no se verificó PostgreSQL 15 ni 16.
- Las bases de prueba contienen datos sintéticos pequeños; no son datos reales.
- El rollback sigue siendo un borrador no aprobado. `pg_dump`/`pg_restore` no se probaron contra la base real de Supabase.
- No se cubren autenticación, autorización ni aislamiento por actor en las rutas backend (Fases 6 y 7); rollback/recuperación operativa en entornos compartidos (Fase 5 posterior); integraciones y regresión (Fases 8 y 9); datos reales y versión de Supabase (Fase 11).
- El upsert de tokens y las rutas backend que omiten `Id_Empresa` quedan para las fases indicadas; no se ejecutó ni modificó el backend.

## Estado final y hechos no realizados

El clúster temporal quedó en ejecución en `127.0.0.1:5433`. Se conservaron estos clones: `f5r1_src`, `f5r1_restore`, `f5r2_source`, `f5r2_restore`, `f5r3_20261011`, `f5r4_20261011`, `f5r5_20261011`, `f5r6_20261011`, `f5r7_20261011`, `f5r8_20261011` y `f5migrada_snapshot` (clon de `texticode_migrada`). Los dumps permanecen en `%TEMP%\texticode_pg17_20261009\`.

Se trabajó en `codex/seguridad-escalon-1`; el hash del commit local de los tres archivos se consigna en el resumen de cierre asociado a este informe. El estado final reportado allí contiene únicamente los tres archivos autorizados.

Confirmación: no se usó el puerto 5432 ni otro destino; no se leyó `.env`; no se ejecutó el backend ni `FASE_3` original; no se modificó ningún archivo existente; no se hizo push, fetch ni checkout; no se borraron el clúster ni los clones. `pg_hba.conf` quedó restaurado y verificado con SHA-256 `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`.
