import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from "recharts";
import { MetaChartData } from "@/types/meta-ads";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface MetaAdsChartProps {
  data: MetaChartData[];
  isLoading?: boolean;
}

export function MetaAdsChart({ data, isLoading }: MetaAdsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Investimento vs Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução de Investimento vs Leads</CardTitle>
        <CardDescription>Comparativo diário de gastos e leads gerados</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
            <ChartGradientDefs
              gradients={[
                { id: "meta-chart-gasto", color: "hsl(var(--chart-1))" },
                { id: "meta-chart-leads", color: "hsl(var(--chart-4))", fromOpacity: 0.25, glow: false },
              ]}
            />
            <CartesianGrid {...modernGridProps} />
            <XAxis dataKey="data" {...modernAxisProps} />
            <YAxis
              yAxisId="left"
              {...modernAxisProps}
              width={56}
              tickFormatter={(value) => `R$ ${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              {...modernAxisProps}
              width={36}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(v: number, n: string) => {
                if (n === "Investimento (R$)") {
                  return [
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v),
                    n,
                  ];
                }
                return [v, n];
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="gasto"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2.75}
              fill="url(#meta-chart-gasto)"
              filter="url(#meta-chart-gasto-glow)"
              name="Investimento (R$)"
              dot={false}
              activeDot={{ r: 5, stroke: "hsl(var(--card))", strokeWidth: 2, fill: "hsl(var(--chart-1))" }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="leads"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2.5}
              fill="url(#meta-chart-leads)"
              name="Leads"
              dot={false}
              activeDot={{ r: 4, stroke: "hsl(var(--card))", strokeWidth: 2, fill: "hsl(var(--chart-4))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
