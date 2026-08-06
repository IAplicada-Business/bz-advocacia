-- Alinha Pixel ID das LPs com meta_credentials e inclui leads de LP Meta no funil.

-- 1) Pixel oficial das LPs (Borges & Zembruski) — o seed antigo tinha outro ID "não usado"
UPDATE public.meta_credentials
SET pixel_id = '1035698672653512'
WHERE ad_account_id = 'act_1077194864075798'
  AND (pixel_id IS DISTINCT FROM '1035698672653512');

COMMENT ON COLUMN public.meta_credentials.pixel_id IS
  'Meta Pixel das LPs e Ads Manager: 1035698672653512';

-- 2) Funil Marketing: CTWA (ad_id) + campanha + leads Meta de LP (mesmo sem ad_id)
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

COMMENT ON VIEW public.v_meta_lead_funnel IS
  'Leads Meta (CTWA com ad_id, campanha, ou LP/meta_lead_ads pago) cruzados com meta_ads/campaigns. '
  'converted=true só quando status_sdr=cliente.';

GRANT SELECT ON public.v_meta_lead_funnel TO authenticated;
GRANT SELECT ON public.v_meta_lead_funnel TO anon;
