-- Bloco 3 · Bot WhatsApp
-- 2.1 desqualificado + 2.3/2.4/2.5 estrutura de respostas + 2.2 RPC round-robin

-- 1) Enum lead_stage: adicionar 'desqualificado' (PG15+; IF NOT EXISTS desde PG 9.3+)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
    BEGIN
      ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'desqualificado';
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- já existe
    END;
  END IF;
END$$;

-- 2) Colunas de desqualificação / flags de qualificação em leads_geral
ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS desqualificado_motivo text,
  ADD COLUMN IF NOT EXISTS desqualificado_em timestamptz,
  ADD COLUMN IF NOT EXISTS prioridade_max boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS caso_forte boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_minimo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS produto_diferente boolean DEFAULT false;

-- 3) Tabela estruturada (1 linha por lead) — não sobrescreve qualificacoes_sdr
--    (que continua 1 linha por pergunta para o histórico/UI).
CREATE TABLE IF NOT EXISTS public.qualificacao_estruturada_sdr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.leads_geral(id) ON DELETE CASCADE,
  respostas_familia jsonb,
  respostas_inventario jsonb,
  respostas_saude jsonb,
  completa_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qualificacao_estruturada_sdr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read qualificacao_estruturada_sdr"
  ON public.qualificacao_estruturada_sdr;
CREATE POLICY "authenticated read qualificacao_estruturada_sdr"
  ON public.qualificacao_estruturada_sdr FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "service role write qualificacao_estruturada_sdr"
  ON public.qualificacao_estruturada_sdr;
-- service_role bypassa RLS; policy authenticated insert opcional pra painel
CREATE POLICY "authenticated insert qualificacao_estruturada_sdr"
  ON public.qualificacao_estruturada_sdr FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated update qualificacao_estruturada_sdr"
  ON public.qualificacao_estruturada_sdr FOR UPDATE
  TO authenticated
  USING (true);

-- 4) RPC contagem de leads por advogada (30 dias) — round-robin
CREATE OR REPLACE FUNCTION public.advogadas_lead_count_30d()
RETURNS TABLE(advogada_id uuid, cnt int)
LANGUAGE sql
STABLE
AS $$
  SELECT advogada_responsavel_id AS advogada_id, count(*)::int AS cnt
  FROM public.leads_geral
  WHERE advogada_responsavel_id IS NOT NULL
    AND coalesce(created_time, now()) > now() - interval '30 days'
  GROUP BY advogada_responsavel_id;
$$;

GRANT EXECUTE ON FUNCTION public.advogadas_lead_count_30d() TO authenticated;
GRANT EXECUTE ON FUNCTION public.advogadas_lead_count_30d() TO service_role;

-- 5) Seed placeholder das sócias (telefones TODO — Mariana)
--    Usa areas (coluna real), não especialidades.
INSERT INTO public.advogados_sdr (nome, telefone, areas, ativo)
SELECT v.nome, v.telefone, v.areas, true
FROM (VALUES
  ('Juliana Borges', '+5551999999999', ARRAY['familia','saude']::text[]),
  ('Eliziane Zembruski', '+5551988888888', ARRAY['familia','inventario']::text[])
) AS v(nome, telefone, areas)
WHERE NOT EXISTS (
  SELECT 1 FROM public.advogados_sdr a
  WHERE lower(a.nome) = lower(v.nome)
);

COMMENT ON COLUMN public.advogados_sdr.telefone IS
  'TODO(Mariana): substituir placeholders +5551999999999 / +5551988888888 pelos WhatsApps reais das sócias';
