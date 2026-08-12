/** Leitura de UTMs + click IDs (Meta/Google) nas LPs. */

export type LpUtm = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

export type LpMetaIds = {
  ad_id?: string;
  campaign_id?: string;
  adset_id?: string;
  fbclid?: string;
};

export type LpClickIds = {
  gclid?: string;
  fbp?: string;
  fbc?: string;
};

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const v = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return v?.trim() || undefined;
}

export function readUtms(): LpUtm {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const pick = (key: string) => params.get(key) ?? params.get(key.toUpperCase()) ?? undefined;
  return {
    source: pick("utm_source") || undefined,
    medium: pick("utm_medium") || undefined,
    campaign: pick("utm_campaign") || undefined,
    content: pick("utm_content") || undefined,
    term: pick("utm_term") || undefined,
  };
}

export function readMetaIds(): LpMetaIds {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = params.get(k) ?? params.get(k.toUpperCase());
      if (v?.trim()) return v.trim();
    }
    return undefined;
  };
  return {
    ad_id: pick("ad_id", "adid", "hsa_ad"),
    campaign_id: pick("campaign_id", "campaignid", "hsa_cam"),
    adset_id: pick("adset_id", "adsetid", "hsa_grp"),
    fbclid: pick("fbclid"),
  };
}

/** gclid (Google) + cookies _fbp/_fbc (Meta CAPI). */
export function readClickIds(): LpClickIds {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const gclid =
    params.get("gclid")?.trim() ||
    params.get("GCLID")?.trim() ||
    undefined;
  return {
    gclid: gclid || undefined,
    fbp: cookie("_fbp"),
    fbc: cookie("_fbc") || (params.get("fbclid") ? buildFbc(params.get("fbclid")!) : undefined),
  };
}

function buildFbc(fbclid: string): string {
  // Formato Meta: fb.1.<ts>.<fbclid>
  return `fb.1.${Date.now()}.${fbclid}`;
}

export function resolvePaidPlatform(opts: {
  utm?: LpUtm;
  meta?: LpMetaIds;
  click?: LpClickIds;
}): "google_ads" | "meta_ads" | "organic" {
  const src = (opts.utm?.source ?? "").toLowerCase();
  const med = (opts.utm?.medium ?? "").toLowerCase();
  if (
    opts.click?.gclid ||
    src === "google" ||
    src === "googleads" ||
    (med === "cpc" && src.includes("google"))
  ) {
    return "google_ads";
  }
  if (
    opts.meta?.ad_id ||
    opts.meta?.fbclid ||
    opts.click?.fbc ||
    src === "facebook" ||
    src === "instagram" ||
    src === "fb" ||
    src === "ig" ||
    src === "meta"
  ) {
    return "meta_ads";
  }
  if (med === "cpc" || med === "paid" || med === "ppc" || med === "paidsocial") {
    if (src.includes("google")) return "google_ads";
    return "meta_ads";
  }
  return "organic";
}
