-- Corrige backfill do PR #147: LP orgânica ≠ ads; mql_frio/desqualificado stages.

-- 1) Restaura is_organic em LP com UTM orgânico (sem sinais de ads)
UPDATE public.leads_geral
SET is_organic = true
WHERE coalesce(form_id, '') LIKE 'lp_%'
  AND (
    lower(coalesce(dados_capturados->>'utm_source', '')) IN ('organic', 'site')
    OR lower(coalesce(dados_capturados->>'utm_medium', '')) = 'organic'
  )
  AND coalesce(platform, '') NOT LIKE '%_ads'
  AND coalesce(origem_sdr, '') IS DISTINCT FROM 'meta_lead_ads'
  AND ad_id IS NULL
  AND is_organic IS DISTINCT FROM true;

-- 2) Origem CRM das LPs orgânicas
UPDATE public.contact_submissions cs
SET
  origem = 'site',
  como_conheceu = CASE
    WHEN cs.como_conheceu ILIKE '%mídia paga%' OR cs.como_conheceu ILIKE '%midia paga%'
      THEN 'Site / LP'
    ELSE coalesce(cs.como_conheceu, 'Site / LP')
  END
FROM public.leads_geral lg
WHERE cs.lead_geral_id = lg.id
  AND coalesce(lg.form_id, '') LIKE 'lp_%'
  AND lg.is_organic = true
  AND coalesce(lg.platform, '') NOT LIKE '%_ads'
  AND coalesce(lg.origem_sdr, '') IS DISTINCT FROM 'meta_lead_ads'
  AND lg.ad_id IS NULL;

-- 3) mql_frio → perdido (não ganho)
UPDATE public.contact_submissions cs
SET
  stage = 'perdido'::public.lead_stage,
  estagio = 'perdido',
  status = 'fechado'
FROM public.leads_geral lg
WHERE cs.lead_geral_id = lg.id
  AND lg.status_sdr = 'mql_frio'
  AND cs.stage = 'ganho'::public.lead_stage;

UPDATE public.leads_geral
SET stage = 'perdido'
WHERE status_sdr = 'mql_frio'
  AND stage IS DISTINCT FROM 'perdido';

-- 4) desqualificado no kanban
UPDATE public.contact_submissions cs
SET
  stage = 'desqualificado'::public.lead_stage,
  estagio = 'perdido',
  status = 'fechado'
FROM public.leads_geral lg
WHERE cs.lead_geral_id = lg.id
  AND (
    lg.status_sdr = 'desqualificado'
    OR lg.stage = 'desqualificado'
  )
  AND cs.stage IS DISTINCT FROM 'desqualificado'::public.lead_stage;
