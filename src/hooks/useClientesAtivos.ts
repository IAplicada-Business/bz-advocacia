import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/types/leads";

/**
 * Clientes ativos via vw_clientes_ativos, com hydrate de contact_submissions
 * para manter compatibilidade com ClientesTable / LeadDetailsDialog.
 */
export function useClientesAtivos(search?: string) {
  return useQuery({
    queryKey: ["clientes-ativos", search],
    queryFn: async () => {
      const { data: viewRows, error: viewError } = await supabase
        .from("vw_clientes_ativos")
        .select("*");

      if (viewError) {
        // Fallback: ganhos/fechados na tabela crua
        let fb = supabase
          .from("contact_submissions")
          .select("*")
          .or("stage.eq.ganho,estagio.eq.fechado")
          .order("data_ultima_atividade", { ascending: false });
        if (search?.trim()) {
          fb = fb.or(
            `nome_completo.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`,
          );
        }
        const res = await fb;
        if (res.error) throw res.error;
        return (res.data || []).map((row) => ({
          ...row,
          origem_descricao: row.outro_como_conheceu || null,
          stage: (row as any).stage ?? "ganho",
          estagio: (row.estagio as Lead["estagio"]) ?? "fechado",
        })) as unknown as Lead[];
      }

      const ids = (viewRows || [])
        .map((r) => r.lead_id)
        .filter((id): id is string => !!id);

      if (ids.length === 0) return [] as Lead[];

      let q = supabase.from("contact_submissions").select("*").in("id", ids);
      if (search?.trim()) {
        q = q.or(
          `nome_completo.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((row) => ({
        ...row,
        origem_descricao: row.outro_como_conheceu || null,
        stage: (row as any).stage ?? "ganho",
        estagio: (row.estagio as Lead["estagio"]) ?? "fechado",
      })) as unknown as Lead[];
    },
  });
}
