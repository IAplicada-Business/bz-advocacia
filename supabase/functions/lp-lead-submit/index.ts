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

function buildMensagem(
  slug: string,
  values: Record<string, string>,
  utm?: LpLeadBody["utm"],
  pageUrl?: string,
): string {
  const lines = [`Lead via LP ${slug}`];
  for (const [k, v] of Object.entries(values)) {
    if (!v || k === "contato") continue;
    lines.push(`${k}: ${v}`);
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

  const { area, tipoServico } = mapSlug(body.slug);
  const { platform, origemSdr, isOrganic } = resolvePlatform(body.utm);
  const mensagem = buildMensagem(body.slug ?? area, values, body.utm, body.pageUrl);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Duplicata: não recria (evita reenviar M0). Ainda espelha/atualiza CRM.
  const existente = await buscarLeadPorTelefone(supabase, parsed.telefone);
  if (existente) {
    await espelharContactSubmission(supabase, existente, {
      platform: platform,
      mensagem: `${mensagem}\n(reenvio form LP — lead já existia)`,
    });
    try {
      await supabase.from("eventos_sdr").insert({
        tipo: "lp_form_duplicate",
        payload: {
          lead_id: existente.id,
          slug: area,
          platform,
          telefone: parsed.telefone,
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
    dados_capturados: {
      slug: area,
      form: values,
      utm: body.utm ?? {},
      pageUrl: body.pageUrl ?? null,
      source: "lp_form",
    },
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

  // Garante origem no kanban de anúncios (aba Leads Anúncios) + UTMs.
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
                : null;

  if (origemCrm) {
    const { error: crmErr } = await supabase
      .from("contact_submissions")
      .update({
        origem: origemCrm,
        utm_source: body.utm?.source ?? null,
        utm_medium: body.utm?.medium ?? null,
        utm_campaign: body.utm?.campaign ?? null,
        tipo_processo: mapSlug(body.slug).tipoProcesso,
        como_conheceu: isOrganic ? "Site / LP" : "Mídia Paga / LP",
      })
      .eq("lead_geral_id", lead.id);
    if (crmErr) console.error("[lp-lead-submit] CRM update error:", crmErr);
  }

  try {
    await supabase.from("eventos_sdr").insert({
      tipo: "lp_form_created",
      payload: {
        lead_id: lead.id,
        slug: area,
        platform,
        origem_sdr: origemSdr,
        is_organic: isOrganic,
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
