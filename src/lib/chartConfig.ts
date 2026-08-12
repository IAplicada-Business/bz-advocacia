/** Paleta de gráficos B&Z — evolução natural ouro → bronze → cream → sage → âmbar */

export const CHART_SERIES = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

export const chartColors = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  accent: "hsl(var(--chart-1))",
  muted: "hsl(var(--muted))",
  success: "hsl(var(--chart-4))",
  warning: "hsl(var(--chart-5))",
  danger: "hsl(0 72% 54%)",
  terracota: "hsl(var(--chart-2))",
  dark: "hsl(var(--chart-3))",
  gray: "hsl(var(--muted-foreground))",
  gold: "hsl(var(--chart-1))",
  bronze: "hsl(var(--chart-2))",
  ink: "hsl(var(--chart-3))",
  sage: "hsl(var(--chart-4))",
  amber: "hsl(var(--chart-5))",
};

export const chartTheme = {
  tooltip: {
    contentStyle: {
      backgroundColor: "hsl(var(--popover))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "14px",
      boxShadow: "var(--shadow-glow)",
      color: "hsl(var(--popover-foreground))",
      fontSize: "12px",
      padding: "10px 12px",
    },
    itemStyle: {
      color: "hsl(var(--foreground))",
    },
    labelStyle: {
      color: "hsl(var(--muted-foreground))",
      marginBottom: 4,
    },
  },
  grid: {
    strokeDasharray: "3 8",
    stroke: "hsl(var(--border))",
    vertical: false,
    strokeOpacity: 0.55,
  },
  axis: {
    stroke: "transparent",
    fontSize: 11,
    tick: {
      fill: "hsl(var(--muted-foreground))",
      fontSize: 11,
    },
  },
  line: {
    strokeWidth: 2.75,
    type: "monotone" as const,
    dot: false as const,
    activeDot: {
      r: 5,
      strokeWidth: 2,
      stroke: "hsl(var(--card))",
      fill: "hsl(var(--chart-1))",
    },
  },
  bar: {
    radius: [8, 8, 0, 0] as [number, number, number, number],
  },
};

/** Gradiente SVG id helper para AreaCharts */
export function chartGradientStops(colorVar = "var(--chart-1)") {
  return {
    from: `hsl(${colorVar} / 0.4)`,
    to: `hsl(${colorVar} / 0.02)`,
  };
}
