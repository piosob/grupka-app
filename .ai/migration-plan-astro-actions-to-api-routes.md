# 🔄 PLAN MIGRACJI: Astro Actions → API Routes

## 📋 Kontekst i Cel

**Problem:** Astro Actions generują błąd "Right-hand side of 'instanceof' is not an object" na Vercel z powodu różnic w JavaScript realms między lokalne a serverless environment.

**Rozwiązanie:** Całkowite usunięcie Astro Actions i przepisanie logiki auth na standardowe API Routes, które są spójne z resztą projektu (16 istniejących API Routes).

**Architektura projektu:**
- **Tech Stack:** Astro 5, React 19, TypeScript 5, Tailwind 4, Supabase
- **Backend:** Supabase (auth + database)
- **Deployment:** Vercel
- **Obecny stan:** 5 Astro Actions (auth) + 16 API Routes (reszta aplikacji)

---

## 🎯 Zakres Zmian

### Pliki do USUNIĘCIA:
1. `src/actions/auth.ts` - definicje 5 Astro Actions
2. `src/actions/index.ts` - eksport Actions

### Pliki do UTWORZENIA (5 nowych API Routes):
1. `src/pages/api/auth/login.ts`
2. `src/pages/api/auth/register.ts`
3. `src/pages/api/auth/logout.ts`
4. `src/pages/api/auth/request-password-reset.ts`
5. `src/pages/api/auth/update-password.ts`

### Pliki do MODYFIKACJI (8 komponentów React):
1. `src/components/react/LoginForm.tsx`
2. `src/components/react/RegisterForm.tsx`
3. `src/components/react/ForgotPasswordForm.tsx`
4. `src/components/react/ResetPasswordForm.tsx`
5. `src/components/react/profile/LogoutSection.tsx`
6. `src/components/react/profile/ChangePasswordDialog.tsx`
7. `src/components/react/MobileMoreMenu.tsx`
8. `src/components/react/UserNav.tsx`

### Pliki do MODYFIKACJI (schemas):
9. `src/lib/schemas.ts` - usunięcie preprocess (nie jest już potrzebny)

---

## 📝 KROK 1: Utworzenie API Routes dla Auth

Wszystkie API Routes muszą:
- Używać wzorca z istniejących 16 API Routes
- Używać `handleApiError` z `api-utils.ts`
- Używać `AuthService` z `auth.service.ts`
- Mieć `export const prerender = false`
- Obsługiwać FormData (POST z formularzy)
- Zwracać standardowe JSON responses

### 1.1. Utworzyć `src/pages/api/auth/login.ts`

```typescript
import type { APIRoute } from 'astro';
import { LoginCommandSchema } from '../../../lib/schemas';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates user with email and password
 *
 * Request body (FormData):
 * - email (string): User email address
 * - password (string): User password
 *
 * Responses:
 * - 200 OK: Successfully authenticated
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Invalid credentials
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // === GUARD: FormData Parsing ===
        let formData;
        try {
            formData = await request.formData();
        } catch {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid form data',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Convert FormData to object
        const body = Object.fromEntries(formData);

        // === GUARD: Schema Validation ===
        const input = LoginCommandSchema.parse(body);

        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.login(input.email, input.password);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: result.error || 'Nie udało się zalogować',
                    },
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Happy Path: Success ===
        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                    redirectTo: result.redirectTo || '/dashboard',
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/login]');
    }
};
```

### 1.2. Utworzyć `src/pages/api/auth/register.ts`

```typescript
import type { APIRoute } from 'astro';
import { RegisterCommandSchema } from '../../../lib/schemas';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/register
 *
 * Creates new user account with email and password
 *
 * Request body (FormData):
 * - firstName (string): User first name
 * - email (string): User email address
 * - password (string): User password
 * - confirmPassword (string): Password confirmation
 *
 * Responses:
 * - 201 Created: Successfully registered
 * - 400 Bad Request: Validation error
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // === GUARD: FormData Parsing ===
        let formData;
        try {
            formData = await request.formData();
        } catch {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid form data',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Convert FormData to object
        const body = Object.fromEntries(formData);

        // === GUARD: Schema Validation ===
        const input = RegisterCommandSchema.parse(body);

        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.register(input.email, input.password, input.firstName);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'BAD_REQUEST',
                        message: result.error || 'Nie udało się utworzyć konta',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Happy Path: Success ===
        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                    needsEmailConfirmation: result.needsEmailConfirmation,
                },
            }),
            {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/register]');
    }
};
```

### 1.3. Utworzyć `src/pages/api/auth/logout.ts`

```typescript
import type { APIRoute } from 'astro';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Signs out current user
 *
 * Responses:
 * - 200 OK: Successfully logged out
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ locals }) => {
    try {
        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.logout();

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: result.error || 'Nie udało się wylogować',
                    },
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Happy Path: Success ===
        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/logout]');
    }
};
```

### 1.4. Utworzyć `src/pages/api/auth/request-password-reset.ts`

```typescript
import type { APIRoute } from 'astro';
import { RequestPasswordResetCommandSchema } from '../../../lib/schemas';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/request-password-reset
 *
 * Sends password reset email to user
 *
 * Request body (FormData):
 * - email (string): User email address
 *
 * Responses:
 * - 200 OK: Email sent (or email doesn't exist - security)
 * - 400 Bad Request: Validation error
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // === GUARD: FormData Parsing ===
        let formData;
        try {
            formData = await request.formData();
        } catch {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid form data',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Convert FormData to object
        const body = Object.fromEntries(formData);

        // === GUARD: Schema Validation ===
        const input = RequestPasswordResetCommandSchema.parse(body);

        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.requestPasswordReset(input.email);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'BAD_REQUEST',
                        message: result.error || 'Nie udało się wysłać linku resetującego',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Happy Path: Success ===
        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                    message: 'Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła.',
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/request-password-reset]');
    }
};
```

### 1.5. Utworzyć `src/pages/api/auth/update-password.ts`

```typescript
import type { APIRoute } from 'astro';
import { UpdatePasswordCommandSchema } from '../../../lib/schemas';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/update-password
 *
 * Updates user password (requires authenticated session)
 *
 * Request body (JSON):
 * - password (string): New password
 * - confirmPassword (string): Password confirmation
 *
 * Responses:
 * - 200 OK: Password updated successfully
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // === GUARD: Authentication ===
        const {
            data: { user },
            error: authError,
        } = await locals.supabase.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Musisz być zalogowany, aby zmienić hasło',
                    },
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === GUARD: JSON Parsing ===
        let body;
        try {
            body = await request.json();
        } catch {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid JSON in request body',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === GUARD: Schema Validation ===
        const input = UpdatePasswordCommandSchema.parse(body);

        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.updatePassword(input.password);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'BAD_REQUEST',
                        message: result.error || 'Nie udało się zmienić hasła',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Happy Path: Success ===
        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                    message: 'Hasło zostało zmienione pomyślnie',
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/update-password]');
    }
};
```

---

## 📝 KROK 2: Modyfikacja Komponentów React

Wszystkie komponenty muszą:
- Usunąć import `actions` i `isInputError` z `astro:actions`
- Wywołać API Routes przez `fetch()`
- Obsługiwać standardowe JSON responses
- Parsować błędy walidacji z response

### 2.1. Modyfikować `src/components/react/LoginForm.tsx`

**Zmienić:**
```typescript
// PRZED
import { actions, isInputError } from 'astro:actions';

const { data, error: actionError } = await actions.auth.login(formData);

if (actionError) {
    if (isInputError(actionError)) {
        setInputErrors(actionError.fields);
    } else {
        setError(actionError.message);
    }
    return;
}
```

**NA:**
```typescript
// PO
const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: formData,
});

const result = await response.json();

if (!response.ok) {
    if (result.error?.code === 'VALIDATION_ERROR' && result.error?.details) {
        // Convert validation errors to input errors format
        const fieldErrors: Record<string, string[]> = {};
        result.error.details.forEach((detail: { field: string; message: string }) => {
            fieldErrors[detail.field] = [detail.message];
        });
        setInputErrors(fieldErrors);
    } else {
        setError(result.error?.message || 'Wystąpił błąd podczas logowania');
    }
    return;
}

const data = result.data;
```

### 2.2. Modyfikować `src/components/react/RegisterForm.tsx`

**Analogicznie jak LoginForm:**
- Zamienić `actions.auth.register(formData)` na `fetch('/api/auth/register', { method: 'POST', body: formData })`
- Obsłużyć response JSON
- Parsować błędy walidacji

### 2.3. Modyfikować `src/components/react/ForgotPasswordForm.tsx`

**Analogicznie:**
- Zamienić `actions.auth.requestPasswordReset(formData)` na `fetch('/api/auth/request-password-reset', { method: 'POST', body: formData })`

### 2.4. Modyfikować `src/components/react/ResetPasswordForm.tsx`

**Zmienić:**
```typescript
// PRZED
const { data, error: actionError } = await actions.auth.updatePassword({ password, confirmPassword });
```

**NA:**
```typescript
// PO
const response = await fetch('/api/auth/update-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, confirmPassword }),
});

const result = await response.json();

if (!response.ok) {
    // Handle error...
}
```

### 2.5. Modyfikować `src/components/react/profile/LogoutSection.tsx`

**Zmienić:**
```typescript
// PRZED
const { error } = await actions.auth.logout(formData);
```

**NA:**
```typescript
// PO
const response = await fetch('/api/auth/logout', {
    method: 'POST',
});

if (!response.ok) {
    const result = await response.json();
    console.error('Logout error:', result.error);
    return;
}
```

### 2.6. Modyfikować `src/components/react/profile/ChangePasswordDialog.tsx`

**Analogicznie jak ResetPasswordForm** (używa JSON, nie FormData)

### 2.7. Modyfikować `src/components/react/MobileMoreMenu.tsx`

**Analogicznie jak LogoutSection**

### 2.8. Modyfikować `src/components/react/UserNav.tsx`

**Analogicznie jak LogoutSection**

---

## 📝 KROK 3: Czyszczenie Schemas

### 3.1. Modyfikować `src/lib/schemas.ts`

**Usunąć `z.preprocess()` z wszystkich auth schemas**, ponieważ API Routes otrzymują normalne puste stringi (nie `null` jak Astro Actions):

```typescript
// PRZED
email: z.preprocess(
    (val) => (val === null ? '' : val),
    z.string({ ... }).min(1, '...').email('...')
),

// PO
email: z.string({
    required_error: 'Email jest wymagany',
    invalid_type_error: 'Email jest wymagany',
}).min(1, 'Email jest wymagany').email('Nieprawidłowy format adresu email'),
```

**Zmienić dla wszystkich pól w:**
- `LoginCommandSchema`
- `RegisterCommandSchema`
- `RequestPasswordResetCommandSchema`
- `UpdatePasswordCommandSchema`

**Usunąć komentarze** o Astro Actions transformacji null.

---

## 📝 KROK 4: Usunięcie Astro Actions

### 4.1. Usunąć pliki:
```bash
rm src/actions/auth.ts
rm src/actions/index.ts
```

### 4.2. Usunąć katalog (jeśli pusty):
```bash
rmdir src/actions
```

---

## ✅ KROK 5: Weryfikacja

### 5.1. Sprawdzić czy nie ma importów z `astro:actions`:
```bash
grep -r "astro:actions" src/
```
Nie powinno zwrócić żadnych wyników.

### 5.2. Sprawdzić czy nie ma importów z `./actions`:
```bash
grep -r "from.*actions" src/components/
```
Nie powinno zwrócić wyników związanych z auth actions.

### 5.3. Uruchomić build lokalnie:
```bash
npm run build
```
Build powinien przejść bez błędów.

### 5.4. Przetestować lokalnie:
- Rejestracja z pustymi polami → błędy walidacji
- Rejestracja z poprawnymi danymi → sukces
- Login → sukces/błąd
- Logout → sukces
- Request password reset → sukces
- Update password → sukces

### 5.5. Deploy na Vercel:
```bash
git add .
git commit -m "refactor: Migrate auth from Astro Actions to API Routes"
git push
```

### 5.6. Przetestować na Vercel:
- Wszystkie scenariusze jak lokalnie
- **Szczególnie: rejestracja z pustymi polami** (poprzedni problem)

---

## 🎯 Oczekiwany Rezultat

Po zakończeniu migracji:

✅ **5 nowych API Routes** (`/api/auth/*`) spójnych z resztą projektu  
✅ **Brak Astro Actions** - całkowite usunięcie  
✅ **8 zaktualizowanych komponentów React** używających `fetch()`  
✅ **Schemas bez preprocess** - czyste walidacje Zod  
✅ **Jednolita obsługa błędów** - `handleApiError` wszędzie  
✅ **Działa na Vercel** - brak błędów instanceof  

---

## 📊 Podsumowanie Zmian

| Kategoria | Akcja | Liczba plików |
|-----------|-------|---------------|
| **Nowe pliki** | Utworzenie API Routes | 5 |
| **Modyfikacja** | React Components | 8 |
| **Modyfikacja** | Schemas | 1 |
| **Usunięcie** | Astro Actions | 2 |
| **RAZEM** | | **16 plików** |

---

## 🔍 Uwagi Implementacyjne

1. **Kolejność wykonania:** Zachowaj kolejność kroków 1→2→3→4→5
2. **Testuj inkrementalnie:** Po każdym kroku sprawdź czy aplikacja się buduje
3. **FormData vs JSON:** 
   - FormData: login, register, logout, request-password-reset
   - JSON: update-password (z ChangePasswordDialog)
4. **Error handling:** Wszystkie błędy przez `handleApiError` który używa `error.code`
5. **Response format:** Zawsze `{ data: {...} }` lub `{ error: {...} }`

---

**KONIEC PLANU MIGRACJI**
