-- ============================================================
-- Correção pós-PR #147 (Bugbot High): ads orgânicos + stages
-- Colar no SQL Editor do projeto CRM (nvkxblrwblhvggndlfax).
-- ============================================================

-- 1) Restaura LP orgânica marcada como ads pelo backfill form_id LIKE 'lp_%'
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

-- 2) Origem CRM: LP orgânica → site (não meta / Mídia Paga)
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

-- 3) mql_frio NÃO é ganho — corrige espelho que mapeava fechado→ganho
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

-- 4) desqualificado NÃO volta pra mql/novo
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

-- Validação rápida
SELECT
  'lp_organic_ainda_ads' AS check_name,
  count(*) AS n
FROM leads_geral
WHERE coalesce(form_id, '') LIKE 'lp_%'
  AND (
    lower(coalesce(dados_capturados->>'utm_source', '')) IN ('organic', 'site')
    OR lower(coalesce(dados_capturados->>'utm_medium', '')) = 'organic'
  )
  AND is_organic = false
UNION ALL
SELECT
  'mql_frio_como_ganho',
  count(*)
FROM contact_submissions cs
JOIN leads_geral lg ON lg.id = cs.lead_geral_id
WHERE lg.status_sdr = 'mql_frio' AND cs.stage = 'ganho'
UNION ALL
SELECT
  'desqualificado_como_mql',
  count(*)
FROM contact_submissions cs
JOIN leads_geral lg ON lg.id = cs.lead_geral_id
WHERE lg.status_sdr = 'desqualificado' AND cs.stage = 'mql';
