# API Endpoint Implementation Plan: GET /api/groups

## 1. Przegląd punktu końcowego
Endpoint umożliwia pobranie listy wszystkich grup, do których należy zalogowany użytkownik. Zwraca podstawowe dane o grupie (ID, nazwa, data utworzenia), rolę użytkownika w tej grupie (z tabeli `group_members`) oraz łączną liczbę członków każdej z grup. Wyniki są pagynowane, co zapewnia wysoką wydajność aplikacji mobilnej.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/groups`
- **Parametry:**
  - **Opcjonalne:**
    - `limit` (query parameter): Maksymalna liczba wyników do zwrócenia (domyślnie 20, max 100).
    - `offset` (query parameter): Liczba wyników do pominięcia (domyślnie 0).

## 3. Wykorzystywane typy
- `PaginationParams` (`src/lib/schemas.ts`): Do walidacji parametrów zapytania.
- `GroupListItemDTO` (`src/lib/schemas.ts`): Do reprezentacji pojedynczego elementu listy.
- `PaginatedResponse<GroupListItemDTO>` (`src/types.ts`): Do struktury całej odpowiedzi.

## 4. Szczegóły odpowiedzi
- **200 OK:** Pomyślnie pobrano listę grup.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "Przedszkole Słoneczko - Motylki",
        "role": "admin",
        "memberCount": 15,
        "createdAt": "2025-01-15T10:30:00Z",
        "joinedAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 20,
      "offset": 0
    }
  }
  ```
- **400 Bad Request:** Nieprawidłowe parametry zapytania (np. `limit > 100` lub nieprawidłowy format).
- **401 Unauthorized:** Użytkownik nie jest zalogowany.
- **500 Internal Server Error:** Nieoczekiwany błąd po stronie serwera lub błąd komunikacji z bazą danych.

## 5. Przepływ danych
1. **Endpoint Handler (`GET` w `src/pages/api/groups/index.ts`):**
   - Pobiera sesję użytkownika przez `locals.supabase.auth.getUser()`. Jeśli brak sesji -> 401.
   - Wyciąga parametry `limit` i `offset` z `URLSearchParams`.
   - Waliduje je używając `PaginationParamsSchema.parse()`. Jeśli błąd -> 400.
2. **Service Layer (`GroupsService.getGroupsForUser`):**
   - Wykonuje zapytanie do Supabase:
     - Tabela bazowa: `group_members` (filtrowanie po `user_id`).
     - Relacja: Join z tabelą `groups`.
     - Agregacja: Pobranie `count` z `group_members` dla każdej grupy (subquery).
     - Pagynacja: Wykorzystanie `.range()` na podstawie `offset` i `limit`.
     - Sortowanie: Domyślnie po dacie dołączenia (`joined_at DESC`).
3. **Mapowanie Danych:**
   - Przekształca surowe dane z Supabase na tablicę `GroupListItemDTO`.
   - Konstruuje obiekt `PaginatedResponse`.
4. **Odpowiedź:**
   - Zwraca obiekt JSON z kodem 200.

## 6. Względy bezpieczeństwa
- **Obowiązkowa autoryzacja:** Dostęp tylko dla zalogowanych użytkowników.
- **Filtrowanie po użytkowniku:** Zapytanie musi być ograniczone do rekordów w `group_members`, gdzie `user_id` odpowiada ID zalogowanego użytkownika.
- **Walidacja parametrów:** Użycie Zod zapobiega wstrzykiwaniu nieprawidłowych danych i wymusza bezpieczne limity pagynacji.

## 7. Obsługa błędów
- **ZodError:** Automatycznie mapowany na kod 400 z listą błędnych pól.
- **Błędy Supabase:** Sprawdzane po każdym zapytaniu; rzucane jako `Error` i przechwytywane przez blok `catch` w handlerze, który zwraca 500.
- **Brak Danych:** Jeśli użytkownik nie należy do żadnej grupy, zwracana jest pusta tablica `data: []` z kodem 200.

## 8. Rozważania dotyczące wydajności
- **Pobieranie liczby członków:** Wykorzystanie wbudowanej funkcji `count` w Supabase SDK wewnątrz selekcji pozwala uniknąć problemu N+1.
- **Indeksy:** Wykorzystanie indeksów na `group_members(user_id)` oraz `group_members(group_id)`.

## 9. Etapy wdrożenia
1. **GroupsService:** Implementacja metody `getGroupsForUser` w `src/lib/services/groups.service.ts`.
2. **API Route:** Dodanie obsługi metody `GET` w `src/pages/api/groups/index.ts`.
3. **Zod Validation:** Integracja `PaginationParamsSchema` do przetwarzania parametrów query.
4. **Mapping:** Transformacja wyników bazy danych (snake_case) do formatu DTO (camelCase).
5. **Testing:** Weryfikacja poprawności danych i pagynacji.

