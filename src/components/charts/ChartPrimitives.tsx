import { chartTheme, CHART_SERIES } from "@/lib/chartConfig";

type Grad = {
  id: string;
  color?: string;
  fromOpacity?: number;
  toOpacity?: number;
  glow?: boolean;
};

/** Defs SVG reutilizáveis — fills com fade + glow opcional (padrão dashboard). */
export function ChartGradientDefs({ gradients }: { gradients: Grad[] }) {
  return (
    <defs>
      {gradients.map((g) => (
        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={g.color ?? "hsl(var(--chart-1))"}
            stopOpacity={g.fromOpacity ?? 0.4}
          />
          <stop
            offset="100%"
            stopColor={g.color ?? "hsl(var(--chart-1))"}
            stopOpacity={g.toOpacity ?? 0.02}
          />
        </linearGradient>
      ))}
      {gradients
        .filter((g) => g.glow !== false)
        .map((g) => (
          <filter key={`${g.id}-glow`} id={`${g.id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
    </defs>
  );
}

export function seriesColor(index: number) {
  return CHART_SERIES[index % CHART_SERIES.length];
}

export const axisTick = {
  fill: "hsl(var(--muted-foreground))",
  fontSize: 11,
};

export const chartTooltipStyle = chartTheme.tooltip.contentStyle;

export const modernGridProps = {
  strokeDasharray: "3 8",
  stroke: "hsl(var(--border))",
  vertical: false,
  strokeOpacity: 0.55,
} as const;

export const modernAxisProps = {
  tickLine: false as const,
  axisLine: false as const,
  tick: axisTick,
};
