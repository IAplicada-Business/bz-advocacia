-- Alinha o trigger de novo lead ao header que on-new-lead valida (x-webhook-secret).
-- Antes: Authorization Bearer service_role → rejeitado (401) e M0 não saía.

create or replace function public.trg_on_new_lead_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'sdr_webhook_secret'
    limit 1;

  if v_secret is null or btrim(v_secret) = '' then
    raise warning '[trg_on_new_lead_webhook] sdr_webhook_secret ausente no Vault';
    return new;
  end if;

  perform net.http_post(
    url := 'https://nvkxblrwblhvggndlfax.functions.supabase.co/on-new-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type',   'INSERT',
      'table',  'leads_geral',
      'record', row_to_json(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_leads_geral_on_new_lead on public.leads_geral;
create trigger trg_leads_geral_on_new_lead
after insert on public.leads_geral
for each row execute function public.trg_on_new_lead_webhook();
