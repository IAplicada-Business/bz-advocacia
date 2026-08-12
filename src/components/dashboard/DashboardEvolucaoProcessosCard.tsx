import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ProcessoEvolucaoMes } from "@/hooks/useProcessosEvolucao";
import { chartColors } from "@/lib/chartConfig";
import { chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface Props {
  data: ProcessoEvolucaoMes[];
  loading: boolean;
  abertos30d: number;
  variacao: number;
}

export function DashboardEvolucaoProcessosCard({ data, loading, abertos30d, variacao }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = variacao >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Evolução de Processos</CardTitle>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">{abertos30d}</span>
          <div className={`flex items-center gap-1 justify-end text-xs ${isPositive ? "text-green-600" : "text-destructive"}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isPositive ? "+" : ""}{variacao}% este mês</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid {...modernGridProps} />
              <XAxis dataKey="mes" {...modernAxisProps} />
              <YAxis {...modernAxisProps} width={36} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar dataKey="abertos" name="Abertos" stackId="a" fill={chartColors.gold} radius={[0, 0, 0, 0]} />
              <Bar dataKey="concluidos" name="Concluídos" stackId="a" fill={chartColors.bronze} radius={[8, 8, 0, 0]} />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Total acumulado"
                stroke={chartColors.amber}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, stroke: "hsl(var(--card))", strokeWidth: 2, fill: chartColors.amber }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
