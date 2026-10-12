-- Reconstrucción aproximada del esquema public desde los catálogos exportados el 12/10/2026.
-- No es un respaldo de la base real ni contiene datos de negocio.
-- Fuentes: esquema_real_supabase.csv, catalogo_real_A.csv y catalogo_real_B.csv.
-- Suposiciones/límites:
-- * character varying se crea sin longitud porque el catálogo de columnas no la exporta.
-- * se reconstruyen solo tablas/columnas/defaults, enums, constraints e índices descritos por los CSV.
-- * secuencias comienzan con el last_value exportado; el seed las ajusta al máximo sintético.
-- * no se reconstruyen funciones, triggers, policies ni el estado de RLS; se reportan aparte.
-- * los tipos USER-DEFINED se mapean a enums por las columnas y etiquetas exportadas.
SET search_path TO public;
BEGIN;

CREATE TYPE public.dificultad_orden AS ENUM ('Baja', 'Media', 'Alta');

CREATE TYPE public.estado_comprobante AS ENUM ('Entregado', 'Pendiente');

CREATE TYPE public.estado_orden AS ENUM ('En Proceso', 'Completada', 'Retrasada');

CREATE TYPE public.estado_usuario AS ENUM ('activo', 'inactivo');

CREATE TYPE public.prioridad_orden AS ENUM ('Baja', 'Media', 'Alta');

CREATE SEQUENCE public."comprobantes_Id_Comprobante_seq" START WITH 58;

CREATE SEQUENCE public."material_Id_Material_seq" START WITH 50;

CREATE SEQUENCE public."material_movimiento_Id_Movimiento_seq" START WITH 51;

CREATE SEQUENCE public."observacion_operario_Id_Observacion_seq" START WITH 40;

CREATE SEQUENCE public."orden_operario_Id_Orden_Operario_seq" START WITH 61;

CREATE SEQUENCE public."orden_produccion_Id_Orden_seq" START WITH 192;

CREATE SEQUENCE public."rol_Id_Rol_seq" START WITH 4;

CREATE SEQUENCE public."tokens_recuperacion_id_seq" START WITH 68;

CREATE SEQUENCE public."usuario_Id_Usuario_seq" START WITH 83;

CREATE TABLE public.comprobantes (
  "Id_Comprobante" integer NOT NULL DEFAULT nextval('"comprobantes_Id_Comprobante_seq"'::regclass),
  "Id_Usuario" integer NOT NULL,
  "Id_Orden" integer NOT NULL,
  "Estado" estado_comprobante NOT NULL DEFAULT 'Pendiente'::estado_comprobante,
  "Fecha_Limite" date DEFAULT CURRENT_DATE
);

CREATE TABLE public.google_calendar_tokens (
  "Id_Usuario" integer NOT NULL,
  "Google_Email" character varying DEFAULT NULL::character varying,
  "Google_Id" character varying DEFAULT NULL::character varying,
  "Access_Token" text NOT NULL,
  "Refresh_Token" text,
  "Scope" text,
  "Token_Type" character varying DEFAULT NULL::character varying,
  "Expiry_Date" bigint,
  "Calendar_Id" character varying NOT NULL DEFAULT 'primary'::character varying,
  "Sync_Enabled" boolean NOT NULL DEFAULT true,
  "Last_Login_Google" timestamp without time zone,
  "Last_Sync_At" timestamp without time zone,
  "Created_At" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "Updated_At" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.material (
  "Id_Material" integer NOT NULL DEFAULT nextval('"material_Id_Material_seq"'::regclass),
  "Nombre_Material" character varying NOT NULL,
  "Categoria" character varying NOT NULL,
  "Stock_Actual" integer NOT NULL DEFAULT 0,
  "Unidad" character varying NOT NULL,
  "Stock_Minimo" integer NOT NULL DEFAULT 0,
  "Stock_Maximo" integer NOT NULL DEFAULT 0,
  "Fecha" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "Id_Cliente" integer,
  "Activo" boolean NOT NULL DEFAULT true
);

CREATE TABLE public.material_movimiento (
  "Id_Movimiento" integer NOT NULL DEFAULT nextval('"material_movimiento_Id_Movimiento_seq"'::regclass),
  "Id_Material" integer NOT NULL,
  "Tipo" character varying NOT NULL,
  "Cantidad" numeric NOT NULL,
  "Fecha" timestamp without time zone NOT NULL DEFAULT now(),
  "Nota" text,
  "Id_Orden" integer
);

CREATE TABLE public.observacion_operario (
  "Id_Observacion" integer NOT NULL DEFAULT nextval('"observacion_operario_Id_Observacion_seq"'::regclass),
  "Id_Operario" integer NOT NULL,
  "Id_Orden" integer,
  "Id_Admin" integer NOT NULL,
  "Observacion" character varying NOT NULL,
  "Fecha" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.orden_material (
  "Id_Orden" integer NOT NULL,
  "Id_Producto" integer NOT NULL,
  "Cantidad_Usada" integer NOT NULL
);

CREATE TABLE public.orden_operario (
  "Id_Orden_Operario" integer NOT NULL DEFAULT nextval('"orden_operario_Id_Orden_Operario_seq"'::regclass),
  "Id_Orden" integer NOT NULL,
  "Id_Operario" integer NOT NULL,
  "Numero_Fase" integer NOT NULL,
  "Descripcion_Fase" text,
  "Cantidad_Realizada" integer NOT NULL DEFAULT 0,
  "Estado_Fase" text NOT NULL DEFAULT 'Pendiente'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "Nota_Operario" text,
  "Fecha_Completada" timestamp with time zone
);

CREATE TABLE public.orden_produccion (
  "Id_Orden" integer NOT NULL DEFAULT nextval('"orden_produccion_Id_Orden_seq"'::regclass),
  "Id_Cliente" integer NOT NULL,
  "Id_Material" integer NOT NULL,
  "Producto" character varying DEFAULT NULL::character varying,
  "Cantidad" integer NOT NULL,
  "Prioridad" prioridad_orden NOT NULL DEFAULT 'Media'::prioridad_orden,
  "Fecha_Limite" date NOT NULL,
  "Descripcion" character varying NOT NULL,
  "Dificultad" dificultad_orden NOT NULL DEFAULT 'Media'::dificultad_orden,
  "Estado" estado_orden NOT NULL DEFAULT 'En Proceso'::estado_orden,
  "Unidades_Realizadas" integer,
  "Id_Operario" integer,
  "Unidades" integer,
  "Fecha_Creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.rol (
  "Id_Rol" integer NOT NULL DEFAULT nextval('"rol_Id_Rol_seq"'::regclass),
  "Nombre_Rol" character varying NOT NULL
);

CREATE TABLE public.tokens_recuperacion (
  "id" integer NOT NULL DEFAULT nextval('tokens_recuperacion_id_seq'::regclass),
  "Id_Usuario" integer NOT NULL,
  "token" character varying NOT NULL,
  "expiracion" timestamp without time zone NOT NULL,
  "usado" boolean DEFAULT false
);

CREATE TABLE public.usuario (
  "Id_Usuario" integer NOT NULL DEFAULT nextval('"usuario_Id_Usuario_seq"'::regclass),
  "Id_Rol" integer NOT NULL,
  "Nombre_Completo" character varying NOT NULL,
  "Nombre_Usuario" character varying NOT NULL,
  "Correo" character varying NOT NULL,
  "Telefono" character varying DEFAULT NULL::character varying,
  "Estado" estado_usuario NOT NULL DEFAULT 'activo'::estado_usuario,
  "Contrasena" character varying NOT NULL,
  "Fecha_Registro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.usuario_orden (
  "Id_Usuario" integer NOT NULL,
  "Id_Orden" integer NOT NULL,
  "Funcion" character varying DEFAULT NULL::character varying
);

ALTER TABLE public.comprobantes ADD CONSTRAINT "comprobantes_pkey" PRIMARY KEY ("Id_Comprobante");

ALTER TABLE public.google_calendar_tokens ADD CONSTRAINT "google_calendar_tokens_pkey" PRIMARY KEY ("Id_Usuario");

ALTER TABLE public.material ADD CONSTRAINT "material_Nombre_Material_key" UNIQUE ("Nombre_Material");

ALTER TABLE public.material ADD CONSTRAINT "material_Stock_Minimo_check" CHECK (("Stock_Minimo" >= 0));

ALTER TABLE public.material ADD CONSTRAINT "material_pkey" PRIMARY KEY ("Id_Material");

ALTER TABLE public.material_movimiento ADD CONSTRAINT "material_movimiento_pkey" PRIMARY KEY ("Id_Movimiento");

ALTER TABLE public.observacion_operario ADD CONSTRAINT "observacion_operario_pkey" PRIMARY KEY ("Id_Observacion");

ALTER TABLE public.orden_material ADD CONSTRAINT "orden_material_pkey" PRIMARY KEY ("Id_Orden", "Id_Producto");

ALTER TABLE public.orden_operario ADD CONSTRAINT "orden_operario_cantidad_realizada_check" CHECK (("Cantidad_Realizada" >= 0));

ALTER TABLE public.orden_operario ADD CONSTRAINT "orden_operario_estado_fase_check" CHECK (("Estado_Fase" = ANY (ARRAY['Pendiente'::text, 'En Proceso'::text, 'Completada'::text])));

ALTER TABLE public.orden_operario ADD CONSTRAINT "orden_operario_numero_fase_check" CHECK (("Numero_Fase" > 0));

ALTER TABLE public.orden_operario ADD CONSTRAINT "orden_operario_orden_fase_operario_unique" UNIQUE ("Id_Orden", "Numero_Fase", "Id_Operario");

ALTER TABLE public.orden_operario ADD CONSTRAINT "orden_operario_pkey" PRIMARY KEY ("Id_Orden_Operario");

ALTER TABLE public.orden_produccion ADD CONSTRAINT "orden_produccion_pkey" PRIMARY KEY ("Id_Orden");

ALTER TABLE public.rol ADD CONSTRAINT "rol_Nombre_Rol_key" UNIQUE ("Nombre_Rol");

ALTER TABLE public.rol ADD CONSTRAINT "rol_pkey" PRIMARY KEY ("Id_Rol");

ALTER TABLE public.tokens_recuperacion ADD CONSTRAINT "tokens_recuperacion_id_usuario_unique" UNIQUE ("Id_Usuario");

ALTER TABLE public.tokens_recuperacion ADD CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY (id);

ALTER TABLE public.tokens_recuperacion ADD CONSTRAINT "tokens_recuperacion_token_key" UNIQUE (token);

ALTER TABLE public.usuario ADD CONSTRAINT "usuario_Correo_key" UNIQUE ("Correo");

ALTER TABLE public.usuario ADD CONSTRAINT "usuario_Nombre_Usuario_key" UNIQUE ("Nombre_Usuario");

ALTER TABLE public.usuario ADD CONSTRAINT "usuario_pkey" PRIMARY KEY ("Id_Usuario");

ALTER TABLE public.usuario_orden ADD CONSTRAINT "usuario_orden_pkey" PRIMARY KEY ("Id_Usuario", "Id_Orden");

ALTER TABLE public.comprobantes ADD CONSTRAINT "fk_comp_orden" FOREIGN KEY ("Id_Orden") REFERENCES orden_produccion("Id_Orden") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.comprobantes ADD CONSTRAINT "fk_comp_usuario" FOREIGN KEY ("Id_Usuario") REFERENCES usuario("Id_Usuario") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.google_calendar_tokens ADD CONSTRAINT "fk_gct_usuario" FOREIGN KEY ("Id_Usuario") REFERENCES usuario("Id_Usuario") ON DELETE CASCADE;

ALTER TABLE public.material ADD CONSTRAINT "fk_material_cliente" FOREIGN KEY ("Id_Cliente") REFERENCES usuario("Id_Usuario") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.material_movimiento ADD CONSTRAINT "material_movimiento_Id_Material_fkey" FOREIGN KEY ("Id_Material") REFERENCES material("Id_Material") ON DELETE CASCADE;

ALTER TABLE public.material_movimiento ADD CONSTRAINT "material_movimiento_Id_Orden_fkey" FOREIGN KEY ("Id_Orden") REFERENCES orden_produccion("Id_Orden") ON DELETE SET NULL;

ALTER TABLE public.observacion_operario ADD CONSTRAINT "fk_obs_admin" FOREIGN KEY ("Id_Admin") REFERENCES usuario("Id_Usuario") ON DELETE CASCADE;

ALTER TABLE public.observacion_operario ADD CONSTRAINT "fk_obs_operario" FOREIGN KEY ("Id_Operario") REFERENCES usuario("Id_Usuario") ON DELETE CASCADE;

ALTER TABLE public.observacion_operario ADD CONSTRAINT "fk_obs_orden" FOREIGN KEY ("Id_Orden") REFERENCES orden_produccion("Id_Orden") ON DELETE SET NULL;

ALTER TABLE public.orden_material ADD CONSTRAINT "fk_om_orden" FOREIGN KEY ("Id_Orden") REFERENCES orden_produccion("Id_Orden") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.orden_material ADD CONSTRAINT "fk_om_producto" FOREIGN KEY ("Id_Producto") REFERENCES material("Id_Material") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.orden_operario ADD CONSTRAINT "orden_operario_Id_Operario_fkey" FOREIGN KEY ("Id_Operario") REFERENCES usuario("Id_Usuario");

ALTER TABLE public.orden_operario ADD CONSTRAINT "orden_operario_Id_Orden_fkey" FOREIGN KEY ("Id_Orden") REFERENCES orden_produccion("Id_Orden") ON DELETE CASCADE;

ALTER TABLE public.orden_produccion ADD CONSTRAINT "fk_op_cliente" FOREIGN KEY ("Id_Cliente") REFERENCES usuario("Id_Usuario") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.orden_produccion ADD CONSTRAINT "fk_op_material" FOREIGN KEY ("Id_Material") REFERENCES material("Id_Material") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.orden_produccion ADD CONSTRAINT "fk_op_operario" FOREIGN KEY ("Id_Operario") REFERENCES usuario("Id_Usuario") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.tokens_recuperacion ADD CONSTRAINT "fk_tr_usuario" FOREIGN KEY ("Id_Usuario") REFERENCES usuario("Id_Usuario") ON DELETE CASCADE;

ALTER TABLE public.usuario ADD CONSTRAINT "fk_usuario_rol" FOREIGN KEY ("Id_Rol") REFERENCES rol("Id_Rol") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.usuario_orden ADD CONSTRAINT "fk_uo_orden" FOREIGN KEY ("Id_Orden") REFERENCES orden_produccion("Id_Orden") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.usuario_orden ADD CONSTRAINT "fk_uo_usuario" FOREIGN KEY ("Id_Usuario") REFERENCES usuario("Id_Usuario") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX idx_material_movimiento_material_fecha ON public.material_movimiento USING btree ("Id_Material", "Fecha");

CREATE INDEX idx_material_movimiento_orden ON public.material_movimiento USING btree ("Id_Orden");

CREATE INDEX idx_orden_operario_historial ON public.orden_operario USING btree ("Id_Operario", "Fecha_Completada" DESC) WHERE ("Fecha_Completada" IS NOT NULL);

CREATE INDEX idx_orden_operario_id_operario ON public.orden_operario USING btree ("Id_Operario");

CREATE INDEX idx_orden_operario_id_orden ON public.orden_operario USING btree ("Id_Orden");

COMMIT;