/**
 * Mapeamento status_sdr → CRM (estagio legado + stage kanban)
 * e regra de preservação de stage avançado no espelho.
 * Puro (sem Deno) — testável via vitest.
 */

export type CrmStatusEstagio = { status: string; estagio: string };

/** Stages comerciais avançados: não sobrescrever no remirror do bot/LP. */
export const ADVANCED_CRM_STAGES = new Set([
  "sal",
  "reuniao_agendada",
  "reuniao_realizada",
  "proposta",
  "contrato",
  "ganho",
  "continuidade",
]);

/** Status bot que devem atualizar o kanban mesmo com stage avançado. */
export const TERMINAL_BOT_STATUSES = new Set([
  "mql_frio",
  "desqualificado",
  "perdido",
  "perdido_recuperacao",
  "cliente",
]);

export function mapStatusSdrToCrm(s: string | null | undefined): CrmStatusEstagio {
  // estagio CHECK: novo | contato_inicial | em_analise | proposta_enviada | fechado | perdido
  switch (s) {
    case "perdido":
    case "mql_frio":
    case "perdido_recuperacao":
      return { status: "fechado", estagio: "perdido" };
    case "desqualificado":
      // legado estagio não tem "desqualificado"; stage kanban é separado
      return { status: "fechado", estagio: "perdido" };
    case "cliente":
      return { status: "fechado", estagio: "fechado" };
    case "sql_aguardando_humano":
      return { status: "qualificado", estagio: "em_analise" };
    case "assumido_humano":
      return { status: "em_andamento", estagio: "contato_inicial" };
    case "em_atendimento_bot":
      return { status: "em_andamento", estagio: "novo" };
    default:
      return { status: "novo", estagio: "novo" };
  }
}

/** Kanban usa `stage` (enum) com prioridade sobre `estagio` legado. */
export function mapEstagioToStage(estagio: string): string {
  switch (estagio) {
    case "perdido":
      return "perdido";
    case "fechado":
      return "ganho";
    case "proposta_enviada":
      return "proposta";
    case "em_analise":
      return "sal";
    case "contato_inicial":
      return "conectado";
    case "novo":
    default:
      return "mql";
  }
}

/** Stage kanban final a partir do status_sdr (corrige mql_frio/desqualificado). */
export function stageFromStatusSdr(
  statusSdr: string | null | undefined,
  estagio: string,
): string {
  if (statusSdr === "desqualificado") return "desqualificado";
  if (
    statusSdr === "mql_frio" ||
    statusSdr === "perdido" ||
    statusSdr === "perdido_recuperacao"
  ) {
    return "perdido";
  }
  if (statusSdr === "cliente") return "ganho";
  return mapEstagioToStage(estagio);
}

/**
 * Se true, o remirror NÃO deve sobrescrever stage/estagio/status do CRM.
 * Permite terminal (frio/desqualificado/perdido) e criação/reabertura.
 */
export function shouldPreserveCrmStage(
  prevStage: string | null | undefined,
  botStatus: string | null | undefined,
): boolean {
  const stage = (prevStage ?? "").toLowerCase();
  const status = (botStatus ?? "").toLowerCase();
  if (!stage) return false;
  if (TERMINAL_BOT_STATUSES.has(status)) return false;
  // Reabertura explícita (status novo após perdido) é tratada fora;
  // aqui só preserva avanço comercial.
  return ADVANCED_CRM_STAGES.has(stage);
}
