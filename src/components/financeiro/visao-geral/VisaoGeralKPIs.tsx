import { useVisaoGeralKPIs, useInadimplencia } from "@/hooks/useVisaoGeralFinanceiro";
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

interface Props {
  ano: number | null;
  mes?: number | null;
}

export function VisaoGeralKPIs({ ano, mes = null }: Props) {
  const { data: kpis, isLoading } = useVisaoGeralKPIs(ano, mes);
  const { data: inadimplencia, isLoading: loadingInad } = useInadimplencia();
  const loading = isLoading || loadingInad;

  const items = [
    {
      label: "Receitas no Período",
      value: formatCurrency(kpis?.receitas || 0),
      sub: `${kpis?.receitasCount || 0} recebimentos`,
      icon: TrendingUp,
      valueClassName: "text-primary",
    },
    {
      label: "Despesas PJ",
      value: formatCurrency(kpis?.despesasPJ || 0),
      sub: "Custos operacionais",
      icon: TrendingDown,
      valueClassName: "text-destructive",
    },
    {
      label: "Resultado Líquido",
      value: formatCurrency(kpis?.resultado || 0),
      sub: (kpis?.resultado || 0) >= 0 ? "Positivo" : "Negativo",
      icon: DollarSign,
      valueClassName: (kpis?.resultado || 0) >= 0 ? "text-primary" : "text-destructive",
    },
    {
      label: "Inadimplência",
      value: formatCurrency(inadimplencia?.total || 0),
      sub: `${inadimplencia?.count || 0} parcelas atrasadas`,
      icon: AlertTriangle,
      valueClassName: "text-[hsl(var(--chart-5))]",
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(kpis?.ticketMedio || 0),
      sub: "Por recebimento",
      icon: BarChart3,
      valueClassName: "text-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {items.map((item) => (
        <MetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          sub={item.sub}
          icon={item.icon}
          valueClassName={item.valueClassName}
          loading={loading}
        />
      ))}
    </div>
  );
}
