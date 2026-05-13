-- ============================================================================
-- 0003 — dodanie round_of_32 do enum match_stage
-- MŚ 2026 ma 48 drużyn → po fazie grupowej awansuje 32 drużyny (a nie 16 jak
-- w starym formacie 32-team). Stąd dodatkowa runda Round of 32.
-- Uruchom: Supabase Studio → SQL Editor → wklej i Run.
-- ============================================================================

alter type match_stage add value if not exists 'round_of_32' before 'round_of_16';
