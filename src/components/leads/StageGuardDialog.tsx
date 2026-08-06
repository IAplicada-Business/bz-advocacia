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
import type { StageGuard } from "@/lib/leadStageGuards";
import { LEAD_STAGE_LABELS, type LeadStage } from "@/lib/leadStages";

interface StageGuardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  targetStage: LeadStage;
  missing: StageGuard[];
  onConfirmOverride: () => void;
  onCancel: () => void;
}

export function StageGuardDialog({
  open,
  onOpenChange,
  leadName,
  targetStage,
  missing,
  onConfirmOverride,
  onCancel,
}: StageGuardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Requisitos pendentes</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Para mover <strong className="text-foreground">{leadName}</strong> para{" "}
                <strong className="text-foreground">
                  {LEAD_STAGE_LABELS[targetStage]}
                </strong>
                , preencha:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {missing.map((g) => (
                  <li key={g.field}>{g.label}</li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmOverride}>
            Mover mesmo assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
