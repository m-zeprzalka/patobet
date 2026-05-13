# DESIGN.md — biblia wizualna

Ten plik definiuje *jak* ma wyglądać i działać interfejs. `SKILL.md` mówi jak pracować, `STACK.md` czym budujemy — tu są zasady designu, UX i estetyki. Czytaj zawsze przed decyzjami wizualnymi.

Filozofia tego pliku to **design system mindset** — wszystko jest tokenem, skalą, regułą. Geometria, hierarchia, rytm. Inspiracje (w kolejności wagi): Vercel, Linear, Stripe, Material Design, Tailwind. Nie kopiujemy żadnego z nich — destylujemy zasady.

---

## Cztery filary

Każdy interfejs stoi na czterech filarach. Jeśli któryś jest słaby — design jako całość jest słaby.

```
1. HIERARCHIA      → co jest ważne, oko widza wie w 2 sekundy
2. RYTM            → spacing, typografia, kompozycja są przewidywalne
3. KLAROWNOŚĆ      → każdy element ma sens, nic nie jest dekoracją dla dekoracji
4. SPÓJNOŚĆ        → tokeny, nie ad-hoc decisions
```

Przy każdej decyzji zapytaj: *który filar to wzmacnia?* Jeśli żaden — usuń, uprość, przepisz.

---

## Mobile-first jako prawo

Pierwszy filar geometrii. Każdy projekt zaczyna się od telefonu, nie od desktopa.

### Reguły operacyjne

```pseudokod
1. Pierwszy szkic CSS  → klasy bez prefiksów (mobile baseline)
2. sm: 640px+          → small tablet, lekkie modyfikacje
3. md: 768px+          → tablet, layout zaczyna się otwierać
4. lg: 1024px+         → desktop, grid pokazuje pełnię
5. xl: 1280px+         → spacious desktop, kontener się rozciąga
6. 2xl: 1536px+        → bardzo szerokie, kontroluj max-width
```

### Touch targets

Wszystko klikalne ≥ 44×44px na mobile. Bez wyjątków.

```pseudokod
przycisk          → min-h-11 (44px)
ikona klikalna    → padding tak, żeby cały hit area ≥ 44px
link w nawigacji  → padding pionowy ≥ 12px
input             → h-11 lub h-12
```

### Container i breakpointy

Zawsze max-width na kontenerze głównym. Bez tego content rozjeżdża się na 4K.

```pseudokod
<main className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
  {children}
</main>
```

Padding rośnie z breakpointem — `px-4` mobile, `px-6` tablet, `px-8` desktop. To nie magia, to rytm.

### Test mobile-first

Przed wysłaniem — otwórz w DevTools na 360px. Wszystko musi:
- mieścić się w viewport (brak horizontal scroll)
- być czytelne (font-size ≥ 14px dla body)
- być klikalne (touch targets)
- mieć sensowny stack (jedna kolumna, nie wciśnięty grid 3-kolumnowy)

---

## Design tokens — fundament spójności

Zasada żelazna: **żadnych hardkodów koloru, spacing, typografii w komponentach**. Wszystko przez tokeny.

### Kolory

shadcn definiuje tokeny w `globals.css` przez CSS variables. Używamy ich semantycznie, nie kolorystycznie.

```pseudokod
ŹLE:   className="bg-[#3b82f6] text-white"
ŹLE:   className="bg-blue-500 text-white"
DOBRZE: className="bg-primary text-primary-foreground"
DOBRZE: className="domyślne klasy elementów"
```

**Role kolorów (shadcn convention):**

| Token | Zastosowanie |
|-------|-------------|
| `background` / `foreground` | główne tło i tekst |
| `card` / `card-foreground` | wydzielone bloki |
| `popover` / `popover-foreground` | dropdowny, tooltipy |
| `primary` / `primary-foreground` | główne CTA, akcent marki |
| `secondary` / `secondary-foreground` | wspierające elementy |
| `muted` / `muted-foreground` | wyciszone, drugorzędne |
| `accent` / `accent-foreground` | hover states, subtle highlights |
| `destructive` / `destructive-foreground` | błędy, delete actions |
| `border` / `input` / `ring` | granice, focus rings |

**Customizacja kolorów per projekt** — modyfikujesz wartości w `globals.css`, nigdy nie hardkodujesz w komponencie. Plik centralny, jeden punkt prawdy.

### Spacing scale

Tailwind ma 4px baseline. Używamy całych kroków skali, nie wartości arbitralnych.

```pseudokod
ŹLE:   className="p-[13px] gap-[7px]"
DOBRZE: className="p-3 gap-2"   # 12px padding, 8px gap

Skala której się trzymamy:
  px-1 (4)    px-2 (8)    px-3 (12)   px-4 (16)
  px-6 (24)   px-8 (32)   px-12 (48)  px-16 (64)
  px-20 (80)  px-24 (96)
```

**Rytm sekcji** — odstępy między sekcjami strony skalujemy z breakpointem:

```pseudokod
<section className="py-16 md:py-24 lg:py-32">
```

**Rytm wewnątrz sekcji** — między grupą tytułową a contentem ≥ 32px (`mt-8`).

### Typografia

Trzy decyzje, w każdym projekcie:

1. **Display font** (nagłówki, hero) — charakterystyczny, mocny
2. **Body font** (tekst, UI) — czytelny, niedrażniący
3. **Mono font** (opcjonalnie, kod) — pochodna body lub Inconsolata/JetBrains Mono

**Inter, Roboto, Arial, system-ui jako display = ZAKAZ.** To są fonty bezpieczne, ale nudne — definicja AI-slop. Dla body bywają OK, ale display zawsze musi mieć charakter.

**Sprawdzone domyślne kandydaci na display** (do rotacji per projekt):

| Charakter projektu | Kandydaci na display |
|-------------------|---------------------|
| **SaaS / B2B / corporate** | Geist, Söhne, GT America, IBM Plex Sans |
| **Editorial / blog / content** | Fraunces, GT Sectra, PP Editorial New, Newsreader |
| **Bold / startup / tech** | Boldonse, Mona Sans, Migra, Tobias |
| **Playful / kreatywne** | DM Serif Display, Recoleta, Clash Display |
| **Premium / luxury** | Larken, Tiempos Headline, NB International |

**Body fonts** — neutralne, sprawdzone (tu wolno użyć "boring"):

```
Geist, Söhne, Inter Tight (tylko body!), Söhne, IBM Plex Sans, Newsreader
```

**Modular scale** — rozmiary tekstu jadą po skali, nie ad-hoc:

```pseudokod
text-xs     12px    →  badge'e, captions
text-sm     14px    →  drobny UI, drugorzędne
text-base   16px    →  body default
text-lg     18px    →  lead paragraph, ważniejszy body
text-xl     20px    →  small heading
text-2xl    24px    →  H3
text-3xl    30px    →  H2
text-4xl    36px    →  H1 mobile, mniejsze hero
text-5xl    48px    →  H1 desktop standard
text-6xl    60px    →  hero desktop
text-7xl    72px    →  duży hero, statement
text-8xl    96px    →  display, jeden na stronę max
```

**Hero typography** — używaj clamp() lub Tailwind responsive dla skali:

```pseudokod
<h1 className="text-4xl md:text-6xl lg:text-7xl tracking-tight">
```

**Line-height i tracking** — defaulty Tailwinda są OK, ale dla dużych nagłówków zawsze `tracking-tight` lub `tracking-tighter`, dla body `leading-relaxed` przy długich akapitach.

---

## Hierarchia wizualna

Co użytkownik widzi *pierwsze*. To nie przypadek — projektujesz to.

### Reguła trzech wag

W każdej sekcji są trzy poziomy ważności:

```
PRIMARY    → 1 element. Hero headline, główne CTA, kluczowa liczba.
SECONDARY  → 2-4 elementy. Subtytuły, drugorzędne CTA, ikony sekcji.
TERTIARY   → reszta. Body text, labels, footer linki.
```

**Środki budowania hierarchii:**
- **Rozmiar** — większe = ważniejsze (oczywiste, ale często źle używane)
- **Waga** — `font-bold` vs `font-medium` vs `font-normal`
- **Kontrast** — `text-foreground` vs `text-muted-foreground`
- **Spacing** — wokół ważnego elementu zostawiaj więcej powietrza
- **Pozycja** — góra lewa > góra prawa > środek > dół (w czytaniu zachodnim)

### Anti-pattern: demokracja wizualna

Strony, na których wszystko jest jednakowo ważne — czyli nic nie jest ważne. To najczęstszy błąd początkujących i AI.

```pseudokod
ŹLE — wszystkie nagłówki tej samej wagi:
  H1: "Welcome"           (text-4xl, font-bold)
  H2: "Our services"      (text-3xl, font-bold)
  H2: "Pricing"           (text-3xl, font-bold)
  H2: "Contact"           (text-3xl, font-bold)

DOBRZE — H1 dominuje, H2 są wspierające:
  H1: "Welcome"           (text-6xl, font-bold, tracking-tight)
  H2: "Our services"      (text-3xl, font-semibold)
  H2: "Pricing"           (text-3xl, font-semibold)
  H2: "Contact"           (text-2xl, font-medium)
```

---

## Layout i kompozycja

### Grid system — szacunek dla baseline

8px grid jako mentalna norma. Wszystko skaluje się po wielokrotnościach.

### Asymetria jako narzędzie

Centrowanie wszystkiego = bezpiecznie i nudno. Asymetria buduje napięcie i prowadzi wzrok.

```pseudokod
PRZYKŁADY DOBREJ ASYMETRII:

Hero:
  ┌─────────────────────────────┐
  │  H1 headline                │
  │  text spanning 60%          │
  │  CTA →                      │
  │                  [visual]   │
  └─────────────────────────────┘

Feature row (zigzag):
  [image] →← text
  text →← [image]
  [image] →← text
```

### Negative space

Generous padding wokół ważnych elementów. Strony "ścieśnione" wyglądają tanio.

```pseudokod
Hero section padding:    py-24 md:py-32 lg:py-40
Section gap:             gap-y-16 md:gap-y-24
Card internal padding:   p-6 md:p-8
```

### Kontener jednego oddechu

Każda sekcja ma jedną główną myśl. Jeśli sekcja ma 4 różne idee — to są 4 sekcje, nie jedna.

---

## Komponenty UI — shadcn i konwencje

### Złota zasada — shadcn first

Przed napisaniem jakiegokolwiek komponentu UI sprawdź:

```bash
pnpm dlx shadcn@latest add <nazwa>
```

Jeśli istnieje — używaj. Jeśli nie — zobacz blocks (`shadcn.com/blocks`). Dopiero potem custom.

### Customizacja shadcn — co wolno, co nie

```pseudokod
WOLNO:
  ✓ zmieniać kolory przez tokeny w globals.css
  ✓ dodawać własne warianty przez cva() w pliku komponentu
  ✓ wrappować shadcn w własny komponent w components/shared/
  ✓ rozszerzać propsy (className merge, dodatkowe options)

NIE WOLNO:
  ✗ przepisywać logiki komponentu od zera
  ✗ usuwać a11y attributes (aria-*, role, tabIndex)
  ✗ hardkodować kolorów w pliku komponentu
  ✗ zmieniać struktury HTML "dla wyglądu" (popsuje to Radix primitives)
```

### Stany interaktywne — pełen zestaw

Każdy element interaktywny ma 5 stanów. Zaprojektuj wszystkie, nie tylko default.

```
default     → wygląd spoczynkowy
hover       → wskazówka, że klikalne (bg/border change)
focus       → focus-visible:ring-2 ring-ring (klawiatura)
active      → moment kliknięcia (lekkie scale/darken)
disabled    → opacity-50 cursor-not-allowed
```

Plus dla async:
```
loading     → spinner/skeleton, disabled simultaneously
```

**Focus visible jest święty** — nigdy nie usuwaj `:focus-visible` ringów. To dostępność klawiaturowa.

### Loading states

Każda async operacja musi mieć widoczny feedback. Bez tego user myśli, że strona się zawiesiła.

```pseudokod
Krótkie (< 1s)        → button z spinner
Średnie (1-3s)        → skeleton screen (shadcn Skeleton)
Długie (> 3s)         → progress bar + info "Trwa import..."
Background tasks      → toast notification "Działa w tle"
```

**Skeleton screen > loading spinner** dla zawartości strony. Pokazuje strukturę, nie tylko fakt ładowania.

### Empty states

Pusty stan to *projekt*, nie *brak projektu*. Zawsze:

```
1. Ilustracja lub ikona — nie text-only
2. Heading — "Brak [czegoś] jeszcze"
3. Wyjaśnienie — dlaczego pusto i co się tu pojawi
4. CTA — co user może zrobić, żeby to zmienić
```

Przykład:
```pseudokod
[ikona koszyka]
"Twój koszyk jest pusty"
"Dodaj produkty, by kontynuować zakupy"
[Button: "Przeglądaj produkty"]
```

### Error states

Błąd musi:
- Być widoczny (nie tylko w console)
- Wyjaśniać co się stało (po polsku, bez technicznego żargonu)
- Sugerować co user może zrobić
- Mieć drogę recovery (retry button, link kontaktowy)

```pseudokod
ŹLE:    "Error 500: Internal Server Error"
DOBRZE: "Coś poszło nie tak po naszej stronie.
         Spróbuj ponownie za chwilę.
         [Spróbuj ponownie]   [Zgłoś problem]"
```

### Form UX

Formularze to miejsce, gdzie konwersja umiera. Reguły:

```pseudokod
1. Label NAD inputem, nie obok i nie placeholder-only
2. Required oznaczone gwiazdką lub "Wymagane"
3. Validation INLINE po blur, nie po submit
4. Error message POD inputem, czerwone (destructive)
5. Success state — green border lub checkmark
6. Submit button — disabled gdy invalid, loading state gdy submitting
7. Single column gdy więcej niż 3 pola (badania UX, lepsze conversion)
```

Używaj `shadcn add form` + React Hook Form (gdy projekt to uzasadnia, patrz `STACK.md`).

---

## Dark mode — równoprawny obywatel

Domyślnie projekt obsługuje **oba motywy**. Implementacja przez `next-themes` + shadcn.

### Boilerplate setup

```bash
pnpm add next-themes
```

`components/theme-provider.tsx`:
```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

`app/layout.tsx`:
```tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Theme toggle component — `pnpm dlx shadcn@latest add mode-toggle` (lub własny z `useTheme`).

### Reguły projektowania dla obu motywów

```pseudokod
1. Pisz w tokenach, nie w kolorach.
   bg-background  → automatycznie biały w light, ciemny w dark.
   
2. Sprawdzaj OBA motywy zawsze.
   Element "ładnie" w light może być nieczytelny w dark.
   
3. Dark mode nie jest "light z odwróconymi kolorami".
   Cienie/elevation w dark działają inaczej (subtle borders > shadows).
   
4. Obrazy/ilustracje — sprawdź czy mają wersję dark-friendly.
   Białe tło PNG na ciemnym tle = brzydki box.
```

### Pułapki dark mode

- **Czysta czerń** (`#000`) na backgroundzie wygląda surowo. Lepiej `#0a0a0a` lub `#0f0f0f` (shadcn `background` w dark).
- **Cienie nie działają** na ciemnym tle. Zamiast `shadow-lg` używaj `border border-border` lub subtelnego `bg-card`.
- **Obrazki PNG z białym tłem** wyglądają jak błąd. Używaj SVG z `currentColor` lub PNG z transparency.

---

## Motion — wstrzemięźliwość jest cnotą

Twój priorytet to "wow" na ostatnim miejscu. To znaczy: **mniej animacji, lepiej zrobione.**

### Hierarchia decyzji

```pseudokod
1. Tailwind transition         → 90% przypadków
   hover:bg-accent transition-colors
   
2. CSS animation                → 9% przypadków
   animate-in fade-in slide-in-from-bottom-2 (z tailwindcss-animate)
   
3. Motion (Framer)              → 1% przypadków
   Tylko gdy: orchestrowane sekwencje, gesture, layout animations
```

### Kiedy animować

```
✓ Stany interaktywne (hover, focus) — krótkie, < 200ms
✓ Pojawianie się elementów (mount, scroll into view) — łagodne, 300-500ms
✓ Modal open/close — slide lub fade, 200-300ms
✓ Loading transitions — żeby user wiedział, że coś się dzieje

✗ Wszystko jednocześnie (chaos wizualny)
✗ Animacje przy każdym scrollu (męczy)
✗ Bouncy easings na poważnych stronach (out-of-place)
✗ Auto-playing carousel ("user nie ma kontroli" = frustracja)
```

### Easing — sprawdzone wartości

```pseudokod
ease-in       → wyjście elementu (znika)
ease-out      → wejście elementu (pojawia się) ← DOMYŚLNE
ease-in-out   → tranzycje pomiędzy stanami
linear        → tylko progress bary, loading bars

Domyślny duration:
  fast    → 150ms (hovers)
  default → 200-300ms (state changes)
  slow    → 500ms (większe ruchy, mount)
```

### Reduced motion

Zawsze szanuj `prefers-reduced-motion`. Tailwind ma wbudowany prefix:

```pseudokod
className="transition-all motion-reduce:transition-none motion-reduce:animate-none"
```

---

## Dostępność (a11y) — sugestie, nie ortodoksja

Nie audytujemy WCAG na poziomie konsultanta. Trzymamy się **kluczowych pryncypiów**, które kosztują mało, a dają dużo.

### Sześć rzeczy, których nie pomijamy

```
1. Semantyczny HTML
   <button> dla klikalnych, <a> dla nawigacji, <nav>/<main>/<footer>.
   NIE: <div onClick>.

2. Alt text dla obrazów
   <Image alt="..." /> zawsze. Dekoracja → alt="".

3. Focus visible
   NIE usuwaj outline / ring. shadcn ma to z domu, zostaw.

4. Kontrast tekstu
   Body text > 4.5:1, large text > 3:1. shadcn defaults są ok,
   problem pojawia się gdy customizujesz tokeny — sprawdzaj.

5. Labels w formularzach
   Każdy input ma <label htmlFor> lub aria-label.
   Placeholder NIE jest labelem.

6. Hierarchia nagłówków
   H1 → H2 → H3, nie pomijaj poziomów.
   Jeden H1 na stronę.
```

### Aria w prostych słowach

shadcn (Radix pod spodem) większość aria-* zapewnia automatycznie. Twoja rola:

```pseudokod
✓ Aria-label dla ikon-only buttons:
  <Button size="icon" aria-label="Zamknij menu"><X /></Button>

✓ Role="alert" dla błędów (Radix Form to robi):
  Komunikat błędu automatycznie ogłaszany przez screen readery.

✓ Aria-current dla aktywnego linka w nav:
  <Link aria-current={isActive ? "page" : undefined}>
```

### Kiedy zignorować

A11y nie jest religią — to praktyka. Na demo internal, dev-only narzędziu, prototypie — można pominąć. Na produkcji dla klienta lub publicznej stronie — minimum z listy 6 punktów.

---

## Ikony

shadcn idzie z `lucide-react`. Lucide jest tak popularna, że **stała się rozpoznawalnym podpisem AI**. Mitigacje:

```pseudokod
1. Nie wszystko musi być w kółku.
   Generyczny pattern: "kółko z ikoną" w 3-kolumnowym gridzie.
   Alternatywa: ikona bez kółka, większa, w nietypowym kolorze.
   
2. Mieszaj ikony z typografią.
   Czasem lepiej napisać "→" niż użyć ArrowRight.
   Numery, litery, custom glify dają charakter.
   
3. Konsystencja stroke-width.
   Cały projekt ma jedną grubość kreski (1.5 lub 2). 
   Nie miksuj cienkich i grubych.
   
4. Custom SVG dla brand-relevant elementów.
   Logo zawsze custom. Hero illustration custom.
   Tylko UI utility icons z biblioteki.

Alternatywy lucide gdy nudzi:
  - Phosphor (@phosphor-icons/react) — różne style w jednej rodzinie
  - Tabler (@tabler/icons-react) — neutralne, geometric
  - Iconify (any icon set) — gigantyczna biblioteka
```

---

## AI-slop blacklist (pełna)

Te wzorce krzyczą "wygenerowane przez AI". Skill `frontend-design` od Anthropica wspomina kilka — tu jest pełna lista, w tym specyficzne dla Next.js + shadcn.

### Kolory i tło

- Fioletowo-różowe gradienty (`from-purple-500 to-pink-500`) — definicja AI-slop
- Białe tło + jeden kolor akcentu bez głębi — brakuje atmosfery
- Pełne tło `bg-gradient-to-r` na całych sekcjach — tani efekt
- Glassmorphism (frosted glass) na wszystkim — overused
- "Aurora gradient" w hero — używany w każdym SaaS od 2023

### Typografia

- Inter / Roboto / Space Grotesk jako display font — Claude's defaults
- DM Sans / Open Sans / Poppins — przestarzałe od 2022
- System-ui fonts (`font-sans` bez customizacji) — oznaka braku decyzji
- Wszystkie nagłówki tej samej wielkości — brak hierarchii
- Letter-spacing default na bardzo dużych nagłówkach — luźno wygląda

### Layout

- Wycentrowany hero z H1 + subtitle + 2 buttony (primary + ghost)
- Trzykolumnowy "Features" grid z ikonami w kółkach
- Stacked-card layout z 6 ikonami w gridzie 2×3
- Pricing table z 3 kolumnami i "Most popular" w środku
- Footer z 4 kolumnami: Product / Company / Resources / Legal

### Komponenty

- `<Card>` shadcn bez modyfikacji jako 80% strony
- shadcn `<Badge>` w hero z "✨ New" lub "🚀 Launched"
- Testimoniale z okrągłymi avatarami + 5 gwiazdek + cytat
- "Animated number counter" w statystykach
- Tooltip na każdym elemencie (over-engineering)

### Treść i copy

- "Build faster. Ship better." nagłówek (każdy SaaS)
- "10x your productivity" tagline
- "Trusted by teams at" + szare logo grid
- "Loved by 10,000+ developers" social proof
- "Get started in seconds" pod CTA

### Mikro-elementy

- Emoji w professional B2B copy (🚀 ✨ 💡)
- Ikona "sparkles" przy każdej feature
- "Pro tip:" callouts na blogu
- Gradient text na keyword (`bg-gradient-to-r ... bg-clip-text text-transparent`)
- Animated cursor blink na headlines

### Reguła ratunkowa

Gdy brief popycha w stronę któregoś wzorca:

```
1. Zachowaj funkcję, zmień formę.
   Hero CTA musi być? Tak. Musi być pill button + ghost? Nie.
   
2. Modyfikuj jeden wymiar drastycznie.
   Typografia bardzo charakterystyczna + reszta neutralna.
   Albo: layout asymetryczny + typografia neutralna.
   
3. Customizuj tokeny, nie komponenty.
   shadcn Card z customowymi tokenami koloru/borderu wygląda inaczej
   niż "shadcn Card z defaultów", a kod zostaje czysty.
   
4. Jeden mocny moment > pięć średnich.
   Zamiast 5 animacji daj 1 niezapomnianą.
```

---

## Pre-flight checklist (przed wysłaniem)

Każdy nietrywialny output przed wysłaniem przechodzi przez ten check:

```
[ ] Mobile 360px — bez horizontal scrollu, czytelne, klikalne
[ ] Tablet 768px — sensowny przeskok, nie "rozciągnięte mobile"
[ ] Desktop 1280px+ — content nie pływa, kontener ma max-width
[ ] Light mode — wszystko ok
[ ] Dark mode — wszystko ok (sprawdź!)
[ ] Hover states — wszystkie interaktywne mają feedback
[ ] Focus visible — ringi widoczne na Tab
[ ] Loading states — async ma feedback
[ ] Empty states — pusty stan jest zaprojektowany, nie pominięty
[ ] Typography — display font NIE jest Inter/Roboto/system
[ ] Spacing — używamy skali Tailwinda, nie magic numbers
[ ] Kolory — używamy tokenów shadcn, nie hex
[ ] Hierarchia — jeden H1, jeden primary CTA per sekcja
[ ] AI-slop — żaden z wzorców z blacklist nie wystąpił
```

Jeśli wszystko ✓ — wysyłaj. Jeśli nie — popraw przed wysłaniem.

---

## Mapa pliku — gdzie czego szukać

```
Mobile-first              → sekcja "Mobile-first jako prawo"
Tokeny kolorów            → sekcja "Design tokens" → "Kolory"
Spacing                   → sekcja "Design tokens" → "Spacing scale"
Fonty                     → sekcja "Design tokens" → "Typografia"
Hierarchia                → sekcja "Hierarchia wizualna"
Layout/asymetria          → sekcja "Layout i kompozycja"
shadcn customization      → sekcja "Komponenty UI"
Stany interakcji          → sekcja "Komponenty UI" → "Stany interaktywne"
Loading/empty/error       → sekcja "Komponenty UI"
Forms                     → sekcja "Komponenty UI" → "Form UX"
Dark mode                 → sekcja "Dark mode"
Animacje                  → sekcja "Motion"
Dostępność                → sekcja "Dostępność (a11y)"
Ikony                     → sekcja "Ikony"
Co NIE robić              → sekcja "AI-slop blacklist"
Checklist                 → sekcja "Pre-flight checklist"
```