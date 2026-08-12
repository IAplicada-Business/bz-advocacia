import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReceitasDespesasMensal } from "@/hooks/useVisaoGeralFinanceiro";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";
import { chartColors } from "@/lib/chartConfig";

const formatCurrencyShort = (v: number) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
};

const formatCurrencyFull = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  ano: number | null;
}

export function ReceitasDespesasChart({ ano }: Props) {
  const { data, isLoading } = useReceitasDespesasMensal(ano);

  if (isLoading) return <Skeleton className="h-80 rounded-[1.35rem]" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg">Receitas × Despesas por Mês</CardTitle>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.sage }} /> Receitas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.danger }} /> Despesas PJ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.gold }} /> Resultado
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid {...modernGridProps} />
            <XAxis dataKey="mes" {...modernAxisProps} />
            <YAxis tickFormatter={formatCurrencyShort} {...modernAxisProps} width={48} />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrencyFull(value),
                name === "receitas" ? "Receitas" : name === "despesas" ? "Despesas PJ" : "Resultado",
              ]}
              contentStyle={chartTooltipStyle}
            />
            <Bar dataKey="receitas" fill={chartColors.sage} radius={[8, 8, 0, 0]} />
            <Bar dataKey="despesas" fill={chartColors.danger} radius={[8, 8, 0, 0]} />
            <Bar dataKey="resultado" fill={chartColors.gold} radius={[8, 8, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
