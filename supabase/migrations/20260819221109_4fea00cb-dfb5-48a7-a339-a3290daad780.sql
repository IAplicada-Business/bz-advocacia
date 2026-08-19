-- 1. Policies TO authenticated
DROP POLICY IF EXISTS "Authenticated users can read opcoes_sistema" ON public.opcoes_sistema;
CREATE POLICY "Authenticated users can read opcoes_sistema" ON public.opcoes_sistema FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert opcoes_sistema" ON public.opcoes_sistema;
CREATE POLICY "Admins can insert opcoes_sistema" ON public.opcoes_sistema FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update opcoes_sistema" ON public.opcoes_sistema;
CREATE POLICY "Admins can update opcoes_sistema" ON public.opcoes_sistema FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete opcoes_sistema" ON public.opcoes_sistema;
CREATE POLICY "Admins can delete opcoes_sistema" ON public.opcoes_sistema FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "Advogados can insert opcoes_sistema" ON public.opcoes_sistema;
CREATE POLICY "Advogados can insert opcoes_sistema" ON public.opcoes_sistema FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'advogado'::app_role));
DROP POLICY IF EXISTS "Advogados can update opcoes_sistema" ON public.opcoes_sistema;
CREATE POLICY "Advogados can update opcoes_sistema" ON public.opcoes_sistema FOR UPDATE TO authenticated USING (has_role(auth.uid(),'advogado'::app_role));
DROP POLICY IF EXISTS "Advogados can delete opcoes_sistema" ON public.opcoes_sistema;
CREATE POLICY "Advogados can delete opcoes_sistema" ON public.opcoes_sistema FOR DELETE TO authenticated USING (has_role(auth.uid(),'advogado'::app_role));

DROP POLICY IF EXISTS "Authenticated users can read subcategorias_externas" ON public.subcategorias_externas;
CREATE POLICY "Authenticated users can read subcategorias_externas" ON public.subcategorias_externas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos podem ler templates ativos" ON public.whatsapp_templates;
CREATE POLICY "Todos podem ler templates ativos" ON public.whatsapp_templates FOR SELECT TO authenticated USING ((ativo = true) OR (criado_por = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "Usuários podem criar templates" ON public.whatsapp_templates;
CREATE POLICY "Usuários podem criar templates" ON public.whatsapp_templates FOR INSERT TO authenticated WITH CHECK (criado_por = auth.uid());
DROP POLICY IF EXISTS "Criador ou admin pode editar templates" ON public.whatsapp_templates;
CREATE POLICY "Criador ou admin pode editar templates" ON public.whatsapp_templates FOR UPDATE TO authenticated USING ((criado_por = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "Criador ou admin pode deletar templates" ON public.whatsapp_templates;
CREATE POLICY "Criador ou admin pode deletar templates" ON public.whatsapp_templates FOR DELETE TO authenticated USING ((criado_por = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

-- 2. search_path + execute privileges
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid, p.oid::regprocedure AS sig, p.prorettype = 'trigger'::regtype AS is_trigger, p.proconfig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    IF r.proconfig IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(r.proconfig) c WHERE c LIKE 'search_path=%') THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.sig);
    END IF;
    IF r.is_trigger THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    ELSE
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
    END IF;
  END LOOP;
END $$;