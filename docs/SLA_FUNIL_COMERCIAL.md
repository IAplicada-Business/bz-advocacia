# SLA por etapa do funil comercial

Documento operacional interno da Borges & Zembruski. Cada etapa do pipeline tem um tempo máximo aceitável; estouro aciona follow-up (bot ou humano).

| Etapa | SLA máximo | O que fazer se estourar |
|-------|-----------|-------------------------|
| MQL | 24h | Bot Cláudia inicia conversa; se ninguém responde em 24h, cai em fila manual |
| Conectado | 3 dias | Se lead não avança em 3 dias, follow-up automático via cron |
| SAL | 5 dias | Advogada qualificou mas não agendou; follow-up manual |
| Reunião Agendada | 2 dias antes da reunião | Confirmar reunião com o lead 48h antes |
| Reunião Realizada | 3 dias | Enviar proposta em até 3 dias após a reunião |
| Proposta | 7 dias | Se lead não responde à proposta em 7 dias, ligar |
| Contrato | 5 dias | Se assinatura não sai em 5 dias, reforço + apoio |
| Ganho | — | Fechado. Iniciar onboarding em até 48h |

## Como a UI usa isso

- Campo `sla_days` em `src/lib/leadStages.ts`
- Coluna `stage_entered_at` em `leads_geral` e `contact_submissions`
- Badge amarelo no `LeadCard` quando `days_in_stage > sla_days`

## Notas

- SLA de "Reunião Agendada" é relativo à data da reunião (`reuniao_data`), não ao tempo na coluna.
- Leads em `ganho` com `converted_at` > 30 dias saem do kanban (`vw_kanban_leads`) e passam a ser tratados como cliente ativo.
