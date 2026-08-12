// Endpoint público das LPs — CORS aberto, rate limit, não vaza score/flags.
// Body: { oferta | slug, respostas | values, contato?, utm?, meta?, pageUrl? }

import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  classificar,
  statusSdrFromStage,
  type FormPayload,
  type Oferta,
} from "../_shared/classify-form.ts";
import {
  mapValuesToRespostas,
  ofertaToArea,
  ofertaToSlug,
  slugToOferta,
  type LpSlug,
} from "../_shared/lp-oferta-map.ts";
import {
  buscarLeadPorTelefone,
  espelharContactSubmission,
} from "../_shared/db.ts";
import { normalizarTelefone } from "../_shared/zapi.ts";
import { resolveMetaAttribution } from "../_shared/metaAttribution.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseContato(raw: string): { nome: string; telefone: string } | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  let phoneMatch = text.match(
    /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/,
  );
  if (!phoneMatch) {
    const digitBlocks = text.match(/\d[\d\s().-]{8,}\d/g) ?? [];
    for (const block of digitBlocks) {
      const digits = block.replace(/\D/g, "");
      if (digits.length >= 10 && digits.length <= 13) {
        phoneMatch = [block] as RegExpMatchArray;
        break;
      }
    }
  }
  if (!phoneMatch) return null;
  const telefoneBruto = phoneMatch[0];
  const telefone = normalizarTelefone(telefoneBruto);
  if (telefone.length < 12 || telefone.length > 13) return null;
  let nome = text.replace(telefoneBruto, " ").replace(/\s+/g, " ").trim();
  nome = nome.replace(/^[\s,;.\-–—|/]+|[\s,;.\-–—|/]+$/g, "").trim();
  nome = nome.replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
  if (!nome || nome.length < 2) nome = "Lead LP";
  return { nome, telefone };
}

function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

async function dispararBot(leadId: string): Promise<void> {
  try {
    const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resp = await fetch(`${base}/functions/v1/whatsapp-bot-dispatch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lead_id: leadId, trigger: "form_submit" }),
    });
    if (!resp.ok) {
      console.error("[public-form-submit] bot-dispatch", resp.status, await resp.text());
    }
  } catch (e) {
    console.error("[public-form-submit] bot-dispatch failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "only_post" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Rate limit: 5 submits / 10 min por IP
  const ip = clientIp(req);
  const ipHash = await hashIp(ip);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("form_submit_rate")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) {
    return json({ error: "rate_limited", message: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  }
  await supabase.from("form_submit_rate").insert({ ip_hash: ipHash });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const slugRaw = String(body.slug ?? "").toLowerCase();
  const ofertaRaw = String(body.oferta ?? "");
  const oferta: Oferta = ofertaRaw
    ? (ofertaRaw as Oferta)
    : slugToOferta(slugRaw || "saude");

  const values = (body.values ?? body.respostas ?? {}) as Record<
    string,
    string | string[]
  >;

  let nome = "";
  let telefone = "";
  let email: string | undefined;
  let melhorHorario: string | undefined;

  const contatoObj = body.contato as
    | { nome?: string; whatsapp?: string; email?: string; melhor_horario?: string }
    | undefined;

  if (contatoObj?.whatsapp && contatoObj?.nome) {
    nome = contatoObj.nome;
    telefone = normalizarTelefone(contatoObj.whatsapp);
    email = contatoObj.email;
    melhorHorario = contatoObj.melhor_horario;
  } else {
    const rawContato = String(values.contato ?? values.nome_whatsapp ?? "");
    const parsed = parseContato(rawContato);
    if (!parsed) {
      return json(
        {
          error: "invalid_contato",
          message: "Informe nome e WhatsApp com DDD (ex.: Ana 11999998888).",
        },
        400,
      );
    }
    nome = parsed.nome;
    telefone = parsed.telefone;
  }

  const respostas = mapValuesToRespostas(oferta, values);
  const utm = (body.utm ?? {}) as Record<string, string>;
  const meta = body.meta as
    | { ad_id?: string; campaign_id?: string; adset_id?: string; fbclid?: string }
    | undefined;
  const click = (body.click ?? {}) as {
    gclid?: string;
    fbp?: string;
    fbc?: string;
  };
  const userAgent =
    typeof body.userAgent === "string"
      ? body.userAgent
      : req.headers.get("user-agent") ?? undefined;

  const payload: FormPayload = {
    oferta,
    respostas,
    contato: { nome, whatsapp: telefone, email, melhor_horario: melhorHorario },
    utm,
  };

  let decisao;
  try {
    decisao = classificar(payload);
  } catch (e) {
    console.error("[public-form-submit] classificar fallback:", e);
    decisao = {
      stage: "conectado" as const,
      score: 0,
      flags: ["FALLBACK_CLASSIFY_ERROR"],
    };
  }

  const area = ofertaToArea(oferta);
  const slug = ofertaToSlug(oferta) as LpSlug;
  const tipoServico = area === "familia" ? "familia" : area;

  const attribution = await resolveMetaAttribution(
    supabase,
    {
      source: utm.source,
      medium: utm.medium,
      campaign: utm.campaign,
      content: utm.content,
      term: utm.term,
    },
    meta,
  );

  const src = (utm.source ?? "").toLowerCase();
  const med = (utm.medium ?? "").toLowerCase();
  const isGoogle =
    !!click.gclid ||
    src === "google" ||
    src === "googleads" ||
    (med === "cpc" && src.includes("google"));
  const isMeta =
    !isGoogle &&
    (!!attribution.ad_id ||
      !!meta?.fbclid ||
      !!click.fbc ||
      ["facebook", "instagram", "fb", "ig", "meta"].includes(src) ||
      med === "paid" ||
      med === "paidsocial");
  const platform = isGoogle ? "google_ads" : isMeta ? "meta_ads" : "meta_ads";
  const origemSdr = isGoogle ? "google_ads" : "meta_lead_ads";

  const sdrContexto = {
    respostas,
    melhor_horario: melhorHorario ?? null,
    utm,
    click: {
      gclid: click.gclid ?? null,
      fbp: click.fbp ?? null,
      fbc: click.fbc ?? null,
    },
    redirecionamento: decisao.redirecionamento ?? null,
    oferta,
  };

  const leadPatch: Record<string, unknown> = {
    full_name: nome,
    phone_number: telefone,
    contato_whatsapp: telefone,
    oferta_origem: oferta,
    form_score: decisao.score,
    form_flags: decisao.flags,
    form_desqualificacao: decisao.desqualificacao ?? null,
    stage: decisao.stage,
    status_sdr: statusSdrFromStage(decisao.stage),
    sdr_contexto: sdrContexto,
    tipo_servico: tipoServico,
    area_normalizada: area,
    prioridade_max: decisao.flags.includes("PRIORIDADE_MAX"),
    bot_pausado:
      decisao.stage === "desqualificado" || decisao.stage === "continuidade",
    etapa_qualificacao: "M0",
    platform,
    origem_sdr: origemSdr,
    is_organic: false,
    ad_id: attribution.ad_id,
    ad_name: attribution.ad_name ?? `lp_${slug}`,
    campaign_id: attribution.campaign_id,
    campaign_name: attribution.campaign_name ?? utm.campaign ?? null,
    adset_id: attribution.adset_id,
    adset_name: attribution.adset_name,
    dados_capturados: {
      source: "public_form_submit",
      slug,
      oferta,
      page_url: body.pageUrl ?? null,
      utm_source: utm.source ?? null,
      utm_medium: utm.medium ?? null,
      utm_campaign: utm.campaign ?? null,
      utm_content: utm.content ?? null,
      utm_term: utm.term ?? null,
      gclid: click.gclid ?? null,
      fbclid: meta?.fbclid ?? null,
      click,
      ...respostas,
      values_raw: values,
    },
  };

  if (decisao.stage === "desqualificado") {
    leadPatch.desqualificado_motivo = decisao.desqualificacao ?? "form_desqualificado";
    leadPatch.desqualificado_em = new Date().toISOString();
  }

  const existente = await buscarLeadPorTelefone(supabase, telefone);
  let leadId: string;

  if (existente) {
    leadId = existente.id;
    const { data: atual } = await supabase
      .from("leads_geral")
      .select("dados_capturados")
      .eq("id", leadId)
      .maybeSingle();
    const prev =
      atual?.dados_capturados && typeof atual.dados_capturados === "object"
        ? (atual.dados_capturados as Record<string, unknown>)
        : {};
    const { error } = await supabase
      .from("leads_geral")
      .update({
        ...leadPatch,
        dados_capturados: { ...prev, ...(leadPatch.dados_capturados as object) },
        bot_pausado:
          decisao.stage === "desqualificado" || decisao.stage === "continuidade"
            ? true
            : false,
      })
      .eq("id", leadId);
    if (error) {
      console.error("[public-form-submit] update", error);
      return json({ error: "persist_failed" }, 500);
    }
  } else {
    leadId = `sdr_lp_${slug}_${Date.now()}_${telefone.slice(-6)}`;
    const { error } = await supabase.from("leads_geral").insert({
      id: leadId,
      ...leadPatch,
      created_time: new Date().toISOString(),
    });
    if (error) {
      console.error("[public-form-submit] insert", error);
      return json({ error: "persist_failed" }, 500);
    }
  }

  await supabase.from("lead_form_answers").insert({
    lead_id: leadId,
    oferta,
    respostas,
  });

  const { data: leadRow } = await supabase
    .from("leads_geral")
    .select(
      "id, full_name, phone_number, contato_whatsapp, tipo_servico, origem_sdr, status_sdr, area_normalizada, stage, bot_pausado, platform",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (leadRow) {
    await espelharContactSubmission(supabase, leadRow as never, {
      platform,
      mensagem: `LP ${slug} / ${oferta} → ${decisao.stage}`,
    });
    await supabase
      .from("contact_submissions")
      .update({
        stage: decisao.stage,
        email: email ?? null,
        utm_source: utm.source ?? null,
        utm_medium: utm.medium ?? null,
        utm_campaign: utm.campaign ?? null,
        origem: isGoogle ? "google" : "meta",
        como_conheceu: "Mídia Paga",
        estagio: decisao.stage === "mql"
          ? "novo"
          : decisao.stage === "conectado"
          ? "contato_inicial"
          : "perdido",
      })
      .eq("lead_geral_id", leadId);
  }

  await supabase.from("eventos_sdr").insert({
    lead_id: leadId,
    tipo: "lp_form_classificado",
    payload: {
      oferta,
      stage: decisao.stage,
      score: decisao.score,
      flags: decisao.flags,
      slug,
      ip_hash: ipHash,
      platform,
    },
  });

  // Meta CAPI: Lead (+ CompleteRegistration se MQL) — fire-and-forget
  if (platform === "meta_ads") {
    try {
      const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      await fetch(`${base}/functions/v1/meta-capi-events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead_id: leadId,
          stage: decisao.stage,
          event_name: "Lead",
          event_source_url: body.pageUrl ?? null,
          client_ip: ip,
          user_agent: userAgent,
          email: email ?? null,
        }),
      });
    } catch (e) {
      console.warn("[public-form-submit] meta-capi-events failed:", e);
    }
  }

  if (decisao.stage === "mql" || decisao.stage === "conectado") {
    await dispararBot(leadId);
  }

  if (decisao.stage === "desqualificado" && oferta === "partilha_protegida") {
    try {
      const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      await fetch(`${base}/functions/v1/notify-mariana-desq`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead_id: leadId,
          motivo: decisao.desqualificacao,
        }),
      });
    } catch (_e) { /* ignore */ }
  }

  // Resposta pública: sem score/flags
  return json({
    ok: true,
    lead_id: leadId,
    stage: decisao.stage === "desqualificado" || decisao.stage === "continuidade"
      ? decisao.stage
      : "mql",
  });
});
