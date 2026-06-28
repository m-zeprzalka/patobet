-- ============================================================================
-- 0007 — faza pucharowa: 2 pkt = 1/X/2 po 90 min + kto awansuje (decyzja 2026-06-28).
--   Zastępuje krótkotrwały model z 0006 (awans + dokładny wynik).
--   * pkt 1: trafiony 1/X/2 po 90 min (regulaminowo — DOKŁADNIE jak grupowa, remis X dozwolony),
--   * pkt 2: trafiony AWANS (kto ostatecznie przechodzi dalej — z dogrywką/karnymi).
-- Faza grupowa BEZ ZMIAN: 1 pkt za 1/X/2.
--
-- Model: `prediction` (home/draw/away) = 1/X/2 po 90 min (grupowa i pucharowa).
--        Nowa kolumna `advance_pick` (home/away) = kto awansuje (tylko pucharowa).
-- Uruchom: supabase db push --db-url ...  (albo SQL Editor).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Nowa kolumna: kto awansuje (home/away). NULL = brak typu awansu / grupowa.
-- ---------------------------------------------------------------------------
alter table public.predictions
  add column if not exists advance_pick prediction_choice
    check (advance_pick is null or advance_pick in ('home', 'away'));

-- ---------------------------------------------------------------------------
-- 2) Reset typów pucharowych z poprzedniego modelu 0006 (prediction=awans).
--    Semantyki (awans+wynik) nie da się jednoznacznie zmapować na nowy model
--    (1/X/2 + awans), a meczów jeszcze nie rozegrano → użytkownicy wpiszą ponownie.
--    Dotyczy WYŁĄCZNIE meczów pucharowych. Faza grupowa nietknięta.
-- ---------------------------------------------------------------------------
delete from public.predictions
where match_id in (select id from public.matches where stage <> 'group');

-- ---------------------------------------------------------------------------
-- 3) Usuń kolumny dokładnego wyniku z 0006 (nieużywane w nowym modelu).
-- ---------------------------------------------------------------------------
alter table public.predictions
  drop column if exists home_score_pred,
  drop column if exists away_score_pred;

-- ---------------------------------------------------------------------------
-- 4) settle_match — grupowa: 1 pkt (1/X/2); pucharowa: 1 pkt (1/X/2 po 90 min)
--    + 1 pkt (awans). Idempotentne: nadpisuje points_awarded dla wszystkich typów.
-- ---------------------------------------------------------------------------
create or replace function public.settle_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match    public.matches;
  v_result   prediction_choice;   -- poprawny 1/X/2 po 90 min
  v_advancer prediction_choice;   -- kto awansuje (home/away)
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

  -- 1/X/2 po 90 min wymaga wyniku (grupowa i pucharowa)
  if v_match.home_score is null or v_match.away_score is null then
    raise exception 'Match requires home_score and away_score (wynik po 90 min)';
  end if;
  v_result := case
    when v_match.home_score > v_match.away_score then 'home'::prediction_choice
    when v_match.home_score < v_match.away_score then 'away'::prediction_choice
    else 'draw'::prediction_choice
  end;

  if v_match.stage = 'group' then
    -- --- Faza grupowa: 1 pkt za trafiony 1/X/2 (bez zmian) ---
    update public.predictions
    set points_awarded = case when prediction = v_result then 1 else 0 end
    where match_id = p_match_id;

  else
    -- --- Faza pucharowa: 1 pkt 1/X/2 (90 min) + 1 pkt awans ---
    if v_match.winner_team_id is null then
      raise exception 'Knockout match requires winner_team_id';
    end if;
    v_advancer := case
      when v_match.winner_team_id = v_match.home_team_id then 'home'::prediction_choice
      when v_match.winner_team_id = v_match.away_team_id then 'away'::prediction_choice
      else null
    end;
    if v_advancer is null then
      raise exception 'winner_team_id matches neither home nor away team';
    end if;

    update public.predictions
    set points_awarded =
      (case when prediction = v_result then 1 else 0 end)
      + (case when advance_pick = v_advancer then 1 else 0 end)
    where match_id = p_match_id;
  end if;

  update public.matches
  set settled_at = now()
  where id = p_match_id;
end;
$$;

grant execute on function public.settle_match(uuid) to authenticated, service_role;
