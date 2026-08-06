# Deploy — Pixel alinhado + atribuição LP → funil Marketing

## 1. SQL (Lovable Cloud SQL editor)

Cole e rode: `docs/SQL_META_PIXEL_E_FUNIL_LP.sql`

- Atualiza `meta_credentials.pixel_id` → `1035698672653512`
- Recria `v_meta_lead_funnel` incluindo leads de LP Meta

## 2. Edge Function

Redeploy `lp-lead-submit` (usa `_shared/metaAttribution.ts`).

No Lovable: pedir deploy da function `lp-lead-submit` com o código novo.

## 3. Frontend

Já incluso: LPs enviam `utm_*` + `ad_id` / `campaign_id` / `adset_id` / `fbclid` da URL.

## 4. URL tags recomendadas nos anúncios Meta

```
?utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.id}}&utm_term={{adset.name}}&ad_id={{ad.id}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}
```

## 5. Validação

| Check | Onde |
|-------|------|
| Pixel ID | `SELECT pixel_id FROM meta_credentials WHERE active` → `1035698672653512` |
| Lead LP no funil | Abrir LP com UTMs → submit → `v_meta_lead_funnel` tem a linha |
| Marketing | `/dashboard/vendas/meta-ads` → KPI “Leads (Meta)” sobe |
