# Aplicar migrations do funil comercial (Épico 1)

O MCP Supabase desta sessão **não tem permissão** no projeto `nvkxblrwblhvggndlfax`.
As migrations foram commitadas no repo; aplicar com CLI autenticada:

```bash
supabase link --project-ref nvkxblrwblhvggndlfax
supabase db push
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

## Ordem

1. `20260806130000_lead_stage_pipeline.sql` — enum `lead_stage` + coluna `stage`
2. `20260806130100_lead_stage_guards.sql` — campos de guard + `stage_transitions_override`
3. `20260806130200_backfill_lead_stages_final.sql` — edge cases (mensagens/qualificações/contrato)
4. `20260806130300_separate_ganho_cliente_ativo.sql` — `converted_at`, `vw_kanban_leads`, `vw_clientes_ativos`
5. `20260806130400_stage_entered_at_sla.sql` — SLA / `stage_entered_at`

## Validação

```sql
select stage, count(*) from leads_geral group by stage order by 1;
select stage, count(*) from contact_submissions group by stage order by 1;
select count(*) from leads_geral where stage is null;          -- 0
select count(*) from contact_submissions where stage is null; -- 0
```

## Credenciais (.env)

`.env` estava no histórico git (`git log --all --full-history -- .env`).
Foi removido do tracking nesta mudança, mas **valores antigos podem ter vazado** —
rotacionar Z-API, Anthropic, Meta e qualquer outra secret que tenha aparecido no histórico.
