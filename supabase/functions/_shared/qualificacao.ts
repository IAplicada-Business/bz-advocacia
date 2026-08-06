// Regras de qualificação estruturada — Família / Inventário / Saúde
// Textos: docs/BZ_Bot_Whatsapp_Roteiro_v1.md

export type Letra = string;

export interface RespostasFamilia {
  situacao?: Letra;
  patrimonio?: Letra;
  renda?: Letra;
}

export interface RespostasInventario {
  fase?: Letra;
  patrimonio?: Letra;
  composicao?: Letra;
  conflito?: Letra;
}

export interface RespostasSaude {
  plano?: Letra;
  cobertura?: Letra;
  urgencia?: Letra;
  valor_plano?: Letra;
}

export type ResultadoQualificacao =
  | { acao: "continuar"; proximaEtapa: string }
  | {
      acao: "desqualificar";
      motivo: string;
      mensagem: string;
    }
  | {
      acao: "handoff";
      flags: {
        ticket_minimo?: boolean;
        produto_diferente?: boolean;
        prioridade_max?: boolean;
        caso_forte?: boolean;
      };
      nota?: string;
    };

export const MSG_PENSAO_GUARDA =
  "Olá! Obrigada por entrar em contato. Nosso escritório hoje é especializado em Divórcio com Partilha de Bens, Inventário e Direito da Saúde. Para casos isolados de pensão alimentícia ou guarda, indicamos que procure um profissional especializado. Se sua situação envolver também partilha de bens ou divórcio, é só me contar mais e a gente segue.";

export const MSG_TICKET_MINIMO_FAMILIA =
  "Nosso trabalho é focado em partilha, então nesse caso o volume da causa é limitado. Recomendamos entrar em contato pelo formulário do site pra encaixar em pacote específico";

/** Normaliza resposta do lead para letra a-h. */
export function extrairLetraOpcao(texto: string): string | null {
  const t = (texto ?? "").trim().toLowerCase();
  const m = t.match(/^([a-h])(?:\b|[.)\-\s:]|$)/i);
  if (m) return m[1].toLowerCase();
  // "opção a", "letra b"
  const m2 = t.match(/(?:opç[aã]o|letra)\s*([a-h])\b/i);
  if (m2) return m2[1].toLowerCase();
  return null;
}

export function familiaCompleta(r: RespostasFamilia): boolean {
  return !!(r.situacao && r.patrimonio && r.renda);
}

export function inventarioCompleto(r: RespostasInventario): boolean {
  return !!(r.fase && r.patrimonio && r.composicao && r.conflito);
}

export function saudeCompleta(r: RespostasSaude): boolean {
  return !!(r.plano && r.cobertura && r.urgencia && r.valor_plano);
}

export function avaliarFamilia(r: RespostasFamilia): ResultadoQualificacao {
  if (!r.situacao) return { acao: "continuar", proximaEtapa: "M1" };
  if (!r.patrimonio) return { acao: "continuar", proximaEtapa: "M2" };
  if (!r.renda) return { acao: "continuar", proximaEtapa: "M3" };

  if (r.patrimonio === "e") {
    return {
      acao: "desqualificar",
      motivo: "ticket_minimo",
      mensagem: MSG_TICKET_MINIMO_FAMILIA,
    };
  }
  if (r.renda === "a" && (r.patrimonio === "e" || r.patrimonio === "f")) {
    return {
      acao: "desqualificar",
      motivo: "ticket_minimo",
      mensagem: MSG_TICKET_MINIMO_FAMILIA,
    };
  }
  return { acao: "handoff", flags: {} };
}

export function avaliarInventario(r: RespostasInventario): ResultadoQualificacao {
  if (!r.fase) return { acao: "continuar", proximaEtapa: "M1" };
  if (!r.patrimonio) return { acao: "continuar", proximaEtapa: "M2" };
  if (!r.composicao) return { acao: "continuar", proximaEtapa: "M2_valor" };
  if (!r.conflito) return { acao: "continuar", proximaEtapa: "M3" };

  const flags: { ticket_minimo?: boolean; produto_diferente?: boolean } = {};
  let nota: string | undefined;
  if (r.patrimonio === "a") flags.ticket_minimo = true;
  if (r.fase === "d") {
    flags.produto_diferente = true;
    nota = "Planejamento sucessório preventivo (não inventário clássico)";
  }
  return { acao: "handoff", flags, nota };
}

export function avaliarSaude(r: RespostasSaude): ResultadoQualificacao {
  if (!r.plano) return { acao: "continuar", proximaEtapa: "M1" };
  if (!r.cobertura) return { acao: "continuar", proximaEtapa: "M2" };
  if (!r.urgencia) return { acao: "continuar", proximaEtapa: "M2_valor" };
  if (!r.valor_plano) return { acao: "continuar", proximaEtapa: "M3" };

  const flags: { prioridade_max?: boolean; caso_forte?: boolean } = {};
  if (r.urgencia === "a") flags.prioridade_max = true;
  if (r.plano === "a") flags.caso_forte = true;
  return { acao: "handoff", flags };
}

/** Merge letra capturada na etapa atual. */
export function mergeRespostaPorEtapa(
  area: string,
  etapaAnterior: string,
  letra: string | null,
  dadosClaude: Record<string, unknown>,
  atual: RespostasFamilia | RespostasInventario | RespostasSaude,
): RespostasFamilia | RespostasInventario | RespostasSaude {
  const a = area.toLowerCase();
  const next = { ...atual } as Record<string, unknown>;

  const fromClaude = (keys: string[]): string | null => {
    for (const k of keys) {
      const v = dadosClaude[k];
      if (typeof v === "string" && /^[a-h]$/i.test(v.trim())) {
        return v.trim().toLowerCase();
      }
    }
    return null;
  };

  if (a === "familia") {
    if (etapaAnterior === "M1" || (!next.situacao && etapaAnterior === "M0")) {
      next.situacao = letra ?? fromClaude(["situacao", "familia_situacao"]) ?? next.situacao;
    } else if (etapaAnterior === "M2") {
      next.patrimonio = letra ?? fromClaude(["patrimonio", "familia_patrimonio"]) ?? next.patrimonio;
    } else if (etapaAnterior === "M3" || etapaAnterior === "finalizado") {
      next.renda = letra ?? fromClaude(["renda", "familia_renda"]) ?? next.renda;
    }
    // Também aceita Claude preenchendo tudo de uma vez em dados_capturados
    for (const k of ["situacao", "patrimonio", "renda"] as const) {
      const c = fromClaude([k, `familia_${k}`]);
      if (c && !next[k]) next[k] = c;
    }
    return next as RespostasFamilia;
  }

  if (a === "inventario") {
    if (etapaAnterior === "M1") {
      next.fase = letra ?? fromClaude(["fase"]) ?? next.fase;
    } else if (etapaAnterior === "M2") {
      next.patrimonio = letra ?? fromClaude(["patrimonio", "espólio", "espolio"]) ?? next.patrimonio;
    } else if (etapaAnterior === "M2_valor") {
      next.composicao = letra ?? fromClaude(["composicao"]) ?? next.composicao;
    } else if (etapaAnterior === "M3" || etapaAnterior === "finalizado") {
      next.conflito = letra ?? fromClaude(["conflito"]) ?? next.conflito;
    }
    for (const k of ["fase", "patrimonio", "composicao", "conflito"] as const) {
      const c = fromClaude([k]);
      if (c && !next[k]) next[k] = c;
    }
    return next as RespostasInventario;
  }

  if (a === "saude") {
    if (etapaAnterior === "M1") {
      next.plano = letra ?? fromClaude(["plano", "situacao_plano"]) ?? next.plano;
    } else if (etapaAnterior === "M2") {
      next.cobertura = letra ?? fromClaude(["cobertura", "tipo_cobertura"]) ?? next.cobertura;
    } else if (etapaAnterior === "M2_valor") {
      next.urgencia = letra ?? fromClaude(["urgencia"]) ?? next.urgencia;
    } else if (etapaAnterior === "M3" || etapaAnterior === "finalizado") {
      next.valor_plano = letra ?? fromClaude(["valor_plano", "valor"]) ?? next.valor_plano;
    }
    for (const k of ["plano", "cobertura", "urgencia", "valor_plano"] as const) {
      const c = fromClaude([k]);
      if (c && !next[k]) next[k] = c;
    }
    return next as RespostasSaude;
  }

  return next as RespostasFamilia;
}
