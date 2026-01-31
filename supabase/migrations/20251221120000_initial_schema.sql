-- ============================================================================
-- Migration: Initial Schema for "Grupka" Application
-- Purpose: Creates the complete database schema for parent self-organization
--          in preschool and school groups
-- Affected Tables: profiles, groups, group_members, group_invites, children,
--                  events, event_guests, event_comments, ai_usage_logs
-- Special Considerations:
--   - All tables have RLS enabled by default
--   - UUID used everywhere for security and distributed systems compatibility
--   - Cascade deletes for proper data lifecycle management
--   - "Surprise" protection: event organizers cannot see comments on their events
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------

-- enable uuid generation functions
-- uuid extension no longer needed as we use gen_random_uuid() from pg 13+
-- create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- CUSTOM TYPES
-- ----------------------------------------------------------------------------

-- role enum for group membership
create type group_role as enum ('admin', 'member');

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

-- profiles: public user profile extending auth.users
-- stores minimal public information about authenticated users
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    created_at timestamptz not null default now()
);

comment on table profiles is 'Public user profiles extending Supabase auth.users';
comment on column profiles.id is 'References auth.users(id), cascades on delete';
comment on column profiles.email is 'Cached email for quick reads (optional)';

-- groups: organizational units (tenants)
-- each group represents a preschool/school class
create table groups (
    id uuid primary key default gen_random_uuid(),
    name varchar(100) not null constraint groups_name_min_length check (char_length(name) >= 3),
    created_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

comment on table groups is 'Preschool/school groups - main organizational unit (tenant)';
comment on column groups.name is 'Group name, minimum 3 characters';
comment on column groups.created_by is 'User who created the group, set null if user deleted';

-- group_members: pivot table for user-group membership
-- defines user roles and permissions within groups
create table group_members (
    group_id uuid not null references groups(id) on delete cascade,
    user_id uuid not null references profiles(id) on delete cascade,
    role group_role not null default 'member',
    joined_at timestamptz not null default now(),
    primary key (group_id, user_id)
);

comment on table group_members is 'User membership and roles in groups (N:M relationship)';
comment on column group_members.role is 'User role: admin has full control, member has limited access';

-- group_invites: temporary access codes for joining groups
-- codes expire after 60 minutes
create table group_invites (
    code varchar(10) primary key,
    group_id uuid not null references groups(id) on delete cascade,
    created_by uuid not null references profiles(id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

comment on table group_invites is 'Temporary invitation codes for joining groups (60 min TTL)';
comment on column group_invites.code is 'Unique alphanumeric code for joining';
comment on column group_invites.expires_at is 'Invitation expiry timestamp';

-- children: child profiles assigned to specific groups
-- isolated per group for privacy
create table children (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references groups(id) on delete cascade,
    parent_id uuid not null references profiles(id) on delete cascade,
    display_name varchar(50) not null,
    bio varchar(1000),
    birth_date date,
    created_at timestamptz not null default now()
);

comment on table children is 'Child profiles belonging to a specific group';
comment on column children.display_name is 'Child nickname/name (e.g., "Staś")';
comment on column children.bio is 'Interests description, AI-assisted';
comment on column children.birth_date is 'Optional birth date for birthday tracking';

-- events: birthdays or fundraisers organized within groups
create table events (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references groups(id) on delete cascade,
    organizer_id uuid not null references profiles(id),
    child_id uuid references children(id) on delete cascade,
    title varchar(100) not null,
    event_date date not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table events is 'Birthday parties or group fundraisers';
comment on column events.organizer_id is 'Parent organizing the event';
comment on column events.child_id is 'Birthday child (optional for non-birthday events)';

-- event_guests: invited children to events (not parents)
create table event_guests (
    event_id uuid not null references events(id) on delete cascade,
    child_id uuid not null references children(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (event_id, child_id)
);

comment on table event_guests is 'List of children invited to an event';

-- event_comments: discussion thread with surprise protection
-- organizer cannot see comments to preserve gift surprises
create table event_comments (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    author_id uuid not null references profiles(id),
    content varchar(2000) not null constraint event_comments_content_not_empty check (char_length(content) >= 1),
    created_at timestamptz not null default now()
);

comment on table event_comments is 'Discussion thread hidden from event organizer (surprise protection)';
comment on column event_comments.content is 'Comment text, minimum 1 character';

-- ai_usage_logs: technical logging for AI token consumption
-- read-only for system admins, insert-only for application
create table ai_usage_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete set null,
    operation varchar(50) not null,
    model_used varchar(50) not null,
    input_tokens int,
    output_tokens int,
    created_at timestamptz not null default now()
);

comment on table ai_usage_logs is 'Technical log of AI token usage (read-only audit trail)';
comment on column ai_usage_logs.operation is 'Operation type (e.g., magic_wand_bio)';
comment on column ai_usage_logs.model_used is 'AI model identifier (e.g., gpt-4o)';

-- ----------------------------------------------------------------------------
-- INDEXES
-- Performance optimization, especially critical for RLS policy evaluation
-- ----------------------------------------------------------------------------

-- group_members indexes: most important for permission checks
create index idx_group_members_user_id on group_members(user_id);
create index idx_group_members_group_id on group_members(group_id);

-- children indexes
create index idx_children_group_id on children(group_id);
create index idx_children_parent_id on children(parent_id);

-- events indexes
create index idx_events_group_id on events(group_id);
create index idx_events_organizer_id on events(organizer_id);
create index idx_events_date on events(event_date);

-- event_comments index
create index idx_event_comments_event_id on event_comments(event_id);

-- group_invites index
create index idx_invites_code on group_invites(code);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- All tables have RLS enabled. Policies are granular per operation and role.
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_invites enable row level security;
alter table children enable row level security;
alter table events enable row level security;
alter table event_guests enable row level security;
alter table event_comments enable row level security;
alter table ai_usage_logs enable row level security;

-- ============================================================================
-- PROFILES POLICIES
-- Users can read any profile but only modify their own
-- ============================================================================

-- profiles: authenticated users can view all profiles (needed for group member lists)
create policy "profiles_select_authenticated"
    on profiles for select
    to authenticated
    using (true);

comment on policy "profiles_select_authenticated" on profiles is 
    'Authenticated users can view all profiles for group member display';

-- profiles: users can only insert their own profile
create policy "profiles_insert_authenticated"
    on profiles for insert
    to authenticated
    with check (auth.uid() = id);

comment on policy "profiles_insert_authenticated" on profiles is 
    'Users can only create their own profile (matching auth.uid)';

-- profiles: users can only update their own profile
create policy "profiles_update_authenticated"
    on profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

comment on policy "profiles_update_authenticated" on profiles is 
    'Users can only update their own profile';

-- profiles: users can only delete their own profile
create policy "profiles_delete_authenticated"
    on profiles for delete
    to authenticated
    using (auth.uid() = id);

comment on policy "profiles_delete_authenticated" on profiles is 
    'Users can only delete their own profile';

-- ============================================================================
-- GROUPS POLICIES
-- Users can only see groups they are members of
-- ============================================================================

-- groups: users can view groups they belong to
create policy "groups_select_authenticated"
    on groups for select
    to authenticated
    using (
        exists (
            select 1 from group_members
            where group_members.group_id = groups.id
            and group_members.user_id = auth.uid()
        )
    );

comment on policy "groups_select_authenticated" on groups is 
    'Users can only view groups they are members of';

-- groups: any authenticated user can create a group
create policy "groups_insert_authenticated"
    on groups for insert
    to authenticated
    with check (true);

comment on policy "groups_insert_authenticated" on groups is 
    'Any authenticated user can create a new group';

-- groups: only group admins can update group settings
create policy "groups_update_authenticated"
    on groups for update
    to authenticated
    using (
        exists (
            select 1 from group_members
            where group_members.group_id = groups.id
            and group_members.user_id = auth.uid()
            and group_members.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from group_members
            where group_members.group_id = groups.id
            and group_members.user_id = auth.uid()
            and group_members.role = 'admin'
        )
    );

comment on policy "groups_update_authenticated" on groups is 
    'Only group admins can update group settings';

-- groups: only group admins can delete the group
-- WARNING: This cascades to all group data (members, children, events, comments)
create policy "groups_delete_authenticated"
    on groups for delete
    to authenticated
    using (
        exists (
            select 1 from group_members
            where group_members.group_id = groups.id
            and group_members.user_id = auth.uid()
            and group_members.role = 'admin'
        )
    );

comment on policy "groups_delete_authenticated" on groups is 
    'Only group admins can delete the group (cascades all data!)';

-- ============================================================================
-- GROUP_MEMBERS POLICIES
-- Members can see other members in their groups
-- ============================================================================

-- group_members: users can view members of groups they belong to
create policy "group_members_select_authenticated"
    on group_members for select
    to authenticated
    using (
        exists (
            select 1 from group_members as gm
            where gm.group_id = group_members.group_id
            and gm.user_id = auth.uid()
        )
    );

comment on policy "group_members_select_authenticated" on group_members is 
    'Users can view all members of groups they belong to';

-- group_members: users can insert themselves (join via invite)
create policy "group_members_insert_authenticated"
    on group_members for insert
    to authenticated
    with check (auth.uid() = user_id);

comment on policy "group_members_insert_authenticated" on group_members is 
    'Users can only add themselves as group members (via invite code)';

-- group_members: only admins can update member roles
create policy "group_members_update_authenticated"
    on group_members for update
    to authenticated
    using (
        exists (
            select 1 from group_members as gm
            where gm.group_id = group_members.group_id
            and gm.user_id = auth.uid()
            and gm.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from group_members as gm
            where gm.group_id = group_members.group_id
            and gm.user_id = auth.uid()
            and gm.role = 'admin'
        )
    );

comment on policy "group_members_update_authenticated" on group_members is 
    'Only group admins can update member roles';

-- group_members: users can remove themselves or admins can remove anyone
create policy "group_members_delete_authenticated"
    on group_members for delete
    to authenticated
    using (
        auth.uid() = user_id
        or exists (
            select 1 from group_members as gm
            where gm.group_id = group_members.group_id
            and gm.user_id = auth.uid()
            and gm.role = 'admin'
        )
    );

comment on policy "group_members_delete_authenticated" on group_members is 
    'Users can leave groups or admins can remove members';

-- ============================================================================
-- GROUP_INVITES POLICIES
-- Only admins can manage invites
-- ============================================================================

-- group_invites: admins can view their group's invites
create policy "group_invites_select_authenticated"
    on group_invites for select
    to authenticated
    using (
        exists (
            select 1 from group_members
            where group_members.group_id = group_invites.group_id
            and group_members.user_id = auth.uid()
            and group_members.role = 'admin'
        )
    );

comment on policy "group_invites_select_authenticated" on group_invites is 
    'Only group admins can view invitation codes';

-- group_invites: any authenticated user can validate an invite code
-- this allows checking if a code is valid before joining
create policy "group_invites_select_by_code"
    on group_invites for select
    to authenticated
    using (true);

comment on policy "group_invites_select_by_code" on group_invites is 
    'Anyone can validate an invite code to join a group';

-- group_invites: only admins can create invite codes
create policy "group_invites_insert_authenticated"
    on group_invites for insert
    to authenticated
    with check (
        exists (
            select 1 from group_members
            where group_members.group_id = group_invites.group_id
            and group_members.user_id = auth.uid()
            and group_members.role = 'admin'
        )
    );

comment on policy "group_invites_insert_authenticated" on group_invites is 
    'Only group admins can generate new invitation codes';

-- group_invites: only admins can delete invite codes
create policy "group_invites_delete_authenticated"
    on group_invites for delete
    to authenticated
    using (
        exists (
            select 1 from group_members
            where group_members.group_id = group_invites.group_id
            and group_members.user_id = auth.uid()
            and group_members.role = 'admin'
        )
    );

comment on policy "group_invites_delete_authenticated" on group_invites is 
    'Only group admins can revoke invitation codes';

-- ============================================================================
-- CHILDREN POLICIES
-- Group members can view, only parents can modify their own children
-- ============================================================================

-- children: group members can view all children in their groups
create policy "children_select_authenticated"
    on children for select
    to authenticated
    using (
        exists (
            select 1 from group_members
            where group_members.group_id = children.group_id
            and group_members.user_id = auth.uid()
        )
    );

comment on policy "children_select_authenticated" on children is 
    'Group members can view all children in their groups';

-- children: group members can add their own children
create policy "children_insert_authenticated"
    on children for insert
    to authenticated
    with check (
        auth.uid() = parent_id
        and exists (
            select 1 from group_members
            where group_members.group_id = children.group_id
            and group_members.user_id = auth.uid()
        )
    );

comment on policy "children_insert_authenticated" on children is 
    'Users can add their own children to groups they belong to';

-- children: only the parent can update their child's profile
create policy "children_update_authenticated"
    on children for update
    to authenticated
    using (auth.uid() = parent_id)
    with check (auth.uid() = parent_id);

comment on policy "children_update_authenticated" on children is 
    'Only the parent can update their child profile';

-- children: only the parent can delete their child's profile
create policy "children_delete_authenticated"
    on children for delete
    to authenticated
    using (auth.uid() = parent_id);

comment on policy "children_delete_authenticated" on children is 
    'Only the parent can delete their child profile';

-- ============================================================================
-- EVENTS POLICIES
-- Group members can view and create events, only organizers can modify
-- ============================================================================

-- events: group members can view all events in their groups
create policy "events_select_authenticated"
    on events for select
    to authenticated
    using (
        exists (
            select 1 from group_members
            where group_members.group_id = events.group_id
            and group_members.user_id = auth.uid()
        )
    );

comment on policy "events_select_authenticated" on events is 
    'Group members can view all events in their groups';

-- events: group members can create events
create policy "events_insert_authenticated"
    on events for insert
    to authenticated
    with check (
        auth.uid() = organizer_id
        and exists (
            select 1 from group_members
            where group_members.group_id = events.group_id
            and group_members.user_id = auth.uid()
        )
    );

comment on policy "events_insert_authenticated" on events is 
    'Group members can create events (as organizer)';

-- events: only the organizer can update their event
create policy "events_update_authenticated"
    on events for update
    to authenticated
    using (auth.uid() = organizer_id)
    with check (auth.uid() = organizer_id);

comment on policy "events_update_authenticated" on events is 
    'Only the event organizer can update event details';

-- events: only the organizer can delete their event
create policy "events_delete_authenticated"
    on events for delete
    to authenticated
    using (auth.uid() = organizer_id);

comment on policy "events_delete_authenticated" on events is 
    'Only the event organizer can delete their event';

-- ============================================================================
-- EVENT_GUESTS POLICIES
-- Group members can view guests, only organizers can manage guest list
-- ============================================================================

-- event_guests: group members can view guest lists
create policy "event_guests_select_authenticated"
    on event_guests for select
    to authenticated
    using (
        exists (
            select 1 from events
            join group_members on group_members.group_id = events.group_id
            where events.id = event_guests.event_id
            and group_members.user_id = auth.uid()
        )
    );

comment on policy "event_guests_select_authenticated" on event_guests is 
    'Group members can view event guest lists';

-- event_guests: only event organizer can add guests
create policy "event_guests_insert_authenticated"
    on event_guests for insert
    to authenticated
    with check (
        exists (
            select 1 from events
            where events.id = event_guests.event_id
            and events.organizer_id = auth.uid()
        )
    );

comment on policy "event_guests_insert_authenticated" on event_guests is 
    'Only the event organizer can invite guests';

-- event_guests: only event organizer can remove guests
create policy "event_guests_delete_authenticated"
    on event_guests for delete
    to authenticated
    using (
        exists (
            select 1 from events
            where events.id = event_guests.event_id
            and events.organizer_id = auth.uid()
        )
    );

comment on policy "event_guests_delete_authenticated" on event_guests is 
    'Only the event organizer can remove guests';

-- ============================================================================
-- EVENT_COMMENTS POLICIES (SURPRISE PROTECTION)
-- Critical: Organizer CANNOT see comments on their own events
-- This protects gift surprises from being spoiled
-- ============================================================================

-- event_comments: group members can view comments EXCEPT the organizer
-- This is the "Hard RLS" protection for surprises
create policy "event_comments_select_authenticated"
    on event_comments for select
    to authenticated
    using (
        exists (
            select 1 from events
            join group_members on group_members.group_id = events.group_id
            where events.id = event_comments.event_id
            and group_members.user_id = auth.uid()
            -- CRITICAL: Exclude the event organizer from seeing comments
            and events.organizer_id != auth.uid()
        )
    );

comment on policy "event_comments_select_authenticated" on event_comments is 
    'Group members can view comments EXCEPT the event organizer (surprise protection)';

-- event_comments: group members can add comments EXCEPT the organizer
create policy "event_comments_insert_authenticated"
    on event_comments for insert
    to authenticated
    with check (
        auth.uid() = author_id
        and exists (
            select 1 from events
            join group_members on group_members.group_id = events.group_id
            where events.id = event_comments.event_id
            and group_members.user_id = auth.uid()
            -- CRITICAL: Organizer cannot comment on their own event
            and events.organizer_id != auth.uid()
        )
    );

comment on policy "event_comments_insert_authenticated" on event_comments is 
    'Group members can add comments EXCEPT on events they organize';

-- event_comments: only the comment author can delete their comment
create policy "event_comments_delete_authenticated"
    on event_comments for delete
    to authenticated
    using (auth.uid() = author_id);

comment on policy "event_comments_delete_authenticated" on event_comments is 
    'Only the comment author can delete their own comment';

-- ============================================================================
-- AI_USAGE_LOGS POLICIES
-- Insert-only for authenticated users, no read/update/delete
-- System admins access this via service role, not RLS
-- ============================================================================

-- ai_usage_logs: authenticated users can insert logs for themselves
create policy "ai_usage_logs_insert_authenticated"
    on ai_usage_logs for insert
    to authenticated
    with check (auth.uid() = user_id);

comment on policy "ai_usage_logs_insert_authenticated" on ai_usage_logs is 
    'Users can only insert AI usage logs for themselves';

-- No select, update, or delete policies for regular users
-- Access is via service_role for system administrators

-- ============================================================================
-- TRIGGERS
-- Automatic timestamp updates
-- ============================================================================

-- function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- trigger for events table
create trigger events_updated_at
    before update on events
    for each row
    execute function update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- RPC functions for secure operations
-- ============================================================================

-- function to create a profile on user signup (triggered by auth)
create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email);
    return new;
end;
$$ language plpgsql security definer;

-- trigger to create profile on auth.users insert
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();







