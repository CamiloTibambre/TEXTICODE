-- TEXTICODE - BORRADOR SQL MULTIEMPRESA
-- Estado: propuesta para revision humana.
-- NO EJECUTAR automaticamente.
-- NO ha sido probado contra staging.
-- Requiere backup, confirmacion de entorno y aprobacion explicita antes de usarse.

/*
Objetivo:
  Preparar el esquema para aislamiento multiempresa.

Supuestos observados:
  - Esquema principal: public.
  - Tablas raiz actuales: usuario, rol, material, orden_produccion.
  - Tablas derivadas: material_movimiento, orden_material, orden_operario,
    usuario_orden, comprobantes, observacion_operario, tokens_recuperacion.

Decisiones pendientes antes de ejecutar:
  1. Confirmar que la base es staging.
  2. Confirmar nombre de empresa inicial.
  3. Confirmar si correo de usuario sera unico global.
  4. Confirmar si Google Calendar sera por usuario global o por usuario+empresa.
*/

-- =========================================================
-- FASE 0 - PRECHECKS MANUALES
-- =========================================================

-- Ejecutar solo lecturas antes de cualquier cambio:
-- SELECT current_database(), current_schema(), current_user, now();
-- SELECT COUNT(*) FROM public.usuario;
-- SELECT COUNT(*) FROM public.material;
-- SELECT COUNT(*) FROM public.orden_produccion;

-- =========================================================
-- FASE 1 - TABLAS BASE
-- =========================================================

/*
CREATE TABLE public.empresa (
  "Id_Empresa" SERIAL PRIMARY KEY,
  "Nombre_Empresa" VARCHAR(160) NOT NULL,
  "Slug" VARCHAR(80) NOT NULL,
  "Estado" VARCHAR(20) NOT NULL DEFAULT 'activa',
  "Fecha_Creacion" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT empresa_slug_key UNIQUE ("Slug"),
  CONSTRAINT empresa_estado_check CHECK ("Estado" IN ('activa', 'inactiva'))
);

CREATE TABLE public.empresa_config (
  "Id_Empresa" INTEGER PRIMARY KEY REFERENCES public.empresa("Id_Empresa") ON DELETE CASCADE,
  "Zona_Horaria" VARCHAR(80) NOT NULL DEFAULT 'America/Bogota',
  "Moneda" VARCHAR(10) NOT NULL DEFAULT 'COP',
  "Nombre_Comercial" VARCHAR(160),
  "Email_Notificaciones" VARCHAR(160),
  "Config_JSON" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "Updated_At" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.usuario_empresa (
  "Id_Usuario" INTEGER NOT NULL REFERENCES public.usuario("Id_Usuario") ON DELETE CASCADE,
  "Id_Empresa" INTEGER NOT NULL REFERENCES public.empresa("Id_Empresa") ON DELETE CASCADE,
  "Id_Rol" INTEGER NOT NULL REFERENCES public.rol("Id_Rol"),
  "Estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
  "Es_Principal" BOOLEAN NOT NULL DEFAULT false,
  "Fecha_Registro" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("Id_Usuario", "Id_Empresa"),
  CONSTRAINT usuario_empresa_estado_check CHECK ("Estado" IN ('activo', 'inactivo'))
);

CREATE INDEX idx_usuario_empresa_empresa_rol_estado
  ON public.usuario_empresa ("Id_Empresa", "Id_Rol", "Estado");

CREATE INDEX idx_usuario_empresa_usuario_estado
  ON public.usuario_empresa ("Id_Usuario", "Estado");
*/

-- =========================================================
-- FASE 2 - EMPRESA INICIAL Y BACKFILL
-- =========================================================

/*
-- Ajustar valores antes de ejecutar.
INSERT INTO public.empresa ("Nombre_Empresa", "Slug")
VALUES ('Empresa Principal', 'empresa-principal')
RETURNING "Id_Empresa";

-- Sustituir :ID_EMPRESA_INICIAL por el id retornado.
INSERT INTO public.empresa_config ("Id_Empresa", "Nombre_Comercial")
VALUES (:ID_EMPRESA_INICIAL, 'Empresa Principal');

INSERT INTO public.usuario_empresa ("Id_Usuario", "Id_Empresa", "Id_Rol", "Estado", "Es_Principal")
SELECT u."Id_Usuario", :ID_EMPRESA_INICIAL, u."Id_Rol", u."Estado", true
FROM public.usuario u
ON CONFLICT ("Id_Usuario", "Id_Empresa") DO NOTHING;
*/

-- =========================================================
-- FASE 3 - COLUMNAS DE EMPRESA EN TABLAS RAIZ
-- =========================================================

/*
ALTER TABLE public.material
  ADD COLUMN "Id_Empresa" INTEGER;

ALTER TABLE public.orden_produccion
  ADD COLUMN "Id_Empresa" INTEGER;

-- Decision recomendada: Calendar por empresa activa.
ALTER TABLE public.google_calendar_tokens
  ADD COLUMN "Id_Empresa" INTEGER;

UPDATE public.material
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

UPDATE public.orden_produccion
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

UPDATE public.google_calendar_tokens
SET "Id_Empresa" = :ID_EMPRESA_INICIAL
WHERE "Id_Empresa" IS NULL;

ALTER TABLE public.material
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_material_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.orden_produccion
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_orden_produccion_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");

ALTER TABLE public.google_calendar_tokens
  ALTER COLUMN "Id_Empresa" SET NOT NULL,
  ADD CONSTRAINT fk_google_calendar_tokens_empresa
    FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa");
*/

-- =========================================================
-- FASE 4 - RESTRICCIONES E INDICES
-- =========================================================

/*
-- Material deja de ser unico global por nombre.
ALTER TABLE public.material
  DROP CONSTRAINT IF EXISTS "material_Nombre_Material_key";

CREATE UNIQUE INDEX material_empresa_nombre_unique
  ON public.material ("Id_Empresa", "Nombre_Material");

CREATE INDEX idx_material_empresa_activo
  ON public.material ("Id_Empresa", "Activo");

CREATE INDEX idx_orden_produccion_empresa_estado
  ON public.orden_produccion ("Id_Empresa", "Estado");

CREATE INDEX idx_orden_produccion_empresa_cliente
  ON public.orden_produccion ("Id_Empresa", "Id_Cliente");

CREATE INDEX idx_orden_produccion_empresa_operario
  ON public.orden_produccion ("Id_Empresa", "Id_Operario");

-- Si Calendar pasa a ser por usuario+empresa:
ALTER TABLE public.google_calendar_tokens
  DROP CONSTRAINT IF EXISTS google_calendar_tokens_pkey;

ALTER TABLE public.google_calendar_tokens
  ADD CONSTRAINT google_calendar_tokens_pkey
  PRIMARY KEY ("Id_Usuario", "Id_Empresa");
*/

-- =========================================================
-- FASE 5 - VALIDACIONES POST-MIGRACION
-- =========================================================

/*
-- Registros raiz sin empresa: deben ser 0.
SELECT COUNT(*) AS material_sin_empresa
FROM public.material
WHERE "Id_Empresa" IS NULL;

SELECT COUNT(*) AS ordenes_sin_empresa
FROM public.orden_produccion
WHERE "Id_Empresa" IS NULL;

-- Usuarios sin membresia: debe ser 0 para usuarios actuales.
SELECT COUNT(*) AS usuarios_sin_empresa
FROM public.usuario u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.usuario_empresa ue
  WHERE ue."Id_Usuario" = u."Id_Usuario"
);

-- Materiales usados por ordenes de otra empresa: debe ser 0.
SELECT COUNT(*) AS orden_material_empresa_inconsistente
FROM public.orden_produccion op
JOIN public.material m ON m."Id_Material" = op."Id_Material"
WHERE op."Id_Empresa" <> m."Id_Empresa";
*/

-- =========================================================
-- FASE 6 - RLS DEFENSIVO (BORRADOR)
-- =========================================================

/*
-- Esta seccion requiere confirmar el rol real usado por el backend.
-- No activar hasta tener pruebas de aislamiento Empresa A/B.

-- Ejemplo conceptual:
-- ALTER TABLE public.material ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY material_empresa_policy
-- ON public.material
-- USING (
--   "Id_Empresa"::text = current_setting('app.current_empresa_id', true)
-- )
-- WITH CHECK (
--   "Id_Empresa"::text = current_setting('app.current_empresa_id', true)
-- );
*/

-- =========================================================
-- ROLLBACK CONCEPTUAL
-- =========================================================

/*
Rollback depende de la fase alcanzada.
Antes de produccion debe existir un archivo rollback probado en staging.

Ejemplos conceptuales:
  - Eliminar politicas RLS nuevas.
  - Restaurar PK anterior de google_calendar_tokens si se cambio.
  - Restaurar unique global de material si no hay duplicados.
  - Eliminar FKs nuevas.
  - Eliminar columnas Id_Empresa solo si no se libero codigo que dependa de ellas.
*/
