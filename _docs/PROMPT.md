# PROMPT — Aplikacja typerska "Mundial z ekipą"

## Kontekst dla Ciebie, Claude

Buduję aplikację webową dla zamkniętej grupy znajomych do typowania meczów Mistrzostw Świata w piłce nożnej 2026. **Jeden turniej, jeden cykl życia aplikacji** — to nie jest długoterminowa platforma, tylko narzędzie na konkretne mistrzostwa.

Masz w pamięci skille `web-craft` (`SKILL.md`, `STACK.md`, `DESIGN.md`) — **to są twarde reguły, nie sugestie**. Przed pisaniem czegokolwiek przeczytaj je w całości i stosuj się do nich w każdej decyzji. Szczególnie:

- **Mobile-first** jest prawem (ludzie typują głównie z telefonu, w autobusie, przed gwizdkiem)
- **shadcn jest defaultem** — zanim cokolwiek napiszesz, sprawdź czy shadcn już to ma
- **`@latest` w każdej komendzie instalacji** — żadnych konkretnych wersji
- **TypeScript strict, design tokens, semantic HTML, WCAG AA**
- **Treść po polsku, kod po angielsku**

---

## Decyzje produktowe (zamknięte, nie negocjuj)

| Obszar | Decyzja |
|---|---|
| **Stack** | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + pnpm |
| **Backend** | Supabase (Auth + Postgres + RLS) |
| **Auth** | Magic link na email (Supabase Auth) — bez haseł, bez OAuth w MVP |
| **Dostęp** | Publiczna rejestracja — każdy z mailem może wejść |
| **Co typujemy** | Tylko 1/X/2 (zwycięstwo gospodarza / remis / zwycięstwo gościa) |
| **Punktacja faza grupowa** | 3 pkt za trafienie 1/X/2 po 90 min, 0 pkt za pudło |
| **Punktacja faza pucharowa** | 3 pkt za trafienie awansującej drużyny (kto przechodzi dalej, niezależnie od dogrywki/karnych) |
| **Deadline typowania** | Gwizdek startowy meczu (kickoff). Po kickoff typ zablokowany, nawet jeśli nie został złożony |
| **Widoczność cudzych typów** | Od razu po obstawieniu (znajomi widzą się nawzajem — to część zabawy) |
| **Edycja typu** | Możliwa do gwizdka. Po kickoff — zablokowane na zawsze |
| **Źródło danych** | api-football.com, free tier (100 req/dzień) — agresywny cache |
| **Wprowadzanie wyników** | Cron job pobiera wyniki z API, ale admin ma fallback ręczny w panelu |

---

## Architektura — przegląd wysokopoziomowy

```
┌─────────────────────────────────────────────────────┐
│  Next.js App (App Router, Server Components first)  │
│  ┌─────────────────────────────────────────────┐    │
│  │  app/(auth)        ← magic link, callback   │    │
│  │  app/(app)         ← chroniony obszar       │    │
│  │    /matches        ← lista meczów + typy    │    │
│  │    /leaderboard    ← tabela rezultatów      │    │
│  │    /me             ← moje typy + statystyki │    │
│  │    /match/[id]     ← szczegóły + cudze typy │    │
│  │  app/admin         ← panel admina (RLS)     │    │
│  │  app/api/cron      ← sync wyników z API     │    │
│  └─────────────────────────────────────────────┘    │
│         │                          │                 │
│         ▼                          ▼                 │
│   Server Actions             Supabase Client         │
│   (mutacje: typ,             (read przez RLS)        │
│   rozliczenie pkt)                                   │
└─────────┬───────────────────────────┬───────────────┘
          │                           │
          ▼                           ▼
   ┌──────────────┐          ┌────────────────────┐
   │  Supabase    │          │  api-football.com  │
   │  - Auth      │◄─────────┤  (cache 24h dla    │
   │  - Postgres  │  cron    │  fixtures, 5min    │
   │  - RLS       │          │  dla live wyników) │
   └──────────────┘          └────────────────────┘
```

---

## Model danych (Supabase Postgres)

Zaprojektuj schemat zgodnie z poniższym. Wszystkie tabele z `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`.

```sql
-- użytkownicy (rozszerzenie auth.users)
profiles
  - id (FK → auth.users.id)
  - display_name (text, unique, required)
  - avatar_url (text, nullable)
  - is_admin (boolean, default false)

-- drużyny (zaciągane z API raz przed turniejem)
teams
  - id
  - api_id (int, unique)         -- id z api-football
  - name (text)
  - code (text, 3-letter, np. POL)
  - flag_url (text)
  - group_letter (text, nullable, A-H dla grup)

-- mecze
matches
  - id
  - api_id (int, unique)
  - home_team_id (FK → teams)
  - away_team_id (FK → teams)
  - kickoff_at (timestamptz)
  - stage (enum: group, round_of_16, quarter, semi, third_place, final)
  - group_letter (text, nullable)
  - status (enum: scheduled, live, finished, postponed, cancelled)
  - home_score (int, nullable)      -- po 90 min
  - away_score (int, nullable)      -- po 90 min
  - winner_team_id (FK → teams, nullable)  -- dla pucharowych: kto awansował (uwzględnia dogrywkę/karne)
  - settled_at (timestamptz, nullable)  -- kiedy rozliczono punkty
  - last_synced_at (timestamptz)

-- typy użytkowników
predictions
  - id
  - user_id (FK → profiles)
  - match_id (FK → matches)
  - prediction (enum: home, draw, away)   -- 1/X/2
  - points_awarded (int, nullable)        -- null = nie rozliczono, 0/3 = rozliczono
  - submitted_at (timestamptz)
  - UNIQUE (user_id, match_id)             -- jeden typ na mecz na usera
```

**Reguły RLS (Row Level Security) — krytyczne, zaprojektuj dokładnie:**

- `profiles`: SELECT dla wszystkich zalogowanych, UPDATE tylko własny profil
- `teams`: SELECT dla wszystkich zalogowanych, INSERT/UPDATE tylko admin (lub service role)
- `matches`: SELECT dla wszystkich zalogowanych, INSERT/UPDATE tylko admin
- `predictions`:
  - SELECT: dla wszystkich zalogowanych (cudze typy są jawne)
  - INSERT/UPDATE: tylko własny user_id, **tylko jeśli `matches.kickoff_at > now()`** — wymuś to RLS-em, nie tylko UI!
  - DELETE: zablokowane

**Materialized view `leaderboard`** (lub regular view jeśli wystarczy):
```
user_id, display_name, total_points, predictions_made, accuracy_pct
```
Odświeżana po każdym rozliczeniu meczu.

---

## Strony i widoki (mapa aplikacji)

### Publiczne (przed loginem)
- `/` — landing: nazwa turnieju, krótki opis ("Typuj mecze MŚ z ekipą"), CTA "Zaloguj się"
- `/login` — formularz: email → wyślij magic link
- `/auth/callback` — handler magic linka

### Po loginie (`(app)` group, chronione middleware'em)
- `/matches` (default landing po login) — lista meczów pogrupowana wg dat. Każdy mecz pokazuje: flagi, godzinę, status, mój typ (jeśli jest), licznik osób które już obstawiły. **Mobile-first: jedna kolumna kart, scroll, sticky filter (Dzisiaj / Jutro / Wszystkie / Faza)**
- `/match/[id]` — szczegóły meczu: duże flagi, kickoff, mój typ (przyciski 1/X/2 do gwizdka), lista typów innych userów (avatar + nick + typ), po finalizacji: wynik i kto trafił
- `/leaderboard` — tabela: pozycja, avatar+nick, punkty, # typów, skuteczność %. Highlight bieżącego usera. **Mobile: gęsta lista, nie tabela HTML**
- `/me` — mój profil: edycja display_name, awatara, moje typy chronologicznie, moja statystyka
- `/admin` (tylko `is_admin = true`) — sync z API ręczny, ręczna edycja wyniku meczu, lista userów

### API / Server
- `app/api/cron/sync-matches` — endpoint dla Vercel Cron, zaciąga harmonogram i wyniki, rozlicza punkty. Zabezpieczony `CRON_SECRET` w headerze.

---

## Logika rozliczania punktów (krytyczna)

Server Action `settleMatch(matchId)`, wywoływana z crona po zmianie statusu meczu na `finished`:

```
1. Pobierz mecz z home_score, away_score (i winner_team_id dla pucharowych)
2. Określ poprawny typ:
   - Faza grupowa: home_score > away_score → "home"; równe → "draw"; mniejsze → "away"
   - Faza pucharowa: winner_team_id === home_team_id → "home"; === away_team_id → "away"
     (remis nie istnieje w pucharowej, "draw" zawsze pudło)
3. Pobierz wszystkie predictions dla match_id gdzie points_awarded IS NULL
4. Dla każdej: points_awarded = (prediction === correct) ? 3 : 0
5. UPDATE w transakcji
6. UPDATE matches.settled_at = now()
7. Refresh materialized view leaderboard
```

Idempotentność — jeśli wynik się zmieni (admin edytuje), funkcja musi umieć przeliczyć: najpierw zresetować `points_awarded` do null, potem rozliczyć od nowa.

---

## Integracja z api-football (free tier — 100 req/dzień)

**Budżet zapytań — to jest twarde ograniczenie, przemyśl strategię:**

- Harmonogram + drużyny → **1 zapytanie raz dziennie** (cron 06:00 UTC), cache w Supabase 24h
- Wyniki live → **częstsze, ale tylko dla meczów `status = live` lub `kickoff_at + 2h > now() > kickoff_at`** (cron co 15 min w dni meczowe)
- W dni bez meczów → cron nie odpala synca wyników

Dzień meczowy MŚ ma max 4 mecze → max ~16 zapytań w oknie meczowym + 1 daily sync = bezpiecznie pod 100/dzień nawet z buforem.

**Klucz API** w `process.env.API_FOOTBALL_KEY`. **Nie commituj.** Zostaw `.env.example` z pustym polem.

Stwórz wrapper `lib/api-football/client.ts` z:
- `getFixtures(tournamentId, season)` — harmonogram
- `getFixtureById(fixtureId)` — pojedynczy mecz (live update)
- `getTeams(tournamentId, season)` — drużyny
- Wszystko z retry (max 2), timeout 10s, structured error handling

---

## Plan wykonania — 6 faz, każda kończy się działającym kodem

**Wykonuj fazy sekwencyjnie. Po każdej fazie powiedz mi co zrobiłeś, co dalej, i czy potrzebujesz decyzji ode mnie.** Nie buduj wszystkiego naraz, nie traktuj tego jako jednorazowy dump.

### Faza 1 — Setup i fundament
- `pnpm create next-app@latest .` z wszystkimi defaultami z `STACK.md`
- `pnpm dlx shadcn@latest init` (New York, Neutral, CSS variables)
- Podstawowe komponenty shadcn: `button card input label form sheet dialog dropdown-menu sonner avatar badge tabs skeleton`
- Struktura folderów dokładnie wg `STACK.md`
- Setup Supabase: `pnpm add @supabase/supabase-js @supabase/ssr`
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
- `.env.example` z wszystkimi zmiennymi które będą potrzebne
- Dobranie fontu charakterystycznego (NIE Inter — `DESIGN.md` wyjaśnia dlaczego). Coś co pasuje do sportu i ekscytacji, ale czytelne. Zaproponuj 2-3 opcje z Google Fonts.
- Design tokens w `globals.css` (CSS variables) — kolory marki dla aplikacji sportowej. Zaproponuj paletę i pokaż mi do akceptacji **zanim** zastosujesz wszędzie.

**Deliverable**: działa `pnpm dev`, jest landing, jest pusty `/login`, jest Supabase client.

### Faza 2 — Auth flow (magic link)
- `/login` z formularzem (email → magic link)
- `/auth/callback` route handler
- Middleware chroniący `(app)` group
- Po pierwszym logowaniu: auto-utworzenie wiersza w `profiles` (trigger w Supabase albo Server Action)
- Onboarding: jeśli `display_name` puste → wymuszony krok "ustaw nick" zanim wejdziesz dalej
- Logout w UI

**Deliverable**: można się zalogować, wyjść, profil powstaje, chroniona strona przekierowuje do `/login`.

### Faza 3 — Schemat bazy + seed
- Migracje SQL dla wszystkich tabel + RLS policies
- View / materialized view dla leaderboard
- Skrypt seedujący `teams` (32 drużyny MŚ 2026) — najpierw hardcoded fallback, potem podmień gdy działa API
- Skrypt seedujący `matches` z hardcoded sample (np. faza grupowa A + 1 mecz pucharowy do testów punktacji)
- Funkcja `settleMatch` jako Postgres function albo Server Action — wybierz i uzasadnij

**Deliverable**: w Supabase Studio widać wszystkie tabele, są dane testowe, RLS działa (sprawdź zapytaniami z różnymi rolami).

### Faza 4 — Core UI: matches + prediction flow
- `/matches` — lista meczów pogrupowanych po dacie, filtr (Dzisiaj/Jutro/Wszystkie/Faza grupowa/Pucharowa), karty z flagami i statusem
- `/match/[id]` — szczegóły, przyciski typowania (1/X/2 jako trzy duże touch targety, mobile-first), wyświetlenie cudzych typów
- Server Action `submitPrediction(matchId, prediction)` z walidacją serwerową: `kickoff_at > now()` (defense in depth — RLS już to wymusza, ale niech akcja zwróci czytelny błąd)
- Optimistic update typu w UI z fallbackiem na błąd
- Stany: loading skeletons, empty states, błędy

**Deliverable**: można obstawić mecz, widać swój typ, widać cudze typy, po kickoff przyciski znikają.

### Faza 5 — Leaderboard, profil, statystyki
- `/leaderboard` — lista (nie tabela HTML na mobile, prawdziwa lista; na desktop dwukolumnowy układ ze szczegółami)
- `/me` — moje typy chronologicznie, edycja nicka i awatara, statystyki (trafione/spudłowane/skuteczność, średnia pozycja, najlepszy dzień)
- Avatary: upload do Supabase Storage, krop do 256x256 po stronie klienta przed uploadem

**Deliverable**: pełne flow user journey działa end-to-end.

### Faza 6 — Sync z API + admin + cron
- `lib/api-football/client.ts` z wrapperem
- `app/api/cron/sync-matches/route.ts` — pobiera fixtures, upsertuje, dla finished triggeruje settleMatch
- `vercel.json` z konfiguracją cron jobów
- `/admin` — lista meczów z możliwością ręcznej edycji wyniku (fallback gdy API zawiedzie), lista userów, przycisk "force sync now"
- Logging błędów cron do tabeli `sync_logs` (opcjonalnie, ale przydatne)

**Deliverable**: aplikacja działa autonomicznie — cron pobiera dane, rozlicza punkty, admin ma kontrolę awaryjną.

---

## Reguły jakości — sprawdź każdą fazę

Przed zakomunikowaniem mi "faza X gotowa" przejdź przez self-audit ze `SKILL.md` (krok 5). Dodatkowo dla tej aplikacji:

- [ ] **Strefa czasowa**: wszystko w UTC w bazie, formatowanie do Europe/Warsaw w UI (Intl.DateTimeFormat z `pl-PL`)
- [ ] **Race condition na kickoff**: jeśli user kliknie typ w sekundzie kickoff — RLS odrzuca. UI musi pokazać sensowny komunikat
- [ ] **Brak typu = 0 pkt** (user nie obstawił → nie dostaje nic, ale go to nie wyklucza z dalszego turnieju)
- [ ] **Mobile real device test**: każdy widok przetestowany w DevTools w trybie iPhone SE (375px) i Pixel 7 (412px)
- [ ] **Loading states wszędzie** — żadnego "białego ekranu zanim się załaduje"
- [ ] **Optimistic UI dla typowania** — kliknięcie typu = natychmiastowa reakcja wizualna, async potwierdzenie

---

## Komunikacja ze mną

- **Po każdej fazie**: krótki raport (3-5 zdań) co działa + screenshot / opis kluczowych widoków + co dalej
- **Gdy masz wątpliwość produktową**: zatrzymaj się i zapytaj. Lepiej 2 min pytania niż 2h przeróbek
- **Gdy widzisz lepszy sposób niż w prompcie**: powiedz mi i uzasadnij. Prompt nie jest święty (poza decyzjami produktowymi z tabeli)
- **Gdy free tier API się nie spina**: zgłoś alarm i zaproponuj plan B

---

## Start

Przeczytaj jeszcze raz `SKILL.md`, `STACK.md`, `DESIGN.md`. Potem zaczynaj **Fazę 1**. Powodzenia.