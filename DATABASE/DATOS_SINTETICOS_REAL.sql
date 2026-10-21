-- Dataset ficticio para validar la reconstrucción del esquema exportado.
-- No contiene ni copia datos de negocio de Supabase.
BEGIN;

INSERT INTO public.rol ("Id_Rol", "Nombre_Rol") VALUES
  (1, 'Administrador'), (2, 'Operario'), (3, 'Cliente');

INSERT INTO public.usuario
  ("Id_Usuario", "Id_Rol", "Nombre_Completo", "Nombre_Usuario", "Correo", "Estado", "Contrasena", "Telefono")
VALUES
  (1, 1, 'QA Admin Sintético', 'qa_admin_sintetico', 'qa-admin@example.invalid', 'activo', 'NO_AUTENTICABLE', NULL),
  (2, 2, 'QA Operario Sintético', 'qa_operario_sintetico', 'qa-operario@example.invalid', 'activo', 'NO_AUTENTICABLE', NULL),
  (3, 3, 'QA Cliente Sintético', 'qa_cliente_sintetico', 'qa-cliente@example.invalid', 'activo', 'NO_AUTENTICABLE', NULL);

INSERT INTO public.material
  ("Id_Material", "Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Stock_Minimo", "Stock_Maximo", "Id_Cliente", "Activo")
VALUES
  (1, 'Material Sintético A', 'QA', 120, 'unidades', 10, 500, 3, true),
  (2, 'Material Sintético B', 'QA', 80, 'unidades', 5, 300, NULL, true);

INSERT INTO public.orden_produccion
  ("Id_Orden", "Id_Cliente", "Id_Material", "Producto", "Cantidad", "Prioridad", "Fecha_Limite", "Descripcion", "Dificultad", "Estado", "Unidades_Realizadas", "Id_Operario", "Unidades")
VALUES
  (1, 3, 1, 'Producto QA A', 20, 'Alta', CURRENT_DATE + 10, 'Orden sintética de validación', 'Media', 'En Proceso', 4, 2, 20),
  (2, 3, 2, 'Producto QA B', 8, 'Media', CURRENT_DATE + 20, 'Segunda orden sintética', 'Baja', 'Completada', 8, 2, 8);

INSERT INTO public.material_movimiento
  ("Id_Movimiento", "Id_Material", "Tipo", "Cantidad", "Nota", "Id_Orden")
VALUES
  (1, 1, 'Entrada', 120, 'Movimiento ficticio QA', NULL),
  (2, 1, 'Salida', 4, 'Consumo ficticio QA', 1);

INSERT INTO public.orden_material ("Id_Orden", "Id_Producto", "Cantidad_Usada") VALUES
  (1, 2, 3), (2, 1, 2);

INSERT INTO public.orden_operario
  ("Id_Orden_Operario", "Id_Orden", "Id_Operario", "Numero_Fase", "Descripcion_Fase", "Cantidad_Realizada", "Estado_Fase", "Nota_Operario")
VALUES
  (1, 1, 2, 1, 'Fase sintética de corte', 4, 'En Proceso', 'Nota de prueba ficticia');

INSERT INTO public.usuario_orden ("Id_Usuario", "Id_Orden", "Funcion") VALUES
  (2, 1, 'Operario QA'), (3, 2, 'Cliente QA');

INSERT INTO public.comprobantes ("Id_Comprobante", "Id_Usuario", "Id_Orden", "Estado") VALUES
  (1, 3, 2, 'Pendiente');

INSERT INTO public.observacion_operario
  ("Id_Observacion", "Id_Operario", "Id_Orden", "Id_Admin", "Observacion")
VALUES
  (1, 2, 1, 1, 'Observación sintética de QA');

INSERT INTO public.google_calendar_tokens
  ("Id_Usuario", "Access_Token", "Refresh_Token", "Scope", "Token_Type")
VALUES
  (1, 'FAKE-QA-NOT-A-CREDENTIAL', 'FAKE-QA-NOT-A-CREDENTIAL', 'synthetic-only', 'Bearer');

INSERT INTO public.tokens_recuperacion (id, "Id_Usuario", token, expiracion, usado)
VALUES (1, 3, 'synthetic-reset-token-only', CURRENT_TIMESTAMP + INTERVAL '1 day', false);

-- Ajusta cada secuencia a la identidad sintética máxima; no replica contadores reales.
SELECT setval('public."comprobantes_Id_Comprobante_seq"', (SELECT MAX("Id_Comprobante") FROM public.comprobantes), true);
SELECT setval('public."material_Id_Material_seq"', (SELECT MAX("Id_Material") FROM public.material), true);
SELECT setval('public."material_movimiento_Id_Movimiento_seq"', (SELECT MAX("Id_Movimiento") FROM public.material_movimiento), true);
SELECT setval('public."observacion_operario_Id_Observacion_seq"', (SELECT MAX("Id_Observacion") FROM public.observacion_operario), true);
SELECT setval('public."orden_operario_Id_Orden_Operario_seq"', (SELECT MAX("Id_Orden_Operario") FROM public.orden_operario), true);
SELECT setval('public."orden_produccion_Id_Orden_seq"', (SELECT MAX("Id_Orden") FROM public.orden_produccion), true);
SELECT setval('public."rol_Id_Rol_seq"', (SELECT MAX("Id_Rol") FROM public.rol), true);
SELECT setval('public.tokens_recuperacion_id_seq', (SELECT MAX(id) FROM public.tokens_recuperacion), true);
SELECT setval('public."usuario_Id_Usuario_seq"', (SELECT MAX("Id_Usuario") FROM public.usuario), true);

COMMIT;
