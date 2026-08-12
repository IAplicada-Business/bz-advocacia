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
};

/** KPI / holding card no estilo dashboard premium (número grande + pills). */
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
      <CardContent className="relative p-5">
        <Comp
          type={onClick ? "button" : undefined}
          onClick={onClick}
          className={cn("w-full text-left", onClick && "outline-none")}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </p>
            <div className="flex items-center gap-2">
              {action}
              {Icon && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Icon className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
          <p className="font-seasons text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {value}
          </p>
          {(sub || trend !== undefined) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
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
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
          )}
        </Comp>
      </CardContent>
    </Card>
  );
}
