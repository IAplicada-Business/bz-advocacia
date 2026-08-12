import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Cell,
} from "recharts";
import { useFaturamentoMensal } from "@/hooks/useFinanceiro";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FaturamentoChartsProps {
  filters?: FaturamentoFiltersState;
  selectedMes?: string | null;
  onSelectMonth?: (mes: string) => void;
}

const COR_NOVOS = "hsl(var(--chart-1))";
const COR_ENTRADAS = "hsl(var(--chart-3))";
const COR_PROJECAO = "hsl(var(--chart-4))";
const COR_META = "hsl(var(--chart-5))";

export function FaturamentoCharts({ filters, selectedMes, onSelectMonth }: FaturamentoChartsProps) {
  const { data: chartData = [] } = useFaturamentoMensal(filters);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatXAxis = (mesStr: string) => {
    try {
      const [year, month] = mesStr.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMM/yy", { locale: ptBR });
    } catch {
      return mesStr;
    }
  };

  const formatTooltipLabel = (label: string) => {
    try {
      const [year, month] = label.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return label;
    }
  };

  const nomeSerie = (key: string) =>
    key === "novos"
      ? "Contratos novos"
      : key === "entradas"
        ? "Entradas (existentes)"
        : key === "projecao"
          ? "A receber (projeção)"
          : "Meta";

  const temDados = chartData.some(
    (d) => d.novos > 0 || d.entradas > 0 || d.projecao > 0 || d.meta > 0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
          <span>Faturamento por mês</span>
          <span className="text-xs font-normal text-muted-foreground">
            Contratos novos + entradas + projeção a receber vs meta
            {onSelectMonth ? " • clique numa barra para filtrar" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {temDados ? (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onClick={(state: any) => {
                const mes = state?.activeLabel;
                if (mes && onSelectMonth) onSelectMonth(String(mes));
              }}
            >
              <CartesianGrid strokeDasharray="3 8" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.55} />
              <XAxis
                dataKey="mes"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                angle={chartData.length > 6 ? -45 : 0}
                textAnchor={chartData.length > 6 ? "end" : "middle"}
                height={chartData.length > 6 ? 60 : 30}
              />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrencyFull(value), nomeSerie(name)]}
                labelFormatter={formatTooltipLabel}
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-glow)',
                  fontSize: 12,
                }}
              />
              <Legend formatter={(value: string) => nomeSerie(value)} />
              <Bar
                dataKey="novos"
                stackId="fat"
                fill={COR_NOVOS}
                cursor={onSelectMonth ? "pointer" : undefined}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.mes}
                    fill={COR_NOVOS}
                    opacity={selectedMes && entry.mes !== selectedMes ? 0.4 : 1}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="entradas"
                stackId="fat"
                fill={COR_ENTRADAS}
                radius={[4, 4, 0, 0]}
                cursor={onSelectMonth ? "pointer" : undefined}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.mes}
                    fill={COR_ENTRADAS}
                    opacity={selectedMes && entry.mes !== selectedMes ? 0.4 : 1}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="projecao"
                stackId="proj"
                fill={COR_PROJECAO}
                radius={[4, 4, 0, 0]}
                cursor={onSelectMonth ? "pointer" : undefined}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.mes}
                    fill={COR_PROJECAO}
                    opacity={selectedMes && entry.mes !== selectedMes ? 0.4 : 1}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="meta"
                stroke={COR_META}
                strokeWidth={2}
                dot={{ r: 3, fill: COR_META }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[320px] text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
