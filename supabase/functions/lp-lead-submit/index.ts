// Edge Function: lp-lead-submit
// Recebe o form das LPs públicas (/lpsaude, /lpinventario, /lpdivorcio),
// cria o lead em leads_geral (Mídia Paga / anúncios por padrão) + espelha
// em contact_submissions. O trigger AFTER INSERT dispara on-new-lead → M0.

import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  buscarLeadPorTelefone,
  espelharContactSubmission,
  type Lead,
} from "../_shared/db.ts";
import { normalizarTelefone } from "../_shared/zapi.ts";
import { buildMetaAttribution } from "../_shared/metaAttribution.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type LpSlug = "saude" | "inventario" | "divorcio";

interface LpLeadBody {
  slug?: string;
  values?: Record<string, string>;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  ads?: Record<string, string | undefined>;
  pageUrl?: string;
}


function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapSlug(slug: string | undefined): {
  area: LpSlug;
  tipoServico: string;
  tipoProcesso: string;
} {
  const s = (slug ?? "").toLowerCase().trim();
  if (s === "inventario" || s === "inventário") {
    return { area: "inventario", tipoServico: "inventario", tipoProcesso: "Inventário" };
  }
  if (s === "divorcio" || s === "divórcio" || s === "familia" || s === "família") {
    return { area: "divorcio", tipoServico: "familia", tipoProcesso: "Família" };
  }
  return { area: "saude", tipoServico: "saude", tipoProcesso: "Saúde" };
}

/** Extrai telefone (BR) e nome do campo livre "Nome e WhatsApp". */
function parseContato(raw: string): { nome: string; telefone: string } | null {
  const text = (raw ?? "").trim();
  if (!text) return null;

  const phoneMatch = text.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/);
  if (!phoneMatch) return null;

  const telefoneBruto = phoneMatch[0];
  const telefone = normalizarTelefone(telefoneBruto);
  // 55 + DDD + 8/9 dígitos → 12 ou 13
  if (telefone.length < 12 || telefone.length > 13) return null;

  let nome = text.replace(telefoneBruto, " ").replace(/\s+/g, " ").trim();
  nome = nome.replace(/^[\s,;.\-–—|/]+|[\s,;.\-–—|/]+$/g, "").trim();
  if (!nome || nome.length < 2) nome = "Lead LP";

  return { nome, telefone };
}

/**
 * Mapeia UTM → platform ads (kanban "Leads Anúncios").
 * Sem UTM: assume mídia paga (meta_ads), pois as LPs são majoritariamente de anúncio.
 */
function resolvePlatform(utm?: LpLeadBody["utm"]): {
  platform: string;
  origemSdr: string;
  isOrganic: boolean;
} {
  const source = (utm?.source ?? "").toLowerCase();
  const medium = (utm?.medium ?? "").toLowerCase();
  const paidMedium =
    !medium ||
    ["cpc", "ppc", "paid", "paidsocial", "paid_social", "ads", "display", "remarketing"].includes(
      medium,
    ) ||
    medium.includes("paid");

  if (source.includes("instagram") || source === "ig") {
    return { platform: "instagram_ads", origemSdr: "meta_lead_ads", isOrganic: false };
  }
  if (source.includes("facebook") || source === "fb" || source === "meta") {
    return { platform: "facebook_ads", origemSdr: "meta_lead_ads", isOrganic: false };
  }
  if (source.includes("google") || source === "gads" || source === "adwords") {
    return { platform: "google_ads", origemSdr: "form_site", isOrganic: false };
  }
  if (source.includes("tiktok")) {
    return { platform: "tiktok_ads", origemSdr: "form_site", isOrganic: false };
  }
  if (source.includes("linkedin")) {
    return { platform: "linkedin_ads", origemSdr: "form_site", isOrganic: false };
  }

  // Orgânico explícito
  if (
    !paidMedium ||
    medium === "organic" ||
    medium === "referral" ||
    source === "organic" ||
    source === "site"
  ) {
    if (medium === "organic" || source === "organic" || source === "site") {
      return { platform: "whatsapp_organico", origemSdr: "form_site", isOrganic: true };
    }
  }

  // Default LPs: Mídia Paga (Meta)
  return { platform: "meta_ads", origemSdr: "meta_lead_ads", isOrganic: false };
}

/** Campos obrigatórios por LP (além de contato). */
const REQUIRED_BY_SLUG: Record<LpSlug, string[]> = {
  saude: ["situacao", "cobertura", "urgencia", "plano", "contato"],
  inventario: ["situacao", "bens", "herdeiros", "consenso", "contato"],
  divorcio: ["situacao", "filhos", "bens", "regime", "contato"],
};

const FIELD_LABELS: Record<string, string> = {
  situacao: "Situação",
  cobertura: "Tipo de cobertura",
  urgencia: "Urgência clínica",
  plano: "Plano ou SUS",
  bens: "Patrimônio / bens",
  herdeiros: "Herdeiros",
  consenso: "Consenso na família",
  filhos: "Filhos",
  regime: "Regime de bens",
  contato: "Nome e WhatsApp",
};

function missingRequired(area: LpSlug, values: Record<string, string>): string[] {
  return REQUIRED_BY_SLUG[area].filter((k) => !(values[k] ?? "").trim());
}

function mapUrgenciaSaude(raw: string): "alta" | "media" | "baixa" {
  const t = raw.toLowerCase();
  if (t.includes("extrema") || t.includes("risco imediato") || t.startsWith("alta")) {
    return "alta";
  }
  if (t.includes("média") || t.includes("media") || t.includes("semanas")) return "media";
  return "baixa";
}

function parseNumeroHerdeiros(raw: string): number | null {
  const t = raw.toLowerCase();
  if (t.includes("1 a 2")) return 2;
  if (t.includes("3 a 4")) return 4;
  if (t.includes("5")) return 5;
  return null;
}

function mapTemFilhos(raw: string): boolean {
  const t = raw.toLowerCase();
  return !(t.includes("não temos") || t.includes("nao temos") || t.includes("sem filhos"));
}

/**
 * Mapeia respostas do form → colunas tipadas do CRM + blob de qualificação.
 * Tudo fica em dados_capturados (aba Qualificação) e nos campos de contact_submissions.
 */
function mapFormToPersistence(area: LpSlug, values: Record<string, string>) {
  const v = (k: string) => (values[k] ?? "").trim();

  const contact: Record<string, unknown> = {
    situacao_atual: v("situacao") || null,
  };
  const leadExtras: Record<string, unknown> = {
    form_id: `lp_${area}`,
    form_name: `LP ${area}`,
  };

  // Blob flat p/ LeadQualificacaoTab (evita objetos aninhados ilegíveis)
  const capturados: Record<string, unknown> = {
    area: area === "divorcio" ? "familia" : area,
    source: "lp_form",
    slug: area,
  };

  for (const [k, val] of Object.entries(values)) {
    if (!val || k === "contato") continue;
    capturados[k] = val;
  }

  if (area === "saude") {
    const urg = mapUrgenciaSaude(v("urgencia"));
    leadExtras.urgencia = urg;
    contact.prioridade = urg;
    capturados.urgencia = urg;
    capturados.urgencia_raw = v("urgencia");
    capturados.plano = v("plano");
    capturados.cobertura = v("cobertura");
    capturados.operadora = v("plano");
    // Detalhe da cobertura no campo livre do CRM
    if (v("cobertura") || v("plano")) {
      contact.outro_tipo_processo = [v("cobertura"), v("plano")].filter(Boolean).join(" · ");
    }
  }

  if (area === "inventario") {
    contact.valor_estimado_bens = v("bens") || null;
    contact.numero_herdeiros = parseNumeroHerdeiros(v("herdeiros"));
    leadExtras.bem_inventariar = v("bens") || null;
    capturados.bens = v("bens");
    capturados.valor_estimado = v("bens");
    capturados.herdeiros = v("herdeiros");
    capturados.consenso = v("consenso");
    if (v("consenso")) {
      contact.notas_internas = `Consenso família (LP): ${v("consenso")}`;
    }
    if (v("herdeiros").toLowerCase().includes("menor")) {
      contact.tags = ["herdeiro_menor_ou_incapaz", "lp_inventario"];
    } else {
      contact.tags = ["lp_inventario"];
    }
  }

  if (area === "divorcio") {
    contact.bens_partilhar = v("bens") || null;
    contact.regime_casamento = v("regime") || null;
    contact.tem_filhos = v("filhos") ? mapTemFilhos(v("filhos")) : null;
    capturados.bens = v("bens");
    capturados.regime = v("regime");
    capturados.filhos = v("filhos");
    contact.tags = ["lp_divorcio"];
    if (v("situacao").toLowerCase().includes("violência") ||
      v("situacao").toLowerCase().includes("violencia")) {
      contact.prioridade = "alta";
      leadExtras.urgencia = "alta";
      capturados.urgencia = "alta";
    }
  }

  if (area === "saude") contact.tags = ["lp_saude"];

  return { contact, leadExtras, capturados };
}

function buildMensagem(
  slug: string,
  values: Record<string, string>,
  utm?: LpLeadBody["utm"],
  pageUrl?: string,
): string {
  const lines = [`Lead via LP ${slug}`];
  for (const [k, val] of Object.entries(values)) {
    if (!val || k === "contato") continue;
    lines.push(`${FIELD_LABELS[k] ?? k}: ${val}`);
  }
  if (utm?.source) lines.push(`utm_source: ${utm.source}`);
  if (utm?.medium) lines.push(`utm_medium: ${utm.medium}`);
  if (utm?.campaign) lines.push(`utm_campaign: ${utm.campaign}`);
  if (pageUrl) lines.push(`page: ${pageUrl}`);
  return lines.join("\n");
}

/**
 * Dispara on-new-lead diretamente (além do trigger DB).
 * Cobertura: se o trigger ainda enviar Authorization Bearer (bug antigo),
 * o M0 ainda sai daqui. on-new-lead é idempotente (não reenvia se já há msg bot).
 */
async function dispararOnNewLead(
  supabase: ReturnType<typeof createClient>,
  lead: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: secret, error: rpcErr } = await supabase.rpc("get_sdr_webhook_secret");
    if (rpcErr || !secret) {
      console.warn("[lp-lead-submit] sem sdr_webhook_secret pra disparar M0:", rpcErr);
      return;
    }
    const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
    const resp = await fetch(`${base}/functions/v1/on-new-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": String(secret),
      },
      body: JSON.stringify({
        type: "INSERT",
        table: "leads_geral",
        record: lead,
      }),
    });
    if (!resp.ok) {
      console.error("[lp-lead-submit] on-new-lead HTTP", resp.status, await resp.text());
    }
  } catch (e) {
    console.error("[lp-lead-submit] on-new-lead invoke failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let body: LpLeadBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const values = body.values ?? {};
  const { area, tipoServico, tipoProcesso } = mapSlug(body.slug);

  const missing = missingRequired(area, values);
  if (missing.length > 0) {
    return json(
      {
        error: "missing_fields",
        message: `Preencha: ${missing.map((k) => FIELD_LABELS[k] ?? k).join(", ")}.`,
        fields: missing,
      },
      400,
    );
  }

  const contato = values.contato ?? values.nome_whatsapp ?? values.telefone ?? "";
  const parsed = parseContato(contato);
  if (!parsed) {
    return json(
      {
        error: "invalid_contato",
        message: "Informe nome e WhatsApp com DDD (ex.: Ana 11999998888).",
      },
      400,
    );
  }

  const { platform, origemSdr, isOrganic } = resolvePlatform(body.utm);
  const mensagem = buildMensagem(area, values, body.utm, body.pageUrl);
  const { contact: formContact, leadExtras, capturados } = mapFormToPersistence(area, values);

  const attribution = buildMetaAttribution({
    utm: body.utm,
    ads: body.ads,
    pageUrl: body.pageUrl,
  });
  Object.assign(capturados, attribution.capturados);


  const origemCrm =
    platform === "instagram_ads"
      ? "instagram"
      : platform === "facebook_ads"
        ? "facebook"
        : platform === "meta_ads"
          ? "meta"
          : platform === "google_ads"
            ? "google"
            : platform === "tiktok_ads"
              ? "tiktok"
              : platform === "linkedin_ads"
                ? "linkedin"
                : isOrganic
                  ? "site"
                  : "meta";

  const crmPatch: Record<string, unknown> = {
    ...formContact,
    origem: origemCrm,
    utm_source: body.utm?.source ?? null,
    utm_medium: body.utm?.medium ?? null,
    utm_campaign: body.utm?.campaign ?? null,
    tipo_processo: tipoProcesso,
    como_conheceu: isOrganic ? "Site / LP" : "Mídia Paga / LP",
    mensagem,
    nome_completo: parsed.nome,
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  async function enriquecerCrm(leadId: string) {
    const { error: crmErr } = await supabase
      .from("contact_submissions")
      .update(crmPatch)
      .eq("lead_geral_id", leadId);
    if (crmErr) console.error("[lp-lead-submit] CRM update error:", crmErr);
  }

  // Duplicata: não recria (evita reenviar M0). Ainda espelha/atualiza CRM com o form.
  const existente = await buscarLeadPorTelefone(supabase, parsed.telefone);
  if (existente) {
    await espelharContactSubmission(supabase, existente, {
      platform,
      mensagem: `${mensagem}\n(reenvio form LP — lead já existia)`,
    });
    await enriquecerCrm(existente.id);

    // Acumula respostas do form no blob de qualificação (não apaga o que o bot já extraiu).
    try {
      const { data: atual } = await supabase
        .from("leads_geral")
        .select("dados_capturados")
        .eq("id", existente.id)
        .maybeSingle();
      const prev =
        atual?.dados_capturados && typeof atual.dados_capturados === "object"
          ? (atual.dados_capturados as Record<string, unknown>)
          : {};
      await supabase
        .from("leads_geral")
        .update({
          dados_capturados: { ...prev, ...capturados, form_reenvio_em: new Date().toISOString() },
          ...leadExtras,
          observacoes: mensagem,
        })
        .eq("id", existente.id);
    } catch (e) {
      console.error("[lp-lead-submit] merge dados_capturados failed:", e);
    }

    try {
      await supabase.from("eventos_sdr").insert({
        tipo: "lp_form_duplicate",
        payload: {
          lead_id: existente.id,
          slug: area,
          platform,
          telefone: parsed.telefone,
          form: values,
        },
      });
    } catch (_e) { /* ignore */ }

    return json({
      ok: true,
      duplicate: true,
      leadId: existente.id,
      message: "Lead já cadastrado. Nossa equipe segue no WhatsApp.",
    });
  }

  const id = `sdr_lp_${area}_${Date.now()}_${parsed.telefone.slice(-6)}`;
  const adName = body.utm?.campaign
    ? `lp_${area}_${body.utm.campaign}`
    : `lp_${area}`;

  const insertPayload: Record<string, unknown> = {
    id,
    full_name: parsed.nome,
    phone_number: parsed.telefone,
    contato_whatsapp: parsed.telefone,
    platform,
    origem_sdr: origemSdr,
    status_sdr: "novo",
    etapa_qualificacao: "M0",
    is_organic: isOrganic,
    tipo_servico: tipoServico,
    area_normalizada: area === "divorcio" ? "familia" : area,
    bot_pausado: false,
    created_time: new Date().toISOString(),
    ad_name: adName,
    observacoes: mensagem,
    dados_capturados: capturados,
    ...attribution.leadColumns,
    ...leadExtras,
  };


  const { data, error } = await supabase
    .from("leads_geral")
    .insert(insertPayload)
    .select(
      "id, full_name, phone_number, contato_whatsapp, tipo_servico, origem_sdr, status_sdr, area_normalizada, score, bot_pausado, etapa_qualificacao, humano_responsavel, ultima_mensagem_em, platform",
    )
    .maybeSingle();

  if (error || !data) {
    console.error("[lp-lead-submit] insert error:", error);
    return json({ error: "insert_failed", detail: error?.message ?? null }, 500);
  }

  const lead = data as Lead & { platform?: string | null };
  await espelharContactSubmission(supabase, lead, {
    platform,
    mensagem,
  });
  await enriquecerCrm(lead.id);

  try {
    await supabase.from("eventos_sdr").insert({
      tipo: "lp_form_created",
      payload: {
        lead_id: lead.id,
        slug: area,
        platform,
        origem_sdr: origemSdr,
        is_organic: isOrganic,
        form: values,
        capturados,
      },
    });
  } catch (_e) { /* ignore */ }

  // Trigger DB + chamada direta (idempotente) → M0 no WhatsApp.
  await dispararOnNewLead(supabase, {
    ...lead,
    platform,
    origem_sdr: origemSdr,
    status_sdr: "novo",
    bot_pausado: false,
  });

  return json({
    ok: true,
    leadId: lead.id,
    message: "Cadastro recebido. Em breve falamos no WhatsApp.",
  });
});
