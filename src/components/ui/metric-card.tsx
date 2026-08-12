import type { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  accent?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  action?: ReactNode;
  /** Valor com cor custom (ex.: positivo/negativo). */
  valueClassName?: string;
};

/** KPI / holding card — padding e hierarquia alinhados em todos os menus. */
export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  trendLabel,
  accent = false,
  loading,
  onClick,
  className,
  action,
  valueClassName,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-5">
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const Comp = onClick ? "button" : "div";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        accent && "border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-[0_0_32px_-12px_hsl(var(--primary)/0.45)]",
        className,
      )}
    >
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/25 blur-3xl"
        />
      )}
      <CardContent className="relative p-5 md:p-5">
        <Comp
          type={onClick ? "button" : undefined}
          onClick={onClick}
          className={cn(
            "flex w-full flex-col gap-2.5 text-left",
            onClick && "outline-none",
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </p>
            </div>
            {action}
          </div>

          <p
            className={cn(
              "font-seasons text-3xl font-semibold leading-none tracking-tight text-foreground md:text-[2rem]",
              valueClassName,
            )}
          >
            {value}
          </p>

          {(sub || trend !== undefined) && (
            <div className="flex flex-wrap items-center gap-2">
              {trend !== undefined && (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    trend >= 0
                      ? "bg-[hsl(var(--chart-4)/0.2)] text-[hsl(var(--chart-4))]"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {trend > 0 ? "+" : ""}
                  {trend}%
                  {trendLabel ? ` ${trendLabel}` : ""}
                </span>
              )}
              {sub && (
                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{sub}</p>
              )}
            </div>
          )}
        </Comp>
      </CardContent>
    </Card>
  );
}
