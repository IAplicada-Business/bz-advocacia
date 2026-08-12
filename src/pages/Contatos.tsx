import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLeads } from "@/hooks/useLeads";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  ALL_LEAD_STAGES,
  LEAD_STAGE_LABELS,
  type LeadStage,
} from "@/lib/leadStages";
import { isContato } from "@/lib/isContato";
import type { Lead, LeadsFilters } from "@/types/leads";

const baseFilters: LeadsFilters = {
  search: "",
  status: [], // todos os estágios legados — filtramos clientes no client
  origem: [],
  tipoProcesso: [],
  dateRange: { start: null, end: null },
  diasParado: { min: 0, max: null },
  responsavel: null,
  statusCliente: [],
};

export default function Contatos() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState("mais_recente");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);

  const queryFilters = useMemo(
    () => ({ ...baseFilters, search }),
    [search],
  );

  const { data: leads, isLoading } = useLeads(queryFilters);

  const contatos = useMemo(() => {
    if (!leads) return undefined;
    let result = leads.filter(isContato);

    if (stageFilter !== "all") {
      result = result.filter((l) => (l.stage ?? "") === stageFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortOrder) {
        case "mais_antiga":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "nome_az":
          return (a.nome_completo || "").localeCompare(b.nome_completo || "");
        case "nome_za":
          return (b.nome_completo || "").localeCompare(a.nome_completo || "");
        case "stage":
          return (a.stage || "").localeCompare(b.stage || "");
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [leads, stageFilter, sortOrder]);

  const stageOptions = ALL_LEAD_STAGES.filter((s) => s.key !== "ganho");

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-seasons text-primary">Contatos</h1>
          <p className="text-muted-foreground">
            Leads do funil que ainda não são clientes (quem já ganhou fica em Clientes)
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
          {isLoading ? "…" : `${contatos?.length ?? 0} contatos`}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setNewLeadOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo contato
        </Button>

        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, telefone ou e-mail"
            className="pl-9"
          />
        </div>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Estágio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estágios</SelectItem>
            {stageOptions.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {LEAD_STAGE_LABELS[s.key as LeadStage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mais_recente">Mais recentes</SelectItem>
            <SelectItem value="mais_antiga">Mais antigos</SelectItem>
            <SelectItem value="nome_az">Nome A–Z</SelectItem>
            <SelectItem value="nome_za">Nome Z–A</SelectItem>
            <SelectItem value="stage">Por estágio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <LeadsTable
        leads={contatos}
        isLoading={isLoading}
        onViewDetails={(lead) => {
          setInitialTab(undefined);
          setSelectedLead(lead);
        }}
        onEdit={(lead) => setEditLead(lead)}
        onAssumed={(lead) => {
          setInitialTab("conversa-bot");
          setSelectedLead(lead);
        }}
      />

      <LeadDetailsDialog
        open={selectedLead !== null}
        onClose={() => {
          setSelectedLead(null);
          setInitialTab(undefined);
        }}
        lead={selectedLead}
        initialTab={initialTab}
        onEdit={(lead) => {
          setSelectedLead(null);
          setEditLead(lead);
        }}
      />

      <NewLeadDialog
        open={newLeadOpen || !!editLead}
        onOpenChange={(open) => {
          if (!open) {
            setNewLeadOpen(false);
            setEditLead(null);
          }
        }}
        lead={editLead}
      />
    </div>
  );
}
