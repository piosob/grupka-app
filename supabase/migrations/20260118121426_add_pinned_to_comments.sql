    -- Dodanie kolumny is_pinned
    ALTER TABLE public.event_comments 
    ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

    -- Dodanie indeksu dla wydajnego sortowania
    CREATE INDEX IF NOT EXISTS idx_event_comments_pinned_created 
    ON public.event_comments (event_id, is_pinned DESC, created_at DESC);