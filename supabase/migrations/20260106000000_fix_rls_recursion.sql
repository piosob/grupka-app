-- ============================================================================
-- Migration: Fix RLS Recursion
-- Purpose: Resolve infinite recursion in group_members and groups policies
--          by using security definer functions that bypass RLS checks.
-- ============================================================================

-- Function to check group membership without triggering RLS recursion
create or replace function public.check_is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from group_members
    where group_id = p_group_id
    and user_id = p_user_id
  );
$$;

comment on function public.check_is_group_member is 'Checks if a user is a member of a group, bypassing RLS to avoid recursion';

-- Function to check if user is group admin without triggering RLS recursion
create or replace function public.check_is_group_admin(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from group_members
    where group_id = p_group_id
    and user_id = p_user_id
    and role = 'admin'
  );
$$;

comment on function public.check_is_group_admin is 'Checks if a user is an admin of a group, bypassing RLS to avoid recursion';

-- ----------------------------------------------------------------------------
-- Update GROUP_MEMBERS policies
-- ----------------------------------------------------------------------------

drop policy if exists "group_members_select_authenticated" on group_members;
create policy "group_members_select_authenticated"
    on group_members for select
    to authenticated
    using (
        check_is_group_member(group_id, auth.uid())
    );

drop policy if exists "group_members_update_authenticated" on group_members;
create policy "group_members_update_authenticated"
    on group_members for update
    to authenticated
    using (
        check_is_group_admin(group_id, auth.uid())
    )
    with check (
        check_is_group_admin(group_id, auth.uid())
    );

drop policy if exists "group_members_delete_authenticated" on group_members;
create policy "group_members_delete_authenticated"
    on group_members for delete
    to authenticated
    using (
        auth.uid() = user_id
        or check_is_group_admin(group_id, auth.uid())
    );

-- ----------------------------------------------------------------------------
-- Update GROUPS policies
-- ----------------------------------------------------------------------------

drop policy if exists "groups_select_authenticated" on groups;
create policy "groups_select_authenticated"
    on groups for select
    to authenticated
    using (
        check_is_group_member(id, auth.uid())
    );

drop policy if exists "groups_update_authenticated" on groups;
create policy "groups_update_authenticated"
    on groups for update
    to authenticated
    using (
        check_is_group_admin(id, auth.uid())
    )
    with check (
        check_is_group_admin(id, auth.uid())
    );

drop policy if exists "groups_delete_authenticated" on groups;
create policy "groups_delete_authenticated"
    on groups for delete
    to authenticated
    using (
        check_is_group_admin(id, auth.uid())
    );

-- ----------------------------------------------------------------------------
-- Update other policies that were using exists(select from group_members)
-- ----------------------------------------------------------------------------

-- children
drop policy if exists "children_select_authenticated" on children;
create policy "children_select_authenticated"
    on children for select
    to authenticated
    using (
        check_is_group_member(group_id, auth.uid())
    );

drop policy if exists "children_insert_authenticated" on children;
create policy "children_insert_authenticated"
    on children for insert
    to authenticated
    with check (
        auth.uid() = parent_id
        and check_is_group_member(group_id, auth.uid())
    );

-- events
drop policy if exists "events_select_authenticated" on events;
create policy "events_select_authenticated"
    on events for select
    to authenticated
    using (
        check_is_group_member(group_id, auth.uid())
    );

drop policy if exists "events_insert_authenticated" on events;
create policy "events_insert_authenticated"
    on events for insert
    to authenticated
    with check (
        auth.uid() = organizer_id
        and check_is_group_member(group_id, auth.uid())
    );

-- group_invites
drop policy if exists "group_invites_select_authenticated" on group_invites;
create policy "group_invites_select_authenticated"
    on group_invites for select
    to authenticated
    using (
        check_is_group_admin(group_id, auth.uid())
    );

drop policy if exists "group_invites_insert_authenticated" on group_invites;
create policy "group_invites_insert_authenticated"
    on group_invites for insert
    to authenticated
    with check (
        check_is_group_admin(group_id, auth.uid())
    );

drop policy if exists "group_invites_delete_authenticated" on group_invites;
create policy "group_invites_delete_authenticated"
    on group_invites for delete
    to authenticated
    using (
        check_is_group_admin(group_id, auth.uid())
    );

