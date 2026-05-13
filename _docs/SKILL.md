---
name: web-craft
description: Używaj zawsze, gdy zadanie dotyczy budowania, projektowania, refactoringu lub stylowania interfejsów webowych — landing page'y, aplikacji SaaS, dashboardów, MVP, portfolio i komponentów React. Aktywatory PL — "zbuduj stronę", "stwórz komponent", "dodaj sekcję", "zrób landing", "popraw wygląd", "zaprojektuj", "responsywność", "mobile", "shadcn", "tailwind", "Next.js". Aktywatory EN — "build", "create page", "design component", "responsive", "landing", "dashboard". Zakres — Next.js (App Router) + Tailwind + shadcn/ui + TypeScript + pnpm. Mobile-first, full responsive, design-system-driven. NIE używaj dla czystego backendu, skryptów ETL, ani logiki bez warstwy wizualnej.
---

# Web-Craft — sterownik tworzenia interfejsów

Ten skill jest kompasem. Sam w sobie nie zawiera szczegółów — kieruje do `STACK.md` (warstwa technologiczna) i `DESIGN.md` (warstwa wizualna/UX). Każde zadanie webowe przechodzi przez ten plik najpierw.

Komponuje się ze skillem `frontend-design` (oficjalnym od Anthropica). Tamten daje wektor estetycznej odwagi — ten daje wektor inżynierskiej dyscypliny. Razem: pragmatyzm + dbałość o estetykę. Działa również autonomicznie w zależności od poziomu rozbudowy kolejnych plików

---

## Priorytety (kalibracja każdej decyzji)

Przy konfliktach decyzyjnych obowiązuje ta kolejność:

1. **Czysty, utrzymywalny kod** — komponenty, których nie wstyd pokazać za pół roku.
2. **Szybkość dostarczenia** — shadcn block > własna implementacja, gotowe > custom.
3. **Konwersja i skuteczność biznesowa** — UX prowadzi użytkownika do celu.
4. **Wizualne "wow"** — bonus, nie cel sam w sobie.

Konsekwencja praktyczna — jeśli widzisz pokusę "przepiszę ten Button od zera dla lepszego efektu" → zatrzymaj się. Wracaj do priorytetu 1 i 2.

---

## Reguły żelazne (NIE negocjowalne)

Niezależnie od briefu, kontekstu i nacisków usera, te zasady obowiązują zawsze.

- **shadcn jest defaultem.** Każdy komponent UI startuje od pytania "czy shadcn już to ma?". Sprawdzaj `pnpm dlx shadcn@latest add ...` zanim napiszesz cokolwiek własnego.
- **Mobile-first to prawo.** Pisanie CSS i layoutu zaczyna się od widoku mobile. Desktop to nadbudowa, nie punkt startu.
- **Full responsive bez wyjątków.** Każdy komponent działa płynnie od mobile do desktop (zazwyczaj 320px do 1920px). Żadnych "to tylko na desktopa".
- **Najnowsze wersje, zawsze.** NIGDY nie wpisuj konkretnych numerów wersji w komendach instalacji. Zawsze `@latest`. Szczegóły w `STACK.md` → Versioning Policy.
- **TypeScript strict, zawsze.** `any` jest zakazane bez bardzo dobrego uzasadnienia.
- **Design tokens, nie hardcode.** Kolory, spacing, typografia → przez zmienne CSS i Tailwind theme. Nigdy hex w komponencie, nigdy magic number w `padding`. Tworzymy Design Systemy, maksymalnie tokenizujemy całość.
- **Treść po polsku, kod po angielsku.** Komponenty, propsy, nazwy plików, funkcje — angielski. Copy w UI, komentarze tłumaczące biznes — polski (chyba że user explicite powie inaczej).

---

## Proces pracy — 5 kroków

Każdy nietrywialny brief idzie przez ten flow. Nie pomijaj kroków, nawet pod deadline.

### Krok 1 — Zrozum kontekst (zanim cokolwiek napiszesz)

Zadaj sobie cztery pytania:

```
- Typ projektu?     → landing | SaaS | dashboard | MVP | portfolio | inne
- Dla kogo?         → użytkownik końcowy, jego kontekst, urządzenie
- Cel biznesowy?    → konwersja | retencja | prezentacja | edukacja
- Constraints?      → deadline, budżet, ograniczenia techniczne klienta
```

Jeśli któraś odpowiedź jest "nie wiem" i ma realny wpływ na decyzje — **zapytaj usera**. Nie zgaduj.

### Krok 2 — Potwierdź stack

Przeczytaj `STACK.md` jeśli nie masz go w pamięci z tej sesji. Sprawdź:

- Czy projekt już istnieje, czy startujemy od zera?
- Czy struktura folderów zgadza się z konwencją?
- Czy są jakieś `package.json` quirks?

Jeśli projekt już istnieje — **dostosuj się do istniejących wzorców** zanim zaczniesz wprowadzać swoje. Konsystencja > preferencje.

### Krok 3 — Sięgnij do `DESIGN.md`

Przeczytaj sekcje relevantne do zadania:

```
Budujesz cały layout?      → cała sekcja "Hierarchia wizualna" + "Spacing"
Komponent?                 → "UX principles" + "Stany interaktywne"
Formularz?                 → "Form UX" + "Dostępność"
Hero / landing?            → "Typografia" + "Kolory" + "Motion"
```

Nie wymyślaj estetyki na sucho. `DESIGN.md` ma sprawdzone zasady.

### Krok 4 — Buduj mobile-first

Sekwencja kodowania:

```pseudokod
1. Layout dla 360px (zazwyczaj pracujemy w tailwindowych breakpointach) szerokości — działa, czyta się, klikalne touch targets ≥44px
2. Skaluj do 768px (tablet) — dodaj breakpoint, niech grow naturalnie
3. Skaluj do 1024px+ (desktop) — wykorzystaj przestrzeń, ale nie rozmywaj hierarchii
4. Test na 1920px — nie pozwól żeby content się rozjechał
```

Każdy etap ma działający wynik. Nie buduj 3 wersji równolegle — buduj jedną, która rośnie.

### Krok 5 — Self-audit (przed dostarczeniem)

Checklist do mentalnego przejścia przed wysłaniem:

```
[ ] Mobile  — wszystko czytelne, nic nie wychodzi z viewportu, touch targets ok
[ ] Tablet — przejście płynne, nie ma "martwej strefy"
[ ] Desktop — content nie pływa w pustce, kontener ma max-width
[ ] shadcn użyty wszędzie gdzie się dało — nie ma "własnego Button" jeśli istnieje shadcn Button
[ ] Design tokens — kolory z theme, nie hardcode; spacing ze skali, nie magic
[ ] TypeScript — strict, żadnego `any`, propsy typowane
[ ] A11y — semantic HTML, focus visible, aria gdzie potrzeba, kontrast WCAG AA
[ ] Stany — hover, focus, active, disabled, loading dla wszystkich interakcji
[ ] Dark mode (jeśli projekt go ma) — działa, nie tylko "wygląda"
[ ] Czytelność kodu — komponenty pod 200 linii, jedno zadanie, czytelne nazwy
```

Jeśli któryś punkt nie przechodzi — **napraw przed wysłaniem**, nie po.


## Komunikacja z userem

Kilka zasad operacyjnych co do tonu i formy odpowiedzi:

- **Konkrety > teoria.** "Użyj `<Card>` z shadcn + custom border na `--color-accent`" zamiast "rozważ zastosowanie komponentu kontenera z modyfikacją obramowania".
- **Pokazuj kod, nie tylko opisuj.** Snippet > paragraf opisu.
- **Komunikuj decyzje, nie tylko wykonanie.** "Wybrałem shadcn Sheet zamiast Dialog, bo na mobile lepiej się zachowuje" — usera interesuje *dlaczego*, nie tylko *co*.
- **Kwestionuj brief, jeśli widzisz problem.** "Trzy CTA w jednym hero rozcieńczą konwersję — proponuję jedno primary i jedno secondary jako link" jest cenniejsze niż ślepe wykonanie.

---

## Plik mapa

Co jest gdzie w tym skillu:

```
SKILL.md           ← jesteś tu. Sterownik, priorytety, proces.
STACK.md           ← Next.js, Tailwind, shadcn, pnpm, TypeScript. Versioning policy.
DESIGN.md          ← UX/UI, mobile-first, typografia, kolory, spacing, a11y, motion.
```

Trzy pliki. Każdy o jednym aspekcie. Bez duplikacji.

Rozbudowy (gdy zajdzie potrzeba): `recipes/` per typ projektu, `patterns/` per komponent, `presets/` per branża klienta.

---

## Ostatnia zasada — empiryczność

Ten skill nie jest święty. Jeśli zauważysz, że Claude regularnie zawodzi w konkretnym obszarze mimo reguł — to znak, że reguła wymaga doprecyzowania, a nie że trzeba ją powtórzyć głośniej. Iteruj na podstawie obserwacji, nie założeń.
