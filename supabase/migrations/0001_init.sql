-- ============================================================================
-- Mundial z ekipą — migracja inicjalna
-- Tabele, RLS, view leaderboard, funkcje (auto-profile, settle_match, admin)
-- Uruchom: Supabase Studio → SQL Editor → wklej i Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type match_stage as enum ('group','round_of_16','quarter','semi','third_place','final');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('scheduled','live','finished','postponed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prediction_choice as enum ('home','draw','away');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tabele
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text unique,
  avatar_url   text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.teams (
  id            uuid primary key default gen_random_uuid(),
  api_id        integer unique,
  name          text not null,
  code          text not null,
  flag_url      text,
  group_letter  text check (group_letter is null or group_letter ~ '^[A-L]$'),
  created_at    timestamptz not null default now()
);

create table if not exists public.matches (
  id              uuid primary key default gen_random_uuid(),
  api_id          integer unique,
  home_team_id    uuid not null references public.teams(id),
  away_team_id    uuid not null references public.teams(id),
  kickoff_at      timestamptz not null,
  stage           match_stage not null,
  group_letter    text,
  status          match_status not null default 'scheduled',
  home_score      integer,
  away_score      integer,
  winner_team_id  uuid references public.teams(id),
  settled_at      timestamptz,
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

create table if not exists public.predictions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  match_id        uuid not null references public.matches(id) on delete cascade,
  prediction      prediction_choice not null,
  points_awarded  integer,
  submitted_at    timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists matches_kickoff_idx on public.matches (kickoff_at);
create index if not exists matches_status_kickoff_idx on public.matches (status, kickoff_at);
create index if not exists predictions_user_idx on public.predictions (user_id);
create index if not exists predictions_match_idx on public.predictions (match_id);

-- ---------------------------------------------------------------------------
-- Auto-create profile when auth.users row appears
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Leaderboard view
-- ---------------------------------------------------------------------------
create or replace view public.leaderboard as
select
  p.id                                                                                                as user_id,
  p.display_name,
  p.avatar_url,
  coalesce(sum(pr.points_awarded), 0)::int                                                            as total_points,
  count(pr.id) filter (where pr.points_awarded is not null)::int                                       as predictions_settled,
  count(pr.id)::int                                                                                    as predictions_made,
  count(pr.id) filter (where pr.points_awarded = 3)::int                                              as correct_predictions,
  case
    when count(pr.id) filter (where pr.points_awarded is not null) > 0
    then round(
      100.0
      * count(pr.id) filter (where pr.points_awarded = 3)
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
-- Settle match — idempotentne rozliczenie punktów
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
  set points_awarded = case when prediction = v_correct then 3 else 0 end
  where match_id = p_match_id;

  update public.matches
  set settled_at = now()
  where id = p_match_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: ręczne wpisanie wyniku (fallback dla awaryjnego sync z API)
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_match_result(
  p_match_id        uuid,
  p_home_score      integer,
  p_away_score      integer,
  p_winner_team_id  uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage match_stage;
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
    if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
      raise exception 'Forbidden: admin only';
    end if;
  end if;

  select stage into v_stage from public.matches where id = p_match_id;
  if v_stage is null then
    raise exception 'Match not found: %', p_match_id;
  end if;

  update public.matches set
    home_score     = p_home_score,
    away_score     = p_away_score,
    winner_team_id = case when v_stage = 'group' then null else p_winner_team_id end,
    status         = 'finished',
    last_synced_at = now()
  where id = p_match_id;

  perform public.settle_match(p_match_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: nadanie roli admina po display_name (wygodne z SQL Editora)
-- ---------------------------------------------------------------------------
create or replace function public.admin_grant(p_display_name text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set is_admin = true where display_name = p_display_name;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.teams       enable row level security;
alter table public.matches     enable row level security;
alter table public.predictions enable row level security;

-- profiles: read all, update own
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using  (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select is_admin from public.profiles where id = auth.uid()));
-- ^ users can update own row but cannot self-grant is_admin

-- teams: read all (write via service_role / admin function jeśli będzie potrzeba)
drop policy if exists "teams_select_authenticated" on public.teams;
create policy "teams_select_authenticated"
  on public.teams for select
  to authenticated using (true);

-- matches: read all
drop policy if exists "matches_select_authenticated" on public.matches;
create policy "matches_select_authenticated"
  on public.matches for select
  to authenticated using (true);

-- predictions: read all, insert/update own only before kickoff
drop policy if exists "predictions_select_authenticated" on public.predictions;
create policy "predictions_select_authenticated"
  on public.predictions for select
  to authenticated using (true);

drop policy if exists "predictions_insert_own_before_kickoff" on public.predictions;
create policy "predictions_insert_own_before_kickoff"
  on public.predictions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.kickoff_at > now()
    )
  );

drop policy if exists "predictions_update_own_before_kickoff" on public.predictions;
create policy "predictions_update_own_before_kickoff"
  on public.predictions for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.kickoff_at > now()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.kickoff_at > now()
    )
  );

-- Brak policy na DELETE = delete zablokowane (RLS deny-by-default)

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated, anon;
grant select on public.leaderboard to authenticated;

revoke all on function public.settle_match(uuid)              from public;
revoke all on function public.admin_set_match_result(uuid, integer, integer, uuid) from public;
revoke all on function public.admin_grant(text)               from public;

grant execute on function public.settle_match(uuid)                                  to authenticated;
grant execute on function public.admin_set_match_result(uuid, integer, integer, uuid) to authenticated;
grant execute on function public.admin_grant(text)                                    to service_role;
