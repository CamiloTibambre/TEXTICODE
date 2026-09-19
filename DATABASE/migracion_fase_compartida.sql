BEGIN;
ALTER TABLE orden_operario
  DROP CONSTRAINT IF EXISTS orden_operario_orden_fase_unique;
ALTER TABLE orden_operario
  ADD CONSTRAINT orden_operario_orden_fase_operario_unique
  UNIQUE ("Id_Orden", "Numero_Fase", "Id_Operario");
COMMIT;