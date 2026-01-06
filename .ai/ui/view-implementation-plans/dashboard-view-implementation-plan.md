# Plan implementacji widoku Dashboard (Przegląd grup)

## 1. Przegląd
Widok Dashboard jest centralnym punktem aplikacji dla zalogowanego użytkownika. Jego głównym celem jest wyświetlenie listy wszystkich grup, do których należy użytkownik, oraz umożliwienie stworzenia nowej grupy lub dołączenia do istniejącej za pomocą 6-znakowego kodu. Widok musi być zoptymalizowany pod kątem urządzeń mobilnych (Mobile First), zapewniać szybkie ładowanie i czytelną informację o roli użytkownika (Admin/Członek).

## 2. Routing widoku
- **Ścieżka:** `/dashboard` (lub `/groups` zgodnie z istniejącą strukturą, ale plan UI zakłada `/dashboard`)
- **Dostępność:** Tylko dla zalogowanych użytkowników (chronione przez middleware).

## 3. Struktura komponentów
Widok będzie oparty na komponentach React osadzonych w layoutcie Astro.

```
DashboardPage (Astro)
└── DashboardContainer (React, "use client")
    ├── DashboardHeader (Nagłówek z akcjami)
    │   ├── Title ("Twoje Grupy")
    │   └── ActionButtons (Create Group, Join Group)
    ├── GroupList (Lista grup lub stany alternatywne)
    │   ├── SkeletonGroupList (Stan ładowania)
    │   ├── EmptyState (Brak grup)
    │   └── GroupCard (Karta pojedynczej grupy - n instancji)
    ├── CreateGroupDialog (Dialog z formularzem tworzenia)
    │   └── CreateGroupForm
    └── JoinGroupDialog (Dialog z formularzem dołączania)
        └── JoinGroupForm
```

## 4. Szczegóły komponentów

### DashboardContainer (React)
- **Opis:** Główny komponent zarządzający stanem danych i wyświetlaniem odpowiednich sekcji (ładowanie, pusta lista, lista grup).
- **Główne elementy:** `DashboardHeader`, `GroupList`, `CreateGroupDialog`, `JoinGroupDialog`.
- **Obsługiwane interakcje:** Inicjalizacja pobierania danych, otwieranie/zamykanie dialogów.
- **Typy:** `GroupListItemDTO[]`.
- **Propsy:** `initialGroups` (opcjonalnie, pobrane przez SSR w Astro).

### GroupCard (React)
- **Opis:** Karta wyświetlająca podstawowe informacje o grupie.
- **Główne elementy:** Nazwa grupy, Badge roli (np. z ikoną korony dla Admina), statystyki (liczba członków), data dołączenia, przycisk akcji "Przejdź".
- **Obsługiwane interakcje:** Kliknięcie w przycisk "Przejdź" nawiguje do `/groups/[groupId]/events`.
- **Typy:** `GroupListItemDTO`.
- **Propsy:** `group: GroupListItemDTO`.

### EmptyState (React)
- **Opis:** Wyświetlany, gdy użytkownik nie należy do żadnej grupy.
- **Główne elementy:** Ilustracja, tekst zachęcający, przyciski "Utwórz grupę" i "Dołącz do grupy".
- **Obsługiwane interakcje:** Wyzwalanie otwarcia dialogów w komponencie nadrzędnym.

### CreateGroupForm (React)
- **Opis:** Formularz tworzenia nowej grupy.
- **Główne elementy:** Input `name`, tekst informacyjny o zgodzie na kontakt (PRD US-002), przycisk "Utwórz".
- **Obsługiwana walidacja:**
    - `name`: wymagane, 3-100 znaków.
- **Typy:** `CreateGroupCommand`.
- **Propsy:** `onSubmit: (data: CreateGroupCommand) => Promise<void>`, `isLoading: boolean`.

### JoinGroupForm (React)
- **Opis:** Formularz dołączania do grupy przez kod.
- **Główne elementy:** Input na 6-znakowy kod (np. `InputOTP` lub zwykły `Input`), przycisk "Dołącz".
- **Obsługiwana walidacja:**
    - `code`: wymagane, dokładnie 6 znaków, alfanumeryczne.
- **Typy:** `JoinGroupCommand`.
- **Propsy:** `onSubmit: (data: JoinGroupCommand) => Promise<void>`, `isLoading: boolean`.

## 5. Typy

Wykorzystywane typy z `src/lib/schemas.ts`:

- **GroupListItemDTO:**
    - `id` (string/UUID)
    - `name` (string)
    - `role` ('admin' | 'member')
    - `memberCount` (number)
    - `createdAt` (string/ISO Date)
    - `joinedAt` (string/ISO Date)

- **CreateGroupCommand:**
    - `name` (string)

- **JoinGroupCommand:**
    - `code` (string)

- **PaginatedResponse<T>:**
    - `data: T[]`
    - `pagination: { total: number, limit: number, offset: number }`

## 6. Zarządzanie stanem
- **Dane grup:** Rekomendowane użycie `TanStack Query` (React Query) do pobierania, cachowania i unieważniania listy grup po stworzeniu nowej lub dołączeniu.
- **Stan UI:** `useState` do zarządzania widocznością dialogów (`isCreateOpen`, `isJoinOpen`).
- **Feedback:** `sonner` (Shadcn/ui) do wyświetlania powiadomień o sukcesie lub błędzie.

## 7. Integracja API
- **Pobieranie:** `GET /api/groups?limit=20&offset=0`
    - Request: brak body.
    - Response: `PaginatedResponse<GroupListItemDTO>`.
- **Tworzenie:** `POST /api/groups`
    - Request: `CreateGroupCommand`.
    - Response: `CreateGroupResponseDTO`.
- **Dołączanie:** `POST /api/invites/join`
    - Request: `JoinGroupCommand`.
    - Response: `JoinGroupResponseDTO`.

## 8. Interakcje użytkownika
1. **Wejście na dashboard:** Automatyczne pobieranie grup. Jeśli brak grup -> `EmptyState`.
2. **Tworzenie grupy:** Kliknięcie "Utwórz" -> Otwarcie dialogu -> Wpisanie nazwy -> Walidacja frontendowa -> Wywołanie API -> Zamknięcie dialogu + Toast + Refresh listy.
3. **Dołączanie do grupy:** Kliknięcie "Dołącz" -> Otwarcie dialogu -> Wpisanie kodu -> Wywołanie API -> Przekierowanie do nowej grupy lub Toast błędu.
4. **Nawigacja:** Kliknięcie karty grupy przenosi do widoku wydarzeń tej grupy.

## 9. Warunki i walidacja
- **Walidacja nazwy grupy:** Zgodnie z Zod w `CreateGroupCommandSchema` (3-100 znaków). Błąd wyświetlany pod inputem.
- **Zgoda administratora (US-002):** Formularz tworzenia MUSI zawierać tekst: *"Twój adres email będzie widoczny dla członków grupy jako kanał awaryjny (domyślnie ukryty, widoczny po kliknięciu)"*. Jest to warunek PRD.
- **Kod zaproszenia:** Walidacja długości (6 znaków) przed wysłaniem do API.

## 10. Obsługa błędów
- **401 Unauthorized:** Automatyczne przekierowanie do `/login` (zapewnione przez middleware i Supabase client).
- **400 Bad Request (Validation):** Wyświetlenie komunikatów o błędach z API (Zod issues) przy odpowiednich polach formularza.
- **500 / Network Error:** Globalny Toast informujący o problemach technicznych.
- **Kod wygasł/nieprawidłowy:** Specyficzny komunikat błędu dla `JoinGroupForm`.

## 11. Kroki implementacji
1. **Przygotowanie strony Astro:** Utworzenie `src/pages/dashboard.astro` z `MainLayout`.
2. **Stworzenie kontenera React:** Implementacja `DashboardContainer` z podstawowym szkieletem.
3. **Integracja TanStack Query:** Konfiguracja providera (jeśli nie istnieje) i stworzenie hooka `useGroups`.
4. **Budowa komponentów UI:**
    - `GroupCard` z Tailwind 4.
    - `EmptyState` dla stanu zerowego.
    - Szkielety (Skeletons) dla stanu ładowania.
5. **Implementacja dialogu tworzenia:**
    - `CreateGroupDialog` z formularzem i walidacją.
    - Integracja z `POST /api/groups`.
6. **Implementacja dialogu dołączania:**
    - `JoinGroupDialog` z integracją `POST /api/invites/join`.
7. **Szlifowanie UX:** Dodanie animacji wejścia (Framer Motion lub CSS transitions), obsługa stanów hover/focus dla mobile.
8. **Testy manualne:** Weryfikacja przepływu tworzenia, dołączania i nawigacji na różnych rozmiarach ekranu.

