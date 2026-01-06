# Plan implementacji widoku Dołączanie do Grupy

## 1. Przegląd

Widok `/join` pozwala użytkownikowi dołączyć do istniejącej grupy przy użyciu 8-znakowego kodu zaproszenia.

## 2. Routing widoku

- **Ścieżka:** `/join`
- **Dostępność:** Tylko dla zalogowanych użytkowników (jeśli niezalogowany, redirect do login z zachowaniem kodu w URL).

## 3. Struktura komponentów

```
JoinGroupPage (Astro)
└── JoinGroupForm (React, "use client")
    ├── Heading ("Dołącz do grupy")
    ├── CodeInput (Input na kod zaproszenia)
    └── SubmitButton ("Dołącz")
```

## 4. Szczegóły komponentów

### JoinGroupForm

- **Input:** Automatyczne zamienianie na wielkie litery, usuwanie spacji.
- **Walidacja:** Kod 8-znakowy, alfanumeryczny.

## 5. Integracja API

- **Endpoint:** `POST /api/invites/join`
- **Payload:** `JoinGroupCommand { code: string }`
- **Sukces:** Toast z sukcesem + redirect do Hubu Grupy `/groups/:groupId`.

## 6. Kroki implementacji

1. Stworzenie `src/pages/join.astro`.
2. Implementacja `JoinGroupForm`.
3. Obsługa specyficznych błędów (kod wygasł, kod nieistniejący).
