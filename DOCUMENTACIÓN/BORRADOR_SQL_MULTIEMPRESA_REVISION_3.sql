-- ============================================================================
-- TEXTICODE — BORRADOR SQL MULTIEMPRESA REVISION 3
-- ============================================================================
-- Estado: Propuesta técnica para validación en base de datos aislada (Staging / Desechable).
-- ADVERTENCIA CRÍTICA:
--   - NO EJECUTAR DIRECTAMENTE CONTRA SUPABASE.
--   - NO ejecutar contra ninguna base que no esté 100% confirmada como staging independiente.
--   - Requiere backup restaurable previo y ventana de mantenimiento aprobada.
--
-- Mejoras introducidas en la Revisión 3 respecto a la Revisión 2:
--   1. Fase 0 ampliada: Detección exhaustiva de registros huérfanos antes de migrar
--      (materiales, órdenes, clientes, operarios, movimientos, comprobantes, calendar).
--   2. Normalización de estados de usuario ('activo'/'inactivo') previa a la inserción
--      en usuario_empresa para evitar fallos por checks de mayúsculas/espacios.
--   3. Constraints UNIQUE formales compuestas ("Id_Material", "Id_Empresa") y
--      ("Id_Orden", "Id_Empresa") para compatibilidad estricta con FKs compuestas.
--   4. Validaciones pre-FK parametrizadas y robustas con comprobación de nulidad.
--   5. Documentación exhaustiva del impacto sobre Google Calendar y advertencia de
--      migración atómica con el backend.
--   6. Delimitación formal de los límites de reversibilidad del rollback (cuándo y
--      por qué deja de ser reversible).
-- ============================================================================

-- ============================================================================
-- FASE 0: PRE-CHECKS DE INTEGRIDAD Y REGISTROS HUÉRFANOS (SOLO LECTURA)
-- Ejecutar estas consultas antes de cualquier cambio. Si alguna devuelve filas
-- inconsistentes, debe resolverse la data sucia antes de iniciar la migración.
-- ============================================================================

/*
-- 0.1 Metadatos de conexión
SELECT current_database(), current_schema(), current_user, now();

-- 0.2 Conteos de filas base
SELECT 'usuario' AS tabla, COUNT(*) AS total FROM public.usuario
UNION ALL SELECT 'rol', COUNT(*) FROM public.rol
UNION ALL SELECT 'material', COUNT(*) FROM public.material
UNION ALL SELECT 'material_movimiento', COUNT(*) FROM public.material_movimiento
UNION ALL SELECT 'orden_produccion', COUNT(*) FROM public.orden_produccion
UNION ALL SELECT 'orden_material', COUNT(*) FROM public.orden_material
UNION ALL SELECT 'orden_operario', COUNT(*) FROM public.orden_operario
UNION ALL SELECT 'usuario_orden', COUNT(*) FROM public.usuario_orden
UNION ALL SELECT 'comprobantes', COUNT(*) FROM public.comprobantes
UNION ALL SELECT 'observacion_operario', COUNT(*) FROM public.observacion_operario
UNION ALL SELECT 'google_calendar_tokens', COUNT(*) FROM public.google_calendar_tokens;

-- 0.3 Detección de registros huérfanos existentes (TODAS deben dar 0)
-- A) Materiales con Id_Cliente que no existe en usuario
SELECT COUNT(*) AS materiales_con_cliente_huerfano
FROM public.material m
LEFT JOIN public.usuario u ON u."Id_Usuario" = m."Id_Cliente"
WHERE m."Id_Cliente" IS NOT NULL AND u."Id_Usuario" IS NULL;

-- B) Órdenes con cliente inexistente
SELECT COUNT(*) AS ordenes_con_cliente_huerfano
FROM public.orden_produccion op
LEFT JOIN public.usuario u ON u."Id_Usuario" = op."Id_Cliente"
WHERE u."Id_Usuario" IS NULL;

-- C) Órdenes con material inexistente
SELECT COUNT(*) AS ordenes_con_material_huerfano
FROM public.orden_produccion op
LEFT JOIN public.material m ON m."Id_Material" = op."Id_Material"
WHERE m."Id_Material" IS NULL;

-- D) Órdenes con operario asignado inexistente
SELECT COUNT(*) AS ordenes_con_operario_huerfano
FROM public.orden_produccion op
LEFT JOIN public.usuario u ON u."Id_Usuario" = op."Id_Operario"
WHERE op."Id_Operario" IS NOT NULL AND u."Id_Usuario" IS NULL;

-- E) Movimientos de material con material inexistente
SELECT COUNT(*) AS movimientos_con_material_huerfano
FROM public.material_movimiento mm
LEFT JOIN public.material m ON m."Id_Material" = mm."Id_Material"
WHERE m."Id_Material" IS NULL;

-- F) Fases de orden_operario huérfanas
SELECT COUNT(*) AS fases_con_orden_huerfana
FROM public.orden_operario oo
LEFT JOIN public.orden_produccion op ON op."Id_Orden" = oo."Id_Orden"
WHERE op."Id_Orden" IS NULL;

SELECT COUNT(*) AS fases_con_operario_huerfano
FROM public.orden_operario oo
LEFT JOIN public.usuario u ON u."Id_Usuario" = oo."Id_Operario"
WHERE u."Id_Usuario" IS NULL;

-- G) Comprobantes huérfanos
SELECT COUNT(*) AS comprobantes_con_orden_huerfana
FROM public.comprobantes c
LEFT JOIN public.orden_produccion op ON op."Id_Orden" = c."Id_Orden"
WHERE op."Id_Orden" IS NULL;

SELECT COUNT(*) AS comprobantes_con_usuario_huerfano
FROM public.comprobantes c
LEFT JOIN public.usuario u ON u."Id_Usuario" = c."Id_Usuario"
WHERE u."Id_Usuario" IS NULL;

-- H) Google tokens huérfanos
SELECT COUNT(*) AS google_tokens_con_usuario_huerfano
FROM public.google_calendar_tokens g
LEFT JOIN public.usuario u ON u."Id_Usuario" = g."Id_Usuario"
WHERE u."Id_Usuario" IS NULL;

-- 0.4 Comprobación de duplicados en nombres de material (debe resolverse antes)
SELECT "Nombre_Material", COUNT(*) AS duplicados
FROM public.material
WHERE "Activo" = true
GROUP BY "Nombre_Material"
HAVING COUNT(*) > 1;
*/

-- ============================================================================
-- FASE 1: CREACIÓN DE TABLAS BASE MULTIEMPRESA E ÍNDICES
-- ============================================================================

/*
BEGIN;

-- 1.1 Tabla principal de empresas clientes (tenants)
CREATE TABLE public.empresa (
  "Id_Empresa" SERIAL PRIMARY KEY,
  "Nombre_Empresa" VARCHAR(160) NOT NULL,
  "Slug" VARCHAR(80) NOT NULL,
  "Estado" VARCHAR(20) NOT NULL DEFAULT 'activa',
  "Fecha_Creacion" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "Updated_At" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT empresa_slug_key UNIQUE ("Slug"),
  CONSTRAINT empresa_estado_check CHECK ("Estado" IN ('activa', 'inactiva'))
);

-- 1.2 Configuración técnica y comercial por empresa
CREATE TABLE public.empresa_config (
  "Id_Empresa" INTEGER PRIMARY KEY
    REFERENCES public.empresa("Id_Empresa") ON DELETE CASCADE,
  "Zona_Horaria" VARCHAR(80) NOT NULL DEFAULT 'America/Bogota',
  "Moneda" VARCHAR(10) NOT NULL DEFAULT 'COP',
  "Nombre_Comercial" VARCHAR(160),
  "Email_Notificaciones" VARCHAR(160),
  "Config_JSON" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "Created_At" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "Updated_At" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 Membresías de usuario dentro de cada empresa (autorización por contexto)
CREATE TABLE public.usuario_empresa (
  "Id_Usuario" INTEGER NOT NULL
    REFERENCES public.usuario("Id_Usuario") ON DELETE CASCADE,
  "Id_Empresa" INTEGER NOT NULL
    REFERENCES public.empresa("Id_Empresa") ON DELETE CASCADE,
  "Id_Rol" INTEGER NOT NULL
    REFERENCES public.rol("Id_Rol"),
  "Estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
  "Es_Principal" BOOLEAN NOT NULL DEFAULT false,
  "Fecha_Registro" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("Id_Usuario", "Id_Empresa"),
  CONSTRAINT usuario_empresa_estado_check CHECK ("Estado" IN ('activo', 'inactivo'))
);

-- 1.4 Índice único parcial: un usuario solo puede tener una empresa marcada como principal
CREATE UNIQUE INDEX usuario_empresa_principal_unique
  ON public.usuario_empresa ("Id_Usuario")
  WHERE "Es_Principal" = true;

-- 1.5 Índices de optimización para login y membresías
CREATE INDEX idx_usuario_empresa_empresa_rol_estado
  ON public.usuario_empresa ("Id_Empresa", "Id_Rol", "Estado");

CREATE INDEX idx_usuario_empresa_usuario_estado
  ON public.usuario_empresa ("Id_Usuario", "Estado");

COMMIT;
*/

-- ============================================================================
-- FASE 2: EMPRESA INICIAL Y MIGRACIÓN DE MEMBRESÍAS EXISTENTES
-- ============================================================================

/*
BEGIN;

-- 2.1 Crear la empresa inicial para albergar los datos históricos
INSERT INTO public.empresa ("Nombre_Empresa", "Slug", "Estado")
VALUES ('Empresa Principal', 'empresa-principal', 'activa')
RETURNING "Id_Empresa";

-- NOTA PARA EL OPERADOR: Asignar el ID obtenido a la variable o reemplazar :ID_EMPRESA_INICIAL
-- (Típicamente Id_Empresa = 1 en base limpia)

INSERT INTO public.empresa_config ("Id_Empresa", "Nombre_Comercial", "Zona_Horaria", "Moneda")
VALUES (:ID_EMPRESA_INICIAL, 'Empresa Principal', 'America/Bogota', 'COP');

-- 2.2 Migrar todos los usuarios existentes como miembros de la empresa principal,
-- normalizando el estado a 'activo' o 'inactivo' según corresponda
INSERT INTO public.usuario_empresa
  ("Id_Usuario", "Id_Empresa", "Id_Rol", "Estado", "Es_Principal")
SELECT
  u."Id_Usuario",
  :ID_EMPRESA_INICIAL,
  COALESCE(u."Id_Rol", 3), -- Fallback a rol 3 (Cliente) si estuviera nulo
  CASE
    WHEN LOWER(TRIM(COALESCE(u."Estado", 'activo'))) = 'inactivo' THEN 'inactivo'
    ELSE 'activo'
  END,
  true -- Primera empresa es su principal
FROM public.usuario u
ON CONFLICT ("Id_Usuario", "Id_Empresa") DO NOTHING;

COMMIT;
*/

-- ============================================================================
-- FASE 3: ADICIÓN DE COLUMNAS Id_Empresa Y BACKFILL CONTROLADO
-- ============================================================================

/*
BEGIN;

-- 3.1 Agregar columnas Id_Empresa (inicialmente NULL para permitir backfill)
ALTER TABLE public.material ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_produccion ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.material_movimiento ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_material ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_operario ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.usuario_orden ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.comprobantes ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.observacion_operario ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.google_calendar_tokens ADD COLUMN "Id_Empresa" INTEGER;

-- 3.2 Backfill tablas raíz
UPDATE public.material
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

UPDATE public.orden_produccion
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

-- 3.3 Backfill tablas dependientes heredando desde su entidad padre
UPDATE public.material_movimiento mm
SET "Id_Empresa" = m."Id_Empresa"
FROM public.material m
WHERE mm."Id_Material" = m."Id_Material"
  AND mm."Id_Empresa" IS NULL;

-- Si hubiese movimientos huérfanos sin material, asignan empresa inicial
UPDATE public.material_movimiento
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

UPDATE public.orden_material om
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE om."Id_Orden" = op."Id_Orden"
  AND om."Id_Empresa" IS NULL;

UPDATE public.orden_operario oo
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE oo."Id_Orden" = op."Id_Orden"
  AND oo."Id_Empresa" IS NULL;

UPDATE public.usuario_orden uo
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE uo."Id_Orden" = op."Id_Orden"
  AND uo."Id_Empresa" IS NULL;

UPDATE public.comprobantes c
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE c."Id_Orden" = op."Id_Orden"
  AND c."Id_Empresa" IS NULL;

UPDATE public.observacion_operario ob
SET "Id_Empresa" = COALESCE(op."Id_Empresa", :ID_EMPRESA_INICIAL)
FROM public.orden_produccion op
WHERE ob."Id_Orden" = op."Id_Orden"
  AND ob."Id_Empresa" IS NULL;

UPDATE public.observacion_operario
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

UPDATE public.google_calendar_tokens
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

COMMIT;
*/

-- ============================================================================
-- FASE 4: VALIDACIONES PREVIAS OBLIGATORIAS ANTES DE RESTRICCIONES Y NOT NULL
-- Si cualquiera de estas consultas retorna > 0, NO continuar con la Fase 5.
-- ============================================================================

/*
-- A. Ninguna columna Id_Empresa puede quedar nula
SELECT 'material' AS tabla, COUNT(*) AS nulos FROM public.material WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'orden_produccion', COUNT(*) FROM public.orden_produccion WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'material_movimiento', COUNT(*) FROM public.material_movimiento WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'orden_material', COUNT(*) FROM public.orden_material WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'orden_operario', COUNT(*) FROM public.orden_operario WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'usuario_orden', COUNT(*) FROM public.usuario_orden WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'comprobantes', COUNT(*) FROM public.comprobantes WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'observacion_operario', COUNT(*) FROM public.observacion_operario WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'google_calendar_tokens', COUNT(*) FROM public.google_calendar_tokens WHERE "Id_Empresa" IS NULL;

-- B. Verificación de consistencia entre empresas (debe dar 0)
SELECT COUNT(*) AS orden_material_empresa_inconsistente
FROM public.orden_produccion op
JOIN public.material m ON m."Id_Material" = op."Id_Material"
WHERE op."Id_Empresa" <> m."Id_Empresa";

SELECT COUNT(*) AS orden_cliente_sin_membresia
FROM public.orden_produccion op
LEFT JOIN public.usuario_empresa ue
  ON ue."Id_Usuario" = op."Id_Cliente"
 AND ue."Id_Empresa" = op."Id_Empresa"
WHERE ue."Id_Usuario" IS NULL;

SELECT COUNT(*) AS orden_operario_sin_membresia
FROM public.orden_produccion op
LEFT JOIN public.usuario_empresa ue
  ON ue."Id_Usuario" = op."Id_Operario"
 AND ue."Id_Empresa" = op."Id_Empresa"
WHERE op."Id_Operario" IS NOT NULL
  AND ue."Id_Usuario" IS NULL;
*/

-- ============================================================================
-- FASE 5: APLICACIÓN DE NOT NULL, CONSTRAINTS Y CLAVES FORÁNEAS COMPUESTAS
-- ============================================================================

/*
BEGIN;

-- 5.1 Restricciones NOT NULL y FKs simples a empresa
ALTER TABLE public.material
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_material_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.orden_produccion
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_orden_produccion_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.material_movimiento
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_material_movimiento_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.orden_material
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_orden_material_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.orden_operario
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_orden_operario_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.usuario_orden
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_usuario_orden_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.comprobantes
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_comprobantes_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.observacion_operario
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_observacion_operario_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.google_calendar_tokens
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_google_calendar_tokens_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

-- 5.2 Restricciones UNIQUE compuestas en tablas padre para sustentar FKs compuestas
ALTER TABLE public.material
  ADD CONSTRAINT material_id_empresa_unique UNIQUE ("Id_Material", "Id_Empresa");

ALTER TABLE public.orden_produccion
  ADD CONSTRAINT orden_produccion_id_empresa_unique UNIQUE ("Id_Orden", "Id_Empresa");

-- 5.3 Modificar unicidad de nombre de material: global -> por empresa
ALTER TABLE public.material
  DROP CONSTRAINT IF EXISTS "material_Nombre_Material_key";

CREATE UNIQUE INDEX material_empresa_nombre_unique
  ON public.material ("Id_Empresa", "Nombre_Material");

-- 5.4 Claves foráneas compuestas de aislamiento en orden_produccion
ALTER TABLE public.orden_produccion
  ADD CONSTRAINT fk_op_material_empresa
    FOREIGN KEY ("Id_Material", "Id_Empresa")
    REFERENCES public.material ("Id_Material", "Id_Empresa"),
  ADD CONSTRAINT fk_op_cliente_empresa
    FOREIGN KEY ("Id_Cliente", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa"),
  ADD CONSTRAINT fk_op_operario_empresa
    FOREIGN KEY ("Id_Operario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- 5.5 Claves foráneas compuestas en material y movimientos
ALTER TABLE public.material
  ADD CONSTRAINT fk_material_cliente_empresa
    FOREIGN KEY ("Id_Cliente", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.material_movimiento
  ADD CONSTRAINT fk_material_movimiento_material_empresa
    FOREIGN KEY ("Id_Material", "Id_Empresa")
    REFERENCES public.material ("Id_Material", "Id_Empresa"),
  ADD CONSTRAINT fk_material_movimiento_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa");

-- 5.6 Claves foráneas compuestas en tablas dependientes de orden
ALTER TABLE public.orden_material
  ADD CONSTRAINT fk_om_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_om_producto_empresa
    FOREIGN KEY ("Id_Producto", "Id_Empresa")
    REFERENCES public.material ("Id_Material", "Id_Empresa");

ALTER TABLE public.orden_operario
  ADD CONSTRAINT fk_oo_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_oo_operario_empresa
    FOREIGN KEY ("Id_Operario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.usuario_orden
  ADD CONSTRAINT fk_uo_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_uo_usuario_empresa
    FOREIGN KEY ("Id_Usuario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.comprobantes
  ADD CONSTRAINT fk_comp_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_comp_usuario_empresa
    FOREIGN KEY ("Id_Usuario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.observacion_operario
  ADD CONSTRAINT fk_obs_admin_empresa
    FOREIGN KEY ("Id_Admin", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa"),
  ADD CONSTRAINT fk_obs_operario_empresa
    FOREIGN KEY ("Id_Operario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa"),
  ADD CONSTRAINT fk_obs_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa");

-- 5.7 Google Calendar tokens por usuario+empresa
ALTER TABLE public.google_calendar_tokens
  DROP CONSTRAINT IF EXISTS google_calendar_tokens_pkey;

ALTER TABLE public.google_calendar_tokens
  ADD CONSTRAINT google_calendar_tokens_pkey
  PRIMARY KEY ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.google_calendar_tokens
  ADD CONSTRAINT fk_gct_usuario_empresa
    FOREIGN KEY ("Id_Usuario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- 5.8 Índices de soporte para consultas operativas filtradas
CREATE INDEX idx_material_empresa_activo
  ON public.material ("Id_Empresa", "Activo");

CREATE INDEX idx_material_empresa_cliente
  ON public.material ("Id_Empresa", "Id_Cliente");

CREATE INDEX idx_orden_produccion_empresa_estado
  ON public.orden_produccion ("Id_Empresa", "Estado");

CREATE INDEX idx_orden_produccion_empresa_cliente
  ON public.orden_produccion ("Id_Empresa", "Id_Cliente");

CREATE INDEX idx_orden_produccion_empresa_operario
  ON public.orden_produccion ("Id_Empresa", "Id_Operario");

CREATE INDEX idx_orden_operario_empresa_operario
  ON public.orden_operario ("Id_Empresa", "Id_Operario");

CREATE INDEX idx_comprobantes_empresa_orden
  ON public.comprobantes ("Id_Empresa", "Id_Orden");

CREATE INDEX idx_google_calendar_empresa_usuario
  ON public.google_calendar_tokens ("Id_Empresa", "Id_Usuario");

COMMIT;
*/

-- ============================================================================
-- FASE 6: VALIDACIONES POSTERIORES DE SANIDAD
-- Confirmar que el aislamiento opera correctamente
-- ============================================================================

/*
SELECT COUNT(*) AS ordenes_materiales_inconsistentes
FROM public.orden_material om
JOIN public.orden_produccion op ON op."Id_Orden" = om."Id_Orden"
WHERE om."Id_Empresa" <> op."Id_Empresa";

SELECT COUNT(*) AS comprobantes_inconsistentes
FROM public.comprobantes c
JOIN public.orden_produccion op ON op."Id_Orden" = c."Id_Orden"
WHERE c."Id_Empresa" <> op."Id_Empresa";
*/

-- ============================================================================
-- FASE 7: ANÁLISIS DE ROLLBACK Y LÍMITES DE REVERSIBILIDAD
-- ============================================================================

/*
--------------------------------------------------------------------------------
CONDICIONES EN LAS QUE EL ROLLBACK DEJA DE SER REVERSIBLE:
--------------------------------------------------------------------------------
1. Creación de una segunda empresa (Empresa B):
   Si tras la migración se registra una segunda empresa con usuarios, materiales
   u órdenes, eliminar la columna "Id_Empresa" provocaría que los registros de
   Empresa B pasen a mezclarse con los de Empresa Principal en una sola tabla plana.
   La reversión causaría pérdida irreparable del aislamiento y mezclas de datos.
2. Nombres de material repetidos entre empresas:
   Si Empresa A y Empresa B crean materiales con el mismo nombre (ej. "Hilo Blanco"),
   re-establecer el índice UNIQUE global ("material_Nombre_Material_key") fallará
   por colisión de llaves primarias duplicadas.
3. Tokens múltiples de Google Calendar:
   Si un usuario vincula cuentas de Google independientes en Empresa A y Empresa B,
   revertir la PK a solo ("Id_Usuario") provocará colisión de clave primaria y
   pérdida de uno de los tokens.
4. Código en producción dependiente de Id_Empresa:
   Si el backend ya fue desplegado usando las queries multiempresa, revertir el
   esquema SQL causará inmediatamente caídas (500) en todas las operaciones.

--------------------------------------------------------------------------------
PROCEDIMIENTO DE ROLLBACK (Solo viable si NO se han creado datos de Empresa B):
--------------------------------------------------------------------------------
BEGIN;

-- Revertir FKs y PK de Google Calendar
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS fk_gct_usuario_empresa;
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS google_calendar_tokens_pkey;
ALTER TABLE public.google_calendar_tokens ADD PRIMARY KEY ("Id_Usuario");

-- Revertir FKs compuestas
ALTER TABLE public.observacion_operario DROP CONSTRAINT IF EXISTS fk_obs_orden_empresa;
ALTER TABLE public.observacion_operario DROP CONSTRAINT IF EXISTS fk_obs_operario_empresa;
ALTER TABLE public.observacion_operario DROP CONSTRAINT IF EXISTS fk_obs_admin_empresa;
ALTER TABLE public.comprobantes DROP CONSTRAINT IF EXISTS fk_comp_usuario_empresa;
ALTER TABLE public.comprobantes DROP CONSTRAINT IF EXISTS fk_comp_orden_empresa;
ALTER TABLE public.usuario_orden DROP CONSTRAINT IF EXISTS fk_uo_usuario_empresa;
ALTER TABLE public.usuario_orden DROP CONSTRAINT IF EXISTS fk_uo_orden_empresa;
ALTER TABLE public.orden_operario DROP CONSTRAINT IF EXISTS fk_oo_operario_empresa;
ALTER TABLE public.orden_operario DROP CONSTRAINT IF EXISTS fk_oo_orden_empresa;
ALTER TABLE public.orden_material DROP CONSTRAINT IF EXISTS fk_om_producto_empresa;
ALTER TABLE public.orden_material DROP CONSTRAINT IF EXISTS fk_om_orden_empresa;
ALTER TABLE public.material_movimiento DROP CONSTRAINT IF EXISTS fk_material_movimiento_orden_empresa;
ALTER TABLE public.material_movimiento DROP CONSTRAINT IF EXISTS fk_material_movimiento_material_empresa;
ALTER TABLE public.material DROP CONSTRAINT IF EXISTS fk_material_cliente_empresa;
ALTER TABLE public.orden_produccion DROP CONSTRAINT IF EXISTS fk_op_operario_empresa;
ALTER TABLE public.orden_produccion DROP CONSTRAINT IF EXISTS fk_op_cliente_empresa;
ALTER TABLE public.orden_produccion DROP CONSTRAINT IF EXISTS fk_op_material_empresa;

-- Revertir constraints UNIQUE compuestas
ALTER TABLE public.orden_produccion DROP CONSTRAINT IF EXISTS orden_produccion_id_empresa_unique;
ALTER TABLE public.material DROP CONSTRAINT IF EXISTS material_id_empresa_unique;

-- Revertir FKs simples a empresa
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS fk_google_calendar_tokens_empresa;
ALTER TABLE public.observacion_operario DROP CONSTRAINT IF EXISTS fk_observacion_operario_empresa;
ALTER TABLE public.comprobantes DROP CONSTRAINT IF EXISTS fk_comprobantes_empresa;
ALTER TABLE public.usuario_orden DROP CONSTRAINT IF EXISTS fk_usuario_orden_empresa;
ALTER TABLE public.orden_operario DROP CONSTRAINT IF EXISTS fk_orden_operario_empresa;
ALTER TABLE public.orden_material DROP CONSTRAINT IF EXISTS fk_orden_material_empresa;
ALTER TABLE public.material_movimiento DROP CONSTRAINT IF EXISTS fk_material_movimiento_empresa;
ALTER TABLE public.orden_produccion DROP CONSTRAINT IF EXISTS fk_orden_produccion_empresa;
ALTER TABLE public.material DROP CONSTRAINT IF EXISTS fk_material_empresa;

-- Eliminar índices nuevos
DROP INDEX IF EXISTS public.idx_google_calendar_empresa_usuario;
DROP INDEX IF EXISTS public.idx_comprobantes_empresa_orden;
DROP INDEX IF EXISTS public.idx_orden_operario_empresa_operario;
DROP INDEX IF EXISTS public.idx_orden_produccion_empresa_operario;
DROP INDEX IF EXISTS public.idx_orden_produccion_empresa_cliente;
DROP INDEX IF EXISTS public.idx_orden_produccion_empresa_estado;
DROP INDEX IF EXISTS public.idx_material_empresa_cliente;
DROP INDEX IF EXISTS public.idx_material_empresa_activo;
DROP INDEX IF EXISTS public.material_empresa_nombre_unique;

-- Restaurar unique global de material
ALTER TABLE public.material ADD CONSTRAINT "material_Nombre_Material_key" UNIQUE ("Nombre_Material");

-- Eliminar columnas Id_Empresa
ALTER TABLE public.google_calendar_tokens DROP COLUMN IF EXISTS "Id_Empresa";
ALTER TABLE public.observacion_operario DROP COLUMN IF EXISTS "Id_Empresa";
ALTER TABLE public.comprobantes DROP COLUMN IF EXISTS "Id_Empresa";
ALTER TABLE public.usuario_orden DROP COLUMN IF EXISTS "Id_Empresa";
ALTER TABLE public.orden_operario DROP COLUMN IF EXISTS "Id_Empresa";
ALTER TABLE public.orden_material DROP COLUMN IF EXISTS "Id_Empresa";
ALTER TABLE public.material_movimiento DROP COLUMN IF EXISTS "Id_Empresa";
ALTER TABLE public.orden_produccion DROP COLUMN IF EXISTS "Id_Empresa";
ALTER TABLE public.material DROP COLUMN IF EXISTS "Id_Empresa";

-- Eliminar tablas base multiempresa
DROP TABLE IF EXISTS public.usuario_empresa;
DROP TABLE IF EXISTS public.empresa_config;
DROP TABLE IF EXISTS public.empresa;

COMMIT;
*/
