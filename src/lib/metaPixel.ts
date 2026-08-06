/** Meta Pixel — Borges & Zembruski (só LPs públicas). */
export const META_PIXEL_ID = "1035698672653512";

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

function ensureFbq(): Fbq | undefined {
  if (typeof window === "undefined") return undefined;
  if (window.fbq) return window.fbq;

  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as Fbq;

  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";

  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);

  return fbq;
}

let initialized = false;

/** Carrega o Pixel (uma vez) e dispara PageView — chamar ao montar cada LP. */
export function trackMetaPageView() {
  const fbq = ensureFbq();
  if (!fbq) return;

  if (!initialized) {
    fbq("init", META_PIXEL_ID);
    initialized = true;
  }
  fbq("track", "PageView");
}

/** Dispara Lead após formulário da LP enviar com sucesso. */
export function trackMetaLead(opts?: { contentName?: string; contentCategory?: string }) {
  const fbq = ensureFbq();
  if (!fbq) return;
  if (!initialized) {
    fbq("init", META_PIXEL_ID);
    initialized = true;
  }
  const payload: Record<string, string> = {};
  if (opts?.contentName) payload.content_name = opts.contentName;
  if (opts?.contentCategory) payload.content_category = opts.contentCategory;
  if (Object.keys(payload).length > 0) {
    fbq("track", "Lead", payload);
  } else {
    fbq("track", "Lead");
  }
}
