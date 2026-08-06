# Plano de unificação de leads (FASE A — mapeamento)

> **Status:** só documentação. Nenhuma tabela foi modificada nesta fase.  
> **Recomendação (FASE B):** `leads_geral` como fonte única (mais rica em SDR/Meta).

Hoje existem **duas fontes** de leads:

| Tabela | Origem histórica | Uso principal |
|--------|------------------|---------------|
| `contact_submissions` | Form/CRM Lovable | Kanban, clientes, financeiro, documentos, processos |
| `leads_geral` | Bot SDR / Meta Lead Ads | WhatsApp inbound, atendimento, campanhas |

Há vínculo parcial via `contact_submissions.lead_geral_id` e a view `vw_pipeline_b_z` / `vw_kanban_leads`.

---

## 1. Consumidores frontend — `contact_submissions`

- `src/hooks/useLeads.ts` (kanban via `vw_kanban_leads`, fallback tabela)
- `src/hooks/useClientesAtivos.ts`
- `src/lib/leadStatusAutomation.ts`
- `src/components/ContactForm.tsx`
- `src/components/leads/*` (Kanban, Table, Header, DetailsDialog)
- `src/components/atendimento/LeadInfoPanel.tsx`
- `src/components/processos/*` (Filters, Header, Details*)
- `src/components/documentos/GerarContratoForm.tsx`, `GerarProcuracaoForm.tsx`
- `src/components/financeiro/*` + `src/hooks/financeiro/*`
- `src/hooks/useAnalytics.ts`, `useDashboard*`, `useRelatorios*`, `useContratos.ts`, `useDemandas.ts`, `useProcessos.ts`, `useImportClientesPlanilha.ts`, `useGlobalSearch.ts`, `useAniversariantes.ts`, `useMarketingCsvAnalytics.ts`, `useServiceDistribution.ts`, `usePagamentos.ts`, `useCreditosCondicionais.ts`, `useSubtarefas.ts`
- `src/pages/Leads.tsx`, `src/types/leads.ts`, `src/types/demandas.ts`

## 2. Consumidores frontend — `leads_geral`

- `src/hooks/useLeads.ts` (enriquecimento bot / fallback)
- `src/hooks/useLeadsGeral.ts`
- `src/components/atendimento/{ChatPanel,ConversasList,LeadInfoPanel}.tsx`
- `src/components/leads/{BacklogLeads,ConversaBot,LeadBotBadge,LeadDetailsDialog,LeadsKanban}.tsx`
- `src/pages/Leads.tsx`, `src/types/leads.ts`, `src/lib/leadStages.ts`

## 3. Edge Functions — gravação / leitura

### `contact_submissions`
- `receive-sheet-lead` — grava leads de planilha/webhook
- `lp-lead-submit` — LPs
- `whatsapp-inbound` — espelha / vincula
- `campanha-recuperacao-form`
- `ai-chat`
- `_shared/db.ts`

### `leads_geral`
- `whatsapp-inbound` — fonte principal do bot
- `on-new-lead`
- `assumir-conversa`, `reatribuir-conversa`, `enviar-msg-humano`
- `cron-followup`, `campanha-timeout-3d`, `campanha-recuperacao-form`
- `lp-lead-submit`
- `_shared/db.ts`

---

## 4. Diff de schema (types.ts atual)

Colunas **só em `contact_submissions`** (amostra crítica para migrar):

- Identidade CRM: `nome_completo`, `telefone`, `email`, `cpf`, `rg`, …
- Funil legado: `estagio`, `status`, `status_cliente`, `origem`, `prioridade`
- Captação: `utm_*`, `como_conheceu`, `mensagem`, `lgpd_consent`, `tipo_processo`
- Vínculo: `lead_geral_id`
- Docs/endereço/financeiros de proposta: `pasta_drive_url`, `valor_proposta`, …

Colunas **só em `leads_geral`** (manter na fonte única):

- SDR: `status_sdr`, `fluxo_sdr`, `etapa_qualificacao`, `bot_pausado`, `score`, `dados_capturados`
- Meta Ads: `campaign_*`, `adset_*`, `ad_*`, `platform`, `is_organic`
- Atendimento: `humano_responsavel`, `ultima_mensagem_em`, `tipo_contato`, …

**Já compartilhadas / alinhadas no Épico 1:** `stage`, `stage_entered_at`, `converted_at`, campos de guard (`valor_estimado`, `area_juridica`, …).

---

## 5. Próximas fases (NÃO executar sem aprovação)

### FASE B — decidir fonte única
1. Eleger `leads_geral` como principal
2. Migration: adicionar em `leads_geral` as colunas CRM faltantes (`utm_*`, `tipo_processo`, docs pessoais, etc.)
3. Backfill a partir de `contact_submissions` (match por telefone / `lead_geral_id`)
4. Coluna `contact_submission_id` (ou manter `lead_geral_id` reverso) para rastreio

### FASE C — apontar tudo pra `leads_geral`
1. Refatorar `useLeads` → só `leads_geral` / views
2. `receive-sheet-lead` e `lp-lead-submit` gravam em `leads_geral`
3. Deprecar `useLeadsGeral` (fundir em `useLeads`)
4. Dual-write ~1 semana
5. Renomear `contact_submissions` → `contact_submissions_deprecated`

### Riscos
- Financeiro (`acordos_financeiros.cliente_id`) e processos (`processos.lead_id`) apontam pra `contact_submissions`
- Migrar FKs é o passo mais arriscado — precisa plano de cutover dedicado

---

## 6. Critério de aceite desta FASE A

- [x] Inventário frontend + edge functions documentado
- [x] Diff de schema documentado
- [x] Nenhuma migration de unificação aplicada neste passo
