// Roteiro de Mensagens v1 — Bot WhatsApp B&Z Advocacia.
// Aprovado pelas sócias. Textos EXATOS, não alterar sem novo aprovado.
//
// Regras de tom:
// - O bot NUNCA usa nome próprio. Fala em nome do escritório.
// - Sem travessão (—). Sem menu numerado. Bullets com "•".
// - Emojis permitidos (raros): 💙 😊
// - Uma pergunta por mensagem.

export type MsgId =
  | "M0"
  | "M1"
  | "M-A"
  | "M-B"
  | "M2C"
  | "M3C"
  | "M4C"
  | "M5C"
  | "M5C-Desq"
  | "M2D"
  | "M3D"
  | "M4D"
  | "M5D"
  | "M6D"
  | "M6D-Preventivo"
  | "M2E"
  | "M3E"
  | "M4E"
  | "M5E"
  | "M6E"
  | "M6E-Urgente"
  | "M6E-CasoForte"
  | "encerrado_frio"
  | "desqualificado";

export type AreaV1 =
  | "familia"
  | "inventario"
  | "saude"
  | "pensao_guarda_apenas"
  | "fora_escopo"
  | "nao_claro";

export interface ClassificacaoV1 {
  area: AreaV1 | string;
  subclassificacao?: string;
  proxima_mensagem_id: MsgId | string;
  resposta_estruturada?: Record<string, unknown>;
  flags_a_adicionar?: string[];
}

// ============================================================
// TEMPLATES
// ============================================================

export const TEMPLATES: Record<string, string> = {
  M0:
`Oi, tudo bem? Aqui é do escritório Borges & Zembruski Advocacia.

Me conta rapidinho: qual sua situação hoje? O que te trouxe até a gente?`,

  M1:
`Entendi. Pra a gente te encaminhar pra advogada certa, me conta: seu caso é mais relacionado a divórcio, herança, plano de saúde, ou é outra coisa?`,

  "M-A":
`Obrigada por compartilhar sua situação.

Hoje o escritório é especializado em três áreas: Divórcio com Partilha de Bens, Inventário e Direito da Saúde. Para casos que envolvem apenas pensão alimentícia ou guarda de filhos, o ideal é procurar um profissional especializado nessas áreas específicas, que vai poder te atender com a atenção que o seu caso merece.

Se em algum momento sua situação envolver também divisão de bens ou o próprio divórcio, é só chamar de volta aqui.`,

  "M-B":
`Obrigada por compartilhar.

Hoje o foco do escritório é em Divórcio e Partilha de Bens, Inventário e Direito da Saúde, então não seria a advocacia mais indicada pro seu caso.

Se quiser, a gente pode indicar um colega da confiança pra atender essa área. É só avisar.`,

  M2C:
`Certo. Pra a gente entender melhor sua situação, qual dessas mais se aproxima do seu caso hoje?

• Ainda casada(o) e pensando em me separar
• Já separada(o) mas sem processo iniciado
• Divórcio consensual em negociação
• Divórcio litigioso em andamento
• Processo iniciado mas travado

Pode responder com a opção ou escrever com suas palavras.`,

  M3C:
`Entendi. E existe patrimônio a partilhar? Pode citar mais de um:

• Imóveis
• Empresa ou participações societárias
• Aplicações e investimentos
• Veículos
• Sem patrimônio significativo
• Não tenho certeza`,

  M4C:
`Última pergunta antes de encaminhar pra advogada: qual a renda familiar mensal aproximada?

• Até R$ 10.000
• R$ 10.000 a R$ 30.000
• R$ 30.000 a R$ 60.000
• Acima de R$ 60.000`,

  M5C:
`Obrigada pelas respostas! Anotamos tudo aqui.

Já estamos passando seu caso pra equipe comercial. Uma das nossas advogadas entra em contato ainda hoje pra conversar em detalhes com você.`,

  "M5C-Desq":
`Obrigada pelas suas respostas, foi muito importante compartilhar isso com a gente.

Pelo que você contou, o seu caso pede um caminho um pouco diferente do que a gente faz aqui na área de partilha. Isso não significa que você não tem direito, significa que existem formatos de atendimento mais adequados pro seu momento.

A gente vai olhar com atenção e alguém retorna com a melhor orientação pra você. Pode levar um pouco mais de tempo, mas você não fica sem resposta.`,

  M2D:
`Certo. Pra a gente entender melhor seu caso, em que fase está o inventário hoje?

• Faleceu recentemente, ainda não abrimos o processo
• Inventário aberto e em andamento
• Inventário aberto mas travado, com algum problema
• Ninguém faleceu ainda, estou pensando em planejamento sucessório preventivo`,

  M3D:
`Entendi. Você tem uma ideia do patrimônio total que está no inventário?

• Até R$ 300 mil
• R$ 300 mil a R$ 1 milhão
• R$ 1 milhão a R$ 5 milhões
• Acima de R$ 5 milhões
• Não sei estimar`,

  M4D:
`Como esse patrimônio é composto? Pode citar mais de um:

• Imóveis
• Empresa ou participações societárias
• Aplicações e investimentos
• Veículos
• Bens no exterior
• Outros`,

  M5D:
`Última pergunta antes de encaminhar pra advogada: existe algum risco de conflito entre os herdeiros?

• Sim, já há divergências
• Talvez, ainda não conversamos abertamente
• Não, todos alinhados`,

  M6D:
`Obrigada pelas respostas! Anotamos tudo com atenção.

Já estamos passando seu caso pra equipe comercial. Uma das nossas advogadas de Inventário e Sucessões entra em contato ainda hoje pra uma análise mais detalhada.`,

  "M6D-Preventivo":
`Obrigada pelas respostas.

Você está buscando planejamento sucessório preventivo, que é um trabalho um pouco diferente do inventário em si. A gente vai encaminhar pra equipe comercial e alguém retorna explicando qual formato faz mais sentido pro seu momento.`,

  M2E:
`Certo. Pra a gente te ajudar melhor, qual sua situação com o plano de saúde hoje?

• O plano negou o tratamento por escrito
• O plano negou verbalmente, sem documento
• O plano autorizou mas não está cumprindo
• O plano está enrolando pra responder
• Ainda não pedi, mas sei que vou precisar`,

  M3E:
`Que tipo de cobertura está em questão?

• Cirurgia
• Medicamento de alto custo
• Home care
• Tratamento oncológico (quimio, radio, imunoterapia)
• Terapia continuada (fono, TO, psico, ABA)
• UTI ou internação
• Exame de alta complexidade
• Outro`,

  M4E:
`Qual a urgência clínica do caso?

• Extrema (risco de vida ou piora rápida)
• Precisa começar em até 30 dias
• Sem urgência imediata, mas tem direito`,

  M5E:
`Última pergunta: qual o valor mensal do plano de saúde?

• Até R$ 500
• R$ 500 a R$ 1.500
• R$ 1.500 a R$ 3.000
• Acima de R$ 3.000`,

  "M6E-Urgente":
`Estamos marcando seu caso como urgente e a equipe comercial já foi avisada. Uma advogada entra em contato ainda hoje.

Enquanto isso, se puder, tenha em mãos:

• A negativa do plano, se tiver por escrito
• O laudo médico atual
• A receita ou prescrição do tratamento

Isso agiliza muito a análise.`,

  "M6E-CasoForte":
`Obrigada pelas respostas! Anotamos tudo.

Seu caso tem uma base forte porque a negativa está por escrito, o que ajuda bastante na estratégia. Já estamos passando pra equipe comercial. Uma das nossas advogadas de Direito da Saúde entra em contato ainda hoje.`,

  M6E:
`Obrigada pelas respostas!

Já estamos passando seu caso pra equipe comercial. Uma das nossas advogadas de Direito da Saúde entra em contato em até 48h úteis pra conversar com você.`,
};

export const FOLLOWUP_24H =
`Oi, tudo bem?

Passando pra saber se você ainda quer conversar sobre o seu caso. A gente segue no aguardo.`;

export function templateV1(id: string): string {
  return TEMPLATES[id] ?? TEMPLATES.M0;
}

// ============================================================
// CLASSIFICADOR
// ============================================================

export const SYSTEM_PROMPT_ROTEIRO_V1 = `Você é o classificador de intenção do bot da B&Z Advocacia. Analisa a mensagem do lead e o histórico da conversa e retorna JSON estruturado com a próxima ação.

ÁREAS ATENDIDAS PELA B&Z:
- Família: Divórcio com Partilha de Bens (SIM), Pensão Alimentícia isolada (NÃO), Guarda de filhos isolada (NÃO)
- Inventário e Sucessões (SIM)
- Direito da Saúde (SIM)

FORA DO ESCOPO:
- Consumidor, Trabalhista, Previdenciário, Cível puro

RETORNE JSON EXATO:
{
  "area": "familia" | "inventario" | "saude" | "pensao_guarda_apenas" | "fora_escopo" | "nao_claro",
  "subclassificacao": "breve descrição do caso do lead",
  "proxima_mensagem_id": "M0"|"M1"|"M-A"|"M-B"|"M2C"|"M3C"|"M4C"|"M5C"|"M5C-Desq"|"M2D"|"M3D"|"M4D"|"M5D"|"M6D"|"M6D-Preventivo"|"M2E"|"M3E"|"M4E"|"M5E"|"M6E"|"M6E-Urgente"|"M6E-CasoForte"|"encerrado_frio"|"desqualificado",
  "resposta_estruturada": { },
  "flags_a_adicionar": []
}

REGRAS DE FLUXO:
1. Primeira mensagem do lead → sempre proxima_mensagem_id="M0" com area="nao_claro"
2. Após M0/M1, classifica:
   - Se menciona pensão OU guarda SEM divórcio E SEM partilha → area="pensao_guarda_apenas", proxima="M-A"
   - Se menciona trabalhista/consumidor/previdenciário/cível → area="fora_escopo", proxima="M-B"
   - Se menciona divórcio, separação, partilha → area="familia", proxima="M2C"
   - Se menciona inventário, herança, falecimento, testamento, planejamento sucessório → area="inventario", proxima="M2D"
   - Se menciona plano de saúde, negativa, medicamento, tratamento, cirurgia → area="saude", proxima="M2E"
   - Se ambíguo → area="nao_claro", proxima="M1"
3. Sequência estrita por caminho (nunca pula pergunta):
   - Família: M2C → M3C → M4C → (regra) → M5C ou M5C-Desq
   - Inventário: M2D → M3D → M4D → M5D → (regra) → M6D ou M6D-Preventivo
   - Saúde: M2E → M3E → M4E → M5E → (regra) → M6E/M6E-Urgente/M6E-CasoForte
4. Extrai a resposta estruturada da mensagem do lead conforme a etapa atual (situacao, patrimonio, renda, fase, patrimonio_estimado, composicao, risco_conflito, situacao_plano, tipo_cobertura, urgencia, valor_plano).

REGRAS DE QUALIFICAÇÃO:
- Família M4C:
  * Se patrimonio = ["Sem patrimônio significativo"] → proxima="M5C-Desq", flags=["desqualificado_ticket_baixo"]
  * Se renda="Até R$ 10.000" AND patrimonio subset de ["Sem patrimônio significativo","Não tenho certeza"] → proxima="M5C-Desq", flags=["desqualificado_ticket_baixo"]
  * Senão → proxima="M5C"
- Inventário M5D:
  * Se fase = "Ninguém faleceu ainda, estou pensando em planejamento sucessório preventivo" → proxima="M6D-Preventivo", flags=["produto_diferente"]
  * Se patrimonio_estimado = "Até R$ 300 mil" → flags=["ticket_baixo"], proxima="M6D"
  * Senão → proxima="M6D"
- Saúde M4E:
  * Se urgencia="Extrema (risco de vida ou piora rápida)" → flags=["urgente_saude"]
- Saúde M5E:
  * Se urgencia="Extrema (...)" → proxima="M6E-Urgente"
  * Se situacao_plano="O plano negou o tratamento por escrito" → flags=["caso_forte"], proxima="M6E-CasoForte"
  * Se valor_plano="Até R$ 500" → flags=["plano_basico"], proxima="M6E"
  * Senão → proxima="M6E"

TOM:
- NUNCA menciona nome próprio
- Fala em nome do escritório ("aqui", "a gente", "o escritório")
- Empática, acolhedora, uma pergunta por vez
- Retorna APENAS JSON válido, sem markdown, sem prefixos`;

// ============================================================
// MAPAS DE APOIO
// ============================================================

/** Sequência canônica de cada caminho. */
export const SEQUENCIA: Record<string, string[]> = {
  familia: ["M2C", "M3C", "M4C"],
  inventario: ["M2D", "M3D", "M4D", "M5D"],
  saude: ["M2E", "M3E", "M4E", "M5E"],
};

/** Chave da resposta estruturada esperada em cada etapa perguntada. */
export const CHAVE_POR_ETAPA: Record<string, string> = {
  M2C: "situacao",
  M3C: "patrimonio",
  M4C: "renda",
  M2D: "fase",
  M3D: "patrimonio_estimado",
  M4D: "composicao",
  M5D: "risco_conflito",
  M2E: "situacao_plano",
  M3E: "tipo_cobertura",
  M4E: "urgencia",
  M5E: "valor_plano",
};

export const PERGUNTA_TEXTO_V1: Record<string, string> = {
  M0: "Qual sua situação hoje? O que te trouxe até a gente?",
  M1: "Seu caso é mais relacionado a divórcio, herança, plano de saúde, ou outra coisa?",
  M2C: "Qual dessas mais se aproxima do seu caso hoje?",
  M3C: "Existe patrimônio a partilhar?",
  M4C: "Qual a renda familiar mensal aproximada?",
  M2D: "Em que fase está o inventário hoje?",
  M3D: "Qual o patrimônio total que está no inventário?",
  M4D: "Como esse patrimônio é composto?",
  M5D: "Existe risco de conflito entre os herdeiros?",
  M2E: "Qual sua situação com o plano de saúde hoje?",
  M3E: "Que tipo de cobertura está em questão?",
  M4E: "Qual a urgência clínica do caso?",
  M5E: "Qual o valor mensal do plano de saúde?",
};

export const IDS_HANDOFF = [
  "M5C",
  "M6D",
  "M6D-Preventivo",
  "M6E",
  "M6E-Urgente",
  "M6E-CasoForte",
];

export const IDS_DESQUALIFICA = ["M-A", "M-B", "M5C-Desq", "desqualificado"];

export function areaDoMsgId(id: string): "familia" | "inventario" | "saude" | null {
  if (/C$|C-Desq$/.test(id)) return "familia";
  if (/D$|D-Preventivo$/.test(id)) return "inventario";
  if (/E$|E-Urgente$|E-CasoForte$/.test(id)) return "saude";
  return null;
}

// ============================================================
// REGRAS DETERMINÍSTICAS (o Haiku sugere, aqui é a fonte da verdade)
// ============================================================

function comoArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

const SEM_PATRIMONIO = "Sem patrimônio significativo";
const SEM_CERTEZA = "Não tenho certeza";

export interface ResultadoRegra {
  proxima: string;
  flags: string[];
}

/**
 * Recebe a etapa que acabou de ser respondida e o acumulado de respostas.
 * Devolve a próxima mensagem do roteiro e as flags a adicionar.
 */
export function aplicarRegrasV1(
  area: string,
  etapaRespondida: string,
  dados: Record<string, unknown>,
): ResultadoRegra {
  const flags: string[] = [];
  const seq = SEQUENCIA[area] ?? [];
  const idx = seq.indexOf(etapaRespondida);

  // Ainda tem pergunta no meio do caminho.
  if (idx >= 0 && idx < seq.length - 1) {
    // Sinaliza urgência de saúde assim que M4E é respondida.
    if (etapaRespondida === "M4E" && /extrema/i.test(String(dados.urgencia ?? ""))) {
      flags.push("urgente_saude");
    }
    if (etapaRespondida === "M3D" && /at[ée]\s*r\$?\s*300/i.test(String(dados.patrimonio_estimado ?? ""))) {
      flags.push("ticket_baixo");
    }
    return { proxima: seq[idx + 1], flags };
  }

  // Última pergunta do caminho respondida → aplica regra de fechamento.
  if (area === "familia") {
    const patr = comoArray(dados.patrimonio);
    const renda = String(dados.renda ?? "");
    const soSemPatrimonio = patr.length > 0 && patr.every((p) => p === SEM_PATRIMONIO);
    const subsetFraco = patr.length > 0 &&
      patr.every((p) => p === SEM_PATRIMONIO || p === SEM_CERTEZA);
    const rendaBaixa = /at[ée]\s*r\$?\s*10/i.test(renda);
    if (soSemPatrimonio || (rendaBaixa && subsetFraco)) {
      flags.push("desqualificado_ticket_baixo");
      return { proxima: "M5C-Desq", flags };
    }
    return { proxima: "M5C", flags };
  }

  if (area === "inventario") {
    const fase = String(dados.fase ?? "");
    if (/preventiv|ningu[ée]m faleceu|planejamento sucess/i.test(fase)) {
      flags.push("produto_diferente");
      return { proxima: "M6D-Preventivo", flags };
    }
    if (/at[ée]\s*r\$?\s*300/i.test(String(dados.patrimonio_estimado ?? ""))) {
      flags.push("ticket_baixo");
    }
    return { proxima: "M6D", flags };
  }

  if (area === "saude") {
    const urgencia = String(dados.urgencia ?? "");
    const situacao = String(dados.situacao_plano ?? "");
    const valor = String(dados.valor_plano ?? "");
    if (/at[ée]\s*r\$?\s*500/i.test(valor)) flags.push("plano_basico");
    if (/extrema/i.test(urgencia)) {
      flags.push("urgente_saude");
      return { proxima: "M6E-Urgente", flags };
    }
    if (/por escrito/i.test(situacao)) {
      flags.push("caso_forte");
      return { proxima: "M6E-CasoForte", flags };
    }
    return { proxima: "M6E", flags };
  }

  return { proxima: "M1", flags };
}

// ============================================================
// CADÊNCIA
// ============================================================

/** Espera 2 a 4 segundos antes de o bot falar, pra parecer humano. */
export async function cadencia(): Promise<void> {
  const delay = 2000 + Math.random() * 2000;
  await new Promise((r) => setTimeout(r, delay));
}
