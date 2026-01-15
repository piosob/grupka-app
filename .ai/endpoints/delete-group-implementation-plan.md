# API Endpoint Implementation Plan: DELETE /api/groups/:groupId/members/:userId

## 1. Przegląd punktu końcowego

Punkt końcowy umożliwia usunięcie członka z grupy. Operacja może być wykonana przez administratora grupy (usunięcie innego członka) lub przez samego użytkownika (dobrowolne opuszczenie grupy). Proces obejmuje również automatyczne usunięcie profilów dzieci użytkownika przypisanych do tej konkretnej grupy.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/groups/[groupId]/members/[userId]`
- **Parametry ścieżki**:
    - `groupId` (wymagany, UUID): Identyfikator grupy.
    - `userId` (wymagany, UUID): Identyfikator użytkownika do usunięcia.

## 3. Wykorzystywane typy

- `ApiErrorResponse` (z `src/lib/schemas.ts`): Standardowy format błędów.
- `NotFoundError`, `ForbiddenError`, `ConflictError` (z `src/lib/errors.ts`): Wyjątki biznesowe.

## 4. Szczegóły odpowiedzi

- **204 No Content**: Sukces, użytkownik został usunięty.
- **400 Bad Request**: Nieprawidłowy format parametrów (np. nie-UUID).
- **401 Unauthorized**: Użytkownik nie jest uwierzytelniony.
- **403 Forbidden**: Brak uprawnień do usunięcia członka (nie jest adminem i nie usuwa samego siebie).
- **404 Not Found**: Grupa lub członek nie istnieje.
- **409 Conflict**: Nie można usunąć ostatniego administratora grupy.

## 5. Przepływ danych

1. **Warstwa API (`[userId].ts`)**:
    - Walidacja `groupId` i `userId` za pomocą `z.string().uuid()`.
    - Pobranie `user.id` z `locals.supabase.auth.getUser()`.
    - Wywołanie `GroupsService.removeMember`.
2. **Warstwa Serwisu (`GroupsService`)**:
    - Sprawdzenie roli użytkownika wykonującego żądanie (`requesterId`) w grupie.
    - Sprawdzenie roli usuwanego użytkownika (`targetUserId`) w grupie.
    - **Weryfikacja uprawnień**:
        - Jeśli `requesterId !== targetUserId` oraz `requester.role !== 'admin'`, rzuć `ForbiddenError`.
    - **Weryfikacja ostatniego admina**:
        - Jeśli `targetUser.role === 'admin'`:
            - Policz administratorów w grupie.
            - Jeśli count == 1, rzuć `ConflictError`.
    - **Czyszczenie danych**:
        - Usuń dzieci użytkownika w tej grupie (`DELETE FROM children WHERE group_id = groupId AND parent_id = targetUserId`).
        - Usuń członkostwo (`DELETE FROM group_members WHERE group_id = groupId AND user_id = targetUserId`).

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: Wymagany aktywny token sesji.
- **Autoryzacja**: Logika biznesowa blokuje nieautoryzowane usunięcia.
- **Integracja danych**: Usunięcie dzieci zapobiega pozostawianiu rekordów, do których nikt nie ma dostępu.

## 7. Obsługa błędów

- Mapowanie `ConflictError` na status 409.
- Mapowanie `ForbiddenError` na status 403.
- Mapowanie `NotFoundError` na status 404.
- Logowanie błędów 500 do konsoli serwera.

## 8. Etapy wdrożenia

1. **Modyfikacja `GroupsService`** (`src/lib/services/groups.service.ts`):
    - Dodanie metody `removeMember(requesterId, groupId, targetUserId)`.
    - Implementacja logiki sprawdzającej uprawnienia i ostatniego admina.
2. **Utworzenie endpointu API** (`src/pages/api/groups/[groupId]/members/[userId].ts`):
    - Implementacja handlera `DELETE`.
    - Integracja z `GroupsService`.
3. **Testy**:
    - Scenariusz: Członek opuszcza grupę (204).
    - Scenariusz: Admin usuwa członka (204).
    - Scenariusz: Ostatni admin próbuje wyjść (409).
    - Scenariusz: Nie-admin usuwa innego członka (403).
