-- ============================================================
-- SQL Editor — Meta CAPI log + view Por Anúncio (gasto → MQL → ganho)
-- Rode após merge do branch cursor/insights-ads-capi-utm-d062
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meta_capi_events_log (
  id bigserial PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  lead_id text NOT NULL,
  event_name text NOT NULL,
  stage text,
  ok boolean,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_meta_capi_events_log_lead
  ON public.meta_capi_events_log (lead_id, created_at DESC);

ALTER TABLE public.meta_capi_events_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meta_capi_events_log_admin_read ON public.meta_capi_events_log;
CREATE POLICY meta_capi_events_log_admin_read ON public.meta_capi_events_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP VIEW IF EXISTS public.v_meta_ad_crm_funnel CASCADE;

CREATE VIEW public.v_meta_ad_crm_funnel
WITH (security_invoker = true) AS
SELECT
  lg.id AS lead_id,
  lg.created_time AS lead_at,
  lg.ad_id,
  lg.ad_name,
  COALESCE(lg.campaign_id, ma.campaign_id) AS campaign_id,
  COALESCE(lg.campaign_name, mc_via_ad.name) AS campaign_name,
  lg.adset_id,
  lg.adset_name,
  lg.platform,
  lg.origem_sdr,
  lg.status_sdr,
  COALESCE(cs.stage::text, lg.stage::text) AS crm_stage,
  (
    COALESCE(cs.stage::text, lg.stage::text) IN (
      'mql', 'conectado', 'sal', 'reuniao_agendada', 'reuniao_realizada',
      'proposta', 'contrato', 'ganho'
    )
    OR lg.status_sdr IN ('sql_aguardando_humano', 'assumido_humano', 'agendado', 'cliente')
  ) AS is_mql,
  (
    COALESCE(cs.stage::text, lg.stage::text) = 'ganho'
    OR lg.status_sdr = 'cliente'
  ) AS converted,
  (
    COALESCE(cs.stage::text, lg.stage::text) IN (
      'sal', 'reuniao_agendada', 'reuniao_realizada', 'proposta', 'contrato', 'ganho'
    )
  ) AS avancado
FROM public.leads_geral lg
LEFT JOIN public.contact_submissions cs ON cs.lead_geral_id = lg.id
LEFT JOIN public.meta_ads ma ON ma.id = lg.ad_id
LEFT JOIN public.meta_campaigns mc_via_ad ON mc_via_ad.id = ma.campaign_id
WHERE
  lg.ad_id IS NOT NULL
  OR lg.campaign_id IS NOT NULL
  OR (
    coalesce(lg.is_organic, false) = false
    AND lg.platform IN ('facebook_ads', 'instagram_ads', 'meta_ads', 'google_ads')
  );

GRANT SELECT ON public.v_meta_ad_crm_funnel TO authenticated;
GRANT SELECT ON public.v_meta_ad_crm_funnel TO anon;

-- Validação
SELECT count(*) AS capi_log_rows FROM public.meta_capi_events_log;
SELECT count(*) AS funnel_rows FROM public.v_meta_ad_crm_funnel;
