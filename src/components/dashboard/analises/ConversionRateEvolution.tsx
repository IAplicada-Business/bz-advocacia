import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ConversionEvolution } from "@/types/analytics";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface ConversionRateEvolutionProps {
  data: ConversionEvolution[];
  loading?: boolean;
}

export function ConversionRateEvolution({ data, loading }: ConversionRateEvolutionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução da Taxa de Conversão</CardTitle>
        <CardDescription>Últimos 12 meses</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <ChartGradientDefs gradients={[{ id: "conv-rate", color: "hsl(var(--chart-1))" }]} />
              <CartesianGrid {...modernGridProps} />
              <XAxis dataKey="mes" {...modernAxisProps} />
              <YAxis {...modernAxisProps} tickFormatter={(value) => `${value}%`} width={40} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Taxa de Conversão"]}
                contentStyle={chartTooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="taxaConversao"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2.75}
                fill="url(#conv-rate)"
                filter="url(#conv-rate-glow)"
                dot={false}
                activeDot={{ r: 5, stroke: "hsl(var(--card))", strokeWidth: 2, fill: "hsl(var(--chart-1))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Dados insuficientes para exibir evolução
          </div>
        )}
      </CardContent>
    </Card>
  );
}
