# API Endpoint Implementation Plan: Children Management

Plan wdrożenia zestawu punktów końcowych REST API do zarządzania profilami dzieci w grupach. Moduł umożliwia izolację danych między grupami oraz przypisanie dzieci do konkretnych rodziców (użytkowników).

## 1. Przegląd punktu końcowego

Zestaw endpointów pozwala na:

- Pobieranie listy dzieci przypisanych do danej grupy (paginacja).
- Dodawanie nowego profilu dziecka do grupy.
- Pobieranie szczegółowych informacji o konkretnym dziecku.
- Aktualizację profilu dziecka (tylko przez rodzica).
- Usunięcie profilu dziecka (tylko przez rodzica).

## 2. Szczegóły żądania

### GET /api/groups/:groupId/children

- **Opis**: Pobiera listę dzieci w grupie.
- **Struktura URL**: `/api/groups/[groupId]/children`
- **Parametry**:
    - `groupId` (URL): UUID, wymagany.
    - `limit` (Query): integer, opcjonalny (default: 20).
    - `offset` (Query): integer, opcjonalny (default: 0).

### POST /api/groups/:groupId/children

- **Opis**: Tworzy nowy profil dziecka w grupie.
- **Struktura URL**: `/api/groups/[groupId]/children`
- **Request Body**: `CreateChildCommand`
    - `displayName`: string (1-50), wymagany.
    - `bio`: string (max 1000), opcjonalny.
    - `birthDate`: date (YYYY-MM-DD), opcjonalny.

### GET /api/children/:childId

- **Opis**: Pobiera szczegóły dziecka.
- **Struktura URL**: `/api/children/[childId]`
- **Parametry**:
    - `childId` (URL): UUID, wymagany.

### PATCH /api/children/:childId

- **Opis**: Aktualizuje profil dziecka.
- **Struktura URL**: `/api/children/[childId]`
- **Request Body**: `UpdateChildCommand`
    - `displayName`: string (1-50), opcjonalny.
    - `bio`: string (max 1000), opcjonalny.
    - `birthDate`: date (YYYY-MM-DD), opcjonalny (lub null).

### DELETE /api/children/:childId

- **Opis**: Usuwa profil dziecka.
- **Struktura URL**: `/api/children/[childId]`

## 3. Wykorzystywane typy

Wszystkie typy są zdefiniowane w `src/lib/schemas.ts`:

- **Komendy**:
    - `CreateChildCommand`
    - `UpdateChildCommand`
- **DTOs**:
    - `ChildListItemDTO`
    - `CreateChildResponseDTO`
    - `ChildDetailDTO`
    - `UpdateChildResponseDTO`
- **Wspólne**:
    - `PaginationParams`
    - `PaginatedResponse<T>`
    - `SingleResponse<T>`
    - `ApiErrorResponse`

## 4. Szczegóły odpowiedzi

- **200 OK**: Dla pomyślnego odczytu (`GET`) i aktualizacji (`PATCH`).
- **201 Created**: Dla pomyślnego utworzenia (`POST`).
- **204 No Content**: Dla pomyślnego usunięcia (`DELETE`).
- **400 Bad Request**: Błędy walidacji danych wejściowych lub logicznych.
- **401 Unauthorized**: Brak autoryzacji (brak tokena/sesji).
- **403 Forbidden**: Brak uprawnień (użytkownik nie jest członkiem grupy lub nie jest rodzicem dziecka).
- **404 Not Found**: Zasób (grupa lub dziecko) nie istnieje.
- **500 Internal Server Error**: Nieoczekiwany błąd serwera.

## 5. Przepływ danych

1.  **Warstwa Route (Astro Endpoint)**:
    - Wyodrębnienie parametrów z URL i Query.
    - Walidacja Body/Query za pomocą Zod (`src/lib/schemas.ts`).
    - Wywołanie odpowiedniej metody w `ChildrenService`.
    - Obsługa błędów za pomocą `handleApiError`.

2.  **Warstwa Serwisu (ChildrenService)**:
    - Sprawdzenie uprawnień (np. `groupsService.isMember`).
    - Interakcja z bazą danych przez `supabase` (z `locals`).
    - Mapowanie wyników z bazy danych na DTO.
    - Rzucanie błędów biznesowych (`NotFoundError`, `ForbiddenError`).

3.  **Baza Danych (Supabase)**:
    - Tabela `children` przechowuje dane.
    - RLS (Row Level Security) zapewnia dodatkową warstwę bezpieczeństwa, ale serwis wykonuje jawne sprawdzenia dla lepszych komunikatów błędów.

## 6. Względy bezpieczeństwa

- **Autoryzacja**: Middleware sprawdza sesję użytkownika.
- **Izolacja Grup**: Użytkownik może widzieć dzieci tylko w grupach, do których należy.
- **Własność (Ownership)**: Tylko `parent_id` (użytkownik, który dodał dziecko) może edytować lub usuwać profil dziecka.
- **Sanitacja**: Wszystkie dane wejściowe są walidowane przez Zod przed przetworzeniem.

## 7. Obsługa błędów

Implementacja wykorzystuje `handleApiError` z `src/lib/api-utils.ts`, który mapuje:

- `z.ZodError` -> 400 (VALIDATION_ERROR)
- `NotFoundError` -> 404 (NOT_FOUND)
- `ForbiddenError` -> 403 (FORBIDDEN)
- `ValidationError` -> 400 (VALIDATION_ERROR)
- Pozostałe -> 500 (SERVICE_UNAVAILABLE)

## 8. Rozważania dotyczące wydajności

- **Paginacja**: Endpoint listy wymusza `limit` i `offset`, aby zapobiec pobieraniu zbyt dużej ilości danych.
- **Indeksy**: Upewnienie się, że `group_id` i `parent_id` w tabeli `children` posiadają indeksy (zapewnione przez migrację DB).

## 9. Etapy wdrożenia

### Krok 1: Implementacja ChildrenService

Stworzenie pliku `src/lib/services/children.service.ts` z metodami:

- `listChildren(groupId, params)`
- `createChild(groupId, parentId, command)`
- `getChild(childId, userId)`
- `updateChild(childId, userId, command)`
- `deleteChild(childId, userId)`

### Krok 2: Implementacja Endpointów Grupy

Stworzenie plików:

- `src/pages/api/groups/[groupId]/children.ts` (GET, POST)

### Krok 3: Implementacja Endpointów Dziecka

Stworzenie plików:

- `src/pages/api/children/[childId].ts` (GET, PATCH, DELETE)

### Krok 4: Testy integracyjne

- Weryfikacja poprawności walidacji Zod.
- Testowanie uprawnień (próba dostępu do dziecka z innej grupy).
- Testowanie własności (próba edycji dziecka innego rodzica).
