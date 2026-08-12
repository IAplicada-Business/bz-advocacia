import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChannelEvolution } from "@/types/analytics";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps, seriesColor } from "@/components/charts/ChartPrimitives";

interface ChannelEvolutionChartProps {
  data?: ChannelEvolution[];
  loading?: boolean;
}

const SERIES = [
  { key: "google", label: "Google" },
  { key: "meta", label: "Meta" },
  { key: "indicacao", label: "Indicação" },
  { key: "site", label: "Site" },
  { key: "outro", label: "Outro" },
] as const;

export function ChannelEvolutionChart({ data, loading }: ChannelEvolutionChartProps) {
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
        <CardTitle>Evolução de Leads por Canal</CardTitle>
        <CardDescription>Últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <ChartGradientDefs
                gradients={SERIES.map((s, i) => ({
                  id: `ch-${s.key}`,
                  color: seriesColor(i),
                  fromOpacity: i === 0 ? 0.35 : 0.12,
                  glow: i === 0,
                }))}
              />
              <CartesianGrid {...modernGridProps} />
              <XAxis dataKey="mes" {...modernAxisProps} />
              <YAxis {...modernAxisProps} width={36} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              {SERIES.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={seriesColor(i)}
                  strokeWidth={i === 0 ? 2.75 : 2}
                  fill={`url(#ch-${s.key})`}
                  filter={i === 0 ? "url(#ch-google-glow)" : undefined}
                  dot={false}
                />
              ))}
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
