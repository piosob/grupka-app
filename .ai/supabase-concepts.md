# Przewodnik po Migracjach i RLS w Supabase

Ten dokument wyjaśnia kluczowe pojęcia, z którymi będziesz pracować przy użyciu Supabase CLI, oraz dlaczego tymczasowo zmodyfikowaliśmy zabezpieczenia bazy danych.

## 1. Migracje: "Git dla Twojej Bazy Danych"

### Czym są migracje?
Migracje to pliki `.sql` znajdujące się w folderze `supabase/migrations`. Możesz o nich myśleć jak o **historii zmian** Twojej bazy danych. Zamiast ręcznie klikać w panelu Supabase, zapisujemy instrukcje SQL w plikach.

### Dlaczego używamy Supabase CLI?
Dzięki CLI pracujesz na lokalnej kopii bazy danych (na Twoim komputerze). Kiedy jesteś gotowy, "przepychasz" (push) te zmiany na serwer produkcyjny.
- **Konsystencja:** Masz pewność, że Twoja baza lokalna i produkcyjna wyglądają identycznie.
- **Współpraca:** Inni programiści mogą pobrać Twoje migracje i mieć tę samą strukturę bazy.
- **Bezpieczeństwo:** Jeśli coś zepsujesz, możesz zresetować bazę do ostatniego stabilnego stanu.

### Kluczowe komendy CLI:
- `supabase migration new nazwa_zmiany` – tworzy nowy, pusty plik migracji.
- `supabase db reset` – usuwa lokalną bazę i odtwarza ją od zera na podstawie wszystkich plików migracji.
- `supabase db push` – wysyła Twoje lokalne migracje na prawdziwy serwer Supabase.

---

## 2. Row Level Security (RLS): "Ochroniarz Danych"

### Co to jest RLS?
W tradycyjnych bazach danych często chronisz całą tabelę. **RLS (Zabezpieczenia na poziomie wiersza)** pozwala na znacznie więcej: decydujesz, kto może zobaczyć lub edytować **konkretny wiersz** w tabeli.

**Przykład:** W tabeli `children` (dzieci), dzięki RLS, rodzic Staś widzi tylko Stasia, a rodzic Zosia widzi tylko Zosię – mimo że oboje patrzą na tę samą tabelę.

### Dlaczego to jest ważne?
Supabase pozwala frontendowi (Twojej aplikacji React/Astro) łączyć się bezpośrednio z bazą danych. Bez RLS, każdy użytkownik mógłby pobrać dane wszystkich innych osób, po prostu znając nazwę tabeli.

---

## 3. Wyłączanie RLS w Developmencie

### Dlaczego to zrobiliśmy?
Podczas budowania aplikacji (etap Developmentu), RLS bywa uciążliwy:
1. **Szybkość:** Możesz szybko dodawać funkcje bez pisania skomplikowanych reguł SQL dla każdej nowej tabeli.
2. **Debugowanie:** Widzisz od razu, czy błąd leży w kodzie aplikacji, czy w bazie danych (nie musisz się zastanawiać, czy to "ochroniarz RLS" Cię zablokował).
3. **Prototypowanie:** Łatwiej jest "ręcznie" dodawać testowe dane do bazy.

### Jakie są zagrożenia?
Wyłączenie RLS to jak **zostawienie otwartych drzwi do domu na czas remontu**:
- **Wyciek danych (KATASTROFA):** Jeśli zapomnisz włączyć RLS przed wysłaniem aplikacji do internetu (na produkcję), każdy będzie mógł przeczytać i usunąć dowolne dane.
- **Błędy logiczne:** Twoja aplikacja może działać świetnie lokalnie (bo nie ma RLS), ale po wrzuceniu na serwer (gdzie RLS jest włączony) nagle przestanie wyświetlać dane, bo zapomniałeś o odpowiedniej "przepustce" (polityce).
- **Złudne bezpieczeństwo:** Przyzwyczaisz się, że "wszystko działa", i pominiesz testowanie uprawnień użytkowników.

---

## 4. Twoja strategia (Dobre praktyki)

1. **Buduj lokalnie z wyłączonym RLS**, aby szybko dowozić funkcje.
2. **Zawsze sprawdzaj plik `.ai/rls-dev-note.md`** przed robieniem `git commit` lub `supabase db push`.
3. **Włączaj RLS okresowo**, aby przetestować, czy Twoje reguły dostępowe (te w `supabase/migrations/20251221120000_initial_schema.sql`) faktycznie działają tak, jak zaplanowałeś.

