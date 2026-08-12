-- 1.4 · Separar Ganho (kanban 30 dias) de Cliente Ativo

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

-- Backfill converted_at para quem já está em ganho
UPDATE public.contact_submissions
SET converted_at = coalesce(converted_at, data_ultima_atividade, created_at, now())
WHERE stage = 'ganho' AND converted_at IS NULL;

UPDATE public.leads_geral
SET converted_at = coalesce(converted_at, updated_at, created_time, now())
WHERE stage = 'ganho' AND converted_at IS NULL;

-- Trigger: ao virar ganho, seta converted_at
CREATE OR REPLACE FUNCTION public.set_converted_at_on_ganho()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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

-- DROP obrigatório: CREATE OR REPLACE não muda tipo de coluna.
-- View antiga tinha lead_id text (leads_geral); a nova usa uuid (contact_submissions).
DROP VIEW IF EXISTS public.vw_kanban_leads CASCADE;
DROP VIEW IF EXISTS public.vw_clientes_ativos CASCADE;

-- Kanban: stages comerciais + ganho só nos últimos 30 dias; excluindo perdido do funil principal
CREATE VIEW public.vw_kanban_leads
WITH (security_invoker = true)
AS
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
WHERE
  coalesce(lg.tipo_contato, 'lead') = 'lead'
  AND (
    cs.stage <> 'ganho'::public.lead_stage
    OR cs.converted_at > now() - interval '30 days'
  );

GRANT SELECT ON public.vw_kanban_leads TO authenticated;
GRANT SELECT ON public.vw_kanban_leads TO anon;

-- Cliente ativo: ganho + pelo menos uma parcela paga
CREATE VIEW public.vw_clientes_ativos
WITH (security_invoker = true)
AS
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
      SELECT 1
      FROM public.parcelas_financeiras pf
      JOIN public.acordos_financeiros af ON af.id = pf.acordo_id
      WHERE af.cliente_id = cs.id
        AND lower(coalesce(pf.status, '')) IN ('pago', 'paga', 'recebido')
    )
    OR EXISTS (
      SELECT 1
      FROM public.processos p
      WHERE p.lead_id = cs.id
    )
  );

GRANT SELECT ON public.vw_clientes_ativos TO authenticated;
