-- TEXTICODE - BORRADOR SQL MULTIEMPRESA REVISION 2
-- Estado: propuesta tecnica para revision humana.
-- NO EJECUTAR automaticamente.
-- NO ha sido probado contra staging.
-- NO ejecutar contra una base no confirmada como staging.
-- Requiere backup, ventana de mantenimiento, rollback probado y aprobacion explicita.

/*
Resumen de cambios respecto al borrador anterior:
  - Agrega consistencia por empresa con FKs compuestas.
  - Agrega indice unico parcial para una sola empresa principal por usuario.
  - Define google_calendar_tokens por usuario+empresa.
  - Agrega Id_Empresa tambien en tablas derivadas donde se requiere enforcement
    fuerte de base de datos.
  - Incluye validaciones previas/posteriores y rollback detallado.

Tablas reales observadas en public:
  usuario, rol, material, material_movimiento, observacion_operario,
  orden_material, orden_operario, orden_produccion, comprobantes,
  google_calendar_tokens, tokens_recuperacion, usuario_orden.

Decision tecnica de esta revision:
  Aunque varias tablas podrian heredar empresa mediante JOIN, se propone agregar
  Id_Empresa a las tablas relacionales y operativas criticas para permitir FKs
  compuestas y bloquear relaciones cruzadas a nivel de base de datos.
*/

-- =========================================================
-- FASE 0 - PRECHECKS DE SOLO LECTURA
-- =========================================================

/*
SELECT current_database(), current_schema(), current_user, now();

SELECT COUNT(*) AS usuarios FROM public.usuario;
SELECT COUNT(*) AS materiales FROM public.material;
SELECT COUNT(*) AS ordenes FROM public.orden_produccion;
SELECT COUNT(*) AS orden_operario FROM public.orden_operario;
SELECT COUNT(*) AS orden_material FROM public.orden_material;
SELECT COUNT(*) AS comprobantes FROM public.comprobantes;
SELECT COUNT(*) AS material_movimiento FROM public.material_movimiento;
SELECT COUNT(*) AS observacion_operario FROM public.observacion_operario;
SELECT COUNT(*) AS google_calendar_tokens FROM public.google_calendar_tokens;
SELECT COUNT(*) AS usuario_orden FROM public.usuario_orden;

-- Confirmar constraints actuales relevantes:
SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
*/

-- =========================================================
-- FASE 1 - TABLAS BASE MULTIEMPRESA
-- =========================================================

/*
BEGIN;

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

CREATE UNIQUE INDEX usuario_empresa_principal_unique
  ON public.usuario_empresa ("Id_Usuario")
  WHERE "Es_Principal" = true;

CREATE INDEX idx_usuario_empresa_empresa_rol_estado
  ON public.usuario_empresa ("Id_Empresa", "Id_Rol", "Estado");

CREATE INDEX idx_usuario_empresa_usuario_estado
  ON public.usuario_empresa ("Id_Usuario", "Estado");

COMMIT;
*/

-- =========================================================
-- FASE 2 - EMPRESA INICIAL Y MEMBRESIAS EXISTENTES
-- =========================================================

/*
BEGIN;

-- Ajustar nombre/slug con aprobacion previa.
INSERT INTO public.empresa ("Nombre_Empresa", "Slug")
VALUES ('Empresa Principal', 'empresa-principal')
RETURNING "Id_Empresa";

-- Sustituir :ID_EMPRESA_INICIAL por el id retornado.
INSERT INTO public.empresa_config ("Id_Empresa", "Nombre_Comercial")
VALUES (:ID_EMPRESA_INICIAL, 'Empresa Principal');

INSERT INTO public.usuario_empresa
  ("Id_Usuario", "Id_Empresa", "Id_Rol", "Estado", "Es_Principal")
SELECT u."Id_Usuario", :ID_EMPRESA_INICIAL, u."Id_Rol", u."Estado", true
FROM public.usuario u
ON CONFLICT ("Id_Usuario", "Id_Empresa") DO NOTHING;

COMMIT;
*/

-- =========================================================
-- FASE 3 - COLUMNAS Id_Empresa Y BACKFILL
-- =========================================================

/*
BEGIN;

ALTER TABLE public.material ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_produccion ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.material_movimiento ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_material ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.orden_operario ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.usuario_orden ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.comprobantes ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.observacion_operario ADD COLUMN "Id_Empresa" INTEGER;
ALTER TABLE public.google_calendar_tokens ADD COLUMN "Id_Empresa" INTEGER;

UPDATE public.material
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

UPDATE public.orden_produccion
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

UPDATE public.material_movimiento mm
SET "Id_Empresa" = m."Id_Empresa"
FROM public.material m
WHERE mm."Id_Material" = m."Id_Material"
  AND mm."Id_Empresa" IS NULL;

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

-- Observaciones sin orden asociada heredan la empresa inicial durante backfill.
UPDATE public.observacion_operario
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

UPDATE public.google_calendar_tokens
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

COMMIT;
*/

-- =========================================================
-- FASE 4 - VALIDACIONES ANTES DE NOT NULL/FKS
-- =========================================================

/*
-- Todas deben devolver 0.
SELECT COUNT(*) AS material_sin_empresa
FROM public.material WHERE "Id_Empresa" IS NULL;

SELECT COUNT(*) AS orden_sin_empresa
FROM public.orden_produccion WHERE "Id_Empresa" IS NULL;

SELECT COUNT(*) AS movimiento_sin_empresa
FROM public.material_movimiento WHERE "Id_Empresa" IS NULL;

SELECT COUNT(*) AS orden_material_sin_empresa
FROM public.orden_material WHERE "Id_Empresa" IS NULL;

SELECT COUNT(*) AS orden_operario_sin_empresa
FROM public.orden_operario WHERE "Id_Empresa" IS NULL;

SELECT COUNT(*) AS comprobante_sin_empresa
FROM public.comprobantes WHERE "Id_Empresa" IS NULL;

SELECT COUNT(*) AS observacion_sin_empresa
FROM public.observacion_operario WHERE "Id_Empresa" IS NULL;

SELECT COUNT(*) AS google_token_sin_empresa
FROM public.google_calendar_tokens WHERE "Id_Empresa" IS NULL;

-- Inconsistencias cruzadas: todas deben devolver 0.
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

-- =========================================================
-- FASE 5 - CONSTRAINTS, FKS COMPUESTAS E INDICES
-- =========================================================

/*
BEGIN;

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

-- Referencias compuestas necesarias para FKs cruzadas.
CREATE UNIQUE INDEX material_id_empresa_unique
  ON public.material ("Id_Material", "Id_Empresa");

CREATE UNIQUE INDEX orden_produccion_id_empresa_unique
  ON public.orden_produccion ("Id_Orden", "Id_Empresa");

-- Material: nombre unico solo dentro de empresa.
ALTER TABLE public.material
  DROP CONSTRAINT IF EXISTS "material_Nombre_Material_key";

CREATE UNIQUE INDEX material_empresa_nombre_unique
  ON public.material ("Id_Empresa", "Nombre_Material");

-- Orden debe usar material, cliente y operario de la misma empresa.
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

-- Material asignado a cliente final de la misma empresa.
ALTER TABLE public.material
  ADD CONSTRAINT fk_material_cliente_empresa
    FOREIGN KEY ("Id_Cliente", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- Movimientos de material dentro de la misma empresa.
ALTER TABLE public.material_movimiento
  ADD CONSTRAINT fk_material_movimiento_material_empresa
    FOREIGN KEY ("Id_Material", "Id_Empresa")
    REFERENCES public.material ("Id_Material", "Id_Empresa"),
  ADD CONSTRAINT fk_material_movimiento_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa");

-- Orden-material: la orden y el material pertenecen a la misma empresa.
ALTER TABLE public.orden_material
  ADD CONSTRAINT fk_om_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_om_producto_empresa
    FOREIGN KEY ("Id_Producto", "Id_Empresa")
    REFERENCES public.material ("Id_Material", "Id_Empresa");

-- Orden-operario: la fase, orden y operario pertenecen a la misma empresa.
ALTER TABLE public.orden_operario
  ADD CONSTRAINT fk_oo_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_oo_operario_empresa
    FOREIGN KEY ("Id_Operario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- Usuario-orden: usuario asignado y orden de la misma empresa.
ALTER TABLE public.usuario_orden
  ADD CONSTRAINT fk_uo_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_uo_usuario_empresa
    FOREIGN KEY ("Id_Usuario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- Comprobantes: usuario y orden dentro de la misma empresa.
ALTER TABLE public.comprobantes
  ADD CONSTRAINT fk_comp_orden_empresa
    FOREIGN KEY ("Id_Orden", "Id_Empresa")
    REFERENCES public.orden_produccion ("Id_Orden", "Id_Empresa"),
  ADD CONSTRAINT fk_comp_usuario_empresa
    FOREIGN KEY ("Id_Usuario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- Observaciones: admin, operario y orden dentro de la misma empresa.
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

-- Google Calendar por usuario+empresa.
ALTER TABLE public.google_calendar_tokens
  DROP CONSTRAINT IF EXISTS google_calendar_tokens_pkey;

ALTER TABLE public.google_calendar_tokens
  ADD CONSTRAINT google_calendar_tokens_pkey
  PRIMARY KEY ("Id_Usuario", "Id_Empresa");

ALTER TABLE public.google_calendar_tokens
  ADD CONSTRAINT fk_gct_usuario_empresa
    FOREIGN KEY ("Id_Usuario", "Id_Empresa")
    REFERENCES public.usuario_empresa ("Id_Usuario", "Id_Empresa");

-- Indices por empresa para rutas y reportes.
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

-- =========================================================
-- FASE 6 - VALIDACIONES POSTERIORES
-- =========================================================

/*
-- Todas deben devolver 0.
SELECT COUNT(*) AS orden_material_inconsistente
FROM public.orden_material om
JOIN public.orden_produccion op ON op."Id_Orden" = om."Id_Orden"
JOIN public.material m ON m."Id_Material" = om."Id_Producto"
WHERE om."Id_Empresa" <> op."Id_Empresa"
   OR om."Id_Empresa" <> m."Id_Empresa";

SELECT COUNT(*) AS orden_operario_inconsistente
FROM public.orden_operario oo
LEFT JOIN public.orden_produccion op
  ON op."Id_Orden" = oo."Id_Orden"
 AND op."Id_Empresa" = oo."Id_Empresa"
LEFT JOIN public.usuario_empresa ue
  ON ue."Id_Usuario" = oo."Id_Operario"
 AND ue."Id_Empresa" = oo."Id_Empresa"
WHERE op."Id_Orden" IS NULL
   OR ue."Id_Usuario" IS NULL;

SELECT COUNT(*) AS usuario_orden_inconsistente
FROM public.usuario_orden uo
LEFT JOIN public.orden_produccion op
  ON op."Id_Orden" = uo."Id_Orden"
 AND op."Id_Empresa" = uo."Id_Empresa"
LEFT JOIN public.usuario_empresa ue
  ON ue."Id_Usuario" = uo."Id_Usuario"
 AND ue."Id_Empresa" = uo."Id_Empresa"
WHERE op."Id_Orden" IS NULL
   OR ue."Id_Usuario" IS NULL;

SELECT COUNT(*) AS comprobantes_inconsistentes
FROM public.comprobantes c
LEFT JOIN public.orden_produccion op
  ON op."Id_Orden" = c."Id_Orden"
 AND op."Id_Empresa" = c."Id_Empresa"
LEFT JOIN public.usuario_empresa ue
  ON ue."Id_Usuario" = c."Id_Usuario"
 AND ue."Id_Empresa" = c."Id_Empresa"
WHERE op."Id_Orden" IS NULL
   OR ue."Id_Usuario" IS NULL;

SELECT COUNT(*) AS google_tokens_sin_membresia
FROM public.google_calendar_tokens g
LEFT JOIN public.usuario_empresa ue
  ON ue."Id_Usuario" = g."Id_Usuario"
 AND ue."Id_Empresa" = g."Id_Empresa"
WHERE ue."Id_Usuario" IS NULL;
*/

-- =========================================================
-- FASE 7 - RLS DEFENSIVO (BORRADOR, NO ACTIVAR AUN)
-- =========================================================

/*
-- Requiere que el backend use transaccion por request o SET LOCAL antes
-- de cada consulta, y requiere probar con el rol real de conexion.

-- Ejemplo:
-- BEGIN;
-- SELECT set_config('app.current_empresa_id', '1', true);
-- SELECT ...;
-- COMMIT;

-- Politica conceptual para tabla raiz:
-- ALTER TABLE public.material ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY material_empresa_policy ON public.material
-- USING ("Id_Empresa"::text = current_setting('app.current_empresa_id', true))
-- WITH CHECK ("Id_Empresa"::text = current_setting('app.current_empresa_id', true));
*/

-- =========================================================
-- ROLLBACK DETALLADO POR FASE
-- =========================================================

/*
Rollback fase 7:
  DROP POLICY IF EXISTS material_empresa_policy ON public.material;
  ALTER TABLE public.material DISABLE ROW LEVEL SECURITY;

Rollback fase 5:
  ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS fk_gct_usuario_empresa;
  ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS google_calendar_tokens_pkey;
  ALTER TABLE public.google_calendar_tokens ADD PRIMARY KEY ("Id_Usuario");

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
  ALTER TABLE public.orden_produccion DROP CONSTRAINT IF EXISTS fk_op_operario_empresa;
  ALTER TABLE public.orden_produccion DROP CONSTRAINT IF EXISTS fk_op_cliente_empresa;
  ALTER TABLE public.orden_produccion DROP CONSTRAINT IF EXISTS fk_op_material_empresa;
  ALTER TABLE public.material DROP CONSTRAINT IF EXISTS fk_material_cliente_empresa;

  DROP INDEX IF EXISTS public.idx_google_calendar_empresa_usuario;
  DROP INDEX IF EXISTS public.idx_comprobantes_empresa_orden;
  DROP INDEX IF EXISTS public.idx_orden_operario_empresa_operario;
  DROP INDEX IF EXISTS public.idx_orden_produccion_empresa_operario;
  DROP INDEX IF EXISTS public.idx_orden_produccion_empresa_cliente;
  DROP INDEX IF EXISTS public.idx_orden_produccion_empresa_estado;
  DROP INDEX IF EXISTS public.idx_material_empresa_cliente;
  DROP INDEX IF EXISTS public.idx_material_empresa_activo;
  DROP INDEX IF EXISTS public.material_empresa_nombre_unique;
  DROP INDEX IF EXISTS public.orden_produccion_id_empresa_unique;
  DROP INDEX IF EXISTS public.material_id_empresa_unique;

  -- Restaurar unico global de material solo si no hay duplicados por nombre.
  -- ALTER TABLE public.material ADD CONSTRAINT "material_Nombre_Material_key" UNIQUE ("Nombre_Material");

Rollback fase 3:
  ALTER TABLE public.google_calendar_tokens DROP COLUMN IF EXISTS "Id_Empresa";
  ALTER TABLE public.observacion_operario DROP COLUMN IF EXISTS "Id_Empresa";
  ALTER TABLE public.comprobantes DROP COLUMN IF EXISTS "Id_Empresa";
  ALTER TABLE public.usuario_orden DROP COLUMN IF EXISTS "Id_Empresa";
  ALTER TABLE public.orden_operario DROP COLUMN IF EXISTS "Id_Empresa";
  ALTER TABLE public.orden_material DROP COLUMN IF EXISTS "Id_Empresa";
  ALTER TABLE public.material_movimiento DROP COLUMN IF EXISTS "Id_Empresa";
  ALTER TABLE public.orden_produccion DROP COLUMN IF EXISTS "Id_Empresa";
  ALTER TABLE public.material DROP COLUMN IF EXISTS "Id_Empresa";

Rollback fase 1/2:
  DROP TABLE IF EXISTS public.usuario_empresa;
  DROP TABLE IF EXISTS public.empresa_config;
  DROP TABLE IF EXISTS public.empresa;

Nota:
  El rollback debe probarse en staging. Si ya se libera codigo que depende
  de Id_Empresa, no eliminar columnas sin revertir primero el codigo.
*/
