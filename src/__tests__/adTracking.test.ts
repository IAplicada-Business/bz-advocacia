import { describe, expect, it } from "vitest";
import { resolvePaidPlatform } from "@/lib/adTracking";

describe("resolvePaidPlatform", () => {
  it("detecta Google por gclid", () => {
    expect(
      resolvePaidPlatform({ click: { gclid: "abc" }, utm: { source: "facebook" } }),
    ).toBe("google_ads");
  });

  it("detecta Google por utm_source", () => {
    expect(
      resolvePaidPlatform({ utm: { source: "google", medium: "cpc" } }),
    ).toBe("google_ads");
  });

  it("detecta Meta por facebook/ad_id", () => {
    expect(
      resolvePaidPlatform({
        utm: { source: "facebook", medium: "paid" },
        meta: { ad_id: "12345" },
      }),
    ).toBe("meta_ads");
  });

  it("detecta Meta por fbclid", () => {
    expect(
      resolvePaidPlatform({ meta: { fbclid: "xyz" } }),
    ).toBe("meta_ads");
  });

  it("organic sem sinais pagos", () => {
    expect(resolvePaidPlatform({ utm: { source: "site" } })).toBe("organic");
  });
});
