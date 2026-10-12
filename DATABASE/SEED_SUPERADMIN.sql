-- Propósito: registrar el rol global superadmin y documentar la creación manual de su usuario.
-- Ejecutar UNA vez después de MIGRACION_FASE_3_DEFINITIVA.sql.
-- Este seed NO está aprobado para Supabase, staging ni ningún entorno compartido.
-- No crea usuario automáticamente. El superadmin es global y no debe tener filas en usuario_empresa.

INSERT INTO public.rol ("Nombre_Rol")
VALUES ('superadmin')
ON CONFLICT ("Nombre_Rol") DO NOTHING;

-- Plantilla opcional: completar manualmente solo en una base local autorizada.
-- Genera <HASH_BCRYPT> localmente con bcryptjs (bcrypt.hash(password, 10)); no guardes la
-- contraseña en el historial de comandos ni pegues aquí una contraseña o hash real.
-- Elige un <ID_ROL_SUPERADMIN> consultando public.rol después de ejecutar el INSERT anterior.
-- INSERT INTO public.usuario
--   ("Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Estado", "Id_Rol")
-- VALUES
--   ('<NOMBRE_COMPLETO>', '<NOMBRE_USUARIO>', '<CORREO>', '<HASH_BCRYPT>', 'activo', <ID_ROL_SUPERADMIN>);
