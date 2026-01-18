# Plan implementacji widoku Członkowie Grupy

## 1. Przegląd
Widok listy członków grupy pozwala użytkownikom zobaczyć, kto należy do danej grupy, jakie pełni role oraz jakie dzieci reprezentuje. Dla administratorów widok ten udostępnia narzędzia moderacji (usuwanie członków). Dla wszystkich członków widok oferuje bezpieczny mechanizm kontaktu z administratorem grupy ("kanał awaryjny").

## 2. Routing widoku
- **Ścieżka:** `/groups/[groupId]/members`
- **Parametry:** `groupId` (UUID grupy)

## 3. Struktura komponentów
Widok będzie zaimplementowany jako strona Astro zawierająca interaktywny kontener Reactowy.

```
MembersContainer (React)
├── MembersHeader (React/UI)
├── MembersList (React)
│   ├── MemberCard (React)
│   │   ├── Avatar (Shadcn UI)
│   │   ├── Badge (Shadcn UI - Rola)
│   │   ├── AdminContactDialog (React/Shadcn Dialog)
│   │   └── AdminActions (React/Shadcn DropdownMenu)
│   │       └── DeleteMemberDialog (React/Shadcn AlertDialog)
└── EmptyState (React/UI)
```

## 4. Szczegóły komponentów

### MembersContainer
- **Opis:** Główny komponent zarządzający stanem i pobieraniem danych dla całego widoku.
- **Główne elementy:** `MembersHeader`, `MembersList`, `Skeleton` (podczas ładowania).
- **Obsługiwane interakcje:** Inicjalizacja pobierania danych, obsługa paginacji.
- **Typy:** `GroupMemberDTO[]`, `PaginatedResponse<GroupMemberDTO>`.

### MembersList
- **Opis:** Komponent odpowiedzialny za renderowanie listy członków podzielonej na sekcje (Administratorzy, Członkowie).
- **Główne elementy:** Iteracja po `MemberCard`, Separatory sekcji.
- **Propsy:** `members: GroupMemberDTO[]`, `currentUserId: string`, `isAdmin: boolean`.

### MemberCard
- **Opis:** Karta pojedynczego członka grupy.
- **Główne elementy:** Avatar (inicjały imienia), Imię użytkownika (np. "Anna"), Podpis dzieci (np. "Rodzic: Staś, Ania"), Rola (Badge), Data dołączenia.
- **Obsługiwane interakcje:** Otwarcie dialogu kontaktu, otwarcie menu akcji.
- **Propsy:** `member: GroupMemberDTO`, `isCurrentUser: boolean`, `canManage: boolean` (czy aktualny użytkownik jest adminem).

### AdminContactDialog
- **Opis:** Dialog typu "reveal" wyświetlający adres email administratora.
- **Główne elementy:** Nagłówek, tekst informacyjny, wyświetlany email, przycisk "Kopiuj email".
- **Obsługiwana walidacja:** Email jest pobierany z API dopiero po kliknięciu (nie jest dostępny w liście członków).
- **Typy:** `AdminContactDTO`.

### AdminActions & DeleteMemberDialog
- **Opis:** Menu akcji (trzy kropki) dla administratora oraz dialog potwierdzenia usunięcia.
- **Obsługiwane interakcje:** Wybranie "Usuń z grupy", potwierdzenie w AlertDialog.
- **Obsługiwana walidacja:** Administrator nie może usunąć samego siebie przez ten widok (opcja ukryta). API blokuje usunięcie ostatniego administratora.

## 5. Typy

### Model Widoku (ViewModel)
Większość danych pochodzi bezpośrednio z DTO, ale pomocne będą dodatkowe pola obliczeniowe:

```typescript
// Rozszerzenie GroupMemberDTO dla potrzeb UI
export interface MemberViewModel extends GroupMemberDTO {
    initials: string;       // Inicjały z firstName
    displayName: string;    // firstName
    childrenLabel: string;  // "Rodzic: [Lista Dzieci]"
    isSelf: boolean;        // Czy to aktualnie zalogowany użytkownik
}
```

### DTO (istniejące w src/types.ts i src/lib/schemas.ts)
- `GroupMemberDTO`: `userId`, `firstName`, `role`, `joinedAt`, `childrenNames`.
- `AdminContactDTO`: `userId`, `email`, `childrenNames`.

## 6. Zarządzanie stanem
- **Dane serwerowe:** Wykorzystanie TanStack Query poprzez istniejący hook `useMembers(groupId)`.
- **Reveal kontaktu:** Customowy hook `useAdminContact(groupId)` lub bezpośrednie wywołanie query w `AdminContactDialog` z `enabled: false` (wyzwalane ręcznie).
- **Stan UI:** `useState` do zarządzania otwartymi dialogami i wybranym członkiem do usunięcia.

## 7. Integracja API
Wykorzystanie istniejących punktów końcowych poprzez `GroupsService` i akcje API:
- `GET /api/groups/[groupId]/members` - Lista członków (paginowana).
- `GET /api/groups/[groupId]/members/admin-contact` - Email administratora (wymaga członkostwa).
- `DELETE /api/groups/[groupId]/members/[userId]` - Usunięcie członka (wymaga uprawnień admina lub bycia tym użytkownikiem).

## 8. Interakcje użytkownika
1. **Przeglądanie listy:** Automatyczne pobieranie członków przy wejściu na stronę. Sortowanie: Admini na górze, potem pozostali chronologicznie/alfabetycznie.
2. **Kontakt z adminem:** Kliknięcie "Pokaż kontakt" przy adminie -> Wywołanie API -> Wyświetlenie Dialogu z emailem.
3. **Kopiowanie emaila:** Kliknięcie "Kopiuj" w dialogu -> `navigator.clipboard.writeText` -> Toast z potwierdzeniem.
4. **Usuwanie członka (Admin):** Kliknięcie "..." -> "Usuń" -> Potwierdzenie w Dialogu -> Wywołanie DELETE -> Odświeżenie listy (invalidacja cache) -> Toast.

## 9. Warunki i walidacja
- **Uprawnienia:** Przycisk usuwania widoczny tylko dla administratorów przy innych członkach.
- **Ostatni Admin:** Blokada UI/API przed usunięciem ostatniego admina (komunikat błędu 409).
- **Prywatność:** Adresy email nie są zwracane w zbiorczym endpoincie `/members`. Pobierane są tylko na żądanie dla administratorów.

## 10. Obsługa błędów
- **Błąd ładowania listy:** Wyświetlenie `Alert` z informacją o błędzie i przyciskiem "Ponów".
- **Błąd usunięcia:** Toast z informacją o przyczynie (np. "Nie masz uprawnień", "Nie można usunąć ostatniego admina").
- **Błąd pobrania kontaktu:** Informacja wewnątrz dialogu o problemie z pobraniem danych.

## 11. Kroki implementacji
1. **Przygotowanie hooków:** Sprawdzenie/rozszerzenie `useMembers` o obsługę `getAdminContact` (jeśli nie istnieje w hooku).
2. **Budowa komponentów UI:** Implementacja `MemberCard` z wykorzystaniem Shadcn UI (Avatar, Badge).
3. **Implementacja dialogu kontaktu:** Stworzenie `AdminContactDialog` z logiką pobierania emaila "on demand".
4. **Implementacja moderacji:** Dodanie `DeleteMemberDialog` i integracja z mutacją `removeMember` w `useMembers`.
5. **Strona Astro:** Utworzenie pliku `src/pages/groups/[groupId]/members.astro` i osadzenie `MembersContainer`.
6. **Testy:** Weryfikacja RLS i uprawnień admina (czy członek nie widzi opcji usuwania).
