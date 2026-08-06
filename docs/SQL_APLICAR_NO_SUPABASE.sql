-- ============================================================
-- B&Z — SQL consolidado pra colar no SUPABASE SQL EDITOR
-- Projeto: nvkxblrwblhvggndlfax
-- NÃO rodar no Lovable. Abrir: https://supabase.com/dashboard/project/nvkxblrwblhvggndlfax/sql/new
--
-- Inclui Bloco 2 (funil MQL→Ganho) + Bloco 3 (bot desqualificado/qualificação)
-- Idempotente o máximo possível (IF NOT EXISTS / IF EXISTS).
-- ============================================================

BEGIN;

-- ========== 1.1 lead_stage + coluna stage ==========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
    CREATE TYPE public.lead_stage AS ENUM (
      'mql', 'conectado', 'sal', 'reuniao_agendada', 'reuniao_realizada',
      'proposta', 'contrato', 'ganho', 'perdido'
    );
  END IF;
END$$;

ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS stage public.lead_stage;
ALTER TABLE public.leads_geral ADD COLUMN IF NOT EXISTS stage public.lead_stage;

UPDATE public.contact_submissions
SET stage = CASE
  WHEN lower(coalesce(estagio, '')) IN ('novo', 'aguardando', 'primeiro_contato', 'primeiro contato') THEN 'mql'::public.lead_stage
  WHEN lower(coalesce(estagio, '')) IN ('contato_inicial', 'em_contato', 'conversando', 'enviado') THEN 'conectado'::public.lead_stage
  WHEN lower(coalesce(estagio, '')) IN ('em_analise', 'qualificado', 'sal') THEN 'sal'::public.lead_stage
  WHEN lower(coalesce(estagio, '')) IN ('reuniao_marcada', 'agendado', 'reuniao_agendada') THEN 'reuniao_agendada'::public.lead_stage
  WHEN lower(coalesce(estagio, '')) IN ('reuniao_feita', 'reuniao_realizada') THEN 'reuniao_realizada'::public.lead_stage
  WHEN lower(coalesce(estagio, '')) IN ('proposta_enviada', 'proposta') THEN 'proposta'::public.lead_stage
  WHEN lower(coalesce(estagio, '')) IN ('contrato_enviado', 'aguardando_assinatura', 'contrato') THEN 'contrato'::public.lead_stage
  WHEN lower(coalesce(estagio, '')) IN ('fechado', 'ganho', 'cliente', 'convertido') THEN 'ganho'::public.lead_stage
  WHEN lower(coalesce(estagio, '')) IN ('perdido') THEN 'perdido'::public.lead_stage
  ELSE 'mql'::public.lead_stage
END
WHERE stage IS NULL;

UPDATE public.leads_geral
SET stage = CASE
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN ('novo', 'aguardando') THEN 'mql'::public.lead_stage
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN ('em_atendimento_bot', 'em_contato', 'conversando') THEN 'conectado'::public.lead_stage
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN (
    'qualificacao_iniciada', 'aguardando_triagem', 'sql_aguardando_humano',
    'assumido_humano', 'qualificado', 'sal'
  ) THEN 'sal'::public.lead_stage
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN ('agendado', 'reuniao_marcada', 'reuniao_agendada') THEN 'reuniao_agendada'::public.lead_stage
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN ('reuniao_feita', 'reuniao_realizada') THEN 'reuniao_realizada'::public.lead_stage
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN ('proposta_enviada', 'proposta') THEN 'proposta'::public.lead_stage
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN ('contrato_enviado', 'aguardando_assinatura', 'contrato') THEN 'contrato'::public.lead_stage
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN ('cliente', 'fechado', 'ganho', 'convertido') THEN 'ganho'::public.lead_stage
  WHEN lower(coalesce(status_sdr, lead_status, '')) IN ('perdido', 'mql_frio', 'perdido_recuperacao') THEN 'perdido'::public.lead_stage
  ELSE 'mql'::public.lead_stage
END
WHERE stage IS NULL;

ALTER TABLE public.contact_submissions ALTER COLUMN stage SET DEFAULT 'mql'::public.lead_stage;
UPDATE public.contact_submissions SET stage = 'mql'::public.lead_stage WHERE stage IS NULL;
ALTER TABLE public.contact_submissions ALTER COLUMN stage SET NOT NULL;

ALTER TABLE public.leads_geral ALTER COLUMN stage SET DEFAULT 'mql'::public.lead_stage;
UPDATE public.leads_geral SET stage = 'mql'::public.lead_stage WHERE stage IS NULL;
ALTER TABLE public.leads_geral ALTER COLUMN stage SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_submissions_stage ON public.contact_submissions(stage);
CREATE INDEX IF NOT EXISTS idx_leads_geral_stage ON public.leads_geral(stage);

COMMIT;

-- ADD VALUE de enum precisa de transação própria em alguns casos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
    BEGIN
      ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'desqualificado';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;

BEGIN;

-- ========== 1.2 guards columns + overrides ==========
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_advogada_responsavel_id_fkey') THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_advogada_responsavel_id_fkey
      FOREIGN KEY (advogada_responsavel_id) REFERENCES public.advogados_sdr(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_advogada_responsavel_id_fkey') THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_advogada_responsavel_id_fkey
      FOREIGN KEY (advogada_responsavel_id) REFERENCES public.advogados_sdr(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_proposta_id_fkey') THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_proposta_id_fkey
      FOREIGN KEY (proposta_id) REFERENCES public.contratos_gerados(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_contrato_id_fkey') THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_contrato_id_fkey
      FOREIGN KEY (contrato_id) REFERENCES public.contratos_gerados(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_proposta_id_fkey') THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_proposta_id_fkey
      FOREIGN KEY (proposta_id) REFERENCES public.contratos_gerados(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_contrato_id_fkey') THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_contrato_id_fkey
      FOREIGN KEY (contrato_id) REFERENCES public.contratos_gerados(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_area_juridica_check') THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_area_juridica_check
      CHECK (area_juridica IS NULL OR area_juridica IN ('familia', 'inventario', 'saude'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_area_juridica_check') THEN
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
  ON public.stage_transitions_override FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated insert stage_transitions_override" ON public.stage_transitions_override;
CREATE POLICY "authenticated insert stage_transitions_override"
  ON public.stage_transitions_override FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ========== 1.3 backfill ==========
UPDATE public.leads_geral SET stage = 'mql' WHERE stage IS NULL;
UPDATE public.contact_submissions SET stage = 'mql' WHERE stage IS NULL;

UPDATE public.leads_geral SET stage = 'conectado'
WHERE stage = 'mql'
  AND id IN (SELECT DISTINCT lead_id FROM public.mensagens_sdr WHERE lead_id IS NOT NULL);

UPDATE public.contact_submissions cs SET stage = 'conectado'
WHERE cs.stage = 'mql'
  AND cs.lead_geral_id IN (SELECT DISTINCT lead_id FROM public.mensagens_sdr WHERE lead_id IS NOT NULL);

UPDATE public.leads_geral SET stage = 'sal'
WHERE stage IN ('mql', 'conectado')
  AND id IN (SELECT DISTINCT lead_id FROM public.qualificacoes_sdr WHERE lead_id IS NOT NULL);

UPDATE public.contact_submissions cs SET stage = 'sal'
WHERE cs.stage IN ('mql', 'conectado')
  AND cs.lead_geral_id IN (SELECT DISTINCT lead_id FROM public.qualificacoes_sdr WHERE lead_id IS NOT NULL);

UPDATE public.leads_geral SET stage = 'ganho'
WHERE contrato_assinado = true AND stage IS DISTINCT FROM 'ganho';
UPDATE public.contact_submissions SET stage = 'ganho'
WHERE contrato_assinado = true AND stage IS DISTINCT FROM 'ganho';

-- ========== 1.4 converted_at + views ==========
ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS converted_at timestamptz;
ALTER TABLE public.leads_geral ADD COLUMN IF NOT EXISTS converted_at timestamptz;

UPDATE public.contact_submissions
SET converted_at = coalesce(converted_at, data_ultima_atividade, created_at, now())
WHERE stage = 'ganho' AND converted_at IS NULL;
UPDATE public.leads_geral
SET converted_at = coalesce(converted_at, updated_at, created_time, now())
WHERE stage = 'ganho' AND converted_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_converted_at_on_ganho()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage = 'ganho'::public.lead_stage
     AND (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM 'ganho'::public.lead_stage) THEN
    NEW.converted_at := coalesce(NEW.converted_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contact_submissions_converted_at ON public.contact_submissions;
CREATE TRIGGER trg_contact_submissions_converted_at
  BEFORE INSERT OR UPDATE OF stage ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_converted_at_on_ganho();
DROP TRIGGER IF EXISTS trg_leads_geral_converted_at ON public.leads_geral;
CREATE TRIGGER trg_leads_geral_converted_at
  BEFORE INSERT OR UPDATE OF stage ON public.leads_geral
  FOR EACH ROW EXECUTE FUNCTION public.set_converted_at_on_ganho();

CREATE OR REPLACE VIEW public.vw_kanban_leads
WITH (security_invoker = true) AS
SELECT
  cs.*,
  lg.status_sdr AS bot_status_sdr,
  lg.fluxo_sdr AS bot_fluxo_sdr,
  lg.area_normalizada AS bot_area_normalizada,
  lg.score AS bot_score,
  lg.etapa_qualificacao AS bot_etapa_qualificacao,
  lg.bot_pausado AS bot_bot_pausado,
  lg.ultima_mensagem_em AS bot_ultima_mensagem_em,
  lg.origem_sdr AS bot_origem_sdr,
  lg.is_organic AS bot_is_organic,
  lg.tipo_contato AS bot_tipo_contato,
  lg.tipo_servico AS bot_tipo_servico,
  lg.urgencia AS bot_urgencia,
  lg.dados_capturados AS bot_dados_capturados
FROM public.contact_submissions cs
LEFT JOIN public.leads_geral lg ON lg.id = cs.lead_geral_id
WHERE coalesce(lg.tipo_contato, 'lead') = 'lead'
  AND (cs.stage <> 'ganho'::public.lead_stage OR cs.converted_at > now() - interval '30 days');

GRANT SELECT ON public.vw_kanban_leads TO authenticated;
GRANT SELECT ON public.vw_kanban_leads TO anon;

CREATE OR REPLACE VIEW public.vw_clientes_ativos
WITH (security_invoker = true) AS
SELECT
  cs.id AS lead_id,
  cs.nome_completo AS nome,
  cs.telefone,
  cs.email,
  cs.stage,
  cs.converted_at,
  cs.status_cliente,
  cs.tipo_processo,
  cs.responsavel_id,
  cs.created_at
FROM public.contact_submissions cs
WHERE cs.stage = 'ganho'::public.lead_stage
  AND (
    cs.status_cliente = 'ativo'
    OR EXISTS (
      SELECT 1 FROM public.parcelas_financeiras pf
      JOIN public.acordos_financeiros af ON af.id = pf.acordo_id
      WHERE af.cliente_id = cs.id
        AND lower(coalesce(pf.status, '')) IN ('pago', 'paga', 'recebido')
    )
    OR EXISTS (SELECT 1 FROM public.processos p WHERE p.lead_id = cs.id)
  );
GRANT SELECT ON public.vw_clientes_ativos TO authenticated;

-- ========== 1.5 stage_entered_at ==========
ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS stage_entered_at timestamptz DEFAULT now();
ALTER TABLE public.leads_geral ADD COLUMN IF NOT EXISTS stage_entered_at timestamptz DEFAULT now();

UPDATE public.contact_submissions
SET stage_entered_at = coalesce(stage_entered_at, data_ultima_atividade, created_at, now())
WHERE stage_entered_at IS NULL;
UPDATE public.leads_geral
SET stage_entered_at = coalesce(stage_entered_at, updated_at, created_time, now())
WHERE stage_entered_at IS NULL;

CREATE OR REPLACE FUNCTION public.update_stage_entered_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stage_entered_at := coalesce(NEW.stage_entered_at, now());
    RETURN NEW;
  END IF;
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_entered_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_geral_stage_entered_at ON public.leads_geral;
CREATE TRIGGER trg_leads_geral_stage_entered_at
  BEFORE INSERT OR UPDATE ON public.leads_geral
  FOR EACH ROW EXECUTE FUNCTION public.update_stage_entered_at();
DROP TRIGGER IF EXISTS trg_contact_submissions_stage_entered_at ON public.contact_submissions;
CREATE TRIGGER trg_contact_submissions_stage_entered_at
  BEFORE INSERT OR UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_stage_entered_at();

-- ========== 2.x bot desqualificado + qualificacao ==========
ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS desqualificado_motivo text,
  ADD COLUMN IF NOT EXISTS desqualificado_em timestamptz,
  ADD COLUMN IF NOT EXISTS prioridade_max boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS caso_forte boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_minimo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS produto_diferente boolean DEFAULT false;

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
DROP POLICY IF EXISTS "authenticated read qualificacao_estruturada_sdr" ON public.qualificacao_estruturada_sdr;
CREATE POLICY "authenticated read qualificacao_estruturada_sdr"
  ON public.qualificacao_estruturada_sdr FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated insert qualificacao_estruturada_sdr" ON public.qualificacao_estruturada_sdr;
CREATE POLICY "authenticated insert qualificacao_estruturada_sdr"
  ON public.qualificacao_estruturada_sdr FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated update qualificacao_estruturada_sdr" ON public.qualificacao_estruturada_sdr;
CREATE POLICY "authenticated update qualificacao_estruturada_sdr"
  ON public.qualificacao_estruturada_sdr FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.advogadas_lead_count_30d()
RETURNS TABLE(advogada_id uuid, cnt int)
LANGUAGE sql STABLE AS $$
  SELECT advogada_responsavel_id AS advogada_id, count(*)::int AS cnt
  FROM public.leads_geral
  WHERE advogada_responsavel_id IS NOT NULL
    AND coalesce(created_time, now()) > now() - interval '30 days'
  GROUP BY advogada_responsavel_id;
$$;
GRANT EXECUTE ON FUNCTION public.advogadas_lead_count_30d() TO authenticated;
GRANT EXECUTE ON FUNCTION public.advogadas_lead_count_30d() TO service_role;

INSERT INTO public.advogados_sdr (nome, telefone, areas, ativo)
SELECT v.nome, v.telefone, v.areas, true
FROM (VALUES
  ('Juliana Borges', '+5551999999999', ARRAY['familia','saude']::text[]),
  ('Eliziane Zembruski', '+5551988888888', ARRAY['familia','inventario']::text[])
) AS v(nome, telefone, areas)
WHERE NOT EXISTS (
  SELECT 1 FROM public.advogados_sdr a WHERE lower(a.nome) = lower(v.nome)
);

COMMIT;

-- Validação
SELECT stage, count(*) FROM public.leads_geral GROUP BY stage ORDER BY 1;
SELECT stage, count(*) FROM public.contact_submissions GROUP BY stage ORDER BY 1;
