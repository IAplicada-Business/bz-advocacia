# Design System B&Z (CRM) v3

Rebrand modular: UI kit (pills/cards/estados) + dashboard premium dark (ink + ouro).

## Princípios

- **Marca primeiro:** ouro B&Z (`#C5A059`) em CTA, active, glow e série principal de charts.
- **Canvas ink:** fundo `#1A1F1A` (aprox.), cards glass com borda sutil e radius alto.
- **Modular:** `MetricCard`, `SegmentControl`, tabs pill e `ChartPrimitives` compartilham o padrão.
- **Gráficos com evolução natural:** Area com fill em fade + stroke ouro; eixos mínimos; tooltip com glow.
- **Segmentação objetiva:** pills 3M/6M/1A e abas Operação / Processos / Leads.

## Tokens (CSS)

| Token | Uso | Hex aprox. |
|-------|-----|------------|
| `--background` | app shell ink | `#121612` |
| `--card` | superfícies glass | `#1A1F1A` |
| `--primary` | CTA / active / glow | `#C5A059` |
| `--primary-foreground` | texto sobre ouro | ink |
| `--chart-1…5` | séries | ouro → bronze → cream → sage → âmbar |

Modo claro opcional via classe `.light` no root (não é o default do CRM).

## Componentes-chave

- `Button` / `Tabs` — pills com glow no active
- `MetricCard` — KPI número grande + trend pill
- `SegmentControl` — filtros de período / visão
- `ChartGradientDefs` + `chartTheme` — AreaCharts modernos
- Sidebar — item ativo com gradiente ouro + rail

Landing pages (`lp-*`) mantêm identidade própria e não herdam o dark CRM.
