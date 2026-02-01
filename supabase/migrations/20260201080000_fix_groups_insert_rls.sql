-- ============================================================================
-- Migration: Fix Groups Insert RLS
-- Purpose: Allow creators to see their newly created groups immediately.
--          This fixes the "new row violates row-level security policy" error
--          when performing insert(...).select() on the groups table.
-- ============================================================================

-- 1. Drop the existing select policy on groups
DROP POLICY IF EXISTS "groups_select_authenticated" ON groups;

-- 2. Create the updated select policy
-- Users can see a group if:
-- a) They are a member (checked via security definer function to avoid recursion)
-- b) They are the creator (needed for the RETURNING clause during group creation)
CREATE POLICY "groups_select_authenticated"
    ON groups FOR SELECT
    TO authenticated
    USING (
        check_is_group_member(id, auth.uid())
        OR created_by = auth.uid()
    );

COMMENT ON POLICY "groups_select_authenticated" ON groups IS 
    'Users can view groups they are members of or that they have created.';
