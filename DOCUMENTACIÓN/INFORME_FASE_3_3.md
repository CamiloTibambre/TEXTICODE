# Informe del paso 3.3 — migración y rutas contra esquema reconstruido

## Alcance y evidencia

Las comprobaciones de este informe se hicieron únicamente en clones locales de `texticode_real_baseline`, en PostgreSQL 17.10 por `127.0.0.1:5433`. El esquema reconstruido desde catálogos no es un respaldo de Supabase y usa datos sintéticos. **Estos resultados no aprueban la migración para Supabase, staging ni producción.**

La rama fue `codex/fase-6-contexto-empresa`. La migración cambió de SHA-256 `4809D6F36AAEB7FA5970C18A5EB0FB6FE869BA6D178ADB28FE52C2D01C395DCB` a `B32668B57B904D8DCCEA30DD6684EC69B283ED75AD445B980D84F37C6FD1A42B`.

## Cambios

- En [MIGRACION_FASE_3_DEFINITIVA.sql](../DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql), se convirtió `usuario.Estado` a `text` en seis llamadas a `LOWER(TRIM(COALESCE(...)))` (líneas 39, 54, 69, 70, 74 y 148). El catálogo define `Estado` como enum `estado_usuario`, con valores `activo` e `inactivo`. Se conservaron las condiciones y el resto del SQL; el diff confirma que no se cambiaron los prechecks ni las 18 invariantes B-01–B-18 (líneas 222–466).
- En [orden_material.js](../BACKEND/routes/orden_material.js), las cuatro sentencias SQL ahora leen/escriben `orden_material."Cantidad_Usada"` (líneas 56, 98, 126 y 170). Se conserva el ámbito empresarial, las transacciones, el bloqueo `FOR UPDATE` y la forma del valor devuelto.
- En [orden-material-aislamiento.test.js](../BACKEND/test/orden-material-aislamiento.test.js), se actualizó el doble de la consulta para la columna real.
- El barrido estático de la migración no encontró otras funciones de texto ni conversiones adicionales que requirieran cambios. No se detectó uso en `routes/` o `services/` de `Id_Orden_Material`, `Id_Usuario_Orden` ni `Ruta_PDF`. Los catálogos describen PK compuestas: `orden_material (Id_Orden, Id_Producto)` y `usuario_orden (Id_Usuario, Id_Orden)`. `orden_operario."Descripcion_Fase"` y `orden_material."Cantidad_Usada"` sí están en el catálogo real.

## Pruebas

Las pruebas Node importan rutas/servicios con dobles sustituidos en memoria; no cargan `dotenv`, el pool real, red ni procesos externos. Comando ejecutado:

```text
node --test BACKEND/test/orden-material-aislamiento.test.js BACKEND/test/fase-6-contexto-empresa.test.js BACKEND/test/fase-6-2-superadmin.test.js BACKEND/test/materiales-aislamiento.test.js BACKEND/test/ordenes-aislamiento.test.js BACKEND/test/orden-operario-aislamiento.test.js BACKEND/test/usuario-orden-aislamiento.test.js
```

Salida final literal de Node:

```text
ℹ tests 65
ℹ suites 0
ℹ pass 65
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Código de salida: `0`.

| Caso | Comprobación y resultado observado | SQLSTATE / huella | Resultado |
|---|---|---|---|
| R1 | Migración completa en `texticode_33_r1`; terminó en `COMMIT`. | `psql` código `0` | Pasó |
| A1 | Conteos y hashes de las columnas originales coinciden en las nueve tablas: material 2, orden_produccion 2, material_movimiento 2, orden_material 2, orden_operario 1, usuario_orden 2, comprobantes 1, observacion_operario 1, google_calendar_tokens 1. `Id_Empresa` es NOT NULL en 9/9; 0 nulos; las filas están en empresa principal ID 1. | Hashes por tabla iguales antes/después | Pasó |
| A3 | El mismo nombre de material se insertó en dos empresas distintas; un segundo duplicado dentro de la misma empresa fue rechazado por el índice de empresa/nombre. | `23505`, `material_empresa_nombre_unique`; script `psql` código `0` | Pasó |
| A4a | Usuario operario inactivo con órdenes dependientes rechazado por el precheck de orden_produccion (2 filas). | `P0001`; `psql` código `3`; fingerprints normalizados de esquema y datos iguales | Pasó: aborto esperado |
| A4b | Usuario con dos membresías preexistentes rechazado por el precheck de usuario_empresa (1 usuario). | `P0001`; `psql` código `3`; fingerprints normalizados de esquema y datos iguales | Pasó: aborto esperado |
| A5 | Segunda ejecución rechazada por el precheck de catálogo (12 objetos); no alteró el estado ya migrado. | `P0001`; `psql` código `3`; fingerprints normalizados de esquema y datos iguales | Pasó: rechazo esperado |
| A6 | INSERT por defecto de secuencia en material y orden_produccion produjo IDs nuevos. | material `3`, orden `3`; script `psql` código `0` | Pasó |
| B1 | Seis referencias cruzadas entre empresas rechazadas: material, cliente y operario de orden; cliente de material; material y orden de movimiento. | Seis `23503`: `fk_op_material_empresa`, `fk_op_cliente_empresa`, `fk_op_operario_empresa`, `fk_material_cliente_empresa`, `fk_material_movimiento_material_empresa`, `fk_material_movimiento_orden_empresa`; código `0` | Pasó |
| M1 | Segunda membresía del mismo usuario rechazada por la unicidad prevista. | `23505`, `usuario_empresa_un_usuario_unique`; código `0` | Pasó |

Las huellas de pg_dump se calcularon excluyendo únicamente sus líneas aleatorias `\\restrict`/`\\unrestrict` de PostgreSQL 17; con esa normalización, los fingerprints de esquema y datos coincidieron. La primera ejecución del fixture B1 falló porque reutilizó el ID de una orden que se había revertido dentro de un bloque de prueba; el caso completo se repitió en un clon nuevo y las seis restricciones pasaron.

## Catálogo de triggers, policies y RLS

Hecho observado en `catalogo_real_B.csv`:

- Trigger: `orden_operario.trg_orden_operario_updated_at` ejecuta `set_orden_operario_updated_at()`.
- Policies exportadas: `rol / Enable read access for all users / true`; `usuario / Enable insert for authenticated users only / definición vacía`; `usuario / Enable read access for all users / true`.
- RLS (primer valor exportado; segundo valor false para todas las tablas): activado en `material_movimiento`, `orden_operario`, `rol`, `usuario` y `usuario_orden`; desactivado en `comprobantes`, `google_calendar_tokens`, `material`, `observacion_operario`, `orden_material` y `orden_produccion`.
- El catálogo de 12 tablas no contiene `empresa`, `empresa_config` ni `usuario_empresa`; la migración las crea sin habilitar RLS ni crear policies.

Suposición/riesgo: el trigger puede ejecutarse cuando se actualiza `orden_operario`; el CSV no incluye el cuerpo de la función, por lo que no se puede afirmar su efecto exacto ni su compatibilidad. Las nuevas tablas quedarían sin RLS/policies por el SQL de esta migración, lo que requiere decisión y revisión antes de cualquier despliegue. El catálogo no permite validar el estado actual de Supabase ni la interacción efectiva de policies.

## Límites

- Se probó PostgreSQL 17.10 local; no se conoce aquí la versión de Supabase destino ni se probó compatibilidad con PostgreSQL 15/16.
- El esquema reconstruido solo refleja el catálogo exportado y omite definiciones de funciones, triggers, policies y estado RLS. El seed contiene pocos datos ficticios, no datos reales.
- No se probó rollback, integración con Supabase, ejecución del backend contra PostgreSQL ni regresión con datos reales. Estos casos no quedan aprobados por este paso.
- `DATABASE/ROLLBACK_FASE_3_BORRADOR.sql` y `DATABASE/SEED_SUPERADMIN.sql` se leyeron, pero no se ejecutaron ni modificaron.

No se leyó ningún `.env*`, no se conectó a 5432 ni a Supabase, no se ejecutó el backend, rollback o seed, no se hizo push/fetch/cambio de rama, y no se borró ni detuvo el clúster ni sus clones. `pg_hba.conf` se permitió temporalmente solo para `texticode_test_20261009` desde `127.0.0.1/32`; se restauró en `finally` y su SHA-256 quedó igual a la copia: `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`.
