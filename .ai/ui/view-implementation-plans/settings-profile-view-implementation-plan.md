# Plan implementacji widoku Ustawienia Grupy oraz Profil Użytkownika

## 1. Przegląd
Niniejszy dokument opisuje plan implementacji dwóch kluczowych widoków administracyjnych i osobistych: **Ustawienia Grupy** oraz **Profil Użytkownika**. 
- **Ustawienia Grupy** pozwalają administratorowi na zarządzanie podstawowymi informacjami o grupie oraz jej bezpieczne usunięcie.
- **Profil Użytkownika** służy do zarządzania kontem (zmiana hasła), przeglądu przynależności do grup oraz podpiętych profili dzieci, a także umożliwia wylogowanie.

## 2. Routing widoku
- **Ustawienia Grupy**: `/groups/[groupId]/settings` (dostęp tylko dla administratorów grupy)
- **Profil Użytkownika**: `/profile` (dostęp dla zalogowanych użytkowników)

## 3. Struktura komponentów

### Widok Ustawienia Grupy
- `MainLayout` (Astro)
    - `SettingsContainer` (React - Client Component)
        - `GroupEditForm` (React - Formularz edycji nazwy)
        - `SettingsShortcuts` (React - Linki do członków i zaproszeń)
        - `DangerousZone` (React - Sekcja usuwania grupy)
            - `AlertDialog` (Shadcn - Potwierdzenie usunięcia)

### Widok Profil Użytkownika
- `MainLayout` (Astro)
    - `ProfileContainer` (React - Client Component)
        - `ProfileHeader` (React - Dane podstawowe: email)
        - `ChangePasswordDialog` (React - Formularz zmiany hasła)
        - `MyGroupsSection` (React - Lista grup użytkownika)
            - `GroupMiniCard` (React - Skrócona karta grupy)
        - `MyChildrenSection` (React - Lista dzieci użytkownika)
            - `ChildMiniCard` (React - Skrócona karta dziecka)
        - `LogoutSection` (React - Przycisk wylogowania)

## 4. Szczegóły komponentów

### `SettingsContainer` (React)
- **Opis**: Główny kontener zarządzający pobieraniem danych grupy (przez `useGroupDetail`) i dystrybucją stanu do komponentów dzieci.
- **Główne elementy**: `Skeleton` (podczas ładowania), `GroupEditForm`, `SettingsShortcuts`, `DangerousZone`.
- **Typy**: `GroupDetailDTO`.

### `GroupEditForm` (React)
- **Opis**: Formularz umożliwiający zmianę nazwy grupy.
- **Główne elementy**: `Input`, `Button` ("Zapisz zmiany").
- **Obsługiwane interakcje**: Submit formularza wywołujący `PATCH /api/groups/:groupId`.
- **Obsługiwana walidacja**: 
    - Nazwa: 3-100 znaków.
    - Przycisk "Zapisz" zablokowany, jeśli nazwa nie uległa zmianie.
- **Typy**: `UpdateGroupCommand`.

### `DangerousZone` (React)
- **Opis**: Sekcja wyróżniona czerwonym obramowaniem do usuwania grupy.
- **Główne elementy**: `Alert`, `Button` ("Usuń grupę").
- **Obsługiwane interakcje**: Otwarcie `AlertDialog` po kliknięciu.
- **Obsługiwana walidacja**:
    - Wewnątrz `AlertDialog` użytkownik musi wpisać nazwę grupy, aby odblokować przycisk "Usuń na zawsze".
- **API**: `DELETE /api/groups/:groupId`.

### `ChangePasswordDialog` (React)
- **Opis**: Okno dialogowe z formularzem zmiany hasła.
- **Główne elementy**: `Dialog`, `Input` (obecne hasło, nowe hasło, potwierdź nowe hasło), `Button` ("Zapisz").
- **Obsługiwana walidacja**:
    - Nowe hasło: min. 8 znaków.
    - Nowe hasło i potwierdzenie muszą być identyczne.
- **API**: Supabase `auth.updateUser`.

### `MyGroupsSection` / `MyChildrenSection` (React)
- **Opis**: Sekcje wyświetlające listy grup i dzieci przypisanych do użytkownika.
- **Główne elementy**: `ScrollArea` dla długich list, karty typu `GroupMiniCard` / `ChildMiniCard`.
- **Typy**: `GroupListItemDTO`, `ChildListItemDTO`.

## 5. Typy

Wymagane DTO (zgodne z `src/lib/schemas.ts`):
- `GroupDetailDTO`: Szczegóły grupy (nazwa, rola, liczniki).
- `UpdateGroupCommand`: `{ name?: string }`.
- `UpdateGroupResponseDTO`: `{ id: string, name: string, updatedAt: string }`.
- `GroupListItemDTO`: Dane do list na profilu.
- `ChildListItemDTO`: Dane dzieci na profilu.
- `UpdatePasswordCommand`: `{ password: string, confirmPassword: string }`.

## 6. Zarządzanie stanem
- **Dane z API**: Wykorzystanie TanStack Query (hooki `useGroupDetail`, `useGroups`).
- **Formularze**: `react-hook-form` z walidacją `zod` (wykorzystanie istniejących schematów z `src/lib/schemas.ts`).
- **Lokalny stan**: 
    - `isDeleting`: stan ładowania podczas usuwania grupy.
    - `deleteConfirmation`: string wpisywany przez użytkownika do potwierdzenia usunięcia.
    - `isPasswordDialogOpen`: sterowanie widocznością dialogu zmiany hasła.

## 7. Integracja API

### Ustawienia Grupy
- `GET /api/groups/:groupId` -> Pobranie danych do pre-fill formularza.
- `PATCH /api/groups/:groupId` -> Aktualizacja nazwy.
- `DELETE /api/groups/:groupId` -> Usunięcie grupy (akcja kaskadowa na backendzie).

### Profil Użytkownika
- `GET /api/groups` -> Pobranie grup użytkownika.
- `auth.updateUser({ password })` -> Zmiana hasła przez Supabase.
- `POST /api/auth/logout` (przez Astro Action) -> Wylogowanie.

## 8. Interakcje użytkownika
1. **Zmiana nazwy**: Wpisanie nowej nazwy -> Kliknięcie "Zapisz" -> Toast success -> Odświeżenie danych grupy.
2. **Usuwanie grupy**: Kliknięcie "Usuń grupę" -> Otwarcie dialogu -> Wpisanie nazwy grupy -> Kliknięcie "Usuń na zawsze" -> Toast success -> Przekierowanie do `/dashboard`.
3. **Zmiana hasła**: Kliknięcie "Zmień hasło" -> Wpisanie danych -> Walidacja -> Zapis -> Toast success -> Zamknięcie dialogu.
4. **Wylogowanie**: Kliknięcie "Wyloguj się" -> Wyczyszczenie sesji -> Przekierowanie do strony głównej `/`.

## 9. Warunki i walidacja
- **Uprawnienia**: Widok `/settings` musi sprawdzać czy `role === 'admin'`. Jeśli nie, przekierowanie 403 lub do Group Hub.
- **Usuwanie**: Przycisk w dialogu potwierdzającym jest `disabled` dopóki `input !== groupName`.
- **Formularze**: Wykorzystanie `sonner` do wyświetlania błędów walidacji z API (400 Bad Request).

## 10. Obsługa błędów
- **Błąd 403**: Wyświetlenie `EmptyState` z informacją o braku uprawnień.
- **Błąd 404**: Wyświetlenie strony 404 (grupa nie istnieje).
- **Błąd sieci**: Wyświetlenie `Toast.error` z informacją o problemie z połączeniem.
- **Błąd zmiany hasła**: Wyświetlenie komunikatu o błędnym obecnym haśle (z Supabase).

## 11. Kroki implementacji

1. **Przygotowanie stron Astro**:
    - Utworzenie `src/pages/groups/[groupId]/settings.astro`.
    - Utworzenie `src/pages/profile/index.astro`.
2. **Implementacja komponentów Ustawień Grupy**:
    - `SettingsContainer.tsx` z pobieraniem danych.
    - `GroupEditForm.tsx` z integracją `PATCH`.
    - `DangerousZone.tsx` z `AlertDialog` i `DELETE`.
3. **Implementacja komponentów Profilu**:
    - `ProfileContainer.tsx`.
    - `ChangePasswordForm.tsx` z integracją Supabase.
    - Sekcje list `MyGroupsSection` i `MyChildrenSection` (użycie `useGroups` i `useGroupDetail` lub dedykowanego endpointu profilu jeśli potrzebny).
4. **Integracja wylogowania**:
    - Obsługa Astro Action do czyszczenia sesji.
5. **Testy i walidacja**:
    - Weryfikacja mobile-first (Tailwind 4).
    - Sprawdzenie uprawnień admina.
    - Test "Dangerous Zone" z błędnym wpisem nazwy grupy.
