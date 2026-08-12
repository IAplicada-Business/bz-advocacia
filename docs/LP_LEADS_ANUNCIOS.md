# LP → Leads Anúncios

## Regra de negócio

A aba **Leads Anúncios** deve listar:

1. Leads dos **forms das LPs** (`/lpsaude`, `/lpinventario`, `/lpdivorcio`) — mídia paga por padrão
2. Leads de **WhatsApp** classificados como ads (CTWA / `platform *_ads` / `origem_sdr = meta_lead_ads`)

Orgânicos (sem UTM pago / WhatsApp orgânico) ficam em **Leads Orgânicos**.

## Bugs corrigidos

1. **Telefone já existia como Perdido** — o form retornava sucesso, mas o lead ficava em Perdidos e `Novos` = 0. Agora reabre (`status_sdr=novo`, `stage=mql`).
2. **Espelho CRM sem `stage`** — o kanban prioriza `stage` sobre `estagio`; o espelho agora grava os dois.
3. **Filtro da aba** — `isAdsLead()` usa origem, `origem_sdr`, platform, `ad_id` e `dados_capturados.source=lp_form`.

## Deploy (Lovable)

1. SQL: `docs/SQL_LEADS_ANUNCIOS_FIX.sql`
2. Redeploy Edge Functions: `lp-lead-submit`, `whatsapp-inbound` (compartilham `_shared/db.ts`)
3. Publish frontend
