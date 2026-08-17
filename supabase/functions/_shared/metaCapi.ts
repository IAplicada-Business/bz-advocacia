/**
 * Meta Conversions API (CAPI) — envia eventos de funil para o Pixel
 * (lookalike / otimização por etapas: Lead → MQL → Schedule → Purchase).
 */

export type CapiUserData = {
  email?: string | null;
  phone?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  client_ip_address?: string | null;
  client_user_agent?: string | null;
  external_id?: string | null;
};

export type CapiEventInput = {
  eventName: string;
  eventTime?: number;
  eventId: string;
  eventSourceUrl?: string | null;
  actionSource?: "website" | "system_generated" | "other";
  userData: CapiUserData;
  customData?: Record<string, unknown>;
};

const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v25.0";

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Normaliza e-mail para hash CAPI (lowercase trim). */
export function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  return e.includes("@") ? e : null;
}

/** Telefone só dígitos, preferindo E.164 BR (55…). */
export function normalizePhone(phone: string | null | undefined): string | null {
  let d = (phone ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length >= 10 && d.length <= 11) d = `55${d}`;
  if (d.length < 12) return null;
  return d;
}

export async function buildUserData(u: CapiUserData): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  const email = normalizeEmail(u.email);
  const phone = normalizePhone(u.phone);
  if (email) out.em = [await sha256Hex(email)];
  if (phone) out.ph = [await sha256Hex(phone)];
  if (u.external_id) out.external_id = [await sha256Hex(String(u.external_id))];
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  if (u.client_ip_address) out.client_ip_address = u.client_ip_address;
  if (u.client_user_agent) out.client_user_agent = u.client_user_agent;
  return out;
}

/** Mapeia stage do CRM → evento padrão Meta (otimização / lookalike). */
export function stageToCapiEvent(stage: string): string | null {
  switch (stage) {
    case "mql":
      return "CompleteRegistration";
    case "conectado":
      return "Contact";
    case "reuniao_agendada":
      return "Schedule";
    case "proposta":
      return "SubmitApplication";
    case "ganho":
      return "Purchase";
    default:
      return null;
  }
}

export async function sendCapiEvents(opts: {
  pixelId: string;
  accessToken: string;
  events: CapiEventInput[];
  testEventCode?: string | null;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  if (!opts.pixelId || !opts.accessToken || opts.events.length === 0) {
    return { ok: false, status: 0, body: { error: "missing_config_or_events" } };
  }

  const data = [];
  for (const ev of opts.events) {
    data.push({
      event_name: ev.eventName,
      event_time: ev.eventTime ?? Math.floor(Date.now() / 1000),
      event_id: ev.eventId,
      action_source: ev.actionSource ?? "website",
      event_source_url: ev.eventSourceUrl ?? undefined,
      user_data: await buildUserData(ev.userData),
      custom_data: ev.customData ?? undefined,
    });
  }

  const url = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${opts.pixelId}/events`,
  );
  const body: Record<string, unknown> = {
    data,
    access_token: opts.accessToken,
  };
  if (opts.testEventCode) body.test_event_code = opts.testEventCode;

  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, body: json };
}
