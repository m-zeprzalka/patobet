-- ============================================================================
-- 0004 — teams.code unique constraint
-- Wymagane dla sync z OpenFootball (upsert per FIFA code, bo OpenFootball
-- nie używa api_id z api-football.com).
-- Uruchom: Supabase Studio → SQL Editor → wklej i Run.
-- ============================================================================

-- Najpierw scal duplikaty po (code) jeśli istnieją (przed dodaniem unique).
-- Zostawia najstarszy wiersz, kasuje pozostałe.
delete from public.teams t
using public.teams t2
where t.code = t2.code
  and t.created_at > t2.created_at;

alter table public.teams
  add constraint teams_code_unique unique (code);
