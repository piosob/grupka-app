# Row Level Security (RLS) - Development Note

Dla ułatwienia procesu developmentu, polityki RLS zostały tymczasowo wyłączone. Poniżej znajduje się lista tabel, dla których wyłączono zabezpieczenia oraz instrukcja jak je przywrócić przed wdrożeniem na produkcję.

## Wyłączone polityki RLS dla tabel:

- `profiles`
- `groups`
- `group_members`
- `group_invites`
- `children`
- `events`
- `event_guests`
- `event_comments`
- `ai_usage_logs`

## Jak wyłączyć RLS (aktualny stan dev):

Uruchom poniższy skrypt SQL w konsoli Supabase lub poprzez migrację:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE children DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs DISABLE ROW LEVEL SECURITY;
```

## Jak włączyć RLS przed wdrożeniem (PROD):

Aby przywrócić pełne bezpieczeństwo danych, należy ponownie włączyć RLS dla wszystkich tabel:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
```

**Uwaga:** Wszystkie zdefiniowane wcześniej polityki (`CREATE POLICY`) pozostają w bazie danych, ale nie są egzekwowane tak długo, jak RLS jest w stanie `DISABLE`. Ponowne włączenie (`ENABLE`) automatycznie aktywuje istniejące polityki.
