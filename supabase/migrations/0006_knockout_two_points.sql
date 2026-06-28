-- ============================================================================
-- 0006 — faza pucharowa: 2 pkt na mecz (decyzja produktowa 2026-06-28).
--   * 1 pkt za trafienie awansującej drużyny (kto przechodzi dalej —
--     niezależnie od dogrywki/karnych),
--   * 1 pkt za dokładny wynik po 90 min (home_score / away_score = ft).
-- Faza grupowa BEZ ZMIAN: nadal 1 pkt za trafiony 1/X/2 (po 90 min).
--
-- Nowe kolumny w predictions na typowany wynik (tylko dla pucharowych; dla
-- grupowych zostają NULL). Kolumna `prediction` (home/away) w pucharowej oznacza
-- "kto awansuje" — w grupowej dalej znaczy 1/X/2.
--
-- Bezpieczne dla istniejących danych:
--   * tylko DODAJEMY kolumny (istniejące typy bez zmian),
--   * settle_match jest idempotentny i przeliczy mecz dopiero przy ponownym
--     rozliczeniu — już rozliczonych meczów grupowych NIE ruszamy (zostają 1 pkt),
--   * brak backfillu / konwersji danych.
-- Uruchom: Supabase Studio → SQL Editor → wklej i Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Kolumny na typowany dokładny wynik (po 90 min). NULL = brak typu wyniku.
-- ---------------------------------------------------------------------------
alter table public.predictions
  add column if not exists home_score_pred integer
    check (home_score_pred is null or (home_score_pred >= 0 and home_score_pred <= 99)),
  add column if not exists away_score_pred integer
    check (away_score_pred is null or (away_score_pred >= 0 and away_score_pred <= 99));

-- ---------------------------------------------------------------------------
-- 2) settle_match — punktacja zależna od fazy:
--      grupowa : 1 pkt za trafiony 1/X/2,
--      pucharowa: 1 pkt za awans + 1 pkt za dokładny wynik po 90 min.
--    Idempotentne: nadpisuje points_awarded dla wszystkich typów meczu.
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
    -- --- Faza grupowa: 1 pkt za trafiony 1/X/2 (bez zmian) ---
    if v_match.home_score is null or v_match.away_score is null then
      raise exception 'Group match requires home_score and away_score';
    end if;
    v_correct := case
      when v_match.home_score > v_match.away_score then 'home'::prediction_choice
      when v_match.home_score < v_match.away_score then 'away'::prediction_choice
      else 'draw'::prediction_choice
    end;

    update public.predictions
    set points_awarded = case when prediction = v_correct then 1 else 0 end
    where match_id = p_match_id;

  else
    -- --- Faza pucharowa: 1 pkt awans + 1 pkt dokładny wynik (po 90 min) ---
    if v_match.winner_team_id is null then
      raise exception 'Knockout match requires winner_team_id';
    end if;
    if v_match.home_score is null or v_match.away_score is null then
      raise exception 'Knockout match requires home_score and away_score (wynik po 90 min)';
    end if;
    v_correct := case
      when v_match.winner_team_id = v_match.home_team_id then 'home'::prediction_choice
      when v_match.winner_team_id = v_match.away_team_id then 'away'::prediction_choice
      else null
    end;
    if v_correct is null then
      raise exception 'winner_team_id matches neither home nor away team';
    end if;

    update public.predictions
    set points_awarded =
      -- pkt za awans
      (case when prediction = v_correct then 1 else 0 end)
      -- pkt za dokładny wynik po 90 min (NULL-owe typy wyniku → 0)
      + (case
           when home_score_pred = v_match.home_score
            and away_score_pred = v_match.away_score then 1
           else 0
         end)
    where match_id = p_match_id;
  end if;

  update public.matches
  set settled_at = now()
  where id = p_match_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Granty (create or replace zachowuje uprawnienia, ale dla pewności jawnie).
-- ---------------------------------------------------------------------------
grant execute on function public.settle_match(uuid) to authenticated, service_role;
