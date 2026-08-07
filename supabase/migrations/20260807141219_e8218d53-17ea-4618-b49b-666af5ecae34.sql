DROP POLICY IF EXISTS "Public access with valid token" ON public.relatorios_compartilhados;
REVOKE ALL ON public.relatorios_compartilhados FROM anon;