# Plan implementacji widoku Wydarzeń (Events)

## 1. Przegląd

Sekcja wydarzeń jest kluczowym elementem aplikacji Grupka, umożliwiającym rodzicom organizację urodzin i zbiórek. System dzieli widoki na listę wydarzeń, szczegóły wydarzenia (z unikalnym mechanizmem ukrytych komentarzy przed organizatorem), oraz formularze tworzenia i edycji. Całość oparta jest na architekturze SSR (Astro) z interaktywnymi komponentami React 19.

## 2. Routing widoku

- `/groups/:groupId/events` - Lista wszystkich wydarzeń w grupie.
- `/groups/:groupId/events/new` - Formularz tworzenia nowego wydarzenia.
- `/groups/:groupId/events/:eventId` - Szczegóły konkretnego wydarzenia.
- `/groups/:groupId/events/:eventId/edit` - Formularz edycji wydarzenia (tylko dla organizatora).

## 3. Struktura komponentów

### Drzewo komponentów (Widok listy)

```
EventsPage (Astro)
└── MainLayout
    └── DashboardContainer (React)
        ├── EventsHeader
        │   └── Button (Utwórz wydarzenie - desktop)
        ├── EventsFilter (Tabs: Nadchodzące, Wszystkie, Minione)
        ├── EventsList (React Query)
        │   ├── EventCard (Item)
        │   │   ├── Badge ("Zaktualizowane")
        │   │   └── RoleIndicator ("Organizujesz" / "Gość")
        │   └── EventsEmptyState
        └── FAB (Floating Action Button - mobile)
```

### Drzewo komponentów (Szczegóły wydarzenia)

```
EventDetailPage (Astro)
└── MainLayout (Back button)
    └── EventDetailContainer (React Query)
        ├── EventHero (Title, Date, Organizer Info, Child Bio)
        ├── OrganizerActions (Edit/Delete - tylko dla organizatora)
        ├── OrganizerInfoAlert (Info o ukrytych komentarzach)
        ├── ChildProfileCard (Dla gości - inspiracje prezentowe)
        ├── GuestList (Collapsible list of children names)
        └── CommentThread (Dla gości - ukryty wątek)
            ├── CommentList
            │   └── CommentItem
            └── CommentInput (Sticky bottom)
```

### Drzewo komponentów (Formularz Tworzenia/Edycji)

```
EventFormPage (Astro)
└── MainLayout
    └── EventFormContainer (React)
        ├── FormSection (Podstawowe dane: Tytuł, Data, Opis, Solenizant)
        └── GuestSelectionSection
            ├── SearchInput (Filtr dzieci)
            ├── SelectAllToggle
            └── GuestScrollArea
                └── GuestCheckboxItem
```

## 4. Szczegóły komponentów

### EventCard (React)

- **Opis**: Karta wyświetlająca podsumowanie wydarzenia na liście.
- **Główne elementy**: `h3` (tytuł), `p` (data), `Avatar` (solenizant), `Badge` (liczba gości, status aktualizacji).
- **Obsługiwane interakcje**: Kliknięcie karty przekierowuje do `/groups/:groupId/events/:eventId`.
- **Typy**: `EventListItemDTO`.
- **Propsy**: `event: EventListItemDTO`, `groupId: string`.

### EventForm (React)

- **Opis**: Wspólny formularz dla tworzenia i edycji wydarzenia.
- **Obsługiwana walidacja**:
    - `title`: Wymagany, 1-100 znaków.
    - `eventDate`: Wymagana, format YYYY-MM-DD, nie może być w przeszłości (dla nowych).
    - `guestChildIds`: Tablica UUID, max 50 dzieci.
- **Obsługiwane interakcje**:
    - "Zaznacz wszystkich" (SelectAllToggle).
    - Dynamiczne wyszukiwanie gości po nazwie.
    - Submit formularza (Mutation).
- **Typy**: `CreateEventCommand`, `UpdateEventCommand`, `ChildListItemDTO`.
- **Propsy**: `initialData?: EventDetailDTO`, `groupId: string`, `childrenList: ChildListItemDTO[]`.

### CommentThread (React)

- **Opis**: Sekcja komentarzy dostępna tylko dla gości.
- **Główne elementy**: Lista komentarzy typu timeline, `Textarea` z autouzupełnianiem (Aura AI w przyszłości).
- **Obsługiwane interakcje**: Dodawanie komentarza, usuwanie własnego komentarza.
- **Typy**: `EventCommentDTO`.
- **Propsy**: `eventId: string`, `isOrganizer: boolean`.

## 5. Typy

Wykorzystywane są typy z `src/types.ts` (pochodzące z `src/lib/schemas.ts`):

- **EventListItemDTO**:
    - `id`: string (UUID)
    - `title`: string
    - `eventDate`: string (ISO date)
    - `childName`: string | null (solenizant)
    - `isOrganizer`: boolean
    - `guestCount`: number
    - `hasNewUpdates`: boolean (updated_at < 8h)

- **EventDetailDTO**:
    - Rozszerza podstawowe dane o: `description`, `childBio`, `guests` (lista `EventGuestDTO`).

- **CreateEventCommand** / **UpdateEventCommand**:
    - Pola wymagane do wysyłki do API (Zod-validated).

## 6. Zarządzanie stanem

### Custom Hooks

Wszystkie operacje asynchroniczne powinny być obsługiwane przez dedykowane hooki w `src/lib/hooks/useEvents.ts`:

- `useEvents(groupId, params)` - Pobieranie listy z paginacją.
- `useEventDetail(eventId)` - Pobieranie szczegółów (z cache'owaniem).
- `useCreateEvent()` - Mutacja tworzenia + unieważnienie cache listy.
- `useUpdateEvent()` - Mutacja edycji + unieważnienie cache szczegółów.
- `useDeleteEvent()` - Mutacja usuwania + redirect.

### Stan lokalny (React)

- `useForm` (React Hook Form) do zarządzania danymi formularza i walidacją.
- `useState` w `GuestSelectionSection` do filtrowania listy dzieci.

## 7. Integracja API

Integracja odbywa się poprzez serwisy zdefiniowane w `src/lib/services/events.service.ts` wywoływane przez endpointy API Astro:

- **GET /api/groups/:groupId/events**
    - Query: `EventsQueryParams` (limit, offset, upcoming).
    - Response: `PaginatedResponse<EventListItemDTO>`.
- **POST /api/groups/:groupId/events**
    - Body: `CreateEventCommand`.
    - Response: `SingleResponse<CreateEventResponseDTO>`.
- **GET /api/events/:eventId**
    - Response: `SingleResponse<EventDetailDTO>`.
- **PATCH /api/events/:eventId**
    - Body: `UpdateEventCommand`.
- **DELETE /api/events/:eventId**

## 8. Interakcje użytkownika

- **Masowy wybór**: Kliknięcie "Zaznacz wszystkich" w formularzu zaznacza wszystkie aktualnie przefiltrowane dzieci.
- **Ochrona niespodzianki**: Jeśli `isOrganizer === true`, komponent `CommentThread` w ogóle nie jest renderowany w UI (dodatkowe zabezpieczenie poza RLS).
- **Badge "Zaktualizowane"**: Wyświetlany automatycznie na podstawie flagi `hasNewUpdates` z API.
- **Sticky Actions**: Na mobile przyciski akcji (Zapisz, Wyślij komentarz) powinny być przyklejone do dołu ekranu.

## 9. Warunki i walidacja

- **Walidacja po stronie klienta (Zod)**: Sprawdzana przed wysyłką formularza. Błędy wyświetlane pod polami.
- **Blokada daty**: DatePicker powinien blokować daty wsteczne przy tworzeniu nowego wydarzenia.
- **Uprawnienia**: Przyciski "Edytuj/Usuń" widoczne tylko jeśli `isOrganizer === true`.

## 10. Obsługa błędów

- **403 Forbidden**: Wyświetlenie Toastu "Brak uprawnień" przy próbie edycji nie swojego wydarzenia.
- **404 Not Found**: Przekierowanie do strony 404 lub wyświetlenie `EmptyState` z komunikatem o braku wydarzenia.
- **Offline**: Wykorzystanie mechanizmów TanStack Query do ponawiania prób pobrania danych.
- **Błędy walidacji API**: Mapowanie `ErrorDTO.details` bezpośrednio na błędy pól w `react-hook-form`.

## 11. Kroki implementacji

1. **Przygotowanie hooków**: Implementacja `useEvents.ts` w `src/lib/hooks/`.
2. **Budowa listy**:
    - Stworzenie `EventCard`.
    - Implementacja strony Astro `/groups/[groupId]/events` z `DashboardContainer`.
    - Dodanie informacji o nazwie grupy w nagłówku.
3. **Szczegóły wydarzenia**:
    - Stworzenie `EventHero`, `GuestList`.
    - Implementacja logiczna ukrywania komentarzy dla organizatora.
    - Integracja `CommentThread` dla gości.
    - Dodanie informacji o nazwie grupy w nagłówku (Breadcrumbs).
4. **Formularz Tworzenia**:
    - Implementacja `GuestSelectionSection` z filtrowaniem i masowym wyborem.
    - Integracja z `useCreateEvent`.
    - Wyświetlenie nazwy grupy w nagłówku.
5. **Formularz Edycji**:
    - Reużycie komponentów z tworzenia.
    - Implementacja pre-fillingu danych.
    - Wyświetlenie nazwy grupy w nagłówku.
6. **Polerowanie UX**:
    - Dodanie Skeletonów dla stanów ładowania.
    - Dodanie animacji wejścia dla kart (Tailwind transitions).
    - Implementacja AlertDialog dla potwierdzeń usuwania.
    - Testy RLS (próba wejścia na komentarze jako organizator).
