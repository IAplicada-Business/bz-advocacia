import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  Area, AreaChart, Legend,
} from "recharts";
import { chartColors, CHART_SERIES } from "@/lib/chartConfig";
import {
  ChartGradientDefs,
  chartTooltipStyle,
  modernAxisProps,
  modernGridProps,
  seriesColor,
} from "@/components/charts/ChartPrimitives";
import type { MarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";
import { Badge } from "@/components/ui/badge";

interface Props {
  analytics: MarketingCsvAnalytics;
  showFunnel?: boolean;
  showPlatform?: boolean;
  showEvolution?: boolean;
  showCampaigns?: boolean;
}

const PIE_COLORS = [...CHART_SERIES];

const FUNNEL_COLORS: Record<string, string> = {
  "Novo": chartColors.bronze,
  "Criado": chartColors.gold,
  "Enviado": chartColors.sage,
  "Qualificado": chartColors.amber,
  "Convertido": chartColors.ink,
  "Total Leads": chartColors.gold,
};

export function MarketingCsvCharts({ analytics, showFunnel = true, showPlatform = true, showEvolution = true, showCampaigns = false }: Props) {
  const { funnel, platformKPIs, dailyLeads, campaigns, isLoading, totalLeads } = analytics;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const hasData = totalLeads > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Funil de Status */}
      {showFunnel && funnel.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Funil de Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid {...modernGridProps} horizontal={false} vertical />
                <XAxis type="number" {...modernAxisProps} />
                <YAxis dataKey="stage" type="category" width={100} {...modernAxisProps} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number, _name: string, props: any) => [
                    `${value} leads (${props.payload.percentage}%)`, "Quantidade"
                  ]}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {funnel.map((entry, idx) => (
                    <Cell key={idx} fill={FUNNEL_COLORS[entry.stage] || seriesColor(idx)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Plataforma */}
      {showPlatform && platformKPIs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Plataforma</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={platformKPIs}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={62}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="label"
                  stroke="hsl(var(--card))"
                  strokeWidth={3}
                  label={({ label, percentage }) => `${label} ${percentage}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {platformKPIs.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number, name: string) => [`${value} leads`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Evolução de Leads */}
      {showEvolution && dailyLeads.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Evolução de Leads por Dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyLeads} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <ChartGradientDefs
                  gradients={[
                    { id: "csv-fb", color: chartColors.gold },
                    { id: "csv-ig", color: chartColors.bronze, fromOpacity: 0.28, glow: false },
                    { id: "csv-org", color: chartColors.sage, fromOpacity: 0.22, glow: false },
                    { id: "csv-out", color: chartColors.amber, fromOpacity: 0.2, glow: false },
                  ]}
                />
                <CartesianGrid {...modernGridProps} />
                <XAxis dataKey="date" {...modernAxisProps} />
                <YAxis allowDecimals={false} {...modernAxisProps} width={36} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="fb" name="Facebook" stackId="1" stroke={chartColors.gold} fill="url(#csv-fb)" filter="url(#csv-fb-glow)" strokeWidth={2.25} />
                <Area type="monotone" dataKey="ig" name="Instagram" stackId="1" stroke={chartColors.bronze} fill="url(#csv-ig)" strokeWidth={2} />
                <Area type="monotone" dataKey="organic" name="Orgânico" stackId="1" stroke={chartColors.sage} fill="url(#csv-org)" strokeWidth={2} />
                <Area type="monotone" dataKey="outro" name="Outro" stackId="1" stroke={chartColors.amber} fill="url(#csv-out)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance por Campanha */}
      {showCampaigns && campaigns.length > 0 && (
         <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Performance por Anúncio</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anúncio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Enviados</TableHead>
                  <TableHead className="text-right">Qualificados</TableHead>
                  <TableHead className="text-right">Convertidos</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 10).map((c) => (
                  <TableRow key={c.campaign}>
                    <TableCell className="font-medium max-w-[250px] truncate" title={c.campaign}>{c.campaign}</TableCell>
                    <TableCell className="text-right">{c.total}</TableCell>
                    <TableCell className="text-right">{c.enviados}</TableCell>
                    <TableCell className="text-right">{c.qualificados}</TableCell>
                    <TableCell className="text-right">{c.convertidos}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.taxaConversao > 0 ? "default" : "secondary"}>
                        {c.taxaConversao}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
