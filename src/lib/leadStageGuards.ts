import type { LeadStage } from "@/lib/leadStages";

/** Campos mínimos usados pelos guards (subset do Lead / row). */
export type LeadGuardRow = {
  primeiro_contato_em?: string | null;
  valor_estimado?: number | null;
  area_juridica?: string | null;
  reuniao_data?: string | null;
  reuniao_notas?: string | null;
  advogada_responsavel_id?: string | null;
  proposta_id?: string | null;
  contrato_id?: string | null;
  valor_fechamento?: number | null;
  contrato_assinado?: boolean | null;
};

export type StageGuard = {
  field: string;
  label: string;
  check: (lead: LeadGuardRow) => boolean;
};

export const STAGE_GUARDS: Record<LeadStage, StageGuard[]> = {
  mql: [],
  conectado: [
    {
      field: "primeiro_contato_em",
      label: "Marcar data do primeiro contato",
      check: (l) => !!l.primeiro_contato_em,
    },
  ],
  sal: [
    {
      field: "valor_estimado",
      label: "Preencher valor estimado do contrato",
      check: (l) => (l.valor_estimado ?? 0) > 0,
    },
    {
      field: "area_juridica",
      label: "Definir área jurídica (Família/Inventário/Saúde)",
      check: (l) => !!l.area_juridica,
    },
  ],
  reuniao_agendada: [
    {
      field: "reuniao_data",
      label: "Preencher data da reunião",
      check: (l) => !!l.reuniao_data,
    },
    {
      field: "advogada_responsavel",
      label: "Atribuir advogada responsável",
      check: (l) => !!l.advogada_responsavel_id,
    },
  ],
  reuniao_realizada: [
    {
      field: "reuniao_notas",
      label: "Registrar notas da reunião",
      check: (l) => !!l.reuniao_notas,
    },
  ],
  proposta: [
    {
      field: "proposta_id",
      label: "Gerar proposta no módulo Documentos",
      check: (l) => !!l.proposta_id,
    },
  ],
  contrato: [
    {
      field: "contrato_id",
      label: "Gerar contrato no módulo Documentos",
      check: (l) => !!l.contrato_id,
    },
  ],
  ganho: [
    {
      field: "valor_fechamento",
      label: "Preencher valor fechado",
      check: (l) => (l.valor_fechamento ?? 0) > 0,
    },
    {
      field: "contrato_assinado",
      label: "Marcar contrato como assinado",
      check: (l) => l.contrato_assinado === true,
    },
  ],
  perdido: [],
};

export function checkStageGuards(lead: LeadGuardRow, targetStage: LeadStage): StageGuard[] {
  const guards = STAGE_GUARDS[targetStage] ?? [];
  return guards.filter((g) => !g.check(lead));
}
