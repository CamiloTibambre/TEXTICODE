-- ============================================================================
-- TEXTICODE — BORRADOR SQL MULTIEMPRESA REVISION 4 (AUTOEJECUTABLE Y ROBUSTO)
-- ============================================================================
-- Estado: Propuesta técnica autoejecutable para validación en base desechable.
-- Conserva el diseño estricto de la Revisión 3, pero elimina la dependencia de
-- variables de consola (:ID_EMPRESA_INICIAL) utilizando subconsultas y CTEs
-- dinámicas para que sea 100% autoejecutable desde cualquier cliente SQL o driver.
--
-- ADVERTENCIA:
--   - NO ejecutar contra Supabase sin autorización humana previa.
--   - Diseñado para validación en base de datos PostgreSQL 15/16 desechable.
-- ============================================================================

-- ============================================================================
-- FASE 0: PRE-CHECKS DE INTEGRIDAD Y REGISTROS HUÉRFANOS (SOLO LECTURA)
-- ============================================================================
/*
SELECT 'usuario' AS tabla, COUNT(*) AS total FROM public.usuario
UNION ALL SELECT 'rol', COUNT(*) FROM public.rol
UNION ALL SELECT 'material', COUNT(*) FROM public.material
UNION ALL SELECT 'orden_produccion', COUNT(*) FROM public.orden_produccion;

-- Huérfanos: Si alguno es > 0, abortar antes de iniciar Fase 1
SELECT COUNT(*) AS materiales_con_cliente_huerfano
FROM public.material m
LEFT JOIN public.usuario u ON u."Id_Usuario" = m."Id_Cliente"
WHERE m."Id_Cliente" IS NOT NULL AND u."Id_Usuario" IS NULL;

SELECT COUNT(*) AS ordenes_con_cliente_huerfano
FROM public.orden_produccion op
LEFT JOIN public.usuario u ON u."Id_Usuario" = op."Id_Cliente"
WHERE u."Id_Usuario" IS NULL;

SELECT COUNT(*) AS ordenes_con_material_huerfano
FROM public.orden_produccion op
LEFT JOIN public.material m ON m."Id_Material" = op."Id_Material"
WHERE m."Id_Material" IS NULL;
*/

-- ============================================================================
-- FASE 1: CREACIÓN DE TABLAS BASE MULTIEMPRESA E ÍNDICES
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.empresa (
  "Id_Empresa" SERIAL PRIMARY KEY,
  "Nombre_Empresa" VARCHAR(160) NOT NULL,
  "Slug" VARCHAR(80) NOT NULL,
  "Estado" VARCHAR(20) NOT NULL DEFAULT 'activa',
  "Fecha_Creacion" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "Updated_At" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT empresa_slug_key UNIQUE ("Slug"),
  CONSTRAINT empresa_estado_check CHECK ("Estado" IN ('activa', 'inactiva'))
);

CREATE TABLE IF NOT EXISTS public.empresa_config (
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

CREATE TABLE IF NOT EXISTS public.usuario_empresa (
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

CREATE UNIQUE INDEX IF NOT EXISTS usuario_empresa_principal_unique
  ON public.usuario_empresa ("Id_Usuario")
  WHERE "Es_Principal" = true;

CREATE INDEX IF NOT EXISTS idx_usuario_empresa_empresa_rol_estado
  ON public.usuario_empresa ("Id_Empresa", "Id_Rol", "Estado");

CREATE INDEX IF NOT EXISTS idx_usuario_empresa_usuario_estado
  ON public.usuario_empresa ("Id_Usuario", "Estado");

COMMIT;

-- ============================================================================
-- FASE 2: EMPRESA INICIAL Y MEMBRESÍAS (AUTOEJECUTABLE SIN VARIABLES MANUALES)
-- ============================================================================
BEGIN;

-- 2.1 Sembrar Empresa Principal si no existe
INSERT INTO public.empresa ("Nombre_Empresa", "Slug", "Estado")
VALUES ('Empresa Principal', 'empresa-principal', 'activa')
ON CONFLICT ("Slug") DO NOTHING;

-- 2.2 Sembrar Configuración vinculada
INSERT INTO public.empresa_config ("Id_Empresa", "Nombre_Comercial", "Zona_Horaria", "Moneda")
SELECT "Id_Empresa", 'Empresa Principal', 'America/Bogota', 'COP'
FROM public.empresa
WHERE "Slug" = 'empresa-principal'
ON CONFLICT ("Id_Empresa") DO NOTHING;

-- 2.3 Asociar todos los usuarios a la empresa principal normalizando el estado
INSERT INTO public.usuario_empresa
  ("Id_Usuario", "Id_Empresa", "Id_Rol", "Estado", "Es_Principal")
SELECT
  u."Id_Usuario",
  e."Id_Empresa",
  COALESCE(u."Id_Rol", 3),
  CASE
    WHEN LOWER(TRIM(COALESCE(u."Estado", 'activo'))) = 'inactivo' THEN 'inactivo'
    ELSE 'activo'
  END,
  true
FROM public.usuario u
CROSS JOIN (
  SELECT "Id_Empresa" FROM public.empresa WHERE "Slug" = 'empresa-principal' LIMIT 1
) e
ON CONFLICT ("Id_Usuario", "Id_Empresa") DO NOTHING;

COMMIT;

-- ============================================================================
-- FASE 3: COLUMNAS Id_Empresa Y BACKFILL DINÁMICO
-- ============================================================================
BEGIN;

-- 3.1 Agregar columnas nullable para permitir backfill
ALTER TABLE public.material ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;
ALTER TABLE public.orden_produccion ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;
ALTER TABLE public.material_movimiento ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;
ALTER TABLE public.orden_material ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;
ALTER TABLE public.orden_operario ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;
ALTER TABLE public.usuario_orden ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;
ALTER TABLE public.comprobantes ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;
ALTER TABLE public.observacion_operario ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;
ALTER TABLE public.google_calendar_tokens ADD COLUMN IF NOT EXISTS "Id_Empresa" INTEGER;

-- 3.2 Backfill tablas raíz usando el ID de la Empresa Principal
WITH ep AS (SELECT "Id_Empresa" FROM public.empresa WHERE "Slug" = 'empresa-principal' LIMIT 1)
UPDATE public.material SET "Id_Empresa" = ep."Id_Empresa" FROM ep WHERE material."Id_Empresa" IS NULL;

WITH ep AS (SELECT "Id_Empresa" FROM public.empresa WHERE "Slug" = 'empresa-principal' LIMIT 1)
UPDATE public.orden_produccion SET "Id_Empresa" = ep."Id_Empresa" FROM ep WHERE orden_produccion."Id_Empresa" IS NULL;

-- 3.3 Backfill dependiente
UPDATE public.material_movimiento mm
SET "Id_Empresa" = m."Id_Empresa"
FROM public.material m
WHERE mm."Id_Material" = m."Id_Material" AND mm."Id_Empresa" IS NULL;

WITH ep AS (SELECT "Id_Empresa" FROM public.empresa WHERE "Slug" = 'empresa-principal' LIMIT 1)
UPDATE public.material_movimiento SET "Id_Empresa" = ep."Id_Empresa" FROM ep WHERE material_movimiento."Id_Empresa" IS NULL;

UPDATE public.orden_material om
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE om."Id_Orden" = op."Id_Orden" AND om."Id_Empresa" IS NULL;

UPDATE public.orden_operario oo
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE oo."Id_Orden" = op."Id_Orden" AND oo."Id_Empresa" IS NULL;

UPDATE public.usuario_orden uo
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE uo."Id_Orden" = op."Id_Orden" AND uo."Id_Empresa" IS NULL;

UPDATE public.comprobantes c
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE c."Id_Orden" = op."Id_Orden" AND c."Id_Empresa" IS NULL;

UPDATE public.observacion_operario ob
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE ob."Id_Orden" = op."Id_Orden" AND ob."Id_Empresa" IS NULL;

WITH ep AS (SELECT "Id_Empresa" FROM public.empresa WHERE "Slug" = 'empresa-principal' LIMIT 1)
UPDATE public.observacion_operario SET "Id_Empresa" = ep."Id_Empresa" FROM ep WHERE observacion_operario."Id_Empresa" IS NULL;

WITH ep AS (SELECT "Id_Empresa" FROM public.empresa WHERE "Slug" = 'empresa-principal' LIMIT 1)
UPDATE public.google_calendar_tokens SET "Id_Empresa" = ep."Id_Empresa" FROM ep WHERE google_calendar_tokens."Id_Empresa" IS NULL;

COMMIT;

-- ============================================================================
-- FASE 4: VALIDACIÓN PREVIA (ABORTAR SI ALGUNA DA > 0)
-- ============================================================================
/*
SELECT 'material' AS tabla, COUNT(*) AS nulos FROM public.material WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'orden_produccion', COUNT(*) FROM public.orden_produccion WHERE "Id_Empresa" IS NULL
UNION ALL SELECT 'orden_operario', COUNT(*) FROM public.orden_operario WHERE "Id_Empresa" IS NULL;
*/

-- ============================================================================
-- FASE 5: RESTRICCIONES NOT NULL, FKS COMPUESTAS E ÍNDICES
-- ============================================================================
BEGIN;

-- 5.1 NOT NULL y FKs simples a empresa
ALTER TABLE public.material ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.material ADD CONSTRAINT fk_material_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.orden_produccion ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.orden_produccion ADD CONSTRAINT fk_orden_produccion_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.material_movimiento ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.material_movimiento ADD CONSTRAINT fk_material_movimiento_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.orden_material ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.orden_material ADD CONSTRAINT fk_orden_material_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.orden_operario ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.orden_operario ADD CONSTRAINT fk_orden_operario_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.usuario_orden ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.usuario_orden ADD CONSTRAINT fk_usuario_orden_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.comprobantes ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.comprobantes ADD CONSTRAINT fk_comprobantes_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.observacion_operario ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.observacion_operario ADD CONSTRAINT fk_observacion_operario_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.google_calendar_tokens ALTER COLUMN "Id_Empresa" SET NOT NULL;
ALTER TABLE public.google_calendar_tokens ADD CONSTRAINT fk_google_calendar_tokens_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

-- 5.2 Restricciones UNIQUE compuestas en tablas raíz
ALTER TABLE public.material ADD CONSTRAINT material_id_empresa_unique UNIQUE ("Id_Material", "Id_Empresa");
ALTER TABLE public.orden_produccion ADD CONSTRAINT orden_produccion_id_empresa_unique UNIQUE ("Id_Orden", "Id_Empresa");

-- 5.3 Unicidad de material por empresa
ALTER TABLE public.material DROP CONSTRAINT IF EXISTS "material_Nombre_Material_key";
CREATE UNIQUE INDEX IF NOT EXISTS material_empresa_nombre_unique ON public.material ("Id_Empresa", "Nombre_Material");

-- 5.4 FKs compuestas en orden_produccion
ALTER TABLE public.orden_produccion
  ADD CONSTRAINT fk_op_material_empresa FOREIGN KEY ("Id_Material", "Id_Empresa") REFERENCES public.material ("Id_Material", "Id_Empresa"),
  ADD CONSTRAINT fk_op_cliente_empresa FOREIGN KEY ("Id_Cliente", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa"),
  ADD CONSTRAINT fk_op_operario_empresa FOREIGN KEY ("Id_Operario", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- 5.5 FKs compuestas en material y dependientes
ALTER TABLE public.material
  ADD CONSTRAINT fk_material_cliente_empresa FOREIGN KEY ("Id_Cliente", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.material_movimiento
  ADD CONSTRAINT fk_material_movimiento_material_empresa FOREIGN KEY ("Id_Material", "Id_Empresa") REFERENCES public.material ("Id_Material", "Id_Empresa"),
  ADD CONSTRAINT fk_material_movimiento_orden_empresa FOREIGN KEY ("Id_Orden", "Id_Empresa") REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa");

ALTER TABLE public.orden_material
  ADD CONSTRAINT fk_om_orden_empresa FOREIGN KEY ("Id_Orden", "Id_Empresa") REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_om_producto_empresa FOREIGN KEY ("Id_Producto", "Id_Empresa") REFERENCES public.material ("Id_Material", "Id_Empresa");

ALTER TABLE public.orden_operario
  ADD CONSTRAINT fk_oo_orden_empresa FOREIGN KEY ("Id_Orden", "Id_Empresa") REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_oo_operario_empresa FOREIGN KEY ("Id_Operario", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.usuario_orden
  ADD CONSTRAINT fk_uo_orden_empresa FOREIGN KEY ("Id_Orden", "Id_Empresa") REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_uo_usuario_empresa FOREIGN KEY ("Id_Usuario", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.comprobantes
  ADD CONSTRAINT fk_comp_orden_empresa FOREIGN KEY ("Id_Orden", "Id_Empresa") REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_comp_usuario_empresa FOREIGN KEY ("Id_Usuario", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.observacion_operario
  ADD CONSTRAINT fk_obs_admin_empresa FOREIGN KEY ("Id_Admin", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa"),
  ADD CONSTRAINT fk_obs_operario_empresa FOREIGN KEY ("Id_Operario", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa"),
  ADD CONSTRAINT fk_obs_orden_empresa FOREIGN KEY ("Id_Orden", "Id_Empresa") REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa");

-- 5.6 PK y FK compuesta en google_calendar_tokens
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS google_calendar_tokens_pkey;
ALTER TABLE public.google_calendar_tokens ADD CONSTRAINT google_calendar_tokens_pkey PRIMARY KEY ("Id_Usuario", "Id_Empresa");
ALTER TABLE public.google_calendar_tokens ADD CONSTRAINT fk_gct_usuario_empresa FOREIGN KEY ("Id_Usuario", "Id_Empresa") REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- 5.7 Índices de optimización de rutas operativas
CREATE INDEX IF NOT EXISTS idx_material_empresa_activo ON public.material ("Id_Empresa", "Activo");
CREATE INDEX IF NOT EXISTS idx_material_empresa_cliente ON public.material ("Id_Empresa", "Id_Cliente");
CREATE INDEX IF NOT EXISTS idx_orden_produccion_empresa_estado ON public.orden_produccion ("Id_Empresa", "Estado");
CREATE INDEX IF NOT EXISTS idx_orden_produccion_empresa_cliente ON public.orden_produccion ("Id_Empresa", "Id_Cliente");
CREATE INDEX IF NOT EXISTS idx_orden_produccion_empresa_operario ON public.orden_produccion ("Id_Empresa", "Id_Operario");
CREATE INDEX IF NOT EXISTS idx_orden_operario_empresa_operario ON public.orden_operario ("Id_Empresa", "Id_Operario");
CREATE INDEX IF NOT EXISTS idx_comprobantes_empresa_orden ON public.comprobantes ("Id_Empresa", "Id_Orden");

COMMIT;
