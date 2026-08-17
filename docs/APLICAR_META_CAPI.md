# Deploy — Meta CAPI + aba Por Anúncio

## 1. SQL (Supabase SQL Editor)

Cole e rode: `docs/SQL_META_CAPI_AD_FUNNEL.sql`

## 2. Edge Functions

```bash
supabase functions deploy meta-capi-events --no-verify-jwt
supabase functions deploy public-form-submit --no-verify-jwt
```

Secret já usado pelo sync Meta:

```bash
# deve existir (mesmo token do meta-sync-*)
supabase secrets set META_USER_TOKEN_TEMPORARY=<token_com_ads_management>
```

Opcional (Events Manager → Test Events):

```bash
supabase secrets set META_CAPI_TEST_EVENT_CODE=TEST12345
```

## 3. Links UTM para Alonso

Ver `docs/LINKS_UTM_CAMPANHAS_ALONSO.md` — copiar e colar nos ads.

## 4. Eventos CAPI por etapa

| Etapa CRM | Evento Meta |
|-----------|-------------|
| Form submit | `Lead` |
| MQL | `CompleteRegistration` |
| Conectado | `Contact` |
| Reunião agendada | `Schedule` |
| Proposta | `SubmitApplication` |
| Ganho | `Purchase` |

Só dispara para leads com atribuição Meta (`platform` meta/facebook/instagram).

## 5. Validação

| Check | Onde |
|-------|------|
| Aba Por Anúncio | `/dashboard/vendas/meta-ads` → **Por Anúncio** |
| View | `SELECT count(*) FROM v_meta_ad_crm_funnel` |
| CAPI log | `SELECT * FROM meta_capi_events_log ORDER BY created_at DESC LIMIT 20` |
| Events Manager | Pixel `1035698672653512` → eventos server |
