# Plan Testów Manualnych - Grupka (MVP)

Niniejszy dokument zawiera scenariusze testów manualnych do przeprowadzenia w przeglądarce, mające na celu weryfikację poprawności działania aplikacji **Grupka** zgodnie z wymaganiami PRD.

## Przygotowanie do testów
- **Środowisko:** Przeglądarka (najlepiej Chrome/Safari z włączonym trybem responsywnym - iPhone 12/13/14).
- **Użytkownicy:** Będziesz potrzebować dwóch kont (Użytkownik A i Użytkownik B). Najlepiej użyć dwóch różnych przeglądarek lub okna incognito.
- **AI:** Do testów Magic Wand wymagane jest skonfigurowane połączenie z OpenRouter (klucz API).

---

## 1. Rejestracja i Uwierzytelnianie (US-001)

### 1.1 Rejestracja nowego użytkownika
1. Otwórz stronę `/register`.
2. Spróbuj wysłać pusty formularz.
   - **Oczekiwany rezultat:** Wyświetlają się błędy walidacji (email, hasło, imię są wymagane).
3. Wpisz niepoprawny email (np. `test@test`).
   - **Oczekiwany rezultat:** Błąd walidacji formatu email.
4. Wypełnij poprawnie: Email, Imię (np. "Piotr"), Hasło (min. 8 znaków).
5. Kliknij "Zarejestruj się".
   - **Oczekiwany rezultat:** Przekierowanie do `/dashboard`. Widoczny Toast z sukcesem.

### 1.2 Logowanie i Wylogowanie
1. Otwórz stronę `/login`.
2. Zaloguj się danymi z punktu 1.1.
   - **Oczekiwany rezultat:** Przekierowanie do `/dashboard`.
3. Kliknij ikonę profilu (lub "Więcej" na mobile) i wybierz "Wyloguj się".
   - **Oczekiwany rezultat:** Przekierowanie do strony głównej (`/`). Brak dostępu do `/dashboard`.

---

## 2. Zarządzanie Grupami (Administrator - Użytkownik A) (US-002, US-003, US-019)

### 2.1 Utworzenie grupy
1. Będąc zalogowanym (Użytkownik A), przejdź do `/groups/new` (przez Dashboard).
2. Sprawdź czy widnieje informacja o ujawnieniu adresu email administratora.
3. Wpisz nazwę grupy (np. "Motylki 2026").
4. Kliknij "Utwórz grupę".
   - **Oczekiwany rezultat:** Przekierowanie do Hubu Grupy (`/groups/:groupId`). Widoczna rola "Admin 👑".

### 2.2 Generowanie kodu zaproszenia
1. W Hubie Grupy lub w sekcji "Więcej/Zaproszenia" kliknij "Generuj kod".
   - **Oczekiwany rezultat:** Pojawia się 8-znakowy kod (np. ABC-123-XY).
2. Sprawdź czy widoczny jest licznik czasu (30 min).
3. Skopiuj kod do schowka przyciskiem "Kopiuj".
   - **Oczekiwany rezultat:** Toast "Kod skopiowany".

### 2.3 Ustawienia i Usuwanie grupy
1. Przejdź do `/groups/:groupId/settings`.
2. Zmień nazwę grupy i zapisz.
   - **Oczekiwany rezultat:** Nazwa aktualizuje się w całej aplikacji.
3. (Opcjonalnie na koniec testów) Spróbuj usunąć grupę.
   - **Oczekiwany rezultat:** Wymagane wpisanie nazwy grupy dla potwierdzenia. Po usunięciu powrót do Dashboard.

---

## 3. Zarządzanie Grupami (Członek - Użytkownik B) (US-005, US-018)

### 3.1 Dołączenie do grupy
1. Zaloguj się jako Użytkownik B (inne okno/przeglądarka).
2. Przejdź do `/join`.
3. Wpisz kod wygenerowany przez Użytkownika A.
4. Kliknij "Dołącz".
   - **Oczekiwany rezultat:** Przekierowanie do Hubu Grupy. Widoczna rola "Członek".

### 3.2 Kontakt z administratorem
1. Przejdź do `/groups/:groupId/members`.
2. Znajdź Użytkownika A na liście. Email powinien być ukryty (gwiazdki lub puste).
3. Kliknij "Pokaż kontakt".
   - **Oczekiwany rezultat:** Otwiera się Dialog z pełnym adresem email Użytkownika A.

---

## 4. Profile Dzieci i Magic Wand (US-006, US-013, US-014)

### 4.1 Dodawanie dziecka z AI
1. Przejdź do `/groups/:groupId/children/new`.
2. Wpisz imię (np. "Staś").
3. W polu "Co lubi Twoje dziecko?" wpisz hasła: `dinozaury, lego, nie lubi puzzli`.
4. Kliknij przycisk z różdżką 🪄 (Magic Wand).
   - **Oczekiwany rezultat:** Po chwili pole tekstowe zostaje zastąpione sformatowaną listą wygenerowaną przez AI.
5. Edytuj ręcznie wygenerowany tekst (np. dopisz coś).
6. Wybierz datę urodzenia (Dzień, Miesiąc, Rok - opcjonalnie).
7. Kliknij "Dodaj dziecko".
   - **Oczekiwany rezultat:** Powrót do listy dzieci. Staś jest widoczny z badge'em "Twoje dziecko".

### 4.2 Unikalność imion
1. Spróbuj dodać drugie dziecko o tym samym imieniu "Staś" w tej samej grupie.
   - **Oczekiwany rezultat:** Błąd walidacji informujący, że imię musi być unikalne w grupie.

---

## 5. Wydarzenia i Ukryty Wątek (US-007, US-008, US-009)

### 5.1 Tworzenie wydarzenia (Użytkownik A - Organizator)
1. Przejdź do `/groups/:groupId/events/new`.
2. Wypełnij: Tytuł ("Urodziny Stasia"), Data (przyszła), Opis.
3. Wybierz dziecko: "Staś".
4. W sekcji Goście kliknij "Zaznacz wszystkich".
   - **Oczekiwany rezultat:** Wszystkie dzieci na liście zostają zaznaczone.
5. Kliknij "Utwórz wydarzenie".
   - **Oczekiwany rezultat:** Przekierowanie do szczegółów wydarzenia.
6. **Kluczowy test prywatności:** Sprawdź czy widzisz sekcję komentarzy.
   - **Oczekiwany rezultat:** Jako organizator **NIE powinieneś** widzieć sekcji komentarzy. Widzisz informację "Komentarze gości są ukryte".

### 5.2 Komentowanie (Użytkownik B - Gość)
1. Jako Użytkownik B przejdź do `/groups/:groupId/events`.
2. Otwórz "Urodziny Stasia".
3. Sprawdź czy widzisz bio Stasia (inspiracja prezentowa).
4. Przejdź do sekcji komentarzy.
5. Wpisz komentarz: "Kupuję zestaw LEGO z T-Rexem". Kliknij "Wyślij".
   - **Oczekiwany rezultat:** Komentarz pojawia się natychmiast. Widoczny podpis "Imię_B (rodzic Dziecka_B)".

### 5.3 Zarządzanie komentarzami (Gość)
1. Kliknij ikonę pinezki przy swoim komentarzu (Pin).
   - **Oczekiwany rezultat:** Komentarz zostaje przypięty na górę listy.
2. Spróbuj usunąć swój komentarz.
   - **Oczekiwany rezultat:** Komentarz znika.
3. Spróbuj przypiąć komentarz innego gościa (jeśli dodasz drugiego gościa do testów).
   - **Oczekiwany rezultat:** Każdy gość może przypiąć dowolny komentarz.

### 5.4 Wskaźnik aktualizacji (Badge)
1. Użytkownik A (Organizator) edytuje wydarzenie (np. zmienia opis).
2. Użytkownik B odświeża listę wydarzeń.
   - **Oczekiwany rezultat:** Przy wydarzeniu pojawia się badge "Zaktualizowane". Badge powinien zniknąć po 8 godzinach (testowane przez zmianę czasu w DB lub weryfikację logiki w kodzie).

---

## 6. Moderacja (Administrator) (US-004)

### 6.1 Usuwanie członka
1. Użytkownik A przechodzi do `/groups/:groupId/members`.
2. Przy Użytkowniku B klika ikonę menu (trzy kropki) i wybiera "Usuń z grupy".
3. Potwierdza w oknie dialogowym.
   - **Oczekiwany rezultat:** Użytkownik B znika z listy.
4. Sprawdź u Użytkownika B (odśwież stronę).
   - **Oczekiwany rezultat:** Użytkownik B traci dostęp do grupy i zostaje przekierowany do Dashboard.

---

## 7. Responsywność i Mobile UX (US-001)

1. Zmień szerokość okna na < 400px.
2. Sprawdź czy dolna nawigacja (Bottom Nav) jest widoczna i funkcjonalna.
3. Sprawdź czy przyciski akcji (np. FAB "+") są łatwo dostępne kciukiem.
4. Sprawdź czy formularze nie "uciekają" poza ekran i czy klawiatura (symulowana) nie zasłania przycisku "Zapisz".
