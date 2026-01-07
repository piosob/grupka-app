# Plan implementacji widoku Generowania Kodów Zaproszenia

## 1. Przegląd

Widok Generowania Kodów Zaproszenia umożliwia administratorom grupy tworzenie tymczasowych (60-minutowych) kodów zaproszeń, przeglądanie aktywnych kodów z dynamicznym licznikiem czasu, kopiowanie ich, udostępnianie oraz usuwanie. Celem widoku jest zapewnienie bezpiecznego i wygodnego sposobu zapraszania nowych członków do grupy.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/groups/:groupId/invite`, gdzie `:groupId` to unikalny identyfikator grupy.

## 3. Struktura komponentów

```
InviteView (Astro Page)
├── MainLayout (Astro Layout)
│   └── BackButton (Astro/React)
└── InviteContainer (React)
    ├── PageHeader (React)
    ├── InviteCodeGenerator (React)
    │   └── Button (Shadcn/ui)
    ├── ActiveInviteCodeList (React)
    │   └── InviteCodeCard (React) (mapowane dla każdego kodu)
    │       ├── CodeDisplay (text/div)
    │       ├── CountdownTimer (text/span)
    │       └── ActionButtons (div)
    │           ├── Button (Shadcn/ui, Copy)
    │           ├── Button (Shadcn/ui, Share)
    │           └── Button (Shadcn/ui, Delete)
    └── EmptyState (React)
        └── Text (Shadcn/ui)
```

## 4. Szczegóły komponentów

### InviteView (Astro Page)

- **Opis komponentu:** Główna strona Astro, odpowiedzialna za ładowanie danych po stronie serwera, przekazywanie `groupId` do komponentu React `InviteContainer` oraz renderowanie ogólnego layoutu (`MainLayout`).
- **Główne elementy:** Importuje `MainLayout` i dynamicznie renderuje komponent `InviteContainer` (client-side hydration).
- **Obsługiwane interakcje:** Brak bezpośrednich.
- **Obsługiwana walidacja:** Sprawdzenie, czy `Astro.locals.user` istnieje; jeśli nie, przekierowanie do `/login`.
- **Typy:** `groupId: string`.
- **Propsy:** Brak, `groupId` pobierane z `Astro.params`.

### InviteContainer (React Component)

- **Opis komponentu:** Główny kontener React, który zarządza logiką biznesową widoku. Odpowiada za pobieranie listy kodów zaproszeń za pomocą TanStack Query, zarządzanie mutacjami (generowanie, usuwanie) oraz obsługę stanów ładowania i błędów. Koordynuje renderowanie `PageHeader`, `InviteCodeGenerator`, `ActiveInviteCodeList` lub `EmptyState`.
- **Główne elementy:** `div` jako główny kontener. Komponenty dzieci: `PageHeader`, `InviteCodeGenerator`, `ActiveInviteCodeList` (lub `EmptyState`).
- **Obsługiwane interakcje:**
    - Wywołanie `onGenerateInvite` (po kliknięciu przycisku w `InviteCodeGenerator`).
    - Wywołanie `onDeleteInvite` (po kliknięciu przycisku w `InviteCodeCard`).
- **Obsługiwana walidacja:** Weryfikacja dostępu admina odbywa się po stronie API. UI reaguje na błędy 403 (Forbidden).
- **Typy:** `GroupInviteViewModel[]`.
- **Propsy:**
    - `groupId: string`

### PageHeader (React Component)

- **Opis komponentu:** Prosty komponent do wyświetlania nagłówka strony i krótkiego tekstu pomocniczego.
- **Główne elementy:** `h1` dla tytułu, `p` dla tekstu pomocniczego.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### InviteCodeGenerator (React Component)

- **Opis komponentu:** Zawiera przycisk "Generuj nowy kod", który po kliknięciu wywołuje funkcję generowania kodu. Obsługuje stan ładowania przycisku.
- **Główne elementy:** Komponent `Button` ze Shadcn/ui.
- **Obsługiwane interakcje:** `onClick` wywołuje prop `onGenerateInvite`.
- **Obsługiwana walidacja:** Brak (walidacja dostępu admina po stronie API).
- **Typy:** Brak.
- **Propsy:**
    - `onGenerateInvite: () => void`
    - `isGenerating: boolean`

### ActiveInviteCodeList (React Component)

- **Opis komponentu:** Odpowiada za renderowanie listy komponentów `InviteCodeCard` dla każdego aktywnego kodu zaproszenia. Zarządza odświeżaniem listy po wygaśnięciu kodów.
- **Główne elementy:** `div` lub `ul` jako kontener listy. Mapuje `GroupInviteViewModel[]` do `InviteCodeCard`.
- **Obsługiwane interakcje:** Przekazuje `onDeleteInvite` do `InviteCodeCard`.
- **Obsługiwana walidacja:** Renderuje się tylko, gdy lista kodów nie jest pusta.
- **Typy:** `GroupInviteViewModel[]`.
- **Propsy:**
    - `invites: GroupInviteViewModel[]`
    - `onDeleteInvite: (code: string) => void`

### InviteCodeCard (React Component)

- **Opis komponentu:** Wyświetla pojedynczy kod zaproszenia, dynamiczny licznik czasu do wygaśnięcia z różnymi kolorami w zależności od pozostałego czasu oraz przyciski akcji (Kopiuj, Udostępnij, Usuń). Zarządza logiką countdownu i kolorowania.
- **Główne elementy:** Komponent `Card` ze Shadcn/ui, `div` dla kodu, `span` dla licznika, `div` dla przycisków akcji (`Button` ze Shadcn/ui).
- **Obsługiwane interakcje:**
    - `onClick` na "Kopiuj kod": Kopiuje kod do schowka, wyświetla toast.
    - `onClick` na "Udostępnij": Wywołuje Native Share API lub kopiuje do schowka.
    - `onClick` na "Usuń kod": Wywołuje prop `onDeleteInvite`.
- **Obsługiwana walidacja:** Kod musi być aktywny (nie wygasły).
- **Typy:** `GroupInviteViewModel`.
- **Propsy:**
    - `invite: GroupInviteViewModel`
    - `onDeleteInvite: (code: string) => void`

### EmptyState (React Component)

- **Opis komponentu:** Komponent wyświetlany, gdy brak aktywnych kodów zaproszeń. Zawiera komunikaty informacyjne.
- **Główne elementy:** `div` lub `p` z tekstem.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

## 5. Typy

### `GroupInviteListItemDTO` (z `src/lib/schemas.ts` przez `src/types.ts`)

- Reprezentuje podstawowe dane kodu zaproszenia zwracane przez `GET /api/groups/:groupId/invites`.
- **Pola:**
    - `id: string` - Unikalny identyfikator zaproszenia.
    - `code: string` - Sam kod zaproszenia.
    - `expiresAt: string` - Data i czas wygaśnięcia kodu w formacie ISO.
    - `createdAt: string` - Data i czas utworzenia kodu w formacie ISO.

### `GroupInviteDTO` (z `src/lib/schemas.ts` przez `src/types.ts`)

- Reprezentuje pojedynczy, nowo utworzony kod zaproszenia zwracany przez `POST /api/groups/:groupId/invites`.
- **Pola:**
    - `id: string`
    - `code: string`
    - `expiresAt: string`
    - `createdAt: string`

### `GroupInviteViewModel` (Nowy, niestandardowy typ dla UI)

- Rozszerza `GroupInviteListItemDTO` o pola potrzebne do dynamicznego wyświetlania w UI, w szczególności do obsługi countdownu i kolorowania.
- **Pola:**
    - `id: string` (z `GroupInviteListItemDTO`)
    - `code: string` (z `GroupInviteListItemDTO`)
    - `expiresAt: string` (z `GroupInviteListItemDTO`)
    - `createdAt: string` (z `GroupInviteListItemDTO`)
    - `remainingSeconds: number` - Obliczony czas pozostały do wygaśnięcia w sekundach.
    - `isExpired: boolean` - Flaga wskazująca, czy kod wygasł.
    - `countdownText: string` - Sformatowany tekst countdownu, np. "Wygasa za: 45 min 23 sek".
    - `countdownColor: 'green' | 'yellow' | 'red'` - Kolor dla wyświetlanego countdownu (zielony >30min, żółty 10-30min, czerwony <10min).

## 6. Zarządzanie stanem

Zarządzanie stanem będzie odbywać się głównie w komponencie `InviteContainer` przy użyciu TanStack Query do obsługi danych pobieranych z API oraz customowych hooków Reacta.

- **`useInvites(groupId: string)` (Custom Hook):**
    - Będzie odpowiedzialny za pobieranie, generowanie i usuwanie kodów zaproszeń.
    - Wykorzysta `useQuery` dla `GET /api/groups/:groupId/invites` do pobierania listy kodów.
    - Wykorzysta `useMutation` dla `POST /api/groups/:groupId/invites` do generowania nowych kodów.
    - Wykorzysta `useMutation` dla `DELETE /api/groups/:groupId/invites/:code` do usuwania kodów.
    - Będzie zarządzać stanami ładowania (`isLoadingInvites`, `isGeneratingInvite`) i błędów.
    - Po mutacjach (generowanie, usuwanie), hook unieważni zapytanie o listę kodów, wymuszając odświeżenie danych.
- **`useCountdown(expiresAt: string)` (Custom Hook):**
    - Będzie używany w komponencie `InviteCodeCard` do zarządzania dynamicznym odliczaniem czasu.
    - `remainingSeconds` będzie aktualizowany co sekundę za pomocą `setInterval`.
    - Hook będzie obliczał `countdownText` i `countdownColor` oraz flagę `isExpired`.
    - Automatycznie usunie kartę kodu z listy, gdy `isExpired` stanie się `true` (na poziomie `ActiveInviteCodeList`).

## 7. Integracja API

Integracja z API będzie realizowana za pomocą TanStack Query w customowym hooku `useInvites`.

- **Pobieranie kodów zaproszeń:**
    - **Metoda:** `GET`
    - **Endpoint:** `/api/groups/:groupId/invites`
    - **Typ odpowiedzi:** `GroupInviteListItemDTO[]`
    - **Akcja:** Wywołane automatycznie przez `useQuery` przy montowaniu `InviteContainer` i po unieważnieniu zapytania.
- **Generowanie nowego kodu zaproszenia:**
    - **Metoda:** `POST`
    - **Endpoint:** `/api/groups/:groupId/invites`
    - **Typ żądania:** Brak (groupId pobierane z URL).
    - **Typ odpowiedzi:** `GroupInviteDTO`
    - **Akcja:** Wywołane przez `mutate` z `useMutation` po kliknięciu przycisku "Generuj nowy kod".
- **Usuwanie kodu zaproszenia:**
    - **Metoda:** `DELETE`
    - **Endpoint:** `/api/groups/:groupId/invites/:code`
    - **Typ żądania:** Brak (groupId i code pobierane z URL).
    - **Typ odpowiedzi:** `204 No Content`
    - **Akcja:** Wywołane przez `mutate` z `useMutation` po kliknięciu przycisku "Usuń kod".

## 8. Interakcje użytkownika

- **Generowanie nowego kodu:** Użytkownik klika przycisk "Generuj nowy kod". Aplikacja wysyła żądanie do API, wyświetla komunikat "Kod wygenerowany!" (Toast) i dodaje nowy kod do listy.
- **Kopiowanie kodu:** Użytkownik klika przycisk "Kopiuj kod". Kod jest kopiowany do schowka, wyświetlany jest komunikat "Kod skopiowany!" (Toast), a także może wystąpić haptic feedback na urządzeniach mobilnych.
- **Udostępnianie kodu:** Użytkownik klika przycisk "Udostępnij". Na urządzeniach mobilnych zostanie uruchomione Native Share API z predefiniowanym tekstem. Jeśli Native Share API jest niedostępne, nastąpi fallback do kopiowania kodu do schowka.
- **Usuwanie kodu:** Użytkownik klika przycisk "Usuń kod". Aplikacja wysyła żądanie do API o usunięcie kodu, wyświetla komunikat "Kod usunięty!" (Toast) i usuwa kod z listy.
- **Obserwowanie licznika:** Countdown timer dynamicznie odlicza czas do wygaśnięcia kodu, zmieniając kolory (zielony, żółty, czerwony) w zależności od pozostałego czasu.
- **Automatyczne usuwanie wygasłych kodów:** Kody, które wygasły, są automatycznie usuwane z widoku listy.

## 9. Warunki i walidacja

- **Autoryzacja (Admin):**
    - **Warunek:** Tylko użytkownicy z rolą administratora mogą uzyskać dostęp do tego widoku i wykonywać operacje na kodach zaproszeń.
    - **Walidacja UI:** Komponent `InviteView` wstępnie sprawdzi, czy użytkownik jest zalogowany. Ostateczna walidacja uprawnień odbywa się po stronie API. W przypadku błędu 403 (Forbidden) z API, `InviteContainer` wyświetli odpowiedni komunikat.
- **Identyfikator grupy (`groupId`):**
    - **Warunek:** `groupId` musi być obecne w ścieżce URL.
    - **Walidacja UI:** `InviteView` pobiera `groupId` z `Astro.params`. Brak `groupId` skutkuje błędem 400 z API.
- **Kod zaproszenia (`code`):**
    - **Warunek:** Dla operacji `DELETE`, kod zaproszenia musi być obecny w ścieżce URL.
    - **Walidacja UI:** Komponent `InviteCodeCard` przekazuje `code` do funkcji `onDeleteInvite`. Brak `code` skutkuje błędem 400 z API.
- **Wygaśnięcie kodu:**
    - **Warunek:** Kody zaproszeń są ważne przez 60 minut.
    - **Walidacja UI:** Hook `useCountdown` w `InviteCodeCard` monitoruje czas do wygaśnięcia i ustawia flagę `isExpired`. Lista kodów (`ActiveInviteCodeList`) filtruje i usuwa wygasłe kody z widoku.
- **Ograniczenie liczby kodów (Rate Limiting):**
    - **Warunek:** Backend może narzucić limit na liczbę generowanych kodów (np. max 5 na godzinę).
    - **Walidacja UI:** W przypadku otrzymania błędu 429 (Too Many Requests), `InviteContainer` wyświetli odpowiedni Toast Notification.

## 10. Obsługa błędów

- **Błędy autoryzacji/autentykacji (401 Unauthorized, 403 Forbidden):**
    - Dla 401: Przekierowanie użytkownika do strony logowania.
    - Dla 403: Wyświetlenie Toast Notification "Brak uprawnień do zarządzania kodami zaproszeń".
- **Błędy walidacji (400 Bad Request):**
    - Wyświetlenie szczegółowego komunikatu o błędzie (np. "Brak identyfikatora grupy") za pomocą Toast Notification.
- **Kod nie znaleziony (404 Not Found dla DELETE):**
    - Wyświetlenie Toast Notification "Kod zaproszenia nie istnieje lub już wygasł". Odświeżenie listy kodów.
- **Błędy serwera (500 Internal Server Error):**
    - Wyświetlenie ogólnego komunikatu "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później." za pomocą Toast Notification.
- **Błędy sieciowe/inne:**
    - TanStack Query automatycznie zarządza ponownymi próbami. W przypadku trwałego błędu, wyświetlenie ogólnego komunikatu o problemach z siecią.
- **Błędy operacji UI (np. kopiowanie):**
    - Wyświetlenie Toast Notification "Nie udało się skopiować kodu" lub "Nie udało się udostępnić kodu".

## 11. Kroki implementacji

1.  **Zdefiniuj typ `GroupInviteViewModel`** w `src/types.ts` lub dedykowanym pliku dla ViewModeli.
2.  **Utwórz custom hook `useCountdown`** (w `src/lib/hooks/useCountdown.ts`) do zarządzania logiką odliczania czasu w komponencie `InviteCodeCard`.
3.  **Utwórz custom hook `useInvites`** (w `src/lib/hooks/useInvites.ts`) do integracji z API kodów zaproszeń za pomocą TanStack Query (`useQuery`, `useMutation`). Obsłuż stany ładowania i błędów, oraz unieważnianie cache'u po mutacjach.
4.  **Wykorzystaj istniejące komponenty Shadcn/ui**, np. `Button`, `Card`, `Toast`, `Tooltip`.
5.  **Utwórz komponent `InviteCodeCard.tsx` (React)**:
    - Przyjmuj `invite: GroupInviteViewModel` i `onDeleteInvite` jako propsy.
    - Wykorzystaj `useCountdown` do wyświetlania czasu i kolorowania.
    - Zaimplementuj logikę kopiowania kodu (Clipboard API, haptic feedback) i udostępniania (Native Share API z fallbackiem).
6.  **Utwórz komponent `ActiveInviteCodeList.tsx` (React)**:
    - Przyjmuj `invites: GroupInviteViewModel[]` i `onDeleteInvite` jako propsy.
    - Renderuj listę `InviteCodeCard`.
    - Zaimplementuj logikę automatycznego usuwania wygasłych kodów z listy.
7.  **Utwórz komponent `InviteCodeGenerator.tsx` (React)**:
    - Przyjmuj `onGenerateInvite` i `isGenerating` jako propsy.
    - Zawieraj przycisk "Generuj nowy kod" i obsługuj stan ładowania.
8.  **Utwórz komponent `EmptyState.tsx` (React)**:
    - Wyświetlaj komunikaty o braku aktywnych kodów.
9.  **Utwórz komponent `PageHeader.tsx` (React)**:
    - Wyświetlaj tytuł "Kody zaproszenia" i tekst pomocniczy.
10. **Utwórz komponent `InviteContainer.tsx` (React)**:
    - Przyjmuj `groupId: string` jako props.
    - Wykorzystaj `useInvites` do zarządzania stanem listy kodów.
    - Warunkowo renderuj `ActiveInviteCodeList` lub `EmptyState` na podstawie danych.
    - Przekaż `onGenerateInvite` i `onDeleteInvite` do odpowiednich komponentów dzieci.
    - Obsłuż błędy z API za pomocą Toast Notifications.
11. **Utwórz stronę Astro `invite.astro`** (w `src/pages/groups/[groupId]/invite.astro`):
    - Pobierz `groupId` z `Astro.params`.
    - Sprawdź autoryzację użytkownika (admin) i przekieruj, jeśli to konieczne.
    - Renderuj `MainLayout` i komponent `InviteContainer` (client-side hydration).
12. **Zaktualizuj `src/lib/services/groups.service.ts`** o metody `getInvites`, `createInvite` i `revokeInvite` (jeśli jeszcze nie istnieją), które będą komunikować się z bazą danych Supabase.
13. **Przetestuj widok** pod kątem funkcjonalności, responsywności, obsługi błędów i dostępności.
