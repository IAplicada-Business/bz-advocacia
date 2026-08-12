import type { Lead } from "@/types/leads";

/**
 * Contato = lead no funil que **ainda não é cliente**.
 *
 * Separação com a página Clientes (`vw_clientes_ativos`):
 * - Cliente → `stage = ganho` (e/ou `estagio = fechado` legado)
 * - Contato → qualquer outro estágio do funil (MQL…contrato, perdido, desqualificado)
 *
 * NÃO use `status_cliente === "ativo"` sozinho: a coluna tem DEFAULT `'ativo'`
 * em quase todo `contact_submissions` — isso zerava Contatos sem a pessoa
 * ser cliente de verdade.
 */
export function isContato(lead: Lead): boolean {
  if (lead.como_conheceu === "importacao") return false;
  if (lead.tipo_contato && lead.tipo_contato !== "lead") return false;

  const stage = (lead.stage ?? "").toLowerCase();
  const estagio = (lead.estagio ?? "").toLowerCase();
  const statusSdr = (lead.status_sdr ?? "").toLowerCase();

  // Mesma fronteira da página Clientes — não misturar
  if (stage === "ganho") return false;
  if (estagio === "fechado") return false;
  if (statusSdr === "cliente") return false;

  return true;
}
