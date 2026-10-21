# Comparación del catálogo real exportado y esquemas reproducibles

## Alcance y método

HECHO OBSERVADO: se leyó únicamente `C:\Users\Wagne\Downloads\esquema_real_supabase.csv` (89 filas de columnas y encabezado), `DATABASE/ESQUEMA_INICIAL_REPRODUCIBLE.sql`, `DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql` y fuentes JavaScript de `BACKEND/routes/` y `BACKEND/services/`. No se consultó la base de datos. El CSV trae `table_name`, `ordinal_position`, `column_name`, `data_type`, `is_nullable` y `column_default`; no trae constraints, índices, claves, identidad/secuencia completa ni longitudes de `character varying`.

La comparación principal de columnas es entre el CSV y el esquema inicial reproducible (antes de migración). También se identifica aparte el delta que introduce la migración definitiva, pues las fases 3–7 se probaron sobre el inicial más esa migración.

## 1–3. Tablas, columnas y atributos

### Conteos de tablas

| Comparación | Solo catálogo real | Solo esquema de referencia | En común |
|---|---:|---:|---:|
| CSV vs. `ESQUEMA_INICIAL_REPRODUCIBLE.sql` | 0 | 0 | 12 |
| CSV vs. inicial + tablas de `MIGRACION_FASE_3_DEFINITIVA.sql` | 0 | 3 | 12 |

Las tres tablas que añade la migración y que no aparecen en el CSV son `empresa`, `empresa_config` y `usuario_empresa`. El CSV incluye exactamente las 12 tablas base del esquema inicial.

### Conteos de columnas contra el esquema inicial

HECHO OBSERVADO: el CSV contiene 89 columnas; el esquema inicial define 79 columnas en las 12 tablas. Hay 75 nombres de columna en común, 14 nombres presentes solo en el CSV y 4 presentes solo en el esquema inicial.

| Tabla | Solo real (CSV) | Solo esquema inicial |
|---|---|---|
| `comprobantes` | — | `Ruta_PDF` |
| `google_calendar_tokens` | `Token_Type`, `Calendar_Id`, `Sync_Enabled`, `Last_Login_Google`, `Last_Sync_At`, `Created_At` | — |
| `material` | `Fecha` | — |
| `material_movimiento` | — | — |
| `observacion_operario` | — | — |
| `orden_material` | `Cantidad_Usada` | `Id_Orden_Material`, `Cantidad` |
| `orden_operario` | `Descripcion_Fase`, `Cantidad_Realizada`, `created_at`, `updated_at`, `Fecha_Completada` | — |
| `orden_produccion` | — | — |
| `rol` | — | — |
| `tokens_recuperacion` | — | — |
| `usuario` | — | — |
| `usuario_orden` | `Funcion` | `Id_Usuario_Orden` |

La migración agrega `Id_Empresa` a nueve tablas: `material`, `orden_produccion`, `material_movimiento`, `orden_material`, `orden_operario`, `usuario_orden`, `comprobantes`, `observacion_operario` y `google_calendar_tokens`. Ninguna de esas columnas aparece en el CSV. Sumadas las tres tablas y las nueve columnas añadidas, hay 29 columnas definidas por la migración que el catálogo exportado no muestra: 20 en las tres tablas nuevas y una por cada tabla multiempresa.

### Diferencias de tipo, nulabilidad y default en columnas comunes

| Tabla/columna | Catálogo real (CSV) | Esquema inicial | Diferencia observada |
|---|---|---|---|
| `comprobantes.Estado` | `USER-DEFINED`, NOT NULL, default `'Pendiente'::estado_comprobante` | `VARCHAR(40)`, nullable, sin default | Tipo, nulabilidad y default |
| `comprobantes.Fecha_Limite` | default `CURRENT_DATE`, nullable | sin default, nullable | Default |
| `google_calendar_tokens.Access_Token` | `text`, NOT NULL | `TEXT`, nullable | Nulabilidad |
| `google_calendar_tokens.Updated_At` | timestamp without time zone, NOT NULL, `CURRENT_TIMESTAMP` | mismo tipo y default, nullable | Nulabilidad |
| `material.Stock_Actual` | `integer`, NOT NULL, default 0 | `NUMERIC(12,2)`, NOT NULL, default 0 | Tipo |
| `material.Stock_Minimo`, `Stock_Maximo` | `integer`, NOT NULL, default 0 | `NUMERIC(12,2)`, NOT NULL, default 0 | Tipo |
| `material_movimiento.Fecha` | timestamp without time zone, NOT NULL, `now()` | mismo tipo, nullable, `CURRENT_TIMESTAMP` | Nulabilidad; expresión de default escrita distinto (en PostgreSQL ambas expresiones representan el instante actual) |
| `observacion_operario.Observacion` | `character varying`, NOT NULL | `TEXT`, NOT NULL | Tipo declarado; el CSV no expone longitud de varchar |
| `orden_operario.Estado_Fase` | `text`, NOT NULL, default `'Pendiente'::text` | `VARCHAR(40)`, NOT NULL, default `'Pendiente'` | Tipo declarado |
| `orden_produccion.Descripcion` | `character varying`, NOT NULL | `TEXT`, NOT NULL | Tipo declarado; el CSV no expone longitud de varchar |
| `orden_produccion.Prioridad`, `Estado`, `Dificultad` | `USER-DEFINED`, NOT NULL, defaults Media/En Proceso/Media tipados como enums | `VARCHAR(30/40)`, NOT NULL, defaults equivalentes | Tipo declarado |
| `orden_produccion.Unidades_Realizadas` | integer, nullable, sin default | integer, nullable, default 0 | Default |
| `tokens_recuperacion.expiracion` | timestamp without time zone, NOT NULL | timestamp with time zone, NOT NULL | Tipo/zona horaria |
| `tokens_recuperacion.usado` | boolean, nullable, default false | boolean, NOT NULL, default false | Nulabilidad |
| `usuario.Estado` | `USER-DEFINED`, NOT NULL, default `'activo'::estado_usuario` | `VARCHAR(20)`, NOT NULL, default `'activo'` | Tipo declarado |

El CSV reporta `character varying` sin su longitud; por eso no se puede confirmar ni negar si los límites como `VARCHAR(150)` coinciden. Tampoco permite comparar PK, FK, UNIQUE, CHECK ni índices; este informe no afirma que las constraints reales coincidan.

## 4. Tablas reales fuera del ámbito de DDL multiempresa

HECHO OBSERVADO: `rol` y `usuario` aparecen como dependencias consultadas por la migración, pero no reciben `Id_Empresa`; `tokens_recuperacion` no se incluye en la migración ni recibe esa columna. Interpretación del nombre/columnas, **POR DECIDIR**:

| Tabla | Lo que sugieren nombre y columnas | Alcance de empresa |
|---|---|---|
| `rol` | Catálogo de `Id_Rol` y `Nombre_Rol` | Global o por empresa: **POR DECIDIR** |
| `usuario` | Identidades, correo, contraseña, teléfono y estado; la migración relaciona empresa mediante `usuario_empresa` | Global o por empresa: **POR DECIDIR** |
| `tokens_recuperacion` | Tokens de restablecimiento, usuario, expiración y usado | Global de autenticación o con ámbito empresarial: **POR DECIDIR** |

No hay tabla llamada `cita`, `citas`, `agenda` o `agendamiento` en las 89 filas. Sí existe `google_calendar_tokens`; su nombre y columnas indican credenciales/preferencias de integración, no una tabla local de citas. El backend invoca Google Calendar, pero no se observó una tabla local de eventos/citas en el catálogo proporcionado.

## 5. Columnas SQL del backend contrastadas con el CSV

### Columnas observadas en el código que sí están en real y faltan en el esquema inicial

| Tabla.columna | Evidencia en código | Estado |
|---|---|---|
| `orden_operario.Descripcion_Fase` | `BACKEND/routes/orden_operario.js:118,297`; `BACKEND/routes/carga_trabajo.js:61,226` | EXISTE EN REAL, NO EN REPRODUCIBLE |
| `orden_operario.Cantidad_Realizada` | `BACKEND/routes/orden_operario.js:397`; `BACKEND/routes/eficiencia.js:17`; `BACKEND/services/rendimiento.js:50-51` | EXISTE EN REAL, NO EN REPRODUCIBLE |
| `orden_operario.updated_at` | `BACKEND/routes/orden_operario.js:226`; `BACKEND/routes/carga_trabajo.js:238,281` | EXISTE EN REAL, NO EN REPRODUCIBLE |
| `orden_operario.Fecha_Completada` | `BACKEND/routes/orden_operario.js:226,400`; `BACKEND/services/rendimiento.js:47,74,81-82` | EXISTE EN REAL, NO EN REPRODUCIBLE |
| `orden_material.Cantidad_Usada` | `BACKEND/routes/practica.routes.js:45` | EXISTE EN REAL, NO EN REPRODUCIBLE |
| `usuario_orden.Funcion` | `BACKEND/routes/usuario_orden.js:41,49` | EXISTE EN REAL, NO EN REPRODUCIBLE |
| `google_calendar_tokens.Token_Type`, `Calendar_Id`, `Sync_Enabled`, `Last_Login_Google`, `Last_Sync_At` | `BACKEND/routes/googleCalendar.js:143,158-170,296-298,328,519,571-572`; `BACKEND/routes/calendar.route.js:62,68` | EXISTEN EN REAL, NO EN REPRODUCIBLE |

### Código que usa esquema reproducible pero no coincide con el CSV real

| Tabla.columna | Evidencia en código | Estado |
|---|---|---|
| `orden_material.Cantidad` | `BACKEND/routes/orden_material.js:56,98,126,170` | EXISTE EN REPRODUCIBLE, NO EN REAL (el CSV presenta `Cantidad_Usada`) |
| `orden_material.Id_Orden_Material` | definido por esquema inicial; no se observó uso SQL en las fuentes revisadas | EXISTE EN REPRODUCIBLE, NO EN REAL |
| `usuario_orden.Id_Usuario_Orden` | definido por esquema inicial; no se observó uso SQL en las fuentes revisadas | EXISTE EN REPRODUCIBLE, NO EN REAL (real presenta `Funcion`) |
| `comprobantes.Ruta_PDF` | definida por esquema inicial; no se observó uso SQL en las fuentes revisadas | EXISTE EN REPRODUCIBLE, NO EN REAL |

Esto ubica el caso de Fase 7.3: el endpoint actualmente persiste/lee `orden_material.Cantidad`, que existe en el esquema reproducible probado, mientras el CSV real presenta `Cantidad_Usada` y no `Cantidad`. La compatibilidad de ese endpoint con el catálogo real no queda demostrada; la divergencia es explícita.

### Columnas y tablas que añade la migración pero que el CSV no contiene

La aplicación actual también consulta tablas multiempresa ausentes del CSV: `empresa`, `empresa_config` y `usuario_empresa`; la migración las crea. El código usa `Id_Empresa` en las nueve tablas operativas listadas en la sección 3, pero el CSV no las muestra; la migración agrega esas columnas. Clasificación: TABLAS/COLUMNAS AUSENTES EN EL CATÁLOGO REAL EXPORTADO, PRESENTES EN LA MIGRACIÓN. No son una prueba de defecto de código por sí sola; indican que el catálogo exportado no refleja el estado multiempresa definido por la migración.

### Faltantes en ambos esquemas y relaciones inexistentes

HECHO OBSERVADO: en las referencias SQL estáticas cotejadas no se encontró otra `tabla.columna` ausente tanto del CSV como del esquema inicial, ni una referencia confirmada a una tabla que falte en ambos. Los alias/CTE y SQL dinámicos se interpretan solo en su contexto; esta comparación estática no certifica consultas construidas en tiempo de ejecución.

## 6. Consecuencia para las validaciones de Fases 3–7

### HECHO OBSERVADO

- El CSV real difiere del esquema inicial en 14 columnas adicionales, 4 columnas que el inicial sí define y múltiples tipos, nulabilidades y defaults.
- El CSV no presenta `empresa`, `empresa_config`, `usuario_empresa` ni las nueve columnas `Id_Empresa` que añade la migración definitiva.
- La migración se diseñó/probó partiendo del esquema inicial reproducible y añade esas estructuras; las fases 3–7 validaron en bases/clones desechables, no contra este catálogo real.
- La falla Q7 de Fase 7.4 (`Descripcion_Fase`) se explica en esa prueba por ausencia de la columna en el esquema reproducible. El CSV ahora confirma que esa columna sí existe en el catálogo real exportado.
- La corrección de Fase 7.3 a `orden_material.Cantidad` coincide con el esquema reproducible y contradice la columna que muestra el CSV real (`Cantidad_Usada`).

### SUPOSICIÓN

El catálogo parece compatible con una estructura real anterior a la migración multiempresa y con extensiones que el esquema reproducible omitió. No se puede determinar solo con este CSV si la migración no se aplicó, si el export corresponde a otro momento/esquema, o si existen diferencias adicionales fuera del catálogo de columnas.

Conclusión: las validaciones SQL de Fases 3–7 solo sustentan el comportamiento frente al esquema inicial reproducible más la migración aplicado a clones desechables. No validan la migración, las pruebas de rutas ni la compatibilidad del código contra el esquema real exportado. No se declara aprobada ninguna migración, módulo ni aislamiento.

## Estado y acciones no realizadas

- Rama: `codex/fase-6-contexto-empresa`.
- Este informe es el único archivo nuevo creado para el paso.
- No se realizó conexión a ninguna base (5433, 5432 ni Supabase); no se leyó ningún `.env*`; no se ejecutó backend, test, SQL, migración, rollback, script ni npm; no se modificó archivo existente; no hubo push, fetch ni cambio de rama.
- Lecturas limitadas a los archivos del CSV, esquemas y carpetas `BACKEND/routes/`, `BACKEND/services/`, además de metadatos Git de rama/estado requeridos para el commit.
