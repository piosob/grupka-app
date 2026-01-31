-- ============================================================================
-- Migration: Fix Event Privacy RLS
-- Purpose: Restrict event visibility to organizer, parents of the birthday child, 
--          and parents of invited guest children.
-- ============================================================================

-- Re-enable RLS for events and event_guests (in case it was disabled in dev)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;

-- Drop existing broad policy from initial migration or recursion fix
DROP POLICY IF EXISTS "events_select_authenticated" ON events;

-- Create restrictive policy
CREATE POLICY "events_select_authenticated"
    ON events FOR SELECT
    TO authenticated
    USING (
        organizer_id = auth.uid() -- I am the organizer
        OR EXISTS (
            -- My child is the birthday child
            SELECT 1 FROM children c
            WHERE c.id = events.child_id
            AND c.parent_id = auth.uid()
        )
        OR EXISTS (
            -- My child is invited as a guest
            SELECT 1 FROM event_guests eg
            JOIN children c ON eg.child_id = c.id
            WHERE eg.event_id = events.id
            AND c.parent_id = auth.uid()
        )
    );

COMMENT ON POLICY "events_select_authenticated" ON events IS 
    'Users can only see events they organize, or where their children are the birthday child or an invited guest.';
