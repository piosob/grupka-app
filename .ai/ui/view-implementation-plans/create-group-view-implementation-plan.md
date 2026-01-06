# Plan implementacji widoku Tworzenie Grupy

## 1. Przegląd

Widok `/groups/new` służy do utworzenia nowej grupy. Kluczowym elementem jest poinformowanie użytkownika, że jako administrator jego adres e-mail będzie widoczny dla członków grupy w celach organizacyjnych (zgodnie z US-002).

## 2. Routing widoku

- **Ścieżka:** `/groups/new`
- **Dostępność:** Tylko dla zalogowanych użytkowników.

## 3. Struktura komponentów

```
CreateGroupPage (Astro)
└── CreateGroupForm (React, "use client")
    ├── Heading ("Utwórz nową grupę")
    ├── NameInput (Nazwa grupy)
    ├── PrivacyAlert (Informacja o widoczności e-maila)
    └── SubmitButton ("Utwórz grupę")
```

## 4. Szczegóły komponentów

### CreateGroupForm

- **Opis:** Formularz z walidacją Zod.
- **PrivacyAlert:** Komponent Alert (Shadcn/ui) z ikoną info i tekstem: _"Jako administrator, Twój email będzie dostępny dla członków w celach organizacyjnych (domyślnie ukryty, widoczny po kliknięciu)"_.
- **Walidacja:** Nazwa grupy (3-100 znaków).

## 5. Integracja API

- **Endpoint:** `POST /api/groups`
- **Payload:** `CreateGroupCommand { name: string }`
- **Sukces:** Redirect do Hubu Grupy `/groups/:groupId`.

## 6. Kroki implementacji

1. Stworzenie `src/pages/groups/new.astro`.
2. Implementacja `CreateGroupForm` w React.
3. Dodanie walidacji i obsługi błędów.
4. Testy przekierowania po sukcesie.
