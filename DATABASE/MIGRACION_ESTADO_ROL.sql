-- Estado de los roles globales: un rol no se elimina, se desactiva.
-- Los usuarios cuyo rol esté inactivo no pueden iniciar sesión ni usar sesiones abiertas
-- hasta que el superadmin lo reactive (igual que con una empresa inactiva).
-- Idempotente: se puede correr más de una vez.
ALTER TABLE public.rol
  ADD COLUMN IF NOT EXISTS "Estado" character varying(10) NOT NULL DEFAULT 'activo';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rol_estado') THEN
    ALTER TABLE public.rol
      ADD CONSTRAINT chk_rol_estado CHECK ("Estado" IN ('activo', 'inactivo'));
  END IF;
END $$;

-- El superadmin nunca puede quedar inactivo (dejaría el sistema sin administración global).
UPDATE public.rol SET "Estado" = 'activo' WHERE lower(trim("Nombre_Rol")) = 'superadmin';
