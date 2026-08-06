-- 1.2 · Colunas de guards de transição + tabela de overrides

-- Área jurídica (Família / Inventário / Saúde)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'area_juridica_tipo') THEN
    CREATE TYPE public.area_juridica_tipo AS ENUM ('familia', 'inventario', 'saude');
  END IF;
END$$;

-- contact_submissions
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS primeiro_contato_em timestamptz,
  ADD COLUMN IF NOT EXISTS valor_estimado numeric,
  ADD COLUMN IF NOT EXISTS area_juridica text,
  ADD COLUMN IF NOT EXISTS reuniao_data timestamptz,
  ADD COLUMN IF NOT EXISTS reuniao_notas text,
  ADD COLUMN IF NOT EXISTS advogada_responsavel_id uuid,
  ADD COLUMN IF NOT EXISTS proposta_id uuid,
  ADD COLUMN IF NOT EXISTS contrato_id uuid,
  ADD COLUMN IF NOT EXISTS valor_fechamento numeric,
  ADD COLUMN IF NOT EXISTS contrato_assinado boolean DEFAULT false;

-- leads_geral
ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS primeiro_contato_em timestamptz,
  ADD COLUMN IF NOT EXISTS valor_estimado numeric,
  ADD COLUMN IF NOT EXISTS area_juridica text,
  ADD COLUMN IF NOT EXISTS reuniao_data timestamptz,
  ADD COLUMN IF NOT EXISTS reuniao_notas text,
  ADD COLUMN IF NOT EXISTS advogada_responsavel_id uuid,
  ADD COLUMN IF NOT EXISTS proposta_id uuid,
  ADD COLUMN IF NOT EXISTS contrato_id uuid,
  ADD COLUMN IF NOT EXISTS valor_fechamento numeric,
  ADD COLUMN IF NOT EXISTS contrato_assinado boolean DEFAULT false;

-- FKs (IF NOT EXISTS via DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_advogada_responsavel_id_fkey'
  ) THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_advogada_responsavel_id_fkey
      FOREIGN KEY (advogada_responsavel_id) REFERENCES public.advogados_sdr(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_advogada_responsavel_id_fkey'
  ) THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_advogada_responsavel_id_fkey
      FOREIGN KEY (advogada_responsavel_id) REFERENCES public.advogados_sdr(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_proposta_id_fkey'
  ) THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_proposta_id_fkey
      FOREIGN KEY (proposta_id) REFERENCES public.contratos_gerados(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_contrato_id_fkey'
  ) THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_contrato_id_fkey
      FOREIGN KEY (contrato_id) REFERENCES public.contratos_gerados(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_proposta_id_fkey'
  ) THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_proposta_id_fkey
      FOREIGN KEY (proposta_id) REFERENCES public.contratos_gerados(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_contrato_id_fkey'
  ) THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_contrato_id_fkey
      FOREIGN KEY (contrato_id) REFERENCES public.contratos_gerados(id);
  END IF;
END$$;

-- Check area_juridica
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_area_juridica_check'
  ) THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_area_juridica_check
      CHECK (area_juridica IS NULL OR area_juridica IN ('familia', 'inventario', 'saude'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_area_juridica_check'
  ) THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_area_juridica_check
      CHECK (area_juridica IS NULL OR area_juridica IN ('familia', 'inventario', 'saude'));
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.stage_transitions_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  lead_source text NOT NULL DEFAULT 'contact_submissions'
    CHECK (lead_source IN ('contact_submissions', 'leads_geral')),
  from_stage public.lead_stage,
  to_stage public.lead_stage NOT NULL,
  missing_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stage_transitions_override ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read stage_transitions_override" ON public.stage_transitions_override;
CREATE POLICY "authenticated read stage_transitions_override"
  ON public.stage_transitions_override FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated insert stage_transitions_override" ON public.stage_transitions_override;
CREATE POLICY "authenticated insert stage_transitions_override"
  ON public.stage_transitions_override FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
