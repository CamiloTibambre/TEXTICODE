-- ============================================================================
-- TEXTICODE — ESQUEMA INICIAL REPRODUCIBLE (PRE-MIGRACIÓN MULTIEMPRESA)
-- ============================================================================
-- Representa exactamente la estructura actual existente en Supabase PostgreSQL
-- antes de aplicar cualquier cambio multiempresa.
-- Permite levantar el entorno inicial en una base de datos local desechable.
-- ============================================================================

BEGIN;

-- 1. Catálogo de roles
CREATE TABLE IF NOT EXISTS public.rol (
  "Id_Rol" SERIAL PRIMARY KEY,
  "Nombre_Rol" VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Usuarios globales
CREATE TABLE IF NOT EXISTS public.usuario (
  "Id_Usuario" SERIAL PRIMARY KEY,
  "Nombre_Completo" VARCHAR(150) NOT NULL,
  "Nombre_Usuario" VARCHAR(80) NOT NULL UNIQUE,
  "Correo" VARCHAR(150) NOT NULL UNIQUE,
  "Contrasena" VARCHAR(255) NOT NULL,
  "Telefono" VARCHAR(50),
  "Estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
  "Fecha_Registro" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "Id_Rol" INTEGER NOT NULL REFERENCES public.rol("Id_Rol")
);

-- 3. Materiales de inventario
CREATE TABLE IF NOT EXISTS public.material (
  "Id_Material" SERIAL PRIMARY KEY,
  "Nombre_Material" VARCHAR(120) NOT NULL UNIQUE,
  "Categoria" VARCHAR(80) NOT NULL,
  "Stock_Actual" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "Unidad" VARCHAR(30) NOT NULL,
  "Stock_Minimo" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "Stock_Maximo" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "Id_Cliente" INTEGER REFERENCES public.usuario("Id_Usuario"),
  "Activo" BOOLEAN NOT NULL DEFAULT true
);

-- 4. Órdenes de producción
CREATE TABLE IF NOT EXISTS public.orden_produccion (
  "Id_Orden" SERIAL PRIMARY KEY,
  "Id_Cliente" INTEGER NOT NULL REFERENCES public.usuario("Id_Usuario"),
  "Id_Material" INTEGER NOT NULL REFERENCES public.material("Id_Material"),
  "Id_Operario" INTEGER REFERENCES public.usuario("Id_Usuario"),
  "Producto" VARCHAR(150),
  "Descripcion" TEXT NOT NULL,
  "Cantidad" INTEGER NOT NULL,
  "Prioridad" VARCHAR(30) NOT NULL DEFAULT 'Media',
  "Fecha_Creacion" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "Fecha_Limite" DATE NOT NULL,
  "Estado" VARCHAR(40) NOT NULL DEFAULT 'En Proceso',
  "Unidades" INTEGER,
  "Unidades_Realizadas" INTEGER DEFAULT 0,
  "Dificultad" VARCHAR(30) DEFAULT 'Media'
);

-- 5. Movimientos de material
CREATE TABLE IF NOT EXISTS public.material_movimiento (
  "Id_Movimiento" SERIAL PRIMARY KEY,
  "Id_Material" INTEGER NOT NULL REFERENCES public.material("Id_Material"),
  "Tipo" VARCHAR(50) NOT NULL,
  "Cantidad" NUMERIC(12, 2) NOT NULL,
  "Fecha" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "Nota" TEXT,
  "Id_Orden" INTEGER REFERENCES public.orden_produccion("Id_Orden")
);

-- 6. Materiales por orden
CREATE TABLE IF NOT EXISTS public.orden_material (
  "Id_Orden_Material" SERIAL PRIMARY KEY,
  "Id_Orden" INTEGER NOT NULL REFERENCES public.orden_produccion("Id_Orden") ON DELETE CASCADE,
  "Id_Producto" INTEGER NOT NULL REFERENCES public.material("Id_Material"),
  "Cantidad" NUMERIC(12, 2) NOT NULL
);

-- 7. Operarios asignados por fase
CREATE TABLE IF NOT EXISTS public.orden_operario (
  "Id_Orden_Operario" SERIAL PRIMARY KEY,
  "Id_Orden" INTEGER NOT NULL REFERENCES public.orden_produccion("Id_Orden") ON DELETE CASCADE,
  "Numero_Fase" INTEGER NOT NULL,
  "Id_Operario" INTEGER NOT NULL REFERENCES public.usuario("Id_Usuario"),
  "Estado_Fase" VARCHAR(40) NOT NULL DEFAULT 'Pendiente',
  "Nota_Operario" TEXT,
  CONSTRAINT orden_fase_operario_unique UNIQUE ("Id_Orden", "Numero_Fase", "Id_Operario")
);

-- 8. Asignación usuario a orden
CREATE TABLE IF NOT EXISTS public.usuario_orden (
  "Id_Usuario_Orden" SERIAL PRIMARY KEY,
  "Id_Orden" INTEGER NOT NULL REFERENCES public.orden_produccion("Id_Orden") ON DELETE CASCADE,
  "Id_Usuario" INTEGER NOT NULL REFERENCES public.usuario("Id_Usuario") ON DELETE CASCADE
);

-- 9. Comprobantes
CREATE TABLE IF NOT EXISTS public.comprobantes (
  "Id_Comprobante" SERIAL PRIMARY KEY,
  "Id_Orden" INTEGER NOT NULL REFERENCES public.orden_produccion("Id_Orden") ON DELETE CASCADE,
  "Id_Usuario" INTEGER NOT NULL REFERENCES public.usuario("Id_Usuario"),
  "Fecha_Limite" DATE,
  "Estado" VARCHAR(40),
  "Ruta_PDF" TEXT
);

-- 10. Observaciones de operario
CREATE TABLE IF NOT EXISTS public.observacion_operario (
  "Id_Observacion" SERIAL PRIMARY KEY,
  "Id_Orden" INTEGER REFERENCES public.orden_produccion("Id_Orden") ON DELETE CASCADE,
  "Id_Admin" INTEGER NOT NULL REFERENCES public.usuario("Id_Usuario"),
  "Id_Operario" INTEGER NOT NULL REFERENCES public.usuario("Id_Usuario"),
  "Observacion" TEXT NOT NULL,
  "Fecha" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Google Calendar tokens (PK simple actual: Id_Usuario)
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  "Id_Usuario" INTEGER PRIMARY KEY REFERENCES public.usuario("Id_Usuario") ON DELETE CASCADE,
  "Google_Id" VARCHAR(100),
  "Google_Email" VARCHAR(150),
  "Access_Token" TEXT,
  "Refresh_Token" TEXT,
  "Expiry_Date" BIGINT,
  "Scope" TEXT,
  "Updated_At" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS public.tokens_recuperacion (
  "id" SERIAL PRIMARY KEY,
  "Id_Usuario" INTEGER NOT NULL REFERENCES public.usuario("Id_Usuario") ON DELETE CASCADE,
  "token" VARCHAR(120) NOT NULL,
  "expiracion" TIMESTAMP WITH TIME ZONE NOT NULL,
  "usado" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT tokens_recuperacion_usuario_key UNIQUE ("Id_Usuario")
);

COMMIT;
