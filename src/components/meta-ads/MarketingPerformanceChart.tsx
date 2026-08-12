import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyConversion } from "@/hooks/useMarketingCsvAnalytics";
import { chartColors } from "@/lib/chartConfig";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface Props {
  data: DailyConversion[];
}

export function MarketingPerformanceChart({ data }: Props) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Performance Diária: Leads vs Conversões</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground py-8 text-center">Sem dados para o período selecionado</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Diária: Leads vs Conversões</CardTitle>
        <p className="text-sm text-muted-foreground">Acompanhamento de leads captados e taxa de conversão ao longo do tempo</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
            <ChartGradientDefs
              gradients={[
                { id: "mkt-leads", color: "hsl(var(--chart-1))" },
              ]}
            />
            <CartesianGrid {...modernGridProps} />
            <XAxis dataKey="date" {...modernAxisProps} />
            <YAxis yAxisId="left" {...modernAxisProps} width={36} />
            <YAxis yAxisId="right" orientation="right" {...modernAxisProps} width={40} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="leads"
              name="Leads"
              stroke={chartColors.gold}
              fill="url(#mkt-leads)"
              filter="url(#mkt-leads-glow)"
              strokeWidth={2.75}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="conversoes"
              name="Conversões"
              stroke={chartColors.sage}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, stroke: "hsl(var(--card))", strokeWidth: 2, fill: chartColors.sage }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="taxa"
              name="Taxa %"
              stroke={chartColors.amber}
              strokeWidth={2.25}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
