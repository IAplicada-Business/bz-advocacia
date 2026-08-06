// Atribuição Meta/Ads para leads vindos das LPs.
// Lê UTMs + ad_id / campaign_id / adset_id / fbclid da URL da página
// e devolve o patch de colunas do leads_geral + blob p/ dados_capturados.

export interface MetaAttributionInput {
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  ads?: Record<string, string | undefined>;
  pageUrl?: string;
}

export interface MetaAttribution {
  /** Colunas reais de public.leads_geral */
  leadColumns: Record<string, unknown>;
  /** Chaves para o blob dados_capturados (auditoria/funil) */
  capturados: Record<string, unknown>;
}

const AD_KEYS = [
  "ad_id",
  "adset_id",
  "campaign_id",
  "fbclid",
  "ad_name",
  "adset_name",
  "campaign_name",
] as const;

function clean(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s || s.startsWith("{{")) return null; // placeholder Meta não substituído
  return s.slice(0, 200);
}

/** Extrai params relevantes da própria pageUrl (fallback quando o client não mandou). */
function fromPageUrl(pageUrl?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!pageUrl) return out;
  try {
    const url = new URL(pageUrl);
    for (const [k, v] of url.searchParams.entries()) {
      const key = k.toLowerCase();
      const val = clean(v);
      if (!val) continue;
      if ((AD_KEYS as readonly string[]).includes(key) || key.startsWith("utm_")) {
        out[key] = val;
      }
    }
  } catch {
    /* url inválida, ignora */
  }
  return out;
}

export function buildMetaAttribution(input: MetaAttributionInput): MetaAttribution {
  const url = fromPageUrl(input.pageUrl);
  const ads = input.ads ?? {};

  const pick = (key: string) => clean(ads[key]) ?? clean(url[key]);

  const utm = {
    source: clean(input.utm?.source) ?? clean(url.utm_source),
    medium: clean(input.utm?.medium) ?? clean(url.utm_medium),
    campaign: clean(input.utm?.campaign) ?? clean(url.utm_campaign),
    content: clean(input.utm?.content) ?? clean(url.utm_content),
    term: clean(input.utm?.term) ?? clean(url.utm_term),
  };

  const adId = pick("ad_id") ?? (utm.content && /^\d{6,}$/.test(utm.content) ? utm.content : null);
  const adsetId = pick("adset_id");
  const campaignId = pick("campaign_id");
  const fbclid = pick("fbclid");
  const campaignName = pick("campaign_name") ?? utm.campaign;

  const leadColumns: Record<string, unknown> = {};
  if (adId) leadColumns.ad_id = adId;
  if (adsetId) leadColumns.adset_id = adsetId;
  if (campaignId) leadColumns.campaign_id = campaignId;
  if (campaignName) leadColumns.campaign_name = campaignName;
  const adsetName = pick("adset_name");
  if (adsetName) leadColumns.adset_name = adsetName;

  const capturados: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(utm)) {
    if (v) capturados[`utm_${k}`] = v;
  }
  if (adId) capturados.ad_id = adId;
  if (adsetId) capturados.adset_id = adsetId;
  if (campaignId) capturados.campaign_id = campaignId;
  if (fbclid) capturados.fbclid = fbclid;
  if (input.pageUrl) capturados.page_url = input.pageUrl;

  return { leadColumns, capturados };
}
