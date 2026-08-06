-- 1.5 · stage_entered_at + trigger de SLA

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS stage_entered_at timestamptz DEFAULT now();

ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS stage_entered_at timestamptz DEFAULT now();

UPDATE public.contact_submissions
SET stage_entered_at = coalesce(stage_entered_at, data_ultima_atividade, created_at, now())
WHERE stage_entered_at IS NULL;

UPDATE public.leads_geral
SET stage_entered_at = coalesce(stage_entered_at, updated_at, created_time, now())
WHERE stage_entered_at IS NULL;

CREATE OR REPLACE FUNCTION public.update_stage_entered_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stage_entered_at := coalesce(NEW.stage_entered_at, now());
    RETURN NEW;
  END IF;
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_entered_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_geral_stage_entered_at ON public.leads_geral;
CREATE TRIGGER trg_leads_geral_stage_entered_at
  BEFORE INSERT OR UPDATE ON public.leads_geral
  FOR EACH ROW EXECUTE FUNCTION public.update_stage_entered_at();

DROP TRIGGER IF EXISTS trg_contact_submissions_stage_entered_at ON public.contact_submissions;
CREATE TRIGGER trg_contact_submissions_stage_entered_at
  BEFORE INSERT OR UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_stage_entered_at();
