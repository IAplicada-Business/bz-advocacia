// Dispara M0 personalizado (form → SDR) sem repetir perguntas do formulário.
// Chamado por public-form-submit / classify-form-lead após classificação.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { zapiSendText } from "../_shared/zapi.ts";
import {
  areaFromOferta,
  montarM0Personalizado,
  roteiroAposForm,
  type SdrContexto,
} from "../_shared/form-m0.ts";
import type { Oferta, StageDecisao } from "../_shared/classify-form.ts";
import { validarMensagemDoBot } from "../_shared/campos_ja_respondidos.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey || !auth.includes(serviceKey)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { lead_id?: string; trigger?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (!body.lead_id) {
    return new Response(JSON.stringify({ error: "missing_lead_id" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
    { auth: { persistSession: false } },
  );

  const { data: lead, error } = await supabase
    .from("leads_geral")
    .select(
      "id, full_name, phone_number, contato_whatsapp, oferta_origem, form_flags, form_score, stage, status_sdr, bot_pausado, sdr_contexto, area_normalizada, tipo_servico",
    )
    .eq("id", body.lead_id)
    .maybeSingle();

  if (error || !lead) {
    return new Response(JSON.stringify({ error: "lead_not_found" }), { status: 404 });
  }

  if (lead.bot_pausado === true || lead.status_sdr === "assumido_humano") {
    return new Response(
      JSON.stringify({ skipped: "bot_pausado_ou_humano" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const stage = String(lead.stage ?? "");
  if (stage === "desqualificado" || stage === "continuidade") {
    return new Response(
      JSON.stringify({ skipped: "stage_sem_bot", stage }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Idempotência
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

  const telefone = lead.contato_whatsapp ?? lead.phone_number;
  if (!telefone) {
    return new Response(JSON.stringify({ skipped: "sem_telefone" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contexto = (lead.sdr_contexto ?? {}) as SdrContexto;
  const oferta = (lead.oferta_origem ?? contexto.oferta ?? null) as Oferta | null;
  const flags = (lead.form_flags ?? []) as string[];

  const texto = montarM0Personalizado({
    oferta,
    stage: stage as StageDecisao,
    flags,
    contexto,
  });

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
        payload: { motivo: check.motivo, trigger: body.trigger },
      });
      return new Response(
        JSON.stringify({ blocked: true, motivo: check.motivo }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const envio = await zapiSendText(telefone, texto);
  await supabase.from("mensagens_sdr").insert({
    lead_id: lead.id,
    origem: "bot",
    conteudo: texto,
    metadata: {
      etapa: "M0",
      zapi: envio,
      trigger: body.trigger ?? "form_submit",
      personalizado_form: !!oferta,
    },
  });

  let etapaQual = "M0";
  let area = lead.area_normalizada;
  if (oferta && contexto.respostas) {
    const roteiro = roteiroAposForm({
      oferta,
      respostas: contexto.respostas,
      stage: stage as StageDecisao,
    });
    // Após M0 personalizado, a "etapa atual" já reflete o que o form cobriu
    etapaQual = roteiro.etapaAtual;
    area = areaFromOferta(oferta) ?? area;
  }

  await supabase
    .from("leads_geral")
    .update({
      status_sdr: "em_atendimento_bot",
      etapa_qualificacao: etapaQual,
      area_normalizada: area,
      ultima_mensagem_em: new Date().toISOString(),
    })
    .eq("id", lead.id);

  await supabase.from("eventos_sdr").insert({
    lead_id: lead.id,
    tipo: "m0_form_personalizado",
    payload: {
      oferta,
      stage,
      flags,
      trigger: body.trigger,
      ok: envio.ok,
      etapa_qualificacao: etapaQual,
    },
  });

  return new Response(
    JSON.stringify({ ok: envio.ok, lead_id: lead.id, etapa: etapaQual }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
