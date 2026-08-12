/**
 * Detecta se um lead do CRM deve aparecer na aba "Leads Anúncios".
 *
 * Sinais de ads (qualquer um, após exclusões orgânicas):
 * - platform *_ads / origem_sdr de mídia paga / ad_id|campaign_id
 * - is_organic = false
 * - form LP (source=lp_form ou form_id lp_*), salvo UTM orgânico
 *
 * NÃO usa area/slug (saude/inventario/familia) — o bot grava esses valores
 * em leads orgânicos durante a qualificação.
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

function isOrganicUtm(cap: Record<string, unknown> | null | undefined): boolean {
  if (!cap || typeof cap !== "object") return false;
  const utm = String(cap.utm_source ?? "").toLowerCase();
  const medium = String(cap.utm_medium ?? "").toLowerCase();
  return utm === "organic" || utm === "site" || medium === "organic";
}

function isLpFormSignal(cap: Record<string, unknown> | null | undefined): boolean {
  if (!cap || typeof cap !== "object") return false;
  const source = String(cap.source ?? "");
  const formId = String(cap.form_id ?? "");
  return (
    source === "lp_form" ||
    source === "public_form_submit" ||
    formId.startsWith("lp_")
  );
}

export function isAdsLead(l: AdsLeadSignals): boolean {
  // Exclusões orgânicas primeiro (evita is_organic=false do backfill LP orgânica)
  if (isOrganicUtm(l.dados_capturados)) return false;
  if (l.is_organic === true) return false;

  const origem = (l.origem ?? "").toLowerCase();
  if (ADS_ORIGENS.has(origem)) return true;

  const sdr = (l.origem_sdr ?? "").toLowerCase();
  if (ADS_ORIGEM_SDR.has(sdr)) return true;

  const platform = (l.platform ?? "").toLowerCase();
  if (platform.endsWith("_ads")) return true;

  if (l.ad_id || l.campaign_id) return true;

  if (l.is_organic === false) return true;

  // LP form sem UTM orgânico → ads (default das LPs pagas). Sem area/slug.
  if (isLpFormSignal(l.dados_capturados)) return true;

  return false;
}
