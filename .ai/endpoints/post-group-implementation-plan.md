# API Endpoint Implementation Plan: POST /api/groups

## 1. Przegląd punktu końcowego

Endpoint `POST /api/groups` umożliwia zalogowanym użytkownikom tworzenie nowych grup przedszkolnych/szkolnych. Twórca grupy automatycznie otrzymuje rolę administratora (`admin`). Endpoint ten jest fundamentalnym elementem aplikacji, ponieważ grupy stanowią główną jednostkę organizacyjną (tenant) w systemie Grupka.

**Główne funkcjonalności:**
- Tworzenie nowej grupy z nazwą podaną przez użytkownika
- Automatyczne przypisanie roli administratora twórcy grupy
- Walidacja długości i formatu nazwy grupy
- Zapewnienie spójności danych poprzez transakcyjne utworzenie wpisów w tabelach `groups` i `group_members`

---

## 2. Szczegóły żądania

**Metoda HTTP:** `POST`

**Struktura URL:** `/api/groups`

**Nagłówki:**
- `Authorization: Bearer <supabase_access_token>` (wymagany)
- `Content-Type: application/json` (wymagany)

**Parametry:**
- **Wymagane:** Brak parametrów URL ani query
- **Opcjonalne:** Brak

**Request Body:**

```json
{
    "name": "Przedszkole Słoneczko - Motylki"
}
```

**Struktura body:**
- `name` (string, wymagane): Nazwa grupy
  - Minimalna długość: 3 znaki
  - Maksymalna długość: 100 znaków
  - Przykłady poprawnych nazw:
    - "Przedszkole Słoneczko - Motylki"
    - "SP nr 15 - Klasa 3B"
    - "Żłobek Akademia - Biedronki"

---

## 3. Wykorzystywane typy

### DTOs i Command Modele:

**Input:**
- `CreateGroupCommand` - walidowany przez `CreateGroupCommandSchema`
  ```typescript
  {
      name: string; // min 3, max 100 znaków
  }
  ```

**Output:**
- `CreateGroupResponseDTO` - walidowany przez `CreateGroupResponseDTOSchema`
  ```typescript
  {
      id: string; // UUID
      name: string;
      role: 'admin' | 'member';
      createdAt: string; // ISO 8601 datetime
  }
  ```
- Opakowane w `SingleResponse<CreateGroupResponseDTO>`

**Błędy:**
- `ApiErrorResponse` zawierający `ErrorDTO`
  ```typescript
  {
      error: {
          code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'RATE_LIMITED' | 'SERVICE_UNAVAILABLE';
          message: string;
          details?: Array<{ field: string; message: string }>;
      }
  }
  ```

### Encje bazodanowe:
- `GroupEntity` (tabela `groups`)
- `GroupMemberEntity` (tabela `group_members`)

---

## 4. Szczegóły odpowiedzi

### Sukces (201 Created):

```json
{
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Przedszkole Słoneczko - Motylki",
        "role": "admin",
        "createdAt": "2025-01-15T10:30:00.000Z"
    }
}
```

**Nagłówki odpowiedzi:**
- `Content-Type: application/json`
- `Location: /api/groups/{groupId}` (opcjonalnie, dla REST best practices)

### Błędy:

**400 Bad Request - Walidacja nie powiodła się:**

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [
            {
                "field": "name",
                "message": "String must contain at least 3 character(s)"
            }
        ]
    }
}
```

**401 Unauthorized - Brak lub nieprawidłowy token:**

```json
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
    }
}
```

**500 Internal Server Error - Błąd serwera:**

```json
{
    "error": {
        "code": "SERVICE_UNAVAILABLE",
        "message": "An unexpected error occurred"
    }
}
```

---

## 5. Przepływ danych

### Diagram przepływu:

```
1. Klient → POST /api/groups + Bearer token
2. Middleware → Inicjalizacja context.locals.supabase
3. Endpoint Handler → Walidacja tokena JWT (supabase.auth.getUser())
   ├─ Błąd → 401 Unauthorized
   └─ Sukces → userId
4. Endpoint Handler → Walidacja body (CreateGroupCommandSchema.parse())
   ├─ Błąd → 400 Bad Request + szczegóły Zod
   └─ Sukces → CreateGroupCommand
5. Endpoint Handler → Wywołanie GroupsService.createGroup(userId, command)
6. GroupsService → Rozpoczęcie transakcji Supabase
7. GroupsService → INSERT do tabeli groups
   ├─ Błąd → Rollback + 500 Internal Server Error
   └─ Sukces → groupId, createdAt
8. GroupsService → INSERT do tabeli group_members (role: 'admin')
   ├─ Błąd → Rollback + 500 Internal Server Error
   └─ Sukces → joinedAt
9. GroupsService → Commit transakcji
10. GroupsService → Zwrot CreateGroupResponseDTO
11. Endpoint Handler → Response 201 Created + JSON body
12. Klient ← Odpowiedź z danymi utworzonej grupy
```

### Interakcje z bazą danych:

**Transakcja 1: Utworzenie grupy i członkostwa**

```sql
BEGIN;

-- Krok 1: Wstawienie nowej grupy
INSERT INTO groups (id, name, created_by, created_at)
VALUES (uuid_generate_v4(), $1, $2, NOW())
RETURNING id, name, created_at;

-- Krok 2: Wstawienie twórcy jako admina
INSERT INTO group_members (group_id, user_id, role, joined_at)
VALUES ($3, $2, 'admin', NOW())
RETURNING joined_at;

COMMIT;
```

**Parametry:**
- `$1`: name (z command)
- `$2`: userId (z autentykacji)
- `$3`: groupId (z poprzedniego INSERT)

---

## 6. Względy bezpieczeństwa

### Autentykacja:
- **Wymagany:** Ważny JWT token od Supabase w nagłówku `Authorization`
- **Implementacja:** Użycie `context.locals.supabase.auth.getUser()` w endpointcie
- **Weryfikacja:** Sprawdzenie czy `user` nie jest null i czy `user.id` istnieje
- **Token expiry:** Supabase SDK automatycznie weryfikuje ważność tokena

### Autoryzacja:
- **Zasada:** Każdy zalogowany użytkownik może utworzyć grupę
- **Brak dodatkowych ograniczeń** w MVP (w przyszłości można dodać rate limiting)
- **Row Level Security (RLS):** Supabase automatycznie egzekwuje polityki na poziomie bazy danych

### Walidacja danych wejściowych:
1. **Schema validation:** Użycie Zod do walidacji struktury i typów
   ```typescript
   CreateGroupCommandSchema.parse(body)
   ```
2. **Sanityzacja:**
   - Trim whitespace z nazwy: `name.trim()`
   - Walidacja długości: min 3, max 100 (w Zod)
   - Brak potrzeby HTML sanitization (dane nie są renderowane jako HTML)

3. **SQL Injection Prevention:**
   - Używamy Supabase SDK z parametryzowanymi zapytaniami
   - ORM automatycznie escapuje dane

### Potencjalne zagrożenia i mitigacja:

| Zagrożenie | Opis | Mitigacja |
|------------|------|-----------|
| Token theft | Przechwycenie JWT tokena | HTTPS only, secure storage, token expiry |
| Mass group creation | Spam grup przez jednego użytkownika | Future: Rate limiting na endpoincie |
| XSS via group name | Złośliwy kod w nazwie grupy | Frontend: React auto-escaping, Backend: validacja długości |
| CSRF | Cross-site request forgery | SameSite cookies, token-based auth (nie session) |
| Data leakage | Wycieki informacji o innych grupach | RLS w Supabase, scope do userId |

---

## 7. Obsługa błędów

### Katalog błędów z odpowiedziami:

#### 1. Błędy walidacji (400 Bad Request)

**Scenariusz:** Brak pola `name`
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [
            {
                "field": "name",
                "message": "Required"
            }
        ]
    }
}
```

**Scenariusz:** Nazwa za krótka (< 3 znaki)
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [
            {
                "field": "name",
                "message": "String must contain at least 3 character(s)"
            }
        ]
    }
}
```

**Scenariusz:** Nazwa za długa (> 100 znaków)
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [
            {
                "field": "name",
                "message": "String must contain at most 100 character(s)"
            }
        ]
    }
}
```

**Scenariusz:** Nieprawidłowy JSON
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid JSON in request body"
    }
}
```

#### 2. Błędy autentykacji (401 Unauthorized)

**Scenariusz:** Brak tokena
```json
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
    }
}
```

**Scenariusz:** Token wygasł lub nieprawidłowy
```json
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Invalid or expired token"
    }
}
```

#### 3. Błędy serwera (500 Internal Server Error)

**Scenariusz:** Błąd bazy danych
```json
{
    "error": {
        "code": "SERVICE_UNAVAILABLE",
        "message": "An unexpected error occurred"
    }
}
```

**Logowanie:** Wszystkie błędy 500 powinny być logowane z pełnym stack trace:
```typescript
console.error('[POST /api/groups] Database error:', error);
```

### Strategia obsługi błędów w kodzie:

```typescript
// Pseudokod struktury try-catch
try {
    // 1. Walidacja autentykacji
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return new Response(JSON.stringify({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        }), { status: 401 });
    }

    // 2. Walidacja body
    const command = CreateGroupCommandSchema.parse(await request.json());

    // 3. Business logic
    const result = await groupsService.createGroup(user.id, command);

    // 4. Success response
    return new Response(JSON.stringify({ data: result }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
    });

} catch (error) {
    if (error instanceof z.ZodError) {
        // Zod validation errors
        return new Response(JSON.stringify({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            }
        }), { status: 400 });
    }

    // Unexpected errors
    console.error('[POST /api/groups] Unexpected error:', error);
    return new Response(JSON.stringify({
        error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'An unexpected error occurred'
        }
    }), { status: 500 });
}
```

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **Transakcja bazodanowa:**
   - Dwa INSERT statements w jednej transakcji
   - **Wpływ:** Minimalny - operacje INSERT są szybkie
   - **Optymalizacja:** Używać connection pooling w Supabase (domyślnie włączony)

2. **Walidacja JWT tokena:**
   - Supabase SDK weryfikuje token przy każdym requescie
   - **Wpływ:** ~5-10ms opóźnienia
   - **Optymalizacja:** Nie wymagana w MVP - Supabase cachuje klucze publiczne

3. **Walidacja Zod:**
   - Parsowanie i walidacja schematu
   - **Wpływ:** <1ms dla prostego schematu z jednym polem
   - **Optymalizacja:** Nie wymagana

### Metryki wydajności (oczekiwane):

- **P50 (median):** < 50ms
- **P95:** < 100ms
- **P99:** < 200ms

### Strategie optymalizacji (dla przyszłości):

1. **Database indexing:**
   - Index na `groups.created_by` (dla przyszłych zapytań)
   - Index na `group_members(group_id, user_id)` (PK już jest indeksem)

2. **Rate limiting:**
   - Implementacja middleware dla limitowania 10 grup/użytkownik/godzinę
   - Zapobieganie spamowi i nadużyciom

3. **Monitoring:**
   - Logowanie czasu wykonania transakcji
   - Alerty dla requestów > 500ms

4. **Caching:**
   - Nie dotyczy POST endpointów (zawsze fresh data)

---

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury serwisu
**Plik:** `src/lib/services/groups.service.ts`

1.1. Utworzyć plik serwisu `groups.service.ts`

1.2. Zaimportować niezbędne zależności:
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { CreateGroupCommand, CreateGroupResponseDTO } from '../schemas';
```

1.3. Utworzyć typ dla Supabase client:
```typescript
type TypedSupabaseClient = SupabaseClient<Database>;
```

1.4. Zdefiniować klasę lub obiekt serwisu z metodą `createGroup`:
```typescript
export class GroupsService {
    constructor(private supabase: TypedSupabaseClient) {}

    async createGroup(
        userId: string,
        command: CreateGroupCommand
    ): Promise<CreateGroupResponseDTO> {
        // Implementation w kolejnym kroku
    }
}
```

### Krok 2: Implementacja logiki biznesowej w serwisie
**Plik:** `src/lib/services/groups.service.ts`

2.1. Zaimplementować metodę `createGroup`:

```typescript
async createGroup(
    userId: string,
    command: CreateGroupCommand
): Promise<CreateGroupResponseDTO> {
    // Sanityzacja danych wejściowych
    const sanitizedName = command.name.trim();

    // Rozpoczęcie transakcji przez utworzenie grupy
    const { data: group, error: groupError } = await this.supabase
        .from('groups')
        .insert({
            name: sanitizedName,
            created_by: userId,
        })
        .select('id, name, created_at')
        .single();

    if (groupError || !group) {
        throw new Error(`Failed to create group: ${groupError?.message}`);
    }

    // Dodanie twórcy jako admina do group_members
    const { error: memberError } = await this.supabase
        .from('group_members')
        .insert({
            group_id: group.id,
            user_id: userId,
            role: 'admin',
        });

    if (memberError) {
        // W przypadku błędu, próbujemy usunąć utworzoną grupę (compensation)
        await this.supabase.from('groups').delete().eq('id', group.id);
        throw new Error(`Failed to add group member: ${memberError.message}`);
    }

    // Zwrot odpowiedzi zgodnej z DTO
    return {
        id: group.id,
        name: group.name,
        role: 'admin',
        createdAt: group.created_at,
    };
}
```

2.2. Dodać helper do eksportu instancji serwisu:
```typescript
export const createGroupsService = (supabase: TypedSupabaseClient) => {
    return new GroupsService(supabase);
};
```

### Krok 3: Utworzenie endpointu API
**Plik:** `src/pages/api/groups/index.ts`

3.1. Utworzyć strukturę folderów: `src/pages/api/groups/`

3.2. Utworzyć plik `index.ts` z podstawową strukturą:

```typescript
import type { APIRoute } from 'astro';
import { CreateGroupCommandSchema } from '../../../lib/schemas';
import { createGroupsService } from '../../../lib/services/groups.service';
import { z } from 'zod';

export const prerender = false;
```

### Krok 4: Implementacja handlera POST
**Plik:** `src/pages/api/groups/index.ts`

4.1. Zaimplementować handler `POST`:

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // === GUARD: Autentykacja ===
        const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
        
        if (authError || !user) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                }),
                { 
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // === GUARD: Walidacja body ===
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
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const command = CreateGroupCommandSchema.parse(body);

        // === Business Logic ===
        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.createGroup(user.id, command);

        // === Happy Path: Sukces ===
        return new Response(
            JSON.stringify({ data: result }),
            {
                status: 201,
                headers: { 
                    'Content-Type': 'application/json',
                    'Location': `/api/groups/${result.id}`
                }
            }
        );

    } catch (error) {
        // === Error Handling ===
        
        // Zod validation errors
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: error.errors.map(e => ({
                            field: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Unexpected errors
        console.error('[POST /api/groups] Unexpected error:', error);
        return new Response(
            JSON.stringify({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'An unexpected error occurred',
                },
            }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
```

### Krok 5: Testowanie manualne

5.1. **Test 1: Sukces - utworzenie grupy**
```bash
curl -X POST http://localhost:4321/api/groups \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Przedszkole Słoneczko - Motylki"}'
```

Oczekiwany wynik: Status 201, zwrot danych grupy z `role: "admin"`

5.2. **Test 2: Błąd walidacji - nazwa za krótka**
```bash
curl -X POST http://localhost:4321/api/groups \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"AB"}'
```

Oczekiwany wynik: Status 400, błąd walidacji

5.3. **Test 3: Błąd walidacji - brak nazwy**
```bash
curl -X POST http://localhost:4321/api/groups \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Oczekiwany wynik: Status 400, błąd walidacji (required field)

5.4. **Test 4: Błąd autentykacji - brak tokena**
```bash
curl -X POST http://localhost:4321/api/groups \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group"}'
```

Oczekiwany wynik: Status 401, błąd autentykacji

5.5. **Test 5: Weryfikacja w bazie danych**
```sql
-- Sprawdź czy grupa została utworzona
SELECT * FROM groups WHERE name = 'Przedszkole Słoneczko - Motylki';

-- Sprawdź czy członkostwo zostało utworzone
SELECT * FROM group_members 
WHERE group_id = '<group_id_from_previous_query>' 
AND role = 'admin';
```

### Krok 6: Weryfikacja i finalizacja

6.1. **Code review checklist:**
- [ ] Czy wszystkie błędy są obsługiwane zgodnie z planem?
- [ ] Czy walidacja Zod jest poprawnie zaimplementowana?
- [ ] Czy autentykacja jest sprawdzana na początku funkcji?
- [ ] Czy używamy `context.locals.supabase` zamiast globalnego klienta?
- [ ] Czy transakcja jest odpowiednio obsługiwana (rollback w przypadku błędu)?
- [ ] Czy odpowiedzi zawierają poprawne kody statusu?
- [ ] Czy nagłówki `Content-Type` są ustawione?
- [ ] Czy błędy są logowane z odpowiednim kontekstem?

6.2. **Linter check:**
```bash
npm run lint
```

6.3. **TypeScript type check:**
```bash
npm run type-check
```

6.4. **Build test:**
```bash
npm run build
```

### Krok 7: Dokumentacja i commit

7.1. Sprawdzić czy dokumentacja API (`.ai/api-plan.md`) jest aktualna

7.2. Dodać komentarze JSDoc do funkcji serwisu:
```typescript
/**
 * Creates a new group and assigns the creator as admin.
 * 
 * @param userId - The ID of the user creating the group
 * @param command - The group creation command containing the group name
 * @returns The created group data including ID, name, role, and creation timestamp
 * @throws Error if group creation fails or member assignment fails
 */
async createGroup(userId: string, command: CreateGroupCommand): Promise<CreateGroupResponseDTO>
```

7.3. Commit zmian z odpowiednim komunikatem:
```bash
git add src/pages/api/groups/index.ts src/lib/services/groups.service.ts
git commit -m "feat: implement POST /api/groups endpoint

- Add groups service with createGroup method
- Implement transactional group creation with automatic admin assignment
- Add Zod validation for group name (3-100 chars)
- Add authentication guard and error handling
- Return 201 Created with group data on success"
```

---

## 10. Considerations for Future Improvements

1. **Rate Limiting:**
   - Implementacja middleware do limitowania requestów (np. 10 grup/godzinę/użytkownik)

2. **Group Name Uniqueness:**
   - Rozważyć czy nazwy grup powinny być unikalne per użytkownik
   - Obecnie nazwy mogą się powtarzać (może być OK dla różnych przedszkoli)

3. **Soft Delete:**
   - Zamiast hard delete, dodać pole `deleted_at` dla grup
   - Umożliwi to przywracanie przypadkowo usuniętych grup

4. **Audit Log:**
   - Logowanie wszystkich operacji CRUD na grupach do osobnej tabeli
   - Przydatne dla debugowania i compliance

5. **Group Templates:**
   - Możliwość tworzenia grupy z szablonu (predefiniowane ustawienia)

6. **Webhooks:**
   - Powiadomienia o utworzeniu nowej grupy (np. do Slack, email admin)

7. **Analytics:**
   - Tracking liczby tworzonych grup per dzień/tydzień
   - Metryki do dashboard administracyjnego

