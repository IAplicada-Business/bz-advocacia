import { LucideIcon } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  format?: "number" | "currency" | "percentage";
  loading?: boolean;
}

export function KPICard({ title, value, icon, trend, format = "number", loading }: KPICardProps) {
  const formatValue = () => {
    if (format === "currency") {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(value));
    }
    if (format === "percentage") {
      return `${value}%`;
    }
    return value;
  };

  return (
    <MetricCard
      label={title}
      value={formatValue()}
      icon={icon}
      trend={trend}
      loading={loading}
    />
  );
}
