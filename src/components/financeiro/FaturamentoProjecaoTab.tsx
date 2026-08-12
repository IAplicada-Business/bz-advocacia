import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useFluxoCaixa, useProjetadoVsRealizado } from "@/hooks/useFinanceiro";
import { ConfigurarMetaDialog } from "@/components/dashboard/ConfigurarMetaDialog";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { chartColors } from "@/lib/chartConfig";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

interface FaturamentoProjecaoTabProps {
  filters?: FaturamentoFiltersState;
}

export function FaturamentoProjecaoTab({ filters }: FaturamentoProjecaoTabProps) {
  const { data: projetadoVsRealizado } = useProjetadoVsRealizado();
  const { data: fluxoCaixa } = useFluxoCaixa(filters);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const fluxoGranularidade = useMemo(() => {
    if (!fluxoCaixa || fluxoCaixa.length === 0) return "dia";
    return (fluxoCaixa[0] as any)?.granularidade || "dia";
  }, [fluxoCaixa]);

  const formatXAxisDate = (dateStr: string) => {
    try {
      if (fluxoGranularidade === "mes") {
        const [year, month] = dateStr.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return format(date, "MMM/yy", { locale: ptBR });
      }
      return format(new Date(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatTooltipLabel = (label: string) => {
    try {
      if (fluxoGranularidade === "mes") {
        const [year, month] = label.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return format(date, "MMMM 'de' yyyy", { locale: ptBR });
      }
      return format(new Date(label), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return label;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={chartTooltipStyle}>
          <p className="text-sm font-medium mb-1">{formatTooltipLabel(label)}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.gold }} />
            <span className="text-sm text-muted-foreground">Entradas:</span>
            <span className="text-sm font-semibold">{formatCurrencyFull(payload[0].value)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const getPeriodoLabel = () => {
    if (filters?.dateRange?.from && filters?.dateRange?.to) {
      return `${format(filters.dateRange.from, "dd/MM/yyyy")} - ${format(filters.dateRange.to, "dd/MM/yyyy")}`;
    }
    return "Período atual";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projeção de Faturamento</h3>
        <ConfigurarMetaDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Projetado vs Realizado</span>
            <span className="text-xs font-normal text-muted-foreground">Últimos 12 meses</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projetadoVsRealizado && projetadoVsRealizado.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projetadoVsRealizado} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid {...modernGridProps} />
                <XAxis dataKey="mes" {...modernAxisProps} />
                <YAxis tickFormatter={formatCurrency} {...modernAxisProps} width={48} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrencyFull(value),
                    name === "realizado" ? "Realizado" : "Projetado",
                  ]}
                  contentStyle={chartTooltipStyle}
                />
                <Legend formatter={(value) => (value === "realizado" ? "Realizado" : "Projetado")} />
                <Bar dataKey="realizado" fill={chartColors.bronze} radius={[8, 8, 0, 0]} />
                <Bar dataKey="projetado" fill={chartColors.sage} radius={[8, 8, 0, 0]} opacity={0.65} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Configure metas mensais para visualizar a projeção
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fluxo de Caixa ({getPeriodoLabel()})</span>
            <span className="text-xs font-normal text-muted-foreground">
              {fluxoGranularidade === "mes" ? "Agrupado por mês" : "Diário"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fluxoCaixa && fluxoCaixa.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={fluxoCaixa} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <ChartGradientDefs gradients={[{ id: "entradasGradientProj", color: "hsl(var(--chart-1))" }]} />
                <CartesianGrid {...modernGridProps} />
                <XAxis
                  dataKey="data"
                  tickFormatter={formatXAxisDate}
                  {...modernAxisProps}
                  interval={fluxoGranularidade === "mes" ? 0 : "preserveStartEnd"}
                />
                <YAxis tickFormatter={formatCurrency} {...modernAxisProps} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="entradas"
                  fill="url(#entradasGradientProj)"
                  filter="url(#entradasGradientProj-glow)"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.75}
                  dot={false}
                  activeDot={{ fill: "hsl(var(--chart-1))", stroke: "hsl(var(--card))", strokeWidth: 2, r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
