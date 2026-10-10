-- ============================================================================
-- TEXTICODE — MIGRACIÓN MULTIEMPRESA: FASE 3 EJECUTABLE (BLINDADA)
-- ============================================================================
-- Archivo: DATABASE/MIGRACION_FASE_3_EJECUTABLE.sql
-- Propósito: Añadir Id_Empresa a las 9 tablas operativas, ejecutar backfill
--            determinista sin fallbacks ciegos y verificar integridad absoluta
--            mediante 18 invariantes relacionales con aborto previo a COMMIT.
--
-- Restricciones y Alcance:
-- 1. Transacción única atómica: BEGIN -> Prechecks -> DDL -> Backfills -> Barreras -> COMMIT.
-- 2. Cero uso de LIMIT 1 en asignaciones de empresa o precondiciones.
-- 3. Cero fallbacks ciegos a Empresa Principal para filas huérfanas o ambiguas.
-- 4. Cobertura del 100% de las 18 claves foráneas salientes del esquema operativo base.
-- 5. Google Calendar permanece excluido de pruebas funcionales posteriores.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PRECHECKS DE ESQUEMA Y ENTORNO PRE-DDL
-- ============================================================================
DO $$
DECLARE
  v_count_ep INTEGER;
  v_cols_existentes INTEGER;
BEGIN
  -- 1.1 Verificar existencia y unicidad estricta de la Empresa Principal activa (sin LIMIT 1)
  SELECT COUNT(*)
  INTO v_count_ep
  FROM public.empresa
  WHERE "Slug" = 'empresa-principal' AND "Estado" = 'activa';

  IF v_count_ep <> 1 THEN
    RAISE EXCEPTION 'PRECHECK DDL ABORT: Se esperaba exactamente 1 empresa principal activa con Slug ''empresa-principal'', pero se encontraron %.', v_count_ep;
  END IF;

  -- 1.2 Verificar que el catálogo esté prístino (0 columnas Id_Empresa en las 9 tablas operativas)
  SELECT COUNT(*)
  INTO v_cols_existentes
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'Id_Empresa'
    AND table_name IN (
      'material',
      'orden_produccion',
      'material_movimiento',
      'orden_material',
      'orden_operario',
      'usuario_orden',
      'comprobantes',
      'observacion_operario',
      'google_calendar_tokens'
    );

  IF v_cols_existentes > 0 THEN
    RAISE EXCEPTION 'PRECHECK DDL ABORT: Estado inesperado del catálogo. Ya existen % columnas Id_Empresa en las tablas operativas.', v_cols_existentes;
  END IF;
END $$;

-- ============================================================================
-- 2. SENTENCIAS DDL: AÑADIR Id_Empresa (NULLABLE TEMPORALMENTE PARA BACKFILL)
-- ============================================================================
ALTER TABLE public.material ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_produccion ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.material_movimiento ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_material ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_operario ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.usuario_orden ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.comprobantes ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.observacion_operario ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.google_calendar_tokens ADD COLUMN "Id_Empresa" INTEGER;

-- ============================================================================
-- 3. SENTENCIAS DML: BACKFILL DETERMINISTA (CERO FALLBACKS CIEGOS, SIN LIMIT 1)
-- ============================================================================

-- 3.1 Tablas Raíz: material y orden_produccion asignadas a la única Empresa Principal activa
UPDATE public.material
SET "Id_Empresa" = (
  SELECT "Id_Empresa"
  FROM public.empresa
  WHERE "Slug" = 'empresa-principal' AND "Estado" = 'activa'
)
WHERE "Id_Empresa" IS NULL;

UPDATE public.orden_produccion
SET "Id_Empresa" = (
  SELECT "Id_Empresa"
  FROM public.empresa
  WHERE "Slug" = 'empresa-principal' AND "Estado" = 'activa'
)
WHERE "Id_Empresa" IS NULL;

-- 3.2 Dependientes directas de material: material_movimiento
UPDATE public.material_movimiento mm
SET "Id_Empresa" = m."Id_Empresa"
FROM public.material m
WHERE mm."Id_Material" = m."Id_Material"
  AND mm."Id_Empresa" IS NULL;

-- 3.3 Dependientes directas de orden_produccion: orden_material, orden_operario, usuario_orden, comprobantes
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

-- 3.4 observacion_operario:
-- Caso A: Observaciones vinculadas a orden de producción (heredan Id_Empresa de la orden)
UPDATE public.observacion_operario ob
SET "Id_Empresa" = op."Id_Empresa"
FROM public.orden_produccion op
WHERE ob."Id_Orden" = op."Id_Orden"
  AND ob."Id_Empresa" IS NULL;

-- Caso B: Observaciones sin orden (Id_Orden IS NULL):
-- Asignación permitida ÚNICAMENTE si Admin y Operario comparten exactamente 1 membresía principal activa sistémica idéntica
UPDATE public.observacion_operario ob
SET "Id_Empresa" = ue_adm."Id_Empresa"
FROM public.usuario_empresa ue_adm
JOIN public.usuario_empresa ue_op ON ue_op."Id_Empresa" = ue_adm."Id_Empresa"
WHERE ob."Id_Orden" IS NULL
  AND ob."Id_Empresa" IS NULL
  AND ue_adm."Id_Usuario" = ob."Id_Admin"
  AND ue_adm."Es_Principal" = true
  AND ue_adm."Estado" = 'activo'
  AND ue_op."Id_Usuario" = ob."Id_Operario"
  AND ue_op."Es_Principal" = true
  AND ue_op."Estado" = 'activo'
  AND (SELECT COUNT(*) FROM public.usuario_empresa ue1 WHERE ue1."Id_Usuario" = ob."Id_Admin" AND ue1."Es_Principal" = true AND ue1."Estado" = 'activo') = 1
  AND (SELECT COUNT(*) FROM public.usuario_empresa ue2 WHERE ue2."Id_Usuario" = ob."Id_Operario" AND ue2."Es_Principal" = true AND ue2."Estado" = 'activo') = 1;

-- 3.5 google_calendar_tokens:
-- Asignación determinista a la membresía principal activa del usuario, requiriendo unicidad sistémica global
UPDATE public.google_calendar_tokens gct
SET "Id_Empresa" = ue."Id_Empresa"
FROM public.usuario_empresa ue
WHERE gct."Id_Empresa" IS NULL
  AND ue."Id_Usuario" = gct."Id_Usuario"
  AND ue."Es_Principal" = true
  AND ue."Estado" = 'activo'
  AND (SELECT COUNT(*) FROM public.usuario_empresa ue_cnt WHERE ue_cnt."Id_Usuario" = gct."Id_Usuario" AND ue_cnt."Es_Principal" = true AND ue_cnt."Estado" = 'activo') = 1;

-- ============================================================================
-- 4. BARRERAS PRE-COMMIT: 18 INVARIANTES RELACIONALES REALES CON RAISE EXCEPTION
-- ============================================================================
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

-- ============================================================================
-- 5. COMMIT FINAL (SOLO TRAS APROBACIÓN DE TODAS LAS BARRERAS PRE-COMMIT)
-- ============================================================================
COMMIT;
