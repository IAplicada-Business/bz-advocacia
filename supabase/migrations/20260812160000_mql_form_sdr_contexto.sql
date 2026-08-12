-- MQL Form ↔ SDR: respostas auditáveis + contexto pré-carregado pro bot
-- (não repetir perguntas que o form já respondeu)

-- 1.1 Stage Continuidade (holding / planejamento preventivo)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
    BEGIN
      ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'continuidade';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END$$;

-- 1.2 Tabela de respostas do form (fonte de verdade, auditável)
CREATE TABLE IF NOT EXISTS public.lead_form_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text REFERENCES public.leads_geral(id) ON DELETE CASCADE,
  oferta text NOT NULL CHECK (oferta IN (
    'partilha_protegida',
    'inventario_otimizado',
    'cobertura_garantida'
  )),
  respostas jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lfa_lead ON public.lead_form_answers(lead_id);
CREATE INDEX IF NOT EXISTS idx_lfa_oferta ON public.lead_form_answers(oferta);
CREATE INDEX IF NOT EXISTS idx_lfa_created ON public.lead_form_answers(created_at DESC);

ALTER TABLE public.lead_form_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access lfa" ON public.lead_form_answers;
CREATE POLICY "service role full access lfa" ON public.lead_form_answers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated read lead_form_answers" ON public.lead_form_answers;
CREATE POLICY "authenticated read lead_form_answers" ON public.lead_form_answers
  FOR SELECT TO authenticated
  USING (true);

-- 1.3 Colunas em leads_geral (evita JOIN em todo lugar)
ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS oferta_origem text,
  ADD COLUMN IF NOT EXISTS form_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS form_flags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS form_desqualificacao text,
  ADD COLUMN IF NOT EXISTS sdr_contexto jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_lg_oferta ON public.leads_geral(oferta_origem);
CREATE INDEX IF NOT EXISTS idx_lg_flags ON public.leads_geral USING gin(form_flags);

-- 1.4 Auditoria de mensagens bloqueadas pelo guard-rail do bot
CREATE TABLE IF NOT EXISTS public.bot_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text REFERENCES public.leads_geral(id) ON DELETE SET NULL,
  motivo text NOT NULL,
  mensagem text,
  oferta text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access bot_errors" ON public.bot_errors;
CREATE POLICY "service role full access bot_errors" ON public.bot_errors
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated read bot_errors" ON public.bot_errors;
CREATE POLICY "authenticated read bot_errors" ON public.bot_errors
  FOR SELECT TO authenticated
  USING (true);

-- 1.5 Rate limit simples para submit público
CREATE TABLE IF NOT EXISTS public.form_submit_rate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_submit_rate_ip_created
  ON public.form_submit_rate(ip_hash, created_at DESC);

ALTER TABLE public.form_submit_rate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access form_submit_rate" ON public.form_submit_rate;
CREATE POLICY "service role full access form_submit_rate" ON public.form_submit_rate
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
