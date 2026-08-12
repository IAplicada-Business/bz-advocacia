import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";

export type MetaAdPerformanceRow = {
  ad_id: string;
  ad_nome: string;
  campanha_id: string | null;
  campanha_nome: string | null;
  gasto: number;
  impressoes: number;
  cliques: number;
  /** Leads atribuídos no CRM (ad_id) no período */
  leads_crm: number;
  /** No funil comercial (MQL+) */
  mql: number;
  /** SAL ou além */
  avancado: number;
  /** Ganho / cliente */
  ganho: number;
  cpl: number;
  custo_mql: number;
  cpa_ganho: number;
  taxa_mql: number;
  taxa_ganho: number;
};

/**
 * Cruza gasto Meta (meta_insights_daily level=ad) com funil CRM
 * (v_meta_ad_crm_funnel) — custo → MQL → fechamento.
 */
export function useMetaAdPerformance(periodo: PeriodoFiltro = "90d") {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const dataInicio = subDays(new Date(), dias);
  const dataInicioStr = format(dataInicio, "yyyy-MM-dd");
  const dataInicioISO = dataInicio.toISOString();

  const query = useQuery({
    queryKey: ["meta-ad-performance", periodo],
    queryFn: async (): Promise<MetaAdPerformanceRow[]> => {
      const [{ data: ads }, { data: campaigns }, { data: insights }, funnelRes] =
        await Promise.all([
          supabase.from("meta_ads").select("id, name, campaign_id"),
          supabase.from("meta_campaigns").select("id, name"),
          supabase
            .from("meta_insights_daily")
            .select("object_id, spend, impressions, clicks")
            .eq("level", "ad")
            .gte("date", dataInicioStr),
          (supabase as any)
            .from("v_meta_ad_crm_funnel")
            .select("ad_id, ad_name, campaign_id, campaign_name, is_mql, avancado, converted, lead_at")
            .gte("lead_at", dataInicioISO),
        ]);

      // Fallback se a view ainda não existir no projeto
      let funnel = (funnelRes.data ?? []) as Array<{
        ad_id: string | null;
        ad_name: string | null;
        campaign_id: string | null;
        campaign_name: string | null;
        is_mql: boolean;
        avancado: boolean;
        converted: boolean;
        lead_at: string;
      }>;

      if (funnelRes.error) {
        const { data: leads } = await supabase
          .from("leads_geral")
          .select("id, ad_id, ad_name, campaign_id, campaign_name, stage, status_sdr, created_time")
          .not("ad_id", "is", null)
          .gte("created_time", dataInicioISO);
        funnel = (leads ?? []).map((l: any) => {
          const stage = (l.stage ?? "").toLowerCase();
          const sdr = (l.status_sdr ?? "").toLowerCase();
          const is_mql =
            ["mql", "conectado", "sal", "reuniao_agendada", "reuniao_realizada", "proposta", "contrato", "ganho"].includes(stage) ||
            ["sql_aguardando_humano", "assumido_humano", "agendado", "cliente"].includes(sdr);
          const avancado = ["sal", "reuniao_agendada", "reuniao_realizada", "proposta", "contrato", "ganho"].includes(stage);
          const converted = stage === "ganho" || sdr === "cliente";
          return {
            ad_id: l.ad_id,
            ad_name: l.ad_name,
            campaign_id: l.campaign_id,
            campaign_name: l.campaign_name,
            is_mql,
            avancado,
            converted,
            lead_at: l.created_time,
          };
        });
      }

      const campMap = new Map<string, string>(
        (campaigns ?? []).map((c: any) => [c.id, c.name ?? c.id]),
      );
      const adMap = new Map<string, { nome: string; campanha_id: string | null }>(
        (ads ?? []).map((a: any) => [
          a.id,
          { nome: a.name ?? a.id, campanha_id: a.campaign_id ?? null },
        ]),
      );

      type Spend = { gasto: number; impressoes: number; cliques: number };
      const spendByAd = new Map<string, Spend>();
      for (const i of (insights ?? []) as any[]) {
        const cur = spendByAd.get(i.object_id) ?? { gasto: 0, impressoes: 0, cliques: 0 };
        cur.gasto += Number(i.spend ?? 0);
        cur.impressoes += Number(i.impressions ?? 0);
        cur.cliques += Number(i.clicks ?? 0);
        spendByAd.set(i.object_id, cur);
      }

      type Crm = {
        leads: number;
        mql: number;
        avancado: number;
        ganho: number;
        ad_name: string | null;
        campaign_id: string | null;
        campaign_name: string | null;
      };
      const crmByAd = new Map<string, Crm>();
      for (const f of funnel) {
        if (!f.ad_id) continue;
        const cur = crmByAd.get(f.ad_id) ?? {
          leads: 0,
          mql: 0,
          avancado: 0,
          ganho: 0,
          ad_name: f.ad_name,
          campaign_id: f.campaign_id,
          campaign_name: f.campaign_name,
        };
        cur.leads += 1;
        if (f.is_mql) cur.mql += 1;
        if (f.avancado) cur.avancado += 1;
        if (f.converted) cur.ganho += 1;
        crmByAd.set(f.ad_id, cur);
      }

      const ids = new Set<string>([...spendByAd.keys(), ...crmByAd.keys()]);
      const rows: MetaAdPerformanceRow[] = [];

      for (const id of ids) {
        const spend = spendByAd.get(id) ?? { gasto: 0, impressoes: 0, cliques: 0 };
        const crm = crmByAd.get(id) ?? {
          leads: 0,
          mql: 0,
          avancado: 0,
          ganho: 0,
          ad_name: null,
          campaign_id: null,
          campaign_name: null,
        };
        const meta = adMap.get(id);
        const campanha_id = meta?.campanha_id ?? crm.campaign_id;
        rows.push({
          ad_id: id,
          ad_nome: meta?.nome ?? crm.ad_name ?? id,
          campanha_id,
          campanha_nome:
            (campanha_id ? campMap.get(campanha_id) : null) ??
            crm.campaign_name ??
            null,
          gasto: spend.gasto,
          impressoes: spend.impressoes,
          cliques: spend.cliques,
          leads_crm: crm.leads,
          mql: crm.mql,
          avancado: crm.avancado,
          ganho: crm.ganho,
          cpl: crm.leads > 0 ? spend.gasto / crm.leads : 0,
          custo_mql: crm.mql > 0 ? spend.gasto / crm.mql : 0,
          cpa_ganho: crm.ganho > 0 ? spend.gasto / crm.ganho : 0,
          taxa_mql: crm.leads > 0 ? (crm.mql / crm.leads) * 100 : 0,
          taxa_ganho: crm.leads > 0 ? (crm.ganho / crm.leads) * 100 : 0,
        });
      }

      rows.sort((a, b) => b.gasto - a.gasto || b.leads_crm - a.leads_crm);
      return rows;
    },
    refetchInterval: 60_000,
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
