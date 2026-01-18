# API Endpoint Implementation Plan: Event Comments (Hidden Thread)

## 1. Przegląd punktu końcowego

Moduł ten umożliwia obsługę ukrytego wątku komentarzy dla wydarzenia. Główną cechą jest ochrona niespodzianki: organizator wydarzenia **nie może** widzieć ani dodawać komentarzy w tym wątku. Komentarze są dostępne dla pozostałych członków grupy, do której należy wydarzenie.

Punkty końcowe:

- `GET /api/events/:eventId/comments`: Pobieranie listy komentarzy (z wyłączeniem organizatora). Sortowanie: przypięte na górze, potem od najnowszych.
- `POST /api/events/:eventId/comments`: Dodawanie komentarza (z wyłączeniem organizatora).
- `PATCH /api/events/:eventId/comments/:commentId`: Przypinanie/odpinanie komentarza (dostępne dla każdego gościa).
- `DELETE /api/events/:eventId/comments/:commentId`: Usuwanie własnego komentarza (tylko autor komentarza).

## 2. Szczegóły żądania

### GET /api/events/:eventId/comments

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/events/[eventId]/comments`
- **Parametry**:
    - Wymagane: `eventId` (w URL)
    - Opcjonalne (Query): `limit`, `offset` (zgodnie z `PaginationParams`)

### POST /api/events/:eventId/comments

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/events/[eventId]/comments`
- **Request Body**: `CreateEventCommentCommand`
    - `content`: string (1-2000 znaków)

### PATCH /api/events/:eventId/comments/:commentId

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/events/[eventId]/comments/[commentId]`
- **Request Body**:
    - `isPinned`: boolean
- **Uprawnienia**: Każdy gość wydarzenia może przypiąć/odpiąć dowolny komentarz.

### DELETE /api/events/:eventId/comments/:commentId

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/events/[eventId]/comments/[commentId]`
- **Parametry**:
    - Wymagane: `eventId`, `commentId` (w URL)

## 3. Wykorzystywane typy

Wykorzystane zostaną typy zdefiniowane w `src/lib/schemas.ts` oraz `src/types.ts`:

- `EventCommentDTO`: Struktura danych komentarza zwracana do klienta.
- `CreateEventCommentCommand`: Model danych dla tworzenia komentarza.
- `PaginationParams`: Parametry pagynacji.
- `PaginatedResponse<EventCommentDTO>`: Wrapper dla listy komentarzy.
- `SingleResponse<EventCommentDTO>`: Wrapper dla pojedynczego komentarza.
- `ApiErrorResponse`: Standardowy format błędu.

## 4. Przepływ danych

1.  **Klient** wysyła żądanie do odpowiedniego endpointu API Astro.
2.  **API Route** (Astro):
    - Waliduje `eventId` (UUID).
    - Sprawdza autentykację użytkownika (`locals.supabase.auth.getUser()`).
    - Parsuje i waliduje body/query przy użyciu Zod (`src/lib/schemas.ts`).
    - Inicjalizuje `EventCommentsService`.
    - Wywołuje odpowiednią metodę serwisu.
3.  **EventCommentsService** (Logic):
    - Pobiera dane wydarzenia, aby sprawdzić `group_id` i `organizer_id`.
    - Weryfikuje uprawnienia:
        - Czy użytkownik jest członkiem grupy?
        - Czy użytkownik **nie jest** organizatorem (dla GET/POST/PATCH)?
        - Czy użytkownik jest autorem (dla DELETE)?
    - Wykonuje operację na bazie danych Supabase (`event_comments`).
    - Przy pobieraniu listy:
        - Dołącza `authorLabel` (pobierany z tabeli `children` powiązanej z `author_id` w ramach tej samej grupy).
        - Ustawia flagi `isPinned` i `isAuthor` (porównując `userId` z `author_id`).
        - Sortuje: `is_pinned DESC`, `created_at DESC`.
4.  **Baza danych** (Supabase):
    - Tabela `event_comments` przechowuje dane.
    - RLS (Row Level Security) zapewnia dodatkową warstwę bezpieczeństwa na poziomie bazy.
5.  **API Route** zwraca sformatowaną odpowiedź (200 OK, 201 Created lub 204 No Content).

## 5. Względy bezpieczeństwa

- **Ochrona Niespodzianki**: Logika serwisu musi rygorystycznie sprawdzać, czy `userId` żądającego nie jest równy `organizer_id` wydarzenia. Jeśli tak, zwracany jest błąd `403 Forbidden`.
- **Członkostwo w Grupie**: Tylko aktywni członkowie grupy mogą widzieć/dodawać komentarze.
- **Własność Komentarza**: Tylko autor komentarza może usunąć swój komentarz.
- **Walidacja Danych**: Wszystkie dane wejściowe są walidowane przez Zod przed przekazaniem do serwisu.
- **RLS**: Upewnienie się, że polityki RLS w Supabase odzwierciedlają te zasady (szczególnie blokadę dla organizatora).

## 6. Obsługa błędów

- `400 Bad Request`: Błąd walidacji danych (Zod) lub błędny format UUID.
- `401 Unauthorized`: Brak zalogowanego użytkownika.
- `403 Forbidden`:
    - Użytkownik nie jest członkiem grupy.
    - Użytkownik jest organizatorem wydarzenia.
    - Użytkownik nie jest autorem komentarza (przy usuwaniu).
- `404 Not Found`: Wydarzenie lub komentarz nie istnieje.
- `500 Internal Server Error`: Nieoczekiwany błąd serwera.

Wszystkie błędy biznesowe rzucane przez serwis (`ForbiddenError`, `NotFoundError`, `ValidationError`) są mapowane na odpowiednie kody statusu HTTP w API Route.

## 7. Rozważania dotyczące wydajności

- **Pagynacja**: Lista komentarzy jest pagynowana (domyślnie 20, max 100), aby uniknąć przeciążenia przy długich wątkach.
- **Indeksy**: Upewnienie się, że w bazie danych istnieją indeksy na `event_id` oraz `author_id` w tabeli `event_comments`.
- **Złączenia**: `authorLabel` będzie pobierany wydajnie poprzez złączenie z tabelą `children` (filtrowane po `parent_id` i `group_id`).

## 8. Etapy wdrożenia

### Krok 1: Przygotowanie Serwisu

Stworzenie pliku `src/lib/services/event_comments.service.ts` i implementacja klasy `EventCommentsService`.

- Implementacja metod prywatnych: `isUserGroupMember`, `isUserEventOrganizer`.
- Implementacja metody `listComments(eventId, userId, params)`:
    - Sprawdzenie czy użytkownik jest w grupie i NIE jest organizatorem.
    - Pobranie komentarzy z JOINem do tabeli `children` dla `authorLabel`.
- Implementacja metody `addComment(eventId, userId, command)`:
    - Sprawdzenie uprawnień (grupa, nie-organizator).
    - Insert do `event_comments`.
- Implementacja metody `deleteComment(eventId, commentId, userId)`:
    - Sprawdzenie czy użytkownik jest autorem.
    - Delete z `event_comments`.
- Implementacja metody `togglePinComment(eventId, commentId, userId, isPinned)`:
    - Sprawdzenie uprawnień (grupa, nie-organizator).
    - Update `is_pinned` w `event_comments`.

### Krok 2: Implementacja Endpointów API (Lista i Dodawanie)

Stworzenie pliku `src/pages/api/events/[eventId]/comments.ts`.

- Obsługa `GET`: Wywołanie `service.listComments`.
- Obsługa `POST`: Parsowanie body, walidacja `CreateEventCommentCommandSchema`, wywołanie `service.addComment`.
- Implementacja `handleApiError` (można przenieść do wspólnego helpera lub skopiować wzorzec z `events/[eventId].ts`).

### Krok 3: Implementacja Endpointu API (Usuwanie i Przypinanie)

Stworzenie pliku `src/pages/api/events/[eventId]/comments/[commentId].ts`.

- Obsługa `DELETE`: Wywołanie `service.deleteComment`.
- Obsługa `PATCH`: Parsowanie body (`isPinned`), wywołanie `service.togglePinComment`.

### Krok 4: Testy i Weryfikacja

- Weryfikacja poprawności mapowania `authorLabel` (powinien pokazywać imię dziecka autora w kontekście danej grupy).
- Test manualny: Próba dostępu do komentarzy przez konto organizatora (powinno zwrócić 403).
- Test manualny: Próba usunięcia cudzego komentarza (powinno zwrócić 403).
- Sprawdzenie linterem i poprawienie ewentualnych błędów typowania.
