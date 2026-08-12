import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  sub?: string;
  Icon?: LucideIcon;
  className?: string;
}

/** Card compacto das abas de Marketing — padding e hierarquia alinhados. */
export function MiniCard({ label, value, sub, Icon, className }: Props) {
  return (
    <div
      className={cn(
        "flex min-h-[5.75rem] flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-bz transition-shadow hover:shadow-glow",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="font-seasons text-xl font-semibold leading-none tracking-tight">{value}</p>
      {sub && <p className="mt-auto text-[10px] leading-snug text-muted-foreground">{sub}</p>}
    </div>
  );
}
