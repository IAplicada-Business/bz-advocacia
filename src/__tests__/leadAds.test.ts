import { describe, expect, it } from "vitest";
import { isAdsLead } from "@/lib/leadAds";

describe("isAdsLead", () => {
  it("não marca lead orgânico só porque area/slug é saude|inventario|familia", () => {
    expect(
      isAdsLead({
        is_organic: true,
        origem: "whatsapp_organico",
        origem_sdr: "whatsapp_bot",
        platform: "whatsapp_organico",
        dados_capturados: { area: "saude", slug: "saude" },
      }),
    ).toBe(false);

    expect(
      isAdsLead({
        is_organic: null,
        origem: "whatsapp_organico",
        platform: "whatsapp_organico",
        dados_capturados: { area: "inventario", slug: "inventario" },
      }),
    ).toBe(false);
  });

  it("LP paga (lp_form / form_id) conta como ads", () => {
    expect(
      isAdsLead({
        dados_capturados: { source: "lp_form", form_id: "lp_saude", utm_source: "facebook" },
      }),
    ).toBe(true);

    expect(
      isAdsLead({
        dados_capturados: { form_id: "lp_inventario" },
      }),
    ).toBe(true);
  });

  it("LP com UTM orgânico NÃO conta como ads (mesmo com is_organic=false do backfill)", () => {
    expect(
      isAdsLead({
        is_organic: false,
        origem: "meta",
        dados_capturados: {
          source: "lp_form",
          form_id: "lp_saude",
          utm_source: "organic",
          utm_medium: "organic",
        },
      }),
    ).toBe(false);

    expect(
      isAdsLead({
        is_organic: false,
        dados_capturados: {
          form_id: "lp_familia",
          utm_source: "site",
        },
      }),
    ).toBe(false);
  });

  it("is_organic=true vence origem meta residual", () => {
    expect(
      isAdsLead({
        is_organic: true,
        origem: "meta",
        platform: "whatsapp_organico",
      }),
    ).toBe(false);
  });

  it("platform *_ads / ad_id / origem_sdr ads contam", () => {
    expect(isAdsLead({ platform: "instagram_ads" })).toBe(true);
    expect(isAdsLead({ ad_id: "123" })).toBe(true);
    expect(isAdsLead({ origem_sdr: "meta_lead_ads" })).toBe(true);
  });
});
