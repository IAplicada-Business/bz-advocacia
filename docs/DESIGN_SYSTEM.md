# Design System B&Z (CRM) v3

Rebrand modular: UI kit (pills/cards/estados) + dashboards modernos com ouro da marca.
**Tema padrão = claro** (fundo off-white, cards brancos).

## Princípios

- **Marca primeiro:** ouro B&Z (`#C5A059`) em CTA, active e série principal de charts.
- **Canvas claro:** fundo ~`#F7F5F1`, cards brancos, borda suave, radius alto.
- **Modular:** `MetricCard`, `SegmentControl`, tabs pill e `ChartPrimitives` compartilham o padrão.
- **Gráficos com evolução natural:** Area com fill em fade + stroke ouro; eixos mínimos.
- **Segmentação objetiva:** pills 3M/6M/1A e abas Operação / Processos / Leads.

## Tokens (CSS)

| Token | Uso | Hex aprox. |
|-------|-----|------------|
| `--background` | app shell claro | `#F7F5F1` |
| `--card` | superfícies | `#FFFFFF` |
| `--primary` | CTA / active | `#C5A059` |
| `--primary-foreground` | texto sobre ouro | ink |
| `--chart-1…5` | séries | ouro → bronze → ink → sage → âmbar |

Tema escuro opcional via classe `.dark` no root (não é o default do CRM).

## Componentes-chave

- `Button` / `Tabs` — pills com estado active em ouro
- `MetricCard` — KPI número grande + trend pill
- `SegmentControl` — filtros de período / visão
- `ChartGradientDefs` + `chartTheme` — AreaCharts modernos
- Sidebar — item ativo com gradiente ouro + rail

Landing pages (`lp-*`) mantêm identidade própria e não herdam o tema do CRM.
