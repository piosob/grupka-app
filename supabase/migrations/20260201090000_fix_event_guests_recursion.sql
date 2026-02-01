-- ============================================================================
-- Migration: Fix Event Guests Recursion
-- Purpose: Resolve infinite recursion in RLS policies by using a 
--          security definer helper function for event_guests lookup.
-- ============================================================================

-- 1. Helper function to fetch group_id for an event (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_event_group_id(p_event_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER -- Key: bypasses RLS to break recursion
SET search_path = public
STABLE
AS $$
  SELECT group_id FROM events WHERE id = p_event_id;
$$;

COMMENT ON FUNCTION public.get_event_group_id IS 'Returns the group_id of an event, bypassing RLS to avoid circular policy dependencies.';

-- 2. Update the select policy for event_guests
DROP POLICY IF EXISTS "event_guests_select_authenticated" ON event_guests;

CREATE POLICY "event_guests_select_authenticated"
    ON event_guests FOR SELECT
    TO authenticated
    USING (
        -- Check if user is a member of the group the event belongs to
        -- Uses the existing check_is_group_member function from the project
        check_is_group_member(get_event_group_id(event_id), auth.uid())
    );

COMMENT ON POLICY "event_guests_select_authenticated" ON event_guests IS 
    'Allows group members to view guest lists for events within their group without RLS recursion.';
