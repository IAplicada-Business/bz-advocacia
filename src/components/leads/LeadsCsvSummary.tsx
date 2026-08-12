import { Users, CalendarDays, CheckCircle2, PlusCircle, AlertCircle } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { CsvSummary } from "@/hooks/useLeadsCsv";

interface Props {
  summary: CsvSummary | undefined;
  loading: boolean;
}

const cards = [
  { key: "total" as const, label: "Total de Leads", icon: Users },
  { key: "hoje" as const, label: "Leads do Dia", icon: CalendarDays },
  { key: "enviados" as const, label: "Enviados", icon: CheckCircle2 },
  { key: "created" as const, label: "Novos (Created)", icon: PlusCircle },
  { key: "semStatus" as const, label: "Sem Status", icon: AlertCircle },
];

export function LeadsCsvSummary({ summary, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <MetricCard
          key={c.key}
          label={c.label}
          value={summary?.[c.key] ?? 0}
          icon={c.icon}
          loading={loading}
        />
      ))}
    </div>
  );
}
