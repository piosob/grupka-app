# Plan implementacji widoku Generowanie Kodów Zaproszenia

## 1. Przegląd
Widok `/groups/:groupId/invite` jest dostępny tylko dla administratorów grupy. Pozwala na generowanie tymczasowych (60 min) kodów zaproszenia.

## 2. Routing widoku
- **Ścieżka:** `/groups/:groupId/invite`
- **Dostępność:** Tylko dla administratorów danej grupy.

## 3. Struktura komponentów
```
InvitePage (Astro)
└── InviteContainer (React)
    ├── Header (Przycisk "Generuj nowy kod")
    └── ActiveCodesList
        └── InviteCodeCard (Z timerem countdown)
```

## 4. Szczegóły komponentów
### InviteCodeCard
- **Opis:** Wyświetla kod, czas do wygaśnięcia i opcje kopiowania/udostępniania.
- **Interakcja:** Copy to clipboard, Web Share API.
- **Timer:** Live update co sekundę.

## 5. Integracja API
- **Pobieranie:** `GET /api/groups/:groupId/invites`
- **Generowanie:** `POST /api/groups/:groupId/invites`
- **Usuwanie:** `DELETE /api/groups/:groupId/invites/:code`

## 6. Kroki implementacji
1. Stworzenie `src/pages/groups/[groupId]/invite.astro`.
2. Implementacja komponentu `InviteCodeCard` z logicznym timerem.
3. Integracja z API i obsługą uprawnień (403 dla nie-adminów).

