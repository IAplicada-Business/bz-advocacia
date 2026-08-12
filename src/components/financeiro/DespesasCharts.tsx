import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useDespesasPorCategoria } from "@/hooks/useDespesas";
import type { DespesasGlobalFiltersState } from "./DespesasGlobalFilters";
import { chartTooltipStyle } from "@/components/charts/ChartPrimitives";
import { CHART_SERIES } from "@/lib/chartConfig";

interface DespesasChartsProps {
  filters?: DespesasGlobalFiltersState;
}

export function DespesasCharts({ filters }: DespesasChartsProps) {
  const { data: despesasPorCategoria } = useDespesasPorCategoria(filters);

  const despesasChartData = despesasPorCategoria?.map((item) => ({
    name: item.categoria,
    value: item.total,
    percentual: item.percentual,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Despesas por Categoria</CardTitle>
        <p className="text-xs text-muted-foreground">Distribuição do período</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={despesasChartData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={100}
              paddingAngle={3}
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.percentual?.toFixed(0) || 0}%`}
              fill="hsl(var(--chart-1))"
              dataKey="value"
              stroke="hsl(var(--card))"
              strokeWidth={3}
            >
              {despesasChartData?.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_SERIES[index % CHART_SERIES.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value)
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
