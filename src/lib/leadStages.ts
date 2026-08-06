export const LEAD_STAGES = [
  { key: "mql", label: "MQL", order: 1, sla_days: 1 },
  { key: "conectado", label: "Conectado", order: 2, sla_days: 3 },
  { key: "sal", label: "SAL", order: 3, sla_days: 5 },
  { key: "reuniao_agendada", label: "Reunião Agendada", order: 4, sla_days: 2 },
  { key: "reuniao_realizada", label: "Reunião Realizada", order: 5, sla_days: 3 },
  { key: "proposta", label: "Proposta", order: 6, sla_days: 7 },
  { key: "contrato", label: "Contrato", order: 7, sla_days: 5 },
  { key: "ganho", label: "Ganho", order: 8, sla_days: null },
] as const;

/** Estágio operacional fora do funil comercial (perda). */
export const LEAD_STAGE_PERDIDO = {
  key: "perdido",
  label: "Perdido",
  order: 99,
  sla_days: null,
} as const;

/** Lead fora do ICP / escopo (ex.: pensão/guarda only, ticket mínimo). */
export const LEAD_STAGE_DESQUALIFICADO = {
  key: "desqualificado",
  label: "Desqualificado",
  order: 100,
  sla_days: null,
} as const;

export type LeadStage =
  | (typeof LEAD_STAGES)[number]["key"]
  | typeof LEAD_STAGE_PERDIDO.key
  | typeof LEAD_STAGE_DESQUALIFICADO.key;

export const ALL_LEAD_STAGES = [
  ...LEAD_STAGES,
  LEAD_STAGE_PERDIDO,
  LEAD_STAGE_DESQUALIFICADO,
] as const;

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  mql: "MQL",
  conectado: "Conectado",
  sal: "SAL",
  reuniao_agendada: "Reunião Agendada",
  reuniao_realizada: "Reunião Realizada",
  proposta: "Proposta",
  contrato: "Contrato",
  ganho: "Ganho",
  perdido: "Perdido",
  desqualificado: "Desqualificado",
};

/** Cores da borda superior das colunas do kanban. */
export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  mql: "border-t-blue-500",
  conectado: "border-t-sky-500",
  sal: "border-t-purple-500",
  reuniao_agendada: "border-t-violet-500",
  reuniao_realizada: "border-t-fuchsia-500",
  proposta: "border-t-amber-500",
  contrato: "border-t-orange-500",
  ganho: "border-t-emerald-500",
  perdido: "border-t-red-500",
  desqualificado: "border-t-slate-400",
};

/** Mapeia stage novo → estagio legado (contact_submissions) para rollback. */
export function stageToLegacyEstagio(stage: LeadStage): string {
  switch (stage) {
    case "mql":
      return "novo";
    case "conectado":
      return "contato_inicial";
    case "sal":
    case "reuniao_agendada":
    case "reuniao_realizada":
      return "em_analise";
    case "proposta":
    case "contrato":
      return "proposta_enviada";
    case "ganho":
      return "fechado";
    case "perdido":
      return "perdido";
    case "desqualificado":
      return "perdido";
    default:
      return "novo";
  }
}

/** Mapeia stage novo → status_sdr legado (leads_geral) quando faz sentido. */
export function stageToLegacyStatusSdr(stage: LeadStage): string | null {
  switch (stage) {
    case "mql":
      return "novo";
    case "conectado":
      return "em_atendimento_bot";
    case "sal":
      return "sql_aguardando_humano";
    case "reuniao_agendada":
      return "agendado";
    case "ganho":
      return "cliente";
    case "perdido":
    case "desqualificado":
      return "perdido";
    default:
      return null;
  }
}

/** Infere stage a partir de campos legados (antes do backfill / fallback). */
export function inferStageFromLegacy(lead: {
  stage?: string | null;
  estagio?: string | null;
  status_sdr?: string | null;
}): LeadStage {
  if (lead.stage && lead.stage in LEAD_STAGE_LABELS) {
    return lead.stage as LeadStage;
  }

  const s = lead.status_sdr;
  if (s === "cliente") return "ganho";
  if (s === "perdido" || s === "mql_frio" || s === "perdido_recuperacao") {
    // desqualificado tem stage próprio; status_sdr pode continuar 'perdido'
    if (lead.stage === "desqualificado") return "desqualificado";
    return "perdido";
  }
  if (s === "agendado") return "reuniao_agendada";
  if (
    s === "qualificacao_iniciada" ||
    s === "aguardando_triagem" ||
    s === "sql_aguardando_humano" ||
    s === "assumido_humano"
  ) {
    return "sal";
  }
  if (s === "em_atendimento_bot") return "conectado";
  if (s === "novo") return "mql";

  switch (lead.estagio) {
    case "fechado":
      return "ganho";
    case "proposta_enviada":
      return "proposta";
    case "perdido":
      return "perdido";
    case "em_analise":
      return "sal";
    case "contato_inicial":
      return "conectado";
    case "novo":
    default:
      return "mql";
  }
}

export function getStageSlaDays(stage: LeadStage): number | null {
  const found = ALL_LEAD_STAGES.find((s) => s.key === stage);
  return found?.sla_days ?? null;
}

export function daysInStage(stageEnteredAt: string | null | undefined): number {
  if (!stageEnteredAt) return 0;
  const diff = Date.now() - new Date(stageEnteredAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function isOverSla(
  stage: LeadStage,
  stageEnteredAt: string | null | undefined,
): boolean {
  const sla = getStageSlaDays(stage);
  if (sla == null) return false;
  return daysInStage(stageEnteredAt) > sla;
}
