/**
 * Meta Conversions API — recebe eventos de funil (form + mudança de stage)
 * e envia ao Pixel para otimização / lookalike.
 *
 * Auth: service role (chamada interna) OU JWT de usuário autenticado.
 * Body:
 *   { lead_id, stage?, event_name?, event_source_url?, force? }
 *   OU { contact_submission_id, stage?, ... }
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  sendCapiEvents,
  stageToCapiEvent,
  type CapiEventInput,
} from "../_shared/metaCapi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isMetaPlatform(platform: string | null | undefined, origem: string | null | undefined): boolean {
  const p = (platform ?? "").toLowerCase();
  const o = (origem ?? "").toLowerCase();
  return (
    p.includes("meta") ||
    p.includes("facebook") ||
    p.includes("instagram") ||
    o.includes("meta") ||
    o === "meta_lead_ads"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "only_post" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const isService = token === serviceKey;
  if (!isService) {
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? serviceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  let leadId = String(body.lead_id ?? "").trim();
  const csId = String(body.contact_submission_id ?? "").trim();
  const stageHint = body.stage != null ? String(body.stage) : null;
  const eventNameOverride = body.event_name != null ? String(body.event_name) : null;
  const force = body.force === true;
  const eventSourceUrl =
    body.event_source_url != null ? String(body.event_source_url) : null;

  if (!leadId && csId) {
    const { data: cs } = await supabase
      .from("contact_submissions")
      .select("lead_geral_id, stage, email")
      .eq("id", csId)
      .maybeSingle();
    leadId = (cs?.lead_geral_id as string) ?? "";
    if (!stageHint && cs?.stage) body.stage = cs.stage;
    if (!body.email && cs?.email) body.email = cs.email;
  }

  if (!leadId) return json({ error: "missing_lead_id" }, 400);

  // Purchase exige value real; mandar value=1 fake polui Advantage+ audiences.
  const purchaseValue =
    body.value != null ? Number(body.value) : null;
  const willBePurchase =
    (eventNameOverride ?? "") === "Purchase" ||
    stageHint === "ganho" ||
    (body.stage as string | undefined) === "ganho";
  if (willBePurchase && (purchaseValue == null || !Number.isFinite(purchaseValue) || purchaseValue <= 0)) {
    return json(
      { error: "missing_purchase_value", hint: "envie body.value com o valor real do contrato (BRL)" },
      400,
    );
  }

  const { data: lead, error: leadErr } = await supabase
    .from("leads_geral")
    .select(
      "id, full_name, phone_number, contato_whatsapp, platform, origem_sdr, stage, status_sdr, ad_id, campaign_id, sdr_contexto, dados_capturados, form_id",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr || !lead) return json({ error: "lead_not_found" }, 404);

  if (!force && !isMetaPlatform(lead.platform as string, lead.origem_sdr as string)) {
    return json({ ok: true, skipped: "not_meta_attribution" });
  }

  const ctx =
    lead.sdr_contexto && typeof lead.sdr_contexto === "object"
      ? (lead.sdr_contexto as Record<string, unknown>)
      : {};
  const dados =
    lead.dados_capturados && typeof lead.dados_capturados === "object"
      ? (lead.dados_capturados as Record<string, unknown>)
      : {};
  const click =
    (ctx.click as Record<string, string> | undefined) ??
    (dados.click as Record<string, string> | undefined) ??
    {};

  const { data: csRow } = await supabase
    .from("contact_submissions")
    .select("email, stage")
    .eq("lead_geral_id", leadId)
    .maybeSingle();

  const stage = String(stageHint ?? body.stage ?? lead.stage ?? csRow?.stage ?? "");
  const eventName = eventNameOverride || (stage ? stageToCapiEvent(stage) : null) || "Lead";

  const eventId = `${leadId}:${eventName}:${stage || "na"}`;

  // Idempotência
  const { data: already } = await supabase
    .from("meta_capi_events_log")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (already && !force) {
    return json({ ok: true, skipped: "duplicate", event_id: eventId });
  }

  const accessToken =
    Deno.env.get("META_USER_TOKEN_TEMPORARY") ??
    Deno.env.get("META_ACCESS_TOKEN") ??
    "";
  const { data: cred } = await supabase
    .from("meta_credentials")
    .select("pixel_id")
    .eq("active", true)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  const pixelId =
    (cred?.pixel_id as string) ||
    Deno.env.get("META_PIXEL_ID") ||
    "1035698672653512";

  if (!accessToken) {
    return json({ error: "missing_meta_token", hint: "Set META_USER_TOKEN_TEMPORARY" }, 500);
  }

  const email =
    (body.email as string | undefined) ??
    (csRow?.email as string | undefined) ??
    null;
  const phone =
    (lead.contato_whatsapp as string) ||
    (lead.phone_number as string) ||
    null;

  const events: CapiEventInput[] = [
    {
      eventName,
      eventId,
      eventSourceUrl:
        eventSourceUrl ||
        (dados.page_url as string) ||
        "https://borgesezembruski.com",
      actionSource: eventName === "Lead" ? "website" : "system_generated",
      userData: {
        email,
        phone,
        fbp: click.fbp ?? null,
        fbc: click.fbc ?? null,
        client_ip_address: (body.client_ip as string) ?? null,
        client_user_agent: (body.user_agent as string) ?? null,
        external_id: leadId,
      },
      customData: {
        content_name: stage || eventName,
        content_category: lead.form_id ?? lead.origem_sdr ?? undefined,
        status: stage || undefined,
        ad_id: lead.ad_id ?? undefined,
        campaign_id: lead.campaign_id ?? undefined,
        currency: eventName === "Purchase" ? "BRL" : undefined,
        value: eventName === "Purchase" ? purchaseValue ?? undefined : undefined,
      },
    },
  ];

  // No submit do form: Lead + CompleteRegistration se já entrou MQL
  if (eventName === "Lead" && stage === "mql") {
    const mqlId = `${leadId}:CompleteRegistration:mql`;
    const { data: mqlDone } = await supabase
      .from("meta_capi_events_log")
      .select("id")
      .eq("event_id", mqlId)
      .maybeSingle();
    if (!mqlDone) {
      events.push({
        ...events[0],
        eventName: "CompleteRegistration",
        eventId: mqlId,
        actionSource: "website",
        customData: { ...events[0].customData, content_name: "mql" },
      });
    }
  }

  const testCode = Deno.env.get("META_CAPI_TEST_EVENT_CODE") ?? null;
  const result = await sendCapiEvents({
    pixelId,
    accessToken,
    events,
    testEventCode: testCode,
  });

  for (const ev of events) {
    await supabase.from("meta_capi_events_log").upsert(
      {
        event_id: ev.eventId,
        lead_id: leadId,
        event_name: ev.eventName,
        stage: stage || null,
        ok: result.ok,
        response: result.body,
      },
      { onConflict: "event_id" },
    );
  }

  if (!result.ok) {
    console.error("[meta-capi-events] graph error", result.status, result.body);
    return json({ ok: false, graph: result.body }, 502);
  }

  return json({
    ok: true,
    events: events.map((e) => e.eventName),
    event_ids: events.map((e) => e.eventId),
    graph: result.body,
  });
});
