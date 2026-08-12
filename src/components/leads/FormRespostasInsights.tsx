import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  extractFormRespostas,
  flagLabels,
  ofertaLabel,
} from "@/lib/formRespostasDisplay";
import { cn } from "@/lib/utils";

type Props = {
  sdrContexto?: unknown;
  dadosCapturados?: unknown;
  ofertaOrigem?: string | null;
  formFlags?: string[] | null;
  formScore?: number | null;
  /** compact = painel Atendimento; default = ficha do lead */
  variant?: "compact" | "default";
  className?: string;
  title?: string;
};

/**
 * Resumo das respostas do formulário LP pra contexto da advogada
 * (Atendimento lateral + aba Qualificação / Informações).
 */
export function FormRespostasInsights({
  sdrContexto,
  dadosCapturados,
  ofertaOrigem,
  formFlags,
  formScore,
  variant = "default",
  className,
  title = "Insights do formulário",
}: Props) {
  const items = extractFormRespostas({ sdrContexto, dadosCapturados });
  const flags = flagLabels(formFlags);
  const oferta = ofertaLabel(ofertaOrigem);

  if (items.length === 0 && !oferta && flags.length === 0) {
    return null;
  }

  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "rounded-lg border bg-primary/5",
        compact ? "p-3 space-y-2" : "p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className={cn("text-primary", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        <h3
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-[11px] uppercase tracking-wide" : "text-sm",
          )}
        >
          {title}
        </h3>
      </div>

      <div className="flex flex-wrap gap-1">
        {oferta && (
          <Badge variant="secondary" className={cn(compact && "h-5 text-[10px]")}>
            {oferta}
          </Badge>
        )}
        {typeof formScore === "number" && (
          <Badge variant="outline" className={cn(compact && "h-5 text-[10px]")}>
            Score form {formScore}
          </Badge>
        )}
        {flags.map((f) => (
          <Badge
            key={f}
            variant="outline"
            className={cn(
              "bg-amber-50 text-amber-900 border-amber-200",
              compact && "h-5 text-[10px]",
            )}
          >
            {f}
          </Badge>
        ))}
      </div>

      {items.length > 0 ? (
        <dl className={cn("space-y-1.5", !compact && "sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2 sm:space-y-0")}>
          {items.map((item) => (
            <div key={item.key} className="min-w-0">
              <dt
                className={cn(
                  "uppercase tracking-wide text-muted-foreground",
                  compact ? "text-[10px]" : "text-[11px]",
                )}
              >
                {item.label}
              </dt>
              <dd className={cn("text-foreground break-words", compact ? "text-xs" : "text-sm")}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={cn("text-muted-foreground", compact ? "text-[11px]" : "text-sm")}>
          Form recebido, sem respostas estruturadas.
        </p>
      )}
    </div>
  );
}
