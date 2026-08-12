// M0 personalizado a partir do sdr_contexto (form LP).
// Regra: confirmar contexto + 1 próximo passo — nunca repetir o form.

import type { Oferta, StageDecisao } from "./classify-form.ts";
import {
  CAMPOS_FORM,
  CAMPOS_RESPOSTA_CANONICOS,
  ETAPA_ROTEIRO_POR_CAMPO,
  labelResposta,
} from "./campos_ja_respondidos.ts";
import { IDS_HANDOFF, SEQUENCIA, templateV1 } from "./roteiro-v1.ts";

export type SdrContexto = {
  respostas?: Record<string, string | string[]>;
  melhor_horario?: string;
  utm?: Record<string, string>;
  redirecionamento?: string;
  oferta?: Oferta;
};

function fmtLista(vals: string | string[] | undefined): string {
  if (!vals) return "";
  const arr = Array.isArray(vals) ? vals : [vals];
  return arr.map(labelResposta).filter(Boolean).join(" e ");
}

function trechoPartilha(r: Record<string, string | string[]>): string {
  const sit = fmtLista(r.situacao);
  const patr = fmtLista(r.patrimonio);
  const parts: string[] = [];
  if (sit) parts.push(`vocês estão em ${sit}`);
  if (patr) parts.push(`com ${patr} envolvidos`);
  if (parts.length === 0) return "Vi as respostas do formulário sobre o seu caso de partilha";
  return `Vi aqui que ${parts.join(" e ")} — esse é exatamente o cenário em que o mapeamento antes da conversa faz a maior diferença`;
}

function trechoInventario(r: Record<string, string | string[]>): string {
  const fase = fmtLista(r.fase);
  const total = fmtLista(r.patrimonio_total);
  const parts: string[] = [];
  if (fase) parts.push(fase);
  if (total) parts.push(total);
  if (parts.length === 0) return "Vi as respostas do formulário sobre o inventário";
  return `Vi aqui que o cenário é ${parts.join(", ")}. Dá pra organizar o caminho com menos atrito e custo`;
}

function trechoSaude(r: Record<string, string | string[]>): string {
  const sit = fmtLista(r.situacao_plano);
  const tipo = fmtLista(r.tipo_cobertura);
  const parts: string[] = [];
  if (sit) parts.push(sit);
  if (tipo) parts.push(`em ${tipo}`);
  if (parts.length === 0) return "Vi as respostas do formulário sobre a negativa do plano";
  return `Vi aqui: ${parts.join(" ")}. Esse tipo de caso a gente analisa com urgência e documentação certa`;
}

/**
 * Monta M0 personalizado. Se não houver contexto de form, cai no template M0 padrão.
 */
export function montarM0Personalizado(opts: {
  oferta?: string | null;
  stage?: StageDecisao | string | null;
  flags?: string[] | null;
  contexto?: SdrContexto | null;
}): string {
  const oferta = (opts.oferta ?? opts.contexto?.oferta ?? "") as Oferta;
  const respostas = opts.contexto?.respostas ?? {};
  const flags = opts.flags ?? [];
  const stage = opts.stage ?? "mql";
  const temForm = Object.keys(respostas).length > 0 && !!oferta;

  if (!temForm) return templateV1("M0");

  let trecho = "";
  if (oferta === "partilha_protegida") trecho = trechoPartilha(respostas);
  else if (oferta === "inventario_otimizado") trecho = trechoInventario(respostas);
  else if (oferta === "cobertura_garantida") trecho = trechoSaude(respostas);
  else trecho = "Vi as respostas do formulário";

  if (flags.includes("PRIORIDADE_MAX") || respostas.urgencia === "risco_vida") {
    return `Oi, tudo bem? Aqui é do escritório Borges & Zembruski Advocacia.

${trecho}.

Pelo risco clínico, estamos priorizando seu caso. Uma advogada pode falar com você em até 2h úteis — prefere WhatsApp ou ligação?`;
  }

  if (stage === "conectado") {
    return `Oi, tudo bem? Aqui é do escritório Borges & Zembruski Advocacia.

${trecho}.

Vou te enviar um material útil sobre o tema e, se fizer sentido, a gente agenda 20 minutos com a advogada. Qual o melhor horário pra você nas próximas 48h?`;
  }

  // MQL padrão: confirma + agenda
  const horario = opts.contexto?.melhor_horario
    ? `\n\nAnotei que o melhor horário pra você é ${opts.contexto.melhor_horario}.`
    : "";

  return `Oi, tudo bem? Aqui é do escritório Borges & Zembruski Advocacia.

${trecho}.${horario}

Posso te encaixar em uma conversa de 20 minutos com a advogada responsável. Prefere manhã ou tarde nos próximos dias úteis?`;
}

/** Área CRM a partir da oferta. */
export function areaFromOferta(oferta?: string | null): "familia" | "inventario" | "saude" | null {
  if (oferta === "partilha_protegida") return "familia";
  if (oferta === "inventario_otimizado") return "inventario";
  if (oferta === "cobertura_garantida") return "saude";
  return null;
}

/**
 * Dado o form preenchido, qual etapa do roteiro o bot deve considerar
 * "já respondida" (última coberta) e qual a próxima MsgId.
 */
export function roteiroAposForm(opts: {
  oferta: Oferta;
  respostas: Record<string, string | string[]>;
  stage: StageDecisao | string;
}): { etapaAtual: string; proximaId: string; pularBot: boolean } {
  const area = areaFromOferta(opts.oferta);
  if (!area) {
    return { etapaAtual: "M0", proximaId: "M1", pularBot: false };
  }

  const mapa = ETAPA_ROTEIRO_POR_CAMPO[opts.oferta];
  const seq = SEQUENCIA[area] ?? [];
  let ultimaRespondida: string | null = null;

  for (const campo of CAMPOS_RESPOSTA_CANONICOS[opts.oferta]) {
    const v = opts.respostas[campo];
    const filled = Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
    if (filled && mapa[campo]) ultimaRespondida = mapa[campo];
  }

  // Sem nenhuma resposta estruturada → fluxo normal
  if (!ultimaRespondida) {
    return { etapaAtual: "M0", proximaId: seq[0] ?? "M1", pularBot: false };
  }

  const idx = seq.indexOf(ultimaRespondida);
  if (idx < 0) {
    return { etapaAtual: "M0", proximaId: seq[0] ?? "M1", pularBot: false };
  }

  // Todas as perguntas do caminho já no form → handoff se MQL
  if (idx >= seq.length - 1) {
    const handoff =
      area === "familia" ? "M5C" : area === "inventario" ? "M6D" : "M6E";
    return {
      etapaAtual: ultimaRespondida,
      proximaId: opts.stage === "mql" ? handoff : seq[idx],
      pularBot: false,
    };
  }

  return {
    etapaAtual: ultimaRespondida,
    proximaId: seq[idx + 1],
    pularBot: false,
  };
}

export function systemPromptComContexto(opts: {
  systemBase: string;
  lead: {
    nome?: string | null;
    oferta_origem?: string | null;
    stage?: string | null;
    form_flags?: string[] | null;
    form_score?: number | null;
    sdr_contexto?: SdrContexto | null;
  };
}): string {
  const oferta = (opts.lead.oferta_origem ?? "") as Oferta;
  const perguntas = CAMPOS_FORM[oferta]?.join(", ") ?? "(nenhuma — lead sem form)";
  const ctx = {
    nome: opts.lead.nome,
    oferta: opts.lead.oferta_origem,
    stage: opts.lead.stage,
    flags: opts.lead.form_flags,
    score: opts.lead.form_score,
    respostas_form: opts.lead.sdr_contexto?.respostas ?? null,
    melhor_horario: opts.lead.sdr_contexto?.melhor_horario ?? null,
  };

  const bloco = `
CONTEXTO PRÉ-CARREGADO DO LEAD:
${JSON.stringify(ctx, null, 2)}

REGRAS IMUTÁVEIS:
1. O lead JÁ respondeu no formulário da landing page as seguintes perguntas:
   ${perguntas}
   NUNCA repita nenhuma delas. Se você fizer isso, o lead vai desistir.

2. Sempre USE as respostas do form pra personalizar a mensagem.
   Não peça de novo situação, patrimônio, renda, fase do inventário,
   composição, conflito, situação do plano, tipo de cobertura, urgência
   ou valor do plano se já estiverem em respostas_form.

3. Perguntas PERMITIDAS (só uma por vez, a mais relevante):
   - partilha_protegida: tempo_de_casamento, cidade, ha_filhos_menores, ja_houve_conversa_com_conjuge
   - inventario_otimizado: tempo_do_falecimento, estado_civil_do_falecido, numero_de_herdeiros, ha_testamento
   - cobertura_garantida: nome_do_plano, data_da_negativa, tem_relatorio_medico_atual, ja_tentou_ouvidoria

4. Se flags contém PRIORIDADE_MAX: pule small talk, proponha contato em até 2h úteis.

5. Se stage=conectado: tom educativo + cadência; não force fechamento.

`;

  return `${bloco}\n${opts.systemBase}`;
}

export function ehHandoffId(id: string): boolean {
  return IDS_HANDOFF.includes(id);
}
