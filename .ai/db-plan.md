# Dokumentacja Schematu Bazy Danych - Projekt "Grupka"

## 1. Struktura Tabel

**profiles** (Profil publiczny użytkownika)
_Rozszerzenie tabeli systemowej `auth.users` w Supabase._

- `id`: **UUID PRIMARY KEY** – referencja do `auth.users(id)`, `ON DELETE CASCADE`.
- `email`: **TEXT** – kopia adresu email (opcjonalnie, do szybkiego odczytu).
- `created_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.

**groups** (Grupy przedszkolne/szkolne)
_Główna jednostka organizacyjna (Tenant)._

- `id`: **UUID PRIMARY KEY** – domyślnie `uuid_generate_v4()`.
- `name`: **VARCHAR(100) NOT NULL** – nazwa grupy (min. 3 znaki).
- `created_by`: **UUID** – FK -> `profiles(id)`, `ON DELETE SET NULL` (twórca grupy).
- `created_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.

**group_members** (Członkowie grup)
_Tabela łącząca (Pivot) określająca przynależność i uprawnienia._

- `group_id`: **UUID** – FK -> `groups(id)`, `ON DELETE CASCADE`.
- `user_id`: **UUID** – FK -> `profiles(id)`, `ON DELETE CASCADE`.
- `role`: **ENUM('admin', 'member') NOT NULL** – rola użytkownika, domyślnie `'member'`.
- `joined_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.
- _PK_: Kompozytowy klucz główny `(group_id, user_id)`.

**group_invites** (Zaproszenia)
_Tymczasowe kody dostępu do grup._

- `code`: **VARCHAR(10) PRIMARY KEY** – unikalny kod alfanumeryczny.
- `group_id`: **UUID NOT NULL** – FK -> `groups(id)`, `ON DELETE CASCADE`.
- `created_by`: **UUID NOT NULL** – FK -> `profiles(id)`, `ON DELETE CASCADE`.
- `expires_at`: **TIMESTAMPTZ NOT NULL** – czas wygaśnięcia (60 min).
- `created_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.

**children** (Dzieci)
_Profile dzieci przypisane do konkretnej grupy._

- `id`: **UUID PRIMARY KEY** – domyślnie `uuid_generate_v4()`.
- `group_id`: **UUID NOT NULL** – FK -> `groups(id)`, `ON DELETE CASCADE`.
- `parent_id`: **UUID NOT NULL** – FK -> `profiles(id)`, `ON DELETE CASCADE` (rodzic).
- `display_name`: **VARCHAR(50) NOT NULL** – imię/przydomek (np. "Staś").
- `bio`: **VARCHAR(1000)** – opis zainteresowań (wspierany przez AI).
- `birth_date`: **DATE** – data urodzin (opcjonalnie, format YYYY-MM-DD).
- `created_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.

**events** (Wydarzenia)
_Urodziny lub zbiórki organizowane w ramach grupy._

- `id`: **UUID PRIMARY KEY** – domyślnie `uuid_generate_v4()`.
- `group_id`: **UUID NOT NULL** – FK -> `groups(id)`, `ON DELETE CASCADE`.
- `organizer_id`: **UUID NOT NULL** – FK -> `profiles(id)` (rodzic organizujący).
- `child_id`: **UUID** – FK -> `children(id)`, `ON DELETE CASCADE` (solenizant - opcjonalne).
- `title`: **VARCHAR(100) NOT NULL** – tytuł wydarzenia.
- `event_date`: **DATE NOT NULL** – data wydarzenia.
- `description`: **TEXT** – szczegóły organizacyjne.
- `created_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.
- `updated_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.

**event_guests** (Goście wydarzenia)
_Lista zaproszonych dzieci (nie rodziców)._

- `event_id`: **UUID** – FK -> `events(id)`, `ON DELETE CASCADE`.
- `child_id`: **UUID** – FK -> `children(id)`, `ON DELETE CASCADE`.
- `created_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.
- _PK_: Kompozytowy klucz główny `(event_id, child_id)`.

**event_comments** (Komentarze / Niespodzianka)
_Wątek dyskusyjny z blokadą widoczności dla organizatora._

- `id`: **UUID PRIMARY KEY** – domyślnie `uuid_generate_v4()`.
- `event_id`: **UUID NOT NULL** – FK -> `events(id)`, `ON DELETE CASCADE`.
- `author_id`: **UUID NOT NULL** – FK -> `profiles(id)`.
- `content`: **VARCHAR(2000) NOT NULL** – treść (min. 1 znak).
- `created_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.

**ai_usage_logs** (Logi AI)
_Techniczny rejestr zużycia tokenów (tylko do odczytu dla adminów systemu)._

- `id`: **UUID PRIMARY KEY** – domyślnie `uuid_generate_v4()`.
- `user_id`: **UUID** – FK -> `profiles(id)`, `ON DELETE SET NULL`.
- `operation`: **VARCHAR(50) NOT NULL** – np. 'magic_wand_bio'.
- `model_used`: **VARCHAR(50) NOT NULL** – np. 'gpt-4o'.
- `input_tokens`: **INT** – licznik wejścia.
- `output_tokens`: **INT** – licznik wyjścia.
- `created_at`: **TIMESTAMPTZ NOT NULL** – domyślnie `NOW()`.

---

## 2. Relacje i Kardynalność

1.  **Users ↔ Groups (N:M):** Realizowane przez tabelę `group_members`. Użytkownik może być w wielu grupach, grupa ma wielu użytkowników.
2.  **Groups → Children (1:N):** Dziecko należy ściśle do jednej grupy (izolacja danych).
3.  **Users → Children (1:N):** Rodzic może mieć wiele dzieci (np. bliźniaki w jednej grupie lub dzieci w różnych grupach).
4.  **Events → Children (N:M):** Wydarzenie ma wielu gości (dzieci), dziecko może być gościem na wielu wydarzeniach. Realizowane przez `event_guests`.
5.  **Events → Event Comments (1:N):** Jedno wydarzenie posiada wiele komentarzy.

---

## 3. Indeksy (Optymalizacja Wydajności)

Indeksy są krytyczne dla wydajności polityk RLS, które są sprawdzane przy każdym zapytaniu.

- **group_members:** `idx_group_members_user_id`, `idx_group_members_group_id` (Najważniejsze indeksy dla weryfikacji uprawnień).
- **children:** `idx_children_group_id`, `idx_children_parent_id`.
- **events:** `idx_events_group_id`, `idx_events_organizer_id`, `idx_events_date` (sortowanie).
- **event_comments:** `idx_event_comments_event_id` (szybkie ładowanie wątku).
- **group_invites:** `idx_invites_code` (wyszukiwanie zaproszeń).

---

## 4. Zasady Row Level Security (RLS)

Dostęp do danych jest ściśle kontrolowany na poziomie bazy danych. Domyślnie wszystkie tabele mają włączone RLS.

- **Izolacja Grup:**
  Dla tabel `groups`, `children`, `events` - użytkownik widzi rekordy tylko wtedy, gdy istnieje wpis w `group_members` łączący jego `auth.uid()` z danym `group_id`.

- **Ochrona "Niespodzianki" (Tabela `event_comments`):**
    - **INSERT:** Dozwolone dla członków grupy, którzy **NIE** są organizatorem danego wydarzenia.
    - **SELECT:** Dozwolone dla członków grupy, z wyłączeniem organizatora wydarzenia. Baza danych zwróci pusty wynik organizatorowi (Hard RLS).

- **Zarządzanie Dziećmi:**
  Tylko użytkownik będący `parent_id` może edytować (`UPDATE`) lub usuwać (`DELETE`) rekord dziecka. Wszyscy członkowie grupy mogą je widzieć (`SELECT`).

- **Rola Administratora Grupy:**
  Tylko użytkownicy z rolą `'admin'` w tabeli `group_members` mogą edytować ustawienia grupy lub generować nowe kody zaproszeń.

---

## 5. Dodatkowe Uwagi Projektowe

- **UUID vs Integer:** Wszędzie zastosowano UUID w celu bezpieczeństwa (trudne do odgadnięcia) i łatwości replikacji w środowisku rozproszonym Supabase.
- **Email Privacy:** Adresy email administratorów nie są przechowywane wprost w tabeli `groups` ani `group_members` dostępnej dla frontendu. Pobranie kontaktu wymaga wywołania bezpiecznej funkcji RPC (Stored Procedure).
- **Logi AI:** Tabela `ai_usage_logs` powinna mieć politykę `INSERT only` dla serwera/autora i brak możliwości edycji/usuwania przez użytkownika końcowego.
- **Kaskadowe Usuwanie:** Usunięcie grupy (`groups`) powoduje kaskadowe usunięcie wszystkich powiązanych danych (członkowie, dzieci, wydarzenia, komentarze), co upraszcza zarządzanie cyklem życia, ale wymaga ostrzeżeń w interfejsie użytkownika.
