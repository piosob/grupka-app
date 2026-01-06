# Plan implementacji widoku Hub Grupy (Group Hub)

## 1. Przegląd
Hub Grupy (`/groups/:groupId`) to główna strona "rozbiegowa" dla kontekstu grupy. Jej celem jest dostarczenie użytkownikowi szybkiego podglądu tego, co dzieje się w grupie (Glanceable Hub) oraz zapewnienie intuicyjnej nawigacji do szczegółowych sekcji.

## 2. Routing widoku
- **Ścieżka:** `/groups/:groupId`
- **Dostępność:** Tylko dla członków danej grupy (chronione przez middleware i RLS).

## 3. Struktura komponentów
```
GroupHubPage (Astro)
└── GroupHubContainer (React, "use client")
    ├── GroupHeader
    │   ├── GroupTitle & RoleBadge
    │   └── AdminContactCard (Reveal logic)
    ├── LaunchpadGrid (Siatka aktywnych kafli)
    │   ├── EventsTile (Skrót najbliższego wydarzenia)
    │   ├── ChildrenTile (Twoje dzieci + statystyki)
    │   └── MembersTile (Statystyki członków)
    └── AdminActionsSection (Tylko dla adminów)
        ├── InviteButton -> /groups/:groupId/invite
        └── SettingsButton -> /groups/:groupId/settings
```

## 4. Szczegóły komponentów

### AdminContactCard (React)
- **Opis:** Mała karta z informacją o adminie.
- **Interakcja:** Kliknięcie "Pokaż kontakt" otwiera dialog/popover z adresem e-mail (zgodnie z US-005).

### LaunchpadTile (React)
- **Opis:** Generyczny komponent kafla nawigacyjnego.
- **Propsy:** `title`, `icon`, `href`, `summaryText`, `badge?`.
- **Warianty:** 
    - **Wydarzenia:** Link do `/events`, pokazuje datę najbliższych urodzin.
    - **Dzieci:** Link do `/children`, pokazuje listę Twoich dzieci w grupie.
    - **Członkowie:** Link do `/members`, pokazuje łączną liczbę osób.

## 5. Integracja API
- **Endpoint:** `GET /api/groups/:groupId/summary` (nowy endpoint lub rozszerzony `GET /api/groups/:groupId`).
- **Response:** `GroupSummaryDTO` zawierający:
    - Podstawowe info o grupie i Twojej roli.
    - Dane admina (display_name).
    - Najbliższe wydarzenie (EventListItemDTO).
    - Listę Twoich dzieci w tej grupie (ChildListItemDTO[]).
    - Statystyki (counts).

## 6. Kroki implementacji
1. Stworzenie `src/pages/groups/[groupId]/index.astro`.
2. Implementacja `GroupHubContainer` i kafli `LaunchpadTile`.
3. Dodanie logiki reveal email dla kontaktu z adminem.
4. Obsługa uprawnień (sprawdzenie członkostwa).
5. Szlifowanie UX dla Mobile First (duże pola dotykowe).

