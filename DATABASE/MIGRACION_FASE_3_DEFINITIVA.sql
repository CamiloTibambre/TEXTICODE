-- TEXTICODE — MIGRACIÓN MULTIEMPRESA FASE 3 DEFINITIVA
-- Propósito: asignar empresa inicial, backfill y aislamiento relacional en nueve tablas operativas.
-- Orden: ejecutar ESQUEMA_INICIAL_REPRODUCIBLE.sql -> DATOS_SINTETICOS_PRUEBA.sql -> este archivo.
-- PostgreSQL probado: 17.10. No aprobado para ningún entorno compartido.
-- Ejecución única y atómica: prechecks, DDL, backfill, 18 invariantes y constraints dentro de una transacción.
-- Una segunda ejecución se rechaza por el precheck de catálogo y no modifica el estado existente.
BEGIN;

-- Barreras previas de esquema y datos: todas corren antes del primer DDL/DML.
DO $$
DECLARE v_count bigint; v_duplicate_rows bigint;
BEGIN
  SELECT (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname IN ('empresa','empresa_config','usuario_empresa'))
       + (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('material','orden_produccion','material_movimiento','orden_material','orden_operario','usuario_orden','comprobantes','observacion_operario','google_calendar_tokens') AND column_name='Id_Empresa')
    INTO v_count;
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.catalogo: % objetos de migración ya existen; se requiere esquema inicial limpio.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.usuario u LEFT JOIN public.rol r ON r."Id_Rol"=COALESCE(u."Id_Rol",3) WHERE r."Id_Rol" IS NULL;
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.usuario: % usuarios tienen rol inexistente o no disponible el rol de respaldo 3.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.material m
   WHERE (m."Id_Cliente" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=m."Id_Cliente"))
      OR m."Nombre_Material" IN (SELECT "Nombre_Material" FROM public.material GROUP BY "Nombre_Material" HAVING count(*)>1);
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.material: % filas tienen cliente huérfano o nombre duplicado para la empresa inicial.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.orden_produccion op
   WHERE op."Id_Cliente" IS NULL OR NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=op."Id_Cliente")
      OR NOT EXISTS (SELECT 1 FROM public.material m WHERE m."Id_Material"=op."Id_Material")
      OR (op."Id_Operario" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=op."Id_Operario" AND lower(trim(coalesce(u."Estado",'activo'))) <> 'inactivo'));
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.orden_produccion: % filas tienen cliente/material huérfano u operario sin membresía activa prevista.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.material_movimiento mm
   WHERE NOT EXISTS (SELECT 1 FROM public.material m WHERE m."Id_Material"=mm."Id_Material")
      OR (mm."Id_Orden" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.orden_produccion op WHERE op."Id_Orden"=mm."Id_Orden"));
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.material_movimiento: % filas tienen material u orden huérfanos.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.orden_material om
   WHERE NOT EXISTS (SELECT 1 FROM public.orden_produccion op WHERE op."Id_Orden"=om."Id_Orden")
      OR NOT EXISTS (SELECT 1 FROM public.material m WHERE m."Id_Material"=om."Id_Producto");
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.orden_material: % filas tienen orden o producto huérfanos.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.orden_operario oo
   WHERE NOT EXISTS (SELECT 1 FROM public.orden_produccion op WHERE op."Id_Orden"=oo."Id_Orden")
      OR NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=oo."Id_Operario" AND lower(trim(coalesce(u."Estado",'activo'))) <> 'inactivo');
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.orden_operario: % filas tienen orden huérfana u operario sin membresía activa prevista.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.usuario_orden uo
   WHERE NOT EXISTS (SELECT 1 FROM public.orden_produccion op WHERE op."Id_Orden"=uo."Id_Orden")
      OR NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=uo."Id_Usuario");
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.usuario_orden: % filas tienen orden o usuario huérfanos.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.comprobantes c
   WHERE NOT EXISTS (SELECT 1 FROM public.orden_produccion op WHERE op."Id_Orden"=c."Id_Orden")
      OR NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=c."Id_Usuario");
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.comprobantes: % filas tienen orden o usuario huérfanos.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.observacion_operario ob
   WHERE (ob."Id_Orden" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.orden_produccion op WHERE op."Id_Orden"=ob."Id_Orden"))
      OR NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=ob."Id_Admin" AND lower(trim(coalesce(u."Estado",'activo'))) <> 'inactivo')
      OR NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=ob."Id_Operario" AND lower(trim(coalesce(u."Estado",'activo'))) <> 'inactivo');
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.observacion_operario: % filas tienen orden huérfana o administrador/operario sin membresía activa prevista.',v_count; END IF;

  SELECT count(*) INTO v_count FROM public.google_calendar_tokens gct
   WHERE NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u."Id_Usuario"=gct."Id_Usuario" AND lower(trim(coalesce(u."Estado",'activo'))) <> 'inactivo')
      OR gct."Id_Usuario" IN (SELECT "Id_Usuario" FROM public.google_calendar_tokens GROUP BY "Id_Usuario" HAVING count(*)>1);
  IF v_count>0 THEN RAISE EXCEPTION 'PRECHECK public.google_calendar_tokens: % filas tienen usuario sin membresía principal activa prevista o Id_Usuario duplicado.',v_count; END IF;
END $$;

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

DO $$
DECLARE
  v_nulos INTEGER;
  v_fallos INTEGER;
BEGIN
  -- --------------------------------------------------------------------------
  -- B-01: Invariante de Nulabilidad (Cero nulos en las 9 tablas operativas)
  -- --------------------------------------------------------------------------
  SELECT 
    (SELECT COUNT(*) FROM public.material WHERE "Id_Empresa" IS NULL) +
    (SELECT COUNT(*) FROM public.orden_produccion WHERE "Id_Empresa" IS NULL) +
    (SELECT COUNT(*) FROM public.material_movimiento WHERE "Id_Empresa" IS NULL) +
    (SELECT COUNT(*) FROM public.orden_material WHERE "Id_Empresa" IS NULL) +
    (SELECT COUNT(*) FROM public.orden_operario WHERE "Id_Empresa" IS NULL) +
    (SELECT COUNT(*) FROM public.usuario_orden WHERE "Id_Empresa" IS NULL) +
    (SELECT COUNT(*) FROM public.comprobantes WHERE "Id_Empresa" IS NULL) +
    (SELECT COUNT(*) FROM public.observacion_operario WHERE "Id_Empresa" IS NULL) +
    (SELECT COUNT(*) FROM public.google_calendar_tokens WHERE "Id_Empresa" IS NULL)
  INTO v_nulos;

  IF v_nulos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-01]: % registros quedaron con Id_Empresa nulo en tablas operativas.', v_nulos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-02: orden_produccion -> material (FK obligatoria Id_Material)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.orden_produccion op
  WHERE NOT EXISTS (
    SELECT 1 FROM public.material m
    WHERE m."Id_Material" = op."Id_Material" AND m."Id_Empresa" = op."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-02]: % ordenes vinculan material inexistente o de empresa distinta.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-03: orden_produccion -> cliente (FK obligatoria Id_Cliente, pertenencia)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.orden_produccion op
  WHERE NOT EXISTS (
    SELECT 1 FROM public.usuario_empresa ue
    WHERE ue."Id_Usuario" = op."Id_Cliente" AND ue."Id_Empresa" = op."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-03]: % ordenes vinculan cliente sin membresia en su empresa.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-04: orden_produccion -> operario (FK opcional Id_Operario, membresía activa)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.orden_produccion op
  WHERE op."Id_Operario" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.usuario_empresa ue
      WHERE ue."Id_Usuario" = op."Id_Operario" AND ue."Id_Empresa" = op."Id_Empresa" AND ue."Estado" = 'activo'
    );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-04]: % ordenes vinculan operario sin membresia activa en su empresa.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-05: material -> cliente (FK opcional Id_Cliente, pertenencia)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.material m
  WHERE m."Id_Cliente" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.usuario_empresa ue
      WHERE ue."Id_Usuario" = m."Id_Cliente" AND ue."Id_Empresa" = m."Id_Empresa"
    );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-05]: % materiales vinculan cliente sin membresia en su empresa.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-06: material_movimiento -> material (FK obligatoria Id_Material)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.material_movimiento mm
  WHERE NOT EXISTS (
    SELECT 1 FROM public.material m
    WHERE m."Id_Material" = mm."Id_Material" AND m."Id_Empresa" = mm."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-06]: % movimientos vinculan material inexistente o de empresa distinta.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-07: material_movimiento -> orden (FK opcional Id_Orden)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.material_movimiento mm
  WHERE mm."Id_Orden" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.orden_produccion op
      WHERE op."Id_Orden" = mm."Id_Orden" AND op."Id_Empresa" = mm."Id_Empresa"
    );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-07]: % movimientos vinculan orden inexistente o de empresa distinta.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-08: material_movimiento consistencia cruzada Material-Orden
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.material_movimiento mm
  JOIN public.material m ON m."Id_Material" = mm."Id_Material"
  JOIN public.orden_produccion op ON op."Id_Orden" = mm."Id_Orden"
  WHERE mm."Id_Orden" IS NOT NULL AND m."Id_Empresa" IS DISTINCT FROM op."Id_Empresa";
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-08]: % movimientos vinculan material y orden de empresas distintas.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-09: orden_material -> orden (FK obligatoria Id_Orden)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.orden_material om
  WHERE NOT EXISTS (
    SELECT 1 FROM public.orden_produccion op
    WHERE op."Id_Orden" = om."Id_Orden" AND op."Id_Empresa" = om."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-09]: % registros en orden_material sin orden o de empresa distinta.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-10: orden_material -> material (FK obligatoria Id_Producto según DDL real)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.orden_material om
  WHERE NOT EXISTS (
    SELECT 1 FROM public.material m
    WHERE m."Id_Material" = om."Id_Producto" AND m."Id_Empresa" = om."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-10]: % insumos en orden_material sin material o de empresa distinta.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-11: orden_material consistencia cruzada Orden-Insumo
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.orden_material om
  JOIN public.orden_produccion op ON op."Id_Orden" = om."Id_Orden"
  JOIN public.material m ON m."Id_Material" = om."Id_Producto"
  WHERE op."Id_Empresa" IS DISTINCT FROM m."Id_Empresa";
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-11]: % registros en orden_material vinculan orden e insumo de empresas distintas.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-12: orden_operario -> orden (FK obligatoria Id_Orden)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.orden_operario oo
  WHERE NOT EXISTS (
    SELECT 1 FROM public.orden_produccion op
    WHERE op."Id_Orden" = oo."Id_Orden" AND op."Id_Empresa" = oo."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-12]: % fases en orden_operario sin orden o de empresa distinta.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-13: orden_operario -> operario (FK obligatoria Id_Operario, membresía activa)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.orden_operario oo
  WHERE NOT EXISTS (
    SELECT 1 FROM public.usuario_empresa ue
    WHERE ue."Id_Usuario" = oo."Id_Operario" AND ue."Id_Empresa" = oo."Id_Empresa" AND ue."Estado" = 'activo'
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-13]: % fases en orden_operario con operario sin membresia activa en su empresa.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-14: usuario_orden -> orden (FK obligatoria Id_Orden)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.usuario_orden uo
  WHERE NOT EXISTS (
    SELECT 1 FROM public.orden_produccion op
    WHERE op."Id_Orden" = uo."Id_Orden" AND op."Id_Empresa" = uo."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-14]: % registros en usuario_orden sin orden o de empresa distinta.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-15: usuario_orden -> usuario (FK obligatoria Id_Usuario, pertenencia histórica)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.usuario_orden uo
  WHERE NOT EXISTS (
    SELECT 1 FROM public.usuario_empresa ue
    WHERE ue."Id_Usuario" = uo."Id_Usuario" AND ue."Id_Empresa" = uo."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-15]: % registros en usuario_orden con usuario sin membresia en su empresa.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-16: comprobantes -> orden (obligatoria) y usuario (obligatoria histórica)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.comprobantes c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.orden_produccion op
    WHERE op."Id_Orden" = c."Id_Orden" AND op."Id_Empresa" = c."Id_Empresa"
  )
  OR NOT EXISTS (
    SELECT 1 FROM public.usuario_empresa ue
    WHERE ue."Id_Usuario" = c."Id_Usuario" AND ue."Id_Empresa" = c."Id_Empresa"
  );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-16]: % comprobantes con orden o usuario no perteneciente a su empresa.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-17: observacion_operario (con orden y sin orden, membresías activas)
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.observacion_operario ob
  WHERE (ob."Id_Orden" IS NOT NULL AND NOT EXISTS (
           SELECT 1 FROM public.orden_produccion op
           WHERE op."Id_Orden" = ob."Id_Orden" AND op."Id_Empresa" = ob."Id_Empresa"
         ))
     OR (ob."Id_Orden" IS NULL AND (
          (SELECT COUNT(*) FROM public.usuario_empresa ue WHERE ue."Id_Usuario" = ob."Id_Admin" AND ue."Es_Principal" = true AND ue."Estado" = 'activo') <> 1
          OR (SELECT COUNT(*) FROM public.usuario_empresa ue WHERE ue."Id_Usuario" = ob."Id_Operario" AND ue."Es_Principal" = true AND ue."Estado" = 'activo') <> 1
          OR NOT EXISTS (
            SELECT 1 FROM public.usuario_empresa ue_adm
            JOIN public.usuario_empresa ue_op ON ue_op."Id_Empresa" = ue_adm."Id_Empresa"
            WHERE ue_adm."Id_Usuario" = ob."Id_Admin" AND ue_adm."Es_Principal" = true AND ue_adm."Estado" = 'activo'
              AND ue_op."Id_Usuario" = ob."Id_Operario" AND ue_op."Es_Principal" = true AND ue_op."Estado" = 'activo'
              AND ue_adm."Id_Empresa" = ob."Id_Empresa"
          )
        ))
     OR NOT EXISTS (
          SELECT 1 FROM public.usuario_empresa ue
          WHERE ue."Id_Usuario" = ob."Id_Admin" AND ue."Id_Empresa" = ob."Id_Empresa" AND ue."Estado" = 'activo'
        )
     OR NOT EXISTS (
          SELECT 1 FROM public.usuario_empresa ue
          WHERE ue."Id_Usuario" = ob."Id_Operario" AND ue."Id_Empresa" = ob."Id_Empresa" AND ue."Estado" = 'activo'
        );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-17]: % observaciones con incompatibilidad de orden, membresia activa o empresa compartida.', v_fallos;
  END IF;

  -- --------------------------------------------------------------------------
  -- B-18: google_calendar_tokens: unicidad sistémica de membresía principal activa
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_fallos FROM public.google_calendar_tokens gct
  WHERE (SELECT COUNT(*) FROM public.usuario_empresa ue WHERE ue."Id_Usuario" = gct."Id_Usuario" AND ue."Es_Principal" = true AND ue."Estado" = 'activo') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM public.usuario_empresa ue 
       WHERE ue."Id_Usuario" = gct."Id_Usuario" AND ue."Id_Empresa" = gct."Id_Empresa" AND ue."Es_Principal" = true AND ue."Estado" = 'activo'
     );
  IF v_fallos > 0 THEN
    RAISE EXCEPTION 'ABORT PRE-COMMIT [B-18]: % tokens de calendar sin exactamente una membresia principal activa sistemica o con empresa desalineada.', v_fallos;
  END IF;

END $$;

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
-- Sustituye la unicidad global por la unicidad (empresa,nombre); el precheck descarta duplicados antes de asignar todos los datos legados a la empresa inicial, y el índice por empresa se crea en esta misma transacción.
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
-- Sustituye la PK antigua de Id_Usuario por (Id_Usuario,Id_Empresa); el precheck garantiza una fila por usuario en la única empresa asignada y la PK nueva queda aplicada atómicamente.
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
