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
    │   └── ActionButtons (Link do /groups/new, Link do /join)
    └── GroupList (Lista grup lub stany alternatywne)
        ├── SkeletonGroupList (Stan ładowania)
        ├── EmptyState (Brak grup)
        └── GroupCard (Karta pojedynczej grupy - n instancji)
```

## 4. Szczegóły komponentów

### DashboardContainer (React)

- **Opis:** Główny komponent zarządzający stanem danych i wyświetlaniem odpowiednich sekcji (ładowanie, pusta lista, lista grup).
- **Główne elementy:** `DashboardHeader`, `GroupList`.
- **Obsługiwane interakcje:** Inicjalizacja pobierania danych.
- **Typy:** `GroupListItemDTO[]`.
- **Propsy:** `initialGroups` (opcjonalnie, pobrane przez SSR w Astro).

### GroupCard (React)

- **Opis:** Karta wyświetlająca podstawowe informacje o grupie.
- **Główne elementy:** Nazwa grupy, Badge roli (np. z ikoną korony dla Admina), statystyki (liczba członków), data dołączenia, przycisk akcji "Przejdź".
- **Obsługiwane interakcje:** Kliknięcie w przycisk "Przejdź" nawiguje do Hubu Grupy `/groups/[groupId]`.
- **Typy:** `GroupListItemDTO`.
- **Propsy:** `group: GroupListItemDTO`.

### EmptyState (React)

- **Opis:** Wyświetlany, gdy użytkownik nie należy do żadnej grupy.
- **Główne elementy:** Ilustracja, tekst zachęcający, przyciski (linki) "Utwórz grupę" i "Dołącz do grupy".
- **Obsługiwane interakcje:** Nawigacja do `/groups/new` lub `/join`.

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

## 8. Interakcje użytkownika

1. **Wejście na dashboard:** Automatyczne pobieranie grup. Jeśli brak grup -> `EmptyState`.
2. **Nawigacja do tworzenia:** Kliknięcie "Utwórz grupę" przekierowuje do `/groups/new`.
3. **Nawigacja do dołączania:** Kliknięcie "Dołącz do grupy" przekierowuje do `/join`.
4. **Przejście do grupy:** Kliknięcie karty grupy przenosi do Hubu Grupy (`/groups/[groupId]`).

## 9. Warunki i walidacja

- **Nawigacja:** Dashboard służy wyłącznie jako punkt nawigacyjny i przeglądowy. Cała logika tworzenia i dołączania jest przeniesiona na dedykowane strony.
- **Uprawnienia:** Dashboard jest chroniony przez middleware; tylko zalogowani użytkownicy widzą swoje grupy.

## 10. Obsługa błędów

- **401 Unauthorized:** Automatyczne przekierowanie do `/login` (zapewnione przez middleware i Supabase client).
- **500 / Network Error:** Globalny Toast informujący o problemach technicznych przy pobieraniu listy grup.

## 11. Kroki implementacji

1. **Przygotowanie strony Astro:** Utworzenie `src/pages/dashboard.astro` z `MainLayout`.
2. **Stworzenie kontenera React:** Implementacja `DashboardContainer` z podstawowym szkieletem.
3. **Integracja TanStack Query:** Konfiguracja providera (jeśli nie istnieje) i stworzenie hooka `useGroups`.
4. **Budowa komponentów UI:**
    - `GroupCard` z Tailwind 4.
    - `EmptyState` dla stanu zerowego (z linkami do `/groups/new` i `/join`).
    - Szkielety (Skeletons) dla stanu ładowania.
5. **Obsługa akcji nagłówka:** Dodanie przycisków w `DashboardHeader` kierujących do odpowiednich ścieżek.
6. **Szlifowanie UX:** Dodanie animacji wejścia, obsługa stanów hover/focus dla mobile.
7. **Testy manualne:** Weryfikacja pobierania i nawigacji na różnych rozmiarach ekranu.
