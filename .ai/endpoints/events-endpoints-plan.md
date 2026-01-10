# API Endpoint Implementation Plan: Events

## 1. Przegląd punktu końcowego

Kompleks 5 endpointów REST API do zarządzania wydarzeniami (urodzinami, zbiorkami) w ramach grupy przedszkolnej/szkolnej. Endpoints obsługują pełny cykl życia wydarzenia: listowanie, tworzenie, pobieranie szczegółów, aktualizację i usunięcie.

**Kluczowe cechy:**

- Izolacja dostępu: tylko członkowie grupy mogą widać i zarządzać jej wydarzeniami
- Kontrola autoryzacji: tylko organizator może edytować/usuwać swoje wydarzenie
- Flaga `hasNewUpdates`: pojawia się, jeśli ostatnia aktualizacja była w ciągu ostatnich 8 godzin
- Gościnne dzieci: wsparcie dla zapraszania dzieci z grupy na wydarzenia
- Ochrona "niespodzianki": komentarze do wydarzenia są ukryte przed organizatorem (osobny endpoint)

---

## 2. Szczegóły żądania

### 2.1 GET /api/groups/:groupId/events

**Metoda HTTP:** GET

**Struktura URL:** `/api/groups/{groupId}/events`

**Parametry Path:**

- `groupId` (UUID) - Identyfikator grupy

**Parametry Query (Obligatoryjny typ: `EventsQueryParams`):**
| Parametr | Typ | Wymagany | Opis | Domyślna wartość |
|----------|-----|----------|------|------------------|
| `limit` | integer | Nie | Max liczba wyników (1-100) | 20 |
| `offset` | integer | Nie | Liczba wyników do pominięcia | 0 |
| `upcoming` | boolean | Nie | Filtruj tylko nadchodzące wydarzenia | false (wszystkie) |
| `sortBy` | string (enum) | Nie | Pole sortowania: `eventDate`, `createdAt` | `eventDate` |
| `sortOrder` | string (enum) | Nie | Kierunek sortowania: `asc`, `desc` | `asc` |

**Autentykacja:** Wymagane (Bearer token w Authorization header)

---

### 2.2 POST /api/groups/:groupId/events

**Metoda HTTP:** POST

**Struktura URL:** `/api/groups/{groupId}/events`

**Parametry Path:**

- `groupId` (UUID) - Identyfikator grupy

**Request Body (Obligatoryjny typ: `CreateEventCommand`):**

```json
{
    "title": "Urodziny Stasia",
    "eventDate": "2025-05-15",
    "description": "Zapraszamy na urodziny w sali zabaw!",
    "childId": "uuid (optional)",
    "guestChildIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Walidacja Request Body:**
| Pole | Typ | Wymagane | Walidacja |
|------|-----|----------|-----------|
| `title` | string | Tak | 1-100 znaków, non-empty |
| `eventDate` | string (date) | Tak | Format YYYY-MM-DD, data >= dzisiaj |
| `description` | string | Nie | max 5000 znaków |
| `childId` | UUID | Nie | Musi być dzieckiem w grupie |
| `guestChildIds` | UUID[] | Nie | Maks 50 dzieci, każde musi być w grupie |

**Autentykacja:** Wymagane (Bearer token w Authorization header)

---

### 2.3 GET /api/events/:eventId

**Metoda HTTP:** GET

**Struktura URL:** `/api/events/{eventId}`

**Parametry Path:**

- `eventId` (UUID) - Identyfikator wydarzenia

**Parametry Query:** Brak

**Autentykacja:** Wymagane (Bearer token w Authorization header)

---

### 2.4 PATCH /api/events/:eventId

**Metoda HTTP:** PATCH

**Struktura URL:** `/api/events/{eventId}`

**Parametry Path:**

- `eventId` (UUID) - Identyfikator wydarzenia

**Request Body (Obligatoryjny typ: `UpdateEventCommand`):**

```json
{
    "title": "Urodziny Stasia - nowy termin!",
    "eventDate": "2025-05-20",
    "description": "Zmiana terminu!",
    "guestChildIds": ["uuid1", "uuid2"]
}
```

**Walidacja Request Body:**
| Pole | Typ | Wymagane | Walidacja |
|------|-----|----------|-----------|
| `title` | string | Nie | 1-100 znaków, non-empty (jeśli podane) |
| `eventDate` | string (date) | Nie | Format YYYY-MM-DD (jeśli podane) |
| `description` | string | Nie | max 5000 znaków |
| `guestChildIds` | UUID[] | Nie | Maks 50 dzieci, każde musi być w grupie |
| **Przynajmniej jedno pole** | - | **Tak** | Żądanie musi zawierać min. 1 pole do aktualizacji |

**Autentykacja:** Wymagane + Weryfikacja: Żądający musi być organizatorem

---

### 2.5 DELETE /api/events/:eventId

**Metoda HTTP:** DELETE

**Struktura URL:** `/api/events/{eventId}`

**Parametry Path:**

- `eventId` (UUID) - Identyfikator wydarzenia

**Request Body:** Brak

**Autentykacja:** Wymagane + Weryfikacja: Żądający musi być organizatorem

## 3. Wykorzystywane typy (DTOs & Commands)

**UWAGA OBLIGATORYJNA:** Wszystkie interakcje z API muszą wykorzystywać typy zdefiniowane w `src/types.ts`. Zapewnia to spójność walidacji (Zod) oraz bezpieczeństwo typów w całym cyklu życia danych.

| Zasób / Operacja            | Typ Command / Query  | Typ Response DTO                         |
| :-------------------------- | :------------------- | :--------------------------------------- |
| **Lista wydarzeń**          | `EventsQueryParams`  | `PaginatedResponse<EventListItemDTO>`    |
| **Tworzenie wydarzenia**    | `CreateEventCommand` | `SingleResponse<CreateEventResponseDTO>` |
| **Szczegóły wydarzenia**    | -                    | `SingleResponse<EventDetailDTO>`         |
| **Aktualizacja wydarzenia** | `UpdateEventCommand` | `SingleResponse<UpdateEventResponseDTO>` |
| **Gość wydarzenia**         | -                    | `EventGuestDTO` (zagnieżdżony)           |

---

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/groups/:groupId/events - Response 200 OK

**Obligatoryjny typ odpowiedzi:** `PaginatedResponse<EventListItemDTO>`

**Content-Type:** application/json

```json
{
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Urodziny Stasia",
            "eventDate": "2025-05-15",
            "description": "Zapraszamy na urodziny w sali zabaw!",
            "childId": "550e8400-e29b-41d4-a716-446655440001",
            "childName": "Staś",
            "organizerId": "550e8400-e29b-41d4-a716-446655440002",
            "isOrganizer": false,
            "guestCount": 12,
            "hasNewUpdates": true,
            "createdAt": "2025-01-15T10:30:00Z",
            "updatedAt": "2025-01-15T10:30:00Z"
        },
        {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "title": "Zbiórka do szkoły",
            "eventDate": "2025-06-01",
            "description": null,
            "childId": null,
            "childName": null,
            "organizerId": "550e8400-e29b-41d4-a716-446655440002",
            "isOrganizer": true,
            "guestCount": 8,
            "hasNewUpdates": false,
            "createdAt": "2025-01-10T14:20:00Z",
            "updatedAt": "2025-01-10T14:20:00Z"
        }
    ],
    "pagination": {
        "total": 2,
        "limit": 20,
        "offset": 0
    }
}
```

**Opis pól:**

- `isOrganizer`: true jeśli żądający jest organizatorem
- `guestCount`: Liczba zaproszonych dzieci (bez duplikatów)
- `hasNewUpdates`: true jeśli `updatedAt` jest w ciągu ostatnich 8 godzin
- `childName`: null jeśli `childId` nie istnieje

---

### 4.2 POST /api/groups/:groupId/events - Response 201 Created

**Obligatoryjny typ odpowiedzi:** `SingleResponse<CreateEventResponseDTO>`

**Content-Type:** application/json

```json
{
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Urodziny Stasia",
        "eventDate": "2025-05-15",
        "description": "Zapraszamy na urodziny w sali zabaw!",
        "childId": "550e8400-e29b-41d4-a716-446655440001",
        "organizerId": "550e8400-e29b-41d4-a716-446655440002",
        "guestCount": 3,
        "createdAt": "2025-01-15T10:30:00Z"
    }
}
```

**Headers dodatkowe:**

- `Location: /api/events/{eventId}` - Lokalizacja nowo utworzonego zasobu

---

### 4.3 GET /api/events/:eventId - Response 200 OK

**Obligatoryjny typ odpowiedzi:** `SingleResponse<EventDetailDTO>`

**Content-Type:** application/json

```json
{
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Urodziny Stasia",
        "eventDate": "2025-05-15",
        "description": "Zapraszamy na urodziny w sali zabaw!",
        "childId": "550e8400-e29b-41d4-a716-446655440001",
        "childName": "Staś",
        "childBio": "Loves dinosaurs and building things",
        "organizerId": "550e8400-e29b-41d4-a716-446655440002",
        "isOrganizer": false,
        "groupId": "550e8400-e29b-41d4-a716-446655440003",
        "guests": [
            {
                "childId": "550e8400-e29b-41d4-a716-446655440004",
                "displayName": "Ania"
            },
            {
                "childId": "550e8400-e29b-41d4-a716-446655440005",
                "displayName": "Tomek"
            }
        ],
        "hasNewUpdates": true,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z"
    }
}
```

**Opis pól:**

- `childBio`: Biografia dziecka solenizanta (inspiration dla gości przy pomysłach na prezenty)
- `guests`: Lista zaproszonych dzieci z ich pseudonimami (typ elementu: `EventGuestDTO`)
- `isOrganizer`: true jeśli żądający jest organizatorem

---

### 4.4 PATCH /api/events/:eventId - Response 200 OK

**Obligatoryjny typ odpowiedzi:** `SingleResponse<UpdateEventResponseDTO>`

**Content-Type:** application/json

```json
{
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Urodziny Stasia - nowy termin!",
        "eventDate": "2025-05-20",
        "updatedAt": "2025-01-15T11:00:00Z"
    }
}
```

---

### 4.5 DELETE /api/events/:eventId - Response 204 No Content

Brak body. Tylko HTTP status 204 potwierdza sukces.

---

### 3.6 Error Responses (All Endpoints)

**400 Bad Request - Validation Error:**

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [
            {
                "field": "title",
                "message": "String must contain at least 1 character"
            },
            {
                "field": "eventDate",
                "message": "Invalid date format, expected YYYY-MM-DD"
            }
        ]
    }
}
```

**401 Unauthorized:**

```json
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
    }
}
```

**403 Forbidden:**

```json
{
    "error": {
        "code": "FORBIDDEN",
        "message": "Not a member of this group" // lub "Not the organizer of this event"
    }
}
```

**404 Not Found:**

```json
{
    "error": {
        "code": "NOT_FOUND",
        "message": "Group does not exist" // lub "Event does not exist"
    }
}
```

**409 Conflict (jeśli guest child nie istnieje w grupie):**

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [
            {
                "field": "guestChildIds",
                "message": "One or more children are not in this group"
            }
        ]
    }
}
```

---

## 4. Przepływ danych

### 4.1 Architektura warstwowa

```
API Endpoint (Astro Route)
    ↓ [Żądanie]
    ├─ Autentykacja (Bearer token)
    ├─ Walidacja parametrów (Zod)
    ├─ Weryfikacja autoryzacji (membership/ownership)
    ↓
EventsService (Business Logic)
    ├─ Transformacja DTO ← → Entity
    ├─ Walidacja reguł biznesowych
    ├─ Query builders
    ↓
Supabase Client
    ├─ RLS Policies (database level)
    ├─ Joins, aggregations
    ├─ Transakcje
    ↓
PostgreSQL Database (with RLS enabled)
    ↓ [Wynik]
EventsService (Mapowanie wyników)
    ↓ [Transformacja]
API Endpoint (Serializacja JSON)
    ↓
HTTP Response (200/201/204/4xx/5xx)
```

### 4.2 Przepływ dla GET /api/groups/:groupId/events (List)

```
1. Autentykacja → Pobranie user.id z tokenu
2. Walidacja :groupId (UUID format)
3. Walidacja query parameters (limit, offset, upcoming, sortBy, sortOrder)
4. EventsService.listEvents(groupId, userId, params):
   a. Weryfikacja: czy user jest członkiem grupy (SELECT from group_members WHERE group_id = ? AND user_id = ?)
   b. Pobierz listę events z paginacją
      - SELECT events.* FROM events
        JOIN children ON events.child_id = children.id (LEFT JOIN dla null)
        LEFT JOIN event_guests ON events.id = event_guests.event_id
      - WHERE events.group_id = ? [AND events.event_date >= TODAY jeśli upcoming=true]
      - ORDER BY {sortBy} {sortOrder}
      - LIMIT ? OFFSET ?
   c. Dla każdego event:
      - Załaduj child display_name (jeśli childId istnieje)
      - Policzyć guestów (SELECT count distinct child_id FROM event_guests WHERE event_id = ?)
      - Oblicz isOrganizer (organizerId === userId)
      - Oblicz hasNewUpdates (updatedAt >= NOW() - interval '8 hours')
   d. Map na EventListItemDTO
5. Zwróć PaginatedResponse<EventListItemDTO>
6. Serializuj do JSON i zwróć 200 OK
```

### 4.3 Przepływ dla POST /api/groups/:groupId/events (Create)

```
1. Autentykacja → Pobranie user.id z tokenu
2. Parse request body (JSON)
3. Walidacja :groupId (UUID format)
4. Walidacja request body (Zod: CreateEventCommandSchema)
   - title: 1-100 znaków
   - eventDate: YYYY-MM-DD format
   - description: optional
   - childId: optional UUID
   - guestChildIds: optional UUID[]
5. EventsService.createEvent(groupId, userId, command):
   a. Weryfikacja: czy user jest członkiem grupy
   b. Weryfikacja: jeśli childId podane, czy dziecko istnieje w grupie
   c. Weryfikacja: wszystkie guestChildIds istnieją w grupie
   d. Rozpocznij transakcję:
      - INSERT INTO events (group_id, organizer_id, title, event_date, description, child_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      - Dla każdego guestChildId:
        - INSERT INTO event_guests (event_id, child_id) VALUES (?, ?)
   e. Załaduj szczegóły (child name, guest count)
   f. Map na CreateEventResponseDTO
6. Zwróć SingleResponse<CreateEventResponseDTO> z 201 Created
   + Header Location: /api/events/{eventId}
```

### 4.4 Przepływ dla GET /api/events/:eventId (Detail)

```
1. Autentykacja → Pobranie user.id z tokenu
2. Walidacja :eventId (UUID format)
3. EventsService.getEventDetail(eventId, userId):
   a. SELECT events.* FROM events WHERE events.id = ?
      (RLS automatycznie sprawdza dostęp - user musi być w group_members)
   b. Pobranie danych dziecka:
      - SELECT children.display_name, children.bio FROM children WHERE id = events.child_id
   c. Pobranie listy gości:
      - SELECT eg.child_id, c.display_name FROM event_guests eg
        JOIN children c ON eg.child_id = c.id
        WHERE eg.event_id = ?
   d. Obliczenie:
      - isOrganizer (organizerId === userId)
      - hasNewUpdates (updatedAt >= NOW() - interval '8 hours')
   e. Map na EventDetailDTO
4. Zwróć SingleResponse<EventDetailDTO> z 200 OK
5. Jeśli event nie znaleziony lub user bez dostępu → 404 NOT_FOUND
```

### 4.5 Przepływ dla PATCH /api/events/:eventId (Update)

```
1. Autentykacja → Pobranie user.id z tokenu
2. Parse request body (JSON)
3. Walidacja :eventId (UUID format)
4. Walidacja request body (Zod: UpdateEventCommandSchema)
   - Wszystkie pola optional, ale przynajmniej jedno musi być
   - title: 1-100 znaków (jeśli podane)
   - eventDate: YYYY-MM-DD (jeśli podane)
   - description: optional
   - guestChildIds: optional UUID[] (jeśli podane, zamienia całą listę gości)
5. EventsService.updateEvent(eventId, userId, command):
   a. SELECT events.* FROM events WHERE id = ?
      (RLS automatycznie blokuje jeśli user bez dostępu)
   b. Weryfikacja: events.organizer_id === userId (inaczej 403 Forbidden)
   c. Weryfikacja: jeśli guestChildIds podane, czy wszystkie istnieją w grupie
   d. Rozpocznij transakcję:
      - Zbuduj UPDATE statement z podanymi polami:
        UPDATE events SET
        [title = ? IF title in command]
        [event_date = ? IF eventDate in command]
        [description = ? IF description in command]
        [updated_at = NOW()]
        WHERE id = ?
      - Jeśli guestChildIds podane:
        - DELETE FROM event_guests WHERE event_id = ?
        - INSERT INTO event_guests (event_id, child_id) FOR each guestChildId
   e. Pobierz zaktualizowane dane
   f. Map na UpdateEventResponseDTO
6. Zwróć SingleResponse<UpdateEventResponseDTO> z 200 OK
```

### 4.6 Przepływ dla DELETE /api/events/:eventId (Delete)

```
1. Autentykacja → Pobranie user.id z tokenu
2. Walidacja :eventId (UUID format)
3. EventsService.deleteEvent(eventId, userId):
   a. SELECT events.* FROM events WHERE id = ?
      (RLS automatycznie blokuje jeśli user bez dostępu)
   b. Weryfikacja: events.organizer_id === userId (inaczej 403 Forbidden)
   c. Transakcja:
      - DELETE FROM event_guests WHERE event_id = ? (cascade automatycznie)
      - DELETE FROM events WHERE id = ?
      (lub jeden DELETE jeśli RLS skonfigurowany prawidłowo)
4. Zwróć 204 No Content (brak body)
```

### 4.7 Interakcje z Supabase RLS

**RLS Policy na tabeli `events`:**

```sql
-- SELECT: User musi być członkiem grupy
SELECT: auth.uid() IN (
    SELECT user_id FROM group_members
    WHERE group_id = events.group_id
)

-- INSERT/UPDATE/DELETE: User musi być członkiem grupy
-- Dodatkowe sprawdzenie for INSERT/UPDATE: user = organizer
-- Dodatkowe sprawdzenie for DELETE: user = organizer
```

**RLS Policy na tabeli `event_guests`:**

```sql
-- SELECT/INSERT: User musi być członkiem grupy
-- DELETE: User musi być organizatorem lub członkiem grupy
```

---

## 5. Względy bezpieczeństwa

### 5.1 Autentykacja

- **Wymagana dla wszystkich endpointów** (Bearer token w Authorization header)
- Token JWT zweryfikowany przez Supabase Auth
- `locals.supabase.auth.getUser()` zwraca authenticated user lub error
- Brak tokenu → 401 Unauthorized

**Implementacja:**

```typescript
const {
    data: { user },
    error: authError,
} = await locals.supabase.auth.getUser();
if (authError || !user) {
    return new Response(
        JSON.stringify({
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }),
        { status: 401 }
    );
}
```

### 5.2 Autoryzacja (Access Control)

**Poziom 1: Group Membership (All endpoints)**

- Użytkownik musi być członkiem grupy, aby:
    - Widzieć jej wydarzenia (GET list)
    - Tworzyć nowe wydarzenia (POST)
    - Widzieć szczegóły dowolnego wydarzenia w grupie (GET detail)

**Weryfikacja:**

```sql
SELECT COUNT(*) FROM group_members
WHERE user_id = ? AND group_id = ?
```

**Poziom 2: Event Ownership (PATCH/DELETE)**

- Użytkownik musi być organizatorem, aby:
    - Edytować (PATCH) swoje wydarzenia
    - Usuwać (DELETE) swoje wydarzenia

**Weryfikacja:**

```sql
SELECT * FROM events WHERE id = ? AND organizer_id = ?
```

### 5.3 Data Validation

**Zod Schema Validation:**

- Wszystkie typy żądań walidowane przez Zod schemas w `src/lib/schemas.ts`
- Walidacja happens na poziomie API endpoint, przed logką biznesową
- ZodError mapowany na 400 Bad Request z szczegółowymi informacjami o błędach

**Walidacja biznesowa:**

- eventDate nie może być w przeszłości (dla nowych events)
- childId i guestChildIds muszą być rzeczywistymi dziećmi w grupie
- title, eventDate są wymagane dla POST (ale opcjonalne dla PATCH jeśli inne pola podane)

### 5.4 SQL Injection Protection

- Supabase query builder (`from()`, `select()`, `where()` etc.) automatycznie escapuje parametry
- Parametry nie są konkatenowane do strings
- Zod validation dodatkowo zabezpiecza przed unexpected data types

### 5.5 Row Level Security (RLS)

- Wszystkie tabele mają włączone RLS na poziomie bazy
- Supabase automatycznie filtruje wyniki zapytań na podstawie RLS policies
- User może pobrać tylko dane, do których ma dostęp
- Service layer dodatkowo weryfikuje dostęp dla extra safety

### 5.6 DoS Protection

- `limit` parametr zmuszony do max 100 (zapobiega huge queries)
- Brak endpoint rate limitingu na aplikacji (powinna być na reverze proxy/CDN)
- Transakcje dla bulk operations (event creation with guests)

### 5.7 Information Disclosure

- Organizator NOT widzi komentarze do swojego wydarzenia (hasNewUpdates flag still applies)
- Details jak `childBio` widoczne tylko dla gości (dla gift inspiration)
- Email administratora nie ujawniany w list responses (separate secure endpoint)
- Błędy nie ujawniają wewnętrznych detali bazy (generic error messages dla end users)

### 5.8 Guest Child Validation

**Krytical:** Dziecko w `guestChildIds` musi:

1. Istnieć w bazie
2. Należeć do TEJ SAMEJ grupy co wydarzenie
3. Nie być tym samym dzieckiem (childId) na liście gości

**Implementacja (service layer):**

```typescript
// Verify all guest children exist and belong to the group
const { data: guestChildren, error } = await supabase
    .from('children')
    .select('id')
    .in('id', guestChildIds)
    .eq('group_id', groupId);

if (guestChildren.length !== guestChildIds.length) {
    throw new Error('One or more children are not in this group');
}
```

---

## 6. Obsługa błędów

### 6.1 Error Categories and Status Codes

| Kategoria        | HTTP Status | Error Code          | Przyczyna               | Objawy                                                 |
| ---------------- | ----------- | ------------------- | ----------------------- | ------------------------------------------------------ |
| **Autentykacja** | 401         | UNAUTHORIZED        | Brak/Invalid token      | `auth.getUser()` zwraca error                          |
| **Autoryzacja**  | 403         | FORBIDDEN           | User nie ma permissions | `group_members` check fails OR `organizer_id` mismatch |
| **Walidacja**    | 400         | VALIDATION_ERROR    | Invalid request data    | Zod parse error OR business logic validation           |
| **Not Found**    | 404         | NOT_FOUND           | Resource doesn't exist  | `data === null` from query                             |
| **Konflikt**     | 409         | CONFLICT            | Resource conflict       | Duplicate entry / constraint violation                 |
| **Rate Limited** | 429         | RATE_LIMITED        | Too many requests       | Rate limiter triggered                                 |
| **Server Error** | 500         | SERVICE_UNAVAILABLE | Unexpected error        | Uncaught exception                                     |

### 6.2 Endpoint-Specific Error Scenarios

#### GET /api/groups/:groupId/events

| Scenario               | Status | Code                | Message                               |
| ---------------------- | ------ | ------------------- | ------------------------------------- |
| Missing/invalid token  | 401    | UNAUTHORIZED        | Authentication required               |
| Invalid groupId format | 400    | VALIDATION_ERROR    | Invalid UUID format                   |
| User not in group      | 403    | FORBIDDEN           | Not a member of this group            |
| Group doesn't exist    | 404    | NOT_FOUND           | Group does not exist                  |
| Invalid query params   | 400    | VALIDATION_ERROR    | Validation failed (limit > 100, etc.) |
| DB error               | 500    | SERVICE_UNAVAILABLE | An unexpected error occurred          |

#### POST /api/groups/:groupId/events

| Scenario               | Status | Code                | Message                                             |
| ---------------------- | ------ | ------------------- | --------------------------------------------------- |
| Missing/invalid token  | 401    | UNAUTHORIZED        | Authentication required                             |
| Invalid groupId format | 400    | VALIDATION_ERROR    | Invalid UUID format                                 |
| User not in group      | 403    | FORBIDDEN           | Not a member of this group                          |
| Group doesn't exist    | 404    | NOT_FOUND           | Group does not exist                                |
| Invalid JSON body      | 400    | VALIDATION_ERROR    | Invalid JSON in request body                        |
| Missing required field | 400    | VALIDATION_ERROR    | Validation failed (title/eventDate required)        |
| Invalid field values   | 400    | VALIDATION_ERROR    | Validation failed (title must be 1-100 chars, etc.) |
| childId not in group   | 400    | VALIDATION_ERROR    | Child not in this group OR Child does not exist     |
| guestChildIds invalid  | 400    | VALIDATION_ERROR    | One or more children not in this group              |
| eventDate in past      | 400    | VALIDATION_ERROR    | Event date cannot be in the past                    |
| DB error               | 500    | SERVICE_UNAVAILABLE | An unexpected error occurred                        |

#### GET /api/events/:eventId

| Scenario               | Status | Code                | Message                                   |
| ---------------------- | ------ | ------------------- | ----------------------------------------- |
| Missing/invalid token  | 401    | UNAUTHORIZED        | Authentication required                   |
| Invalid eventId format | 400    | VALIDATION_ERROR    | Invalid UUID format                       |
| Event doesn't exist    | 404    | NOT_FOUND           | Event does not exist                      |
| User not in group      | 403    | FORBIDDEN           | Not a member of this group (RLS enforced) |
| DB error               | 500    | SERVICE_UNAVAILABLE | An unexpected error occurred              |

#### PATCH /api/events/:eventId

| Scenario               | Status | Code                | Message                                |
| ---------------------- | ------ | ------------------- | -------------------------------------- |
| Missing/invalid token  | 401    | UNAUTHORIZED        | Authentication required                |
| Invalid eventId format | 400    | VALIDATION_ERROR    | Invalid UUID format                    |
| Event doesn't exist    | 404    | NOT_FOUND           | Event does not exist                   |
| User not organizer     | 403    | FORBIDDEN           | Not the organizer of this event        |
| User not in group      | 403    | FORBIDDEN           | Not a member of this group             |
| No fields to update    | 400    | VALIDATION_ERROR    | At least one field must be provided    |
| Invalid field values   | 400    | VALIDATION_ERROR    | Validation failed                      |
| guestChildIds invalid  | 400    | VALIDATION_ERROR    | One or more children not in this group |
| eventDate in past      | 400    | VALIDATION_ERROR    | Event date cannot be in the past       |
| DB error               | 500    | SERVICE_UNAVAILABLE | An unexpected error occurred           |

#### DELETE /api/events/:eventId

| Scenario               | Status | Code                | Message                         |
| ---------------------- | ------ | ------------------- | ------------------------------- |
| Missing/invalid token  | 401    | UNAUTHORIZED        | Authentication required         |
| Invalid eventId format | 400    | VALIDATION_ERROR    | Invalid UUID format             |
| Event doesn't exist    | 404    | NOT_FOUND           | Event does not exist            |
| User not organizer     | 403    | FORBIDDEN           | Not the organizer of this event |
| User not in group      | 403    | FORBIDDEN           | Not a member of this group      |
| DB error               | 500    | SERVICE_UNAVAILABLE | An unexpected error occurred    |

### 6.3 Error Handling Implementation Pattern

**Standard error handling structure (każdy endpoint):**

```typescript
try {
    // GUARD: Authentication
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
        return new Response(
            JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // GUARD: Path parameter validation (UUID format)
    // GUARD: Query/Body validation (Zod schema)
    // GUARD: Authorization (membership/ownership checks)

    // Business Logic
    const service = createEventsService(locals.supabase);
    const result = await service.methodName(...);

    // Happy Path: Success
    return new Response(JSON.stringify({ data: result }), { status: 200 });

} catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                }
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Custom business logic errors (thrown by service)
    if (error instanceof NotFoundError) {
        return new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message: error.message } }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
    }
    if (error instanceof ForbiddenError) {
        return new Response(
            JSON.stringify({ error: { code: 'FORBIDDEN', message: error.message } }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Unexpected errors
    console.error('[ENDPOINT] Unexpected error:', error);
    return new Response(
        JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'An unexpected error occurred' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
}
```

### 6.4 Logging Strategy

**Current approach (nie rejestrować do tabeli):**

- Błędy logowane w `console.error()` (dostępne w server logs)
- Monitoring/APM (Sentry, CloudWatch itp.) zbiera stack traces
- Użytkownikowi pokazywane tylko generic messages (nie ujawniać detali)

**Future considerations:**

- Dodać dedicated error logging service jeśli będzie potrzebne
- Structured logging (JSON format) dla łatwej parsowania
- Separate logs dla security events (unauthorized access attempts)

---

## 7. Rozważania dotyczące wydajności

### 7.1 Potencjalne wąskie gardła

#### Problem: N+1 Query Pattern

**Opis:** Dla każdego wydarzenia na liście, oddzielne zapytanie o dziecko/gośćmi

**Rozwiązanie:**

- Użyć `joins` w Supabase query builder
- Aggregacje (COUNT) na bazie w jednym query
- Eagerly load dane zamiast lazy loading

**Implementacja:**

```typescript
// Instead of:
const events = await supabase.from('events').select('*').eq('group_id', groupId);
events.forEach(event => {
    const child = await supabase.from('children')...  // N queries!
});

// Do:
const events = await supabase
    .from('events')
    .select(`
        *,
        child:children(display_name),
        guests:event_guests(count)
    `)
    .eq('group_id', groupId);
```

#### Problem: Nieefektywne sortowanie/filtrowanie

**Opis:** Pobierz wszystko w pamięć, potem sortuj (zamiast sortować na bazie)

**Rozwiązanie:**

- Deleguj sortowanie do bazy danych (ORDER BY)
- Filtrowanie na bazie (`event_date >= today` zamiast JS filter)

**Implementacja:**

```typescript
const query = supabase.from('events').select('*').eq('group_id', groupId);

if (params.upcoming) {
    query = query.gte('event_date', today);
}

query = query
    .order(params.sortBy, { ascending: params.sortOrder === 'asc' })
    .range(params.offset, params.offset + params.limit - 1);
```

#### Problem: Dużo gości na liście

**Opis:** event_guests tabela ma miliony rekordów, COUNT powolny

**Rozwiązanie:**

- Denormalizować: dodać `guest_count` kolumnę do `events` (zaktualizować on insert/delete)
- Lub: użyć efficient query z COUNT DISTINCT

#### Problem: Wiele aktualizacji gośćmi

**Opis:** DELETE old + INSERT new jest wolne dla 50 gośćmi

**Rozwiązanie:**

- Batch operations (single query zamiast 50)
- Supabase obsługuje bulk delete/insert

### 7.2 Indeksy bazy danych

**Istniejące (z db-plan.md):**

```sql
-- Zapewniające szybkie lookups dla RLS i queries
idx_events_group_id       -- Szybko filtrować po grupie
idx_events_organizer_id   -- Szybko filtrować po organizatorze
idx_events_date           -- Szybko sortować/filtrować po dacie
idx_event_guests_event_id -- Szybko znaleźć gośćmi dla zdarzenia
```

**Upewnij się, że indexes istnieją w migrations!**

### 7.3 Caching Strategy

**Backend cache:**

- Nie cachować na aplikacji (zbyt skomplikowane ze writes)
- Supabase cache (built-in) dla SELECT queries

**Frontend cache:**

- React Query (TanStack Query) handle caching automatycznie
- Invalidate on mutation (POST/PATCH/DELETE)
- Stale-while-revalidate strategy

### 7.4 Query Optimization Checklist

- ✓ Użyj joins zamiast N+1 queries
- ✓ Agregacje na bazie (COUNT, MIN, MAX)
- ✓ Deleguj sortowanie/filtrowanie do bazy
- ✓ Limit resultsets (pagination)
- ✓ Select tylko potrzebne kolumny
- ✓ Indeksy na WHERE i JOIN clauses
- ✓ Denormalizacja jeśli justified

---

## 8. Etapy wdrożenia

### Phase 1: Setup & Service Layer

**Krok 1.1: Definicje typów i schemy (ALREADY DONE - weryfikacja)**

- ✓ EventListItemDTO, CreateEventCommand, EventDetailDTO, UpdateEventCommand itd. już w `src/lib/schemas.ts`
- ✓ Zod schemas już zdefiniowane
- Task: Weryfikuj, że wszystkie schemat pokrywają specyfikację API

**Krok 1.2: Stwórz EventsService**

- Utwórz `src/lib/services/events.service.ts`
- Zaimplementuj klaszę `EventsService` z metodami:
    - `listEvents(groupId, userId, params): Promise<PaginatedResponse<EventListItemDTO>>`
    - `createEvent(groupId, userId, command): Promise<CreateEventResponseDTO>`
    - `getEventDetail(eventId, userId): Promise<EventDetailDTO>`
    - `updateEvent(eventId, userId, command): Promise<UpdateEventResponseDTO>`
    - `deleteEvent(eventId, userId): Promise<void>`
- Implement helper methods:
    - `isUserGroupMember(groupId, userId): Promise<boolean>`
    - `isUserEventOrganizer(eventId, userId): Promise<boolean>`
    - `validateGuestChildren(groupId, guestChildIds): Promise<void>`
    - `calculateHasNewUpdates(updatedAt): boolean`
    - `transformEventToDTO(entity, userId): EventListItemDTO`
- Add proper error handling (custom error types: NotFoundError, ForbiddenError, ValidationError)
- Follow patterns from `groups.service.ts`

**Krok 1.3: Stwórz factory function dla EventsService**

- W `events.service.ts`, dodaj export:
    ```typescript
    export function createEventsService(supabase: TypedSupabaseClient): EventsService {
        return new EventsService(supabase);
    }
    ```
- This pattern matches groups.service.ts for consistency

---

### Phase 2: API Endpoints (List & Create)

**Krok 2.1: GET /api/groups/:groupId/events endpoint**

- Utwórz `src/pages/api/groups/[groupId]/events.ts`
- Implements GET handler:
    1. Extract & validate user from token
    2. Parse query parameters (limit, offset, upcoming, sortBy, sortOrder)
    3. Validate groupId format (UUID)
    4. Call `eventsService.listEvents(groupId, userId, params)`
    5. Return 200 with `PaginatedResponse<EventListItemDTO>`
- Proper error handling for all error scenarios (401, 403, 404, 400)
- Follow pattern from `src/pages/api/groups/index.ts`

**Krok 2.2: POST /api/groups/:groupId/events endpoint**

- Dodaj POST handler do tego samego pliku (`src/pages/api/groups/[groupId]/events.ts`)
- Implements POST handler:
    1. Extract & validate user from token
    2. Parse and validate JSON body (CreateEventCommandSchema)
    3. Validate groupId format (UUID)
    4. Call `eventsService.createEvent(groupId, userId, command)`
    5. Return 201 with Location header + `SingleResponse<CreateEventResponseDTO>`
- Proper error handling for all error scenarios
- Location header: `/api/events/{eventId}`

---

### Phase 3: API Endpoints (Detail, Update, Delete)

**Krok 3.1: GET /api/events/:eventId endpoint**

- Utwórz `src/pages/api/events/[eventId].ts`
- Implements GET handler:
    1. Extract & validate user from token
    2. Validate eventId format (UUID)
    3. Call `eventsService.getEventDetail(eventId, userId)`
    4. Return 200 with `SingleResponse<EventDetailDTO>`
- Proper error handling

**Krok 3.2: PATCH /api/events/:eventId endpoint**

- Dodaj PATCH handler do `src/pages/api/events/[eventId].ts`
- Implements PATCH handler:
    1. Extract & validate user from token
    2. Parse and validate JSON body (UpdateEventCommandSchema)
    3. Validate eventId format (UUID)
    4. Verify at least one field is provided (business logic)
    5. Call `eventsService.updateEvent(eventId, userId, command)`
    6. Return 200 with `SingleResponse<UpdateEventResponseDTO>`
- Proper error handling

**Krok 3.3: DELETE /api/events/:eventId endpoint**

- Dodaj DELETE handler do `src/pages/api/events/[eventId].ts`
- Implements DELETE handler:
    1. Extract & validate user from token
    2. Validate eventId format (UUID)
    3. Call `eventsService.deleteEvent(eventId, userId)`
    4. Return 204 No Content
- Proper error handling

---

### Phase 4: Testing & Validation

**Krok 4.1: Unit tests dla EventsService**

- Test each method with various scenarios:
    - Happy path (valid data, user has access)
    - Auth failures (user not in group, user not organizer)
    - Validation failures (invalid data)
    - Not found scenarios
- Mock Supabase client for unit tests

**Krok 4.2: Integration tests dla API endpoints**

- Test each endpoint with real or semi-real Supabase instance
- Verify response formats (status codes, JSON structure)
- Verify error responses
- Test authorization scenarios

**Krok 4.3: Manual testing**

- Use REST client (Insomnia, Postman, curl) to test all endpoints
- Verify:
    - Happy paths work correctly
    - Error responses have correct format
    - Pagination works
    - Filtering works (upcoming flag, sortBy)
    - Organizer-only operations enforced
    - Group membership enforced

**Krok 4.4: Security review**

- Verify RLS policies are correct
- Verify no data leaks (e.g., seeing events from other groups)
- Verify user can't update/delete other user's events
- Verify input validation catches malicious input

---

### Phase 5: Frontend Integration & Documentation

**Krok 5.1: React Query hooks dla events**

- Utwórz `src/lib/hooks/useEvents.ts`
- Dodaj hooks:
    - `useEvents(groupId)` - GET list
    - `useEventDetail(eventId)` - GET detail
    - `useCreateEvent()` - POST (mutation)
    - `useUpdateEvent()` - PATCH (mutation)
    - `useDeleteEvent()` - DELETE (mutation)
- These hooks should use React Query for caching/syncing

**Krok 5.2: Frontend components (React)**

- Event list components
- Event detail view
- Event creation form
- Event edit form
- Event delete confirmation
- These would use the React Query hooks above

---

### Implementation Dependencies & Order

```
Phase 1 ✓ (No dependencies - starts everything)
  └─ Schemas validation ✓
  └─ EventsService

Phase 2 (Depends on Phase 1)
  └─ GET /api/groups/:groupId/events (List)
  └─ POST /api/groups/:groupId/events (Create)

Phase 3 (Depends on Phase 1 & 2)
  └─ GET /api/events/:eventId (Detail)
  └─ PATCH /api/events/:eventId (Update)
  └─ DELETE /api/events/:eventId (Delete)

Phase 4 (Depends on Phase 2 & 3)
  └─ Testing & Validation

Phase 5 (Depends on Phase 3)
  └─ Frontend Integration
  └─ Documentation
```

---

## 9. Key Implementation Notes

### 9.1 Error Types to Define

```typescript
// src/lib/services/events.service.ts (lub separate file)

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}
```

### 9.2 Database Considerations

**Ensure migrations include:**

```sql
-- Tabela events (jeśli nie istnieje)
CREATE TABLE events (...)

-- Tabela event_guests (jeśli nie istnieje)
CREATE TABLE event_guests (...)

-- Indexes (jeśli nie istnieją)
CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_event_guests_event_id ON event_guests(event_id);
```

### 9.3 TypeScript Strict Mode

- Upewnij się, że all types są prawidłowo zdefiniowane
- Brak `any` types (prefer `unknown` if necessary, then narrow)
- Supabase types importować z `Database` type

### 9.4 Date Handling

- Zawsze używaj ISO 8601 format (YYYY-MM-DD dla dates, ISO 8601 timestamp dla datetimes)
- Supabase zwraca ISO strings - parse/format z `Date` lub `date-fns`
- Event date validation: `eventDate >= today` (no past dates for new events)

### 9.5 Handle Null Values Carefully

```typescript
// childId jest nullable
// childName będzie null jeśli childId is null
// eventDate nigdy nie będzie null
// description może być null

// W transformacjach:
childName: event.child?.display_name ?? null,
```

### 9.6 Transaction Handling

- Supabase obsługuje transactions przez `admin.auth.admin.users.*` (admin functions)
- Dla regular transactions, użyj RLS + constraints na bazie
- W cases gdzie są wiele inserts/updates: consider batching w service layer

### 9.7 Test Data Considerations

- Ensure test fixtures include:
    - Events belonging to different groups (data isolation test)
    - Events created by different users (organizer access test)
    - Events with/without children
    - Events with many guests
    - Past events, future events, today's events

---

## 10. Checklist przed Gotowością do Wdrażania

### Code Quality

- [ ] EventsService implementuje all 5 methods
- [ ] Error handling uses custom error types
- [ ] Helper methods dla authorization checks
- [ ] TypeScript strict mode - no errors
- [ ] Code follows groups.service.ts patterns

### API Endpoints

- [ ] GET /api/groups/:groupId/events implemented
- [ ] POST /api/groups/:groupId/events implemented
- [ ] GET /api/events/:eventId implemented
- [ ] PATCH /api/events/:eventId implemented
- [ ] DELETE /api/events/:eventId implemented
- [ ] All endpoints return correct status codes
- [ ] All endpoints return proper error responses
- [ ] All endpoints verify authentication/authorization

### Validation

- [ ] Request bodies validated with Zod schemas
- [ ] Path parameters validated (UUID format)
- [ ] Query parameters validated
- [ ] All validation errors return 400 with details
- [ ] Business logic validation (childId/guestChildIds in group, etc.)

### Security

- [ ] RLS policies configured correctly on database
- [ ] Authorization checks in service methods
- [ ] No data leaks (user only sees own group data)
- [ ] Input sanitization
- [ ] SQL injection prevention (Supabase handles it)

### Database

- [ ] All required tables exist (events, event_guests)
- [ ] All indexes created for performance
- [ ] RLS policies enabled on all relevant tables
- [ ] Constraints configured (FK, NOT NULL, etc.)

### Testing

- [ ] Unit tests for EventsService methods
- [ ] Integration tests for API endpoints
- [ ] Manual testing with REST client
- [ ] Authorization tests (user without group access, non-organizer updates, etc.)
- [ ] Edge cases tested (empty lists, large guests counts, date boundaries)

### Documentation

- [ ] API documentation updated
- [ ] Code comments dla complex logic
- [ ] README updated if needed
- [ ] Error codes documented

---

## 11. Migracja & Wdrażanie

### Pre-deployment

1. Code review (peer review all endpoints + service)
2. Run full test suite
3. Manual QA testing
4. Security audit by tech lead

### Deployment

1. Backup database (recommended before migrations)
2. Run migrations (if new tables/indexes)
3. Deploy code
4. Monitor error logs for unexpected issues
5. Smoke test all 5 endpoints in production

### Post-deployment

1. Monitor API response times
2. Check error rate on 1st hour
3. Validate RLS policies working correctly
4. Get feedback from frontend team
