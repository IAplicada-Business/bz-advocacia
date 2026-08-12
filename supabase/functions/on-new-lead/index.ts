// Edge Function: on-new-lead
// Disparada pelo trigger trg_leads_geral_on_new_lead (HMAC via X-Webhook-Secret).
// Envia M0 + LGPD pela Z-API e registra em mensagens_sdr.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { zapiSendSequence } from "../_shared/zapi.ts";
import { mensagemM0CTWA, mensagemM0Organico } from "../_shared/prompts.ts";
import { montarM0Personalizado, type SdrContexto } from "../_shared/form-m0.ts";
import { validarMensagemDoBot } from "../_shared/campos_ja_respondidos.ts";
import type { Oferta, StageDecisao } from "../_shared/classify-form.ts";


interface LeadGeralRecord {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  contato_whatsapp: string | null;
  tipo_servico: string | null;
  platform: string | null;
  origem_sdr: string | null;
  status_sdr?: string | null;
  bot_pausado?: boolean | null;
  oferta_origem?: string | null;
  form_flags?: string[] | null;
  form_score?: number | null;
  stage?: string | null;
  sdr_contexto?: SdrContexto | null;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: LeadGeralRecord;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // --- HMAC validation: secret lido direto do Vault via RPC (única fonte) ---
  const got = req.headers.get("x-webhook-secret");
  let expected: string | null = null;
  try {
    const { data, error } = await supabase.rpc("get_sdr_webhook_secret");
    if (error) console.error("[on-new-lead] rpc error:", error);
    expected = (data as string | null) ?? null;
  } catch (e) {
    console.error("[on-new-lead] rpc threw:", e);
    expected = null;
  }
  if (!expected || got !== expected) {
    console.warn("[on-new-lead] HMAC reject. has_expected=", !!expected, "has_got=", !!got);
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "leads_geral") {
    return new Response(JSON.stringify({ ignored: true, reason: "type_or_table" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lead = payload.record;
  const telefone = lead.contato_whatsapp ?? lead.phone_number;
  if (!lead?.id || !telefone) {
    return new Response(JSON.stringify({ ignored: true, reason: "missing_phone_or_id" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Guard: lead criado pelo painel humano (RPC garantir_lead_geral_para_contact
  // ou trg que marca bot_pausado=true / status_sdr=assumido_humano) NAO deve
  // disparar M0 do bot. Sem essa checagem, abrir atendimento manual de cliente
  // existente fazia o bot mandar "Oi, em qual area voce precisa de ajuda" pra
  // cliente que ja conhece o escritorio.
  if (lead.bot_pausado === true || lead.status_sdr === "assumido_humano" || lead.status_sdr === "cliente") {
    return new Response(
      JSON.stringify({ skipped: "humano_iniciou_ou_cliente", status_sdr: lead.status_sdr ?? null }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Idempotência: se já tem mensagem do bot pra esse lead, não reenvia.
  const { count } = await supabase
    .from("mensagens_sdr")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", lead.id)
    .eq("origem", "bot");
  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ skipped: "ja_tem_mensagem_bot" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Preferir sdr_contexto do banco (mais fresco que o payload do trigger)
  const { data: leadFresh } = await supabase
    .from("leads_geral")
    .select("oferta_origem, form_flags, form_score, stage, sdr_contexto, tipo_servico, platform")
    .eq("id", lead.id)
    .maybeSingle();

  const oferta = (leadFresh?.oferta_origem ?? lead.oferta_origem ?? null) as Oferta | null;
  const contexto = (leadFresh?.sdr_contexto ?? lead.sdr_contexto ?? null) as SdrContexto | null;
  const flags = (leadFresh?.form_flags ?? lead.form_flags ?? []) as string[];
  const stage = (leadFresh?.stage ?? lead.stage ?? "mql") as StageDecisao;
  const platform = leadFresh?.platform ?? lead.platform;

  const nome = (lead.full_name ?? "").split(" ")[0] || "tudo bem";
  const veioDeAnuncio = !!(platform && platform.endsWith("_ads"));

  let texto: string;
  if (oferta && contexto?.respostas && Object.keys(contexto.respostas).length > 0) {
    texto = montarM0Personalizado({ oferta, stage, flags, contexto });
  } else {
    texto = veioDeAnuncio ? mensagemM0CTWA(nome) : mensagemM0Organico(nome);
  }

  if (oferta) {
    const check = validarMensagemDoBot(oferta, texto);
    if (!check.ok) {
      await supabase.from("bot_errors").insert({
        lead_id: lead.id,
        motivo: check.motivo,
        mensagem: texto,
        oferta,
      });
      await supabase.from("eventos_sdr").insert({
        lead_id: lead.id,
        tipo: "bot_msg_bloqueada",
        payload: { motivo: check.motivo, origem: "on-new-lead" },
      });
      return new Response(
        JSON.stringify({ blocked: true, motivo: check.motivo }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const mensagens = [texto];
  const resultados = await zapiSendSequence(telefone, mensagens, 1200);
  const ok = resultados.every((r) => r.ok);

  for (let i = 0; i < mensagens.length; i++) {
    await supabase.from("mensagens_sdr").insert({
      lead_id: lead.id,
      origem: "bot",
      conteudo: mensagens[i],
      metadata: {
        zapi: resultados[i],
        etapa: "M0",
        personalizado_form: !!(oferta && contexto?.respostas),
      },
    });
  }

  const proximaEtapa =
    lead.tipo_servico && lead.tipo_servico.trim().length > 0 ? "M1" : "M0";

  await supabase
    .from("leads_geral")
    .update({
      status_sdr: "em_atendimento_bot",
      etapa_qualificacao: proximaEtapa,
    })
    .eq("id", lead.id);

  await supabase.from("eventos_sdr").insert({
    lead_id: lead.id,
    tipo: "m0_enviada",
    payload: {
      tipo_servico: lead.tipo_servico,
      ok,
      oferta,
      personalizado_form: !!(oferta && contexto?.respostas),
    },
  });

  return new Response(JSON.stringify({ ok, lead_id: lead.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
