BEGIN;

-- Una cuenta Google pertenece al usuario, no a una sola membresía empresarial.
-- Esto permite usuarios multiempresa y al Superadmin global (sin Id_Empresa).
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS fk_gct_usuario_empresa;
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS fk_google_calendar_tokens_empresa;
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS fk_gct_usuario;
ALTER TABLE public.google_calendar_tokens DROP CONSTRAINT IF EXISTS google_calendar_tokens_pkey;
ALTER TABLE public.google_calendar_tokens ALTER COLUMN "Id_Empresa" DROP NOT NULL;

WITH duplicados AS (
  SELECT ctid, row_number() OVER (
    PARTITION BY "Id_Usuario"
    ORDER BY "Updated_At" DESC NULLS LAST, ctid DESC
  ) AS posicion
  FROM public.google_calendar_tokens
)
DELETE FROM public.google_calendar_tokens
WHERE ctid IN (SELECT ctid FROM duplicados WHERE posicion > 1);

ALTER TABLE public.google_calendar_tokens
  ADD CONSTRAINT google_calendar_tokens_pkey PRIMARY KEY ("Id_Usuario");
ALTER TABLE public.google_calendar_tokens
  ADD CONSTRAINT fk_gct_usuario FOREIGN KEY ("Id_Usuario")
  REFERENCES public.usuario("Id_Usuario") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.google_calendar_events (
  "Id_Empresa" integer NOT NULL,
  "Id_Orden" integer NOT NULL,
  "Id_Usuario" integer NOT NULL,
  "Google_Event_Id" text NOT NULL,
  "Calendar_Id" text NOT NULL DEFAULT 'primary',
  "Updated_At" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("Id_Empresa", "Id_Orden", "Id_Usuario"),
  CONSTRAINT fk_gce_empresa FOREIGN KEY ("Id_Empresa") REFERENCES public.empresa("Id_Empresa") ON DELETE CASCADE,
  CONSTRAINT fk_gce_usuario FOREIGN KEY ("Id_Usuario") REFERENCES public.usuario("Id_Usuario") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gce_usuario ON public.google_calendar_events ("Id_Usuario");

COMMIT;
