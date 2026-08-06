-- 1.1 · Novos estágios do pipeline (MQL → Ganho)
-- Aditivo: cria enum lead_stage + coluna stage nas duas fontes de leads.
-- Colunas antigas (status_sdr, estagio) permanecem por 1 sprint (rollback).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
    CREATE TYPE public.lead_stage AS ENUM (
      'mql',
      'conectado',
      'sal',
      'reuniao_agendada',
      'reuniao_realizada',
      'proposta',
      'contrato',
      'ganho',
      'perdido'
    );
  END IF;
END$$;

-- contact_submissions
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS stage public.lead_stage;

-- leads_geral
ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS stage public.lead_stage;

-- Backfill contact_submissions a partir de estagio
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

-- Backfill leads_geral a partir de status_sdr / lead_status
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

-- Defaults + NOT NULL
ALTER TABLE public.contact_submissions
  ALTER COLUMN stage SET DEFAULT 'mql'::public.lead_stage;
UPDATE public.contact_submissions SET stage = 'mql'::public.lead_stage WHERE stage IS NULL;
ALTER TABLE public.contact_submissions
  ALTER COLUMN stage SET NOT NULL;

ALTER TABLE public.leads_geral
  ALTER COLUMN stage SET DEFAULT 'mql'::public.lead_stage;
UPDATE public.leads_geral SET stage = 'mql'::public.lead_stage WHERE stage IS NULL;
ALTER TABLE public.leads_geral
  ALTER COLUMN stage SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_submissions_stage ON public.contact_submissions(stage);
CREATE INDEX IF NOT EXISTS idx_leads_geral_stage ON public.leads_geral(stage);
