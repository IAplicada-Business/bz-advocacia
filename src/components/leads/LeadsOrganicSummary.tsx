import { useMemo } from "react";
import { Users, CalendarDays, XCircle, Send, CheckCircle2 } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Lead } from "@/types/leads";

interface Props {
  leads: Lead[] | undefined;
  loading: boolean;
}

export function LeadsOrganicSummary({ leads, loading }: Props) {
  const summary = useMemo(() => {
    if (!leads) return { total: 0, novos: 0, enviados: 0, qualificados: 0, perdidos: 0 };
    return {
      total: leads.length,
      novos: leads.filter((l) => (l.estagio || "").toLowerCase() === "novo").length,
      enviados: leads.filter((l) => (l.estagio || "").toLowerCase() === "contato_inicial").length,
      qualificados: leads.filter((l) => {
        const e = (l.estagio || "").toLowerCase();
        return e === "em_analise" || e === "proposta_enviada";
      }).length,
      perdidos: leads.filter((l) => (l.estagio || "").toLowerCase() === "perdido").length,
    };
  }, [leads]);

  const cards = [
    { key: "total" as const, label: "Total de Leads", icon: Users },
    { key: "novos" as const, label: "Novos", icon: CalendarDays },
    { key: "enviados" as const, label: "Enviados", icon: Send },
    { key: "qualificados" as const, label: "Qualificados", icon: CheckCircle2 },
    { key: "perdidos" as const, label: "Perdidos", icon: XCircle },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <MetricCard
          key={c.key}
          label={c.label}
          value={summary[c.key]}
          icon={c.icon}
          loading={loading}
        />
      ))}
    </div>
  );
}
