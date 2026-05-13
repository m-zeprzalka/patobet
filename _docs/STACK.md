# STACK.md — biblia technologiczna

Ten plik definiuje *czym* budujemy. `SKILL.md` mówi jak pracować, `DESIGN.md` jak ma wyglądać — tu są twarde fakty technologiczne. Czytaj zawsze przed pisaniem kodu w nieznanym projekcie.

---

## Reguła #1 — Versioning Policy

**NIGDY nie wpisuj konkretnych numerów wersji** w komendach instalacji, w `package.json`, ani w propozycjach kodu. Zawsze najnowsze stabilne.

```pseudokod
ŹLE:   "zainstaluj Next.js 15.2.0"
ŹLE:   "next": "14.1.0" w package.json
DOBRZE: pnpm create next-app@latest
DOBRZE: "next": "latest" lub bez wersji (manager sam pobierze)
```

Powód — skille się dezaktualizują wolniej niż technologie. Wpisanie wersji = przestarzały skill za 3 miesiące. Dodatkowo, modele AI mają bias do "znanych dobrze" starszych wersji — eksplicytna reguła "zawsze najnowsze" jest przeciwwagą dla tego biasu.

**Wyjątki** (jedyne sytuacje, kiedy wersja może się pojawić):
- Istniejący projekt z konkretną wersją → dostosuj się do tego, co jest.
- Peer dependency conflict → zapytaj usera, którą wersję preferuje.
- User wprost prosi o konkretną wersję → wykonaj, ale poinformuj że to nie jest najnowsza.

**Weryfikacja przed dodaniem czegokolwiek:**

```bash
# W istniejącym projekcie — co jest do aktualizacji
pnpm outdated

# Aktualizacja konkretnej paczki do najnowszej
pnpm update <nazwa> --latest
```

---

## Warstwa CORE (zawsze, w każdym projekcie)

Te technologie są w każdym projekcie. Bez wyjątku.

### Next.js — App Router

- Inicjalizacja: `pnpm create next-app@latest`
- Podczas wizarda zawsze: TypeScript ✓, ESLint ✓, Tailwind ✓, `src/` ✓, App Router ✓, import alias `@/*` ✓
- **Server Components są domyślne.** `"use client"` tylko gdy konieczne (eventy, hooki, state, browser-only API)
- Routing przez foldery w `app/`, layouty w `layout.tsx`, ładowanie w `loading.tsx`, błędy w `error.tsx`

### TypeScript — strict mode

- `"strict": true` w `tsconfig.json` — non-negotiable
- **`any` jest zakazane** bez bardzo dobrego uzasadnienia (i komentarza dlaczego)
- Propsy komponentów typowane przez `interface` (nie `type`) — łatwiej rozszerzać
- Hooki własne typowane jawnie (return type), nie polegaj na inference
- W razie nieznanego typu z zewnętrznego API → `unknown` + walidacja, nigdy `any`

### Tailwind

- Inicjalizacja przez Next.js wizard albo przez shadcn init
- **Klasy w JSX, nie `@apply` w CSS** — wyjątek: bardzo powtarzalne wzorce (rzadko)
- Custom tokens przez Tailwind theme / `@theme` (w zależności od wersji, Claude sprawdzi przy projekcie)
- **Mobile-first** — bazowa klasa = mobile, `sm:`/`md:`/`lg:` to nadbudowa
- `tailwind-merge` + `clsx` (przez shadcn `cn()`) do warunkowych klas — **zawsze**

### shadcn/ui

- Inicjalizacja: `pnpm dlx shadcn@latest init`
- Dodawanie komponentu: `pnpm dlx shadcn@latest add button card dialog`
- Dodawanie bloku: `pnpm dlx shadcn@latest add login-04` (sprawdź dostępne na [shadcn.com/blocks](https://ui.shadcn.com/blocks))
- Komponenty trafiają do `components/ui/` — **NIE edytuj tych plików bezpośrednio na "drobne" zmiany**, twórz wrappery
- Zmiany w `components/ui/X.tsx` są dopuszczalne tylko gdy: dodajesz nowy wariant, zmieniasz baseline behaviour całego projektu

### pnpm

- Zawsze pnpm, nigdy npm ani yarn (chyba, ze to konieczne)
- Jeśli widzisz `package-lock.json` lub `yarn.lock` w projekcie → poinformuj usera i zaproponuj migrację (`rm package-lock.json && pnpm install`)
- Globalne pakiety idą do `~/.pnpm-global`, lokalne do `node_modules` projektu

---

## Warstwa OPT-IN (gdy projekt to uzasadnia)

Każda biblioteka tutaj musi udowodnić, że jej brak boli bardziej niż jej obecność. **Default = minimum. Dodajemy gdy projekt to uzasadnia.**

### Walidacja danych — Zod

**Domyślnie:** natywny HTML validation (`required`, `type="email"`, `pattern`) + Server Actions z prostym `if/throw`.

**Sięgnij po Zod gdy:**
- Formularz ma 5+ pól lub walidację warunkową
- API zwraca dane, które trzeba zwalidować po stronie klienta
- Klient wymaga spersonalizowanych komunikatów błędów
- Server Action z złożonym payloadem

```bash
pnpm add zod
```

### Formularze — React Hook Form

**Domyślnie:** natywny `<form>` + Server Action z `useFormState` / `useActionState`.

**Sięgnij po React Hook Form gdy:**
- Multi-step form
- Dynamiczne pola (dodawanie/usuwanie wierszy)
- Złożona walidacja klient-side z UX live feedback
- Integracja z Zod przez `@hookform/resolvers/zod`

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

### Lokalizacja — next-intl

**Domyślnie:** brak. Strony po polsku, copy w komponentach.

**Sięgnij po next-intl gdy:**
- Klient wprost wymaga wielojęzyczności
- SaaS na rynek międzynarodowy

```bash
pnpm add next-intl
```

### State management

**Domyślnie:** `useState` + Server Components + URL state (`useSearchParams`).

**Sięgnij po Zustand gdy:**
- Globalny state przekracza 3 prop drillingu w głąb
- Persistencja w localStorage / sessionStorage
- Wiele niezależnych "store'ów" (auth, theme, cart)

**Nigdy:** Redux/Redux Toolkit dla nowych projektów (chyba że klient wprost wymaga).

```bash
pnpm add zustand
```

### Animacje — Motion (Framer Motion)

**Domyślnie:** Tailwind transition + CSS animations + `tailwindcss-animate` (przychodzi z shadcn).

**Sięgnij po Motion gdy:**
- Orchestrowane animacje wejścia (stagger, sequence)
- Drag & drop, gestures
- Layout animations (FLIP)
- Animacje na scroll

```bash
pnpm add motion
```

### Ikony — Lucide React

Standardowo wchodzi z shadcn. Ostrzeżenie: lucide jest tak rozpoznawalna, że bywa "podpisem AI". Mitigacja w `DESIGN.md`. Jeśli chcesz alternatywy:

```bash
# Phosphor — bardziej charakterystyczne
pnpm add @phosphor-icons/react

# Tabler — neutralne, profesjonalne
pnpm add @tabler/icons-react
```

---

## Struktura folderów

Standardowa, sprawdzona, taka sama w każdym projekcie. Łatwiej nawigować Claude'owi i Tobie.

```
src/
├── app/                          ← Next.js App Router
│   ├── (marketing)/             ← grupa: landing, about, pricing
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── (app)/                   ← grupa: dashboard, settings (po loginie)
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── api/                     ← API routes (jeśli potrzebne)
│   ├── layout.tsx               ← root layout
│   ├── page.tsx                 ← homepage
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── globals.css              ← Tailwind + design tokens
│
├── components/
│   ├── ui/                      ← shadcn components (auto-generated)
│   ├── sections/                ← duże bloki strony (Hero, Features, Pricing, Footer)
│   ├── forms/                   ← formularze (ContactForm, NewsletterForm)
│   ├── layouts/                 ← Header, Footer, Sidebar, Container
│   └── shared/                  ← drobne wspólne (Logo, Badge własny, Avatar)
│
├── lib/
│   ├── utils.ts                 ← `cn()` z shadcn + utility functions
│   ├── constants.ts             ← stałe (kolory marki, tablice nawigacji)
│   └── validators/              ← Zod schemas (gdy używamy)
│
├── hooks/                       ← custom React hooks
│   └── use-*.ts
│
├── types/                       ← shared TypeScript types/interfaces
│   └── index.ts
│
└── styles/                      ← (opcjonalnie) custom CSS poza globals
```

**Zasady nazewnictwa:**
- Komponenty React → `PascalCase.tsx` (`HeroSection.tsx`)
- Hooki → `use-kebab-case.ts` (`use-mobile.ts`)
- Utilities → `kebab-case.ts` (`format-date.ts`)
- Foldery → `kebab-case/` (`product-card/`)

---

## Server Components vs Client Components

To jeden z najczęściej źle robionych obszarów w Next.js. Zasady:

### Server Component (default, BEZ `"use client"`)

Używaj gdy:
- Brak interakcji użytkownika (statyczna treść)
- Pobieranie danych (fetch, baza)
- Renderowanie listy z propsa
- Layout, Header, Footer (zazwyczaj)

```pseudokod
SERVER COMPONENT może:
  ✓ async/await na top level
  ✓ fetch danych
  ✓ używać sekretów/env z runtime
  ✓ renderować Client Components jako children
  
SERVER COMPONENT nie może:
  ✗ useState, useEffect, useReducer
  ✗ onClick, onChange, onSubmit
  ✗ window, document, localStorage
  ✗ React Context (consumować)
```

### Client Component (`"use client"` na górze pliku)

Używaj gdy:
- Eventy (onClick, onChange, onSubmit)
- Hooki React (useState, useEffect, useContext)
- Browser API (window, localStorage, IntersectionObserver)
- Biblioteki client-only (Framer Motion, większość form libów)

```pseudokod
ZASADA — push client components AS DEEP AS POSSIBLE.
Nie rób `"use client"` na całej stronie tylko dlatego, że jeden przycisk ma onClick.
Wydziel ten przycisk do osobnego komponentu z "use client", reszta zostaje server.
```

Przykład w pseudokod:

```pseudokod
// app/page.tsx — server component
export default function HomePage() {
  return (
    <main>
      <HeroStatic />          // server
      <FeaturesGrid />        // server
      <PricingTable />        // server (jeśli dane stałe)
      <NewsletterForm />      // <- ten jeden ma "use client"
      <Footer />              // server
    </main>
  )
}
```

---

## Data fetching

### W Server Components

Fetch bezpośrednio, async/await. Next.js cachuje automatycznie.

```pseudokod
async function ProductList() {
  const products = await fetch('https://api/products').then(r => r.json())
  return <ul>...</ul>
}
```

### Mutacje (form submit, delete, update)

**Server Actions**, nie API routes.

```pseudokod
// app/actions/contact.ts
"use server"

export async function submitContact(formData: FormData) {
  // walidacja, zapis, return result
}

// W komponencie formularza:
<form action={submitContact}>
```

API routes (`app/api/`) tylko gdy:
- Webhook od zewnętrznej usługi (Stripe, GitHub)
- Endpoint dla third-party konsumenta
- Streaming response
- Cron job

---

## Komendy pnpm — cheatsheet

```bash
# Setup projektu
pnpm create next-app@latest my-app
cd my-app
pnpm dlx shadcn@latest init

# Dev
pnpm dev                          # uruchom dev server (port 3000)
pnpm build                        # production build
pnpm start                        # uruchom production build
pnpm lint                         # ESLint
pnpm typecheck                    # tsc --noEmit (dodaj do scripts)

# Pakiety
pnpm add <pkg>                    # dodaj runtime dependency
pnpm add -D <pkg>                 # dodaj dev dependency  
pnpm remove <pkg>                 # usuń
pnpm update                       # aktualizuj wszystkie do najnowszych w zakresie semver
pnpm update --latest              # aktualizuj IGNORUJĄC semver (uważnie!)
pnpm outdated                     # co jest do aktualizacji

# shadcn
pnpm dlx shadcn@latest add button card                 # dodaj komponenty
pnpm dlx shadcn@latest add login-04                    # dodaj block
pnpm dlx shadcn@latest diff button                     # zobacz diff względem upstream
```

---

## Zakazy (anti-patterns w stacku)

Lista tego, czego **nie robimy** w tym stacku.

### Zakaz: npm / yarn
Zawsze pnpm. Jeśli istniejący projekt ma `package-lock.json` lub `yarn.lock` → zaproponuj migrację.

### Zakaz: Pages Router w nowych projektach
Tylko App Router. Migracja Pages → App tylko na wyraźne życzenie klienta.

### Zakaz: edytowanie `components/ui/*` na drobne zmiany
Twórz wrappery w `components/shared/` lub `components/sections/`. Pliki z shadcn powinny być "vanilla" — łatwiej je odświeżać poprzez `pnpm dlx shadcn@latest add <name>`.

### Zakaz: `any` w TypeScript
Bez bardzo dobrego uzasadnienia i komentarza. Zamiast `any` → `unknown` + walidacja.

### Zakaz: hardcoded kolory w komponentach
`bg-[#ff0000]` jest zakazane. Wszystko przez design tokens (`bg-primary`, `bg-destructive`, `bg-muted`). Detail w `DESIGN.md`.

### Zakaz: domyślne fonty bez przemyślenia
shadcn init daje `Inter` — to jest *generyczny default AI*. W każdym nowym projekcie podmieniaj na coś charakterystycznego (detail w `DESIGN.md`).

### Zakaz: Redux dla nowych projektów
useState → URL state → Zustand. Redux tylko gdy klient wprost wymaga.

### Zakaz: CSS-in-JS (styled-components, Emotion)
Tailwind. Koniec dyskusji.

### Zakaz: instalacja przed sprawdzeniem czy shadcn już ma
Zanim zainstalujesz "Modal library" → sprawdź `shadcn add dialog`. Zanim "Toast library" → `shadcn add sonner`. Zanim "Date picker" → `shadcn add calendar`. shadcn pokrywa 80% UI needs.

### Zakaz: dodawanie zależności bez `pnpm outdated`
Przed dodaniem nowej zależności sprawdź czy istniejące są aktualne. Stary projekt + nowa paczka = potencjalne peer conflict.

---

## Inicjalizacja nowego projektu — pełny flow

Kopiuj-wklej-uruchamiaj sekwencja dla nowego projektu:

```bash
# 1. Stwórz projekt
pnpm create next-app@latest . (ZAWSZE W FOLDERZE DOMYŚLNYM!)
# Wybory: TypeScript ✓, ESLint ✓, Tailwind ✓, src/ ✓, App Router ✓, Turbopack ✓, alias @/* ✓

# 2. Init shadcn
pnpm dlx shadcn@latest init
# Wybory: New York style (lepszy default), Neutral base color, CSS variables ✓

# 3. Dodaj podstawowe komponenty (większość projektów ich potrzebuje)
pnpm dlx shadcn@latest add button card input label textarea form sheet dialog dropdown-menu toast

# 4. Dodaj kilka useful libs (gdy potrzebne)
pnpm add lucide-react  # już jest z shadcn, ale dla pewności

# 5. Sprawdź wersje
pnpm outdated

# 6. Pierwszy commit
git add . && git commit -m "chore: initial project setup"

# 7. Dev
pnpm dev
```

Gotowe. Teraz idziesz do `DESIGN.md` przed napisaniem pierwszej linii UI.

---

## Mapa zależności od priorytetów

Wracając do priorytetów ze `SKILL.md` — jak ten stack je realizuje:

| Priorytet | Jak go ten stack realizuje |
|-----------|---------------------------|
| **Czysty kod** | TypeScript strict + shadcn convention !!! Bardzo Istotne + struktura folderów = niska entropia |
| **Szybkość** | shadcn blocks + pnpm + Server Actions = mniej kodu do napisania |
| **Konwersja** | Next.js SSR + obrazy/fonty optymalizowane + a11y = lepsze Core Web Vitals |
| **Wow** | shadcn jest *baseline*, customizacja przez `DESIGN.md` |

Stack to fundament. Ożywia go `DESIGN.md`.
