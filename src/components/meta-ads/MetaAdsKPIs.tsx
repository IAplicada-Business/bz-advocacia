import { DollarSign, Users, Target, MousePointerClick, Eye, BarChart3 } from "lucide-react";
import { MetaKPIs } from "@/types/meta-ads";
import { MetricCard } from "@/components/ui/metric-card";

interface MetaAdsKPIsProps {
  kpis: MetaKPIs;
  isLoading?: boolean;
}

export function MetaAdsKPIs({ kpis, isLoading }: MetaAdsKPIsProps) {
  const roi = kpis.gasto > 0 ? ((((kpis.leads || 0) * (kpis.custoLead || 0)) - kpis.gasto) / kpis.gasto * 100) : 0;

  const cards = [
    {
      title: "Investimento",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(kpis.gasto),
      variacao: kpis.gastoVariacao,
      icon: DollarSign,
    },
    {
      title: "Leads",
      value: kpis.leads.toString(),
      variacao: kpis.leadsVariacao,
      icon: Users,
    },
    {
      title: "Custo/Lead",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(kpis.custoLead),
      variacao: kpis.custoLeadVariacao,
      icon: Target,
    },
    {
      title: "Cliques",
      value: kpis.cliques.toLocaleString("pt-BR"),
      variacao: kpis.cliquesVariacao,
      icon: MousePointerClick,
    },
    {
      title: "CTR",
      value: `${kpis.ctr.toFixed(2)}%`,
      variacao: kpis.ctrVariacao,
      icon: Eye,
    },
    {
      title: "ROI Estimado",
      value: `${roi.toFixed(1)}%`,
      variacao: 0,
      icon: BarChart3,
      accent: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {cards.map((card) => (
        <MetricCard
          key={card.title}
          label={card.title}
          value={card.value}
          icon={card.icon}
          trend={card.variacao !== 0 ? card.variacao : undefined}
          trendLabel="vs ant."
          loading={isLoading}
          accent={card.accent}
        />
      ))}
    </div>
  );
}
