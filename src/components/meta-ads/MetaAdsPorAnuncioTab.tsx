import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PeriodoFiltro } from "@/types/meta-ads";
import { useMetaAdPerformance } from "@/hooks/useMetaAdPerformance";
import { cn } from "@/lib/utils";

interface Props {
  periodo: PeriodoFiltro;
}

function brl(v: number) {
  if (!v || v <= 0) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function pct(v: number) {
  if (!v || v <= 0) return "—";
  return `${v.toFixed(0)}%`;
}

export function MetaAdsPorAnuncioTab({ periodo }: Props) {
  const { rows, isLoading } = useMetaAdPerformance(periodo);

  const totals = rows.reduce(
    (acc, r) => {
      acc.gasto += r.gasto;
      acc.leads += r.leads_crm;
      acc.mql += r.mql;
      acc.ganho += r.ganho;
      return acc;
    },
    { gasto: 0, leads: 0, mql: 0, ganho: 0 },
  );

  if (isLoading) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Cruzando gasto Meta × funil CRM…
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground space-y-2">
        <p>Sem dados de anúncio no período.</p>
        <p className="text-xs">
          Confirme sync Meta + UTMs/`ad_id` nos links (ver docs/LINKS_UTM_CAMPANHAS_ALONSO.md).
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Investimento" value={brl(totals.gasto)} />
        <Kpi
          label="Leads no CRM"
          value={String(totals.leads)}
          hint={totals.leads > 0 ? `CPL ${brl(totals.gasto / totals.leads)}` : undefined}
        />
        <Kpi
          label="MQL"
          value={String(totals.mql)}
          hint={totals.mql > 0 ? `Custo/MQL ${brl(totals.gasto / totals.mql)}` : undefined}
          tone="good"
        />
        <Kpi
          label="Ganho"
          value={String(totals.ganho)}
          hint={totals.ganho > 0 ? `CPA ${brl(totals.gasto / totals.ganho)}` : "Ainda sem fechamento"}
          tone={totals.ganho > 0 ? "good" : "muted"}
        />
      </div>

      <Card>
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Por anúncio — custo → MQL → fechamento</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gasto vem do Meta; leads/MQL/ganho vêm do CRM pelo <code className="text-[10px]">ad_id</code>.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anúncio</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead className="text-right">Gasto</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">MQL</TableHead>
              <TableHead className="text-right">SAL+</TableHead>
              <TableHead className="text-right">Ganho</TableHead>
              <TableHead className="text-right">CPL</TableHead>
              <TableHead className="text-right">Custo/MQL</TableHead>
              <TableHead className="text-right">CPA</TableHead>
              <TableHead className="text-right">% MQL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.ad_id}>
                <TableCell className="max-w-[220px]">
                  <p className="font-medium truncate text-sm" title={r.ad_nome}>
                    {r.ad_nome}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.ad_id}</p>
                </TableCell>
                <TableCell
                  className="text-xs text-muted-foreground max-w-[160px] truncate"
                  title={r.campanha_nome ?? ""}
                >
                  {r.campanha_nome ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">{brl(r.gasto)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.leads_crm || "—"}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{r.mql || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{r.avancado || "—"}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-medium",
                    r.ganho > 0 && "text-emerald-700",
                  )}
                >
                  {r.ganho || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">{brl(r.cpl)}</TableCell>
                <TableCell className="text-right tabular-nums text-sm">{brl(r.custo_mql)}</TableCell>
                <TableCell className="text-right tabular-nums text-sm">{brl(r.cpa_ganho)}</TableCell>
                <TableCell className="text-right tabular-nums text-sm">{pct(r.taxa_mql)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "muted";
}) {
  return (
    <Card
      className={cn(
        "px-4 py-3",
        tone === "good" && "border-emerald-200 bg-emerald-50/40",
        tone === "muted" && "opacity-90",
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums mt-0.5">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </Card>
  );
}
