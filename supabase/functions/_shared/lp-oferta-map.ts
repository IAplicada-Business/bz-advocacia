// Mapeia slug LP + values do form → oferta + respostas canônicas das REGRAS.

import type { Oferta } from "./classify-form.ts";

export type LpSlug = "saude" | "inventario" | "divorcio";

export function slugToOferta(slug: string): Oferta {
  const s = slug.toLowerCase().trim();
  if (s === "inventario" || s === "inventário") return "inventario_otimizado";
  if (s === "divorcio" || s === "divórcio" || s === "familia" || s === "família") {
    return "partilha_protegida";
  }
  return "cobertura_garantida";
}

export function ofertaToSlug(oferta: Oferta): LpSlug {
  if (oferta === "inventario_otimizado") return "inventario";
  if (oferta === "partilha_protegida") return "divorcio";
  return "saude";
}

export function ofertaToArea(oferta: Oferta): "familia" | "inventario" | "saude" {
  if (oferta === "partilha_protegida") return "familia";
  if (oferta === "inventario_otimizado") return "inventario";
  return "saude";
}

/**
 * Normaliza values do form (já com values canônicos ou labels legados)
 * para Record canônico das REGRAS.
 */
export function mapValuesToRespostas(
  oferta: Oferta,
  values: Record<string, string | string[]>,
): Record<string, string | string[]> {
  const get = (keys: string[]): string | string[] | undefined => {
    for (const k of keys) {
      const v = values[k];
      if (v === undefined || v === null || v === "") continue;
      return v;
    }
    return undefined;
  };

  const asArr = (v: string | string[] | undefined): string[] => {
    if (!v) return [];
    return Array.isArray(v) ? v.map(String) : [String(v)];
  };

  const mapOne = (raw: string, table: Record<string, string>): string => {
    if (table[raw]) return table[raw];
    const lower = raw.toLowerCase().trim();
    for (const [k, canon] of Object.entries(table)) {
      if (k.toLowerCase() === lower) return canon;
    }
    // já canônico?
    return lower.replace(/\s+/g, "_");
  };

  if (oferta === "partilha_protegida") {
    const situacaoMap: Record<string, string> = {
      casado_pensando: "casado_pensando",
      "Ainda casada(o), pensando em me separar": "casado_pensando",
      "Ainda casada, quero me preparar": "casado_pensando",
      separado_sem_processo: "separado_sem_processo",
      "Já separada(o) mas sem processo iniciado": "separado_sem_processo",
      "Separação de fato / já saí de casa": "separado_sem_processo",
      consensual_negociacao: "consensual_negociacao",
      "Divórcio consensual em negociação": "consensual_negociacao",
      litigioso_andamento: "litigioso_andamento",
      "Divórcio litigioso em andamento": "litigioso_andamento",
      "Divórcio em andamento": "litigioso_andamento",
      processo_travado: "processo_travado",
      "Processo iniciado mas travado": "processo_travado",
    };
    const resolverMap: Record<string, string> = {
      partilha_bens: "partilha_bens",
      "Partilha de bens": "partilha_bens",
      divorcio_com_sem_partilha: "divorcio_com_sem_partilha",
      "Divórcio (com ou sem partilha)": "divorcio_com_sem_partilha",
      apenas_pensao: "apenas_pensao",
      "Apenas pensão alimentícia": "apenas_pensao",
      apenas_guarda: "apenas_guarda",
      "Apenas guarda / visitas": "apenas_guarda",
      nao_certeza: "nao_certeza",
      "Ainda não tenho certeza": "nao_certeza",
    };
    const patrimonioMap: Record<string, string> = {
      imoveis: "imoveis",
      "Imóveis": "imoveis",
      "Imóvel(is)": "imoveis",
      empresa: "empresa",
      "Empresa ou participações societárias": "empresa",
      "Empresa / sociedade": "empresa",
      aplicacoes: "aplicacoes",
      "Aplicações e investimentos": "aplicacoes",
      "Investimentos e contas": "aplicacoes",
      veiculos: "veiculos",
      Veículos: "veiculos",
      sem_patrimonio_significativo: "sem_patrimonio_significativo",
      "Sem patrimônio significativo": "sem_patrimonio_significativo",
      nao_certeza: "nao_certeza",
      "Não tenho certeza": "nao_certeza",
      "Ainda não sei o que existe": "nao_certeza",
      "Patrimônio misto / complexo": "imoveis",
    };
    const rendaMap: Record<string, string> = {
      ate_10k: "ate_10k",
      "Até R$ 10.000": "ate_10k",
      "10k_30k": "10k_30k",
      "R$ 10.000 a R$ 30.000": "10k_30k",
      "30k_60k": "30k_60k",
      "R$ 30.000 a R$ 60.000": "30k_60k",
      acima_60k: "acima_60k",
      "Acima de R$ 60.000": "acima_60k",
    };

    const situacaoRaw = String(get(["situacao"]) ?? "");
    const resolverRaw = String(get(["resolver", "o_que_resolver"]) ?? "partilha_bens");
    const patrimRaw = asArr(get(["patrimonio", "bens"]));
    const rendaRaw = String(get(["renda", "renda_familiar"]) ?? "");

    return {
      situacao: mapOne(situacaoRaw, situacaoMap),
      resolver: mapOne(resolverRaw, resolverMap),
      patrimonio: patrimRaw.map((p) => mapOne(p, patrimonioMap)),
      renda: mapOne(rendaRaw, rendaMap),
    };
  }

  if (oferta === "inventario_otimizado") {
    const faseMap: Record<string, string> = {
      falecimento_recente: "falecimento_recente",
      "Falecimento recente / ainda não iniciei": "falecimento_recente",
      "Ainda não iniciei": "falecimento_recente",
      aberto_andamento: "aberto_andamento",
      "Inventário aberto em andamento": "aberto_andamento",
      travado: "travado",
      "Já comecei e está travado": "travado",
      preventivo: "preventivo",
      "Ninguém faleceu — planejamento preventivo": "preventivo",
      "Só quero entender as opções": "preventivo",
      "Quero reduzir o imposto (ITCMD)": "aberto_andamento",
      "Há conflito entre herdeiros": "travado",
    };
    const totalMap: Record<string, string> = {
      ate_300k: "ate_300k",
      "Até R$ 300 mil": "ate_300k",
      "Até R$ 500 mil": "ate_300k",
      "300k_1M": "300k_1M",
      "R$ 300 mil a R$ 1 milhão": "300k_1M",
      "R$ 500 mil a R$ 2 milhões": "300k_1M",
      "1M_5M": "1M_5M",
      "R$ 1 milhão a R$ 5 milhões": "1M_5M",
      "R$ 2 milhões a R$ 5 milhões": "1M_5M",
      acima_5M: "acima_5M",
      "Acima de R$ 5 milhões": "acima_5M",
      nao_sei: "nao_sei",
      "Ainda não sei o valor": "nao_sei",
    };
    const compMap: Record<string, string> = {
      imoveis: "imoveis",
      Imóveis: "imoveis",
      empresa: "empresa",
      Empresa: "empresa",
      aplicacoes: "aplicacoes",
      Aplicações: "aplicacoes",
      exterior: "exterior",
      "Bens no exterior": "exterior",
      veiculos: "veiculos",
      Veículos: "veiculos",
      outros: "outros",
      Outros: "outros",
    };
    const conflitoMap: Record<string, string> = {
      sim: "sim",
      "Sim, conflito aberto": "sim",
      "Não, conflito aberto": "sim",
      talvez: "talvez",
      "Parcial, há atritos": "talvez",
      "Há conflito entre herdeiros": "sim",
      nao: "nao",
      "Sim, todos alinhados": "nao",
      "Prefiro não dizer agora": "talvez",
    };

    return {
      fase: mapOne(String(get(["fase", "situacao"]) ?? ""), faseMap),
      patrimonio_total: mapOne(String(get(["patrimonio_total", "bens"]) ?? ""), totalMap),
      composicao: asArr(get(["composicao", "composicao_patrimonio"])).map((p) =>
        mapOne(p, compMap)
      ),
      conflito: mapOne(String(get(["conflito", "consenso", "risco_conflito"]) ?? ""), conflitoMap),
    };
  }

  // cobertura_garantida
  const sitMap: Record<string, string> = {
    negou_escrito: "negou_escrito",
    "O plano negou por escrito": "negou_escrito",
    "Plano negou medicamento": "negou_escrito",
    "Plano negou cirurgia / procedimento": "negou_escrito",
    "Plano negou internação / UTI": "negou_escrito",
    "Outra negativa de cobertura": "negou_escrito",
    negou_verbal: "negou_verbal",
    "O plano negou verbalmente": "negou_verbal",
    autorizou_nao_cumpre: "autorizou_nao_cumpre",
    "Autorizou mas não cumpre": "autorizou_nao_cumpre",
    enrolando: "enrolando",
    "Demora excessiva na autorização": "enrolando",
    "Está enrolando / sem resposta clara": "enrolando",
    nao_pedi: "nao_pedi",
    "Ainda não pedi ao plano": "nao_pedi",
    "SUS negou medicamento / procedimento": "negou_escrito",
  };
  const tipoMap: Record<string, string> = {
    oncologico: "oncologico",
    Oncológico: "oncologico",
    medicamento_alto_custo: "medicamento_alto_custo",
    "Medicamento de alto custo": "medicamento_alto_custo",
    uti: "uti",
    "UTI / internação": "uti",
    "Internação hospitalar": "uti",
    home_care: "home_care",
    "Home care": "home_care",
    "Tratamento contínuo / home care": "home_care",
    cirurgia: "cirurgia",
    "Cirurgia eletiva / urgência": "cirurgia",
    terapia_continuada: "terapia_continuada",
    "Terapia continuada": "terapia_continuada",
    exame: "exame",
    "Exames / diagnóstico": "exame",
    outro: "outro",
    Outro: "outro",
  };
  const urgMap: Record<string, string> = {
    risco_vida: "risco_vida",
    "Urgência extrema (risco imediato)": "risco_vida",
    "Extrema (risco de vida ou piora rápida)": "risco_vida",
    ate_30_dias: "ate_30_dias",
    "Alta (precisa em dias)": "ate_30_dias",
    "Até 30 dias": "ate_30_dias",
    "Média (próximas semanas)": "ate_30_dias",
    sem_urgencia: "sem_urgencia",
    "Ainda avaliando opções": "sem_urgencia",
    "Sem urgência": "sem_urgencia",
  };
  const valorMap: Record<string, string> = {
    ate_500: "ate_500",
    "Até R$ 500": "ate_500",
    "500_1500": "500_1500",
    "R$ 500 a R$ 1.500": "500_1500",
    "1500_3000": "1500_3000",
    "R$ 1.500 a R$ 3.000": "1500_3000",
    acima_3000: "acima_3000",
    "Acima de R$ 3.000": "acima_3000",
  };

  return {
    situacao_plano: mapOne(String(get(["situacao_plano", "situacao"]) ?? ""), sitMap),
    tipo_cobertura: mapOne(String(get(["tipo_cobertura", "cobertura"]) ?? ""), tipoMap),
    urgencia: mapOne(String(get(["urgencia"]) ?? ""), urgMap),
    valor_plano: mapOne(String(get(["valor_plano", "plano_valor"]) ?? "500_1500"), valorMap),
  };
}
