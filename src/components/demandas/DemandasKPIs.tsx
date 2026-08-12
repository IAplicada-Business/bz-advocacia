import { ClipboardList, AlertTriangle, Clock, Layers } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { CATEGORIA_LABELS } from "@/types/demandas";

interface DemandasKPIsProps {
  stats: {
    total: number;
    atrasadas: number;
    urgentes: number;
    topCategoria: { nome: string; count: number } | null;
  } | undefined;
  loading: boolean;
}

export const DemandasKPIs = ({ stats, loading }: DemandasKPIsProps) => {
  const kpis = [
    {
      titulo: "Total de Demandas",
      valor: stats?.total || 0,
      icon: ClipboardList,
    },
    {
      titulo: "Atrasadas",
      valor: stats?.atrasadas || 0,
      icon: AlertTriangle,
      valueClassName: "text-destructive",
    },
    {
      titulo: "Urgentes",
      valor: stats?.urgentes || 0,
      icon: Clock,
      valueClassName: "text-[hsl(var(--chart-5))]",
    },
    {
      titulo: "Categoria Principal",
      valor: stats?.topCategoria
        ? CATEGORIA_LABELS[stats.topCategoria.nome as keyof typeof CATEGORIA_LABELS] || stats.topCategoria.nome
        : "-",
      subtitulo: stats?.topCategoria ? `${stats.topCategoria.count} demandas` : undefined,
      icon: Layers,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {kpis.map((kpi) => (
        <MetricCard
          key={kpi.titulo}
          label={kpi.titulo}
          value={kpi.valor}
          sub={kpi.subtitulo}
          icon={kpi.icon}
          valueClassName={kpi.valueClassName}
          loading={loading}
        />
      ))}
    </div>
  );
};
