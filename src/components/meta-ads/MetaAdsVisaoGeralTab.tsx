import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMetaCampaignStatus } from "@/hooks/useMetaCampaignStatus";
import { MetaChartData } from "@/types/meta-ads";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface Props {
  chartData: MetaChartData[];
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function MetaAdsVisaoGeralTab({ chartData }: Props) {
  const hasData = chartData.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Performance no período</CardTitle>
        <p className="text-xs text-muted-foreground">Gasto e leads com evolução contínua</p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
              <ChartGradientDefs
                gradients={[
                  { id: "meta-gasto", color: "hsl(var(--chart-1))" },
                  { id: "meta-leads", color: "hsl(var(--chart-4))", fromOpacity: 0.25, glow: false },
                ]}
              />
              <CartesianGrid {...modernGridProps} />
              <XAxis dataKey="data" {...modernAxisProps} />
              <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} {...modernAxisProps} width={48} />
              <YAxis yAxisId="right" orientation="right" {...modernAxisProps} width={36} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v: number, n) => (n === "Gasto" ? [fmtBRL(v), n] : [v, n])}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="gasto"
                name="Gasto"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2.75}
                fill="url(#meta-gasto)"
                filter="url(#meta-gasto-glow)"
                dot={false}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2.5}
                fill="url(#meta-leads)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            Sem dados de performance ainda — aguardando sync de insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
