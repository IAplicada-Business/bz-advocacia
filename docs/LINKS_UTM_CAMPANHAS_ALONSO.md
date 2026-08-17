# Links UTM — Campanhas Google + Meta (B&Z)

Base das LPs (produção): `https://gestao.borgesezembruski.com`

Cole estes links **como URL de destino** no anúncio (Meta) ou **URL final** no Google Ads.
Macros `{{…}}` (Meta) e `{…}` (Google) são preenchidas automaticamente pelas plataformas.

---

## Meta Ads (Facebook / Instagram)

Objetivo do anúncio: **Geração de leads** (não tráfego).  
Máx. **2 anúncios** por campanha. Região: **Sul**.

### Templates com macros (recomendado — cola igual em todos os ads da campanha)

**Inventário**
```
https://gestao.borgesezembruski.com/lpinventario?utm_source=facebook&utm_medium=paid&utm_campaign=meta_inventario&utm_content={{ad.name}}&utm_term={{adset.name}}&ad_id={{ad.id}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}
```

**Saúde**
```
https://gestao.borgesezembruski.com/lpsaude?utm_source=facebook&utm_medium=paid&utm_campaign=meta_saude&utm_content={{ad.name}}&utm_term={{adset.name}}&ad_id={{ad.id}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}
```

**Divórcio**
```
https://gestao.borgesezembruski.com/lpdivorcio?utm_source=facebook&utm_medium=paid&utm_campaign=meta_divorcio&utm_content={{ad.name}}&utm_term={{adset.name}}&ad_id={{ad.id}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}
```

Instagram: pode trocar `utm_source=facebook` por `utm_source=instagram` (mesmo restante).

Orçamento combinado na call: ~**R$ 50/dia por campanha** Meta.

---

## Google Ads (Rede de Pesquisa)

Ative **marcação automática** (auto-tagging / gclid) na conta Google Ads.  
Use a URL final abaixo (ValueTrack preenche criativo e palavra-chave).

**Inventário**
```
https://gestao.borgesezembruski.com/lpinventario?utm_source=google&utm_medium=cpc&utm_campaign=google_inventario&utm_content={creative}&utm_term={keyword}
```

**Saúde**
```
https://gestao.borgesezembruski.com/lpsaude?utm_source=google&utm_medium=cpc&utm_campaign=google_saude&utm_content={creative}&utm_term={keyword}
```

**Divórcio**
```
https://gestao.borgesezembruski.com/lpdivorcio?utm_source=google&utm_medium=cpc&utm_campaign=google_divorcio&utm_content={creative}&utm_term={keyword}
```

Orçamento combinado na call: ~**R$ 60/dia** Google.

---

## Checklist rápido (Alonso)

| Canal | Campanha | LP | utm_campaign |
|-------|----------|-----|--------------|
| Meta | Inventário | `/lpinventario` | `meta_inventario` |
| Meta | Saúde | `/lpsaude` | `meta_saude` |
| Meta | Divórcio | `/lpdivorcio` | `meta_divorcio` |
| Google | Inventário | `/lpinventario` | `google_inventario` |
| Google | Saúde | `/lpsaude` | `google_saude` |
| Google | Divórcio | `/lpdivorcio` | `google_divorcio` |

1. Não remova `ad_id` / `campaign_id` / `adset_id` nos links Meta — o CRM usa isso no funil Marketing.  
2. Google: confirme auto-tagging ON (gclid entra sozinho na URL).  
3. Depois de subir, abra a LP com o link do anúncio e confira na barra se os UTMs aparecem.  
4. CRM → Marketing → aba **Por Anúncio** mostra gasto → leads → MQL → ganho.

---

## Validação no CRM

| Check | Onde |
|-------|------|
| Lead Meta com `ad_id` | `leads_geral.ad_id` / Marketing → Por Anúncio |
| Lead Google | `platform=google_ads`, `sdr_contexto.utm` / `gclid` |
| Pixel Lead | Events Manager → Pixel `1035698672653512` |
| CAPI etapas | Events Manager → eventos `Lead`, `CompleteRegistration`, `Schedule`, `Purchase` |
