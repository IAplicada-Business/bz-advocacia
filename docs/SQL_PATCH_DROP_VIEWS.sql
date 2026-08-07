-- ============================================================
-- PATCH: erro 42P16 cannot change data type of view column "lead_id"
-- Cole isto no SUPABASE SQL Editor e rode (idempotente).
-- https://supabase.com/dashboard/project/nvkxblrwblhvggndlfax/sql/new
-- Depois rode de novo o docs/SQL_APLICAR_NO_SUPABASE.sql inteiro (já corrigido).
-- ============================================================

DROP VIEW IF EXISTS public.vw_kanban_leads CASCADE;
DROP VIEW IF EXISTS public.vw_clientes_ativos CASCADE;
