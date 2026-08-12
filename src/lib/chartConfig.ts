/** Paleta de gráficos B&Z — evolução natural ouro → bronze → ink → sage → âmbar */

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
  danger: "hsl(0 72% 51%)",
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
      backgroundColor: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "12px",
      boxShadow: "var(--shadow-card)",
      color: "hsl(var(--card-foreground))",
      fontSize: "12px",
    },
  },
  grid: {
    strokeDasharray: "4 4",
    stroke: "hsl(var(--border))",
  },
  axis: {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 11,
  },
};

/** Gradiente SVG id helper para AreaCharts */
export function chartGradientStops(colorVar = "var(--chart-1)") {
  return {
    from: `hsl(${colorVar} / 0.35)`,
    to: `hsl(${colorVar} / 0.02)`,
  };
}
