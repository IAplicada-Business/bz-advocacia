import { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/types/leads";
import { LeadCard } from "./LeadCard";
import { StageGuardDialog } from "./StageGuardDialog";
import { useDeleteLead, useUpdateLeadStage } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LEAD_STAGES,
  LEAD_STAGE_PERDIDO,
  LEAD_STAGE_COLORS,
  inferStageFromLegacy,
  type LeadStage,
} from "@/lib/leadStages";
import { checkStageGuards, type StageGuard } from "@/lib/leadStageGuards";

interface LeadsKanbanProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
  onAssumed?: (lead: Lead) => void;
}

type ColunaId = LeadStage;

const COLLAPSED_STORAGE_KEY = "leads-kanban-colunas-v2";

function loadCollapsed(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

const columns: { id: ColunaId; titulo: string; color: string }[] = [
  ...LEAD_STAGES.map((s) => ({
    id: s.key as ColunaId,
    titulo: s.label,
    color: LEAD_STAGE_COLORS[s.key],
  })),
  {
    id: LEAD_STAGE_PERDIDO.key,
    titulo: LEAD_STAGE_PERDIDO.label,
    color: LEAD_STAGE_COLORS.perdido,
  },
];

function resolveColuna(lead: Lead): ColunaId {
  const stage = inferStageFromLegacy(lead);
  // Desqualificados (pensão/guarda, ticket mínimo) ficam na coluna Perdido
  if (stage === "desqualificado") return "perdido";
  return stage;
}

function SortableLeadCard({
  lead,
  onViewDetails,
  onAssumed,
  onDelete,
  onMarkLost,
  onMarkNaoLead,
}: {
  lead: Lead;
  onViewDetails: (lead: Lead) => void;
  onAssumed?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onMarkLost?: (lead: Lead) => void;
  onMarkNaoLead?: (lead: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard
        lead={lead}
        onClick={() => onViewDetails(lead)}
        onAssumed={onAssumed}
        onDelete={onDelete}
        onMarkLost={onMarkLost}
        onMarkNaoLead={onMarkNaoLead}
      />
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-2 space-y-2 max-h-[60vh] overflow-y-auto rounded-lg transition-colors ${
        isOver ? "bg-accent/50 ring-2 ring-primary/30" : ""
      }`}
    >
      {children}
    </div>
  );
}

function CollapsedColumn({
  id,
  titulo,
  count,
  color,
  onExpand,
}: {
  id: ColunaId;
  titulo: string;
  count: number;
  color: string;
  onExpand: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={onExpand}
      title={`Expandir ${titulo}`}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg border border-t-4 bg-muted/30 transition-colors hover:bg-accent",
        "w-12 flex-col justify-start px-0 py-3",
        color,
        isOver && "bg-accent/50 ring-2 ring-primary/30",
      )}
    >
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-xs font-semibold [writing-mode:vertical-rl] rotate-180">
        {titulo}
      </span>
      <span className="shrink-0 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {count}
      </span>
    </button>
  );
}

export function LeadsKanban({ leads, isLoading, onViewDetails, onAssumed }: LeadsKanbanProps) {
  const queryClient = useQueryClient();
  const deleteLead = useDeleteLead();
  const updateStage = useUpdateLeadStage();
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToLose, setLeadToLose] = useState<Lead | null>(null);
  const [leadNaoLead, setLeadNaoLead] = useState<Lead | null>(null);
  const [tipoNaoLead, setTipoNaoLead] = useState<string>("institucional");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(loadCollapsed);
  const [guardState, setGuardState] = useState<{
    lead: Lead;
    targetStage: LeadStage;
    missing: StageGuard[];
  } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(collapsedColumns));
    } catch {
      /* ignore */
    }
  }, [collapsedColumns]);

  const toggleColuna = (id: ColunaId) =>
    setCollapsedColumns((prev) => ({ ...prev, [id]: !prev[id] }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    const ch = supabase
      .channel("leads-kanban-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads_geral" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_submissions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient]);

  const leadsGrouped = useMemo(() => {
    const acc = Object.fromEntries(columns.map((c) => [c.id, [] as Lead[]])) as Record<
      ColunaId,
      Lead[]
    >;
    (leads || []).forEach((lead) => {
      acc[resolveColuna(lead)].push(lead);
    });
    return acc;
  }, [leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const commitMove = async (
    lead: Lead,
    targetStage: LeadStage,
    overrideMissing?: StageGuard[],
  ) => {
    try {
      await updateStage.mutateAsync({
        id: lead.id,
        stage: targetStage,
        leadGeralId: lead.lead_geral_id,
        overrideMissing: overrideMissing?.map((g) => ({ field: g.field, label: g.label })),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Erro ao mover lead",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    let targetCol: ColunaId | null = null;
    if (columns.some((c) => c.id === overId)) {
      targetCol = overId as ColunaId;
    } else {
      const alvo = leads?.find((l) => l.id === overId);
      if (alvo) targetCol = resolveColuna(alvo);
    }
    if (!targetCol) return;

    const lead = leads?.find((l) => l.id === leadId);
    if (!lead) return;

    const currentCol = resolveColuna(lead);
    if (currentCol === targetCol) return;

    if (targetCol === "perdido") {
      setLeadToLose(lead);
      return;
    }

    const missing = checkStageGuards(lead, targetCol);
    if (missing.length > 0) {
      setGuardState({ lead, targetStage: targetCol, missing });
      return;
    }

    await commitMove(lead, targetCol);
  };

  const handleConfirmLost = async () => {
    if (!leadToLose) return;
    const lead = leadToLose;
    setLeadToLose(null);
    try {
      await updateStage.mutateAsync({
        id: lead.id,
        stage: "perdido",
        leadGeralId: lead.lead_geral_id,
      });
      toast({ title: "Lead marcado como perdido" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Erro ao marcar como perdido",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div key={col.id} className="w-[240px] shrink-0">
            <Skeleton className="mb-3 h-8 w-full" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activeLead = activeId ? leads?.find((l) => l.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Uma linha só: scroll horizontal — sem flex-wrap (quebrava Ganho/Perdido) */}
      <div className="flex min-h-[600px] flex-nowrap gap-3 overflow-x-auto pb-2">
        {columns.map((coluna) => {
          const colLeads = leadsGrouped[coluna.id] || [];

          if (collapsedColumns[coluna.id]) {
            return (
              <CollapsedColumn
                key={coluna.id}
                id={coluna.id}
                titulo={coluna.titulo}
                count={colLeads.length}
                color={coluna.color}
                onExpand={() => toggleColuna(coluna.id)}
              />
            );
          }

          return (
            <div
              key={coluna.id}
              className={`w-[240px] shrink-0 border rounded-lg ${coluna.color} border-t-4 bg-muted/30`}
            >
              <div className="flex items-start justify-between gap-2 p-3 border-b">
                <div>
                  <h3 className="font-semibold text-sm">{coluna.titulo}</h3>
                  <span className="text-xs text-muted-foreground">{colLeads.length} leads</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground"
                  onClick={() => toggleColuna(coluna.id)}
                  title={`Ocultar ${coluna.titulo}`}
                  aria-label={`Ocultar coluna ${coluna.titulo}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <DroppableColumn id={coluna.id}>
                {colLeads.map((lead) => (
                  <SortableLeadCard
                    key={lead.id}
                    lead={lead}
                    onViewDetails={onViewDetails}
                    onAssumed={onAssumed}
                    onDelete={setLeadToDelete}
                    onMarkNaoLead={(l) => {
                      setLeadNaoLead(l);
                      setTipoNaoLead("institucional");
                    }}
                    onMarkLost={
                      coluna.id !== "perdido" && coluna.id !== "ganho"
                        ? setLeadToLose
                        : undefined
                    }
                  />
                ))}
                {colLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum lead</p>
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} onClick={() => {}} /> : null}
      </DragOverlay>

      <StageGuardDialog
        open={!!guardState}
        onOpenChange={(open) => !open && setGuardState(null)}
        leadName={guardState?.lead.nome_completo ?? ""}
        targetStage={guardState?.targetStage ?? "mql"}
        missing={guardState?.missing ?? []}
        onCancel={() => setGuardState(null)}
        onConfirmOverride={async () => {
          if (!guardState) return;
          const { lead, targetStage, missing } = guardState;
          setGuardState(null);
          await commitMove(lead, targetStage, missing);
        }}
      />

      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.nome_completo}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (leadToDelete) {
                  deleteLead.mutate(leadToDelete.id);
                  setLeadToDelete(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!leadToLose} onOpenChange={(open) => !open && setLeadToLose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar <strong>{leadToLose?.nome_completo}</strong> como
              perdido? O lead será movido para a coluna &quot;Perdido&quot; e o bot encerra o atendimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmLost}
            >
              Marcar perdido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!leadNaoLead} onOpenChange={(open) => !open && setLeadNaoLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como não-lead</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{leadNaoLead?.nome_completo}</strong> sai do funil de leads.
              Escolha a categoria:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={tipoNaoLead} onValueChange={setTipoNaoLead}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="institucional">Institucional (vara, cartório, repartição)</SelectItem>
                <SelectItem value="fornecedor">Fornecedor</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
                <SelectItem value="pessoal">Contato pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!leadNaoLead) return;
                try {
                  let leadGeralId = leadNaoLead.lead_geral_id;
                  if (!leadGeralId) {
                    const { data: novoId, error: rpcErr } = await supabase.rpc(
                      "garantir_lead_geral_para_contact",
                      { p_contact_submission_id: leadNaoLead.id },
                    );
                    if (rpcErr) throw rpcErr;
                    leadGeralId = novoId as string;
                  }
                  const { error: updErr } = await supabase
                    .from("leads_geral")
                    .update({ tipo_contato: tipoNaoLead, bot_pausado: true })
                    .eq("id", leadGeralId);
                  if (updErr) throw updErr;
                  queryClient.invalidateQueries({ queryKey: ["leads"] });
                  queryClient.invalidateQueries({ queryKey: ["leads-kanban"] });
                  toast({ title: `Marcado como ${tipoNaoLead}` });
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : String(err);
                  toast({ title: "Erro ao marcar", description: message, variant: "destructive" });
                } finally {
                  setLeadNaoLead(null);
                }
              }}
            >
              Marcar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
