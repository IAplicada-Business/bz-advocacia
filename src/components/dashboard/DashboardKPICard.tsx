import { MetricCard } from "@/components/ui/metric-card";

interface DashboardKPICardProps {
  title: string;
  value: number;
  barColor: string; // mantido por compatibilidade (não usado no layout unificado)
  subtitle?: string;
  loading?: boolean;
}

export function DashboardKPICard({ title, value, subtitle, loading }: DashboardKPICardProps) {
  return (
    <MetricCard
      label={title}
      value={value}
      sub={subtitle}
      loading={loading}
    />
  );
}
