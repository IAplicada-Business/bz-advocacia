/**
 * Labels legíveis das respostas do form LP (sdr_contexto / dados_capturados).
 * Usado em Atendimento (insights) e na ficha do lead.
 */

export type FormRespostaItem = {
  key: string;
  label: string;
  value: string;
};

const FIELD_LABELS: Record<string, string> = {
  situacao: "Situação atual",
  resolver: "O que precisa resolver",
  patrimonio: "Patrimônio",
  renda: "Renda familiar",
  fase: "Fase do inventário",
  patrimonio_total: "Patrimônio total",
  composicao: "Composição do patrimônio",
  conflito: "Risco de conflito",
  situacao_plano: "Situação com o plano",
  tipo_cobertura: "Tipo de cobertura",
  urgencia: "Urgência clínica",
  valor_plano: "Valor do plano",
  melhor_horario: "Melhor horário",
};

const VALUE_LABELS: Record<string, string> = {
  // família / partilha
  casado_pensando: "Ainda casada(o), pensando em me separar",
  separado_sem_processo: "Já separada(o), sem processo iniciado",
  consensual_negociacao: "Divórcio consensual em negociação",
  litigioso_andamento: "Divórcio litigioso em andamento",
  processo_travado: "Processo iniciado mas travado",
  partilha_bens: "Partilha de bens",
  divorcio_com_sem_partilha: "Divórcio (com ou sem partilha)",
  apenas_pensao: "Apenas pensão alimentícia",
  apenas_guarda: "Apenas guarda / visitas",
  nao_certeza: "Ainda não tenho certeza",
  imoveis: "Imóveis",
  empresa: "Empresa ou participações",
  aplicacoes: "Aplicações e investimentos",
  veiculos: "Veículos",
  sem_patrimonio_significativo: "Sem patrimônio significativo",
  ate_10k: "Até R$ 10.000",
  "10k_30k": "R$ 10.000 a R$ 30.000",
  "30k_60k": "R$ 30.000 a R$ 60.000",
  acima_60k: "Acima de R$ 60.000",
  // inventário
  falecimento_recente: "Falecimento recente / ainda não iniciei",
  aberto_andamento: "Inventário aberto em andamento",
  travado: "Inventário travado",
  preventivo: "Planejamento preventivo",
  ate_300k: "Até R$ 300 mil",
  "300k_1M": "R$ 300 mil a R$ 1 milhão",
  "1M_5M": "R$ 1 milhão a R$ 5 milhões",
  acima_5M: "Acima de R$ 5 milhões",
  nao_sei: "Ainda não sei o valor",
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
  // saúde
  negou_escrito: "O plano negou por escrito",
  negou_verbal: "O plano negou verbalmente",
  autorizou_nao_cumpre: "Autorizou mas não cumpre",
  enrolando: "Está enrolando / sem resposta clara",
  nao_pedi: "Ainda não pedi ao plano",
  oncologico: "Oncológico",
  medicamento_alto_custo: "Medicamento de alto custo",
  uti: "UTI / internação",
  home_care: "Home care",
  cirurgia: "Cirurgia",
  terapia_continuada: "Terapia continuada",
  exame: "Exame / diagnóstico",
  outro: "Outro",
  risco_vida: "Risco de vida / piora rápida",
  ate_30_dias: "Precisa em até 30 dias",
  sem_urgencia: "Sem urgência clínica",
  ate_500: "Até R$ 500",
  "500_1500": "R$ 500 a R$ 1.500",
  "1500_3000": "R$ 1.500 a R$ 3.000",
  acima_3000: "Acima de R$ 3.000",
};

const OFERTA_LABELS: Record<string, string> = {
  partilha_protegida: "Partilha protegida (família)",
  inventario_otimizado: "Inventário otimizado",
  cobertura_garantida: "Cobertura garantida (saúde)",
};

const FLAG_LABELS: Record<string, string> = {
  PRIORIDADE_MAX: "Prioridade máxima",
  DESQ_PENSAO_GUARDA: "Desqualificado: só pensão/guarda",
  DESQ_PLANO_POPULAR: "Desqualificado: plano popular",
  CONTINUIDADE_PREVENTIVO: "Continuidade / preventivo",
  FORM_MQL: "MQL pelo form",
  FORM_CONECTADO: "Conectado pelo form",
};

const HIDDEN_KEYS = new Set([
  "nome",
  "whatsapp",
  "email",
  "contato",
  "nome_whatsapp",
  "source",
  "slug",
  "oferta",
  "page_url",
  "values_raw",
  "utm",
  "form",
  "utm_source",
  "utm_medium",
  "utm_campaign",
]);

function formatOneValue(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (typeof raw === "boolean") return raw ? "Sim" : "Não";
  if (Array.isArray(raw)) {
    return raw.map((v) => formatOneValue(v)).filter(Boolean).join(", ");
  }
  const s = String(raw);
  return VALUE_LABELS[s] ?? s.replace(/_/g, " ");
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** Extrai respostas do form a partir de sdr_contexto e/ou dados_capturados. */
export function extractFormRespostas(opts: {
  sdrContexto?: unknown;
  dadosCapturados?: unknown;
}): FormRespostaItem[] {
  const ctx =
    opts.sdrContexto && typeof opts.sdrContexto === "object"
      ? (opts.sdrContexto as Record<string, unknown>)
      : {};
  const cap =
    opts.dadosCapturados && typeof opts.dadosCapturados === "object"
      ? (opts.dadosCapturados as Record<string, unknown>)
      : {};

  const respostas =
    ctx.respostas && typeof ctx.respostas === "object"
      ? (ctx.respostas as Record<string, unknown>)
      : {};

  // Preferir sdr_contexto.respostas; fallback campos canônicos em dados_capturados
  const source: Record<string, unknown> =
    Object.keys(respostas).length > 0
      ? respostas
      : Object.fromEntries(
          Object.entries(cap).filter(
            ([k, v]) =>
              !HIDDEN_KEYS.has(k) &&
              !k.startsWith("form_") &&
              !k.startsWith("utm") &&
              v !== null &&
              typeof v !== "object",
          ),
        );

  const items: FormRespostaItem[] = [];
  for (const [key, value] of Object.entries(source)) {
    if (HIDDEN_KEYS.has(key)) continue;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) continue;
    items.push({
      key,
      label: fieldLabel(key),
      value: formatOneValue(value),
    });
  }

  const horario = ctx.melhor_horario ?? cap.melhor_horario;
  if (horario && !items.some((i) => i.key === "melhor_horario")) {
    items.push({
      key: "melhor_horario",
      label: fieldLabel("melhor_horario"),
      value: formatOneValue(horario),
    });
  }

  return items;
}

export function ofertaLabel(oferta: string | null | undefined): string | null {
  if (!oferta) return null;
  return OFERTA_LABELS[oferta] ?? oferta.replace(/_/g, " ");
}

export function flagLabels(flags: string[] | null | undefined): string[] {
  if (!flags?.length) return [];
  return flags.map((f) => FLAG_LABELS[f] ?? f.replace(/_/g, " "));
}

/** Uma linha curta pra chip no kanban (ex.: "Partilha de bens · R$ 30–60k"). */
export function formInsightChip(opts: {
  sdrContexto?: unknown;
  dadosCapturados?: unknown;
  formFlags?: string[] | null;
}): string | null {
  const items = extractFormRespostas(opts);
  if (items.length === 0) return null;
  const prefer = ["resolver", "situacao", "tipo_cobertura", "fase", "urgencia", "renda"];
  const picked: string[] = [];
  for (const key of prefer) {
    const hit = items.find((i) => i.key === key);
    if (hit) picked.push(hit.value);
    if (picked.length >= 2) break;
  }
  if (picked.length === 0) {
    picked.push(...items.slice(0, 2).map((i) => i.value));
  }
  return picked.join(" · ");
}
