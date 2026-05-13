-- ============================================================================
-- 0002 — fixes for missing profiles
-- 1) Dodaje RLS policy pozwalającą userowi stworzyć swój własny wiersz w profiles
--    (defense in depth gdy trigger nie odpali — np. user istniał przed migracją 0001).
-- 2) Backfillu profili dla wszystkich już istniejących auth.users.
-- Uruchom: Supabase Studio → SQL Editor → wklej i Run.
-- ============================================================================

-- 1) INSERT policy
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 2) Backfill — domkrij profile dla wszystkich userów którzy już są w auth.users
--    a nie mają wiersza w public.profiles
insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
