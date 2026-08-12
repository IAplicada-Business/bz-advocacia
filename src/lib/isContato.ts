import type { Lead } from "@/types/leads";

/**
 * Contato = lead que ainda não virou cliente.
 *
 * NÃO use `status_cliente === "ativo"` sozinho: a coluna em
 * contact_submissions tem DEFAULT 'ativo' desde a migration
 * 20260127090344 — quase todo lead novo nasce com esse valor
 * sem ser cliente. Isso zerava a página Contatos.
 */
export function isContato(lead: Lead): boolean {
  if (lead.como_conheceu === "importacao") return false;
  if (lead.tipo_contato && lead.tipo_contato !== "lead") return false;

  const stage = (lead.stage ?? "").toLowerCase();
  const estagio = (lead.estagio ?? "").toLowerCase();
  const statusSdr = (lead.status_sdr ?? "").toLowerCase();
  const status = (lead.status ?? "").toLowerCase();

  if (stage === "ganho") return false;
  if (statusSdr === "cliente") return false;

  // Legado: convertido com estagio fechado (sem stage ganho backfilled)
  if (estagio === "fechado" && (status === "convertido" || lead.contrato_assinado)) {
    return false;
  }

  return true;
}
