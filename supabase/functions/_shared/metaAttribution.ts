/**
 * Resolve atribuição Meta a partir de UTMs / IDs da URL das LPs.
 * Preenche ad_id, campaign_id, adset_* para o funil Marketing (v_meta_lead_funnel).
 */

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

export type MetaAttribution = {
  ad_id: string | null;
  ad_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  fbclid: string | null;
};

// deno-lint-ignore no-explicit-any
type Sb = any;

function looksLikeMetaId(v: string | undefined | null): v is string {
  return !!v && /^\d{5,}$/.test(v.trim());
}

function clean(v: string | undefined | null): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

export async function resolveMetaAttribution(
  supabase: Sb,
  utm?: LpUtm,
  meta?: LpMetaIds,
): Promise<MetaAttribution> {
  let ad_id = clean(meta?.ad_id);
  let campaign_id = clean(meta?.campaign_id);
  let adset_id = clean(meta?.adset_id);
  let ad_name: string | null = null;
  let campaign_name = clean(utm?.campaign);
  let adset_name = clean(utm?.term);
  const fbclid = clean(meta?.fbclid);

  // utm_content / utm_campaign numéricos = IDs dinâmicos {{ad.id}} / {{campaign.id}}
  if (!ad_id && looksLikeMetaId(utm?.content)) ad_id = utm!.content!.trim();
  if (!campaign_id && looksLikeMetaId(utm?.campaign)) {
    campaign_id = utm!.campaign!.trim();
    campaign_name = null; // será resolvido pelo nome na tabela
  }
  if (!adset_id && looksLikeMetaId(utm?.term)) adset_id = utm!.term!.trim();

  // Resolve anúncio → campanha / ad set
  if (ad_id) {
    try {
      const { data: ad } = await supabase
        .from("meta_ads")
        .select("id, name, campaign_id, ad_set_id")
        .eq("id", ad_id)
        .maybeSingle();
      if (ad) {
        ad_name = (ad.name as string) ?? ad_name;
        campaign_id = campaign_id ?? (ad.campaign_id as string) ?? null;
        adset_id = adset_id ?? (ad.ad_set_id as string) ?? null;
      } else if (!ad_name) {
        ad_name = clean(utm?.content) && !looksLikeMetaId(utm?.content)
          ? clean(utm?.content)
          : `ad_${ad_id}`;
      }
    } catch (e) {
      console.warn("[metaAttribution] meta_ads lookup failed:", e);
    }
  } else if (clean(utm?.content) && !looksLikeMetaId(utm?.content)) {
    ad_name = clean(utm?.content);
  }

  // Resolve campanha por ID
  if (campaign_id) {
    try {
      const { data: c } = await supabase
        .from("meta_campaigns")
        .select("id, name")
        .eq("id", campaign_id)
        .maybeSingle();
      if (c?.name) campaign_name = c.name as string;
    } catch (e) {
      console.warn("[metaAttribution] meta_campaigns by id failed:", e);
    }
  } else if (campaign_name && !looksLikeMetaId(campaign_name)) {
    // Match por nome (utm_campaign = {{campaign.name}})
    try {
      const { data: c } = await supabase
        .from("meta_campaigns")
        .select("id, name")
        .ilike("name", campaign_name)
        .limit(1)
        .maybeSingle();
      if (c?.id) {
        campaign_id = c.id as string;
        campaign_name = (c.name as string) ?? campaign_name;
      }
    } catch (e) {
      console.warn("[metaAttribution] meta_campaigns by name failed:", e);
    }
  }

  // Resolve ad set nome
  if (adset_id) {
    try {
      const { data: s } = await supabase
        .from("meta_ad_sets")
        .select("id, name")
        .eq("id", adset_id)
        .maybeSingle();
      if (s?.name) adset_name = s.name as string;
    } catch (e) {
      console.warn("[metaAttribution] meta_ad_sets lookup failed:", e);
    }
  }

  return {
    ad_id,
    ad_name,
    campaign_id,
    campaign_name,
    adset_id,
    adset_name,
    fbclid,
  };
}
