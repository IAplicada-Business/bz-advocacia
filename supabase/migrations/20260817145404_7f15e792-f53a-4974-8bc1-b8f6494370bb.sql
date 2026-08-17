CREATE INDEX IF NOT EXISTS ix_backlog_triagem_created_at ON public.backlog_triagem(created_at DESC) WHERE resolvido = false;
CREATE INDEX IF NOT EXISTS ix_backlog_triagem_telefone ON public.backlog_triagem(telefone);
CREATE INDEX IF NOT EXISTS ix_numeros_bloqueados_telefone ON public.numeros_bloqueados_bot(telefone);
CREATE INDEX IF NOT EXISTS ix_numeros_bloqueados_telefone_ult8 ON public.numeros_bloqueados_bot((right(regexp_replace(telefone,'\D','','g'),8)));
CREATE INDEX IF NOT EXISTS ix_leads_geral_created_time ON public.leads_geral(created_time DESC);

-- FIX 3: o proprio espelhamento do bot (estagio 'contato_inicial') estava
-- auto-bloqueando o telefone do lead, matando a conversa apos o M0.
CREATE OR REPLACE FUNCTION public.trg_auto_block_contact_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ESTAGIOS_ATIVOS text[] := ARRAY['em_analise','proposta_enviada','fechado'];
  v_bot_ativo boolean := false;
BEGIN
  IF NEW.telefone IS NULL THEN RETURN NEW; END IF;

  -- Lead ainda em atendimento pelo bot: nunca auto-bloquear.
  IF NEW.lead_geral_id IS NOT NULL THEN
    SELECT coalesce(lg.bot_pausado, false) = false
           AND coalesce(lg.status_sdr,'') IN ('novo','em_atendimento_bot','qualificacao_iniciada')
      INTO v_bot_ativo
    FROM public.leads_geral lg
    WHERE lg.id = NEW.lead_geral_id;
    IF coalesce(v_bot_ativo, false) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF (NEW.responsavel_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id))
     OR (NEW.estagio = ANY(ESTAGIOS_ATIVOS) AND (TG_OP = 'INSERT' OR OLD.estagio IS DISTINCT FROM NEW.estagio))
  THEN
    PERFORM public.auto_bloquear_telefone_bot(
      NEW.telefone,
      'auto_crm_ativo_' || COALESCE(NEW.estagio, 'sem_estagio'),
      NEW.nome_completo
    );
  END IF;
  RETURN NEW;
END;
$function$;