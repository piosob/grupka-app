# Plan implementacji sekcji Dzieci

## 1. Przegląd

Sekcja "Dzieci" jest kluczowym elementem aplikacji Grupka, umożliwiającym rodzicom zarządzanie profilami swoich dzieci w ramach grup przedszkolnych lub szkolnych. Głównym celem jest stworzenie bazy dzieci, która ułatwia organizację wydarzeń (np. urodzin) oraz wymianę informacji o zainteresowaniach i pomysłach na prezenty. Sekcja ta wyróżnia się wykorzystaniem AI (Magic Wand) do generowania opisów (bio) na podstawie luźnych notatek rodzica.

## 2. Routing widoku

- `/groups/[groupId]/children` – Lista wszystkich dzieci w grupie.
- `/groups/[groupId]/children/new` – Formularz dodawania nowego profilu dziecka.
- `/groups/[groupId]/children/[childId]` – Widok szczegółowy profilu dziecka (tylko do odczytu dla innych, z opcjami akcji dla rodzica).
- `/groups/[groupId]/children/[childId]/edit` – Formularz edycji profilu dziecka (dostępny tylko dla rodzica).

## 3. Struktura komponentów

Widok jest zorganizowany w hierarchię komponentów React, osadzonych w layoutach Astro.

- `ChildrenContainer` (Główny kontener listy)
    - `PageHeader` (Nagłówek z przyciskiem dodawania)
    - `ChildrenList` (Grid z kartami)
        - `ChildProfileCard` (Karta pojedynczego dziecka)
    - `EmptyState` (Widok przy braku danych)
- `ChildDetailContainer` (Kontener szczegółów)
    - `ChildHeroSection` (Avatar, imię, wiek)
    - `ChildBioSection` (Opis zainteresowań)
    - `ChildActions` (Przyciski edycji/usuwania dla właściciela)
- `ChildFormContainer` (Kontener formularza Create/Edit)
    - `ChildForm` (Formularz React Hook Form)
        - `MagicWandSection` (Pole bio z integracją AI)
- `DeleteChildDialog` (Dialog potwierdzenia usunięcia)

## 4. Szczegóły komponentów

### ChildrenContainer

- **Opis:** Zarządza pobieraniem listy dzieci dla danej grupy i obsługuje paginację.
- **Główne elementy:** `PageHeader`, `Input` (search/filter - opcjonalnie), `ChildrenGrid`.
- **Obsługiwane interakcje:** Zmiana strony paginacji, nawigacja do profilu.
- **Typy:** `ChildListItemDTO[]`, `PaginationDTO`.

### ChildProfileCard

- **Opis:** Reprezentuje pojedyncze dziecko na liście.
- **Główne elementy:** Avatar (inicjały + kolor z hash), `DisplayName`, `BirthDate`, `Age`, `ParentInfo`, `OwnershipBadge`.
- **Obsługiwane interakcje:** Kliknięcie w kartę (rozszerzenie bio lub nawigacja), przycisk "Edytuj" (tylko owner).
- **Propsy:** `child: ChildListItemDTO`.

### ChildForm

- **Opis:** Wspólny formularz dla tworzenia i edycji profilu dziecka.
- **Główne elementy:**
    - `Input` (Display Name) - wymagany.
    - `Input` (Birth Date) - type="date".
    - `MagicWandSection` (Bio textarea + przycisk AI).
- **Obsługiwana walidacja:**
    - `displayName`: 1-50 znaków, brak nazwisk (walidacja frontendowa + hint).
    - `bio`: max 1000 znaków.
    - `birthDate`: format YYYY-MM-DD, data nie może być z przyszłości.
- **Typy:** `CreateChildCommand` | `UpdateChildCommand`.

### MagicWandSection

- **Opis:** Specjalna sekcja pola bio z przyciskiem wywołującym AI.
- **Główne elementy:** `Textarea`, przycisk "🪄 Magic Wand", licznik znaków, wskaźnik limitu AI.
- **Obsługiwane interakcje:** Kliknięcie Magic Wand wysyła aktualną treść textarea do API AI i nadpisuje ją wynikiem.
- **Obsługiwana walidacja:** Przycisk zablokowany, jeśli pole notatek jest puste.

## 5. Typy

Wykorzystujemy typy zdefiniowane w `src/types.ts` oraz `src/lib/schemas.ts`:

- `ChildListItemDTO`: Podstawowe dane dziecka na liście (id, displayName, birthDate, isOwner itp.).
- `ChildDetailDTO`: Pełne dane dziecka wraz z informacjami o grupie.
- `CreateChildCommand` / `UpdateChildCommand`: Obiekty przesyłane do API podczas zapisu.
- `MagicWandCommand`: `{ notes: string, childDisplayName?: string }`.
- `MagicWandResponseDTO`: `{ generatedBio: string }`.
- `ViewModel`: `ChildFormValues` – typ dla React Hook Form mapujący komendy na stan formularza.

## 6. Zarządzanie stanem

- **Serwerowy (Server State):** TanStack Query (`useQuery`, `useMutation`) do zarządzania danymi z API i ich cache'owaniem. Klucze: `['groups', groupId, 'children']`, `['children', childId]`.
- **Formularz (Form State):** `react-hook-form` z resolverem `zod` do walidacji.
- **Lokalny (Local UI State):**
    - `isMagicWandLoading`: boolean – stan ładowania generacji AI.
    - `magicWandError`: string | null – obsługa błędów specyficznych dla AI (np. rate limit).
    - `isDeleteDialogOpen`: boolean – sterowanie dialogiem usunięcia.

## 7. Integracja API

Integracja odbywa się poprzez `ChildrenService` oraz `AiService` (frontendowe wrappery nad `fetch` do `/api/*`).

- `GET /api/groups/:groupId/children?limit=20&offset=0` -> `PaginatedResponse<ChildListItemDTO>`
- `POST /api/groups/:groupId/children` -> `SingleResponse<CreateChildResponseDTO>`
- `GET /api/children/:childId` -> `SingleResponse<ChildDetailDTO>`
- `PATCH /api/children/:childId` -> `SingleResponse<UpdateChildResponseDTO>`
- `DELETE /api/children/:childId` -> `204 No Content`
- `POST /api/ai/magic-wand` -> `MagicWandResponseDTO`

## 8. Interakcje użytkownika

1. **Przeglądanie listy:** Użytkownik widzi dzieci w siatce. Karty "moich dzieci" mają wyróżnioną ramkę i badge.
2. **Dodawanie dziecka:** Kliknięcie FAB lub przycisku w nagłówku otwiera formularz.
3. **Użycie Magic Wand:**
    - Użytkownik wpisuje np. "lubi klocki lego, dinozaury, boi się ciemności".
    - Klika "Magic Wand".
    - Przycisk pokazuje spinner, textarea jest read-only.
    - Po chwili treść zostaje zastąpiona sformatowanym opisem: "Krzyś to wielki fan klocków LEGO i dinozaurów. Jest bardzo kreatywny, choć bywa ostrożny w nowych sytuacjach...".
    - Użytkownik może ręcznie poprawić ten tekst.
4. **Usuwanie:** Dostępne tylko w edycji lub szczegółach własnego dziecka. Wymaga potwierdzenia w dialogu.

## 9. Warunki i walidacja

- **Uprawnienia:**
    - Lista/Szczegóły: Widoczne dla wszystkich członków grupy.
    - Edycja/Usuwanie: Przycisk widoczny i akcja dozwolona tylko dla `parentId === currentUserId`.
- **Walidacja pól:**
    - `displayName`: Musi być unikalne w skali grupy (opcjonalnie, zalecane) i nie zawierać nazwisk.
    - `bio`: Max 1000 znaków (licznik w UI).
- **AI Rate Limit:** Jeśli API zwróci 429, UI pokazuje toast z informacją o wyczerpaniu limitu godzinnego (10 użyć).

## 10. Obsługa błędów

- **Błędy sieciowe:** Globalny Toast z informacją o problemie z połączeniem.
- **403 Forbidden:** Przekierowanie do listy dzieci z informacją "Brak uprawnień".
- **404 Not Found:** Widok `EmptyState` lub strona 404 aplikacji.
- **Błędy walidacji (400):** Mapowanie błędów z API na pola formularza w `react-hook-form`.
- **Błąd Magic Wand:** Jeśli AI zawiedzie, zachowujemy oryginalne notatki użytkownika i pokazujemy błąd.

## 11. Kroki implementacji

1. **Przygotowanie Hooków:**
    - Implementacja/aktualizacja `useChildren.ts` (list, get, create, update, delete).
    - Stworzenie `useAi.ts` dla endpointu `magic-wand`.
2. **Komponenty Atomowe:**
    - Implementacja `ChildProfileCard` (layout, avatar, badge).
    - Implementacja `DeleteChildDialog` (Shadcn UI).
3. **Formularz:**
    - Budowa `ChildForm` z integracją `react-hook-form` i `zod`.
    - Dodanie logiki `MagicWandSection`.
4. **Widoki Główne:**
    - Stworzenie strony listy `/groups/[groupId]/children/index.astro` i komponentu `ChildrenContainer`.
    - Stworzenie strony dodawania `/groups/[groupId]/children/new.astro`.
    - Stworzenie strony szczegółów `/groups/[groupId]/children/[childId].astro`.
    - Stworzenie strony edycji `/groups/[groupId]/children/[childId]/edit.astro`.
5. **Polerka UX:**
    - Dodanie Skeletonów dla stanów ładowania.
    - Animacje przejść (framer-motion dla Magic Wand).
    - Toasty po sukcesie operacji.
