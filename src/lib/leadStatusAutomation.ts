import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

/**
 * Atualiza o estágio do lead para 'proposta' se estiver em um estágio anterior,
 * e registra a atividade no histórico.
 */
export async function atualizarLeadParaPropostaEnviada(
  clienteId: string,
  tipoDocumento: "proposta" | "contrato",
  queryClient: QueryClient,
) {
  try {
    const { data: lead, error: fetchError } = await supabase
      .from("contact_submissions")
      .select("estagio")
      .eq("id", clienteId)
      .single();

    if (fetchError || !lead) return;

    const stage = (lead as unknown as { stage?: string | null }).stage;
    const estagio = lead.estagio;
    const jaAvancado =
      stage === "proposta" ||
      stage === "contrato" ||
      stage === "ganho" ||
      stage === "perdido" ||
      estagio === "proposta_enviada" ||
      estagio === "fechado" ||
      estagio === "perdido";
    if (jaAvancado) return;

    const nextStage = tipoDocumento === "contrato" ? "contrato" : "proposta";

    await supabase
      .from("contact_submissions")
      .update({
        stage: nextStage,
        estagio: "proposta_enviada",
        data_ultima_atividade: new Date().toISOString(),
        ...(tipoDocumento === "proposta" ? { proposta_id: undefined } : {}),
      } as never)
      .eq("id", clienteId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("atividades").insert({
      tipo: "proposta_enviada",
      descricao:
        tipoDocumento === "proposta"
          ? "Proposta gerada automaticamente pelo sistema"
          : "Contrato gerado automaticamente pelo sistema",
      entidade_tipo: "lead",
      entidade_id: clienteId,
      usuario_id: user?.id || null,
    });

    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["leads-simple"] });
    queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
  } catch (error) {
    console.error("Erro ao atualizar status do lead:", error);
  }
}

/**
 * Atualiza o lead para stage 'ganho' ao emitir contrato assinado.
 */
export async function atualizarLeadParaFechado(
  clienteId: string,
  queryClient: QueryClient,
) {
  try {
    const { data: lead, error: fetchError } = await supabase
      .from("contact_submissions")
      .select("estagio")
      .eq("id", clienteId)
      .single();

    if (fetchError || !lead) return;

    const stage = (lead as unknown as { stage?: string | null }).stage;
    if (
      stage === "perdido" ||
      stage === "ganho" ||
      lead.estagio === "perdido" ||
      lead.estagio === "fechado"
    ) {
      return;
    }

    await supabase
      .from("contact_submissions")
      .update({
        stage: "ganho",
        estagio: "fechado",
        status_cliente: "ativo",
        contrato_assinado: true,
        data_ultima_atividade: new Date().toISOString(),
      } as never)
      .eq("id", clienteId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("atividades").insert({
      tipo: "lead_convertido",
      descricao: "Contrato emitido - lead convertido em cliente",
      entidade_tipo: "lead",
      entidade_id: clienteId,
      usuario_id: user?.id || null,
    });

    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["leads-simple"] });
    queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
    queryClient.invalidateQueries({ queryKey: ["clientes-ativos"] });
  } catch (error) {
    console.error("Erro ao atualizar lead para fechado:", error);
  }
}
