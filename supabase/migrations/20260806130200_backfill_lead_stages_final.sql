-- 1.3 · Backfill final de stages (edge cases pós 1.1)

-- 1. Fallback pra MQL se ainda houver NULL (não deveria após NOT NULL, mas seguro)
UPDATE public.leads_geral SET stage = 'mql' WHERE stage IS NULL;
UPDATE public.contact_submissions SET stage = 'mql' WHERE stage IS NULL;

-- 2. Se lead tem mensagens_sdr, no mínimo é 'conectado'
UPDATE public.leads_geral
SET stage = 'conectado'
WHERE stage = 'mql'
  AND id IN (SELECT DISTINCT lead_id FROM public.mensagens_sdr WHERE lead_id IS NOT NULL);

-- Espelha em contact_submissions vinculados
UPDATE public.contact_submissions cs
SET stage = 'conectado'
WHERE cs.stage = 'mql'
  AND cs.lead_geral_id IN (
    SELECT DISTINCT lead_id FROM public.mensagens_sdr WHERE lead_id IS NOT NULL
  );

-- 3. Se tem qualificacoes_sdr, é 'sal'
UPDATE public.leads_geral
SET stage = 'sal'
WHERE stage IN ('mql', 'conectado')
  AND id IN (SELECT DISTINCT lead_id FROM public.qualificacoes_sdr WHERE lead_id IS NOT NULL);

UPDATE public.contact_submissions cs
SET stage = 'sal'
WHERE cs.stage IN ('mql', 'conectado')
  AND cs.lead_geral_id IN (
    SELECT DISTINCT lead_id FROM public.qualificacoes_sdr WHERE lead_id IS NOT NULL
  );

-- 4. Se tem contrato assinado, força 'ganho'
UPDATE public.leads_geral
SET stage = 'ganho'
WHERE contrato_assinado = true
  AND stage IS DISTINCT FROM 'ganho';

UPDATE public.contact_submissions
SET stage = 'ganho'
WHERE contrato_assinado = true
  AND stage IS DISTINCT FROM 'ganho';
