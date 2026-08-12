import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  sub?: string;
  Icon?: LucideIcon;
  className?: string;
}

/** Card compacto das abas de Marketing — glass + tipografia objetiva. */
export function MiniCard({ label, value, sub, Icon, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-card/80 p-3.5 shadow-bz backdrop-blur-sm transition-shadow hover:shadow-glow",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="mt-1.5 font-seasons text-xl font-semibold leading-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{sub}</p>}
    </div>
  );
}
