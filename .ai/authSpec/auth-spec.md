# Specyfikacja Modułu Autentykacji - Projekt Grupka

## 1. Architektura Interfejsu Użytkownika (UI)

### 1.1 Strony Astro (SSR)

Aplikacja wykorzystuje system routingu Astro. Nowe strony zostaną dodane w katalogu `src/pages/`:

- `/login` - Strona logowania.
- `/register` - Strona rejestracji nowego konta.
- `/forgot-password` - Strona prośby o reset hasła.
- `/reset-password` - Strona ustawiania nowego hasła (dostępna przez link z e-maila).
- `/api/auth/callback` - Endpoint typu GET obsługujący wymianę kodu na sesję (PKCE flow).

### 1.2 Komponenty React (Dynamiczne)

Formularze zostaną zaimplementowane jako komponenty React (`client:load`), aby zapewnić natychmiastową walidację i lepsze UX na urządzeniach mobilnych:

- `LoginForm.tsx` - Pola: email, hasło. Przycisk "Zaloguj". Link do resetu hasła.
- `RegisterForm.tsx` - Pola: email, hasło, powtórz hasło. Opcjonalnie checkbox zgody na regulamin.
- `ForgotPasswordForm.tsx` - Pole: email. Przycisk "Wyślij link do resetu".
- `ResetPasswordForm.tsx` - Pola: nowe hasło, powtórz hasło.

### 1.3 Rozszerzenie Layoutu

`Layout.astro` zostanie zmodyfikowany, aby dynamicznie wyświetlać nawigację w zależności od stanu zalogowania (`context.locals.user`):

- **Gość**: Przyciski "Zaloguj" i "Zarejestruj" (zgodnie z PRD sekcja 1.1).
- **Zalogowany**: Ikona profilu/Awatar (minimalistycznie) i przycisk "Wyloguj".

### 1.4 Walidacja i Komunikaty

- **Biblioteka**: Zod.
- **Walidacja Client-side**: Natychmiastowa informacja o błędnym formacie e-maila lub zbyt krótkim haśle (min. 8 znaków).
- **Walidacja Server-side**: Obsługa błędów z Supabase (np. "Użytkownik już istnieje", "Błędne dane logowania").
- **Komunikaty**: Wykorzystanie komponentów Toast (np. z Shadcn/ui) do informowania o sukcesie wysłania linku resetującego lub błędach logowania.

## 2. Logika Backendowa

### 2.1 Endpointy API i Akcje

Zgodnie z Astro 5, rekomendowane jest użycie **Astro Actions** do obsługi formularzy. Definicje akcji w `src/actions/auth.ts`:

- `login`:
    - Input: `z.object({ email: z.string().email(), password: z.string() })`
    - Logic: `supabase.auth.signInWithPassword`
    - Output: `{ success: boolean, error?: string }`
- `register`:
    - Input: `z.object({ email: z.string().email(), password: z.string().min(8) })`
    - Logic: `supabase.auth.signUp`
    - Output: `{ success: boolean, error?: string }`
- `logout`:
    - Logic: `supabase.auth.signOut`
    - Output: `{ success: boolean }`
- `requestPasswordReset`:
    - Input: `z.object({ email: z.string().email() })`
    - Logic: `supabase.auth.resetPasswordForEmail`
- `updatePassword`:
    - Input: `z.object({ password: z.string().min(8) })`
    - Logic: `supabase.auth.updateUser`

### 2.2 Middleware i Bezpieczeństwo

Zmiana w `src/middleware/index.ts`:

- **Inicjalizacja**: Użycie `createServerClient` z `@supabase/ssr` zamiast prostego `supabaseClient`, aby poprawnie obsługiwać ciasteczka w środowisku SSR.
- **Weryfikacja Sesji**: Wywołanie `supabase.auth.getUser()` w celu potwierdzenia autentyczności sesji (bezpieczniejsze niż samo sprawdzenie ciasteczka).
- **Zasoby Chronione**: Tablica `protectedPaths = ['/groups', '/profile']`. Jeśli `context.url.pathname` pasuje, a użytkownik nie jest zalogowany -> przekierowanie do `/login`.

### 2.3 Modele Danych i Serwisy

- **Auth Service**: Nowy moduł `src/lib/services/auth.service.ts` grupujący logikę interakcji z Supabase Auth, używany przez Astro Actions.
- **Baza danych**:
    - `profiles`: Klucz obcy do `auth.users`. Tabela przechowuje jedynie `id` i `email` (zgodnie z zasadą minimalizacji danych).

## 3. System Autentykacji (Supabase Auth)

### 3.1 Konfiguracja PKCE Flow

W środowisku SSR (Astro) wykorzystamy przepływ PKCE:

1. Użytkownik przesyła formularz.
2. Serwer wywołuje API Supabase.
3. Supabase ustawia ciasteczka (access_token, refresh_token).
4. Astro przechowuje te ciasteczka i przesyła je przy kolejnych żądaniach.

### 3.2 Password Recovery

1. Użytkownik wpisuje e-mail na `/forgot-password`.
2. Supabase wysyła e-mail z linkiem zawierającym `hashed_token`.
3. Link kieruje do `/api/auth/callback` z parametrem `type=recovery`.
4. Po weryfikacji użytkownik jest przekierowany na `/reset-password` w stanie uwierzytelnionym czasowo, co pozwala na zmianę hasła.

## 4. Scenariusze Użytkownika

### 4.1 Rejestracja i Pierwsze Wrażenie

Zgodnie z PRD, użytkownik niezalogowany widzi sekcję Hero z wyjaśnieniem celu aplikacji. Przycisk "Utwórz grupę" przekierowuje do `/register` z informacją, że zarządzanie członkami wymaga konta.

## 5. Integracja i Kroki Implementacyjne

### 5.1 Zależności

- Dodanie `@supabase/ssr` do projektu w celu poprawnej obsługi ciasteczek sesji w Astro SSR.
- Wykorzystanie istniejącej biblioteki `zod` do definicji schematów walidacji w `src/lib/schemas.ts`.

### 5.2 Kolejność Prac

1. Konfiguracja Supabase Auth (Template'y e-maili, Redirect URL dla localhost/produkcji).
2. Implementacja `src/middleware/index.ts` z obsługą sesji.
3. Utworzenie Astro Actions dla procesów autentykacji.
4. Budowa stron Astro i komponentów formularzy React.
5. Testowanie przepływu PKCE i odzyskiwania hasła.

---

_Niniejsza specyfikacja zapewnia fundament pod bezpieczny i zgodny z zasadami privacy-by-design system autentykacji dla aplikacji Grupka._
