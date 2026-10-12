# Paso 3.2 — Reconstrucción y prueba sobre el esquema real exportado

**Estado: no aprobado.** La migración falló en R-1 contra el esquema reconstruido desde los catálogos. No se ejecutaron las pruebas de comportamiento R-4 ni se modificó la migración.

## Fuentes, alcance y reconstrucción

HECHO OBSERVADO: se usaron `C:\Users\Wagne\Downloads\esquema_real_supabase.csv`, `catalogo_real_A.csv` y `catalogo_real_B.csv`, exportados el 12/10/2026, además de los tres SQL indicados, `BACKEND/routes/`, `BACKEND/services/` y el historial/diff Git autorizado. No se consultó Supabase ni otra base externa.

La reconstrucción final contiene 12 tablas, 89 columnas, 5 enums y 9 secuencias. Tras cargarla en `texticode_real_baseline`, el catálogo local tuvo 89 columnas. Tipos y nulabilidad coincidieron en las 89; constraints: 43/43 definiciones coincidentes; índices: 24/24 definiciones coincidentes. La comparación textual de defaults tuvo seis discrepancias:

| Tabla.columna | CSV | PostgreSQL local |
|---|---|---|
| `google_calendar_tokens.Google_Email` | `NULL::character varying` | sin default |
| `google_calendar_tokens.Google_Id` | `NULL::character varying` | sin default |
| `google_calendar_tokens.Token_Type` | `NULL::character varying` | sin default |
| `orden_produccion.Producto` | `NULL::character varying` | sin default |
| `usuario.Telefono` | `NULL::character varying` | sin default |
| `usuario_orden.Funcion` | `NULL::character varying` | sin default |

Se probó tanto `DEFAULT NULL::character varying` en `CREATE TABLE` como `ALTER COLUMN SET DEFAULT NULL::character varying`; PostgreSQL 17.10 lo normalizó a ausencia de default. La diferencia es textual en el catálogo, con valor por omisión semánticamente nulo en ambos casos. No se ocultó como comparación exacta cero.

Suposiciones y límites de la reconstrucción:

- `character varying` se creó sin longitud: los CSV no exportan el límite.
- Los tipos `USER-DEFINED` se mapearon a los enums y etiquetas ordenadas que muestra `catalogo_real_B.csv`: `dificultad_orden` y `prioridad_orden` (`Baja`, `Media`, `Alta`); `estado_comprobante` (`Entregado`, `Pendiente`); `estado_orden` (`En Proceso`, `Completada`, `Retrasada`); `estado_usuario` (`activo`, `inactivo`).
- Las secuencias se iniciaron con los `last_value` exportados; `DATOS_SINTETICOS_REAL.sql` las ajusta con `setval` al máximo de cada columna serial sintética.
- El catálogo B informa un trigger `orden_operario.trg_orden_operario_updated_at` que llama a `set_orden_operario_updated_at()`. Las policies exportadas son `rol / Enable read access for all users`, y para `usuario` `Enable insert for authenticated users only` y `Enable read access for all users`. En las filas RLS, el par literal `nombre/definicion` es `true/false` para `material_movimiento`, `orden_operario`, `rol`, `usuario` y `usuario_orden`; es `false/false` para `comprobantes`, `google_calendar_tokens`, `material`, `observacion_operario`, `orden_material`, `orden_produccion` y `tokens_recuperacion`. No se reprodujeron trigger, función, policies ni RLS.
- Los registros cargados son inventados (`example.invalid`, tokens marcados `FAKE` y contraseñas no autenticables); no se copiaron datos reales.

Conteos sintéticos cargados en `texticode_real_baseline`:

| Tabla | Filas |
|---|---:|
| `comprobantes` | 1 |
| `google_calendar_tokens` | 1 |
| `material` | 2 |
| `material_movimiento` | 2 |
| `observacion_operario` | 1 |
| `orden_material` | 2 |
| `orden_operario` | 1 |
| `orden_produccion` | 2 |
| `rol` | 3 |
| `tokens_recuperacion` | 1 |
| `usuario` | 3 |
| `usuario_orden` | 2 |

## Entorno y R-1

HECHO OBSERVADO: PostgreSQL local 17.10, `127.0.0.1:5433`, clúster en `%TEMP%\texticode_pg17_20261009\data`. La identidad confirmada fue `texticode_real_r1 | texticode_test_20261009 | 127.0.0.1 | 5433`. El esquema y seed se cargaron en `texticode_real_baseline`; la migración se ejecutó sin cambios sobre el clon nuevo `texticode_real_r1`.

R-1 **abortó**. `psql -v ON_ERROR_STOP=1 -v VERBOSITY=verbose -f DATABASE\MIGRACION_FASE_3_DEFINITIVA.sql` terminó con código 3. Error: **SQLSTATE 42883**, `no existe la función pg_catalog.btrim(estado_usuario)`. Archivo/línea: `MIGRACION_FASE_3_DEFINITIVA.sql:77`; la expresión que dispara el error está en la línea 39, dentro del precheck de operarios. Estado final del clon: siguen las 12 tablas fuente; `empresa` y `usuario_empresa` no existen, y `material.Id_Empresa` no existe. La transacción revirtió el intento.

R-2/R-4: al fallar R-1 no se ejecutaron A-1, A-3, A-4a ni B-1, según la condición del paso. No hay resultados de comportamiento posteriores a la migración reconstruida.

## R-3 — Revisión estática de la migración

HECHO OBSERVADO: el export declara `usuario.Estado` como enum `estado_usuario`. La migración lo trata como texto en estas expresiones; `trim` resuelve a `pg_catalog.btrim(text)`, que no acepta ese enum sin conversión explícita. La primera falla observada fue en la línea 39.

| Línea de `MIGRACION_FASE_3_DEFINITIVA.sql` | Referencia | Hallazgo |
|---:|---|---|
| 39 | `lower(trim(coalesce(u."Estado",'activo')))` | Desajuste enum/texto; falla observada en R-1, SQLSTATE 42883. |
| 54 | Misma expresión sobre `usuario.Estado` | Mismo desajuste estático. |
| 69 | Misma expresión sobre `usuario.Estado` | Mismo desajuste estático. |
| 70 | Misma expresión sobre `usuario.Estado` | Mismo desajuste estático. |
| 74 | Misma expresión sobre `usuario.Estado` | Mismo desajuste estático. |
| 148 | `LOWER(TRIM(COALESCE(u."Estado", 'activo')))` | Mismo desajuste en el backfill de membresías; se alcanzaría después del precheck. |

Las tablas `empresa`, `empresa_config`, `usuario_empresa` se crean en líneas 79, 90 y 102; los `Id_Empresa` ausentes del CSV se agregan en líneas 159–167. Las referencias posteriores a esas tablas/columnas son internas a la migración: backfills 170–214, validaciones 225–463, FKs/constraints 472–547 e índices 550–556. No son objetos que la migración presuponga ya presentes en el esquema fuente.

Comprobaciones específicas solicitadas:

- `orden_material.Id_Orden_Material`: no aparece en la migración; el CSV tampoco lo contiene.
- `usuario_orden.Id_Usuario_Orden`: no aparece en la migración; el CSV tampoco lo contiene.
- `comprobantes.Ruta_PDF`: no aparece en la migración; el CSV tampoco lo contiene.
- `orden_material.Cantidad`: no aparece en la migración; el CSV contiene `Cantidad_Usada`.
- `material.Stock_Actual`, `Stock_Minimo` y `Stock_Maximo`: la migración no los referencia; no se encontró una operación que presuponga `numeric` frente al `integer` real.
- Las constraints de origen `material_Nombre_Material_key` y `google_calendar_tokens_pkey`, que la migración reemplaza en líneas 505 y 545, sí están en `catalogo_real_A.csv`.

No se encontró otra referencia de la migración a una columna de una tabla fuente ausente del CSV. Esto es una lectura estática; R-1 sí detectó el desajuste de tipo descrito arriba.

## Diff de routers Fase 7 y compatibilidad con el CSV

HECHO OBSERVADO: en `git diff ccbd1d1..HEAD -- BACKEND/routes/`, el cambio de nombre de columna encontrado es `orden_material.Cantidad_Usada` → `orden_material.Cantidad`:

| Archivo:línea | Cambio | Compatibilidad con el CSV real |
|---|---|---|
| `BACKEND/routes/orden_material.js:56` | INSERT usa `Cantidad` | Incompatible: el CSV solo muestra `Cantidad_Usada`. |
| `BACKEND/routes/orden_material.js:98` | SELECT usa `Cantidad AS Cantidad_Usada` | Incompatible: el alias conserva el nombre de salida, pero la columna fuente `Cantidad` no existe. |
| `BACKEND/routes/orden_material.js:126` | UPDATE escribe `Cantidad` | Incompatible. |
| `BACKEND/routes/orden_material.js:170` | DELETE retorna `Cantidad AS Cantidad_Usada` | Incompatible: falta la columna fuente `Cantidad`. |

No se observó otro renombre/reemplazo de columna para adaptar los routers al esquema reproducible; los demás cambios revisados agregan filtros y columnas `Id_Empresa`.

En el catálogo exportado no aparecen `Id_Empresa` en las nueve tablas operativas ni las tablas `empresa`, `empresa_config`, `usuario_empresa`. Como R-1 falló y revirtió, estos queries actuales tampoco funcionan contra el esquema exportado tal como está:

- **Materiales:** consultas GET en `materiales.js:16,48–50,68,85,102,121`; INSERT/UPDATE/DELETE y movimientos en `:143,163,196,214,242,278,288,298` requieren `Id_Empresa`.
- **Órdenes:** consultas/joins/escrituras de `ordenes.js:15,34,36,59,61,65,70,92,94,115,117,125,129,159,161,197,256,290` requieren `Id_Empresa`.
- **Orden-material:** consultas y escrituras en `orden_material.js:17,40,56,62,66,98–99,110,126–127,138,142,169–170,181,185` requieren `Id_Empresa`; además sus operaciones de cantidad usan `orden_material.Cantidad`, que falta en el CSV.
- **Orden-operario:** lecturas/escrituras en `orden_operario.js:17–18,45,58,70,92,118,147–148,181,186–190,215,220–224,250,270,278,282,286–298,327,362,383,401,406` requieren `Id_Empresa`. `Descripcion_Fase`, `Cantidad_Realizada`, `updated_at` y `Fecha_Completada` sí aparecen en el CSV.
- **Usuario-orden:** consultas/escrituras en `usuario_orden.js:14–15,29–31,49,66` requieren `Id_Empresa`; `Funcion` sí aparece en el CSV.

## Lo que se sabe y lo que aún no

HECHO OBSERVADO: la reconstrucción coincide con los catálogos en tablas, nombres de columnas, tipos, nulabilidad, constraints e índices, con la excepción textual de los seis defaults nulos indicada arriba. R-1 demuestra que la migración actual no pasa su primer precheck en PostgreSQL 17.10 con `usuario.Estado` enum. El esquema de prueba no reproduce los triggers, funciones, policies o RLS descritos por el catálogo B.

NO SE SABE: no se consultó la base de Supabase, sus datos reales ni sus conteos; no se verificó si cumplen los prechecks, cuál es la versión del servidor, ni el comportamiento de triggers/RLS en ejecución. El CSV no informa longitudes de `character varying`. Los resultados de este paso son locales y sintéticos; no aprueban la migración, el rollback ni su uso en un entorno compartido.

## Estado de trabajo

- Rama: `codex/fase-6-contexto-empresa`.
- Clúster: PostgreSQL 17.10 en `127.0.0.1:5433`.
- `pg_hba.conf` quedó restaurado y verificado con SHA-256 `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`.
- No se hizo conexión a Supabase ni al puerto 5432; no se leyó `.env*`; no se ejecutó backend, npm ni `node --test`; no se modificaron archivos existentes; no hubo push, fetch ni cambio de rama.
- El commit local de los tres archivos nuevos se informa en el chat para evitar una referencia autorrecursiva dentro de este informe.
