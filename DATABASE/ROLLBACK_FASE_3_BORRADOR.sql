-- BORRADOR NO APROBADO
-- Propósito: revertir MIGRACION_FASE_3_DEFINITIVA.sql únicamente cuando los
-- prechecks demuestran que quitar la atribución multiempresa no destruye datos
-- operativos ni impide restaurar las unicidades originales.
-- Requiere PostgreSQL 17.10 (validación local desechable); no usar en compartido.
-- La ejecución completa es una sola transacción. Los datos nuevos de membresía,
-- empresa y configuración se pierden al retirar estas tablas.

BEGIN;

DO $$
DECLARE
  v_count bigint;
  v_tables bigint;
  v_columns bigint;
  v_operational_companies bigint;
  v_material_collisions bigint;
  v_token_users bigint;
  v_expected_objects bigint;
BEGIN
  SELECT count(*) INTO v_tables
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
    AND c.relname IN ('empresa','empresa_config','usuario_empresa');

  SELECT count(*) INTO v_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('material','orden_produccion','material_movimiento',
      'orden_material','orden_operario','usuario_orden','comprobantes',
      'observacion_operario','google_calendar_tokens')
    AND column_name = 'Id_Empresa';

  IF v_tables = 0 AND v_columns = 0 THEN
    RAISE EXCEPTION 'ROLLBACK NO APLICABLE: no se detecta la migración Fase 3 (tablas=%, columnas Id_Empresa=%).', v_tables, v_columns;
  END IF;
  IF v_tables <> 3 OR v_columns <> 9 THEN
    RAISE EXCEPTION 'PRECHECK esquema: se esperaban 3 tablas y 9 columnas migradas; observadas tablas=%, columnas Id_Empresa=%.', v_tables, v_columns;
  END IF;

  -- Confirmar las relaciones e índices de migración que este borrador retirará.
  SELECT count(*) INTO v_expected_objects
  FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
  WHERE n.nspname = 'public' AND c.conname IN (
    'fk_material_empresa','fk_orden_produccion_empresa','fk_material_movimiento_empresa',
    'fk_orden_material_empresa','fk_orden_operario_empresa','fk_usuario_orden_empresa',
    'fk_comprobantes_empresa','fk_observacion_operario_empresa','fk_google_calendar_tokens_empresa',
    'material_id_empresa_unique','orden_produccion_id_empresa_unique',
    'fk_op_material_empresa','fk_op_cliente_empresa','fk_op_operario_empresa',
    'fk_material_cliente_empresa','fk_material_movimiento_material_empresa','fk_material_movimiento_orden_empresa',
    'fk_om_orden_empresa','fk_om_producto_empresa','fk_oo_orden_empresa','fk_oo_operario_empresa',
    'fk_uo_orden_empresa','fk_uo_usuario_empresa','fk_comp_orden_empresa','fk_comp_usuario_empresa',
    'fk_obs_admin_empresa','fk_obs_operario_empresa','fk_obs_orden_empresa',
    'google_calendar_tokens_pkey','fk_gct_usuario_empresa','usuario_empresa_un_usuario_unique'
  );
  IF v_expected_objects <> 31 THEN
    RAISE EXCEPTION 'PRECHECK catálogo: se esperaban 31 constraints de la migración; encontradas %.', v_expected_objects;
  END IF;
  IF to_regclass('public.material_empresa_nombre_unique') IS NULL THEN
    RAISE EXCEPTION 'PRECHECK catálogo: falta el índice public.material_empresa_nombre_unique.';
  END IF;

  -- (b) La unicidad global antigua no admite nombres repetidos entre empresas.
  SELECT count(*) INTO v_material_collisions
  FROM (SELECT "Nombre_Material" FROM public.material
        GROUP BY "Nombre_Material" HAVING count(*) > 1) duplicates;
  IF v_material_collisions > 0 THEN
    RAISE EXCEPTION 'PRECHECK (b) material: % nombres están repetidos; no se puede restaurar la unicidad global.', v_material_collisions;
  END IF;

  -- (c) La clave primaria histórica de tokens era únicamente Id_Usuario.
  SELECT count(*) INTO v_token_users
  FROM (SELECT "Id_Usuario" FROM public.google_calendar_tokens
        GROUP BY "Id_Usuario" HAVING count(*) > 1) duplicates;
  IF v_token_users > 0 THEN
    RAISE EXCEPTION 'PRECHECK (c) google_calendar_tokens: % usuarios tienen más de una fila; no se puede restaurar la PK anterior.', v_token_users;
  END IF;

  -- (a) Sin datos operativos en más de una empresa no puede perderse atribución.
  WITH operational_company AS (
    SELECT "Id_Empresa" FROM public.material
    UNION SELECT "Id_Empresa" FROM public.orden_produccion
    UNION SELECT "Id_Empresa" FROM public.material_movimiento
    UNION SELECT "Id_Empresa" FROM public.orden_material
    UNION SELECT "Id_Empresa" FROM public.orden_operario
    UNION SELECT "Id_Empresa" FROM public.usuario_orden
    UNION SELECT "Id_Empresa" FROM public.comprobantes
    UNION SELECT "Id_Empresa" FROM public.observacion_operario
    UNION SELECT "Id_Empresa" FROM public.google_calendar_tokens
  )
  SELECT count(*) INTO v_operational_companies FROM operational_company;
  IF v_operational_companies > 1 THEN
    RAISE EXCEPTION 'PRECHECK (a) datos operativos: % empresas distintas tienen filas; quitar Id_Empresa perdería atribución.', v_operational_companies;
  END IF;

  -- (d) Evitar fallar al recrear el constraint histórico o al restaurar la PK.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.material'::regclass AND conname = 'material_Nombre_Material_key') THEN
    RAISE EXCEPTION 'PRECHECK (d) material: ya existe material_Nombre_Material_key; el esquema no coincide con la migración esperada.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.google_calendar_tokens'::regclass AND conname <> 'google_calendar_tokens_pkey' AND contype = 'p') THEN
    RAISE EXCEPTION 'PRECHECK (d) google_calendar_tokens: existe una PK adicional no prevista.';
  END IF;
END $$;

-- Retirar primero todas las FKs añadidas por la migración.
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT fk_gct_usuario_empresa;
ALTER TABLE public.observacion_operario DROP CONSTRAINT fk_obs_orden_empresa, DROP CONSTRAINT fk_obs_operario_empresa, DROP CONSTRAINT fk_obs_admin_empresa;
ALTER TABLE public.comprobantes DROP CONSTRAINT fk_comp_usuario_empresa, DROP CONSTRAINT fk_comp_orden_empresa;
ALTER TABLE public.usuario_orden DROP CONSTRAINT fk_uo_usuario_empresa, DROP CONSTRAINT fk_uo_orden_empresa;
ALTER TABLE public.orden_operario DROP CONSTRAINT fk_oo_operario_empresa, DROP CONSTRAINT fk_oo_orden_empresa;
ALTER TABLE public.orden_material DROP CONSTRAINT fk_om_producto_empresa, DROP CONSTRAINT fk_om_orden_empresa;
ALTER TABLE public.material_movimiento DROP CONSTRAINT fk_material_movimiento_orden_empresa, DROP CONSTRAINT fk_material_movimiento_material_empresa;
ALTER TABLE public.material DROP CONSTRAINT fk_material_cliente_empresa;
ALTER TABLE public.orden_produccion DROP CONSTRAINT fk_op_operario_empresa, DROP CONSTRAINT fk_op_cliente_empresa, DROP CONSTRAINT fk_op_material_empresa;

-- Retirar las FK simples a empresa y unicidades compuestas.
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT fk_google_calendar_tokens_empresa;
ALTER TABLE public.observacion_operario DROP CONSTRAINT fk_observacion_operario_empresa;
ALTER TABLE public.comprobantes DROP CONSTRAINT fk_comprobantes_empresa;
ALTER TABLE public.usuario_orden DROP CONSTRAINT fk_usuario_orden_empresa;
ALTER TABLE public.orden_operario DROP CONSTRAINT fk_orden_operario_empresa;
ALTER TABLE public.orden_material DROP CONSTRAINT fk_orden_material_empresa;
ALTER TABLE public.material_movimiento DROP CONSTRAINT fk_material_movimiento_empresa;
ALTER TABLE public.orden_produccion DROP CONSTRAINT fk_orden_produccion_empresa;
ALTER TABLE public.material DROP CONSTRAINT fk_material_empresa;
ALTER TABLE public.material DROP CONSTRAINT material_id_empresa_unique;
ALTER TABLE public.orden_produccion DROP CONSTRAINT orden_produccion_id_empresa_unique;

-- Restaurar las restricciones históricas sustituidas por la migración.
DROP INDEX public.material_empresa_nombre_unique;
ALTER TABLE public.material ADD CONSTRAINT "material_Nombre_Material_key" UNIQUE ("Nombre_Material");
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT google_calendar_tokens_pkey;
ALTER TABLE public.google_calendar_tokens ADD CONSTRAINT google_calendar_tokens_pkey PRIMARY KEY ("Id_Usuario");

-- Índices y reglas creados en las tablas nuevas.
DROP INDEX public.idx_comprobantes_empresa_orden;
DROP INDEX public.idx_orden_operario_empresa_operario;
DROP INDEX public.idx_orden_produccion_empresa_operario;
DROP INDEX public.idx_orden_produccion_empresa_cliente;
DROP INDEX public.idx_orden_produccion_empresa_estado;
DROP INDEX public.idx_material_empresa_cliente;
DROP INDEX public.idx_material_empresa_activo;
DROP INDEX public.idx_usuario_empresa_usuario_estado;
DROP INDEX public.idx_usuario_empresa_empresa_rol_estado;
DROP INDEX public.usuario_empresa_principal_unique;
ALTER TABLE public.usuario_empresa DROP CONSTRAINT usuario_empresa_un_usuario_unique;

-- PÉRDIDA DE DATOS: quitar estas columnas elimina la atribución Id_Empresa
-- y cualquier asociación empresarial agregada después del backfill.
ALTER TABLE public.google_calendar_tokens DROP COLUMN "Id_Empresa";
ALTER TABLE public.observacion_operario DROP COLUMN "Id_Empresa";
ALTER TABLE public.comprobantes DROP COLUMN "Id_Empresa";
ALTER TABLE public.usuario_orden DROP COLUMN "Id_Empresa";
ALTER TABLE public.orden_operario DROP COLUMN "Id_Empresa";
ALTER TABLE public.orden_material DROP COLUMN "Id_Empresa";
ALTER TABLE public.material_movimiento DROP COLUMN "Id_Empresa";
ALTER TABLE public.orden_produccion DROP COLUMN "Id_Empresa";
ALTER TABLE public.material DROP COLUMN "Id_Empresa";

-- PÉRDIDA DE DATOS: se eliminan todas las membresías/configuraciones creadas
-- o añadidas tras la migración y las filas de empresa (incluida empresa B vacía).
DROP TABLE public.usuario_empresa;
DROP TABLE public.empresa_config;
DROP TABLE public.empresa;

COMMIT;
