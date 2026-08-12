import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import type { ProcessoEvolucaoMes } from "@/hooks/useProcessosEvolucao";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface Props {
  data: ProcessoEvolucaoMes[];
  loading?: boolean;
}

export function DashboardEvolucaoProcessosV2({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-bold md:text-base">Evolução mensal de processos</CardTitle>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--chart-1))]" />
              <span className="text-muted-foreground">Abertos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--chart-4))]" />
              <span className="text-muted-foreground">Concluídos</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <ChartGradientDefs
                gradients={[
                  { id: "ev2-abertos", color: "hsl(var(--chart-1))" },
                  { id: "ev2-concluidos", color: "hsl(var(--chart-4))", fromOpacity: 0.25, glow: false },
                ]}
              />
              <CartesianGrid {...modernGridProps} />
              <XAxis dataKey="mes" {...modernAxisProps} />
              <YAxis {...modernAxisProps} tickCount={4} width={32} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="abertos" fill="url(#ev2-abertos)" stroke="hsl(var(--chart-1))" strokeWidth={2.5} filter="url(#ev2-abertos-glow)" name="Abertos" dot={false} />
              <Area type="monotone" dataKey="concluidos" fill="url(#ev2-concluidos)" stroke="hsl(var(--chart-4))" strokeWidth={2.25} name="Concluídos" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
