import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResultadoMensal } from "@/hooks/useVisaoGeralFinanceiro";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

interface Props {
  ano: number | null;
}

export function ResultadoPeriodoCard({ ano }: Props) {
  const { data, isLoading } = useResultadoMensal(ano);

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Resultado do Período</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-lg font-bold text-primary">{fmt(data.totalReceitas)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <p className="text-xs text-muted-foreground">Despesas PJ</p>
            <p className="text-lg font-bold text-destructive">{fmt(data.totalDespesas)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/10">
            <p className="text-xs text-muted-foreground">Lucro</p>
            <p className={`text-lg font-bold ${data.lucro >= 0 ? "text-primary" : "text-destructive"}`}>
              {fmt(data.lucro)}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data.dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <ChartGradientDefs gradients={[{ id: "resultado-periodo", color: "hsl(var(--chart-1))" }]} />
            <CartesianGrid {...modernGridProps} />
            <XAxis dataKey="mes" {...modernAxisProps} />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              {...modernAxisProps}
              width={36}
              tickCount={4}
            />
            <Tooltip
              formatter={(v: number) => [fmt(v), "Resultado"]}
              contentStyle={chartTooltipStyle}
            />
            <Area
              type="monotone"
              dataKey="resultado"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2.75}
              fill="url(#resultado-periodo)"
              filter="url(#resultado-periodo-glow)"
              dot={false}
              activeDot={{ r: 5, stroke: "hsl(var(--card))", strokeWidth: 2, fill: "hsl(var(--chart-1))" }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground text-center">
          Melhor mês: <span className="font-medium text-foreground">{data.melhorMes.mes}</span> com{" "}
          <span className="font-medium text-primary">{fmt(data.melhorMes.valor)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
