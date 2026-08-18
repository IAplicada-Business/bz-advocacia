// Edge Function: classify-form-lead
// Aplica regras MQL, persiste leads_geral + lead_form_answers, dispara bot se couber.
// Preferir public-form-submit (CORS + rate limit) nas LPs; esta função é o core.

import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  classificar,
  statusSdrFromStage,
  type FormPayload,
  type Oferta,
} from "../_shared/classify-form.ts";
import { ofertaToArea, ofertaToSlug } from "../_shared/lp-oferta-map.ts";
import { buscarLeadPorTelefone, espelharContactSubmission } from "../_shared/db.ts";
import { normalizarTelefone } from "../_shared/zapi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function dispararBot(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
): Promise<void> {
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
      console.error("[classify-form-lead] bot-dispatch", resp.status, await resp.text());
    }
  } catch (e) {
    console.error("[classify-form-lead] bot-dispatch failed:", e);
  }
}

async function notifyMarianaDesq(
  leadId: string,
  motivo?: string,
): Promise<void> {
  try {
    const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${base}/functions/v1/notify-mariana-desq`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lead_id: leadId, motivo }),
    });
  } catch (e) {
    console.error("[classify-form-lead] notify-mariana failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "only_post" }, 405);

  // Core interno: só aceita service role (chamadas de outras functions) ou o
  // secret do cron/webhook. As LPs devem usar public-form-submit.
  const expectedSecret = Deno.env.get("SDR_WEBHOOK_SECRET") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const sec = req.headers.get("x-webhook-secret") ?? "";
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const autorizado =
    (expectedSecret !== "" && sec === expectedSecret) ||
    (serviceRole !== "" && bearer === serviceRole);
  if (!autorizado) return json({ error: "unauthorized" }, 401);


  let payload: FormPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  if (!payload?.oferta || !payload?.contato?.whatsapp || !payload?.contato?.nome) {
    return json({ error: "invalid_payload" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let decisao;
  try {
    decisao = classificar(payload);
  } catch (e) {
    console.error("[classify-form-lead] classificar falhou, fallback conectado:", e);
    decisao = {
      stage: "conectado" as const,
      score: 0,
      flags: ["FALLBACK_CLASSIFY_ERROR"],
    };
  }

  const telefone = normalizarTelefone(payload.contato.whatsapp);
  const oferta = payload.oferta as Oferta;
  const area = ofertaToArea(oferta);
  const slug = ofertaToSlug(oferta);
  const tipoServico = area === "familia" ? "familia" : area;

  const sdrContexto = {
    respostas: payload.respostas,
    melhor_horario: payload.contato.melhor_horario ?? null,
    utm: payload.utm ?? {},
    redirecionamento: decisao.redirecionamento ?? null,
    oferta,
  };

  const leadPatch: Record<string, unknown> = {
    full_name: payload.contato.nome,
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
    dados_capturados: {
      source: "classify_form_lead",
      slug,
      oferta,
      ...payload.respostas,
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
    const { error } = await supabase
      .from("leads_geral")
      .update(leadPatch)
      .eq("id", leadId);
    if (error) return json({ error: error.message }, 500);
  } else {
    leadId = `sdr_form_${slug}_${Date.now()}_${telefone.slice(-6)}`;
    const { error } = await supabase.from("leads_geral").insert({
      id: leadId,
      ...leadPatch,
      platform: "meta_ads",
      origem_sdr: "form_site",
      is_organic: false,
      created_time: new Date().toISOString(),
    });
    if (error) return json({ error: error.message }, 500);
  }

  await supabase.from("lead_form_answers").insert({
    lead_id: leadId,
    oferta,
    respostas: payload.respostas,
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
      platform: (leadRow as { platform?: string }).platform ?? "meta_ads",
      mensagem: `Form ${oferta} → stage ${decisao.stage}`,
    });
    await supabase
      .from("contact_submissions")
      .update({
        stage: decisao.stage,
        email: payload.contato.email ?? null,
      })
      .eq("lead_geral_id", leadId);
  }

  await supabase.from("eventos_sdr").insert({
    lead_id: leadId,
    tipo: "form_classificado",
    payload: {
      oferta,
      stage: decisao.stage,
      score: decisao.score,
      flags: decisao.flags,
      desqualificacao: decisao.desqualificacao,
    },
  });

  if (decisao.stage === "mql" || decisao.stage === "conectado") {
    await dispararBot(supabase, leadId);
  }

  if (
    decisao.stage === "desqualificado" &&
    oferta === "partilha_protegida"
  ) {
    await notifyMarianaDesq(leadId, decisao.desqualificacao);
  }

  return json({
    lead_id: leadId,
    stage: decisao.stage,
    score: decisao.score,
    flags: decisao.flags,
    desqualificacao: decisao.desqualificacao,
    redirecionamento: decisao.redirecionamento,
  });
});
