import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";
import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { Eye, MousePointerClick, Users, Repeat, Activity, Target } from "lucide-react";
import { MiniCard } from "./MiniCard";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface Props { periodo: PeriodoFiltro; }

interface InsightRow {
  date: string;
  spend: number | null;
  impressions: number | null;
  reach: number | null;
  frequency: number | null;
  clicks: number | null;
  link_clicks: number | null;
  ctr: number | null;
  cpc: number | null;
  leads: number | null;
}

function fmtNum(v: number) { return v.toLocaleString("pt-BR"); }
function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export function MetaAdsPerformanceTab({ periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const hoje = new Date();
  const dataInicioStr = format(subDays(hoje, dias), "yyyy-MM-dd");
  const dataFimStr = format(hoje, "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["meta-performance-tab", periodo],
    queryFn: async (): Promise<InsightRow[]> => {
      const { data, error } = await supabase
        .from("meta_insights_daily")
        .select("date, spend, impressions, reach, frequency, clicks, link_clicks, ctr, cpc, leads")
        .eq("level", "ad")
        .gte("date", dataInicioStr)
        .lte("date", dataFimStr)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as InsightRow[];
    },
  });

  const insights = data ?? [];

  const agg = useMemo(() => {
    let spend = 0, impressions = 0, clicks = 0, link_clicks = 0, leads = 0;
    let reachSum = 0, freqSum = 0, freqN = 0;
    for (const r of insights) {
      spend += Number(r.spend ?? 0);
      impressions += Number(r.impressions ?? 0);
      clicks += Number(r.clicks ?? 0);
      link_clicks += Number(r.link_clicks ?? 0);
      leads += Number(r.leads ?? 0);
      reachSum += Number(r.reach ?? 0);
      if (r.frequency != null) { freqSum += Number(r.frequency); freqN++; }
    }
    return {
      spend, impressions, clicks, link_clicks, leads,
      reach: reachSum,
      freqMedia: freqN > 0 ? freqSum / freqN : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
    };
  }, [insights]);

  // Agrupa por dia pros graficos (object_id=ad gera multiplas linhas/dia)
  const byDay = useMemo(() => {
    const m = new Map<string, { date: string; impressions: number; clicks: number; ctr: number; reach: number; freqSum: number; freqN: number }>();
    for (const r of insights) {
      const d = r.date;
      const cur = m.get(d) ?? { date: d, impressions: 0, clicks: 0, ctr: 0, reach: 0, freqSum: 0, freqN: 0 };
      cur.impressions += Number(r.impressions ?? 0);
      cur.clicks += Number(r.clicks ?? 0);
      cur.reach += Number(r.reach ?? 0);
      if (r.frequency != null) { cur.freqSum += Number(r.frequency); cur.freqN++; }
      m.set(d, cur);
    }
    return Array.from(m.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        data: format(new Date(d.date), "dd/MM"),
        impressoes: d.impressions,
        cliques: d.clicks,
        alcance: d.reach,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        frequencia: d.freqN > 0 ? d.freqSum / d.freqN : 0,
      }));
  }, [insights]);

  if (isLoading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>;
  }
  if (insights.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Sem dados de insights ainda — o sync vai popular essa aba no próximo ciclo do cron.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 6 KPIs do periodo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniCard label="Alcance" value={fmtNum(agg.reach)} Icon={Users} />
        <MiniCard label="Impressões" value={fmtNum(agg.impressions)} Icon={Eye} />
        <MiniCard label="Cliques" value={fmtNum(agg.clicks)} sub={`${fmtNum(agg.link_clicks)} em link`} Icon={MousePointerClick} />
        <MiniCard label="CTR médio" value={`${agg.ctr.toFixed(2)}%`} Icon={Target} />
        <MiniCard label="CPC médio" value={agg.cpc > 0 ? fmtBRL(agg.cpc) : "-"} Icon={Activity} />
        <MiniCard label="Frequência" value={agg.freqMedia.toFixed(2)} sub="média do período" Icon={Repeat} />
      </div>

      {/* Impressoes + cliques no tempo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Impressões e cliques por dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={byDay} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
              <ChartGradientDefs
                gradients={[
                  { id: "perf-imp", color: "hsl(var(--chart-1))" },
                  { id: "perf-clk", color: "hsl(var(--chart-2))", fromOpacity: 0.22, glow: false },
                ]}
              />
              <CartesianGrid {...modernGridProps} />
              <XAxis dataKey="data" {...modernAxisProps} />
              <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} {...modernAxisProps} width={40} />
              <YAxis yAxisId="right" orientation="right" {...modernAxisProps} width={36} />
              <Tooltip formatter={(v: number) => fmtNum(v)} contentStyle={chartTooltipStyle} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="impressoes" name="Impressões" stroke="hsl(var(--chart-1))" strokeWidth={2.75} fill="url(#perf-imp)" filter="url(#perf-imp-glow)" dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="cliques" name="Cliques" stroke="hsl(var(--chart-2))" strokeWidth={2.5} fill="url(#perf-clk)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alcance + Frequencia (lado a lado) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Alcance por dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDay} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid {...modernGridProps} />
                <XAxis dataKey="data" {...modernAxisProps} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} {...modernAxisProps} width={40} />
                <Tooltip formatter={(v: number) => fmtNum(v)} contentStyle={chartTooltipStyle} />
                <Bar dataKey="alcance" name="Alcance" fill="hsl(var(--chart-4))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">CTR e Frequência por dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={byDay} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
                <ChartGradientDefs
                  gradients={[
                    { id: "perf-ctr", color: "hsl(var(--chart-1))" },
                    { id: "perf-freq", color: "hsl(var(--chart-3))", fromOpacity: 0.2, glow: false },
                  ]}
                />
                <CartesianGrid {...modernGridProps} />
                <XAxis dataKey="data" {...modernAxisProps} />
                <YAxis yAxisId="left" {...modernAxisProps} tickFormatter={(v) => `${v.toFixed(1)}%`} width={40} />
                <YAxis yAxisId="right" orientation="right" {...modernAxisProps} width={36} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="ctr" name="CTR (%)" stroke="hsl(var(--chart-1))" strokeWidth={2.75} fill="url(#perf-ctr)" filter="url(#perf-ctr-glow)" dot={false} />
                <Area yAxisId="right" type="monotone" dataKey="frequencia" name="Frequência" stroke="hsl(var(--chart-3))" strokeWidth={2.5} fill="url(#perf-freq)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
