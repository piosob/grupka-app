# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page ma być przyjaznym, statycznym wejściem dla niezalogowanych rodziców, podkreślającym wartość Grupki (mobile-first, prywatność, asynchroniczne komunikacje, AI i ukryte wątki), zachęcającym do zalogowania lub rejestracji oraz pokazującym „Jak to działa” i przykładową kartę wydarzenia bez ujawniania danych.

## 2. Routing widoku

Widok jest przypisany do ścieżki `/` i renderowany w trybie SSR/Astro jako statyczna strona (najlepiej `export const prerender = true` w `src/pages/index.astro`), bez konieczności korzystania z interakcji API.

## 3. Struktura komponentów

- `LandingPage` (komponent Astro)
    - `LandingHero`
    - `FeaturesGrid`
    - `HowItWorksTimeline`
    - `EventPreviewSection`
    - `CTASection`
    - `FooterContact`

## 4. Szczegóły komponentów

### LandingHero

- Opis komponentu: hero z przyjaznym powitaniem, hasłem „Witaj rodzicu...”, krótkim opisem wartości i CTA zachęcającymi do logowania/rejestracji.
- Główne elementy: semantyczne `<header>`, `h1`, `p`, dwa `a`/`Button` (Shadcn) z linkami do `/login` i `/register`, optionalne tło ilustracyjne w `<picture>`.
- Obsługiwane interakcje: kliknięcie CTA przenosi do dedykowanych stron logowania/rejestracji; ewentualne focus styles.
- Obsługiwana walidacja: Sprawdzenie, czy tablica CTA zawiera 2 elementy; fallback tekstu jeśli dane nie są dostępne.
- Typy: `HeroContent` zawierający `title`, `subtitle`, `description`, `ctaButtons: CTAButton[]`.
- Propsy: `content: HeroContent`.

### FeaturesGrid

- Opis komponentu: prezentuje pięć wartości produktowych (mobile-first hub, ograniczone powiadomienia, prywatność, AI, ukryte wątki) w siatce responsywnej; na mobile pojedyncza kolumna, na desktop trzy.
- Główne elementy: `<section>` z `ul`, każde `li` zawiera `h3` i `p`.
- Obsługiwane interakcje: brak (statyczny content).
- Obsługiwana walidacja: wymóg obecności tekstów i opisów; fallback placeholder jeśli brak danych.
- Typy: `FeatureItem { title: string; description: string; accent?: string }`.
- Propsy: `features: FeatureItem[]`.

### HowItWorksTimeline

- Opis komponentu: trzy kroki obrazujące „Jak to działa” (bezpieczeństwo grupy/logowanie, kod 60 min, AI magic wand).
- Główne elementy: `<ol>` lub flex layout z numerem/ikonką, `h4`, `p`.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: dokładnie trzy wpisy; logika powinna obsłużyć brak danych (wyświetla placeholdery).
- Typy: `TimelineStep { id: number; title: string; description: string; hint?: string }`.
- Propsy: `steps: TimelineStep[]`.

### EventPreviewSection

- Opis komponentu: prezentacja przykładowego wydarzenia, zawierająca datę, tytuł, mały opis oraz wzmiankę o ukrytym wątku gości.
- Główne elementy: `<article>` z `header` (tytuł, data), `p`, lista pseudo-komentarzy (ukryty wątek) reprezentowana jako `div` z nazwą dziecka i tekstem.
- Obsługiwane interakcje: brak; może zawierać badge „ukryty wątek” i `aria-live` status `Aktualizacje widoczne przez 8h`.
- Obsługiwana walidacja: sprawdzenie obecności daty i tytułu; domyślne dane demo.
- Typy: `EventPreview { title: string; dateLabel: string; summary: string; hiddenThreadLabel: string; comments: HiddenComment[] }`, `HiddenComment { authorLabel: string; text: string }`.
- Propsy: `event: EventPreview`.

### CTASection

- Opis komponentu: sekcja z mocnym wezwaniem do działania, wyjaśniająca że stworzenie grupy wymaga logowania i zaprezentowanie dwóch przycisków.
- Główne elementy: `section`, `p` z wyjaśnieniem, dwa `a` (Shadcn button) z `href`.
- Obsługiwane interakcje: kliknięcie CTA.
- Obsługiwana walidacja: weryfikacja, że `ctaButtons` zawiera wymagane href i tekst; fallback do `/login`.
- Typy: `CTAButton { label: string; href: string }`.
- Propsy: `ctaButtons: CTAButton[]; helperText?: string`.

### FooterContact

- Opis komponentu: stopka z kontaktem administratora jako „kanał awaryjny”, domyślnie ukrytym, ujawnianym na żądanie.
- Główne elementy: `<footer>`, `<p>`, `<details>`/`<button>` do odkrywania emaila (preferowane `<details>` dla zerowego JS).
- Obsługiwane interakcje: rozsunięcie `<details>` show email.
- Obsługiwana walidacja: sprawdzenie istnienia `adminEmail`; fallback do tekstu „Skontaktuj się z administratorem”.
- Typy: `ContactInfo { label: string; email: string; note: string }`.
- Propsy: `contact: ContactInfo`.

## 5. Typy

- `HeroContent`: `{ title: string; subtitle: string; description: string; ctaButtons: CTAButton[]; }`.
- `CTAButton`: `{ label: string; href: string; variant?: 'primary' | 'secondary'; }`.
- `FeatureItem`: `{ title: string; description: string; accent?: string; }`.
- `TimelineStep`: `{ id: number; title: string; description: string; statusBadge?: string; }`.
- `HiddenComment`: `{ authorLabel: string; text: string; }`.
- `EventPreview`: `{ title: string; dateLabel: string; summary: string; hiddenThreadLabel: string; comments: HiddenComment[]; }`.
- `ContactInfo`: `{ label: string; email: string; note: string; }`.
- `LandingPageProps` (jeśli komponent Astro) może łączyć typy: `{ hero: HeroContent; features: FeatureItem[]; steps: TimelineStep[]; event: EventPreview; contact: ContactInfo; ctaButtons: CTAButton[]; }`.

## 6. Zarządzanie stanem

Widok nie potrzebuje Reactowego state’u ani hooków poza ewentualnymi helperami (np. `useMemo` do agregacji statycznych danych). Interaktywny fragment `FooterContact` można zrealizować przez `<details>` bez JS. Dzięki temu cały widok jest „zero JS” i łatwo osiągnąć Lighthouse > 95.

## 7. Integracja API

Brak integracji z API — wszystkie dane są statyczne i zapisane po stronie serwera w pliku Astro. Nie ma żądań GET/POST do obsłużenia.

## 8. Interakcje użytkownika

- Kliknięcie „Zaloguj się” / „Załóż konto”: przekierowanie do `/login` lub `/register`.
- Rozwinięcie sekcji kontaktu w stopce (`<details>` / `summary`): pokazanie e-maila administratora i możliwości skopiowania.
- Możliwe hover/focus w przyciskach i kartach (dbałość o mobile).

## 9. Warunki i walidacja

- CTA musi zawierać jasny komunikat, że utworzenie grupy wymaga logowania; jeśli dane CTA nie są dostępne, fallback do domyślnych linków.
- Data w karcie wydarzenia i nazwa muszą być obecne (przynajmniej placeholder).
- W sekcji „Jak to działa” powinny być trzy kroki; sprawdzać długość tablicy, w razie braku generować defaultowe kroki.
- Wyświetlenie kontaktu w stopce zależy od obecności maila; w przeciwnym razie pokazujemy ogólne wezwanie do kontaktu.

## 10. Obsługa błędów

- Brak danych: fallbackowe teksty/CTA, aby widok dalej miał sens.
- Brak emaila: zamiast `<details>` wyświetlić „Skontaktuj się z administratorem przez panel logowania”.
- Problemy z ładowaniem obrazów: użyć `loading="lazy"` i `alt`, dodać fallback gradient.
- Błędy renderowania (np. zła długość tablicy) logować w konsoli serwera (np. `console.warn` w `astro`), ale nie blokować widoku.

## 11. Kroki implementacji

1. Ustalić statyczne dane (tablice `features`, `steps`, `hero`, `event`, `contact`, `ctaButtons`) zgodne z typami i PRD.
2. Stworzyć komponenty w `src/components` (np. `LandingHero.astro`, `FeaturesGrid.astro`, `HowItWorksTimeline.astro`, `EventPreviewSection.astro`, `CTASection.astro`, `FooterContact.astro`) z Tailwind/Tokens.
3. W `src/pages/index.astro` złożyć komponenty w odpowiedniej kolejności, przekazując dane przez props.
4. Zadbać o semantykę (header/section/article/footer), alt texty, kontrasty, WebP/images `loading="lazy"` i `picture`/`source`.
5. CTA: użyć Shadcn `Button` lub Astro `<a>` z stylami, zapewnić focus outline, responsive layout.
6. „Jak to działa”: w hen layout `ol`/`grid`, dodać numerację/nagłówki i wspomnienie 60-min kodu oraz Magic Wand.
7. Event Preview: zaprezentować data, badge „Ukryty wątek”, pseudo-komentarze z podpisem dziecka.
8. CTASection: dodać helper text wyjaśniający konieczność logowania i łącząc to z buttonami.
9. FooterContact: wykorzystać `<details>`/`<summary>` do odkrycia emaila i dodać dostępność (aria).
10. Przetestować responsywność na mobile, minimalizować JS, sprawdzić Lighthouse, zadbać o SEO/semantic.
