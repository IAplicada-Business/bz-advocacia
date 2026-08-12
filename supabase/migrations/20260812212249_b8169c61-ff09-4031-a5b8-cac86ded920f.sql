DROP POLICY IF EXISTS "System can insert notifications" ON public.notificacoes;
CREATE POLICY "Users receive their own notifications"
ON public.notificacoes FOR INSERT TO authenticated
WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can manage subcategorias_externas" ON public.subcategorias_externas;
CREATE POLICY "Authenticated users can manage subcategorias_externas"
ON public.subcategorias_externas FOR ALL TO authenticated
USING (true) WITH CHECK (true);

REVOKE ALL ON public.subcategorias_externas FROM anon;
REVOKE ALL ON public.notificacoes FROM anon;