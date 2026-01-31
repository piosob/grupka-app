-- ============================================================================
-- Migration: Secure for Production
-- Purpose: Re-enable RLS for all tables and ensure policies are active.
--          Reverts changes from disable_rls_dev.sql.
-- ============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 2. Revoke any potential broad permissions granted to anon/authenticated roles during dev
-- (Though disable_rls_dev.sql only disabled RLS, it's good practice to ensure no broad GRANTS exist)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Re-grant basic usage for PostgREST
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure anon has minimal access (PostgREST needs SELECT on some tables for RLS to work if using anon, 
-- but here we rely on RLS to restrict actual data access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 3. Verify/Re-apply policies (Optional but good for completeness)
-- The initial_schema.sql already defined policies. Since we only DISABLED RLS, 
-- those policies should still be there. Re-enabling RLS makes them active again.

-- Note: If any policies were dropped, they would need to be recreated here.
-- Based on the migration history, no policies were dropped, only RLS was disabled.
