# Design System B&Z (CRM)

Rebrand modular inspirado em UI kit moderno, com cores da marca Borges & Zembruski.

## Princípios

- **Marca primeiro:** ouro B&Z (`#C5A059`) é o sinal primário (CTA, active, charts).
- **Modular:** botões, cards, tabs e inputs compartilham radius, sombra e estados.
- **Clara e respirável:** fundo stone-suave, cards brancos, hierarquia tipográfica DM Sans + Cormorant (títulos).
- **Gráficos com evolução natural:** sequência ouro → bronze → ink → sage → âmbar.

## Tokens (CSS)

| Token | Uso | Hex aprox. |
|-------|-----|------------|
| `--primary` | CTA / active | `#C5A059` |
| `--primary-foreground` | texto sobre ouro | `#1A1F1A` |
| `--foreground` | texto | `#1A1F1A` |
| `--background` | app shell | `#F7F6F3` |
| `--card` | superfícies | `#FFFFFF` |
| `--muted` | chips / tabs track | `#EFEDE8` |
| `--border` | divisórias | `#E5E1D8` |
| `--chart-1…5` | séries | ouro → … → âmbar |

## Componentes

- `Button`: pill (`rounded-full`), primary ouro + texto ink
- `Tabs`: segmented control em pill track
- `Card`: radius maior, borda suave, sombra leve
- `Sidebar`: indicador ouro à esquerda no item ativo
- Inputs: radius `xl`, focus ring ouro

Landing pages (`lp-*`) mantêm identidade própria (cream/gold) e não são alteradas por este rebrand do CRM.
