# PatoBet

Typerka MŚ 2026 dla zamkniętej grupy znajomych. 1/X/2, 3 pkt za trafienie, deadline = gwizdek startowy. Jeden turniej, jeden cykl życia.

**Stack**: Next.js 16 (App Router) + Tailwind v4 + shadcn/ui (new-york) + Supabase (Auth + Postgres + RLS) + pnpm. Dane meczowe: [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) (public domain, GitHub CDN).

Pełne specyfikacje produktu w `_docs/` — `PROMPT.md` (decyzje produktowe), `STACK.md`, `DESIGN.md`, `SKILL.md`.

---

## Quick start (świeży setup)

Zakłada że masz Node 20+ i pnpm.

```bash
pnpm install
cp .env.example .env.local   # uzupełnij Supabase URL + keys + CRON_SECRET
pnpm dev
```

Aplikacja na `http://localhost:3000`. Dopóki nie zrobisz setupu Supabase niżej, logowanie nie zadziała.

---

## Setup Supabase (jednorazowo)

1. Stwórz projekt w [supabase.com](https://supabase.com)
2. **Project Settings → API** → przekopiuj do `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Publishable key` (anon) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `Secret key` (service_role) → `SUPABASE_SERVICE_ROLE_KEY`
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) / produkcyjny URL
   - Redirect URLs (Add): `http://localhost:3000/auth/callback` + produkcyjny `${SITE}/auth/callback`
4. **Authentication → Sign In / Providers → Email** → **Confirm email = OFF** (bez tego rejestracja wymaga maila, a SMTP free tier ma rate limit 3-4/h projekt-wide)
5. **SQL Editor** — odpal migracje **w kolejności**:
   - `supabase/migrations/0001_init.sql` (tabele + RLS + view + funkcje)
   - `supabase/migrations/0002_profile_insert_and_backfill.sql` (INSERT policy + dotworzenie profili)
   - `supabase/migrations/0003_add_round_of_32.sql` (enum dla 48-team formatu MŚ 2026)
   - `supabase/migrations/0004_teams_code_unique.sql` (unique constraint dla sync)

Po tym możesz się zarejestrować na `/login` i powinno działać.

---

## Pierwsze uruchomienie (po setupie)

1. `pnpm dev` → `/login` → "Rejestracja" → email + hasło + nick
2. Po rejestracji jesteś na `/matches` ale tabela pusta — musisz zostać adminem i odpalić sync.
3. **Nadaj sobie admina** (jedna z dwóch dróg):
   - **Dev**: `/me` → przewiń na dół → "Tryb deweloperski" → "Nadaj sobie role admina" (widoczne tylko w `NODE_ENV=development`)
   - **Prod / czysta droga**: w Supabase SQL Editor `select admin_grant('TwojNick');`
4. `/admin` → kliknij **"Sync z OpenFootball"** → 48 drużyn + ~88 meczów ląduje w bazie
5. Wracaj na `/matches` — pełen harmonogram MŚ 2026 z flagami

---

## Komendy

```bash
pnpm dev          # dev server (Turbopack, port 3000)
pnpm build        # production build
pnpm start        # serwuje production build
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
```

---

## Deployment (Vercel)

```bash
pnpm dlx vercel link
pnpm dlx vercel env pull          # synchronizuj env z dashboardu
pnpm dlx vercel --prod
```

Po deployu w Vercel Dashboard:
- **Settings → Environment Variables** — uzupełnij wszystkie z `.env.example`, ustaw `NEXT_PUBLIC_SITE_URL` na produkcyjny URL
- **Settings → Cron Jobs** — sprawdź czy `/api/cron/sync-matches` jest zarejestrowany (z `vercel.json`)
- Dodaj produkcyjny URL `https://twoja-domena/auth/callback` do **Redirect URLs** w Supabase

Hobby tier Vercel ogranicza cron do daily — `vercel.json` ma `0 6 * * *` (codziennie 6:00 UTC). Jeśli kupisz Pro, możesz podnieść częstotliwość (np. `*/30 * * * *` co 30 min w dni meczowe). W razie potrzeby zawsze możesz wymusić ręcznie w `/admin`.

---

## Struktura

```
src/
  app/
    (app)/             # chroniona grupa (middleware/proxy)
      matches/         # lista meczów
      match/[id]/      # szczegóły + typowanie
      leaderboard/     # tabela
      me/              # profil + moje typy + dev tools
      admin/           # sync + edycja wyników (is_admin only)
    api/cron/          # endpoint dla Vercel Cron
    auth/              # callback + error + reset-password
    forgot-password/   # public reset request
    onboarding/nick/   # wymuszony krok po pierwszym loginie
    login/             # signin/signup toggle
    page.tsx           # landing
  components/
    ui/                # shadcn primitives (nie edytuj bezpośrednio)
    matches/           # match card, predict buttons, filter, etc.
    layouts/           # SiteHeader, AppHeader, footer, menus
    shared/            # UserAvatar
  lib/
    supabase/          # client (browser/server/admin/proxy)
    openfootball/      # sync + fifa→iso/PL mapping
    auth.ts            # requireUserWithProfile, requireAdmin
    format.ts          # Intl daty w Europe/Warsaw
    matches.ts         # fetching matches with joined teams + predictions
  proxy.ts             # Next.js 16 middleware (auth gate)
supabase/migrations/   # SQL do odpalenia w SQL Editor (w kolejności)
_docs/                 # PROMPT.md / SKILL.md / STACK.md / DESIGN.md (source of truth)
```

---

## Decyzje, które mogą zaskoczyć

- **Auth = email+hasło** (nie magic link mimo PROMPT.md). Powód: free tier Supabase ma projekt-wide rate limit ~3-4 maile/h, magic link był nieużywalny w dev. Reset hasła idzie przez mail (rzadko używane).
- **Dane meczowe = OpenFootball, NIE api-football**. Powód: free tier api-football blokuje sezony >2024. OpenFootball jest public domain + community update'uje wyniki w trakcie turnieju (WC 2022 ma 64/64 z wynikami w repo).
- **Next.js 16 ma `proxy.ts` zamiast `middleware.ts`**. Funkcjonalnie to samo.
- **shadcn style `new-york`, nie nowy `base-nova`**. base-nova ma stubowane komponenty (form pustym plikiem), nie nadawał się.
- **Custom token `--energy`** (limonkowy akcent) obok shadcn defaults — w `globals.css`. Używaj `bg-energy`/`text-energy` dla highlightów (badge'y, statystyki).
- **Tokens w OKLCH** (Stadium Night palette).
- **Tabela `teams` używa FIFA code (3-letter) jako natural key** (`POL`, `BRA`, `ENG` itd.) — sync upsertuje po `code`, nie `api_id`.

---

## Punktacja (logika w `supabase/migrations/0001_init.sql` → `settle_match`)

- **Faza grupowa**: porównanie `home_score` vs `away_score` po 90 min → `home`/`draw`/`away` → 3 pkt za trafienie.
- **Faza pucharowa**: `winner_team_id` decyduje (uwzględnia dogrywkę i karne). Type `draw` zawsze pudło w pucharowej.
- **Brak typu = 0 pkt** (nie wyklucza z turnieju, po prostu zero).
- **Idempotentne**: `settle_match` można wywołać wielokrotnie, wynik się przelicza od zera. Admin edytuje wynik → punkty się reseuje.

---

## Typowy debug

| Objaw | Co sprawdzić |
|---|---|
| Pętla `/matches ↔ /login?error=missing_profile` | Migracja 0002 nieuruchomiona albo trigger `handle_new_user` nie odpalił. `/login` pokaże instrukcję + przycisk wyloguj |
| "Coś poszło nie tak" / brak `?code` w callbacku | Redirect URL w Supabase URL Configuration nie zawiera Twojego `/auth/callback` |
| `/admin` redirectuje na `/matches` | Nie masz `is_admin=true`. Idź na `/me` → Tryb deweloperski → "Nadaj sobie admina", albo `select admin_grant('Nick')` w SQL |
| Sync zwraca błąd o RLS | `SUPABASE_SERVICE_ROLE_KEY` nieuzupełnione w `.env.local` |
| "Email rate limit exceeded" | Free tier Supabase = 3-4 maile/h projekt-wide. Czekaj godzinę, lub podepnij Resend SMTP w Supabase Authentication → SMTP Settings |
| Sync z OpenFootball pomija mecze | Mecze pucharowe z placeholderami (`W101`, `1A`) — zwykłe, dorzucą się po wyłonieniu drużyn (kolejny sync) |
| Cron daily nie wystarczy w trakcie turnieju | Force sync w `/admin` po każdej kolejce, albo upgrade Vercel do Pro i zmień schedule w `vercel.json` na `*/30 * * * *` |

---

## Co dalej (jeśli kiedyś)

- Avatar upload (Supabase Storage + krop 256x256 client-side)
- Push notifications przed kickoffem (Web Push API)
- Realtime updates wyników (`supabase.channel().on('postgres_changes', ...)`) zamiast revalidate
- Eksport tabeli do CSV / share image
- Tryb "side bets" — typowanie strzelców, podgrupy itp.

Wszystko nice-to-have, MVP działa bez nich.
