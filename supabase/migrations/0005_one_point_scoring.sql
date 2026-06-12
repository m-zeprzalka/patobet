-- ============================================================================
-- 0005 — punktacja: 1 pkt za trafiony typ 1/X/2 (decyzja produktowa 2026-06-12,
-- zastępuje wcześniejsze 3 pkt). Plus:
--   * leaderboard liczy trafienia jako points_awarded > 0 (odporne na zmianę wagi),
--   * konwersja ewentualnych historycznych rozliczeń 3 → 1,
--   * jawny grant execute dla service_role (cron / sync).
-- Bezpieczne dla istniejących użytkowników: bez zmian struktury tabel,
-- tylko funkcja + widok + idempotentny update danych.
-- Uruchom: Supabase Studio → SQL Editor → wklej i Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) settle_match — 1 pkt za trafienie (idempotentne, nadpisuje przy re-syncu)
-- ---------------------------------------------------------------------------
create or replace function public.settle_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match   public.matches;
  v_correct prediction_choice;
begin
  -- Autoryzacja: admin lub service_role
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
    if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
      raise exception 'Forbidden: admin only';
    end if;
  end if;

  select * into v_match from public.matches where id = p_match_id;
  if v_match.id is null then
    raise exception 'Match not found: %', p_match_id;
  end if;

  if v_match.status <> 'finished' then
    raise exception 'Match status is %, must be finished', v_match.status;
  end if;

  if v_match.stage = 'group' then
    if v_match.home_score is null or v_match.away_score is null then
      raise exception 'Group match requires home_score and away_score';
    end if;
    v_correct := case
      when v_match.home_score > v_match.away_score then 'home'::prediction_choice
      when v_match.home_score < v_match.away_score then 'away'::prediction_choice
      else 'draw'::prediction_choice
    end;
  else
    if v_match.winner_team_id is null then
      raise exception 'Knockout match requires winner_team_id';
    end if;
    v_correct := case
      when v_match.winner_team_id = v_match.home_team_id then 'home'::prediction_choice
      when v_match.winner_team_id = v_match.away_team_id then 'away'::prediction_choice
      else null
    end;
    if v_correct is null then
      raise exception 'winner_team_id matches neither home nor away team';
    end if;
  end if;

  -- Idempotentnie: nadpisz points_awarded dla wszystkich predictions
  update public.predictions
  set points_awarded = case when prediction = v_correct then 1 else 0 end
  where match_id = p_match_id;

  update public.matches
  set settled_at = now()
  where id = p_match_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Leaderboard — trafienie = points_awarded > 0 (zamiast = 3)
--    Kolumny identyczne jak w 0001, więc create or replace przejdzie bez drop.
-- ---------------------------------------------------------------------------
create or replace view public.leaderboard as
select
  p.id                                                                                                as user_id,
  p.display_name,
  p.avatar_url,
  coalesce(sum(pr.points_awarded), 0)::int                                                            as total_points,
  count(pr.id) filter (where pr.points_awarded is not null)::int                                       as predictions_settled,
  count(pr.id)::int                                                                                    as predictions_made,
  count(pr.id) filter (where pr.points_awarded > 0)::int                                              as correct_predictions,
  case
    when count(pr.id) filter (where pr.points_awarded is not null) > 0
    then round(
      100.0
      * count(pr.id) filter (where pr.points_awarded > 0)
      / nullif(count(pr.id) filter (where pr.points_awarded is not null), 0),
      1
    )
    else 0
  end                                                                                                  as accuracy_pct
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
where p.display_name is not null
group by p.id, p.display_name, p.avatar_url;

-- ---------------------------------------------------------------------------
-- 3) Konwersja historycznych rozliczeń 3 pkt → 1 pkt (idempotentne; obecnie
--    w bazie nie ma rozliczonych typów, ale zostawiamy dla bezpieczeństwa).
-- ---------------------------------------------------------------------------
update public.predictions set points_awarded = 1 where points_awarded = 3;

-- ---------------------------------------------------------------------------
-- 4) Jawne granty dla service_role (cron sync woła settle_match przez RPC).
--    Działało dotąd przez domyślne uprawnienia, ale jawnie = odporniej.
-- ---------------------------------------------------------------------------
grant execute on function public.settle_match(uuid)                                   to service_role;
grant execute on function public.admin_set_match_result(uuid, integer, integer, uuid) to service_role;
grant select on public.leaderboard to authenticated;
