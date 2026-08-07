REVOKE ALL ON public.whitelist_teste_bot FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whitelist_teste_bot TO authenticated;
GRANT ALL ON public.whitelist_teste_bot TO service_role;
ALTER TABLE public.whitelist_teste_bot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins gerenciam whitelist teste bot" ON public.whitelist_teste_bot;
CREATE POLICY "Admins gerenciam whitelist teste bot" ON public.whitelist_teste_bot
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
ALTER VIEW public.v_meta_lead_funnel SET (security_invoker = on);
ALTER VIEW public.vw_kanban_leads SET (security_invoker = on);
ALTER VIEW public.vw_clientes_ativos SET (security_invoker = on);
ALTER VIEW public.vw_auditoria_leads SET (security_invoker = on);
ALTER VIEW public.vw_pipeline_b_z SET (security_invoker = on);