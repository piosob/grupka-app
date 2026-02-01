# Plan Testów - Projekt Grupka (MVP)

## 1. Wprowadzenie i cele testowania

Celem niniejszego dokumentu jest zdefiniowanie strategii testowania dla aplikacji **Grupka**, mobilnej platformy do samoorganizacji rodziców. Testy mają na celu zapewnienie wysokiej jakości interakcji mobilnych, bezpieczeństwa danych (izolacja grup) oraz poprawnego działania unikalnych funkcji, takich jak "Surprise Protection".

### Główne cele:

- Weryfikacja szczelności izolacji danych między grupami (RLS).
- Zapewnienie poprawności mechanizmu zaproszeń o ograniczonym czasie trwania.
- Optymalizacja pod kątem wydajności mobilnej (Mobile First).
- Gwarancja prywatności (brak nazwisk, ukryte wątki dla organizatorów).

## 2. Zakres testów

Zakres obejmuje wszystkie funkcjonalności zdefiniowane w MVP:

- Rejestracja i logowanie (Supabase Auth).
- Tworzenie grup i generowanie kodów zaproszeń (TTL 30 min).
- Zarządzanie profilami dzieci wewnątrz grup.
- Tworzenie wydarzeń (urodziny, zbiórki) i wybór gości.
- System komentarzy z mechanizmem "Surprise Protection".

## 3. Typy testów do przeprowadzenia

### 3.1. Testy Jednostkowe (Unit Tests)

- Wykorzystanie **Vitest** jako głównego runnera testów.
- **React Testing Library**: Testowanie interaktywnych komponentów React (`src/components/react/`).
    - _Dlaczego_: Pozwala na weryfikację komponentów z perspektywy użytkownika (np. czy przycisk jest klikalny, czy formularz wyświetla błędy).
    - _Po co_: Gwarancja, że zmiany w kodzie (refaktor) nie zepsują interfejsu widocznego dla rodzica.
- Walidacja schematów Zod (`src/lib/schemas.ts`).
- Logika pomocnicza w `src/lib/utils/`.
- Transformacje danych w serwisach.

### 3.2. Testy Integracyjne

- Weryfikacja integracji z Supabase (czytanie/zapis do bazy).
- Testowanie reguł RLS bezpośrednio na bazie danych przy użyciu **Vitest**.
- Middleware Astro – weryfikacja autoryzacji i przekierowań.

### 3.3. Testy E2E (End-to-End) - ODROCZONE (Release 2.0)

- Pełne ścieżki użytkownika (User Flows) przy użyciu **Playwright**.
- Testowanie na różnych szerokościach ekranu (viewporty mobilne).
- _Uwaga: W obecnej fazie MVP weryfikacja z perspektywy użytkownika odbywa się za pomocą testów integracyjnych w Vitest + React Testing Library._

### 3.4. Testy Wydajnościowe i UX

- Audyty Lighthouse (cel: > 90 w kategoriach Performance i Accessibility).
- Testowanie zachowania aplikacji na wolnych połączeniach (throttling 3G/4G).

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Autentykacja i Dostęp

- **TC-01:** Próba dostępu do `/dashboard` bez zalogowania (oczekiwane: przekierowanie do `/login`).
- **TC-02:** Logowanie z błędnymi danymi (oczekiwane: przyjazny komunikat o błędzie).

### 4.2. Zarządzanie Grupą i Zaproszenia

- **TC-03:** Dołączenie do grupy przy użyciu poprawnego kodu (oczekiwane: dodanie do grupy, dostęp do Hubu).
- **TC-04:** Próba dołączenia przy użyciu kodu, który wygasł (oczekiwane: informacja o wygaśnięciu kodu).
- **TC-05:** Usunięcie członka przez administratora (oczekiwane: natychmiastowa utrata dostępu do grupy przez usuniętego użytkownika).

### 4.3. Wydarzenia i "Surprise Protection"

- **TC-06:** Tworzenie wydarzenia przez rodzica (oczekiwane: poprawne zapisanie w bazie, widoczność dla zaproszonych).
- **TC-07:** Dostęp do komentarzy przez organizatora (oczekiwane: brak możliwości widzenia i dodawania komentarzy w "ukrytym wątku").
- **TC-08:** Dodawanie komentarza przez gościa (oczekiwane: widoczność tylko dla innych gości, nie dla organizatora).

### 4.4. AI Magic Wand

- **TC-09:** Generowanie bio dziecka z notatek (oczekiwane: sformatowana lista propozycji prezentów).
- **TC-10:** Przekroczenie limitu użyć AI (oczekiwane: status 429 i odpowiedni komunikat dla użytkownika).

## 5. Środowisko testowe

- **Local:** Środowisko deweloperskie z lokalnymi zmiennymi `.env`.
- **Staging:** Środowisko przedprodukcyjne (DigitalOcean/Preview Branch).
- **Baza danych:** Instancja Supabase (osobna dla testów E2E).

## 6. Narzędzia do testowania

- **Vitest**: Główny runner do testów jednostkowych i integracyjnych (szybkość i kompatybilność z Vite).
- **jsdom**: Środowisko uruchomieniowe udające przeglądarkę w Node.js, niezbędne do renderowania komponentów React w testach Vitest.
- **React Testing Library**: Biblioteka do testowania komponentów UI (skupienie na dostępności i interakcjach).
- **@testing-library/jest-dom**: Zbiór niestandardowych matcherów dla Vitest, które pozwalają na pisanie bardziej czytelnych asercji dotyczących stanu DOM (np. `.toBeInTheDocument()`).
- **Playwright**: (Odroczone do v2.0) Do przyszłych testów E2E i weryfikacji responsywności na różnych urządzeniach mobilnych.
- **Lighthouse**: Do audytów wydajności i dostępności.
- **Postman/Thunder Client**: Do ręcznego testowania endpointów API.

## 7. Harmonogram testów

1. **Faza 1:** Testy jednostkowe schematów i utilsów (w trakcie dewelopmentu).
2. **Faza 2:** Testy integracyjne middleware i RLS (po implementacji kluczowych tabel).
3. **Faza 3:** Testy E2E głównych ścieżek (Planowane w Release 2.0).
4. **Faza 4:** Audyt wydajnościowy (przed release MVP).

## 8. Kryteria akceptacji testów

- 100% krytycznych testów integracyjnych Vitest (logowanie, dołączanie do grupy, widoczność kontaktu) przechodzi pomyślnie w pipeline CI/CD.
- Brak błędów bezpieczeństwa (RLS) umożliwiających nieautoryzowany dostęp do danych.
- Wynik Lighthouse Performance > 90 na urządzeniach mobilnych.
- Wszystkie zgłoszone błędy o priorytecie "Blocker" i "Critical" są naprawione.

## 9. Role i odpowiedzialności

- **Deweloperzy:** Pisanie testów jednostkowych i naprawianie błędów.
- **QA Engineer:** (Release 2.0) Tworzenie scenariuszy E2E, automatyzacja w Playwright, audyty wydajności.
- **Product Owner:** Weryfikacja zgodności z PRD i akceptacja wyników testów.

## 10. Procedury raportowania błędów

Wszystkie błędy powinny być zgłaszane w systemie issue trackera (np. GitHub Issues) i zawierać:

1. Krótki opis (tytuł).
2. Kroki do reprodukcji.
3. Oczekiwany vs aktualny rezultat.
4. Zrzut ekranu lub nagranie (dla błędów UI).
5. Informację o środowisku i urządzeniu.
