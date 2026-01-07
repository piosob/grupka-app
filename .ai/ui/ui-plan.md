# Architektura UI dla Grupka MVP

## 1. Przegląd struktury UI

### Założenia projektowe

Grupka MVP to aplikacja webowa typu SSR (Server Side Rendering) zaprojektowana zgodnie z filozofią **Mobile First**, służąca do samoorganizacji rodziców w grupach przedszkolnych i szkolnych. Architektura interfejsu użytkownika opiera się na następujących założeniach:

- **Mobile First**: Wszystkie widoki projektowane priorytetowo pod smartfony (ekrany dotykowe, nawigacja kciukiem)
- **Hybrydowe podejście technicze**: Astro 5 SSR dla initial load + React 19 dla interaktywności
- **Minimalizacja danych osobowych**: Brak nazwisk, opcjonalne daty urodzenia, ukryte emaile
- **Asynchroniczny model komunikacji**: Brak realtime w MVP, polling/manual refresh
- **Bezpieczeństwo przez projektowanie**: Hidden thread (RLS), tymczasowe kody (60 min), email privacy

### Architektura techniczna UI

**Stack technologiczny:**

- Astro 5 - SSR, statyczne komponenty layoutów
- React 19 - interaktywne komponenty (formularze, listy, komentarze)
- Tailwind 4 - styling z CSS variables (design tokens)
- Shadcn/ui - biblioteka komponentów bazowych
- React Query - zarządzanie stanem API (cache, mutations, optimistic updates)
- Context API - globalny stan UI (bez Redux)

**Struktura komponentów:**

1. **Base components** (`src/components/ui/`) - Shadcn/ui (Button, Card, Input, Dialog, Toast, etc.)
2. **Feature components** (`src/components/features/`) - komponenty biznesowe (EventCard, ChildProfile, MagicWand, etc.)
3. **Layout components** (`src/components/layouts/`) - Astro layouts (MainLayout, AuthLayout)

**Zarządzanie stanem:**

- URL jako source of truth dla kontekstu grupy (`:groupId` w ścieżce)
- React Query dla danych z API (cache, refetch, stale-while-revalidate)
- Context API dla UI state (modals, toasts, loading states)
- localStorage dla drafts (Magic Wand textarea) i preferencji UX

### Struktura routingu

Aplikacja wykorzystuje hierarchiczny routing z grupą jako głównym kontekstem:

**Public routes:**

- `/` - Landing page (niezalogowani)
- `/login` - Strona logowania
- `/register` - Strona rejestracji
- `/forgot-password` - Reset hasła (request)
- `/reset-password` - Reset hasła (set new)
- `/api/auth/callback` - PKCE callback (Supabase Auth)

**Protected routes:**

- `/dashboard` - Przegląd wszystkich grup użytkownika
- `/profile` - Profil użytkownika
- `/join` - Dołączenie do grupy przez kod
- `/groups/new` - Utworzenie nowej grupy
- `/groups/:groupId/*` - Wszystkie widoki w kontekście grupy

**Group context routes** (`/groups/:groupId/`):

- `/` - Hub Grupy (Strona startowa grupy, skróty i kontakt z adminem)
- `events` - Pełna lista wydarzeń
- `events/new` - Tworzenie wydarzenia
- `events/:eventId` - Szczegóły wydarzenia + komentarze (dla gości)
- `events/:eventId/edit` - Edycja wydarzenia (organizator)
- `children` - Pełna lista dzieci w grupie
- `children/new` - Dodawanie dziecka
- `children/:childId` - Szczegóły dziecka
- `children/:childId/edit` - Edycja dziecka (Magic Wand)
- `members` - Lista członków grupy
- `invite` - Generowanie kodów zaproszenia (admin)
- `settings` - Ustawienia grupy (admin)

### Nawigacja adaptacyjna

**Mobile (priorytet):**

- **Top bar**: Logo/nazwa grupy (group switcher trigger) + ikona profilu (dropdown)
- **Bottom navigation bar** (fixed, 4 sekcje):
    - Wydarzenia (🎂 icon + label)
    - Dzieci (👶 icon + label)
    - Członkowie (👥 icon + label)
    - Więcej (⋯ icon + label) → otwiera Sheet z dodatkowymi opcjami
- **Touch targets**: Min 48px wysokości dla wszystkich elementów interaktywnych
- **Thumb zone**: Bottom nav w zasięgu kciuka

**Desktop:**

- **Top bar**: Logo + nazwa grupy (dropdown) + nawigacja pozioma + profil (prawy górny róg)
- **Left sidebar** (opcjonalnie dla dużych ekranów): Wydarzenia, Dzieci, Członkowie, Ustawienia
- **Hover states**: Wyraźne dla wszystkich interactive elements
- **Keyboard navigation**: Tab, Enter, Esc, Arrow keys

**Group switcher:**

- **Mobile**: Bottom Sheet z listą grup (radio select) + stats + "Utwórz" / "Dołącz" buttons
- **Desktop**: Dropdown Menu z listą grup + quick stats + actions
- **Pre-fetch**: GET /api/groups przy app load, cache w React Query

## 2. Lista widoków

### 2.1. Landing Page (Widok publiczny)

**Ścieżka:** `/`

**Główny cel:**

- Przywitanie niezalogowanych użytkowników
- Wyjaśnienie wartości aplikacji (value proposition)
- Zachęcenie do rejestracji/logowania

**Kluczowe informacje:**

- Hero section z hasłem ("Witaj rodzicu! Utwórz grupę przedszkolną/szkolną i zorganizuj urodziny bez chaosu")
- Kluczowe wartości produktu:
    - Mobile-first hub dla rodziców
    - Ograniczenie powiadomień (asynchroniczna komunikacja)
    - Ochrona prywatności (brak nazwisk, tymczasowe kody)
    - AI wspierające opisy dzieci (Magic Wand)
    - Ukryte wątki dla niespodzianek
- Sekcja "Jak to działa" (3 kroki)
- Przykładowa karta wydarzenia (preview bez danych)

**Kluczowe komponenty:**

- Hero section (Astro - statyczny)
- Features grid (3 kolumny na desktop, vertical na mobile)
- How it works timeline (3 kroki)
- CTAs: "Zaloguj się" / "Załóż konto" (Button - prominent)
- Footer z informacjami kontaktowymi

**Względy UX/Dostępność/Bezpieczeństwo:**

- Zero JavaScript dla core content (instant load)
- Lighthouse >95 na mobile
- Obrazy WebP z lazy loading
- Semantic HTML (h1, section, article)
- Contrast ratio min 4.5:1
- Język polski, friendly tone

**API Endpoints:** Brak (statyczna strona)

---

### 2.2. Strona Logowania

**Ścieżka:** `/login`

**Główny cel:**

- Umożliwienie logowania użytkownikom posiadającym konto
- Przekierowanie do właściwego widoku po zalogowaniu

**Kluczowe informacje:**

- Formularz logowania (email + hasło)
- Linki do rejestracji i resetu hasła
- Komunikaty błędów (inline validation)

**Kluczowe komponenty:**

- AuthLayout (Astro)
- LoginForm (React component):
    - Input (email) z validation
    - Input (password) z toggle visibility
    - Button "Zaloguj się" (submit)
    - Link "Nie masz konta? Zarejestruj się"
    - Link "Zapomniałeś hasła?"
- Toast (Sonner) dla error messages
- Loading state (spinner w przycisku)

**Względy UX/Dostępność/Bezpieczeństwo:**

- Zod validation przed submit
- Error messages po polsku, user-friendly
- Auto-focus na email input
- Enter key submits form
- Redirect do `?redirect` param lub `/dashboard` po sukcesie
- PKCE flow (Supabase Auth) - zgodnie z auth-spec.md
- Password input type="password" (maskowanie)
- CSRF protection (Supabase cookies)

**API Endpoints:**

- Astro Action: `src/actions/auth.ts` → `login(email, password)`
- Supabase Auth SDK (client-side)

---

### 2.3. Strona Rejestracji

**Ścieżka:** `/register`

**Główny cel:**

- Rejestracja nowych użytkowników
- Utworzenie profilu w bazie danych (trigger)
- Przekierowanie do dashboard lub auto-join jeśli jest kod w session

**Kluczowe informacje:**

- Formularz rejestracji (email + hasło + powtórz hasło)
- Link do logowania
- Informacja o privacy (email używany tylko dla kontaktu w grupach jako admin)

**Kluczowe komponenty:**

- AuthLayout (Astro)
- RegisterForm (React):
    - Input (email) z validation
    - Input (password) z requirements indicator
    - Input (confirm password) z match validation
    - Checkbox opcjonalnie: "Akceptuję regulamin" (jeśli wymagane prawnie)
    - Button "Zarejestruj się"
    - Link "Masz już konto? Zaloguj się"
- Toast dla success/error
- Password strength indicator (opcjonalnie)

**Względy UX/Dostępność/Bezpieczeństwo:**

- Validation: email format, hasło min 8 znaków, match passwords
- Real-time validation feedback
- Info box: "Twój email będzie widoczny jako administrator grupy"
- Automatic profile creation (database trigger)
- Redirect do `/dashboard` lub auto-join jeśli kod w query param
- Rate limiting na backend (prevent spam registrations)

**API Endpoints:**

- Astro Action: `register(email, password)`
- Supabase Auth: `signUp(email, password)`
- Database trigger: `on_auth_user_created()` → insert into `profiles`

---

### 2.4. Reset Hasła (Request)

**Ścieżka:** `/forgot-password`

**Główny cel:**

- Wysłanie emaila z linkiem do resetu hasła

**Kluczowe informacje:**

- Formularz z email input
- Instrukcja: "Wyślemy Ci link do resetu hasła"

**Kluczowe komponenty:**

- AuthLayout
- ForgotPasswordForm (React):
    - Input (email)
    - Button "Wyślij link"
    - Link "Wróć do logowania"
- Success message: "Sprawdź swoją skrzynkę email"
- Toast dla error

**Względy UX/Dostępność/Bezpieczeństwo:**

- Nie ujawniamy czy email istnieje (security)
- Success message zawsze pokazywany (generic)
- Rate limiting (max 3 requests/hour)

**API Endpoints:**

- Supabase Auth: `resetPasswordForEmail(email)`

---

### 2.5. Reset Hasła (Set New)

**Ścieżka:** `/reset-password?token=...`

**Główny cel:**

- Ustawienie nowego hasła przez użytkownika

**Kluczowe informacje:**

- Formularz z nowym hasłem
- Token w URL (z emaila)

**Kluczowe komponenty:**

- AuthLayout
- ResetPasswordForm (React):
    - Input (new password)
    - Input (confirm password)
    - Button "Ustaw nowe hasło"
- Toast dla success/error
- Redirect do `/login` po sukcesie

**Względy UX/Dostępność/Bezpieczeństwo:**

- Token validation
- Password strength requirements
- Expire old sessions po zmianie hasła
- Success toast + redirect do login

**API Endpoints:**

- Supabase Auth: `updateUser({ password: newPassword })`

---

### 2.6. Dashboard (Przegląd grup)

**Ścieżka:** `/dashboard`

**Główny cel:**

- Wyświetlenie wszystkich grup użytkownika
- Szybki dostęp do każdej grupy
- Opcje utworzenia nowej grupy lub dołączenia przez kod

**Kluczowe informacje:**

- Lista grup użytkownika (cards)
- Dla każdej grupy:
    - Nazwa grupy
    - Rola (Admin/Członek)
    - Stats: X dzieci, Y członków, Z nadchodzących wydarzeń
    - Data dołączenia
    - CTA "Przejdź do grupy" → `/groups/:groupId` (Hub Grupy)

**Kluczowe komponenty:**

- MainLayout (bez bottom nav - dashboard specific)
- GroupCard (React):
    - Card container
    - Badge dla roli (Admin 👑)
    - Stats row (icons + numbers)
    - Button "Przejdź"
- Empty state component:
    - Ilustracja 🎨
    - Heading "Witaj w Grupce!"
    - Subtext "Utwórz nową grupę lub dołącz do istniejącej"
    - Button "Utwórz grupę" → `/groups/new`
    - Button "Dołącz do grupy" → `/join`
- Skeleton loaders dla loading state

**Względy UX/Dostępność/Bezpieczeństwo:**

- SSR initial data (Astro props)
- React Query cache dla szybkiego dostępu
- Grid layout: 1 col (mobile), 2 col (tablet), 3 col (desktop)
- Touch-friendly cards (min 48px height)
- Redirect logic: jeśli tylko 1 grupa → auto redirect (opcjonalnie)
- localStorage: last visited group (nice-to-have)

**API Endpoints:**

- `GET /api/groups` → GroupListItemDTO[]
- `POST /api/groups` → CreateGroupCommand → CreateGroupResponseDTO

---

### 2.7. Tworzenie Grupy

**Ścieżka:** `/groups/new`

**Główny cel:**

- Utworzenie nowej grupy
- Uświadomienie użytkownikowi o ujawnieniu emaila jako admin
- Automatyczne nadanie roli Admin

**Kluczowe informacje:**

- Formularz tworzenia grupy
- Prominent info box o privacy emaila

**Kluczowe komponenty:**

- MainLayout
- CreateGroupForm (React):
    - Input "Nazwa grupy" (3-100 znaków)
    - Label + helper text "Możesz zmienić później"
    - Alert (info variant):
        - Icon ℹ️
        - Text: "Jako administrator, Twój email będzie dostępny dla członków w celach organizacyjnych (domyślnie ukryty, widoczny po kliknięciu)"
    - Button "Anuluj" (secondary)
    - Button "Utwórz grupę" (primary, disabled bez nazwy)
- Toast success: "Grupa utworzona!"
- Modal po sukcesie (opcjonalnie):
    - "Teraz wygeneruj kod zaproszenia aby zaprosić członków"
    - Button "Wygeneruj kod" → `/groups/:groupId/invite`
    - Button "Później"

**Względy UX/Dostępność/Bezpieczeństwo:**

- Zod validation: name required, 3-100 chars
- Auto-trim whitespace
- Transparency o email privacy (GDPR compliance)
- Transaction: insert group + insert group_member (role=admin)
- Redirect do `/groups/:groupId/events` po sukcesie
- Focus na input przy mount

**API Endpoints:**

- `POST /api/groups` → CreateGroupCommand → CreateGroupResponseDTO

---

### 2.8. Hub Grupy (Strona startowa grupy)

**Ścieżka:** `/groups/:groupId`

**Główny cel:**

- **Glanceable Hub**: Centralny punkt styku po wejściu do grupy, pokazujący "co się dzieje" bez konieczności nawigowania głębiej.
- Szybki podgląd najważniejszych informacji (nadchodzące urodziny, Twoje dziecko).
- Jasna ścieżka kontaktu z administratorem grupy.
- Główny punkt rozbiegowy do sekcji Wydarzeń, Dzieci i Członków.

**Kluczowe informacje:**

- Nazwa grupy i Twoja rola (Admin/Członek).
- **Sekcja Administratora**: Imię/ksywka admina + przycisk "Pokaż kontakt" (reveal email).
- **Nadchodzące Wydarzenia**: Skrót 1-2 najbliższych urodzin/wydarzeń.
- **Dzieci**: Szybki podgląd liczby wszystkich dzieci w tej grupie.
- **Statystyki grupy**: Liczniki dzieci, członków i aktywnych wydarzeń.

**Kluczowe komponenty:**

- MainLayout (z nawigacją górną i dolną).
- GroupHub (React):
    - **Nagłówek Grupy**: Tytuł, badge roli, info o adminie.
    - **Launchpad (Aktywne kafle)**:
        - **Kafel 🎂 Wydarzenia**: Pokazuje najbliższe wydarzenie. Kliknięcie prowadzi do `/events`.
        - **Kafel 👶 Dzieci**: Pokazuje łączną liczbę dzieci w grupie. Kliknięcie prowadzi do `/children`.
        - **Kafel 👥 Członkowie**: Pokazuje liczbę rodziców. Kliknięcie prowadzi do `/members`.
    - **Admin Actions Section** (tylko dla admina):
        - Przycisk "Generuj kod zaproszenia" (z informacją o ważności 60 min).
        - Przycisk "Ustawienia grupy".

**Względy UX/Dostępność/Bezpieczeństwo:**

- Mobile First: kafle o dużym polu dotyku (min 48px)
- Hierarchia informacji: administrator na górze jako "kanał awaryjny"
- Szybki dostęp do listy wszystkich dzieci w grupie
- RLS: tylko członkowie grupy mają dostęp do Hubu

**API Endpoints:**

- `GET /api/groups/:groupId` → GroupDetailDTO
- `GET /api/groups/:groupId/summary` → GroupSummaryDTO (nadchodzące wydarzenia, statystyki)

---

### 2.9. Lista Wydarzeń

**Ścieżka:** `/groups/:groupId/events`

**Główny cel:**

- Wyświetlenie wszystkich wydarzeń w grupie
- Szybki dostęp do szczegółów wydarzenia
- Widoczność aktualizacji (badge 8h)
- Możliwość utworzenia nowego wydarzenia

**Kluczowe informacje:**

- Lista wydarzeń (upcoming + past)
- Dla każdego wydarzenia:
    - Tytuł
    - Data wydarzenia
    - Czyje urodziny (nazwa dziecka)
    - Liczba gości
    - Badge "Zaktualizowane" (jeśli updatedAt < 8h)
    - Indicator: czy jesteś organizatorem czy gościem
    - Preview opisu (truncated)

**Kluczowe komponenty:**

- MainLayout z bottom nav (Wydarzenia - active)
- EventCard (React):
    - Card wrapper
    - Badge "Zaktualizowane" (conditional, top-right)
    - Title (h3)
    - Date display (formatted: "15 maja 2025")
    - Child name + avatar/inicjały
    - Guest count badge
    - Role indicator: "Organizujesz" / "Jesteś gościem"
    - Description preview (2 linie max)
    - Click całej karty → navigate to details
- Separator: "Zaktualizowane" / "Nadchodzące" / "Minione"
- FAB (Floating Action Button) "+" → `/groups/:groupId/events/new` (mobile)
- Button "Utwórz wydarzenie" (desktop, header)
- Empty state:
    - Icon 🎂
    - "Brak wydarzeń"
    - "Utwórz pierwsze wydarzenie aby zorganizować urodziny"
    - Button "Utwórz"
- Skeleton loaders
- Infinite scroll lub pagination (jeśli >20 wydarzeń)

**Względy UX/Dostępność/Bezpieczeństwo:**

- Sort: Zaktualizowane na górze (badge), potem chronologicznie (upcoming first)
- hasNewUpdates computed backend: `updated_at > NOW() - INTERVAL '8 hours'`
- Query params: `?upcoming=true` (filter)
- Card layout: vertical (mobile), horizontal (desktop) - adaptacyjny
- Touch targets min 48px
- Loading states: skeleton cards
- Error state: Toast + retry button
- RLS: tylko członkowie grupy widzą wydarzenia

**API Endpoints:**

- `GET /api/groups/:groupId/events?limit=20&offset=0&upcoming=false&sortBy=eventDate&sortOrder=asc` → EventListItemDTO[]

---

### 2.9. Szczegóły Wydarzenia

**Ścieżka:** `/groups/:groupId/events/:eventId`

**Główny cel:**

- Wyświetlenie pełnych informacji o wydarzeniu
- **Dla organizatora**: Możliwość edycji/usunięcia, INFO o ukrytych komentarzach
- **Dla gościa**: Dostęp do ukrytego wątku komentarzy + bio dziecka (inspiracja prezentowa)

**Kluczowe informacje:**

- Tytuł wydarzenia
- Data wydarzenia
- Opis pełny
- Nazwa dziecka + bio (dla gości - inspiracja)
- Lista gości (nazwy dzieci)
- **Dla gościa**: Sekcja komentarzy (hidden thread)
- **Dla organizatora**: Info box o ukrytym wątku

**Kluczowe komponenty:**

**Wspólne dla obu ról:**

- MainLayout z back button
- Event hero section:
    - Title (h1)
    - Date (large, formatted)
    - Badge "Zaktualizowane" (jeśli < 8h)
    - Organizator info: "Organizuje: Mama Stasia"
- Child profile card (conditional - dla gości):
    - Avatar/inicjały
    - Display name
    - Bio (pełny tekst) - "🎁 Pomysły na prezent:"
    - Birth date (wiek obliczony)
- Guest list (collapsible na mobile):
    - ScrollArea z nazwami dzieci
    - Avatar + display name dla każdego
    - "X gości" w headerze

**Dla organizatora (isOrganizer=true):**

- Alert (info variant):
    - Icon 💡
    - "Komentarze gości są ukryte, aby zachować niespodziankę"
- Action buttons (desktop: top-right, mobile: bottom sticky):
    - Button "Edytuj" → `/groups/:groupId/events/:eventId/edit`
    - Button "Usuń" (destructive) → AlertDialog z confirmation

**Dla gościa (isOrganizer=false):**

- CommentThread component (React):
    - Comments list (timeline style):
        - Avatar autora
        - Author label: "Mama Ani"
        - Comment content
        - Timestamp (relative: "2 godziny temu")
        - Button "Usuń" (tylko własne komentarze)
    - Comment input (sticky bottom na mobile):
        - Textarea (auto-resize, max 2000 chars)
        - Button "Wyślij" (disabled jeśli empty)
        - Character counter
    - Empty state: "Bądź pierwszą osobą która zaproponuje prezent!"
    - Loading: Skeleton comments
    - Optimistic update: nowy komentarz pojawia się natychmiast

**Względy UX/Dostępność/Bezpieczeństwo:**

- **Hidden thread protection (3 warstwy):**
    1. RLS w DB: `events.organizer_id != auth.uid()` dla SELECT na `event_comments`
    2. API: 403 response jeśli organizer próbuje GET /api/events/:eventId/comments
    3. Frontend: sekcja komentarzy nie renderuje dla organizatora
- Bio dziecka widoczne dla gości (inspiracja prezentowa)
- Collapsible guest list na mobile (save space)
- Optimistic updates dla komentarzy (instant feedback)
- Auto-scroll do nowego komentarza po wysłaniu
- Relative timestamps (2h ago, wczoraj, 3 dni temu)
- Author label z dziecka autora w tej samej grupie

**API Endpoints:**

- `GET /api/events/:eventId` → EventDetailDTO
- `GET /api/events/:eventId/comments?limit=50&offset=0` → EventCommentDTO[] (tylko dla gości)
- `POST /api/events/:eventId/comments` → CreateEventCommentCommand (tylko dla gości)
- `DELETE /api/events/:eventId/comments/:commentId` (tylko author)
- `DELETE /api/events/:eventId` (tylko organizator)

---

### 2.10. Tworzenie Wydarzenia

**Ścieżka:** `/groups/:groupId/events/new`

**Główny cel:**

- Utworzenie nowego wydarzenia urodzinowego/zbiórki
- Wybór dziecka (optional - czyje urodziny)
- Masowa selekcja gości (checkboxy z "Zaznacz wszystkich")

**Kluczowe informacje:**

- Formularz tworzenia wydarzenia
- Lista wszystkich dzieci w grupie (guest selection)

**Kluczowe komponenty:**

- MainLayout z back button
- CreateEventForm (React) - multi-section:

    **Sekcja 1: Podstawowe informacje**
    - Input "Tytuł" (required, 1-100 znaków)
    - Input type="date" "Data wydarzenia" (required, min=today)
    - Textarea "Opis" (optional, auto-resize)
    - Select "Czyje urodziny?" (optional, lista dzieci w grupie)

    **Sekcja 2: Goście**
    - Search input (jeśli >10 dzieci): real-time filter po displayName
    - Button/Switch "Zaznacz wszystkich" / "Odznacz wszystkich" (toggle)
    - ScrollArea z listą dzieci:
        - Checkbox (large, 48px+ target)
        - Avatar + display name
        - Parent indicator: "Rodzic: Mama Kasi"
        - Alfabetyczne section headers (A, B, C...)
    - Counter badge: "X z Y dzieci zaznaczonych"

    **Sticky bottom bar (mobile) / Footer (desktop):**
    - Button "Anuluj" (secondary)
    - Button "Utwórz wydarzenie" (primary, disabled jeśli brak title/date)
    - Warning jeśli 0 gości: "Nie zaznaczono żadnych gości"

- Toast success: "Wydarzenie utworzone!"
- Redirect do `/groups/:groupId/events/:eventId` po sukcesie

**Względy UX/Dostępność/Bezpieczeństwo:**

- Validation: title + eventDate required
- Native date picker (mobile-friendly)
- Large checkbox targets (48px min)
- Search debounced (300ms)
- "Zaznacz wszystkich" → check all visible (po search)
- Optimistic guest count update
- Alfabetyczne headers dla >15 dzieci (łatwiejsze scrollowanie)
- Virtual scrolling dla >50 dzieci (opcjonalnie)
- Zod validation przed submit
- RLS: tylko członkowie grupy mogą tworzyć wydarzenia
- guestChildIds validation: wszystkie dzieci muszą być w tej samej grupie

**API Endpoints:**

- `GET /api/groups/:groupId/children` → ChildListItemDTO[] (dla listy gości)
- `POST /api/groups/:groupId/events` → CreateEventCommand → CreateEventResponseDTO

---

### 2.11. Edycja Wydarzenia

**Ścieżka:** `/groups/:groupId/events/:eventId/edit`

**Główny cel:**

- Edycja istniejącego wydarzenia (tylko organizator)
- Zmiana tytułu, daty, opisu, listy gości

**Kluczowe informacje:**

- Formularz edycji z pre-filled wartościami
- Identical do create form

**Kluczowe komponenty:**

- EditEventForm (React) - similar to CreateEventForm
- Pre-populated fields z EventDetailDTO
- Identical layout i validation
- Button "Zapisz zmiany" zamiast "Utwórz"
- Toast success: "Zmiany zapisane!"
- Redirect do `/groups/:groupId/events/:eventId` po sukcesie

**Względy UX/Dostępność/Bezpieczeństwo:**

- 403 jeśli nie-organizator próbuje dostęp
- Loading state: skeleton form podczas fetch danych
- Dirty state tracking: warning jeśli unsaved changes + navigate away
- Optimistic update: instant redirect po submit
- `updated_at` timestamp zmienia się → triggers "Zaktualizowane" badge (8h)
- RLS: tylko organizer może PATCH

**API Endpoints:**

- `GET /api/events/:eventId` → EventDetailDTO (pre-fill)
- `PATCH /api/events/:eventId` → UpdateEventCommand → UpdateEventResponseDTO

---

### 2.12. Lista Dzieci

**Ścieżka:** `/groups/:groupId/children`

**Główny cel:**

- Wyświetlenie wszystkich dzieci w grupie
- Szybki dostęp do profilu dziecka
- Możliwość dodania własnego dziecka
- Widoczność ownership (które dziecko jest moje)

**Kluczowe informacje:**

- Lista wszystkich dzieci w grupie
- Dla każdego dziecka:
    - Display name
    - Avatar/inicjały (color z hash)
    - Birth date + wiek obliczony
    - Bio preview (2 linie max)
    - Ownership indicator (badge "Twoje dziecko" lub border color)
    - Parent info: "Rodzic: Mama Kasi" (z pierwszego dziecka tego rodzica)

**Kluczowe komponenty:**

- MainLayout z bottom nav (Dzieci - active)
- ChildProfileCard (React):
    - Card wrapper (border color jeśli isOwner)
    - Badge "Twoje dziecko" (conditional, top-right)
    - Avatar (inicjały, background z hash display name)
    - Display name (h3)
    - Birth date + wiek: "5 lat (ur. 15.05.2019)"
    - Bio preview (truncated, 2 linie)
    - Click card → expand bio inline (nie-owner) LUB navigate to details (owner)
    - Button "Edytuj" (conditional, tylko owner) → `/groups/:groupId/children/:childId/edit`
- FAB "+" → `/groups/:groupId/children/new` (mobile)
- Button "Dodaj dziecko" (desktop, header)
- Empty state (conditional based on role):
    - Jeśli admin i 0 dzieci w grupie:
        - Icon 👶
        - "Brak dzieci w grupie"
        - "Dodaj profil swojego dziecka i zaproś innych członków"
        - Button "Dodaj dziecko"
        - Button "Wygeneruj kod zaproszenia"
    - Jeśli member i 0 własnych dzieci:
        - "Dodaj profil swojego dziecka"
        - Button "Dodaj dziecko"
- Skeleton loaders
- Sort: Alfabetycznie po display name

**Względy UX/Dostępność/Bezpieczeństwo:**

- isOwner computed: `child.parentId === auth.uid()`
- Color hash dla avatara: consistent per child (nie random)
- Expand/collapse bio inline (nie-owner): toggle height z animation
- Touch targets min 48px
- Grid layout: 1 col (mobile), 2 col (tablet), 3 col (desktop)
- Loading: skeleton cards
- RLS: tylko członkowie grupy widzą dzieci
- Parent info z child's parent_id join profiles (nie pokazujemy emaila, tylko "Mama/Tata X")

**API Endpoints:**

- `GET /api/groups/:groupId/children?limit=50&offset=0` → ChildListItemDTO[]

---

### 2.13. Dodawanie Dziecka

**Ścieżka:** `/groups/:groupId/children/new`

**Główny cel:**

- Dodanie profilu dziecka do grupy
- Wsparcie AI (Magic Wand) przy tworzeniu bio

**Kluczowe informacje:**

- Formularz dodawania dziecka
- Magic Wand dostępny dla bio

**Kluczowe komponenty:**

- MainLayout z back button
- CreateChildForm (React):
    - Input "Nazwa wyświetlana" (required, 1-50 znaków)
        - Helper text: "Np. 'Staś', 'Staś od Kasi'"
        - No surnames reminder
    - Input type="date" "Data urodzenia" (optional)
        - Helper text: "Opcjonalne - ułatwi organizację urodzin"
    - **MagicWand textarea section:**
        - Label "Co lubi Twoje dziecko?" (optional)
        - Textarea (max 1000 znaków, auto-resize)
        - Helper text: "Wpisz hasłowe notatki lub kliknij 🪄 aby AI pomógł je opisać"
        - Button "🪄 Magic Wand" (prominent, above textarea)
            - Disabled jeśli textarea empty
            - Loading state: spinner + disable textarea
            - Rate limit indicator pod przyciskiem: "Pozostało X/10 użyć w tej godzinie"
        - Character counter: "X/1000"
    - Bottom bar:
        - Button "Anuluj" (secondary)
        - Button "Dodaj dziecko" (primary, disabled jeśli brak displayName)
- Toast success: "Profil dziecka dodany!"
- Redirect do `/groups/:groupId/children` po sukcesie

**Względy UX/Dostępność/Bezpieczeństwo:**

- Zod validation: displayName required, bio max 1000 chars
- Magic Wand flow:
    1. User wpisuje notatki: "dinozaury, lego, nie lubi puzzli"
    2. Click Magic Wand → disable textarea, show spinner w przycisku
    3. POST /api/ai/magic-wand z notes + childDisplayName
    4. Response: generatedBio
    5. Replace textarea content z fade animation
    6. Enable textarea - user może dalej edytować
    7. User click "Dodaj dziecko" - zapisuje finalną wersję
- localStorage draft autosave co 5s (recovery po accidental close)
- Rate limit: max 10 requests/hour/user (backend enforced)
- Rate limit indicator update po każdym użyciu
- 429 response → Toast "Osiągnięto limit użyć AI, spróbuj za godzinę"
- Draft clear po successful submit

**API Endpoints:**

- `POST /api/ai/magic-wand` → MagicWandCommand → MagicWandResponseDTO
- `POST /api/groups/:groupId/children` → CreateChildCommand → CreateChildResponseDTO

---

### 2.14. Edycja Dziecka (z Magic Wand)

**Ścieżka:** `/groups/:groupId/children/:childId/edit`

**Główny cel:**

- Edycja profilu dziecka (tylko parent)
- Wsparcie AI przy edycji bio (kluczowa feature MVP)

**Kluczowe informacje:**

- Formularz edycji z pre-filled wartościami
- Identical do add form + Magic Wand

**Kluczowe komponenty:**

- EditChildForm (React) - identical to CreateChildForm
- Pre-populated fields z ChildDetailDTO
- Magic Wand działa identycznie jak w create
- Button "Zapisz zmiany" zamiast "Dodaj"
- Toast success: "Zmiany zapisane!"
- Redirect do `/groups/:groupId/children` po sukcesie

**Względy UX/Dostępność/Bezpieczeństwo:**

- 403 jeśli nie-parent próbuje dostęp (RLS + API)
- Loading state: skeleton form podczas fetch
- Dirty state tracking: warning jeśli unsaved changes
- Magic Wand może być używany wielokrotnie (iteracyjne poprawianie)
- localStorage draft (per childId)
- Draft restore jeśli user wraca do edycji
- Clear draft po successful submit
- RLS: tylko parent (child.parent_id = auth.uid()) może PATCH

**API Endpoints:**

- `GET /api/children/:childId` → ChildDetailDTO (pre-fill)
- `POST /api/ai/magic-wand` → MagicWandCommand
- `PATCH /api/children/:childId` → UpdateChildCommand → UpdateChildResponseDTO

---

### 2.15. Szczegóły Dziecka (View Only)

**Ścieżka:** `/groups/:groupId/children/:childId`

**Główny cel:**

- Wyświetlenie pełnego profilu dziecka
- Dla parent: quick access do edycji
- Dla innych: read-only view z pełnym bio

**Kluczowe informacje:**

- Display name
- Avatar/inicjały
- Birth date + wiek
- Pełne bio
- Parent info
- Lista nadchodzących wydarzeń z tym dzieckiem (opcjonalnie)

**Kluczowe komponenty:**

- MainLayout z back button
- Child profile view:
    - Hero section:
        - Large avatar
        - Display name (h1)
        - Birth date + wiek
        - Badge "Twoje dziecko" (conditional)
    - Bio section:
        - Heading "O dziecku"
        - Full bio text (formatted, line breaks)
    - Parent info (jeśli nie-owner):
        - "Rodzic: Mama Kasi"
    - Upcoming events section (opcjonalnie):
        - "Nadchodzące wydarzenia"
        - Mini event cards (3 max)
        - Link "Zobacz wszystkie"
    - Action buttons (conditional - tylko owner):
        - Button "Edytuj" → `/groups/:groupId/children/:childId/edit`
        - Button "Usuń" (destructive) → AlertDialog z confirmation

**Względy UX/Dostępność/Bezpieczeństwo:**

- Read-only dla nie-parents
- Delete confirmation: AlertDialog z ostrzeżeniem o usunięciu z wydarzeń
- RLS: tylko członkowie grupy mogą widzieć
- Loading: skeleton

**API Endpoints:**

- `GET /api/children/:childId` → ChildDetailDTO
- `DELETE /api/children/:childId` (tylko parent)

---

### 2.16. Lista Członków

**Ścieżka:** `/groups/:groupId/members`

**Główny cel:**

- Wyświetlenie wszystkich członków grupy
- Admin contact reveal (emergency channel)
- Możliwość usunięcia członków (admin only)

**Kluczowe informacje:**

- Lista członków z rolami
- Dla każdego członka:
    - Avatar (inicjały z emaila)
    - Role indicator: Badge "Admin 👑" / "Członek"
    - Dzieci tego członka: "Rodzic: Staś, Ania"
    - Data dołączenia: "W grupie od 15 stycznia 2025"
    - Admin contact reveal button (tylko dla adminów)

**Kluczowe komponenty:**

- MainLayout z bottom nav (Członkowie - active)
- Separator: "Administratorzy" / "Członkowie"
- MemberCard (React):
    - Card wrapper
    - Badge "Admin 👑" (conditional, prominent)
    - Avatar (inicjały)
    - Children list: "Rodzic: Staś, Ania" (links do child profiles)
    - Joined date (relative: "2 miesiące temu")
    - **Admin contact reveal** (conditional - tylko admini):
        - Button "Pokaż kontakt" (secondary, small)
        - Click → Dialog:
            - Heading "Kontakt z administratorem"
            - Info text: "Użyj tego kontaktu w sprawach organizacyjnych grupy"
            - Email display (large, copyable)
            - Button "Kopiuj email" (clipboard copy + haptic feedback + toast)
            - Children reminder: "Rodzic: Staś"
            - Button "Zamknij"
    - **Admin actions** (conditional - tylko admin, nie self):
        - DropdownMenu (three dots icon):
            - MenuItem "Usuń z grupy" (destructive)
            - Click → AlertDialog:
                - Warning: "Czy na pewno usunąć [Mama Stasia] z grupy?"
                - Info: "Ich dzieci również zostaną usunięte"
                - Button "Anuluj" (default focus)
                - Button "Usuń" (destructive)
- Empty state (admin only):
    - "Jesteś jedynym członkiem grupy"
    - Button "Wygeneruj kod zaproszenia"
- Sort: Admini na górze, alfabetycznie w każdej sekcji
- Skeleton loaders

**Względy UX/Dostępność/Bezpieczeństwo:**

- Email hidden by default (privacy)
- Reveal przez explicit action (button click)
- Dialog jasno komunikuje cel kontaktu
- Copy to clipboard z feedback (toast)
- Admin może usunąć członków (nie siebie)
- Confirmation dialog dla destructive action
- Warning o konsekwencjach (usunięcie dzieci)
- RLS: tylko członkowie grupy widzą listę
- API nie zwraca emaila w GET /members (tylko dla adminów w admin-contact endpoint)

**API Endpoints:**

- `GET /api/groups/:groupId/members?limit=50&offset=0` → GroupMemberDTO[]
- `GET /api/groups/:groupId/members/admin-contact` → AdminContactDTO (email reveal)
- `DELETE /api/groups/:groupId/members/:userId` (admin only lub self-removal)

---

### 2.17. Generowanie Kodów Zaproszenia

**Ścieżka:** `/groups/:groupId/invite`

**Główny cel:**

- Generowanie tymczasowych kodów zaproszenia (60 min)
- Wyświetlenie aktywnych kodów z countdown
- Live update co 10 sekund
- Auto-remove z UI po wygaśnięciu kodu
- Możliwość usunięcia kodu
- Łatwe kopiowanie i udostępnianie kodu

**Kluczowe informacje:**

- Aktywne kody z czasem wygaśnięcia
- Countdown timer - live update co 10 sekund
- Opcje kopiowania i udostępniania

**Kluczowe komponenty:**

- MainLayout z back button
- Page header:
    - Heading "Kody zaproszenia"
    - Helper text: "Kod ważny 60 minut dla bezpieczeństwa grupy"
    - Button "Generuj nowy kod" (primary, large)
- Active codes list (jeśli są):
    - Dla każdego kodu:
        - Card:
            - Code display (large, monospace): "ABC-123-XY" (formatted)
            - Countdown timer: "Wygasa za: 45 min 23 sek" (live update co 1s)
                - Color: green (>30min), yellow (10-30min), red (<10min)
            - Action buttons:
                - Button "Kopiuj kod" (clipboard + haptic + toast)
                - Button "Udostępnij" (native Share API jeśli dostępne, fallback do copy)
                - Button "Usuń kod" (destructive, small, text-only)
- Empty state (brak aktywnych kodów):
    - "Brak aktywnych kodów"
    - "Wygeneruj kod aby zaprosić członków"
- Toast notifications:
    - Success: "Kod wygenerowany!", "Kod skopiowany!", "Kod usunięty"
    - Error: "Nie udało się wygenerować kodu"

**Względy UX/Dostępność/Bezpieczeństwo:**

- 403 jeśli nie-admin
- Countdown live update (useEffect z setInterval 10s)
- Auto-refresh list po wygaśnięciu kodu (remove z UI)
- Native Share API (mobile): share text "Dołącz do grupy [nazwa] w Grupka! Kod: ABC123XY"
- Clipboard API z fallback (execCommand)
- Haptic feedback (navigator.vibrate) przy copy
- Security: codes są cryptographically random (backend)
- Rate limiting: max 5 kodów na godzinę (admin)
- Deleted codes: hard delete

**API Endpoints:**

- `GET /api/groups/:groupId/invites` → GroupInviteListItemDTO[] (admin only)
- `POST /api/groups/:groupId/invites` → GroupInviteDTO (admin only)
- `DELETE /api/groups/:groupId/invites/:code` (admin only)

---

### 2.18. Dołączanie do Grupy

**Ścieżka:** `/join`

**Główny cel:**

- Dołączenie do grupy używając kodu zaproszenia
- Prosty flow: wpisz kod → dołącz

**Kluczowe informacje:**

- Formularz z input dla kodu
- Validation i error handling

**Kluczowe komponenty:**

- MainLayout (lub AuthLayout jeśli niezalogowany)
- JoinGroupForm (React):
    - Heading "Dołącz do grupy"
    - Helper text: "Wpisz kod zaproszenia otrzymany od administratora"
    - Input kod (auto-uppercase, trim, max 10 chars)
        - Placeholder: "ABC-123-XY"
        - Format validation: alphanumeric
    - Button "Dołącz" (primary, disabled jeśli empty)
    - Button "Anuluj" → `/dashboard`
- Success flow:
    - Toast "Dołączyłeś do grupy [nazwa]!"
    - Redirect do `/groups/:groupId/events`
- Error handling:
    - 404: "Kod nieprawidłowy lub wygasł"
        - Helper: "Poproś administratora o nowy kod"
    - 409: "Jesteś już członkiem tej grupy"
        - Redirect do `/groups/:groupId/events`
    - 401: Redirect do `/login?redirect=/join&code=ABC123XY` (jeśli niezalogowany)

**Względy UX/Dostępność/Bezpieczeństwo:**

- Zod validation: code required, max 10 chars, alphanumeric
- Auto-format: remove spaces, uppercase
- Error messages user-friendly po polsku
- Niezalogowani: redirect do login z code w query (preserve code)
- Po login: auto-submit join z code z query
- Protected route: wymaga auth
- Rate limiting: max 10 prób/godzinę (prevent brute force)
- Code validation backend: exists + not expired + not already member

**API Endpoints:**

- `POST /api/invites/join` → JoinGroupCommand → JoinGroupResponseDTO

---

### 2.19. Ustawienia Grupy

**Ścieżka:** `/groups/:groupId/settings`

**Główny cel:**

- Zarządzanie ustawieniami grupy (admin only)
- Edycja nazwy grupy
- Usunięcie grupy (high risk action)

**Kluczowe informacje:**

- Podstawowe ustawienia grupy
- Destructive actions

**Kluczowe komponenty:**

- MainLayout z back button
- Settings sections:

    **Sekcja 1: Podstawowe**
    - Input "Nazwa grupy" (pre-filled, editable)
    - Button "Zapisz zmiany" (disabled jeśli no changes)

    **Sekcja 2: Członkowie (shortcuts)**
    - Stats: "X członków w grupie"
    - Button "Zarządzaj członkami" → `/groups/:groupId/members`
    - Button "Wygeneruj kod zaproszenia" → `/groups/:groupId/invite`

    **Sekcja 3: Niebezpieczna strefa** (red border)
    - Heading "Niebezpieczna strefa" (red text)
    - Alert (destructive):
        - Icon ⚠️
        - "Usunięcie grupy jest nieodwracalne i spowoduje usunięcie wszystkich danych"
    - Button "Usuń grupę" (destructive)
        - Click → AlertDialog:
            - Heading "Czy na pewno usunąć grupę?"
            - Warning list:
                - "Wszystkie wydarzenia zostaną usunięte"
                - "Wszystkie profile dzieci zostaną usunięte"
                - "Wszyscy członkowie stracą dostęp"
                - "Ta akcja jest nieodwracalna"
            - Input "Wpisz nazwę grupy aby potwierdzić": [nazwa grupy]
            - Button "Anuluj" (default focus)
            - Button "Usuń na zawsze" (destructive, disabled jeśli input != nazwa)
        - Success: Toast "Grupa usunięta" + redirect do `/dashboard`

**Względy UX/Dostępność/Bezpieczeństwo:**

- 403 jeśli nie-admin
- Dirty state tracking dla nazwy
- Input confirmation dla delete (wpisz nazwę)
- Disabled delete button dopóki input nie match
- Cascading delete: backend usuwa wszystkie powiązane dane
- Transaction: all-or-nothing
- Toast po każdej akcji
- Destructive colors (red) dla delete section

**API Endpoints:**

- `GET /api/groups/:groupId` → GroupDetailDTO (pre-fill)
- `PATCH /api/groups/:groupId` → UpdateGroupCommand
- `DELETE /api/groups/:groupId` (admin only, cascades)

---

### 2.20. Profil Użytkownika

**Ścieżka:** `/profile`

**Główny cel:**

- Wyświetlenie podstawowych informacji użytkownika
- Zmiana hasła
- Wylogowanie
- Przegląd moich grup i dzieci

**Kluczowe informacje:**

- Email (read-only)
- Lista grup
- Lista dzieci (z kontekstem grup)
- Opcje account management

**Kluczowe komponenty:**

- MainLayout
- Profile sections:

    **Sekcja 1: Informacje podstawowe**
    - Avatar (duży, inicjały z emaila)
    - Email (display only, large text)
    - Label "Twoje konto"

    **Sekcja 2: Bezpieczeństwo**
    - Button "Zmień hasło" → Dialog:
        - Input "Obecne hasło"
        - Input "Nowe hasło"
        - Input "Potwierdź nowe hasło"
        - Button "Zapisz"
        - Toast success + wymuszenie re-login (opcjonalnie)

    **Sekcja 3: Moje grupy**
    - Stats: "Należysz do X grup"
    - Lista grup (mini cards):
        - Nazwa
        - Rola (badge)
        - Button "Przejdź"
    - Button "Utwórz nową grupę" (secondary)

    **Sekcja 4: Moje dzieci**
    - Stats: "Masz X profili dzieci"
    - Lista dzieci (mini cards):
        - Display name
        - Grupa (context): "w grupie [nazwa]"
        - Button "Edytuj"

    **Sekcja 5: Wylogowanie**
    - Button "Wyloguj się" (secondary, full-width)
    - Click → confirmation? (opcjonalnie) → logout → redirect do `/`

**Względy UX/Dostępność/Bezpieczeństwo:**

- Minimalistyczne (zgodnie z privacy-first approach)
- Brak edycji emaila w MVP (future feature)
- Zmiana hasła w dialog (nie separate page)
- Password change validation: current password required
- Grupy i dzieci jako quick links (convenience)
- Logout: clear session + redirect
- No account deletion w MVP (future feature)

**API Endpoints:**

- `GET /api/groups` → GroupListItemDTO[] (moje grupy)
- Supabase Auth: `updateUser({ password })` (zmiana hasła)
- Astro Action: `logout()` → clear session

---

## 3. Mapa podróży użytkownika

### 3.1. Nowy Użytkownik - Tworzenie Grupy (Admin Path)

**Ścieżka A: Odkrywanie i rejestracja**

1. **Landing Page** (`/`)
    - Użytkownik czyta o wartościach aplikacji
    - Decyzja: chce utworzyć grupę
    - Click "Załóż konto"

2. **Rejestracja** (`/register`)
    - Wpisuje email + hasło
    - Czyta info o privacy emaila
    - Click "Zarejestruj się"
    - System: tworzy konto + profil (trigger)

3. **Dashboard - Empty State** (`/dashboard`)
    - Widzi welcome message
    - 2 opcje: "Utwórz grupę" / "Dołącz do grupy"
    - Click "Utwórz grupę"

4. **Tworzenie Grupy** (`/groups/new`)
    - Wpisuje nazwę grupy: "Przedszkole Słoneczko - Motylki"
    - Czyta info box o ujawnieniu emaila jako admin
    - Click "Utwórz grupę"
    - System: tworzy grupę + członkostwo z role=admin

5. **Hub Grupy (Strona startowa grupy)** (`/groups/:groupId`)
    - Redirect automatyczny po utworzeniu
    - Widzi Hub grupy z podsumowaniem (nadchodzące urodziny, Twoje dziecko, Admin)
    - Widzi kafel "Wydarzenia" z info: "Wygeneruj kod aby zaprosić członków" (jeśli admin)
    - Click "Później" lub zamyka modal zaproszenia (jeśli wyskoczył)
    - Decyzja: najpierw doda swoje dziecko

6. **Navigation** - Bottom nav → "Dzieci"

7. **Lista Dzieci - Empty** (`/groups/:groupId/children`)
    - Empty state: "Dodaj profil swojego dziecka"
    - Click "Dodaj dziecko"

8. **Dodawanie Dziecka** (`/groups/:groupId/children/new`)
    - Wpisuje nazwę: "Staś"
    - Wybiera datę urodzenia
    - W textarea wpisuje notatki: "dinozaury, lego, nie lubi puzzli"
    - Click "🪄 Magic Wand"
    - System: AI generuje sformatowany opis
    - User przegląda, poprawia jeśli trzeba
    - Click "Dodaj dziecko"

9. **Lista Dzieci** (`/groups/:groupId/children`)
    - Widzi kartę swojego dziecka z badge "Twoje dziecko"
    - Decyzja: teraz zaprosi innych

10. **Navigation** - Bottom nav → "Członkowie"

11. **Lista Członków** (`/groups/:groupId/members`)
    - Widzi tylko siebie z badge "Admin 👑"
    - Poniżej empty state: "Wygeneruj kod zaproszenia"
    - Lub button w headerze: "Wygeneruj kod"
    - Click "Wygeneruj kod" → redirect

12. **Generowanie Kodu** (`/groups/:groupId/invite`)
    - Click "Generuj nowy kod"
    - System: tworzy kod ważny 60 min
    - Widzi kod: "ABC-123-XY" z countdown: "Wygasa za 59 min"
    - Click "Kopiuj kod"
    - Toast: "Kod skopiowany!"
    - Otwiera WhatsApp/Messenger
    - Wysyła kod do innych rodziców: "Cześć! Dołącz do naszej grupy w Grupka: ABC-123-XY"

13. **Navigation** - Back do wydarzeń

14. **Tworzenie Wydarzenia** (`/groups/:groupId/events/new`)
    - Click FAB "+"
    - Wpisuje tytuł: "Urodziny Stasia"
    - Wybiera datę: "15.05.2025"
    - Opisuje: "Zapraszamy na urodziny w sali zabaw!"
    - Wybiera dziecko: "Staś"
    - Scrolluje do sekcji Goście
    - (Jeszcze nie ma innych dzieci - zaznacza "Staś" lub czeka na innych członków)
    - Zapisuje jako draft lub czeka

**Outcome:** Grupa utworzona, dziecko dodane, kod wygenerowany, czeka na członków.

---

### 3.2. Nowy Użytkownik - Dołączanie przez Kod (Member Path)

**Ścieżka B: Otrzymanie kodu i dołączenie**

1. **Messenger/WhatsApp**
    - Otrzymuje wiadomość: "Dołącz do grupy Przedszkole Słoneczko w Grupka: ABC-123-XY"
    - Kopiuje kod lub zapamiętuje
    - Otwiera przeglądarkę → grupka-app.com

2. **Landing Page** (`/`)
    - Czyta o aplikacji
    - Click "Załóż konto" (jeśli nowy) lub "Zaloguj się" (jeśli ma konto)

3. **Rejestracja** (`/register`)
    - Wpisuje email + hasło
    - Click "Zarejestruj się"

4. **Dashboard** (`/dashboard`)
    - Widzi empty state
    - Click "Dołącz do grupy" (lub ma już kod w pamięci → click "Dołącz")

5. **Dołączanie** (`/join`)
    - Wpisuje lub wkleja kod: "ABC-123-XY"
    - Click "Dołącz"
    - System: waliduje kod, dodaje do grupy jako member

6. **Hub Grupy** (`/groups/:groupId`)
    - Redirect automatyczny po dołączeniu
    - Toast: "Dołączyłeś do grupy Przedszkole Słoneczko!"
    - Widzi skrót nadchodzących wydarzeń i statystyki grupy
    - Decyzja: doda swoje dziecko

7. **Navigation** - Bottom nav → "Dzieci"

8. **Lista Dzieci** (`/groups/:groupId/children`)
    - Widzi dzieci innych członków
    - Click FAB "+" (Dodaj swoje dziecko)

9. **Dodawanie Dziecka** - identical do Admin path (kroki 8-9)

10. **Lista Dzieci**
    - Widzi swoje dziecko + dzieci innych

11. **Navigation** - Bottom nav → "Wydarzenia"

12. **Lista Wydarzeń** (`/groups/:groupId/events`)
    - Widzi wydarzenie: "Urodziny Stasia"
    - Badge "Zaktualizowane" (jeśli utworzone <8h temu)
    - Click kartę

13. **Szczegóły Wydarzenia** (`/groups/:groupId/events/:eventId`)
    - Widzi szczegóły: data, opis
    - Widzi bio Stasia (inspiracja prezentowa): "Loves dinosaurs, LEGO..."
    - Scrolluje do sekcji komentarzy (hidden thread)
    - Widzi empty state: "Bądź pierwszą osobą która zaproponuje prezent!"
    - Wpisuje komentarz: "Proponuję złożyć się na zestaw LEGO Jurassic World!"
    - Click "Wyślij"
    - Komentarz pojawia się natychmiast (optimistic update)

**Outcome:** Dołączył do grupy, dodał dziecko, skomentował w wydarzeniu.

---

### 3.3. Organizator Wydarzenia - Tworzenie i Zarządzanie

**Ścieżka C: Organizacja urodzin**

1. **Lista Wydarzeń** (`/groups/:groupId/events`)
    - User (admin lub member) widzi wydarzenia
    - Decyzja: zorganizuje urodziny swojego dziecka
    - Click FAB "+" lub "Utwórz wydarzenie"

2. **Tworzenie Wydarzenia** (`/groups/:groupId/events/new`)
    - Wpisuje tytuł: "Urodziny Ani"
    - Wybiera datę: "20.06.2025"
    - Wpisuje opis: "Zapraszamy na urodziny w parku!"
    - Wybiera dziecko: "Ania" (z dropdown)
    - Scrolluje do Gości
    - Click "Zaznacz wszystkich" → wszystkie dzieci zaznaczone
    - Odznacza "Ania" (nie zapraszamy sobie)
    - Widzi counter: "12 z 13 dzieci zaznaczonych"
    - Click "Utwórz wydarzenie"

3. **Szczegóły Wydarzenia - Organizator View** (`/groups/:groupId/events/:eventId`)
    - Redirect po utworzeniu
    - Toast: "Wydarzenie utworzone!"
    - Widzi szczegóły wydarzenia
    - Widzi info box: "💡 Komentarze gości są ukryte, aby zachować niespodziankę"
    - **NIE widzi sekcji komentarzy** (hidden thread protection)
    - Widzi przyciski "Edytuj" / "Usuń"
    - Decyzja: sprawdzi listę gości (collapsible)
    - Click "Goście (12)"
    - Rozwija listę: widzi wszystkie zaproszone dzieci

4. **Czas płynie** - inni rodzice komentują (organizator NIE widzi)

5. **Lista Wydarzeń** (`/groups/:groupId/events`)
    - Po kilku godzinach: widzi swoje wydarzenie bez badge "Zaktualizowane"
    - (Inne wydarzenia mogą mieć badge jeśli były edytowane)

6. **Edycja** (opcjonalnie)
    - Decyzja: zmieni datę
    - Click wydarzenie → Click "Edytuj"

7. **Edycja Wydarzenia** (`/groups/:groupId/events/:eventId/edit`)
    - Zmienia datę z "20.06" na "21.06"
    - Click "Zapisz zmiany"
    - Toast: "Zmiany zapisane!"
    - System: ustawia updated_at → triggers badge "Zaktualizowane" (8h)

8. **Lista Wydarzeń**
    - Widzi swoje wydarzenie z badge "Zaktualizowane"
    - Goście zobaczą badge i wiedzą że coś się zmieniło

**Outcome:** Wydarzenie utworzone, goście zaproszeni, organizator nie widzi komentarzy (surprise protection).

---

### 3.4. Gość Wydarzenia - Komentowanie i Koordynacja

**Ścieżka D: Uczestnictwo w wydarzeniu**

1. **Lista Wydarzeń** (`/groups/:groupId/events`)
    - User widzi wydarzenie: "Urodziny Ani"
    - Badge "Zaktualizowane" (właśnie utworzone)
    - Indicator: "Jesteś gościem"
    - Click kartę

2. **Szczegóły Wydarzenia - Guest View** (`/groups/:groupId/events/:eventId`)
    - Widzi szczegóły: tytuł, data, opis
    - Widzi bio Ani (inspiracja): "Lubi książki, rysowanie, zwierzęta..."
    - Scrolluje do Komentarzy (hidden thread)
    - Widzi empty state: "Bądź pierwszą osobą..."
    - Decyzja: zaproponuje prezent

3. **Dodawanie Komentarza**
    - Click w textarea (auto-focus)
    - Wpisuje: "Co powiecie na zestaw kredek i album do rysowania?"
    - Click "Wyślij"
    - Komentarz pojawia się natychmiast z label: "Mama Stasia"
    - Timestamp: "teraz"

4. **Inni komentują**
    - Po chwili: reload lub manual refresh
    - Widzi nowe komentarze:
        - "Mama Tomka: Super pomysł! Można dorzucić książkę o zwierzętach?"
        - "Mama Zosi: Ok, zakładam się na 20 zł każdy?"
    - Decyzja: zgadza się

5. **Odpowiedź**
    - Wpisuje: "Zgadzam się, składam się na 20 zł!"
    - Click "Wyślij"
    - Komentarz dodany

6. **Koordynacja finalna** (w komentarzach)
    - Inni ustalają szczegóły: gdzie kupić, kto kupi, kiedy
    - Wszystko w hidden thread - organizator (Mama Ani) NIE WIDZI

**Outcome:** Goście skoordynowali prezent w ukrytym wątku, niespodzianka zachowana.

---

### 3.5. Admin - Zarządzanie Członkami

**Ścieżka E: Moderacja grupy**

1. **Lista Członków** (`/groups/:groupId/members`)
    - Admin widzi wszystkich członków
    - Zauważa: "Mama X" dołączyła przez pomyłkę (nie ten przedszkole)
    - Decyzja: usunie

2. **Usuwanie Członka**
    - Click three dots menu przy "Mama X"
    - Click "Usuń z grupy"
    - AlertDialog:
        - Warning: "Czy na pewno usunąć Mama X z grupy?"
        - Info: "Jej dzieci również zostaną usunięte"
    - Click "Usuń"
    - System: usuwa członka + jego dzieci + członkostwo w wydarzeniach

3. **Lista Członków**
    - Toast: "Członek usunięty"
    - "Mama X" znika z listy

4. **Admin Contact Reveal** (z perspektywy członka)
    - Inny member ma pytanie: błędne dziecko dodane, chce poprosić admina o pomoc
    - Otwiera Członków
    - Widzi "Admin 👑"
    - Click "Pokaż kontakt"
    - Dialog: wyświetla email admina + context (dzieci)
    - Click "Kopiuj email"
    - Toast: "Email skopiowany!"
    - Otwiera email client, pisze do admina

**Outcome:** Admin moderuje grupę, członek ma dostęp do kontaktu awaryjnego.

---

## 4. Układ i struktura nawigacji

### 4.1. Hierarchia nawigacji

Aplikacja wykorzystuje **dwupoziomową nawigację** dostosowaną do urządzenia:

**Level 1: Global Navigation (Top Bar)**

- Logo/Brand (left)
- Group Switcher (center/left) - dropdown z listą grup
- Profile Menu (right) - avatar + dropdown

**Level 2: Section Navigation**

**Mobile:**

- **Bottom Navigation Bar** (fixed, 4 tabs):
    1. **Wydarzenia** (🎂) - `/groups/:groupId/events`
    2. **Dzieci** (👶) - `/groups/:groupId/children`
    3. **Członkowie** (👥) - `/groups/:groupId/members`
    4. **Więcej** (⋯) - otwiera Sheet z opcjami:
        - Generuj kod zaproszenia (admin only)
        - Ustawienia grupy (admin only)
        - Profil użytkownika
        - Wyloguj się

**Desktop:**

- **Left Sidebar** (sticky):
    - Wydarzenia (active highlight)
    - Dzieci
    - Członkowie
    - Separator
    - Generuj kod (admin)
    - Ustawienia (admin)
    - Separator
    - Profil
    - Wyloguj się

### 4.2. Navigation Patterns

**Back Navigation:**

- Browser back button (natural)
- Back arrow w top bar (dla szczegółowych widoków)
- Breadcrumbs na desktop (opcjonalnie): Dashboard > Grupa > Wydarzenia > Szczegóły

**Deep Linking:**

- Każdy widok ma unique URL (shareable)
- Group context w URL: `/groups/:groupId/*`
- Protected routes: redirect do login z `?redirect=` param

**Navigation Guards:**

- Middleware sprawdza auth
- RLS sprawdza permissions (group membership, ownership)
- 403 redirect do dashboard z toast "Brak dostępu"
- 404 dla non-existent resources

**Shortcuts (Desktop):**

- Cmd/Ctrl + K: Command palette (future)
- Esc: zamknij modal/dialog
- Tab: keyboard navigation
- Enter: submit form/open item

### 4.3. Navigation States

**Active State:**

- Bottom nav: highlighted icon + label (bold), accent color
- Sidebar: highlighted background, accent border-left
- Current group w switcher: checkmark, bold text

**Loading State:**

- Top bar: progress bar (thin, Astro View Transitions)
- Skeleton content w destination page

**Error State:**

- Toast notification
- Remain on current page (nie navigate away przy błędzie)

### 4.4. Group Context Management

**URL jako Source of Truth:**

- Current group ID zawsze w URL: `/groups/:groupId/*`
- Brak globalnego state dla "active group"
- Switch group → navigate to new URL z :groupId

**Group Switcher UX:**

**Mobile (Bottom Sheet):**

```
┌─────────────────────────────┐
│ Wybierz grupę               │
├─────────────────────────────┤
│ ⦿ Przedszkole Słoneczko     │ ← selected
│   5 dzieci · 12 członków    │
├─────────────────────────────┤
│ ○ Szkoła Podstawowa nr 3    │
│   3 dzieci · 8 członków     │
├─────────────────────────────┤
│ [+ Utwórz nową grupę]       │
│ [↗ Dołącz do grupy]         │
└─────────────────────────────┘
```

**Desktop (Dropdown Menu):**

- Compact list
- Hover states
- Keyboard navigation (arrows)

### 4.5. Mobile Navigation Optimization

**Thumb Zone Consideration:**

- Bottom nav w zasięgu kciuka (prawej ręki)
- Najczęściej używane: Wydarzenia (left) - łatwo dostępne
- Mniej częste: Więcej (right)

**Touch Targets:**

- Min 48px height dla wszystkich interactive elements
- Spacing między buttons: min 8px

**Swipe Gestures (opcjonalnie w przyszłości):**

- Swipe right: back navigation
- Swipe down: refresh (pull-to-refresh)

**Mobile Menu (Sheet):**

- Bottom Sheet dla "Więcej"
- Modal z darkened backdrop
- Swipe down do zamknięcia
- Large touch targets w menu items

---

## 5. Kluczowe komponenty

### 5.1. Base Components (Shadcn/ui)

Lista podstawowych komponentów UI używanych w całej aplikacji:

**Formularze i Input:**

- `Button` - wszystkie akcje (variants: default, secondary, destructive, ghost, outline)
- `Input` - text fields (email, password, text, search)
- `Textarea` - multi-line input (auto-resize)
- `Label` - labels dla form fields (accessibility)
- `Select` - dropdown select
- `Checkbox` - multiple selection
- `Calendar` - date picker (fallback dla native)

**Layout i Containers:**

- `Card` - content containers (CardHeader, CardContent, CardFooter)
- `Separator` - visual dividers (horizontal/vertical)
- `ScrollArea` - custom scrollable containers

**Overlays i Modals:**

- `Dialog` - modal dialogs
- `AlertDialog` - confirmation dialogs (destructive actions)
- `Sheet` - slide-over panels (bottom/left/right)
- `Popover` - tooltips i info boxes
- `DropdownMenu` - context menus i dropdowns

**Feedback:**

- `Toast (Sonner)` - notifications (success/error/info/warning)
- `Badge` - status indicators i labels
- `Skeleton` - loading placeholders
- `Progress` - progress indicators (opcjonalnie)

**Data Display:**

- `Avatar` - user/child avatars (z fallback do inicjałów)

**Instalacja wszystkich core components:**

```bash
npx shadcn@latest add button card input textarea label select checkbox dialog alert-dialog sheet sonner dropdown-menu badge skeleton avatar separator scroll-area popover
```

---

### 5.2. Feature Components

Komponenty biznesowe specyficzne dla Grupka:

#### EventCard

**Lokalizacja:** `src/components/features/EventCard.tsx`

**Props:**

```typescript
interface EventCardProps {
    event: EventListItemDTO;
    onClick: () => void;
}
```

**Struktura:**

- Card wrapper (clickable)
- Badge "Zaktualizowane" (conditional, top-right)
- Title (h3, truncate)
- Date (formatted, large)
- Child avatar + name
- Guest count badge
- Role indicator: "Organizujesz" / "Jesteś gościem"
- Description preview (2 linie, fade)

**Responsywność:**

- Mobile: vertical layout
- Desktop: horizontal layout z quick actions

---

#### ChildProfileCard

**Lokalizacja:** `src/components/features/ChildProfileCard.tsx`

**Props:**

```typescript
interface ChildProfileCardProps {
    child: ChildListItemDTO;
    isOwner: boolean;
    onEdit?: () => void;
    onExpand?: () => void;
}
```

**Struktura:**

- Card wrapper (conditional border jeśli isOwner)
- Badge "Twoje dziecko" (conditional)
- Avatar (color hash z displayName)
- Display name (h3)
- Birth date + age calculated
- Bio preview (truncate, expandable dla nie-owners)
- Button "Edytuj" (conditional, tylko owner)

**Interakcje:**

- Click bio: expand inline (nie-owner)
- Click "Edytuj": navigate to edit (owner)

---

#### MagicWandForm

**Lokalizacja:** `src/components/features/MagicWandForm.tsx`

**Props:**

```typescript
interface MagicWandFormProps {
    initialBio?: string;
    childDisplayName?: string;
    onSave: (bio: string) => void;
    onCancel: () => void;
}
```

**Struktura:**

- Label "Co lubi Twoje dziecko?"
- Textarea (auto-resize, max 1000 chars)
- Button "🪄 Magic Wand" (prominent, above textarea)
    - Loading state: spinner + disabled textarea
- Rate limit indicator: "Pozostało X/10 użyć"
- Character counter: "X/1000"
- Bottom bar: "Anuluj" / "Zapisz"

**State Management:**

- useState dla bio content
- useState dla loading
- React Query mutation dla API call
- localStorage dla draft (autosave co 5s)

**Magic Wand Flow:**

1. User wpisuje notatki
2. Click Magic Wand
3. Disable textarea + show spinner
4. POST /api/ai/magic-wand
5. Replace textarea content z fade animation
6. Enable textarea
7. User może edytować
8. Click Zapisz - parent onSave callback

---

#### CommentThread

**Lokalizacja:** `src/components/features/CommentThread.tsx`

**Props:**

```typescript
interface CommentThreadProps {
    eventId: string;
    isOrganizer: boolean;
}
```

**Struktura:**

**Dla organizatora:**

- Alert (info): "💡 Komentarze ukryte dla niespodzianki"

**Dla gościa:**

- Comments list (ScrollArea):
    - CommentItem dla każdego:
        - Avatar autora
        - Author label: "Mama Ani"
        - Content (text, line breaks)
        - Timestamp (relative)
        - Button "Usuń" (conditional, tylko author)
    - Empty state: "Bądź pierwszą osobą..."
    - Skeleton loaders podczas fetch
- Comment input (sticky bottom mobile):
    - Textarea (auto-resize, max 2000 chars)
    - Character counter
    - Button "Wyślij" (disabled jeśli empty)

**Data Management:**

- React Query dla GET /api/events/:eventId/comments
- React Query mutation dla POST (optimistic update)
- Auto-scroll do nowego komentarza
- Relative timestamps (formatRelative helper)

---

#### GroupSwitcher

**Lokalizacja:** `src/components/features/GroupSwitcher.tsx`

**Props:**

```typescript
interface GroupSwitcherProps {
    currentGroupId: string;
    groups: GroupListItemDTO[];
}
```

**Struktura:**

**Mobile (Sheet):**

- Trigger: nazwa grupy + chevron
- Sheet content:
    - Heading "Wybierz grupę"
    - RadioGroup z grupami:
        - Radio + Card dla każdej grupy
        - Nazwa
        - Stats: X dzieci, Y członków
        - Selected state
    - Footer:
        - Button "Utwórz nową grupę"
        - Button "Dołącz do grupy"

**Desktop (DropdownMenu):**

- Trigger: nazwa grupy + chevron
- Dropdown content:
    - Lista grup (DropdownMenuItem dla każdej)
    - Checkmark przy aktywnej
    - Separator
    - "Utwórz nową grupę"
    - "Dołącz do grupy"

**Navigation:**

- Click grupa: navigate to `/groups/:groupId/events`

---

#### InviteCodeCard

**Lokalizacja:** `src/components/features/InviteCodeCard.tsx`

**Props:**

```typescript
interface InviteCodeCardProps {
    invite: GroupInviteDTO;
    onRevoke: (code: string) => void;
}
```

**Struktura:**

- Card wrapper
- Code display (large, monospace, formatted)
- Countdown timer (live update)
    - Color: green (>30min), yellow (10-30min), red (<10min)
    - Format: "Wygasa za: 45 min 23 sek"
- Action buttons row:
    - Button "Kopiuj kod"
    - Button "Udostępnij" (native Share API)
    - Button "Usuń kod" (destructive, text)
- Accordion "Pokaż QR kod" (opcjonalnie):
    - QR code image (generated client-side)

**State:**

- useEffect z setInterval(1000) dla countdown
- Auto-remove z UI po expiry

---

#### MemberCard

**Lokalizacja:** `src/components/features/MemberCard.tsx`

**Props:**

```typescript
interface MemberCardProps {
    member: GroupMemberDTO;
    isAdmin: boolean; // current user
    canManage: boolean; // nie-self admin
    onRevealContact?: () => void;
    onRemove?: (userId: string) => void;
}
```

**Struktura:**

- Card wrapper
- Badge "Admin 👑" (conditional)
- Avatar (inicjały z emaila hash)
- Children list: "Rodzic: Staś, Ania"
- Joined date (relative)
- Admin contact button (conditional - tylko admini):
    - "Pokaż kontakt" → onRevealContact
- Admin actions menu (conditional - tylko admin, nie self):
    - DropdownMenu (three dots)
    - MenuItem "Usuń z grupy" → onRemove

---

### 5.3. Layout Components (Astro)

#### MainLayout

**Lokalizacja:** `src/components/layouts/MainLayout.astro`

**Props:**

```typescript
interface Props {
    title: string;
    groupId?: string; // dla group context pages
}
```

**Struktura:**

- `<html>` wrapper z lang="pl"
- `<head>` z meta tags, title, favicon
- Top bar:
    - Logo/Brand
    - GroupSwitcher (jeśli groupId)
    - Profile dropdown
- Slot dla main content
- Bottom nav (mobile) / Sidebar (desktop) - jeśli groupId
- Toaster (Sonner)
- Script dla View Transitions (opcjonalnie)

---

#### AuthLayout

**Lokalizacja:** `src/components/layouts/AuthLayout.astro`

**Props:**

```typescript
interface Props {
    title: string;
}
```

**Struktura:**

- Minimalistyczny layout dla auth pages
- Centered card z form
- Background gradient/pattern (opcjonalnie)
- No navigation
- Slot dla content

---

### 5.4. Shared Utilities i Helpers

#### Avatar Color Hash

**Lokalizacja:** `src/lib/utils.ts`

```typescript
function getAvatarColor(displayName: string): string {
    // Hash string do HSL color
    // Ensures consistent color per name
}

function getInitials(displayName: string): string {
    // Extract first 2 letters
    // Uppercase
}
```

#### Date Formatting

```typescript
function formatEventDate(date: string): string {
    // "2025-05-15" → "15 maja 2025"
}

function formatRelativeTime(date: string): string {
    // "2025-01-15T10:30:00Z" → "2 godziny temu"
}

function calculateAge(birthDate: string): number {
    // Calculate age from birth date
}
```

#### Code Formatting

```typescript
function formatInviteCode(code: string): string {
    // "ABC123XY" → "ABC-123-XY"
}
```

#### Validation Helpers

```typescript
function validateEmail(email: string): boolean;
function validatePassword(password: string): { valid: boolean; errors: string[] };
```

---

## 6. Obsługa błędów i stanów ładowania

### 6.1. Error Handling Strategy

**Poziomy obsługi błędów:**

1. **Client-side Validation** (przed submit)
    - Zod schemas w formach
    - Inline error messages pod polami
    - Real-time validation (onBlur lub onChange)
    - Disabled submit button jeśli validation fails

2. **API Errors** (po submit)
    - 400 Bad Request: Validation errors z backend
        - Display w Toast: konkretny message z API
        - Highlight problematic fields
    - 401 Unauthorized: Redirect do `/login?redirect={current}`
    - 403 Forbidden: Toast "Brak uprawnień" + redirect do dashboard
    - 404 Not Found: Toast "Nie znaleziono" + redirect lub stay
    - 409 Conflict: Toast z specific message (np. "Już jesteś członkiem")
    - 429 Too Many Requests: Toast "Zbyt wiele prób, spróbuj później"
    - 5xx Server Error: Toast "Coś poszło nie tak, spróbuj ponownie"

3. **Network Errors**
    - Brak połączenia: Toast "Sprawdź połączenie internetowe"
    - Timeout: Toast "Operacja trwała zbyt długo" + retry option
    - Auto retry (exponential backoff): 3s, 10s (max 2 retries)

4. **React Error Boundary**
    - Catch unhandled errors w React tree
    - Display fallback UI:
        - Icon ⚠️
        - "Coś poszło nie tak"
        - Button "Wróć do strony głównej"
    - Console.error dla debugging
    - (Future: Sentry logging)

### 6.2. Error Message Patterns

**Toast Notifications (Sonner):**

- **Success** (✓ green, 3s):
    - "Grupa utworzona!"
    - "Wydarzenie zapisane!"
    - "Kod skopiowany!"
- **Error** (✕ red, 5s):
    - "Nie udało się zapisać zmian"
    - "Kod wygasł lub nieprawidłowy"
    - "Brak połączenia z serwerem"
- **Warning** (⚠️ orange, 5s):
    - "Nie zaznaczono żadnych gości"
- **Info** (ℹ️ blue, 3s):
    - "Zmiany zapisane jako draft"

**Position:**

- Mobile: top-center (nie blokuje bottom nav)
- Desktop: top-right

**Działania w Toast:**

- Button "Spróbuj ponownie" (dla network errors)
- Button "Cofnij" (dla optimistic updates jeśli failed)
- Auto-dismiss lub manual close (X icon)

**Error States w UI:**

- Empty state z error message + retry button
- Inline error pod formularzem
- Alert box (destructive) dla critical errors

### 6.3. Loading States

**Patterns:**

1. **Skeleton Loaders** (dla list i cards)
    - Użycie: listy wydarzeń, dzieci, członków, dashboard
    - Struktura: skeleton cards dopasowane do final layout
    - Liczba: 3-5 skeleton items
    - Animation: pulse/shimmer effect
    - Czas: show natychmiast, hide po data loaded

2. **Inline Spinners** (w przyciskach)
    - Użycie: form submit, actions (Zapisz, Dodaj, Usuń, Magic Wand)
    - Position: inside button, replace text lub obok
    - State: button disabled podczas loading
    - Timeout: max 10s, potem error toast

3. **Full Page Loader** (dla initial load)
    - SSR advantage: minimal potrzeba
    - Użycie: tylko dla client-side navigation między pages
    - Astro View Transitions: top progress bar (thin, accent color)
    - Duration: 100-500ms typically

4. **Optimistic Updates**
    - Użycie: dodawanie komentarza, toggle checkbox
    - Pattern:
        1. Update UI natychmiast (optimistic)
        2. Wysłanie API request
        3. Jeśli success: keep update
        4. Jeśli error: revert + show toast error
    - Visual feedback: subtle opacity/animation podczas pending

5. **Conditional Loading**
    - React Query `isLoading` vs `isFetching`:
        - `isLoading`: first fetch (show skeleton)
        - `isFetching`: background refetch (show small indicator lub brak)
    - Stale-while-revalidate: show cached data instantly, fetch w tle

### 6.4. Empty States

**Pattern dla każdej listy:**

**Struktura:**

- Container (centered)
- Icon/Illustration (large, relevant)
- Heading (h2, descriptive)
- Subtext (helpful, actionable)
- CTA Button (primary action)
- Optional secondary action

**Przykłady:**

**Brak wydarzeń:**

```
Icon: 🎂
Heading: "Brak wydarzeń"
Subtext: "Utwórz pierwsze wydarzenie aby zorganizować urodziny"
CTA: "Utwórz wydarzenie"
```

**Brak dzieci (admin):**

```
Icon: 👶
Heading: "Brak dzieci w grupie"
Subtext: "Dodaj profil swojego dziecka i zaproś innych członków"
CTA: "Dodaj dziecko"
Secondary: "Wygeneruj kod zaproszenia"
```

**Brak komentarzy:**

```
Icon: 💬
Heading: "Brak komentarzy"
Subtext: "Bądź pierwszą osobą która zaproponuje prezent!"
CTA: Focused textarea (auto-focus)
```

---

## 7. Względy dostępności (Accessibility)

### 7.1. WCAG 2.1 Level AA Compliance

**Kontrast kolorów:**

- Body text: min 4.5:1 contrast ratio
- Large text (>18px): min 3:1 contrast ratio
- Interactive elements: wyraźny kontrast
- Testowanie: Lighthouse Accessibility audit

**Rozmiary tekstu:**

- Base: 16px (mobile), 18px (desktop)
- Fluid typography (clamp)
- Użytkownik może zoom 200% bez horizontal scroll
- Line height: min 1.5 dla body, 1.2 dla headings

**Focus Visible:**

- Wyraźny focus indicator (outline/ring) na wszystkich interactive elements
- Ring color: accent color
- Ring width: 2-3px
- Focus trap w modalach/dialogs

**Touch Targets:**

- Min 44px x 44px (iOS HIG)
- Min 48px x 48px (Android Material)
- Spacing między targets: min 8px
- Larger dla primary actions

### 7.2. Keyboard Navigation

**Essentials:**

- Tab: przejście do następnego interactive element
- Shift+Tab: poprzedni element
- Enter/Space: aktywacja button/link
- Esc: zamknięcie modal/dialog/dropdown
- Arrow keys: navigation w dropdown/select

**Focus Management:**

- Auto-focus na pierwszy input w modalach
- Return focus po zamknięciu modala
- Skip to main content link (dla screen readers)
- Logical tab order

**Keyboard Shortcuts (opcjonalnie):**

- Cmd/Ctrl + K: Command palette
- Cmd/Ctrl + S: Save form
- Esc: Cancel/Close

### 7.3. Screen Reader Support

**Semantic HTML:**

- Correct heading hierarchy (h1 > h2 > h3)
- `<nav>` dla navigation
- `<main>` dla main content
- `<article>` dla event cards, child profiles
- `<button>` dla actions (nie `<div onClick>`)
- `<a>` dla links

**ARIA Labels:**

- `aria-label` dla icon-only buttons
- `aria-labelledby` dla complex components
- `aria-describedby` dla helper texts
- `aria-live="polite"` dla toasts
- `aria-hidden="true"` dla decorative icons

**Form Labels:**

- `<label>` powiązane z `<input>` (via htmlFor)
- Required fields: `aria-required="true"`
- Error messages: `aria-invalid="true"` + `aria-describedby`

**Dynamic Content:**

- Toast: `aria-live="polite"` region
- Loading states: `aria-busy="true"`
- Hidden thread: `aria-hidden` dla organizatora (nie renderowane)

### 7.4. Mobile Accessibility

**Touch Gestures:**

- Standard gestures (tap, scroll, swipe)
- Brak custom gestures wymagających precyzji
- Swipe down: close sheet (standardowe)

**Screen Reader Mobile:**

- VoiceOver (iOS) testing
- TalkBack (Android) testing
- Proper announcement order

**Landscape Orientation:**

- Support dla obu orientacji
- Fixed bottom nav: remains accessible

---

## 8. Względy bezpieczeństwa (Security)

### 8.1. Authentication Security

**Supabase Auth (PKCE Flow):**

- Industry-standard OAuth 2.0 PKCE
- Session w HTTP-only cookies (nie localStorage)
- Automatic token refresh
- Secure token storage (Supabase handles)

**Password Requirements:**

- Min 8 characters
- Recommendation: mix uppercase, lowercase, numbers, symbols
- Password strength indicator (opcjonalnie)
- Hash + salt na backend (Supabase)

**Session Management:**

- Session expiry: 24h (configurable)
- Automatic logout po expiry
- Manual logout: clear session + redirect
- "Remember me": extended session (opcjonalnie)

### 8.2. Authorization (RLS)

**Row Level Security Policies:**

**Grupy:**

- SELECT: tylko członkowie grupy
- INSERT: authenticated users (tworzenie nowej)
- UPDATE: tylko admin grupy
- DELETE: tylko admin grupy

**Dzieci:**

- SELECT: członkowie grupy dziecka
- INSERT: członkowie grupy
- UPDATE: tylko parent (parent_id = auth.uid())
- DELETE: tylko parent

**Wydarzenia:**

- SELECT: członkowie grupy
- INSERT: członkowie grupy
- UPDATE: tylko organizer (organizer_id = auth.uid())
- DELETE: tylko organizer

**Komentarze (Hidden Thread):**

- SELECT: członkowie grupy AND NIE organizer (`events.organizer_id != auth.uid()`)
- INSERT: członkowie grupy AND NIE organizer
- UPDATE: tylko author (author_id = auth.uid())
- DELETE: tylko author

**Członkowie:**

- SELECT: członkowie grupy
- INSERT: przez invite code (automatyczne)
- DELETE: admin OR self-removal

### 8.3. Frontend Security

**XSS Prevention:**

- React auto-escapes content (default)
- No `dangerouslySetInnerHTML` (lub sanitize jeśli konieczne)
- Input validation (Zod schemas)
- Content Security Policy headers (backend)

**CSRF Protection:**

- Supabase cookies: SameSite=Lax
- CSRF tokens dla state-changing operations (Supabase handles)

**Input Validation:**

- Client-side: Zod schemas (immediate feedback)
- Server-side: duplicate validation (defense in depth)
- Sanitization: trim whitespace, remove kontrolne znaki

**Hidden Thread Protection (3 warstwy):**

1. **RLS**: Database policy blocks organizer access
2. **API**: 403 response jeśli organizer calls endpoint
3. **Frontend**: Section nie renderuje dla organizatora

### 8.4. Data Privacy

**Email Privacy:**

- Admin email: hidden by default
- Reveal: explicit user action (button click)
- Context: dialog z informacją o celu

**Minimalizacja Danych:**

- Profile: tylko email (from auth)
- Dzieci: display name (no surname), optional birth date
- Brak avatar upload (inicjały tylko)
- Brak full names w MVP

**GDPR Compliance:**

- Transparency: info box o ujawnieniu emaila przy tworzeniu grupy
- Consent: implicit przez tworzenie grupy jako admin
- Right to delete: future feature (account deletion)
- Data export: future feature

### 8.5. Invite Code Security

**Code Generation:**

- Cryptographically random (not guessable)
- 8 alphanumeric characters (58^8 combinations)
- Backend generation (nie client-side)

**Expiry:**

- 60 minutes TTL (minimalizuje window of attack)
- Auto-cleanup expired codes (backend cron)

**Rate Limiting:**

- Max 5 code generations/hour (admin)
- Max 10 join attempts/hour (user)
- Prevents brute force

**Revocation:**

- Admin może usunąć kod w dowolnym momencie
- Immediate invalidation

---

## 9. Względy wydajnościowe (Performance)

### 9.1. Mobile First Performance

**Lighthouse Targets:**

- Performance: >90 (mobile)
- Accessibility: >95
- Best Practices: >90
- SEO: 100 (dla public pages)

**Core Web Vitals:**

- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

### 9.2. Optimization Strategies

**SSR Advantage (Astro):**

- Initial HTML rendered server-side
- Instant First Contentful Paint
- Progressive hydration: critical content first

**Code Splitting:**

- Astro automatic per-page splitting
- React lazy() dla heavy components
- Dynamic imports dla modal contents

**Asset Optimization:**

- Images: WebP format, lazy loading, responsive srcset
- Fonts: system fonts (no web fonts w MVP dla speed)
- Icons: SVG sprites lub inline SVG
- CSS: critical inline, rest async loaded

**API Optimization:**

- React Query cache: `staleTime: 5min`, `cacheTime: 10min`
- Prefetching: critical data przy app load (grupy użytkownika)
- Pagination: limit=20 dla list
- Debouncing: search inputs (300ms)

**Virtual Scrolling:**

- Dla list >50 items (react-window)
- Use cases: duże grupy (>30 dzieci/członków)
- Progressive enhancement (start bez, add jeśli needed)

### 9.3. Bundle Size Management

**React Query over Redux:**

- Lighter bundle size
- Built-in caching i refetching
- Less boilerplate

**Shadcn/ui Approach:**

- Copy-paste components (nie całej biblioteki)
- Tree-shaking friendly
- Only install co potrzebujemy

**Third-party Libraries:**

- Minimal dependencies
- Evaluate bundle size przed dodaniem
- Prefer native APIs (Share API, Clipboard API)

---

## 10. Mapowanie User Stories do UI

### US-001: Rejestracja i logowanie (Mobile)

**Widoki:**

- 2.2. Strona Logowania (`/login`)
- 2.3. Strona Rejestracji (`/register`)
- 2.4. Reset Hasła Request (`/forgot-password`)
- 2.5. Reset Hasła Set New (`/reset-password`)

**Komponenty:**

- LoginForm, RegisterForm, AuthLayout
- Button w top bar: "Zaloguj się" / "Wyloguj się"

**Kryteria spełnione:**
✓ Responsywne formularze
✓ Walidacja czytelna na małym ekranie
✓ Klawiatura nie zasłania przycisków
✓ Przekierowanie po logowaniu
✓ Przyciski widoczne w top bar
✓ Dedykowane strony (nie na home)
✓ Linki między logowaniem/rejestracją
✓ Link do resetu hasła

---

### US-002: Utworzenie grupy i zgoda na kontakt

**Widoki:**

- 2.7. Tworzenie Grupy (`/groups/new`)

**Komponenty:**

- CreateGroupForm z Alert (info box)

**Kryteria spełnione:**
✓ Info box o ujawnieniu emaila (prominent)
✓ Automatyczna rola Admin
✓ Badge "Admin 👑" przy nazwisku na liście członków

---

### US-003: Generowanie bezpiecznego kodu zaproszenia

**Widoki:**

- 2.17. Generowanie Kodów (`/groups/:groupId/invite`)

**Komponenty:**

- InviteCodeCard z countdown timer

**Kryteria spełnione:**
✓ Przycisk "Generuj kod" (admin only)
✓ Kod z countdown "Wygasa za: 45 min 23 sek"
✓ Kod automatycznie invaliduje po 60 min
✓ Kolor countdown: green/yellow/red based on time

---

### US-004: Usuwanie członków (Moderacja)

**Widoki:**

- 2.16. Lista Członków (`/groups/:groupId/members`)

**Komponenty:**

- MemberCard z DropdownMenu (three dots) + AlertDialog

**Kryteria spełnione:**
✓ Admin widzi opcję "Usuń z grupy" przy każdym członku (except self)
✓ Usunięcie natychmiastowe (API + RLS)
✓ Confirmation dialog z warning

---

### US-005: Kontakt z Administratorem

**Widoki:**

- 2.16. Lista Członków (`/groups/:groupId/members`)

**Komponenty:**

- MemberCard z "Pokaż kontakt" button + Dialog

**Kryteria spełnione:**
✓ Przycisk "Pokaż kontakt" przy Administratorze
✓ Email domyślnie ukryty
✓ Dialog wyświetla pełny email po kliknięciu
✓ Możliwość skopiowania emaila

---

### US-006: Wsparcie AI przy edycji opisu (Magic Wand)

**Widoki:**

- 2.13. Dodawanie Dziecka (`/groups/:groupId/children/new`)
- 2.14. Edycja Dziecka (`/groups/:groupId/children/:childId/edit`)

**Komponenty:**

- MagicWandForm z textarea + button "🪄 Magic Wand"

**Kryteria spełnione:**
✓ Pole notatki + przycisk "Magic Wand" w trybie edycji
✓ Kliknięcie wysyła do AI
✓ AI nadpisuje pole formularza
✓ User może edytować zwrócony tekst
✓ Zapis tylko po kliknięciu "Zapisz"
✓ Rate limit indicator

---

### US-007: Tworzenie wydarzenia i masowy wybór gości

**Widoki:**

- 2.10. Tworzenie Wydarzenia (`/groups/:groupId/events/new`)

**Komponenty:**

- CreateEventForm z guest selection (checkboxy + toggle all)

**Kryteria spełnione:**
✓ Formularz z listą dzieci (checkboxy)
✓ Przycisk "Zaznacz wszystkich" / "Odznacz wszystkich"
✓ Layout touch-friendly (48px+ targets)
✓ Search dla >10 dzieci
✓ Alfabetyczne section headers

---

### US-008: Bezpieczeństwo ukrytego wątku (RLS)

**Widoki:**

- 2.9. Szczegóły Wydarzenia (`/groups/:groupId/events/:eventId`)

**Komponenty:**

- CommentThread (conditional rendering)
- Alert (info) dla organizatora

**Kryteria spełnione:**
✓ Organizator nie widzi sekcji komentarzy (frontend nie renderuje)
✓ RLS policy blokuje SELECT dla organizatora
✓ API 403 dla organizer GET /comments
✓ 3 warstwy ochrony: RLS + API + Frontend

---

### US-009: Ukryty wątek dla gości

**Widoki:**

- 2.9. Szczegóły Wydarzenia (`/groups/:groupId/events/:eventId`)

**Komponenty:**

- CommentThread dla gości

**Kryteria spełnione:**
✓ Goście widzą sekcję komentarzy
✓ Nowe komentarze po refetch/refresh (brak realtime w MVP)
✓ Author label: "Mama Adasia" (z dziecka autora)
✓ Możliwość dodawania komentarzy
✓ Optimistic updates

---

## 11. Podsumowanie architektury

Architektura UI dla Grupka MVP została zaprojektowana z myślą o:

1. **Mobile First**: Wszystkie widoki priorytetowo pod smartfony, touch-friendly targets, bottom navigation w thumb zone

2. **Bezpieczeństwo**: Hidden thread protection (3 warstwy), email privacy (reveal na żądanie), tymczasowe kody (60 min), RLS enforcement

3. **Prywatność**: Minimalizacja danych osobowych, brak nazwisk, opcjonalne daty, transparentność o ujawnieniu emaila admina

4. **User Experience**: Intuitive navigation, clear empty states, helpful error messages, optimistic updates, skeleton loaders

5. **Dostępność**: WCAG 2.1 Level AA, keyboard navigation, screen reader support, min 4.5:1 contrast, semantic HTML

6. **Performance**: SSR z Astro, React Query caching, code splitting, WebP images, Lighthouse >90 mobile

7. **Asynchroniczna komunikacja**: Brak realtime w MVP, manual refresh, badge "Zaktualizowane" (8h window) jako passive indicator

8. **AI Integration**: Magic Wand w jednym miejscu (textarea "Co lubi dziecko?"), rate limiting, localStorage drafts

**Kluczowe User Flows:**

- Admin: Rejestracja → Utwórz grupę → Dodaj dziecko (Magic Wand) → Wygeneruj kod → Utwórz wydarzenie
- Member: Rejestracja → Dołącz (kod) → Dodaj dziecko → Komentuj w wydarzeniu (hidden thread)
- Organizator: Utwórz wydarzenie → Wybierz gości → Nie widzi komentarzy (surprise protection)
- Gość: Zobacz wydarzenie → Bio dziecka (inspiracja) → Komentuj → Koordynacja prezentu

**Tech Stack UI:**

- Astro 5 (SSR, layouts)
- React 19 (interactive components)
- Tailwind 4 (styling, design tokens)
- Shadcn/ui (base components)
- React Query (state management API)
- Zod (validation)
- Sonner (toasts)

**Routing:**

- Hierarchiczny z grupą jako context: `/groups/:groupId/*`
- URL jako source of truth
- Protected routes z middleware
- Redirect logic dla auth

**Navigation:**

- Mobile: Top bar + Bottom nav (4 tabs)
- Desktop: Top bar + Left sidebar
- Group switcher: Sheet (mobile) / Dropdown (desktop)
- Back button, breadcrumbs (desktop)

**Komponenty:**

- 17 core Shadcn/ui components
- 7 custom feature components
- 2 layout components (Astro)
- Utilities i helpers (date, avatar, validation)

Architektura jest kompletna, skalowalna i gotowa do implementacji MVP.
