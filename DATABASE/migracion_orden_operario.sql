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
  "Estado_Fase" TEXT NOT NULL DEFAULT 'Pendiente',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orden_operario_estado_fase_check
    CHECK ("Estado_Fase" IN ('Pendiente', 'En Proceso', 'Completada')),
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

ALTER TABLE orden_produccion
  ALTER COLUMN "Id_Operario" DROP NOT NULL;

COMMIT;
