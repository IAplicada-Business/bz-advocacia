import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, ChevronRight } from "lucide-react";
import { VisaoGeralKPIs } from "./VisaoGeralKPIs";
import { ReceitasDespesasChart } from "./ReceitasDespesasChart";
import { DespesasPorCategoriaChart } from "./DespesasPorCategoriaChart";
import { DespesasDistribuicaoDonut } from "./DespesasDistribuicaoDonut";
import { ResultadoPeriodoCard } from "./ResultadoPeriodoCard";
import { useTotalParcelasPendentes } from "@/hooks/useVisaoGeralFinanceiro";

interface Props {
  ano: number | null;
  // Mês selecionado no header (ao lado do ano). null = todos os meses.
  mes: number | null;
  onNavigateToAcordos: () => void;
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function TotalParcelasPendentesCard({ onClick }: { onClick: () => void }) {
  const { data, isLoading } = useTotalParcelasPendentes();

  if (isLoading) return <Skeleton className="h-24" />;

  const total = data?.total ?? 0;
  const count = data?.count ?? 0;

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5 md:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total de Parcelas Pendentes
            </p>
            <p className="font-seasons text-2xl font-semibold leading-none text-primary">
              {fmtCurrency(total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {count} {count === 1 ? "parcela aguardando recebimento" : "parcelas aguardando recebimento"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </button>
  );
}

export function VisaoGeralTab({ ano, mes, onNavigateToAcordos }: Props) {
  return (
    <div className="space-y-6">
      {/* Card de total de parcelas pendentes — clique navega para aba Acordos e Parcelas */}
      <TotalParcelasPendentesCard onClick={onNavigateToAcordos} />

      <VisaoGeralKPIs ano={ano} mes={mes} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReceitasDespesasChart ano={ano} />
        <DespesasPorCategoriaChart ano={ano} mes={mes} />
      </div>

      {/* Donut de distribuicao percentual — complementa o bar chart acima. */}
      <DespesasDistribuicaoDonut ano={ano} mes={mes} />

      <ResultadoPeriodoCard ano={ano} />
    </div>
  );
}
