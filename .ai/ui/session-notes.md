# Podsumowanie Sesji Planowania Architektury UI - Grupka MVP

## Decisions

### Nawigacja i Struktura

1. **Nawigacja główna**: Dwupoziomowa - górny bar z przełącznikiem grup i ikoną profilu, dolny navigation bar (mobile) z sekcjami: Wydarzenia, Dzieci, Członkowie, Więcej. Na desktop - boczne menu.
2. **Onboarding flow**: Trzy ścieżki - (A) Niezalogowany → Landing → Rejestracja/Logowanie → Wybór akcji, (B) Z kodem → Rejestracja → Auto-dołączenie, (C) Zalogowany bez grup → Modal z wyborem.
3. **Routing**: Hierarchiczny z grupą jako context - `/dashboard`, `/groups/:groupId/*`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/api/auth/callback`, `/join`, `/profile`.

### Zarządzanie Stanem i Integracja API

4. **Strategia stanu**: Hybrydowe podejście - Astro SSR dla initial load, React Query dla cache i synchronizacji, Context API dla globalnego UI state. **BRAK realtime w MVP**, **BRAK Redux**.
5. **Context grupy**: URL-based - aktywna grupa to ta w URL, brak globalnego state.
6. **Autentykacja**: Middleware-based protection z Supabase Auth, zgodnie z auth-spec.md - PKCE flow, session w cookies.

### Komponenty i Formularze

7. **Magic Wand**: **Jeden textarea "Co lubi dziecko?"** , po kliknięciu Magic Wand AI poprawia treść w miejscu. Rate limit indicator, localStorage dla drafts.
8. **Kod zaproszenia flow**: **Prosty, bez deep linków** - Admin generuje kod → wysyła Messenger/SMS → Nowy użytkownik wpisuje kod na `/join` → Dołącza. Brak maili z linkami w MVP.
9. **Hidden thread**: Trójwarstwowa ochrona - RLS w DB, API 403, Frontend nie renderuje dla organizatora.
10. **Selekcja gości**: Checkboxy z "Zaznacz wszystkich", search dla >10 dzieci, large touch targets (48px+), alfabetyczne section headers.

### Obsługa Błędów i Loading States

11. **Error handling**: **Proste dla MVP** - Zod validation inline, Toast (Shadcn Sonner) dla API errors, podstawowy Error Boundary, console.error logging.
12. **Loading states**: Skeleton loaders dla list, inline spinners dla buttons, optimistic updates, React Query stale-while-revalidate.

### Design System

13. **Komponenty UI**: Trójwarstwowa architektura - Base (Shadcn/ui), Feature (biznesowe), Layout (Astro). Tailwind 4 config z design tokens w CSS variables.
14. **Typography**: Mobile First - base 16px (mobile), 18px (desktop), fluid scale, min contrast 4.5:1, line height 1.5 dla body.
15. **Responsywność**: Adaptive layouts - vertical list (mobile), grid 2-3 col (tablet/desktop), virtual scrolling dla >50 items.

---

## Matched Recommendations

### 1. Nawigacja i Struktura

- **Dwupoziomowa nawigacja**: Górny bar (group switcher, profile) + dolny nav bar na mobile (Wydarzenia/Dzieci/Członkowie/Więcej), boczne menu na desktop.
- **Hierarchiczny routing** z grupą jako context: `/dashboard` → przegląd grup, `/groups/:groupId/*` dla wszystkich akcji w grupie, auth pages zgodnie z auth-spec.md.
- **URL-based group context**: Aktywna grupa zawsze w URL, brak globalnego state, SEO-friendly, shareable URLs.

### 2. Zarządzanie Stanem

- **Hybrydowe podejście**: Astro SSR (initial load) + React Query (cache, refetch, optimistic updates) + Context API (UI state).
- **Brak realtime w MVP**: Polling/manual refresh wystarczy dla wydarzeń i komentarzy.
- **Brak Redux**: Zbyt ciężki dla MVP, React Query + Context wystarczy.

### 3. Autentykacja (zgodnie z auth-spec.md)

- **Middleware-based protection**: `src/middleware/index.ts` sprawdza session przez Supabase SSR client.
- **Astro Actions**: `src/actions/auth.ts` dla login/register/logout/password reset.
- **Protected routes**: Redirect do `/login?redirect={currentPath}` jeśli brak session.

### 4. Kluczowe Widoki i Przepływy

#### Landing Page (niezalogowani)

- **Statyczna Astro SSR**: Hero (value proposition) + Features (3 kolumny) + How it works (3 kroki) + Footer. Widzialne elementy w języku polskim.
- **Zero JavaScript**: Instant load, Lighthouse >95, obrazy WebP z lazy loading.
- **CTAs**: "Zaloguj się" / "Załóż konto" prominent.

#### Dashboard (`/dashboard`)

- **Overview wszystkich grup**: Cards w grid, stats (X dzieci, Y członków, Z wydarzeń), CTA "Przejdź do grupy".
- **Empty state**: Ilustracja + "Utwórz nową grupę" / "Dołącz do grupy" z opisami.
- **Redirect logic**: Do ostatniej grupy (nice-to-have localStorage) lub pierwszej z listy.

#### Lista Wydarzeń (`/groups/:groupId/events`)

- **Cards responsywne**: Mobile (vertical), Desktop (horizontal z quick actions).
- **Badge "Zaktualizowane"**: Jeśli hasNewUpdates=true (8h window), subtle color, top-right.
- **Sort**: Zaktualizowane na górze (separator), potem chronologicznie.
- **Empty state**: Ilustracja 🎂 + "Utwórz pierwsze wydarzenie" CTA.

#### Szczegóły Wydarzenia (`/groups/:groupId/events/:eventId`)

- **Conditional rendering dla roli**:
    - **Organizator**: Info box "Komentarze ukryte dla niespodzianki 🎁", przyciski Edytuj/Usuń.
    - **Gość**: Sekcja komentarzy - timeline style, input sticky bottom, "Mama Ani" labels, optimistic updates.
- **Wspólne**: Hero z tytułem/datą, opis, bio dziecka (inspiracja), lista gości (collapsible mobile).

#### Lista Dzieci (`/groups/:groupId/children`)

- **Cards z ownership indicator**: Badge "Twoje dziecko" lub border color, avatar/inicjały (color z hash), display name, data urodzenia + wiek, bio preview.
- **Actions**: Edytuj (tylko owner), tap rozwija bio (nie-owner).
- **Empty state**: "Dodaj profil swojego dziecka" + "Zaproś członków" (jeśli admin).

#### Profil Dziecka - Edycja (`/groups/:groupId/children/:childId`)

- **Dual-mode view**: View (display) + Edit (fullscreen mobile, modal desktop).
- **Form fields**: "Nazwa wyświetlana" (required), "Data urodzenia" (optional, native date picker), **"Co lubi dziecko?" (textarea)**.
- **Magic Wand**: Przycisk "🪄 Magic Wand" nad textarea → disable textarea, spinner, API call, replace content z fade animation.
- **Rate limit indicator**: "Pozostało X/10 użyć AI w tej godzinie" pod przyciskiem.
- **Draft autosave**: localStorage co 5s.

#### Lista Członków (`/groups/:groupId/members`)

- **Cards/List items**: Avatar, "Rodzic: [dzieci]", badge "Admin 👑", "W grupie od [relative date]".
- **Admin contact reveal**: Przycisk "Pokaż kontakt" → Dialog z emailem + "Kopiuj" + info o celu.
- **Admin actions**: Menu (three dots) → "Usuń z grupy" → Confirmation dialog (tylko admin, nie self).
- **Sort**: Admini na górze (separator), alfabetycznie.

#### Tworzenie Wydarzenia (`/groups/:groupId/events/new`)

- **Sekcje**: (1) Podstawy - tytuł, data, opis, dziecko (select), (2) Goście - search (>10 dzieci), "Zaznacz wszystkich" toggle, checkboxy (48px+ touch targets), counter, alfabetyczne headers.
- **Bottom sticky bar**: "Anuluj" / "Utwórz wydarzenie" (disabled bez title/date).
- **Validation**: Title + eventDate required, warning jeśli 0 gości.

#### Generowanie Kodu Zaproszenia (`/groups/:groupId/invite`)

- **Duży przycisk "Generuj nowy kod"**.
- **Wyświetlenie kodu**: Karta z kodem (XXX-XXX format), countdown timer (59 min 23 sek), "Kopiuj kod" (haptic feedback), "Udostępnij" (native share API), QR code (opcjonalnie).
- **Lista aktywnych kodów**: Z czasem wygaśnięcia, opcja usunięcia.
- **Helper text**: "Kod ważny 30 minut dla bezpieczeństwa".

#### Dołączanie do Grupy (`/join`)

- **Prosty formularz**: Jedno pole "Wpisz kod zaproszenia" (auto-uppercase, trim), przycisk "Dołącz".
- **Flow**: Logged user → `/join` → wpisuje kod → API `POST /api/invites/join` → redirect do `/groups/:groupId/events` + toast.
- **Error**: "Kod nieprawidłowy/wygasły" → "Poproś administratora o nowy kod".
- **BRAK deep linków `/join?code=XXX` w MVP** - admin wysyła kod przez WhatsApp/SMS, user wpisuje manualnie.

#### Tworzenie Grupy (`/groups/new`)

- **Prosty formularz**: Input "Nazwa grupy" (3-100 znaków), helper text "Możesz zmienić później".
- **Info box (prominent)**: "ℹ️ Jako administrator, Twój email będzie dostępny dla członków w celach organizacyjnych (domyślnie ukryty, widoczny po kliknięciu)".
- **Po sukcesie**: Redirect do `/groups/:groupId/events` + toast + modal z instrukcją generowania kodu.

#### Ustawienia Grupy (`/groups/:groupId/settings`, admin only)

- **Sekcje**: Podstawowe (nazwa), Członkowie (linki do zarządzania), Niebezpieczna strefa (usuń grupę).
- **Usuń grupę**: Dialog z ostrzeżeniem, input potwierdzenia (wpisz nazwę grupy), "Usuń na zawsze" (destructive).

#### Profil Użytkownika (`/profile`)

- **Minimalistyczny**: Email (display only), "Zmień hasło" button, "Moje grupy" (liczba + link), "Moje dzieci" (lista z kontekstem grup), "Wyloguj".
- **Brak avatar upload, extended profile** - zgodnie z minimalizacją danych osobowych.

### 5. Komponenty UI i Design System

#### Architektura Komponentów

- **Base components** (`src/components/ui/`): Shadcn/ui (Button, Card, Input, Dialog, Sheet, Toast, Calendar, DropdownMenu, etc.) - pure React.
- **Feature components** (`src/components/features/`): EventCard, ChildProfile, GroupMemberList, MagicWandForm, CommentThread - React z logiką, konsumują API.
- **Layout components** (`src/components/layouts/`): Astro dla stron (MainLayout, AuthLayout) - statyczne części.
- **Zasada**: Astro dla static, React dla interactive.

#### Design Tokens (Tailwind 4 + CSS Variables)

- **Kolory**: Primary, secondary, accent, error, warning, success, background, foreground, muted, border - w CSS vars.
- **Typography**: Base 16px (mobile), 18px (desktop), fluid scale, min 4.5:1 contrast.
- **Spacing**: Tailwind default scale, touch targets min 44-48px.
- **Border-radius**: Dostosowany do mobile (większe dla lepszego UX).
- **Shadows**: Subtle, elevation hierarchy.
- **Dark mode**: Opcjonalnie w MVP, class strategy (`dark:`).

#### Responsive Patterns

- **Mobile First**: Wszystkie style zaczynają od mobile, breakpoints `md:` `lg:` dla większych ekranów.
- **Adaptive layouts**: Vertical list → Grid 2 col → Grid 3 col / Table view.
- **Touch targets**: Min 48px height/width dla interactive elements.
- **Bottom nav na mobile**: Thumb-friendly zone, sticky fixed.
- **Adaptive navigation**: Bottom bar (mobile) → Left sidebar (desktop).

### 6. Obsługa Błędów i Loading States

#### Error Handling (Proste dla MVP)

- **Client-side validation**: Zod schemas, inline errors pod polami formularzy.
- **API errors**: Toast (Shadcn Sonner) - 4xx message z API, 5xx generyczny "Coś poszło nie tak".
- **Network errors**: Toast "Sprawdź połączenie", auto retry (3s, max 2x).
- **Form submission**: Disable button + spinner, success → toast + redirect, error → toast + stay.
- **Error Boundary**: Podstawowy React Error Boundary - "Coś poszło nie tak" + "Wróć do strony głównej".
- **Logging**: console.error (Sentry później).

#### Loading States

- **Skeleton loaders**: Dla list (wydarzenia, dzieci, członkowie) - skeleton cards zamiast spinnerów.
- **Inline spinners**: W przyciskach (Zapisz, Generuj kod) - spinner inside + disable.
- **Optimistic updates**: Toggle checkbox, add comment - instant UI update, revert on error.
- **React Query**: `staleTime: 5min` - show cached instantly, fetch w tle.
- **SSR advantage**: Initial data z Astro, React hydratuje.

#### Page Transitions (Astro SSR)

- **Initial load**: Server-side render, instant content.
- **Navigation**: Browser default loading indicator (top bar), opcjonalnie View Transitions API (Astro 5).
- **Prefetch**: Links on hover dla instant navigation.
- **Progressive hydration**: Critical above-the-fold first, `client:visible` dla non-critical.

### 7. Patterns i Interakcje

#### Confirmation Dialogs (Destructive Actions)

- **Low risk** (usuń komentarz): Simple alert - "Czy na pewno?" + Anuluj/Usuń.
- **Medium risk** (usuń dziecko/wydarzenie/członka): Dialog z kontekstem konsekwencji + Anuluj (default focus) / Usuń (red).
- **High risk** (usuń grupę): Dialog + input confirmation (wpisz nazwę grupy) + warning o nieodwracalności.

#### Toast Notifications (Shadcn Sonner)

- **Pozycja**: Top-right (desktop), top-center (mobile, nie blokuje bottom nav).
- **Typy**: Success (✓ green, 3s), Error (✕ red, 5s), Info (ℹ️ blue, 3s), Warning (⚠️ orange, 5s).
- **Content**: Krótkie, actionable - "Wydarzenie utworzone", "Kod wygasł", etc.
- **Actions**: Opcjonalnie przycisk (Cofnij, Pokaż).
- **Max 1-2 jednocześnie**, kolejka.

#### Date Pickers

- **Native HTML5**: `<input type="date">` - wywołuje native picker (iOS/Android).
- **Styling**: Tailwind dla spójności z innymi inputs.
- **Validation**: min/max dates (birthDate: max=today, eventDate: min=today dla new).
- **Format**: API YYYY-MM-DD, Display "15 maja 2025" lub "15.05.2025".

#### Group Switcher

- **Trigger**: Górny bar - nazwa grupy + chevron down (truncate long names na mobile).
- **Mobile**: Bottom Sheet (Shadcn) - lista grup, stats, radio dla aktywnej, footer z "Utwórz" / "Dołącz".
- **Desktop**: Dropdown Menu - kompaktowa lista, hover states, keyboard nav.
- **Performance**: Pre-fetch grup (GET /api/groups), cache w React Query.

#### Empty States

- **Kontekstowe dla każdej listy**: Ilustracja + heading + subtext + CTA.
- **Brak wydarzeń**: 🎂 + "Utwórz pierwsze wydarzenie".
- **Brak dzieci**: 👶 + "Dodaj profil dziecka" + "Zaproś członków" (admin).
- **Brak członków**: "Wygeneruj kod zaproszenia".
- **Brak komentarzy**: "Bądź pierwszą osobą..." + focused input.
- **Tone**: Pozytywny, helpful, clear next step.

#### Search i Filtering

- **Search input**: Dla list >10-15 items (dzieci przy tworzeniu wydarzenia, członkowie grupy).
- **Real-time filter**: Filtruj on input change (client-side dla małych list, debounced API dla dużych).
- **Clear button**: X icon w inpucie.
- **Mobile**: Large input, dobra target area.

### 8. Bezpieczeństwo i Privacy

#### Hidden Thread Protection

- **3 warstwy**: (1) RLS w Supabase - blokuje SELECT dla organizer_id, (2) API endpoint zwraca 403, (3) Frontend nie renderuje sekcji.
- **UI dla organizatora**: Info box "💡 Komentarze ukryte dla niespodzianki".
- **Testing**: Automated tests dla RLS.

#### Admin Email Privacy

- **Default hidden**: "Pokaż kontakt" button przy adminie na liście członków.
- **Reveal flow**: Click → Dialog z emailem + "Kopiuj" + info "Użyj w sprawach organizacyjnych".
- **Transparency**: Przy tworzeniu grupy - info box o ujawnieniu emaila.

#### Minimalizacja Danych

- **Profile**: Tylko email (z auth), brak nazwisk, brak avatar w MVP.
- **Dzieci**: Display name (bez nazwiska), optional birth date, optional bio.
- **GDPR-friendly**: Zgoda na ujawnienie emaila (implicit przez tworzenie grupy), możliwość usunięcia konta (future).

### 9. Performance i Optymalizacja

#### Mobile First Performance

- **Lighthouse target**: >90 Performance i Accessibility na mobile.
- **SSR advantage**: Instant initial render z Astro.
- **Code splitting**: Astro automatycznie, React components lazy load gdzie możliwe.
- **Images**: WebP format, lazy loading, responsive srcset.
- **Fonts**: System fonts dla performance, fallback stack.
- **Critical CSS inline**: Reszta async.

#### API Integration Optimization

- **React Query**: Cache strategy - `staleTime: 5min`, `cacheTime: 10min`.
- **Prefetching**: Prefetch critical data (grupy użytkownika) przy app load.
- **Optimistic updates**: Instant UI feedback dla prostych mutacji.
- **Batch requests**: Gdzie możliwe (np. bulk guest selection).
- **Error retry**: Exponential backoff dla network errors.

#### Virtual Scrolling

- **Dla list >50 items**: react-window lub react-virtual.
- **Use cases**: Duże grupy (>30 dzieci/członków), długie listy wydarzeń.
- **Progressive**: Start bez, add jeśli performance issue.

---

## UI Architecture Planning Summary

### Przegląd

Aplikacja Grupka MVP będzie zbudowana jako SSR web app z wykorzystaniem Astro 5, React 19, Tailwind 4 i Shadcn/ui. Filozofia Mobile First jest kluczowa - wszystkie widoki projektowane priorytetowo pod smartfony, desktop jako secondary. Architektura opiera się na hybrid approach: Astro SSR dla statycznych części i initial load, React components dla interaktywności.

### Kluczowe Założenia Techniczne

- **No Redux**: React Query + Context API wystarczy dla MVP.
- **No Realtime**: Polling/manual refresh dla wydarzeń i komentarzy.
- **No Deep Links dla kodów**: Prosty flow - admin wysyła kod tekstem, user wpisuje na `/join`.
- **No localStorage dla last group w MVP**: URL-based context wystarczy, localStorage jako nice-to-have.
- **Simple Error Handling**: Toast notifications, basic Error Boundary, console logging - bez Sentry w MVP.

### Struktura Nawigacji

Aplikacja używa hierarchicznego routingu z grupą jako głównym kontekstem:

- Public routes: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected routes: `/dashboard` (overview grup), `/groups/:groupId/*` (wszystkie akcje w grupie), `/join` (dołącz przez kod), `/profile`
- Nawigacja adaptacyjna: Bottom nav bar na mobile (Wydarzenia/Dzieci/Członkowie/Więcej), left sidebar na desktop
- Group switcher w top bar dla szybkiego przełączania między grupami

### Kluczowe User Flows

#### 1. Nowy Użytkownik (Admin)

Landing page → Rejestracja → Dashboard (empty state) → "Utwórz grupę" → Formularz z info o email privacy → Grupa utworzona → "Wygeneruj kod zaproszenia" → Kod z countdown → Kopiuj/Share → Wysyła innym rodzicom → "Dodaj pierwsze dziecko" → Formularz z Magic Wand → "Utwórz pierwsze wydarzenie" → Wybór gości.

#### 2. Nowy Użytkownik (Member)

Otrzymuje kod od admina → Rejestracja/Login → Dashboard → "Dołącz do grupy" → Wpisuje kod → Dołącza → Widzi wydarzenia grupy → "Dodaj swoje dziecko" → Może komentować w wydarzeniach.

#### 3. Organizator Wydarzenia

Dashboard → Wybór grupy → Wydarzenia → "Utwórz wydarzenie" → Tytuł, data, opis → Wybór gości (search, toggle all, checkboxy) → Zapisuje → Widzi wydarzenie bez komentarzy (info box o hidden thread) → Może edytować/usunąć.

#### 4. Gość Wydarzenia

Dashboard → Wybór grupy → Wydarzenia → Widzi wydarzenie z badge "Zaktualizowane" → Klikam → Szczegóły + bio dziecka (inspiracja) + sekcja komentarzy → Czyta propozycje innych → Dodaje swój komentarz → Optimistic update.

#### 5. Magic Wand Usage

Edycja dziecka → Textarea "Co lubi dziecko?" → Wpisuje notatki ("dinozaury, lego, nie lubi puzzli") → Click "🪄 Magic Wand" → Textarea disabled, spinner → AI poprawia tekst → Fade animation, textarea enabled → User może dalej edytować → Zapisuje.

### Integracja z API

#### Authentication (Zgodnie z auth-spec.md)

- **Supabase Auth z PKCE flow**: Session w cookies, JWT tokens.
- **Middleware**: `src/middleware/index.ts` - sprawdza session dla protected routes.
- **Astro Actions**: `src/actions/auth.ts` - login, register, logout, password reset.
- **Redirect logic**: Niezalogowany na protected route → `/login?redirect={path}`, po login → redirect lub `/dashboard`.

#### Data Fetching Strategy

- **Server-side (Astro pages)**: Initial data fetch w getStaticProps/getServerSideProps, dostępne przez `Astro.props`.
- **Client-side (React components)**: React Query dla interactive data, cache strategy `staleTime: 5min`.
- **Mutations**: React Query mutations z optimistic updates, error handling przez toast.
- **Refetch triggers**: Po mutation success, manual refresh (pull-to-refresh na mobile?), interval polling dla komentarzy (opcjonalnie).

#### API Endpoints Coverage

Wszystkie widoki mapped do API endpoints z api-plan.md:

- `/dashboard` → GET /api/groups
- `/groups/:groupId` → GET /api/groups/:groupId
- `/groups/:groupId/events` → GET /api/groups/:groupId/events
- `/groups/:groupId/events/:eventId` → GET /api/events/:eventId + GET /api/events/:eventId/comments (jeśli gość)
- `/groups/:groupId/children` → GET /api/groups/:groupId/children
- `/groups/:groupId/members` → GET /api/groups/:groupId/members
- `/groups/:groupId/invite` → POST /api/groups/:groupId/invites, GET /api/groups/:groupId/invites
- `/join` → POST /api/invites/join
- Forms → POST/PATCH/DELETE endpoints z validation

### Design System Implementation

#### Component Library Setup

1. **Install Shadcn/ui**: `npx shadcn-ui@latest init` - skonfiguruj z Tailwind 4, wybierz style (default lub custom).
2. **Add components**: Button, Card, Input, Textarea, Dialog, Sheet, Toast (Sonner), Calendar, DropdownMenu, Select, Checkbox, Badge, Skeleton, Avatar.
3. **Customize theme**: `components.json` - accent color (brand), radius (mobile-friendly), base font size (16px).
4. **CSS Variables**: `src/styles/global.css` - kolory, spacing, typography scale, shadows.
5. **Tailwind config**: `tailwind.config.mjs` - extend z CSS vars, custom utilities jeśli needed.

#### Responsive Breakpoints

- **Tailwind default**: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px).
- **Strategy**: Mobile default (no prefix) → Tablet (`md:`) → Desktop (`lg:`) → Large desktop (`xl:` opcjonalnie).
- **Testing**: Chrome DevTools (iPhone SE, Pixel, iPad), real devices.

#### Accessibility Checklist

- Min contrast 4.5:1 (body), 3:1 (large text) - WCAG AA.
- Touch targets min 44-48px.
- Focus visible (outline/ring) na wszystkich interactive elements.
- Keyboard navigation - Tab, Enter, Esc, Arrow keys (dla dropdowns/dialogs).
- Screen reader friendly - aria labels, live regions dla toasts, semantic HTML.
- Native form controls gdzie możliwe (date picker, checkbox, radio).

### Security Considerations

#### Row Level Security (RLS)

- **Hidden thread protection**: Policy blokuje SELECT na `event_comments` gdzie `events.organizer_id = auth.uid()`.
- **Group isolation**: Users access tylko grupy gdzie są members - policy na `group_members`.
- **Ownership enforcement**: Parents tylko swoje dzieci - policy na `children.parent_id = auth.uid()`.

#### Frontend Security

- **No client-side auth bypass**: Middleware checks server-side, nie polegamy na client.
- **CSRF protection**: Supabase cookies z SameSite, CSRF tokens gdzie needed.
- **XSS prevention**: React auto-escapes, sanitize user input przed dangerouslySetInnerHTML (jeśli używamy).
- **Input validation**: Zod schemas na client i server, prevent injection.

#### Privacy by Design

- **Minimal data**: Display names bez nazwisk, optional birth dates, no avatars w MVP.
- **Admin email hidden by default**: Reveal tylko on click z confirmation.
- **GDPR compliance**: Transparency o danych (info box przy tworzeniu grupy), delete account (future).

### Testing Strategy (dla UI)

#### Manual Testing Priority

1. **Critical paths**: Rejestracja → Tworzenie grupy → Dodanie dziecka → Tworzenie wydarzenia → Komentarze (dla gości).
2. **Mobile devices**: iPhone (Safari), Android (Chrome) - real devices, nie tylko emulator.
3. **Touch interactions**: Tap targets, scrolling, keyboard na inpucie.
4. **Error scenarios**: Network offline, API errors, validation errors.

#### Automated Testing (Nice-to-have, nie blocker dla MVP)

- **E2E**: Playwright dla critical user flows.
- **Component tests**: React Testing Library dla feature components.
- **Visual regression**: Chromatic/Percy (jeśli budget).

### Performance Targets

- **Lighthouse Mobile**: >90 Performance, >95 Accessibility, >90 Best Practices, 100 SEO.
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1.
- **Bundle size**: Track z Astro build output, lazy load heavy components.
- **API response times**: <500ms dla GET endpoints (target backend optimization).

### Accessibility Targets

- **WCAG 2.1 Level AA**: Minimum compliance.
- **Keyboard only navigation**: Wszystkie funkcje dostępne bez mouse.
- **Screen reader testing**: NVDA (Windows), VoiceOver (iOS/Mac) - basic testing.
- **Color blind friendly**: Nie polegamy tylko na kolorze dla przekazu info (używamy icons + text).

---

## Unresolved Issues

### 1. Realtime Updates (Odłożone poza MVP)

**Issue**: Obecnie brak realtime synchronizacji dla komentarzy i wydarzeń. Users muszą manualnie odświeżyć stronę aby zobaczyć nowe komentarze/zmiany.

**Options for future**:

- Supabase Realtime subscriptions dla `event_comments` i `events` tables.
- Polling interval (np. co 30s) dla wydarzeń w widoku szczegółów.
- WebSocket connection dla live updates.

**MVP workaround**: Manual refresh, pull-to-refresh na mobile (opcjonalnie), "Odśwież" button w UI.

### 2. Notification System (Poza zakresem MVP)

**Issue**: Users nie dostają powiadomień o nowych wydarzeniach, komentarzach, zmianach w grupie.

**Options for future**:

- Email notifications (configurable preferences).
- Push notifications (requires PWA setup + service worker).
- In-app notification center.

**MVP workaround**: Badge "Zaktualizowane" (8h window) jako passive indicator, users sprawdzają app manualnie.

### 3. Image Upload (Poza zakresem MVP)

**Issue**: Brak możliwości dodania zdjęć dziecka, wydarzenia, avatara użytkownika.

**Options for future**:

- Supabase Storage dla image hosting.
- Image optimization (resize, compress) na upload.
- CDN dla performance.

**MVP workaround**: Emoji/inicjały jako avatary, text-only opisy dzieci i wydarzeń.

### 4. Rich Text Editor dla Bio/Opisu (Nie priorytet w MVP)

**Issue**: Textarea nie wspiera formatowania (bold, italic, lists, links).

**Options for future**:

- Markdown support - user pisze markdown, renderujemy formatted.
- WYSIWYG editor (TipTap, Quill) - ale heavy bundle.

**MVP workaround**: Plain text z line breaks, Magic Wand może generować emoji i basic formatting w plain text.

### 5. Offline Support (Nice-to-have)

**Issue**: App nie działa bez internetu, brak offline cache.

**Options for future**:

- PWA z service worker - cache critical resources.
- IndexedDB dla offline data storage.
- Sync queue dla mutations when back online.

**MVP workaround**: Error message "Sprawdź połączenie internetowe", graceful degradation.

### 6. Multi-language Support (Nie w roadmap MVP)

**Issue**: App tylko w języku polskim.

**Options for future**:

- i18n library (astro-i18next, react-i18next).
- Translation files (JSON).
- Language switcher w profile.

**MVP**: Polski only, hard-coded strings w componentach.

### 7. Advanced Search/Filtering (Nie priorytet MVP)

**Issue**: Brak zaawansowanego search po wydarzeniach (po dacie, child, keywords), po dzieciach (po wieku, interests).

**Options for future**:

- Filter dropdowns/chips (data range, tags).
- Full-text search (Postgres FTS lub Algolia).

**MVP workaround**: Basic client-side search by name (gdzie implemented w rekomendacjach), sort options (chronological, alphabetical).

### 8. Analytics i Monitoring (Setup later)

**Issue**: Brak trackingu user behavior, errors, performance metrics w production.

**Options for future**:

- Google Analytics / Plausible dla user analytics.
- Sentry dla error tracking.
- LogRocket dla session replay (debug issues).

**MVP**: Console.error logging, manual testing reports.

### 9. Onboarding Tutorial (Nice-to-have)

**Issue**: Nowi users mogą nie rozumieć kluczowych features (kody 60-min, hidden thread, Magic Wand) bez guidance.

**Options for future**:

- Interactive walkthrough (Intro.js, Driver.js).
- Tooltips na first use (localStorage tracking).
- Help section z FAQ/video tutorials.

**MVP**: Inline helper texts, info boxes, intuitive UI design, dokumentacja w README.

### 10. Group Settings - Extended (Future features)

**Issue**: Limitowane opcje w ustawieniach grupy - tylko nazwa i usunięcie.

**Options for future**:

- Notification preferences (email digest, push).
- Visibility settings (public/private group - ale aktualnie tylko private z codes).
- Multiple admins (nie tylko creator).
- Transfer ownership.

**MVP**: Basic settings - nazwa grupy, usuń grupę. Single admin (creator) only.

---

## Next Steps

### Immediate (przed rozpoczęciem implementacji)

1. **Review i zatwierdzenie tego dokumentu** przez team/stakeholders.
2. **Utworzenie design mockups** (Figma/Sketch) dla kluczowych ekranów - przynajmniej mobile wersje.
3. **Setup projektu**: Instalacja Shadcn/ui, konfiguracja Tailwind 4, CSS variables.
4. **Przygotowanie Supabase**: RLS policies zgodnie z api-plan.md, test data.

### Phase 1 - Auth i Core Navigation (1-2 tygodnie)

1. Implementacja auth flows zgodnie z auth-spec.md (login, register, password reset).
2. Middleware i protected routes.
3. Layout components (MainLayout z nav, AuthLayout).
4. Landing page (statyczna Astro).
5. Dashboard (overview grup z empty state).

### Phase 2 - Group Management (1-2 tygodnie)

1. Tworzenie grupy + info box o privacy.
2. Lista członków z admin contact reveal.
3. Generowanie kodów zaproszenia z countdown.
4. Dołączanie przez kod (`/join` flow).
5. Group switcher w top bar.
6. Ustawienia grupy (basic).

### Phase 3 - Children Profiles (1 tydzień)

1. Lista dzieci (cards z ownership indicator).
2. Dodawanie dziecka (formularz).
3. Edycja dziecka z **Magic Wand integration** (kluczowa feature!).
4. Widok szczegółów dziecka.
5. Usuwanie dziecka (confirmation).

### Phase 4 - Events (2 tygodnie)

1. Lista wydarzeń z badge "Zaktualizowane".
2. Tworzenie wydarzenia z masową selekcją gości.
3. Widok szczegółów - conditional rendering dla organizatora vs gościa.
4. **Hidden thread implementation** (RLS testing!).
5. Komentarze - lista, dodawanie, usuwanie.
6. Edycja i usuwanie wydarzenia.

### Phase 5 - Polish i Testing (1 tydzień)

1. Error handling - toast notifications, error boundaries.
2. Loading states - skeleton loaders, spinners.
3. Empty states dla wszystkich list.
4. Responsive testing na real devices.
5. Accessibility audit (keyboard nav, screen reader).
6. Performance optimization (Lighthouse audit).

### Phase 6 - Deployment (kilka dni)

1. Production Supabase setup.
2. Environment variables configuration.
3. Build i deploy (DigitalOcean Docker).
4. SSL certificate setup.
5. Smoke testing na production.

**Total estimate: 6-8 tygodni** dla pełnego MVP z 1-2 developerami full-time.

---

## Appendix: Key Files Structure

```
src/
├── actions/
│   └── auth.ts                    # Astro Actions dla auth (login, register, etc.)
├── components/
│   ├── ui/                        # Shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── features/                  # Business logic components
│   │   ├── EventCard.tsx
│   │   ├── ChildProfileCard.tsx
│   │   ├── GroupMemberList.tsx
│   │   ├── MagicWandForm.tsx
│   │   ├── CommentThread.tsx
│   │   ├── InviteCodeGenerator.tsx
│   │   └── ...
│   └── layouts/                   # Astro layout components
│       ├── MainLayout.astro       # With nav (bottom bar mobile, sidebar desktop)
│       └── AuthLayout.astro       # Clean layout for login/register
├── pages/
│   ├── index.astro                # Landing page
│   ├── login.astro                # Login page (z LoginForm component)
│   ├── register.astro             # Register page
│   ├── forgot-password.astro
│   ├── reset-password.astro
│   ├── dashboard.astro            # Overview all groups
│   ├── profile.astro              # User profile
│   ├── join.astro                 # Join group by code
│   ├── groups/
│   │   ├── new.astro              # Create group
│   │   └── [groupId]/
│   │       ├── index.astro        # → redirect to events
│   │       ├── events/
│   │       │   ├── index.astro    # List events
│   │       │   ├── new.astro      # Create event
│   │       │   └── [eventId]/
│   │       │       ├── index.astro  # Event details + comments
│   │       │       └── edit.astro   # Edit event
│   │       ├── children/
│   │       │   ├── index.astro    # List children
│   │       │   ├── new.astro      # Add child
│   │       │   └── [childId]/
│   │       │       ├── index.astro  # Child details
│   │       │       └── edit.astro   # Edit child (Magic Wand!)
│   │       ├── members/
│   │       │   └── index.astro    # List members
│   │       ├── invite.astro       # Generate invite codes
│   │       └── settings.astro     # Group settings
│   └── api/
│       └── auth/
│           └── callback.ts        # PKCE callback
├── middleware/
│   └── index.ts                   # Auth middleware, session check
├── lib/
│   ├── services/
│   │   ├── auth.service.ts        # Auth logic (Supabase calls)
│   │   ├── groups.service.ts      # Groups CRUD
│   │   ├── children.service.ts    # Children CRUD
│   │   ├── events.service.ts      # Events CRUD
│   │   └── ai.service.ts          # Magic Wand API call (OpenRouter)
│   ├── schemas.ts                 # Zod validation schemas
│   └── utils.ts                   # Helper functions
├── db/
│   ├── supabase.client.ts         # Supabase client setup
│   └── database.types.ts          # Generated types from Supabase
├── styles/
│   └── global.css                 # CSS variables, Tailwind base
└── types.ts                       # Shared TypeScript types (DTOs, Entities)
```

---

## Shadcn/ui Components - Lista Wymaganych Komponentów

### Instalacja

Wszystkie komponenty można zainstalować pojedynczo używając CLI:

```bash
npx shadcn@latest add [component-name]
```

Lub wszystkie naraz:

```bash
npx shadcn@latest add button card input textarea dialog sheet toast calendar dropdown-menu select checkbox badge skeleton avatar label separator scroll-area alert-dialog popover switch command
```

### Core Components (Wymagane w MVP)

#### 1. **Button**

- **Użycie**: Wszystkie akcje w aplikacji
- **Lokacje**:
    - CTAs na landing page ("Zaloguj się", "Załóż konto")
    - Formularze (Submit, Anuluj, Zapisz)
    - "Generuj kod", "Kopiuj kod", "Udostępnij"
    - "Dodaj dziecko", "Utwórz wydarzenie", "Utwórz grupę"
    - "Magic Wand", "Wyślij komentarz"
    - Wszystkie akcje CRUD
- **Warianty**: Primary (default), secondary, destructive (delete actions), ghost, outline
- **Instalacja**: `npx shadcn@latest add button`

#### 2. **Card**

- **Użycie**: Container dla contentu w grid/list layouts
- **Lokacje**:
    - Dashboard - karty grup
    - Lista wydarzeń - EventCard
    - Lista dzieci - ChildProfileCard
    - Lista członków - MemberCard
    - Wyświetlenie kodu zaproszenia
    - Widok szczegółów (dziecko, wydarzenie)
- **Komponenty**: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Instalacja**: `npx shadcn@latest add card`

#### 3. **Input**

- **Użycie**: Text input fields w formularzach
- **Lokacje**:
    - Login/Register (email, hasło)
    - Tworzenie/edycja grupy (nazwa)
    - Dodanie dziecka (nazwa wyświetlana)
    - Tworzenie wydarzenia (tytuł)
    - Dołączanie do grupy (kod zaproszenia)
    - Search/filter inputs
    - Confirmation inputs (np. wpisz nazwę grupy do usunięcia)
- **Typy**: text, email, password, search, date
- **Instalacja**: `npx shadcn@latest add input`

#### 4. **Textarea**

- **Użycie**: Multi-line text input
- **Lokacje**:
    - Profil dziecka - "Co lubi dziecko?" (z Magic Wand)
    - Opis wydarzenia
    - Komentarze w wydarzeniach
- **Features**: Auto-resize, character counter
- **Instalacja**: `npx shadcn@latest add textarea`

#### 5. **Dialog**

- **Użycie**: Modal dialogs dla akcji i confirmations
- **Lokacje**:
    - Confirmation dialogs (usuń dziecko, wydarzenie, członka, grupę)
    - Admin contact reveal ("Pokaż kontakt")
    - Onboarding modal dla użytkownika bez grup
    - Error messages (jako alternatywa dla Alert Dialog)
- **Komponenty**: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- **Instalacja**: `npx shadcn@latest add dialog`

#### 6. **Sheet**

- **Użycie**: Slide-over panels, głównie na mobile
- **Lokacje**:
    - Group switcher (bottom sheet na mobile)
    - Mobile menu ("Więcej" w bottom nav)
    - Opcjonalnie: filters/settings panels
- **Strony**: bottom (mobile), left/right (desktop sidebar opcjonalnie)
- **Instalacja**: `npx shadcn@latest add sheet`

#### 7. **Toast (Sonner)**

- **Użycie**: Notifications i feedback messages
- **Lokacje**:
    - Success messages ("Grupa utworzona", "Wydarzenie zapisane", "Kod skopiowany")
    - Error messages ("Nie udało się zapisać", "Kod wygasł")
    - Info messages
    - Warning messages
- **Typy**: success, error, info, warning
- **Pozycja**: top-right (desktop), top-center (mobile)
- **Instalacja**: `npx shadcn@latest add sonner` (używamy Sonner zamiast podstawowego Toast)

#### 8. **DropdownMenu**

- **Użycie**: Context menus i dropdowns
- **Lokacje**:
    - Group switcher (dropdown na desktop)
    - User profile menu (górny bar)
    - Admin actions przy członkach (three dots menu → "Usuń z grupy")
    - Quick actions przy wydarzeniach (desktop)
- **Komponenty**: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
- **Instalacja**: `npx shadcn@latest add dropdown-menu`

#### 9. **Select**

- **Użycie**: Dropdown select dla opcji
- **Lokacje**:
    - Tworzenie wydarzenia - "Czyje urodziny?" (wybór dziecka)
    - Opcjonalnie: Sort/filter options
- **Instalacja**: `npx shadcn@latest add select`

#### 10. **Checkbox**

- **Użycie**: Multiple selection
- **Lokacje**:
    - Tworzenie wydarzenia - wybór gości (lista dzieci)
    - Opcjonalnie: zgoda na regulamin przy rejestracji
    - Opcjonalnie: notification preferences
- **Features**: Large touch targets (48px+)
- **Instalacja**: `npx shadcn@latest add checkbox`

#### 11. **Badge**

- **Użycie**: Status indicators i labels
- **Lokacje**:
    - "Zaktualizowane" badge na wydarzeniach (8h window)
    - "Admin 👑" badge przy członkach
    - "Twoje dziecko" badge w liście dzieci
    - Counter badges (np. "X gości", "X/10 użyć AI")
- **Warianty**: default, secondary, destructive, outline
- **Instalacja**: `npx shadcn@latest add badge`

#### 12. **Skeleton**

- **Użycie**: Loading placeholders
- **Lokacje**:
    - Lista wydarzeń loading
    - Lista dzieci loading
    - Lista członków loading
    - Dashboard loading (karty grup)
    - Szczegóły wydarzenia loading
- **Pattern**: Match final layout (skeleton cards)
- **Instalacja**: `npx shadcn@latest add skeleton`

#### 13. **Avatar**

- **Użycie**: User/child representations
- **Lokacje**:
    - Lista członków (inicjały)
    - Lista dzieci (inicjały z color hash)
    - Komentarze (avatar autora)
    - User profile w top bar
    - Organizator w wydarzeniu
- **Features**: Fallback do inicjałów, color generation
- **Instalacja**: `npx shadcn@latest add avatar`

#### 14. **Label**

- **Użycie**: Form field labels
- **Lokacje**:
    - Wszystkie formularze (login, register, tworzenie grupy, dziecka, wydarzenia)
    - Accessibility - powiązanie label z input
- **Instalacja**: `npx shadcn@latest add label`

#### 15. **Separator**

- **Użycie**: Visual dividers
- **Lokacje**:
    - Separacja sekcji w formularzach
    - "Administratorzy" / "Członkowie" separator w liście członków
    - Separacja "Nowe aktualności" / "Pozostałe wydarzenia"
    - Sekcje w ustawieniach grupy
- **Kierunki**: horizontal, vertical
- **Instalacja**: `npx shadcn@latest add separator`

#### 16. **ScrollArea**

- **Użycie**: Custom scrollable containers
- **Lokacje**:
    - Lista gości w tworzeniu wydarzenia (scrollable z sticky header)
    - Długie listy komentarzy
    - Group switcher z wieloma grupami
    - Opcjonalnie: długie bios dzieci
- **Features**: Custom scrollbar styling
- **Instalacja**: `npx shadcn@latest add scroll-area`

#### 17. **AlertDialog**

- **Użycie**: Confirmation dialogs z akcent na destructive actions
- **Lokacje**:
    - Usuń grupę (high risk - z input confirmation)
    - Usuń wydarzenie
    - Usuń dziecko
    - Usuń członka z grupy
    - Usuń komentarz
- **Różnica od Dialog**: Bardziej assertive, focus na akcji (Cancel/Confirm), lepsze dla destructive actions
- **Instalacja**: `npx shadcn@latest add alert-dialog`

### Optional Components (Nice-to-have, nie blocker dla MVP)

#### 18. **Calendar**

- **Użycie**: Custom date picker
- **Lokacje**:
    - Data urodzenia dziecka (fallback jeśli native `<input type="date">` nie wystarczy)
    - Data wydarzenia (alternatywa dla native)
- **Note**: W MVP używamy native HTML5 date input, Calendar jako fallback
- **Instalacja**: `npx shadcn@latest add calendar`

#### 19. **Popover**

- **Użycie**: Tooltips i info boxes
- **Lokacje**:
    - Helper tooltips (info icons z wyjaśnieniami)
    - Rate limit indicator details (rozwija info o limitach AI)
    - Opcjonalnie: mini preview na hover (np. bio dziecka w liście gości)
- **Instalacja**: `npx shadcn@latest add popover`

#### 20. **Switch**

- **Użycie**: Toggle controls
- **Lokacje**:
    - "Zaznacz wszystkich" / "Odznacz wszystkich" w wyborze gości (alternatywa dla button)
    - Dark mode toggle (jeśli implementujemy w MVP)
    - Notification preferences (future)
- **Instalacja**: `npx shadcn@latest add switch`

#### 21. **Command**

- **Użycie**: Command palette, searchable select
- **Lokacje**:
    - Advanced search dla dzieci w tworzeniu wydarzenia (jeśli >20 dzieci)
    - Quick actions palette (future - Cmd+K for power users)
- **Features**: Keyboard shortcuts, fuzzy search
- **Instalacja**: `npx shadcn@latest add command`

#### 22. **Accordion**

- **Użycie**: Expandable content sections
- **Lokacje**:
    - Lista gości w wydarzeniu (collapsible na mobile)
    - FAQ na landing page (jeśli dodamy)
    - Event card expansion (alternatywny pattern do navigate to details)
- **Instalacja**: `npx shadcn@latest add accordion`

#### 23. **Tabs**

- **Użycie**: Przełączanie widoków
- **Lokacje**:
    - Opcjonalnie: Przełączanie między sekcjami grupy (Wydarzenia/Dzieci/Członkowie) jako alternatywa dla bottom nav na desktop
    - Profile (Moje konto / Moje grupy / Moje dzieci - jeśli rozbudujemy)
- **Note**: Obecnie używamy dedykowanych pages, Tabs jako optional enhancement
- **Instalacja**: `npx shadcn@latest add tabs`

#### 24. **Progress**

- **Użycie**: Progress indicators
- **Lokacje**:
    - Countdown timer dla kodu zaproszenia (visual progress bar 30 min → 0)
    - Upload progress (jeśli dodamy image upload w przyszłości)
    - Multi-step form progress (opcjonalnie dla onboarding)
- **Instalacja**: `npx shadcn@latest add progress`

### Components NOT Needed (dla MVP)

- **Carousel** - brak slideshows w MVP
- **Collapsible** - używamy Accordion lub manual expand/collapse
- **ContextMenu** - right-click menus, nie priorytet dla mobile-first
- **HoverCard** - desktop-only interaction, nie krytyczne
- **Menubar** - desktop menu bar, nie używamy
- **NavigationMenu** - complex navigation, używamy prostszej struktury
- **RadioGroup** - brak use case w MVP (może dla group switcher, ale używamy innego pattern)
- **Slider** - brak range inputs w MVP
- **Table** - listy jako cards, nie table view w MVP
- **Toggle** - podobne do Switch, nie potrzebujemy obu
- **ToggleGroup** - multiple toggle, brak use case
- **Tooltip** - używamy Popover jeśli potrzebne

---

## Szybki Start - Installation Script

Utwórz plik `scripts/install-shadcn.sh`:

```bash
#!/bin/bash

# Core components (required)
echo "Installing core Shadcn components..."
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add sonner
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add badge
npx shadcn@latest add skeleton
npx shadcn@latest add avatar
npx shadcn@latest add label
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add alert-dialog

echo "Core components installed!"

# Optional components (uncomment if needed)
# npx shadcn@latest add calendar
# npx shadcn@latest add popover
# npx shadcn@latest add switch
# npx shadcn@latest add command
# npx shadcn@latest add accordion
# npx shadcn@latest add tabs
# npx shadcn@latest add progress

echo "Done! All components installed."
```

Uruchom:

```bash
chmod +x scripts/install-shadcn.sh
./scripts/install-shadcn.sh
```

---

## Component Usage Summary

| Component      | Frequency     | Priority | Mobile Critical      |
| -------------- | ------------- | -------- | -------------------- |
| Button         | Bardzo wysoka | P0       | ✅                   |
| Card           | Bardzo wysoka | P0       | ✅                   |
| Input          | Bardzo wysoka | P0       | ✅                   |
| Textarea       | Wysoka        | P0       | ✅                   |
| Dialog         | Wysoka        | P0       | ✅                   |
| Sheet          | Średnia       | P0       | ✅ (mobile only)     |
| Toast (Sonner) | Wysoka        | P0       | ✅                   |
| DropdownMenu   | Średnia       | P0       | ⚠️ (desktop primary) |
| Select         | Średnia       | P1       | ✅                   |
| Checkbox       | Średnia       | P0       | ✅                   |
| Badge          | Wysoka        | P0       | ✅                   |
| Skeleton       | Wysoka        | P1       | ✅                   |
| Avatar         | Wysoka        | P1       | ✅                   |
| Label          | Bardzo wysoka | P0       | ✅                   |
| Separator      | Średnia       | P1       | ✅                   |
| ScrollArea     | Średnia       | P1       | ✅                   |
| AlertDialog    | Średnia       | P0       | ✅                   |
| Calendar       | Niska         | P2       | ❌ (native fallback) |
| Popover        | Niska         | P2       | ⚠️                   |
| Switch         | Niska         | P2       | ✅                   |
| Command        | Bardzo niska  | P3       | ❌                   |
| Accordion      | Niska         | P2       | ✅                   |
| Tabs           | Niska         | P2       | ✅                   |
| Progress       | Niska         | P2       | ✅                   |

**Priority Legend:**

- P0 = Must have dla MVP
- P1 = Should have (enhance UX znacząco)
- P2 = Nice to have (można odłożyć)
- P3 = Optional (future enhancement)

---

_Dokument wygenerowany: 2026-01-03_
_Wersja: 1.0 - Initial Planning Session Summary_
