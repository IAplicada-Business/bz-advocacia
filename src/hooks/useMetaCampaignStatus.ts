import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetaCampaignStatus {
  total: number;
  ativas: number;
  /** Motivo real de não haver dados no período filtrado. */
  mensagem: string;
}

/**
 * Conta campanhas cadastradas x ativas em meta_campaigns pra explicar
 * ausência de dados em meta_insights_daily (sem dado != sync quebrado).
 */
export function useMetaCampaignStatus() {
  return useQuery({
    queryKey: ["meta-campaign-status"],
    queryFn: async (): Promise<MetaCampaignStatus> => {
      const [totalRes, ativasRes] = await Promise.all([
        supabase.from("meta_campaigns").select("*", { count: "exact", head: true }),
        supabase
          .from("meta_campaigns")
          .select("*", { count: "exact", head: true })
          .eq("status", "ACTIVE"),
      ]);
      if (totalRes.error) throw totalRes.error;
      if (ativasRes.error) throw ativasRes.error;

      const total = totalRes.count ?? 0;
      const ativas = ativasRes.count ?? 0;

      const mensagem =
        total === 0
          ? "Nenhuma campanha sincronizada ainda — clique em \"Sincronizar\" para buscar a estrutura do Meta Ads."
          : ativas === 0
            ? `${total} campanhas cadastradas · 0 ativas — nenhuma campanha rodando no período. Ative uma campanha no Gerenciador de Anúncios pra começar a ver dados aqui.`
            : `${ativas} de ${total} campanhas ativas — sync ainda populando insights.`;

      return { total, ativas, mensagem };
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
