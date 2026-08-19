REVOKE ALL ON FUNCTION public.get_sdr_webhook_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sdr_webhook_secret() TO service_role;
REVOKE ALL ON FUNCTION public.auto_bloquear_telefone_bot(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_bloquear_telefone_bot(text,text,text) TO service_role;