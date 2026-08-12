// Mapeia oferta → perguntas que o bot NUNCA deve repetir
// (porque o form da LP já capturou).

import type { Oferta } from "./classify-form.ts";

export const CAMPOS_FORM: Record<Oferta, string[]> = {
  partilha_protegida: [
    "situacao_civil",
    "o_que_resolver",
    "patrimonio_existente",
    "renda_familiar",
    "nome",
    "whatsapp",
    "email",
    "melhor_horario",
  ],
  inventario_otimizado: [
    "fase_inventario",
    "patrimonio_total",
    "composicao_patrimonio",
    "risco_conflito_herdeiros",
    "nome",
    "whatsapp",
    "email",
    "melhor_horario",
  ],
  cobertura_garantida: [
    "situacao_com_plano",
    "tipo_cobertura",
    "urgencia_clinica",
    "valor_plano",
    "nome",
    "whatsapp",
    "email",
    "melhor_horario",
  ],
};

/** Campos de resposta canônicos (keys em sdr_contexto.respostas) por oferta. */
export const CAMPOS_RESPOSTA_CANONICOS: Record<Oferta, string[]> = {
  partilha_protegida: ["situacao", "resolver", "patrimonio", "renda"],
  inventario_otimizado: ["fase", "patrimonio_total", "composicao", "conflito"],
  cobertura_garantida: [
    "situacao_plano",
    "tipo_cobertura",
    "urgencia",
    "valor_plano",
  ],
};

/**
 * Etapas do roteiro v1 que o form já cobre → bot deve pular.
 * Chave = campo canônico do form; valor = MsgId do roteiro.
 */
export const ETAPA_ROTEIRO_POR_CAMPO: Record<Oferta, Record<string, string>> = {
  partilha_protegida: {
    situacao: "M2C",
    patrimonio: "M3C",
    renda: "M4C",
  },
  inventario_otimizado: {
    fase: "M2D",
    patrimonio_total: "M3D",
    composicao: "M4D",
    conflito: "M5D",
  },
  cobertura_garantida: {
    situacao_plano: "M2E",
    tipo_cobertura: "M3E",
    urgencia: "M4E",
    valor_plano: "M5E",
  },
};

export function proibidoPerguntar(oferta: string, campo: string): boolean {
  const lista = CAMPOS_FORM[oferta as Oferta];
  return lista?.includes(campo) ?? false;
}

export const PADROES_PROIBIDOS: Record<string, RegExp[]> = {
  partilha_protegida: [
    /qual sua situação (civil|hoje)/i,
    /(pens[aã]o aliment|guarda dos filhos).*(precisa|resolver)/i,
    /(qual|quanto) (é |a )?(sua )?renda/i,
    /tem (algum )?(patrim[oô]nio|bem)/i,
    /existe patrim[oô]nio a partilhar/i,
    /renda familiar mensal/i,
  ],
  inventario_otimizado: [
    /em que fase est[aá] o invent/i,
    /(qual|quanto) (é |o )?patrim[oô]nio (total|do esp[oó]lio)/i,
    /(risco de )?conflito.*(herdeiro|fam[ií]lia)/i,
    /como esse patrim[oô]nio é composto/i,
  ],
  cobertura_garantida: [
    /(qual|como) (est[aá] |é )?(sua )?situa[cç][aã]o.*(plano|convênio)/i,
    /(qual|que) tipo de cobertura/i,
    /(qual|quanto) (é )?(o )?valor.*(plano|convênio|mensal)/i,
    /(qual|quanta?) urg[eê]ncia/i,
  ],
};

export function validarMensagemDoBot(
  oferta: string,
  mensagem: string,
): { ok: true } | { ok: false; motivo: string } {
  if (!oferta || !mensagem) return { ok: true };
  const padroes = PADROES_PROIBIDOS[oferta] ?? [];
  for (const p of padroes) {
    if (p.test(mensagem)) {
      return {
        ok: false,
        motivo: `mensagem contém pergunta já respondida no form: ${p}`,
      };
    }
  }
  return { ok: true };
}

/** Labels legíveis das respostas canônicas (pra M0 personalizado). */
export const LABELS_RESPOSTA: Record<string, string> = {
  casado_pensando: "ainda casada(o) e pensando em se separar",
  separado_sem_processo: "já separada(o), sem processo",
  consensual_negociacao: "divórcio consensual em negociação",
  litigioso_andamento: "divórcio litigioso em andamento",
  processo_travado: "processo iniciado mas travado",
  partilha_bens: "partilha de bens",
  divorcio_com_sem_partilha: "divórcio (com ou sem partilha)",
  apenas_pensao: "apenas pensão",
  apenas_guarda: "apenas guarda",
  nao_certeza: "ainda sem certeza do caminho",
  imoveis: "imóveis",
  empresa: "empresa",
  aplicacoes: "aplicações",
  veiculos: "veículos",
  sem_patrimonio_significativo: "sem patrimônio significativo",
  ate_10k: "renda até R$ 10 mil",
  "10k_30k": "renda entre R$ 10 e 30 mil",
  "30k_60k": "renda entre R$ 30 e 60 mil",
  acima_60k: "renda acima de R$ 60 mil",
  falecimento_recente: "falecimento recente",
  aberto_andamento: "inventário em andamento",
  travado: "inventário travado",
  preventivo: "planejamento preventivo",
  ate_300k: "patrimônio até R$ 300 mil",
  "300k_1M": "patrimônio entre R$ 300 mil e R$ 1 mi",
  "1M_5M": "patrimônio entre R$ 1 e 5 mi",
  acima_5M: "patrimônio acima de R$ 5 mi",
  nao_sei: "patrimônio ainda sem estimativa",
  exterior: "bens no exterior",
  outros: "outros bens",
  sim: "com risco de conflito entre herdeiros",
  talvez: "possível atrito entre herdeiros",
  nao: "família alinhada",
  negou_escrito: "negativa do plano por escrito",
  negou_verbal: "negativa verbal do plano",
  autorizou_nao_cumpre: "plano autorizou e não cumpre",
  enrolando: "plano enrolando na autorização",
  nao_pedi: "ainda não pediu ao plano",
  oncologico: "cobertura oncológica",
  medicamento_alto_custo: "medicamento de alto custo",
  uti: "UTI / internação",
  home_care: "home care",
  cirurgia: "cirurgia",
  terapia_continuada: "terapia continuada",
  exame: "exame",
  outro: "outra cobertura",
  risco_vida: "risco de vida / urgência extrema",
  ate_30_dias: "precisa em até 30 dias",
  sem_urgencia: "sem urgência clínica",
  ate_500: "plano até R$ 500/mês",
  "500_1500": "plano entre R$ 500 e 1.500",
  "1500_3000": "plano entre R$ 1.500 e 3.000",
  acima_3000: "plano acima de R$ 3.000",
};

export function labelResposta(valor: string): string {
  return LABELS_RESPOSTA[valor] ?? valor.replace(/_/g, " ");
}
