import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ConversionByOrigin } from "@/types/analytics";
import { chartColors } from "@/lib/chartConfig";
import { chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface ConversionByOriginChartProps {
  data: ConversionByOrigin[];
  loading?: boolean;
}

export function ConversionByOriginChart({ data, loading }: ConversionByOriginChartProps) {
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

  const chartData = data.map(item => ({
    origem: item.origem,
    taxaConversao: item.taxaConversao,
    totalLeads: item.totalLeads,
    convertidos: item.convertidos,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conversão por Origem</CardTitle>
        <CardDescription>Comparação de performance entre canais</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid {...modernGridProps} />
              <XAxis dataKey="origem" {...modernAxisProps} />
              <YAxis
                {...modernAxisProps}
                width={40}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value: number, _name: string, props: any) => [
                  `${value.toFixed(1)}%`,
                  `Taxa de Conversão (${props.payload.convertidos}/${props.payload.totalLeads})`
                ]}
                contentStyle={chartTooltipStyle}
              />
              <Bar
                dataKey="taxaConversao"
                fill={chartColors.gold}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
