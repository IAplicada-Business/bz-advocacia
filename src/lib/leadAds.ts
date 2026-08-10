/**
 * Detecta se um lead do CRM deve aparecer na aba "Leads Anúncios".
 * Usa vários sinais — is_organic sozinho falha quando o espelho CRM
 * ficou com origem errada ou o flag veio nulo.
 */

const ADS_ORIGENS = new Set([
  "facebook",
  "instagram",
  "meta",
  "tiktok",
  "linkedin",
  "google",
]);

const ADS_ORIGEM_SDR = new Set([
  "meta_lead_ads",
  "facebook_ads",
  "instagram_ads",
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "linkedin_ads",
]);

export type AdsLeadSignals = {
  is_organic?: boolean | null;
  origem?: string | null;
  origem_sdr?: string | null;
  platform?: string | null;
  dados_capturados?: Record<string, unknown> | null;
  ad_id?: string | null;
  campaign_id?: string | null;
};

export function isAdsLead(l: AdsLeadSignals): boolean {
  const origem = (l.origem ?? "").toLowerCase();
  if (ADS_ORIGENS.has(origem)) return true;

  const sdr = (l.origem_sdr ?? "").toLowerCase();
  if (ADS_ORIGEM_SDR.has(sdr)) return true;

  const platform = (l.platform ?? "").toLowerCase();
  if (platform.endsWith("_ads")) return true;

  if (l.ad_id || l.campaign_id) return true;

  if (l.is_organic === false) return true;

  const cap = l.dados_capturados;
  if (cap && typeof cap === "object") {
    const source = String(cap.source ?? "");
    const slug = String(cap.slug ?? "");
    if (source === "lp_form" || slug === "saude" || slug === "inventario" || slug === "divorcio") {
      const utm = String(cap.utm_source ?? "").toLowerCase();
      if (utm === "organic" || utm === "site") return false;
      // LPs são majoritariamente mídia paga
      return true;
    }
  }

  return false;
}
