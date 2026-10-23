-- Registro de correos enviados por empresa (para estadísticas por empresa).
-- Idempotente: se puede correr más de una vez.
CREATE TABLE IF NOT EXISTS public.email_envio (
  "Id_Envio"     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "Id_Empresa"   integer NOT NULL REFERENCES public.empresa("Id_Empresa"),
  "Tipo"         character varying(30) NOT NULL,
  "Destinatario" character varying(200),
  "Id_Orden"     integer,
  "Estado"       character varying(10) NOT NULL DEFAULT 'enviado'
                 CHECK ("Estado" IN ('enviado','error')),
  "Error"        text,
  "Fecha"        timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_envio_empresa_fecha
  ON public.email_envio ("Id_Empresa", "Fecha" DESC);
