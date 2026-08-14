// Prompts e templates de mensagem do SDR — bot B&Z.
// Roteiro oficial: docs/BZ_Bot_Whatsapp_Roteiro_v1.md
//
// Higienizacao:
// - Sem travessao (—). Usar virgula, ponto ou ponto e virgula.
// - Emojis em fluxo geral: 💙 😊. Mensagens de política: sem emoji.
// - Tom: caloroso, empatico, profissional. Nunca robotico.
// - Nunca inventar texto de qualificação — usar o roteiro.

export const NOME_ESCRITORIO = Deno.env.get("NOME_ESCRITORIO") ?? "B&Z";

export const AREA_NUM_TO_KEY: Record<string, "familia" | "inventario" | "saude"> = {
  "1": "familia",
  "2": "inventario",
  "3": "saude",
};
export const AREA_LABEL: Record<string, string> = {
  familia: "Família",
  inventario: "Inventário, Testamento, Doações ou Holding",
  saude: "Saúde",
  fora_escopo: "Fora do escopo (triagem humana)",
};

export function extrairNumero(texto: string, max: number): number | null {
  const t = (texto ?? "").trim();
  const m = t.match(/^([1-9])(?:\b|[.)\-\s])/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= max ? n : null;
}

// ---------- M0: boas-vindas (roteiro v1) ----------

import { TEMPLATES } from "./roteiro-v1.ts";

// Roteiro v1: o bot nao usa nome proprio e a saudacao e sempre a M0
// oficial aprovada pelas socias.
export function mensagemM0CTWA(_nome: string): string {
  return TEMPLATES.M0;
}

export function mensagemM0Organico(_nome: string): string {
  return TEMPLATES.M0;
}

export function mensagemReabertura(_nome: string): string {
  return TEMPLATES.M0;
}

export function mensagemM0Recuperacao(_nome: string): string {
  return TEMPLATES.M0;
}

export function mensagemM0(nome: string, _tipoServicoForm?: string | null): string {
  return mensagemM0Organico(nome);
}

export const AVISO_LGPD = "";

// ---------- Família (roteiro v1 — 3 perguntas) ----------

export function mensagemFamiliaM1(_nome: string): string {
  return (
`Qual sua situação hoje?
• (a) Ainda casado(a), pensando em me separar
• (b) Já separado(a), sem processo iniciado
• (c) Divórcio em negociação
• (d) Divórcio em andamento
• (e) Processo travado

Pode responder só com a letra.`
  );
}

export function mensagemFamiliaM2(_nome: string): string {
  return (
`Existe patrimônio a partilhar?
• (a) Sim, imóveis
• (b) Sim, empresa
• (c) Sim, aplicações
• (d) Sim, mais de um tipo
• (e) Não há patrimônio significativo
• (f) Não tenho certeza

Pode responder só com a letra.`
  );
}

export function mensagemFamiliaM3(_nome: string): string {
  return (
`Qual sua renda familiar mensal?
• (a) Até R$10k
• (b) R$10k a R$30k
• (c) R$30k a R$60k
• (d) Acima de R$60k

Pode responder só com a letra.`
  );
}

// ---------- Inventário (roteiro v1 — placeholder 5.2) ----------

export function mensagemInventarioM1(_nome: string): string {
  // v1 placeholder até B&Z devolver seção 5.2
  return (
`Em que fase está o inventário?
• (a) Falecimento recente, ainda não abrimos
• (b) Inventário aberto, em andamento
• (c) Inventário travado com problemas
• (d) Buscando planejamento sucessório preventivo

Pode responder só com a letra.`
  );
}

export function mensagemInventarioM2(_nome: string): string {
  return (
`Estimativa do patrimônio do espólio?
• (a) Até R$300k
• (b) R$300k-R$1M
• (c) R$1M-R$5M
• (d) Acima de R$5M
• (e) Não sei estimar

Pode responder só com a letra.`
  );
}

export function mensagemInventarioM2Valor(_nome: string): string {
  return (
`Composição do patrimônio?
• (a) Só imóveis
• (b) Imóveis + empresa
• (c) Imóveis + aplicações
• (d) Empresa + aplicações
• (e) Complexo (múltiplos)
• (f) Inclui bens exterior
• (g) Não sei

Pode responder só com a letra.`
  );
}

export function mensagemInventarioM3(_nome: string): string {
  return (
`Existe risco de conflito entre herdeiros?
• (a) Sim, já há divergências
• (b) Talvez, ainda não conversamos
• (c) Não, todos alinhados

Pode responder só com a letra.`
  );
}

// ---------- Saúde (roteiro v1 — placeholder 5.3) ----------

export function mensagemSaudeM1(_nome: string): string {
  return (
`Situação atual com o plano?
• (a) Plano negou por escrito
• (b) Plano negou verbalmente
• (c) Plano autorizou mas não cumpre
• (d) Plano está enrolando
• (e) Ainda não pedi, mas sei que vou precisar

Pode responder só com a letra.`
  );
}

export function mensagemSaudeM2(_nome: string): string {
  return (
`Tipo de cobertura em questão?
• (a) Cirurgia
• (b) Medicamento alto custo
• (c) Home care
• (d) Tratamento oncológico
• (e) Terapia continuada
• (f) UTI/internação
• (g) Exame alta complexidade
• (h) Outro

Pode responder só com a letra.`
  );
}

/** Saúde: urgência (usa slot M2_valor no fluxo). */
export function mensagemSaudeM2Valor(_nome: string): string {
  return (
`Urgência clínica?
• (a) Extrema — risco de vida ou piora rápida
• (b) Precisa começar em até 30 dias
• (c) Sem urgência imediata

Pode responder só com a letra.`
  );
}

export function mensagemSaudeM3(_nome: string): string {
  return (
`Valor mensal do plano de saúde?
• (a) Até R$500
• (b) R$500-R$1500
• (c) R$1500-R$3000
• (d) Acima de R$3000

Pode responder só com a letra.`
  );
}

export function mensagemHandoffAgendamento(_nome: string): string {
  return (
`Perfeito, anotei tudo 💙 Vou passar pra advogada especialista. O ideal é uma reunião breve pra ela analisar o seu caso e apresentar a estratégia. Ela te chama por aqui em breve.`
  );
}

export function mensagemForaEscopo(_nome: string, _area?: string): string {
  return (
`Entendi. Você procurou o lugar certo pra ter essa avaliação 😊
Vou repassar pra advogada avaliar seu caso especificamente. Ela vai te chamar por aqui em breve pra te dar um direcionamento.`
  );
}

export function mensagemHandoff(nome: string): string {
  return mensagemHandoffAgendamento(nome);
}

export function mensagemSQL(nome: string, _advogadoNome?: string): string {
  return mensagemHandoff(nome);
}
export function mensagemMQLFrio(nome: string): string {
  return mensagemForaEscopo(nome);
}

export const PERGUNTA_TEXTO_POR_CODIGO: Record<string, string> = {
  area: "Qual a área que você precisa de ajuda?",
  familia_m1: "Qual sua situação hoje? (a–e)",
  familia_m2: "Existe patrimônio a partilhar? (a–f)",
  familia_m3: "Qual sua renda familiar mensal? (a–d)",
  inventario_m1: "Em que fase está o inventário? (a–d)",
  inventario_m2: "Estimativa do patrimônio do espólio? (a–e)",
  inventario_m2_valor: "Composição do patrimônio? (a–g)",
  inventario_m3: "Risco de conflito entre herdeiros? (a–c)",
  saude_m1: "Situação atual com o plano? (a–e)",
  saude_m2: "Tipo de cobertura? (a–h)",
  saude_m2_valor: "Urgência clínica? (a–c)",
  saude_m3: "Valor mensal do plano? (a–d)",
  fora_escopo: "Tema fora do escopo, handoff direto pra triagem.",
  pensao_guarda_only: "Caso isolado de pensão/guarda — desqualificado.",
};

// ---------- SYSTEM PROMPT do classificador ----------

export const SYSTEM_PROMPT_CLASSIFICADOR = `Você é o atendente digital do escritório Borges & Zembruski Advocacia (B&Z). Nunca use nome próprio, fale sempre em nome do escritório. Você é a primeira pessoa a falar com leads que chegam pelo WhatsApp. Qualifique com perguntas estruturadas (letra a/b/c…) e passe para a advogada certa.

ÁREAS (campo "area"):
- familia       → divórcio, união estável, partilha de bens, separação COM partilha
- inventario    → inventário, partilha pós-falecimento, testamento, doações, holding, sucessão, herança
- saude         → plano de saúde, negativa, medicamento alto custo, cirurgia negada, home care, oncologia
- fora_escopo   → trabalhista, consumidor, criminal, previdenciário, cível genérico, etc. (handoff humano, NÃO recusar)
- pensao_guarda_only → SOMENTE pensão alimentícia OU SOMENTE guarda de filhos, SEM mencionar divórcio/partilha/separação com bens. Use este valor e etapa_proxima="finalizado".

REGRA DE EXCLUSÃO: se o lead quer APENAS pensão ou APENAS guarda (sem partilha/divórcio), area="pensao_guarda_only". Se mencionar divórcio OU partilha junto, use familia e qualifique normal.

ETAPAS (campo "etapa_proxima"):
- "M0" → ainda não identificou a área
- "M1" → 1ª pergunta estruturada da área
- "M2" → 2ª pergunta
- "M2_valor" → 3ª pergunta (inventário: composição; saúde: urgência)
- "M3" → última pergunta estruturada (família: renda; inventário: conflito; saúde: valor do plano)
- "finalizado" → fluxo encerrado (SQL ou desqualificado)

DETECÇÃO: olhe o histórico. Não repita pergunta. Uma pergunta por mensagem.
Quando o lead responder com letra (a/b/c…), registre em dados_capturados a chave correspondente:
- familia: situacao (M1), patrimonio (M2), renda (M3)
- inventario: fase (M1), patrimonio (M2), composicao (M2_valor), conflito (M3)
- saude: plano (M1), cobertura (M2), urgencia (M2_valor), valor_plano (M3)

Após a ÚLTIMA resposta de cada área, use etapa_proxima="finalizado" (o sistema aplica regras de ticket/handoff).

TOM de "proxima_mensagem":
- Natural, empático. UMA pergunta por vez.
- SEM travessao longo. SEM inventar novas perguntas fora do roteiro.
- Nas perguntas estruturadas, use o template do sistema (pode deixar proxima_mensagem vazia).
- Emojis só 💙 😊 (máx 1). Em pensao_guarda_only deixe proxima_mensagem vazia.

REGRAS DURAS:
1. NUNCA opinião jurídica, indenização, prazo prometido.
2. NUNCA repetir pergunta já feita.
3. Respostas "a", "b", "Sim", curtas são válidas.
4. Máximo de perguntas do roteiro por área (família 3, inventário 4, saúde 4).

OUTPUT: APENAS JSON:

{
  "area": "familia|inventario|saude|fora_escopo|pensao_guarda_only|nao_identificada",
  "etapa_proxima": "M0|M1|M2|M2_valor|M3|finalizado",
  "dados_capturados": { },
  "score": 0,
  "motivo": "explicação curta interna",
  "proxima_mensagem": "texto pronto ou vazio"
}`;

export function templatePorEtapa(
  area: "familia" | "inventario" | "saude" | "fora_escopo" | "nao_identificada" | string | null,
  etapa: "M0" | "M1" | "M2" | "M2_valor" | "M3" | "finalizado" | string,
  nome: string,
): string {
  const a = (area ?? "nao_identificada").toLowerCase();

  if (a === "fora_escopo") return mensagemForaEscopo(nome);
  if (a === "pensao_guarda_only") {
    // importado pelo inbound via qualificacao.MSG_PENSAO_GUARDA
    return "";
  }

  if (a === "saude") {
    if (etapa === "M1") return mensagemSaudeM1(nome);
    if (etapa === "M2") return mensagemSaudeM2(nome);
    if (etapa === "M2_valor") return mensagemSaudeM2Valor(nome);
    if (etapa === "M3") return mensagemSaudeM3(nome);
    if (etapa === "finalizado") return mensagemHandoffAgendamento(nome);
  }
  if (a === "inventario") {
    if (etapa === "M1") return mensagemInventarioM1(nome);
    if (etapa === "M2") return mensagemInventarioM2(nome);
    if (etapa === "M2_valor") return mensagemInventarioM2Valor(nome);
    if (etapa === "M3") return mensagemInventarioM3(nome);
    if (etapa === "finalizado") return mensagemHandoffAgendamento(nome);
  }
  if (a === "familia") {
    if (etapa === "M1") return mensagemFamiliaM1(nome);
    if (etapa === "M2") return mensagemFamiliaM2(nome);
    if (etapa === "M3") return mensagemFamiliaM3(nome);
    if (etapa === "finalizado") return mensagemHandoffAgendamento(nome);
  }

  return mensagemM0Organico(nome);
}

export const PERGUNTAS_FALLBACK: Record<string, { M1: string; M2: string; M3: string }> = {};
