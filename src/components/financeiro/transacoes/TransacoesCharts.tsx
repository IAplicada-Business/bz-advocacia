import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { useResumoMensal, useKPIsTransacoes, useResumoAnual, useReceitasPorResponsavel } from "@/hooks/useTransacoesFinanceiras";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors, CHART_SERIES } from "@/lib/chartConfig";
import { ChartGradientDefs, chartTooltipStyle, modernAxisProps, modernGridProps } from "@/components/charts/ChartPrimitives";

const COLORS = [...CHART_SERIES];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

import type { TransacoesFilters } from "@/types/transacoes";

interface TransacoesChartsProps {
  filters?: TransacoesFilters;
}

export function TransacoesCharts({ filters }: TransacoesChartsProps) {
  // Determinar modo de visualização baseado nos filtros
  const anosLength = filters?.anos?.length || 0;
  const hasDateRange = filters?.dataInicio && filters?.dataFim;
  
  // Lógica de visualização:
  // - 0 anos (ou undefined) e sem date range → gráfico anual com TODOS os anos
  // - 1 ano selecionado → gráfico MENSAL daquele ano
  // - 2+ anos selecionados → gráfico anual COMPARANDO os anos selecionados
  // - date range → gráfico mensal do período
  const showMonthlyChart = anosLength === 1 || hasDateRange;
  const anoParaMensal = anosLength === 1 ? filters!.anos![0] : new Date().getFullYear();
  
  // Buscar dados baseado no modo
  const { data: resumoMensal, isLoading: loadingMensal } = useResumoMensal(anoParaMensal);
  const { data: resumoAnual, isLoading: loadingAnual } = useResumoAnual(
    anosLength > 1 ? filters?.anos : undefined
  );
  const { data: receitasResponsavel, isLoading: loadingResponsavel } = useReceitasPorResponsavel(filters);
  const { data: kpis, isLoading: loadingKpis } = useKPIsTransacoes(filters || {});

  const isLoading = loadingMensal || loadingKpis || loadingAnual || loadingResponsavel;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Dados para gráfico PF vs PJ
  const pfVsPjData = [
    { name: "Pessoa Física", value: kpis?.receitasPF || 0 },
    { name: "Pessoa Jurídica", value: kpis?.receitasPJ || 0 },
  ];

  // Gerar título dinâmico
  const getChartTitle = () => {
    if (hasDateRange) {
      return `Receitas vs Despesas - ${filters!.dataInicio!.toLocaleDateString('pt-BR')} a ${filters!.dataFim!.toLocaleDateString('pt-BR')}`;
    }
    if (anosLength === 1) {
      return `Receitas vs Despesas - ${filters!.anos![0]}`;
    }
    if (anosLength > 1) {
      return `Receitas vs Despesas - Comparação por Ano`;
    }
    return "Receitas vs Despesas - Todos os Anos";
  };

  // Dados acumulados para linha (quando há um único ano específico)
  let acumulado = 0;
  const dadosAcumulados = (resumoMensal || []).map((m) => {
    acumulado += m.resultado;
    return {
      mes: m.mes_nome.substring(0, 3),
      acumulado,
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico principal: Por Ano ou Por Mês */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">{getChartTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {showMonthlyChart ? (
              <BarChart data={resumoMensal || []}>
                <CartesianGrid {...modernGridProps} />
                <XAxis
                  dataKey="mes_nome"
                  tickFormatter={(v) => v.substring(0, 3)}
                  {...modernAxisProps}
                />
                <YAxis tickFormatter={formatCurrency} {...modernAxisProps} width={48} />
                <Tooltip
                  formatter={(value: number) => formatCurrencyFull(value)}
                  labelFormatter={(label) => `Mês: ${label}`}
                  contentStyle={chartTooltipStyle}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill={chartColors.sage} radius={[8, 8, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill={chartColors.gold} radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={resumoAnual || []}>
                <CartesianGrid {...modernGridProps} />
                <XAxis dataKey="ano" {...modernAxisProps} />
                <YAxis tickFormatter={formatCurrency} {...modernAxisProps} width={48} />
                <Tooltip
                  formatter={(value: number) => formatCurrencyFull(value)}
                  labelFormatter={(label) => `Ano: ${label}`}
                  contentStyle={chartTooltipStyle}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill={chartColors.sage} radius={[8, 8, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill={chartColors.gold} radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* PF vs PJ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receitas: PF vs PJ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pfVsPjData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={3}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pfVsPjData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrencyFull(value)} contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Receitas por Responsável */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receitas por Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={receitasResponsavel || []}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={3}
                dataKey="total"
                nameKey="responsavel"
                stroke="hsl(var(--card))"
                strokeWidth={3}
                label={({ responsavel, percentual }) =>
                  `${responsavel}: ${percentual.toFixed(0)}%`
                }
              >
                {(receitasResponsavel || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrencyFull(value)} contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resultado Acumulado - só mostrar quando tem UM ano específico */}
      {anosLength === 1 && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Resultado Acumulado - {filters?.anos?.[0]}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dadosAcumulados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <ChartGradientDefs gradients={[{ id: "trans-acumulado", color: "hsl(var(--chart-1))" }]} />
                <CartesianGrid {...modernGridProps} />
                <XAxis dataKey="mes" {...modernAxisProps} />
                <YAxis tickFormatter={formatCurrency} {...modernAxisProps} width={48} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} contentStyle={chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  name="Acumulado"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.75}
                  fill="url(#trans-acumulado)"
                  filter="url(#trans-acumulado-glow)"
                  dot={false}
                  activeDot={{ r: 5, stroke: "hsl(var(--card))", strokeWidth: 2, fill: "hsl(var(--chart-1))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
