-- Expõe platform/ad_id no kanban + corrige origem CRM dos leads de ads já existentes.

DROP VIEW IF EXISTS public.vw_kanban_leads CASCADE;

CREATE VIEW public.vw_kanban_leads
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
  lg.platform AS bot_platform,
  lg.ad_id AS bot_ad_id,
  lg.campaign_id AS bot_campaign_id,
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

-- Backfill: contact_submissions.origem a partir de leads_geral (ads / LP paga).
-- LP com UTM organic/site NÃO entra como mídia paga.
UPDATE public.contact_submissions cs
SET
  origem = CASE
    WHEN lg.platform = 'instagram_ads' THEN 'instagram'
    WHEN lg.platform = 'facebook_ads' THEN 'facebook'
    WHEN lg.platform = 'meta_ads' THEN 'meta'
    WHEN lg.platform = 'google_ads' THEN 'google'
    WHEN lg.platform = 'tiktok_ads' THEN 'tiktok'
    WHEN lg.platform = 'linkedin_ads' THEN 'linkedin'
    WHEN lg.origem_sdr = 'meta_lead_ads' THEN 'meta'
    WHEN coalesce(lg.form_id, '') LIKE 'lp_%'
      AND NOT (
        lower(coalesce(lg.dados_capturados->>'utm_source', '')) IN ('organic', 'site')
        OR lower(coalesce(lg.dados_capturados->>'utm_medium', '')) = 'organic'
      )
      THEN 'meta'
    ELSE cs.origem
  END,
  como_conheceu = CASE
    WHEN lg.platform LIKE '%_ads'
      OR lg.origem_sdr = 'meta_lead_ads'
      OR lg.ad_id IS NOT NULL
      OR (
        coalesce(lg.form_id, '') LIKE 'lp_%'
        AND NOT (
          lower(coalesce(lg.dados_capturados->>'utm_source', '')) IN ('organic', 'site')
          OR lower(coalesce(lg.dados_capturados->>'utm_medium', '')) = 'organic'
        )
      )
    THEN 'Mídia Paga'
    ELSE cs.como_conheceu
  END
FROM public.leads_geral lg
WHERE cs.lead_geral_id = lg.id
  AND (
    lg.is_organic = false
    OR lg.platform LIKE '%_ads'
    OR lg.origem_sdr = 'meta_lead_ads'
    OR lg.ad_id IS NOT NULL
    OR (
      coalesce(lg.form_id, '') LIKE 'lp_%'
      AND NOT (
        lower(coalesce(lg.dados_capturados->>'utm_source', '')) IN ('organic', 'site')
        OR lower(coalesce(lg.dados_capturados->>'utm_medium', '')) = 'organic'
      )
    )
  );

-- Flags no bot: ads + LP sem UTM orgânico (não força toda lp_%)
UPDATE public.leads_geral
SET is_organic = false
WHERE is_organic IS DISTINCT FROM false
  AND (
    platform LIKE '%_ads'
    OR origem_sdr = 'meta_lead_ads'
    OR ad_id IS NOT NULL
    OR (
      coalesce(form_id, '') LIKE 'lp_%'
      AND NOT (
        lower(coalesce(dados_capturados->>'utm_source', '')) IN ('organic', 'site')
        OR lower(coalesce(dados_capturados->>'utm_medium', '')) = 'organic'
      )
    )
  );
