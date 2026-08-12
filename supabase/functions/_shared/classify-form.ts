// Regras de qualificação MQL — 3 ofertas (Form LP → CRM → Bot)
// Pure TS (sem Deno) — testável via vitest.

export type Efeito =
  | "AUTO_MQL"
  | "PLUS_MQL"
  | "REBAIXA"
  | "REDIRECIONA_CONTINUIDADE"
  | "DESQUALIFICA"
  | "PRIORIDADE_MAX";

export type Regra = { valor: string; efeito: Efeito; motivo?: string };

export type Oferta =
  | "partilha_protegida"
  | "inventario_otimizado"
  | "cobertura_garantida";

/** Stage canônico do CRM (enum lead_stage). */
export type StageDecisao =
  | "mql"
  | "conectado"
  | "desqualificado"
  | "continuidade";

export const REGRAS: Record<Oferta, Record<string, Regra[]>> = {
  partilha_protegida: {
    situacao: [
      { valor: "casado_pensando", efeito: "PLUS_MQL" },
      { valor: "separado_sem_processo", efeito: "PLUS_MQL" },
      { valor: "consensual_negociacao", efeito: "AUTO_MQL" },
      {
        valor: "litigioso_andamento",
        efeito: "REBAIXA",
        motivo: "segunda opinião, ciclo longo",
      },
      { valor: "processo_travado", efeito: "PLUS_MQL" },
    ],
    resolver: [
      { valor: "partilha_bens", efeito: "AUTO_MQL" },
      { valor: "divorcio_com_sem_partilha", efeito: "PLUS_MQL" },
      {
        valor: "apenas_pensao",
        efeito: "DESQUALIFICA",
        motivo: "área em redução — roteia pra Mariana",
      },
      {
        valor: "apenas_guarda",
        efeito: "DESQUALIFICA",
        motivo: "área em redução — roteia pra Mariana",
      },
      { valor: "nao_certeza", efeito: "PLUS_MQL" },
    ],
    patrimonio: [
      { valor: "imoveis", efeito: "PLUS_MQL" },
      { valor: "empresa", efeito: "PLUS_MQL" },
      { valor: "aplicacoes", efeito: "PLUS_MQL" },
      { valor: "veiculos", efeito: "PLUS_MQL" },
      {
        valor: "sem_patrimonio_significativo",
        efeito: "REBAIXA",
        motivo: "ticket mínimo",
      },
      { valor: "nao_certeza", efeito: "PLUS_MQL" },
    ],
    renda: [
      {
        valor: "ate_10k",
        efeito: "DESQUALIFICA",
        motivo: "perfil não paga o método",
      },
      {
        valor: "10k_30k",
        efeito: "REBAIXA",
        motivo: "sobe se pergunta 3 tiver imóveis/empresa",
      },
      { valor: "30k_60k", efeito: "PLUS_MQL" },
      { valor: "acima_60k", efeito: "AUTO_MQL" },
    ],
  },

  inventario_otimizado: {
    fase: [
      { valor: "falecimento_recente", efeito: "AUTO_MQL" },
      { valor: "aberto_andamento", efeito: "PLUS_MQL" },
      { valor: "travado", efeito: "AUTO_MQL" },
      {
        valor: "preventivo",
        efeito: "REDIRECIONA_CONTINUIDADE",
        motivo: "vira lead de holding/doação",
      },
    ],
    patrimonio_total: [
      {
        valor: "ate_300k",
        efeito: "DESQUALIFICA",
        motivo: "ITCMD absoluto não paga o método",
      },
      { valor: "300k_1M", efeito: "PLUS_MQL" },
      { valor: "1M_5M", efeito: "AUTO_MQL" },
      { valor: "acima_5M", efeito: "AUTO_MQL" },
      { valor: "nao_sei", efeito: "PLUS_MQL" },
    ],
    composicao: [
      { valor: "imoveis", efeito: "PLUS_MQL" },
      { valor: "empresa", efeito: "PLUS_MQL" },
      { valor: "aplicacoes", efeito: "PLUS_MQL" },
      { valor: "exterior", efeito: "AUTO_MQL" },
      { valor: "veiculos", efeito: "REBAIXA" },
      { valor: "outros", efeito: "REBAIXA" },
    ],
    conflito: [
      { valor: "sim", efeito: "AUTO_MQL" },
      { valor: "talvez", efeito: "PLUS_MQL" },
      { valor: "nao", efeito: "PLUS_MQL" },
    ],
  },

  cobertura_garantida: {
    situacao_plano: [
      { valor: "negou_escrito", efeito: "AUTO_MQL" },
      {
        valor: "negou_verbal",
        efeito: "PLUS_MQL",
        motivo: "bot orienta pedir por escrito",
      },
      { valor: "autorizou_nao_cumpre", efeito: "AUTO_MQL" },
      { valor: "enrolando", efeito: "PLUS_MQL" },
      {
        valor: "nao_pedi",
        efeito: "REBAIXA",
        motivo: "nutrição 15 dias",
      },
    ],
    tipo_cobertura: [
      { valor: "oncologico", efeito: "AUTO_MQL" },
      { valor: "medicamento_alto_custo", efeito: "AUTO_MQL" },
      { valor: "uti", efeito: "AUTO_MQL" },
      { valor: "home_care", efeito: "PLUS_MQL" },
      { valor: "cirurgia", efeito: "PLUS_MQL" },
      { valor: "terapia_continuada", efeito: "PLUS_MQL" },
      { valor: "exame", efeito: "REBAIXA" },
      { valor: "outro", efeito: "PLUS_MQL" },
    ],
    urgencia: [
      { valor: "risco_vida", efeito: "AUTO_MQL" },
      { valor: "ate_30_dias", efeito: "PLUS_MQL" },
      { valor: "sem_urgencia", efeito: "REBAIXA" },
    ],
    valor_plano: [
      {
        valor: "ate_500",
        efeito: "DESQUALIFICA",
        motivo: "valor de causa baixo",
      },
      { valor: "500_1500", efeito: "PLUS_MQL" },
      { valor: "1500_3000", efeito: "AUTO_MQL" },
      { valor: "acima_3000", efeito: "AUTO_MQL" },
    ],
  },
};

export type FormPayload = {
  oferta: Oferta;
  respostas: Record<string, string | string[]>;
  contato: {
    nome: string;
    whatsapp: string;
    email?: string;
    melhor_horario?: string;
  };
  utm?: Record<string, string>;
};

export type Decisao = {
  stage: StageDecisao;
  score: number;
  flags: string[];
  desqualificacao?: string;
  redirecionamento?: string;
};

export function classificar(payload: FormPayload): Decisao {
  const regras = REGRAS[payload.oferta];
  if (!regras) throw new Error(`oferta inválida: ${payload.oferta}`);

  const flags: string[] = [];
  let score = 0;
  let autoMql = false;
  let desqualificacao: string | undefined;
  let redirecionamento: string | undefined;
  let prioridadeMax = false;

  for (const [campo, respostaRaw] of Object.entries(payload.respostas)) {
    const respostas = Array.isArray(respostaRaw) ? respostaRaw : [respostaRaw];
    const regrasCampo = regras[campo];
    if (!regrasCampo) continue;

    let plusMqlNoCampo = 0;
    for (const resp of respostas) {
      const regra = regrasCampo.find((r) => r.valor === resp);
      if (!regra) continue;

      switch (regra.efeito) {
        case "DESQUALIFICA":
          desqualificacao = regra.motivo ?? `campo ${campo}: ${resp}`;
          flags.push(`DESQ:${campo}=${resp}`);
          break;
        case "AUTO_MQL":
          autoMql = true;
          score += 3;
          flags.push(`AUTO_MQL:${campo}=${resp}`);
          if (campo === "urgencia" && resp === "risco_vida") prioridadeMax = true;
          break;
        case "PLUS_MQL":
          plusMqlNoCampo += 1;
          score += 1;
          break;
        case "REBAIXA":
          score -= 1;
          flags.push(`REBAIXA:${campo}=${resp}`);
          break;
        case "REDIRECIONA_CONTINUIDADE":
          redirecionamento = "continuidade";
          flags.push(`REDIR:${campo}=${resp}`);
          break;
        case "PRIORIDADE_MAX":
          prioridadeMax = true;
          break;
      }
    }

    if ((campo === "patrimonio" || campo === "composicao") && plusMqlNoCampo >= 2) {
      autoMql = true;
      flags.push(`AUTO_MQL:${campo}>=2`);
    }
  }

  // Renda 10k_30k sobe se patrimônio tiver imóveis/empresa
  if (
    payload.oferta === "partilha_protegida" &&
    payload.respostas.renda === "10k_30k"
  ) {
    const patr = Array.isArray(payload.respostas.patrimonio)
      ? payload.respostas.patrimonio
      : [payload.respostas.patrimonio].filter(Boolean);
    if (patr.includes("imoveis") || patr.includes("empresa")) {
      score += 2;
      flags.push("PLUS_MQL:renda_elevada_por_patrimonio");
    }
  }

  if (desqualificacao) {
    return { stage: "desqualificado", score, flags, desqualificacao };
  }
  if (redirecionamento) {
    return { stage: "continuidade", score, flags, redirecionamento };
  }
  if (prioridadeMax) flags.push("PRIORIDADE_MAX");

  if (autoMql || score >= 2) {
    return { stage: "mql", score, flags };
  }
  return { stage: "conectado", score, flags };
}

/** status_sdr legado a partir da decisão. */
export function statusSdrFromStage(stage: StageDecisao): string {
  switch (stage) {
    case "mql":
      return "novo";
    case "conectado":
      return "em_atendimento_bot";
    case "desqualificado":
      return "perdido";
    case "continuidade":
      return "aguardando_triagem";
    default:
      return "novo";
  }
}
