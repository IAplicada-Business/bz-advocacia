ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS flags_qualificacao text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.leads_geral DROP CONSTRAINT IF EXISTS leads_geral_etapa_qualificacao_check;

UPDATE public.leads_geral
SET etapa_qualificacao = NULL
WHERE etapa_qualificacao IS NOT NULL
  AND etapa_qualificacao NOT IN (
    'M0','M1','M-A','M-B',
    'M2C','M3C','M4C','M5C','M5C-Desq',
    'M2D','M3D','M4D','M5D','M6D','M6D-Preventivo',
    'M2E','M3E','M4E','M5E','M6E','M6E-Urgente','M6E-CasoForte',
    'encerrado_frio','desqualificado','finalizado'
  );

ALTER TABLE public.leads_geral ADD CONSTRAINT leads_geral_etapa_qualificacao_check
  CHECK (etapa_qualificacao IS NULL OR etapa_qualificacao IN (
    'M0','M1','M-A','M-B',
    'M2C','M3C','M4C','M5C','M5C-Desq',
    'M2D','M3D','M4D','M5D','M6D','M6D-Preventivo',
    'M2E','M3E','M4E','M5E','M6E','M6E-Urgente','M6E-CasoForte',
    'encerrado_frio','desqualificado','finalizado'
  ));