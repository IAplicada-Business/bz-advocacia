import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Scale,
  ListChecks,
  Clock,
  Users,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/ui/metric-card";
import { SegmentControl } from "@/components/ui/segment-control";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartGradientDefs, modernAxisProps, modernGridProps, chartTooltipStyle } from "@/components/charts/ChartPrimitives";
import { useDashboardPrincipal } from "@/hooks/useDashboardPrincipal";
import { useDashboardVisual } from "@/hooks/useDashboardVisual";
import { useProcessosEvolucao } from "@/hooks/useProcessosEvolucao";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const COLORS_DONUT = [
  { key: "urgentes", label: "Urgentes", color: "hsl(var(--destructive))" },
  { key: "atrasadas", label: "Atrasadas", color: "hsl(var(--chart-5))" },
  { key: "pendentes", label: "Pendentes", color: "hsl(var(--chart-1))" },
  { key: "concluidasSemana", label: "Concluídas", color: "hsl(var(--chart-4))" },
];

const PIPELINE_STAGES = [
  { key: "novo" as const, label: "Novo", color: "hsl(var(--chart-1))" },
  { key: "em_contato" as const, label: "Em contato", color: "hsl(var(--chart-4))" },
  { key: "proposta" as const, label: "Proposta", color: "hsl(var(--chart-5))" },
  { key: "perdido" as const, label: "Perdido", color: "hsl(var(--destructive))" },
];

type DashSegment = "operacao" | "processos" | "leads";

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data, isLoading } = useDashboardPrincipal();
  const { data: visual, isLoading: visualLoading } = useDashboardVisual();
  const { data: evolucaoData, isLoading: evolucaoLoading } = useProcessosEvolucao();
  const navigate = useNavigate();
  const [segment, setSegment] = useState<DashSegment>("operacao");
  const [range, setRange] = useState<"3m" | "6m" | "12m">("6m");

  const userName =
    profile?.nome_completo?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "";
  const hoje = new Date();
  const dataFormatada = format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR });
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  const loading = isLoading || visualLoading;

  const tarefas = visual?.tarefas || { urgentes: 0, atrasadas: 0, concluidasSemana: 0, pendentes: 0, totalAtivas: 0 };
  const prazos = visual?.prazos || { atrasados: 0, hoje: 0, estaSemana: 0, dias30: 0 };

  const processosAtivos = data?.processosAtivos || 0;
  const processosConcluidos = data?.processosConcluídosMes || 0;
  const leadsNoMes = data?.leadsNoMes || 0;
  const leadsParados = data?.leadsSemFollowUp || 0;
  const taxaConversao = data?.taxaConversaoMes || 0;
  const clientesAtivos = data?.clientesAtivos || 0;
  const clientesNovos = data?.clientesNovosMes || 0;
  const funil = data?.leadsFunil || { novo: 0, em_contato: 0, proposta: 0, perdido: 0 };
  const leadsParadosList = data?.leadsSemFollowUpList || [];

  const totalPrazos = prazos.atrasados + prazos.hoje + prazos.estaSemana + prazos.dias30;
  const totalTarefas = tarefas.totalAtivas + tarefas.concluidasSemana;
  const taxaConclusao = totalTarefas > 0 ? Math.round((tarefas.concluidasSemana / totalTarefas) * 100) : 0;

  const donutData = COLORS_DONUT.map((c) => ({
    name: c.label,
    value: tarefas[c.key as keyof typeof tarefas] as number,
    color: c.color,
  })).filter((d) => d.value > 0);

  const funilMax = Math.max(funil.novo, funil.em_contato, funil.proposta, funil.perdido, 1);

  const meses = evolucaoData?.meses || [];
  const rangeCount = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const chartMeses = meses.slice(-rangeCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-seasons text-foreground">
            {getGreeting()}, <span className="text-primary">{userName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão objetiva da operação · {dataCapitalizada}
          </p>
        </div>
        <SegmentControl
          value={segment}
          onChange={(v) => setSegment(v as typeof segment)}
          size="md"
          options={[
            { value: "operacao", label: "Operação" },
            { value: "processos", label: "Processos" },
            { value: "leads", label: "Leads" },
          ]}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[1.35rem]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Processos ativos"
            value={processosAtivos}
            sub={`${processosConcluidos} concluído${processosConcluidos !== 1 ? "s" : ""} no mês`}
            icon={Scale}
            onClick={() => navigate("/dashboard/processos")}
            accent={segment === "processos"}
          />
          <MetricCard
            label="Tarefas"
            value={tarefas.totalAtivas}
            sub={
              tarefas.urgentes > 0
                ? `${tarefas.urgentes} urgente${tarefas.urgentes > 1 ? "s" : ""} · ${tarefas.atrasadas} atrasada${tarefas.atrasadas > 1 ? "s" : ""}`
                : `${tarefas.concluidasSemana} concluída${tarefas.concluidasSemana !== 1 ? "s" : ""} esta semana`
            }
            icon={ListChecks}
            onClick={() => navigate("/dashboard/processos/demandas")}
            accent={segment === "operacao"}
          />
          <MetricCard
            label="Prazos"
            value={totalPrazos}
            sub={
              prazos.atrasados > 0
                ? `${prazos.atrasados} atrasado${prazos.atrasados > 1 ? "s" : ""} · ${prazos.hoje} hoje`
                : `${prazos.hoje} hoje · ${prazos.estaSemana} esta semana`
            }
            icon={Clock}
            onClick={() => navigate("/dashboard/processos/calendario")}
          />
          <MetricCard
            label="Leads no mês"
            value={leadsNoMes}
            sub={`${taxaConversao}% conversão · ${clientesAtivos} clientes (+${clientesNovos})`}
            icon={Users}
            trend={taxaConversao}
            trendLabel="conv."
            onClick={() => navigate("/dashboard/leads")}
            accent={segment === "leads"}
          />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/12 via-card to-card lg:col-span-1">
          <div aria-hidden className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <CardContent className="relative flex h-full flex-col justify-between gap-4 p-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/25">
                <Sparkles className="h-3.5 w-3.5" />
                Decisões com dados
              </div>
              <h3 className="font-seasons text-2xl font-semibold leading-tight">
                Foque no que move o escritório
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {leadsParados > 0
                  ? `${leadsParados} lead${leadsParados > 1 ? "s" : ""} sem follow-up. Priorize o pipeline.`
                  : "Pipeline saudável. Continue acompanhando conversão e prazos."}
              </p>
            </div>
            <Button
              className="w-fit rounded-full shadow-glow"
              onClick={() => navigate(leadsParados > 0 ? "/dashboard/leads" : "/dashboard/vendas/meta-ads")}
            >
              {leadsParados > 0 ? "Ver leads parados" : "Abrir Marketing"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base md:text-lg">Evolução de processos</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Abertos × concluídos</p>
              </div>
              <SegmentControl
                value={range}
                onChange={(v) => setRange(v as typeof range)}
                options={[
                  { value: "3m", label: "3M" },
                  { value: "6m", label: "6M" },
                  { value: "12m", label: "1A" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {evolucaoLoading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartMeses} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <ChartGradientDefs
                    gradients={[
                      { id: "proc-abertos", color: "hsl(var(--chart-1))" },
                      { id: "proc-concluidos", color: "hsl(var(--chart-4))", fromOpacity: 0.28, glow: false },
                    ]}
                  />
                  <CartesianGrid {...modernGridProps} />
                  <XAxis dataKey="mes" {...modernAxisProps} />
                  <YAxis {...modernAxisProps} tickCount={5} width={36} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="abertos"
                    name="Abertos"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2.75}
                    fill="url(#proc-abertos)"
                    filter="url(#proc-abertos-glow)"
                    dot={false}
                    activeDot={{ r: 5, stroke: "hsl(var(--card))", strokeWidth: 2, fill: "hsl(var(--chart-1))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="concluidos"
                    name="Concluídos"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2.25}
                    fill="url(#proc-concluidos)"
                    dot={false}
                    activeDot={{ r: 4, stroke: "hsl(var(--card))", strokeWidth: 2, fill: "hsl(var(--chart-4))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tarefas da semana</CardTitle>
              <button
                onClick={() => navigate("/dashboard/processos/demandas")}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Abrir <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : donutData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                Sem tarefas
              </div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={78}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="hsl(var(--card))"
                        strokeWidth={3}
                      >
                        {donutData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-semibold font-seasons">{totalTarefas}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  {COLORS_DONUT.map((c) => {
                    const val = tarefas[c.key as keyof typeof tarefas] as number;
                    return (
                      <div key={c.key} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-[11px] text-muted-foreground flex-1">{c.label}</span>
                        <span className="text-[11px] font-semibold">{val}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Conclusão semanal</span>
                    <span className="font-semibold text-[hsl(var(--chart-4))]">{taxaConclusao}%</span>
                  </div>
                  <Progress value={taxaConclusao} className="h-1.5" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg">Pipeline de leads</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Segmentação visual do funil</p>
              </div>
              <button
                onClick={() => navigate("/dashboard/leads")}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Ver leads <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <>
                <div className="space-y-2.5">
                  {PIPELINE_STAGES.map((s) => {
                    const val = funil[s.key];
                    const width = Math.max((val / funilMax) * 100, val > 0 ? 12 : 0);
                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <span className="w-20 text-right text-[11px] text-muted-foreground">{s.label}</span>
                        <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-muted/60">
                          <div
                            className="flex h-full items-center justify-end rounded-full px-2 text-[11px] font-bold text-primary-foreground transition-all duration-500"
                            style={{
                              width: `${width}%`,
                              background:
                                val > 0
                                  ? `linear-gradient(90deg, ${s.color}99, ${s.color})`
                                  : "transparent",
                              minWidth: val > 0 ? 28 : 0,
                              boxShadow: val > 0 ? `0 0 18px -6px ${s.color}` : undefined,
                            }}
                          >
                            {val > 0 && val}
                          </div>
                          {val === 0 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-muted-foreground">
                              0
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conversão do mês</span>
                    <span className="font-semibold text-[hsl(var(--chart-4))]">{taxaConversao}%</span>
                  </div>
                  <Progress value={taxaConversao} className="h-1.5" />
                </div>
                {leadsParadosList.length > 0 && (
                  <div className="flex items-start gap-2 rounded-2xl bg-[hsl(var(--chart-5)/0.12)] p-3 ring-1 ring-[hsl(var(--chart-5)/0.25)]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--chart-5))]" />
                    <div className="text-[11px] text-[hsl(var(--chart-5))]">
                      <span className="font-semibold">{leadsParadosList[0].nome}</span> parado há{" "}
                      {leadsParadosList[0].dias_parado} dias
                      {leadsParadosList.length > 1 && ` (+${leadsParadosList.length - 1} outros)`}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
