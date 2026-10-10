-- ============================================================================
-- TEXTICODE — DATASET SINTÉTICO PARA VALIDACIÓN EN BASE DESECHABLE
-- ============================================================================
-- Datos de prueba sintéticos limpios y consistentes (CERO datos reales).
-- Permite sembrar el estado previo para validar la migración multiempresa.
-- ============================================================================

BEGIN;

-- 1. Roles estándar
INSERT INTO public.rol ("Id_Rol", "Nombre_Rol") VALUES
  (1, 'Administrador'),
  (2, 'Operario'),
  (3, 'Cliente')
ON CONFLICT ("Id_Rol") DO NOTHING;

-- 2. Usuarios sintéticos de prueba
INSERT INTO public.usuario ("Id_Usuario", "Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Telefono", "Estado", "Id_Rol") VALUES
  (1, 'Admin Principal QA', 'admin_qa', 'qa+admin@texticode.test', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', '3001112233', 'activo', 1),
  (2, 'Operario Confeccion 1', 'operario_1', 'qa+operario1@texticode.test', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', '3002223344', 'activo', 2),
  (3, 'Operario Confeccion 2', 'operario_2', 'qa+operario2@texticode.test', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', '3003334455', 'activo', 2),
  (4, 'Cliente Comercial Alfa', 'cliente_alfa', 'qa+cliente1@texticode.test', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', '3004445566', 'activo', 3),
  (5, 'Cliente Comercial Beta', 'cliente_beta', 'qa+cliente2@texticode.test', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', '3005556677', 'inactivo', 3)
ON CONFLICT ("Id_Usuario") DO NOTHING;

-- 3. Materiales sintéticos
INSERT INTO public.material ("Id_Material", "Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Stock_Minimo", "Stock_Maximo", "Id_Cliente", "Activo") VALUES
  (1, 'Tela Denim 14oz', 'Telas', 150.00, 'Metros', 20.00, 500.00, 4, true),
  (2, 'Hilo Poliester Azul', 'Insumos', 80.00, 'Conos', 10.00, 200.00, NULL, true),
  (3, 'Cremallera Metalica 15cm', 'Herrajes', 300.00, 'Unidades', 50.00, 1000.00, NULL, true),
  (4, 'Boton Pasta 24L', 'Botones', 500.00, 'Unidades', 100.00, 2000.00, NULL, true),
  (5, 'Tela Gabardina Negra', 'Telas', 0.00, 'Metros', 15.00, 300.00, NULL, false) -- Inactivo
ON CONFLICT ("Id_Material") DO NOTHING;

-- 4. Órdenes de producción sintéticas
INSERT INTO public.orden_produccion ("Id_Orden", "Id_Cliente", "Id_Material", "Id_Operario", "Producto", "Descripcion", "Cantidad", "Prioridad", "Fecha_Limite", "Estado", "Unidades", "Unidades_Realizadas", "Dificultad") VALUES
  (1, 4, 1, 2, 'Pantalón Jean Clásico', 'Lote de 50 jeans para cliente Alfa', 50, 'Alta', CURRENT_DATE + INTERVAL '10 days', 'En Proceso', 50, 15, 'Media'),
  (2, 4, 2, 3, 'Chaqueta Denim Ligera', 'Confección de 20 chaquetas', 20, 'Media', CURRENT_DATE + INTERVAL '5 days', 'En Proceso', 20, 5, 'Alta'),
  (3, 4, 3, 2, 'Falda Denim', 'Lote de 30 faldas terminadas', 30, 'Baja', CURRENT_DATE - INTERVAL '2 days', 'Completada', 30, 30, 'Baja')
ON CONFLICT ("Id_Orden") DO NOTHING;

-- 5. Movimientos de material
INSERT INTO public.material_movimiento ("Id_Movimiento", "Id_Material", "Tipo", "Cantidad", "Nota", "Id_Orden") VALUES
  (1, 1, 'Entrada', 150.00, 'Ingreso inicial de bodega', NULL),
  (2, 1, 'Salida', -25.00, 'Consumo en corte Orden #1', 1),
  (3, 2, 'Entrada', 80.00, 'Ingreso inicial', NULL)
ON CONFLICT ("Id_Movimiento") DO NOTHING;

-- 6. Materiales por orden
INSERT INTO public.orden_material ("Id_Orden_Material", "Id_Orden", "Id_Producto", "Cantidad") VALUES
  (1, 1, 1, 25.00),
  (2, 1, 2, 5.00),
  (3, 2, 1, 15.00)
ON CONFLICT ("Id_Orden_Material") DO NOTHING;

-- 7. Fases y operarios
INSERT INTO public.orden_operario ("Id_Orden_Operario", "Id_Orden", "Numero_Fase", "Id_Operario", "Estado_Fase", "Nota_Operario") VALUES
  (1, 1, 1, 2, 'Completada', 'Corte finalizado'),
  (2, 1, 2, 3, 'En Proceso', 'Ensamble de pretina')
ON CONFLICT ("Id_Orden_Operario") DO NOTHING;

-- 8. Asignación usuario a orden
INSERT INTO public.usuario_orden ("Id_Usuario_Orden", "Id_Orden", "Id_Usuario") VALUES
  (1, 1, 2),
  (2, 2, 3)
ON CONFLICT ("Id_Usuario_Orden") DO NOTHING;

-- 9. Comprobantes
INSERT INTO public.comprobantes ("Id_Comprobante", "Id_Orden", "Id_Usuario", "Fecha_Limite", "Estado", "Ruta_PDF") VALUES
  (1, 3, 4, CURRENT_DATE - INTERVAL '2 days', 'Entregado', '/comprobantes/comp_orden_3.pdf')
ON CONFLICT ("Id_Comprobante") DO NOTHING;

-- 10. Observaciones
INSERT INTO public.observacion_operario ("Id_Observacion", "Id_Orden", "Id_Admin", "Id_Operario", "Observacion") VALUES
  (1, 1, 1, 2, 'Verificar tensión de hilo en costura lateral')
ON CONFLICT ("Id_Observacion") DO NOTHING;

-- 11. Google Calendar tokens
INSERT INTO public.google_calendar_tokens ("Id_Usuario", "Google_Id", "Google_Email", "Access_Token", "Refresh_Token", "Expiry_Date", "Scope") VALUES
  (1, 'google_sub_12345', 'qa+admin@gmail.com', 'ya29.mock_access_token', '1//mock_refresh_token', 1791500000000, 'https://www.googleapis.com/auth/calendar')
ON CONFLICT ("Id_Usuario") DO NOTHING;

COMMIT;
