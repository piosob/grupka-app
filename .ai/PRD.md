# Dokument wymagań produktu (PRD) - Grupka (MVP)

## 1. Przegląd produktu

**Grupka (MVP)** to aplikacja webowa typu SSR (Server Side Rendering), zaprojektowana zgodnie z filozofią **Mobile First**, służąca do samoorganizacji rodziców w grupach przedszkolnych i szkolnych. Jej głównym celem jest uporządkowanie komunikacji dotyczącej urodzin i prezentów, przy jednoczesnym poszanowaniu prywatności użytkowników i minimalizacji powiadomień.

Projekt kładzie nacisk na doskonałe działanie na urządzeniach mobilnych, minimalizację danych osobowych (brak nazwisk) oraz asynchroniczny model komunikacji. Technologicznie aplikacja opiera się na Astro 5, React 19, TanStack Query, Tailwind 4 i Supabase. Kluczowe funkcjonalności to: tymczasowe kody zaproszeń, rola administratora z możliwością kontaktu mailowego, ukryte wątki dla gości oraz asystent AI wspierający tworzenie list prezentowych w trybie edycji.

## 1.1 Doświadczenie niezalogowanego użytkownika

Niech pierwsze wrażenie po wejściu na stronę będzie jasnym wyjaśnieniem celu aplikacji: krótki hero z przyjaznym powitaniem, prostym hasłem (np. „Witaj rodzicu! Utwórz grupę przedszkolną i żłobkową i zorganizuj urodziny bez chaosu”) i listą powodów, dla których warto przejść dalej. Sekcja powinna podkreślać:

- co to jest Grupka (mobile-first hub dla rodziców, który ogranicza powiadomienia i chroni prywatność),
- jak działa asynchroniczna komunikacja (ograniczenie chatowych powiadomień, aktualności zamiast ciągłych wiadomości),
- główne wartości (tymczasowe kody, ukryte wątki, AI wspierające opisy dzieci).

Poniżej hero proponujemy krótki przegląd „Jak to działa” – trzy kolumny prezentujące: tworzenie bezpiecznej grupy (wymagane logowanie), zapraszanie rodziców przez kod 60 min, oraz akceptowanie sugestii AI przy opisie dziecka. Na tym etapie gość może także zobaczyć przykładową kartę wydarzenia albo poniżej komentarze gości (jako wizualną zapowiedź ukrytego wątku) bez dostępu do danych.

Call to action na stronie głównej musi być czytelny: dwa przyciski (zaloguj / zarejestruj) oraz wyjaśnienie, że tworzenie grupy i zarządzanie członkami wymaga zalogowania. Tekst przy CTA ma za zadanie powiedzieć, że aby utworzyć grupę należy się zalogować lub założyć konto – to zabezpieczenie zgodne z polityką bezpieczeństwa.

W stopce sekcji warto jeszcze raz przypomnieć o możliwości kontaktu z administratorem (pokazanie emaila po kliknięciu) i o pokazaniu „kanału awaryjnego”, aby pokazać, że jesteśmy przygotowani na wątpliwości nowych rodziców.

## 2. Problem użytkownika

Rodzice korzystający z obecnych rozwiązań (np. WhatsApp, Messenger) napotykają następujące trudności:

- **Chaos informacyjny:** Ważne informacje o urodzinach i zbiórkach giną w potoku codziennych wiadomości na czacie.
- **Brak dyskrecji:** Trudność w zorganizowaniu składki na prezent, gdy rodzic dziecka jest w tej samej grupie czatowej.
- **Anonimowość administratora:** W dużych grupach rodzice często nie wiedzą, kto zarządza grupą i do kogo zgłosić problem (np. błędnie dodane dziecko).
- **Bezpieczeństwo grupy:** Ryzyko przebywania w grupie osób nieuprawnionych ("martwe dusze") ze względu na stałe linki zaproszeniowe.
- **Trudności z prezentami:** Brak pomysłów na spersonalizowane prezenty i problem z redagowaniem list życzeń.

## 3. Wymagania funkcjonalne

### 3.1 Interfejs i UX (Mobile First)

- Interfejs zaprojektowany priorytetowo pod ekrany dotykowe smartfonów (duże strefy kliknięcia, nawigacja dostosowana do obsługi kciukiem).
- Pełna responsywność (RWD) zapewniająca poprawny wygląd na desktopie, traktowana jako drugorzędna.
- Kluczowe informacje (np. kody, przyciski akcji) muszą być czytelne bez konieczności powiększania ekranu.

### 3.2 Zarządzanie Grupami i Bezpieczeństwo

- **Role w grupie:** Rozróżnienie na Administratora (Twórcę) i Członka.
- **Kontakt z Adminem:** Adres email Administratora jest dostępny dla członków grupy jako "kanał awaryjny" (domyślnie ukryty, widoczny po kliknięciu).
- **Kody czasowe:** Dołączanie do grupy wymaga kodu ważnego tylko przez **60 minut**, generowanego na żądanie przez Administratora.
- **Moderacja:** Administrator ma prawo usuwać członków z grupy.

### 3.3 Profile Dzieci i AI

- Identyfikacja użytkownika w aplikacji odbywa się poprzez jego **Imię**. W kontekstach grupowych (np. lista członków) wyświetlane jest również powiązanie z dziećmi (np. "Anna (mama Stasia)").
- Funkcja **Magic Wand** dostępna w formularzu edycji/dodawania profilu.
- Model działania AI: Rodzic wpisuje notatkę -> AI generuje sugestie -> Rodzic weryfikuje i poprawia tekst -> Rodzic zapisuje zmiany.

### 3.4 Wydarzenia

- Tworzenie wydarzeń prywatnych z możliwością selekcji gości (checkboxy + przycisk "Zaznacz wszystkich").
- **Ukryty wątek:** Tablica komentarzy dla gości, technicznie niewidoczna dla organizatora (zabezpieczenie RLS).
    - **Sortowanie i Przypinanie:** Komentarze wyświetlane od najnowszych, z możliwością przypięcia (pinned) ważnych wiadomości na górę przez dowolnego uczestnika.
    - **Uprawnienia do usuwania:** Tylko autor komentarza może go usunąć.
- **Pasywny wskaźnik aktualizacji:** Badge informujący o zmianie w wydarzeniu (widoczny przez 8h od edycji).

## 4. Granice produktu

### W zakresie (In-Scope)

- Aplikacja webowa zoptymalizowana pod mobile.
- Uwierzytelnianie email/hasło (Supabase Auth).
- Zarządzanie członkami grupy (Kick, Invite - 60 min).
- Edycja profilu wspierana przez OpenRouter (AI).
- Mechanizm kontaktu z administratorem (reveal email).

### Poza zakresem (Out-of-Scope)

- Natywna aplikacja mobilna (iOS/Android).
- Powiadomienia Push.
- Wewnętrzny system czatu 1:1.
- Rola Nauczyciela.
- Upload zdjęć i plików.
- Automatyczne wysyłanie maili przez kliknięcie (mailto).

## 5. Historyjki użytkowników

### Uwierzytelnianie

**ID: US-001**
**Tytuł:** Rejestracja i logowanie (Mobile)
**Opis:** Jako użytkownik korzystający ze smartfona, chcę wygodnie zarejestrować się i zalogować, aby uzyskać dostęp do aplikacji.
**Kryteria akceptacji:**

- Formularze są responsywne, a klawiatura ekranowa nie zasłania przycisków akcji.
- Walidacja błędów jest czytelna na małym ekranie.
- Poprawne logowanie przekierowuje do listy grup.
- Przycisk logowania lub rejestracji albo wylogowania powinien być widoczny w na górze ekranu (na desktop w prawyn górnym rogu ekranu).
- Przycisk wylogowania powinien być widoczny tylko po zalogowaniu.b
- Logowanie i rejestracja powinny odbywać sie na dedykowanych stronach logowania i rejestracji, a nie na stronie głównej.
- Strona logowania powinna zawierać:
    - Pola do wprowadzenia adresu email i hasła.
    - Przycisk logowania.
    - Link do strony rejestracji.
    - Link do strony resetowania hasła.
- Strona rejestracji powinna zawierać:
    - Pola do wprowadzenia adresu email, hasła i powtórzenia hasła.
    - Pole "Imię" (wymagane, bez nazwiska) z informacją: "Szanujemy Twoją prywatność. Podaj tylko imię - to wystarczy, by inni rodzice Cię rozpoznali."
    - Przycisk rejestracji.
    - Link do strony logowania.
- Odzyskiwanie hasła powinno odbywać się poprzez wysłanie emaila z linkiem do resetowania hasła.

### Zarządzanie Grupami (Administrator)

**ID: US-002**
**Tytuł:** Utworzenie grupy i zgoda na kontakt
**Opis:** Jako rodzic chcę utworzyć nową grupę i zostać jej administratorem, będąc świadomym, że mój email będzie dostępny dla innych rodziców w celach organizacyjnych jako "kanał awaryjny" (domyślnie ukryty, widoczny po kliknięciu).
**Kryteria akceptacji:**

- Podczas tworzenia grupy wyświetlana jest informacja (w formie tekstu pomocniczego): "Twój adres email będzie widoczny dla członków grupy, aby ułatwić im kontakt z Tobą w sprawach organizacyjnych jako "kanał awaryjny" (domyślnie ukryty, widoczny po kliknięciu)".
- Twórca grupy automatycznie otrzymuje uprawnienia Administratora.
- Przy nazwisku Administratora na liście członków widoczne jest wyróżnienie (np. ikona korony/admina).

**ID: US-003**
**Tytuł:** Generowanie bezpiecznego kodu zaproszenia
**Opis:** Jako Administrator chcę wygenerować kod zaproszenia ważny tylko przez 60 minut, aby bezpiecznie zaprosić rodziców i zminimalizować ryzyko dostępu osób niepowołanych.
**Kryteria akceptacji:**

- Admin ma dostęp do przycisku "Generuj kod".
- Kod wyświetla się z licznikiem czasu lub godziną wygaśnięcia (60 min).
- Po upływie czasu kod staje się nieważny.

**ID: US-004**
**Tytuł:** Usuwanie członków (Moderacja)
**Opis:** Jako Administrator chcę usunąć z grupy użytkownika, który dołączył przez pomyłkę, aby dbać o porządek i bezpieczeństwo danych.
**Kryteria akceptacji:**

- Admin widzi opcję usunięcia przy każdym członku grupy.
- Usunięcie jest natychmiastowe i skuteczne (użytkownik traci dostęp do widoku grupy).

### Zarządzanie Grupami (Członek)

**ID: US-005**
**Tytuł:** Kontakt z Administratorem
**Opis:** Jako członek grupy chcę sprawdzić adres email administratora, aby móc się z nim skontaktować w przypadku problemów (np. pomyłka w profilu), ale nie chcę, by ten email "świecił" publicznie przez cały czas.
**Kryteria akceptacji:**

- Na liście członków przy Administratorze znajduje się przycisk/link "Pokaż kontakt".
- Adres email jest domyślnie ukryty (zagwiazdkowany lub niewidoczny).
- Po kliknięciu w przycisk, pełny adres email administratora zostaje wyświetlony, umożliwiając jego skopiowanie.

### Profile Dzieci i AI

**ID: US-006**
**Tytuł:** Wsparcie AI przy edycji opisu (Magic Wand)
**Opis:** Jako rodzic edytujący profil dziecka, chcę, aby AI zamieniło moje hasłowe notatki w ładną listę pomysłów, którą mogę zweryfikować przed zapisaniem.
**Kryteria akceptacji:**

- W trybie edycji profilu dostępne jest pole notatki i przycisk "Magic Wand".
- Kliknięcie przycisku wysyła treść do AI i nadpisuje pole formularza wygenerowaną propozycją.
- Użytkownik ma pełną możliwość edycji tekstu zwróconego przez AI (może usuwać, dopisywać).
- Zmiany zapisują się w bazie tylko po ręcznym kliknięciu "Zapisz".

### Wydarzenia i Bezpieczeństwo Danych

**ID: US-007**
**Tytuł:** Tworzenie wydarzenia i masowy wybór gości
**Opis:** Jako organizator chcę zaprosić większość grupy na urodziny, mogąc zaznaczyć wszystkich jednym kliknięciem, a potem ewentualnie odznaczyć pojedyncze osoby.
**Kryteria akceptacji:**

- Formularz zawiera listę dzieci z checkboxami.
- Dostępny jest przycisk "Zaznacz wszystkich" / "Odznacz wszystkich".
- Layout listy jest wygodny do obsługi dotykiem (odpowiednie odstępy).

**ID: US-008**
**Tytuł:** Bezpieczeństwo ukrytego wątku (RLS)
**Opis:** Jako organizator wydarzenia, system musi uniemożliwić mi dostęp do komentarzy gości, aby niespodzianka nie została zepsuta.
**Kryteria akceptacji:**

- Organizator nie widzi sekcji komentarzy w swoim wydarzeniu.
- Polityka Row Level Security (RLS) w bazie danych blokuje zapytania `SELECT` do tabeli `event_comments` wykonywane przez autora wydarzenia.
- Test bezpieczeństwa potwierdza brak dostępu do tych danych.

**ID: US-009**
**Tytuł:** Ukryty wątek dla gości
**Opis:** Jako gość chcę dyskutować z innymi rodzicami w ukrytym wątku, aby ustalić prezent.
**Kryteria akceptacji:**

- Goście widzą sekcję komentarzy.
- Nowe komentarze pojawiają się po przeładowaniu strony.
- Autor komentarza jest podpisany swoim Imieniem oraz informacją o dziecku (np. "Anna (mama Adasia)").

## 6. Metryki sukcesu

### Metryki Techniczne

- **Mobile Performance:** Lighthouse Score > 90 dla kategorii Performance i Accessibility na mobile.
- **Bezpieczeństwo:** 100% zablokowanych prób dostępu organizatora do ukrytego wątku w testach automatycznych.

### Metryki UX i Adopcji

- **Adopcja AI:** % profili dzieci, które zostały zapisane po użyciu funkcji "Magic Wand".
- **Bezpieczeństwo Grup:** Średnia liczba wygenerowanych kodów na grupę (świadczy o aktywnym zarządzaniu dostępem).
- **Retencja:** % użytkowników powracających do aplikacji w ciągu 30 dni od rejestracji.
