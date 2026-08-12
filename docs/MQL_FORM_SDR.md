# MQL Form ↔ SDR (sem repetir perguntas)

## Fluxo

```
LP form → public-form-submit
  → classificar() (regras MQL)
  → leads_geral (oferta_origem, form_score, form_flags, sdr_contexto, stage)
  → lead_form_answers (snapshot)
  → se mql|conectado → whatsapp-bot-dispatch (M0 personalizado)
  → se desq pensão/guarda → notify-mariana-desq
```

## Deploy

1. SQL: `docs/SQL_MQL_FORM_SDR.sql` (ou migration `20260812160000_mql_form_sdr_contexto.sql`)
2. Functions:
   ```bash
   supabase functions deploy public-form-submit --no-verify-jwt
   supabase functions deploy classify-form-lead --no-verify-jwt
   supabase functions deploy whatsapp-bot-dispatch --no-verify-jwt
   supabase functions deploy notify-mariana-desq --no-verify-jwt
   supabase functions deploy on-new-lead
   supabase functions deploy whatsapp-inbound --no-verify-jwt
   ```
3. Frontend: LPs já apontam para `public-form-submit`.

## Testes

```bash
npm run test:run -- supabase/functions/_shared/classify-form.test.ts
```

## Ofertas

| LP slug | oferta |
|---------|--------|
| divorcio | partilha_protegida |
| inventario | inventario_otimizado |
| saude | cobertura_garantida |

Stages: `mql` | `conectado` | `desqualificado` | `continuidade`.
