# Konfiguracja Supabase dla Modułu Autentykacji

## 📋 Spis Treści
1. [Konfiguracja Początkowa](#konfiguracja-początkowa)
2. [Migracja Bazy Danych](#migracja-bazy-danych)
3. [Konfiguracja Email Authentication](#konfiguracja-email-authentication)
4. [Redirect URLs](#redirect-urls)
5. [Szablony Email](#szablony-email)
6. [Testowanie](#testowanie)

## 🚀 Konfiguracja Początkowa

### 1. Utwórz Projekt Supabase (jeśli jeszcze nie masz)

1. Przejdź do [https://supabase.com](https://supabase.com)
2. Zaloguj się lub utwórz konto
3. Kliknij "New Project"
4. Wypełnij formularz:
   - **Name**: grupka-app (lub dowolna nazwa)
   - **Database Password**: wybierz silne hasło (zapisz je!)
   - **Region**: wybierz najbliższy region (np. Frankfurt dla Polski)
5. Kliknij "Create new project"

### 2. Pobierz Klucze API

1. W Dashboard, przejdź do **Settings** → **API**
2. Skopiuj następujące wartości:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon public key**
3. Dodaj je do pliku `.env` w głównym katalogu projektu:

```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj-anon-public-key
PUBLIC_SITE_URL=http://localhost:4321
```

> **UWAGA:** Plik `.env` powinien być dodany do `.gitignore` i NIE powinien być commitowany do repozytorium!

## 🗄️ Migracja Bazy Danych

### Metoda 1: Przez Dashboard (Zalecana dla początkujących)

1. W Dashboard Supabase, przejdź do **SQL Editor**
2. Kliknij **New query**
3. Skopiuj zawartość pliku `supabase/migrations/20260104000000_auth_profiles.sql`
4. Wklej do edytora SQL
5. Kliknij **Run** (lub Ctrl/Cmd + Enter)
6. Sprawdź czy migracja przebiegła pomyślnie (powinien pojawić się komunikat "Success")

### Metoda 2: Przez Supabase CLI (Zalecana dla zaawansowanych)

1. Zainstaluj Supabase CLI:
```bash
npm install -g supabase
```

2. Zaloguj się:
```bash
supabase login
```

3. Połącz projekt:
```bash
supabase link --project-ref twoj-project-ref
```

4. Uruchom migracje:
```bash
supabase db push
```

### Weryfikacja Migracji

1. Przejdź do **Table Editor** w Dashboard
2. Sprawdź czy tabela `profiles` została utworzona
3. Sprawdź kolumny: `id`, `email`, `created_at`, `updated_at`
4. W **Authentication** → **Policies** sprawdź czy RLS jest włączone dla tabeli `profiles`

## 🔐 Konfiguracja Email Authentication

### 1. Włącz Email Provider

1. W Dashboard, przejdź do **Authentication** → **Providers**
2. Znajdź **Email** w liście providerów
3. Upewnij się, że jest **włączony** (toggle switch na zielono)

### 2. Konfiguracja Email (Opcjonalna - dla Produkcji)

#### Opcja A: Używanie Domyślnego SMTP Supabase (Dobre dla dev/testów)
- Domyślnie Supabase używa własnego SMTP
- ⚠️ Emaile mogą trafiać do SPAM
- ⚠️ Limitowane do 3 emaili na godzinę dla darmowego planu

#### Opcja B: Własny SMTP (Zalecane dla produkcji)
1. Przejdź do **Settings** → **Auth** → **SMTP Settings**
2. Włącz **Custom SMTP**
3. Uzupełnij dane SMTP:
   - **Sender email**: twoj-email@domena.pl
   - **Sender name**: Grupka
   - **Host**: smtp.twoj-provider.com
   - **Port**: 587 (lub 465 dla SSL)
   - **Username**: twoj-smtp-username
   - **Password**: twoj-smtp-password
4. Kliknij **Save**

**Popularne Dostawcy SMTP:**
- SendGrid (darmowe 100 emaili/dzień)
- Mailgun (darmowe 5000 emaili/miesiąc)
- Amazon SES (bardzo tanie)
- Resend (nowoczesny, developer-friendly)

## 🔗 Redirect URLs

### Konfiguracja Redirect URLs

1. W Dashboard, przejdź do **Authentication** → **URL Configuration**
2. W sekcji **Redirect URLs** dodaj:

**Dla środowiska deweloperskiego:**
```
http://localhost:4321/api/auth/callback
http://localhost:4321/*
```

**Dla środowiska produkcyjnego (dodaj gdy będziesz deployować):**
```
https://twoja-domena.pl/api/auth/callback
https://twoja-domena.pl/*
```

3. W sekcji **Site URL** ustaw:
   - **Dev**: `http://localhost:4321`
   - **Production**: `https://twoja-domena.pl`

4. Kliknij **Save**

> **UWAGA:** Bez poprawnie skonfigurowanych Redirect URLs, autentykacja nie będzie działać!

## 📧 Szablony Email

### Dostosuj Szablony Email (Opcjonalne)

1. Przejdź do **Authentication** → **Email Templates**
2. Znajdziesz 4 szablony:
   - **Confirm signup** - email potwierdzający rejestrację
   - **Invite user** - zaproszenie użytkownika
   - **Magic Link** - link do logowania bez hasła
   - **Reset Password** - link do resetowania hasła

### Przykład: Dostosowanie Reset Password Email

1. Kliknij na **Reset Password**
2. Zmień **Subject**:
```
Resetowanie hasła - Grupka
```

3. Zmień **Message Body**:
```html
<h2>Resetowanie hasła</h2>

<p>Witaj!</p>

<p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w aplikacji Grupka.</p>

<p>Kliknij w poniższy link, aby ustawić nowe hasło:</p>

<p><a href="{{ .ConfirmationURL }}">Ustaw nowe hasło</a></p>

<p>Link jest ważny przez 1 godzinę.</p>

<p>Jeśli to nie Ty wysłałeś prośbę o reset hasła, zignoruj tego emaila.</p>

<p>Pozdrawiamy,<br>
Zespół Grupka</p>
```

4. Kliknij **Save**

> **UWAGA:** Zmienna `{{ .ConfirmationURL }}` zostanie automatycznie zastąpiona przez Supabase odpowiednim linkiem.

## 🧪 Testowanie

### Testowanie Email Confirmation (Opcjonalne)

Podczas rozwoju aplikacji możesz **wyłączyć** wymaganie potwierdzenia emaila:

1. Przejdź do **Authentication** → **Providers** → **Email**
2. Znajdź opcję **Confirm email**
3. **Wyłącz** tę opcję (przełącznik na szaro)
4. Kliknij **Save**

> **UWAGA:** Pamiętaj, aby **włączyć** potwierdzenie emaila przed wdrożeniem na produkcję!

### Test Flow Rejestracji

1. Uruchom aplikację:
```bash
npm run dev
```

2. Przejdź do `http://localhost:4321/register`
3. Zarejestruj się z prawdziwym adresem email
4. Sprawdź swoją skrzynkę email (także SPAM!)
5. Kliknij link aktywacyjny (jeśli wymóg potwierdzenia jest włączony)
6. Zaloguj się na `http://localhost:4321/login`

### Test Flow Resetowania Hasła

1. Przejdź do `http://localhost:4321/forgot-password`
2. Wprowadź swój email
3. Sprawdź email z linkiem do resetowania
4. Kliknij link
5. Ustaw nowe hasło

### Sprawdzenie Użytkowników w Dashboard

1. Przejdź do **Authentication** → **Users**
2. Powinieneś zobaczyć listę zarejestrowanych użytkowników
3. Kliknij na użytkownika, aby zobaczyć szczegóły
4. Możesz ręcznie potwierdzić email lub usunąć użytkownika

## 🔧 Zaawansowana Konfiguracja

### Limity Rate Limiting

1. Przejdź do **Settings** → **Auth** → **Rate Limits**
2. Domyślne limity:
   - **Email signup**: 60 requests/hour per IP
   - **Password reset**: 60 requests/hour per IP
3. Możesz dostosować według potrzeb

### Session Management

1. Przejdź do **Settings** → **Auth** → **Session Management**
2. Domyślne ustawienia:
   - **JWT expiry**: 3600 seconds (1 hour)
   - **Refresh token reuse**: Disabled
3. Możesz dostosować według potrzeb

### Password Requirements

1. Przejdź do **Settings** → **Auth** → **Password Policy**
2. Możesz ustawić:
   - Minimalną długość hasła
   - Wymagania dotyczące złożoności hasła
   - Historie haseł

> **UWAGA:** W aplikacji mamy już walidację na 8 znaków minimum. Upewnij się, że ustawienia w Supabase są zgodne.

## 📝 Checklist Konfiguracji

Przed rozpoczęciem testowania, upewnij się, że:

- [ ] Utworzyłeś projekt w Supabase
- [ ] Dodałeś zmienne środowiskowe do pliku `.env`
- [ ] Uruchomiłeś migrację dla tabeli `profiles`
- [ ] Włączyłeś Email Provider
- [ ] Skonfigurowałeś Redirect URLs
- [ ] (Opcjonalnie) Wyłączyłeś potwierdzenie emaila dla dev
- [ ] (Opcjonalnie) Dostosowałeś szablony email
- [ ] (Dla produkcji) Skonfigurowałeś własny SMTP

## 🆘 Troubleshooting

### Problem: "Invalid Redirect URL"
**Rozwiązanie:** Sprawdź czy dodałeś URL callback w Authentication → URL Configuration

### Problem: "Email not confirmed"
**Rozwiązanie:** Wyłącz wymóg potwierdzenia emaila w Authentication → Providers → Email lub potwierdź email ręcznie w Dashboard

### Problem: "Session expired"
**Rozwiązanie:** Zaloguj się ponownie. Token sesji wygasł (domyślnie po 1h).

### Problem: Emaile nie docierają
**Rozwiązanie:**
1. Sprawdź folder SPAM
2. Sprawdź limity w Dashboard (Settings → Auth → Rate Limits)
3. Rozważ konfigurację własnego SMTP

### Problem: "User already registered"
**Rozwiązanie:** Ten email jest już zarejestrowany. Użyj innego emaila lub zaloguj się.

## 📚 Dodatkowe Zasoby

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Powodzenia z konfiguracją!** 🚀

Jeśli napotkasz jakiekolwiek problemy, sprawdź logi w Supabase Dashboard lub skonsultuj się z dokumentacją.

