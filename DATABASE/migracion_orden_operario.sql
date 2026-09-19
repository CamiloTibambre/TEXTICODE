-- Texticode - multiples operarios por fase en ordenes de produccion
-- Ejecutar manualmente en Supabase SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS orden_operario (
  "Id_Orden_Operario" SERIAL PRIMARY KEY,
  "Id_Orden" INTEGER NOT NULL REFERENCES orden_produccion("Id_Orden") ON DELETE CASCADE,
  "Id_Operario" INTEGER NOT NULL REFERENCES usuario("Id_Usuario"),
  "Numero_Fase" INTEGER NOT NULL,
  "Descripcion_Fase" TEXT,
  "Cantidad_Realizada" INTEGER NOT NULL DEFAULT 0,
  "Estado_Fase" TEXT NOT NULL DEFAULT 'En Proceso',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orden_operario_estado_fase_check
    CHECK ("Estado_Fase" IN ('Retrasada', 'En Proceso', 'Completada')),
  CONSTRAINT orden_operario_numero_fase_check CHECK ("Numero_Fase" > 0),
  CONSTRAINT orden_operario_cantidad_realizada_check CHECK ("Cantidad_Realizada" >= 0),
  CONSTRAINT orden_operario_orden_fase_unique UNIQUE ("Id_Orden", "Numero_Fase")
);

CREATE INDEX IF NOT EXISTS idx_orden_operario_id_orden
  ON orden_operario ("Id_Orden");

CREATE INDEX IF NOT EXISTS idx_orden_operario_id_operario
  ON orden_operario ("Id_Operario");

CREATE OR REPLACE FUNCTION set_orden_operario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orden_operario_updated_at ON orden_operario;

CREATE TRIGGER trg_orden_operario_updated_at
BEFORE UPDATE ON orden_operario
FOR EACH ROW
EXECUTE FUNCTION set_orden_operario_updated_at();

-- Una fase se completa en un único acto. La nota y la fecha se almacenan
-- en la base de datos para que el historial sea igual en web y móvil.
ALTER TABLE orden_operario
  ADD COLUMN IF NOT EXISTS "Nota_Operario" TEXT,
  ADD COLUMN IF NOT EXISTS "Fecha_Completada" TIMESTAMPTZ;

-- Normaliza instalaciones previas que todavía conservaron el estado legado.
UPDATE orden_operario
SET "Estado_Fase" = 'En Proceso'
WHERE "Estado_Fase" = 'Pendiente';

ALTER TABLE orden_operario
  DROP CONSTRAINT IF EXISTS orden_operario_estado_fase_check;

ALTER TABLE orden_operario
  ADD CONSTRAINT orden_operario_estado_fase_check
  CHECK ("Estado_Fase" IN ('Retrasada', 'En Proceso', 'Completada'));

ALTER TABLE orden_operario
  ALTER COLUMN "Estado_Fase" SET DEFAULT 'En Proceso';

CREATE INDEX IF NOT EXISTS idx_orden_operario_historial
  ON orden_operario ("Id_Operario", "Fecha_Completada" DESC)
  WHERE "Fecha_Completada" IS NOT NULL;

ALTER TABLE orden_produccion
  ALTER COLUMN "Id_Operario" DROP NOT NULL;

COMMIT;
