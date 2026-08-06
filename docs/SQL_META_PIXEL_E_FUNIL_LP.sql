-- ============================================================
-- Lovable Cloud / SQL Editor — Pixel + funil LP Meta
-- Rode após o deploy do código (branch cursor/meta-lp-atribuicao-d062).
-- ============================================================

UPDATE public.meta_credentials
SET pixel_id = '1035698672653512'
WHERE ad_account_id = 'act_1077194864075798'
  AND (pixel_id IS DISTINCT FROM '1035698672653512');

-- DROP evita erro se a view antiga tiver colunas/tipos diferentes
DROP VIEW IF EXISTS public.v_meta_lead_funnel CASCADE;

CREATE VIEW public.v_meta_lead_funnel
WITH (security_invoker = true) AS
SELECT
  lg.id            AS lead_id,
  lg.created_time  AS lead_at,
  lg.ad_id,
  lg.ad_name,
  COALESCE(lg.campaign_id, ma.campaign_id) AS campaign_id,
  COALESCE(lg.campaign_name, mc_via_ad.name) AS campaign_name,
  lg.adset_id,
  lg.adset_name,
  lg.status_sdr,
  (lg.status_sdr = 'cliente') AS converted,
  (lg.status_sdr IN ('cliente','agendado','assumido_humano','sql_aguardando_humano')) AS em_pipeline,
  COALESCE(mc.objective, mc_via_ad.objective) AS objective,
  COALESCE(mc.status, mc_via_ad.status) AS campaign_status,
  lg.platform,
  lg.form_id,
  lg.origem_sdr
FROM public.leads_geral lg
LEFT JOIN public.meta_ads ma ON ma.id = lg.ad_id
LEFT JOIN public.meta_campaigns mc ON mc.id = lg.campaign_id
LEFT JOIN public.meta_campaigns mc_via_ad ON mc_via_ad.id = ma.campaign_id
WHERE
  lg.ad_id IS NOT NULL
  OR lg.campaign_id IS NOT NULL
  OR (
    coalesce(lg.is_organic, false) = false
    AND lg.platform IN ('facebook_ads', 'instagram_ads', 'meta_ads')
    AND (
      coalesce(lg.form_id, '') LIKE 'lp_%'
      OR lg.origem_sdr = 'meta_lead_ads'
    )
  );

GRANT SELECT ON public.v_meta_lead_funnel TO authenticated;
GRANT SELECT ON public.v_meta_lead_funnel TO anon;

-- Validação
SELECT pixel_id FROM public.meta_credentials WHERE active = true;
SELECT count(*) AS leads_no_funil FROM public.v_meta_lead_funnel;
