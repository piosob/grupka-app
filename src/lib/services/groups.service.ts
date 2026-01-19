import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
    CreateGroupCommand,
    CreateGroupResponseDTO,
    GroupListItemDTO,
    GroupDetailDTO,
    GroupMemberDTO,
    AdminContactDTO,
    ChildListItemDTO,
    UpdateGroupCommand,
    UpdateGroupResponseDTO,
    GroupInviteDTO,
    GroupInviteListItemDTO,
    JoinGroupCommand,
    JoinGroupResponseDTO,
    PaginationParams,
    EventListItemDTO,
} from '../schemas';
import type { GroupEntity, EventEntity, ChildEntity, PaginatedResponse } from '../../types';

import { NotFoundError, ForbiddenError, ConflictError } from '../errors';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Internal helper types for database query results with joins/aggregations
 */
interface GroupWithCounts extends Omit<GroupEntity, 'created_by'> {
    created_by: string; // We know it's not null for an existing group
    members: { count: number }[];
    children: { count: number }[];
    events: { count: number }[];
}

interface EventWithDetails extends EventEntity {
    child: { display_name: string } | null;
    guests: { count: number }[];
}

interface GroupListItemQueryResult {
    role: Database['public']['Enums']['group_role'];
    joined_at: string;
    group: {
        id: string;
        name: string;
        created_at: string;
        members: { count: number }[];
    };
}

interface GroupMemberQueryResult {
    user_id: string;
    role: Database['public']['Enums']['group_role'];
    joined_at: string;
    profile: {
        first_name: string;
        children: {
            display_name: string;
        }[];
    } | null;
}

/**
 * Service for managing group operations.
 * Handles CRUD operations for groups and related entities.
 */
export class GroupsService {
    constructor(private supabase: TypedSupabaseClient) {}

    /**
     * Creates a new group and assigns the creator as admin.
     *
     * This method performs two operations in sequence:
     * 1. Creates a new group record with the provided name
     * 2. Adds the creator as an admin member of the group
     *
     * If the second operation fails, it attempts to clean up by deleting the created group.
     *
     * @param userId - The ID of the user creating the group (from authenticated session)
     * @param command - The group creation command containing the group name
     * @returns The created group data including ID, name, role, and creation timestamp
     * @throws Error if group creation fails or member assignment fails
     *
     * @example
     * ```typescript
     * const service = new GroupsService(supabase);
     * const group = await service.createGroup(userId, { name: "Przedszkole Słoneczko" });
     * ```
     */
    async createGroup(
        userId: string,
        command: CreateGroupCommand
    ): Promise<CreateGroupResponseDTO> {
        // Sanitize input by trimming whitespace
        const sanitizedName = command.name.trim();

        // Step 1: Create the group
        const { data: group, error: groupError } = await this.supabase
            .from('groups')
            .insert({
                name: sanitizedName,
                created_by: userId,
            })
            .select('id, name, created_at')
            .single();

        if (groupError || !group) {
            throw new Error(`Failed to create group: ${groupError?.message}`);
        }

        // Step 2: Add the creator as admin to group_members
        const { error: memberError } = await this.supabase.from('group_members').insert({
            group_id: group.id,
            user_id: userId,
            role: 'admin',
        });

        if (memberError) {
            // Compensation: attempt to delete the created group to maintain consistency
            await this.supabase.from('groups').delete().eq('id', group.id);
            throw new Error(`Failed to add group member: ${memberError.message}`);
        }

        // Return response matching the DTO schema
        return {
            id: group.id,
            name: group.name,
            role: 'admin',
            createdAt: group.created_at,
        };
    }

    /**
     * Retrieves a paginated list of groups the user belongs to.
     *
     * This method queries the `group_members` table joined with `groups` to provide
     * a list of groups where the user is a member, including their role and
     * the total number of members in each group.
     *
     * @param userId - ID of the authenticated user
     * @param params - Pagination parameters (limit, offset)
     * @returns Paginated list of groups with user role and member count
     * @throws Error if the database query fails
     *
     * @example
     * ```typescript
     * const service = new GroupsService(supabase);
     * const result = await service.getGroupsForUser(userId, { limit: 20, offset: 0 });
     * ```
     */
    async getGroupsForUser(
        userId: string,
        params: PaginationParams
    ): Promise<PaginatedResponse<GroupListItemDTO>> {
        const { data, error, count } = await this.supabase
            .from('group_members')
            .select(
                `
				role,
				joined_at,
				group:groups!inner (
					id,
					name,
					created_at,
					members:group_members(count)
				)
			`,
                { count: 'exact' }
            )
            .eq('user_id', userId)
            .order('joined_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        if (error) {
            throw new Error(`Failed to fetch groups: ${error.message}`);
        }

        // Map database response to DTO format
        const mappedData: GroupListItemDTO[] = (
            (data as unknown as GroupListItemQueryResult[]) || []
        ).map((item) => ({
            id: item.group.id,
            name: item.group.name,
            role: item.role,
            // Supabase count aggregation returns an array with a single object containing count
            memberCount: item.group.members?.[0]?.count ?? 0,
            createdAt: item.group.created_at,
            joinedAt: item.joined_at,
        }));

        return {
            data: mappedData,
            pagination: {
                total: count ?? 0,
                limit: params.limit,
                offset: params.offset,
            },
        };
    }

    /**
     * Retrieves detailed information about a specific group for the Group Hub.
     *
     * @param userId - ID of the authenticated user
     * @param groupId - ID of the group to retrieve
     * @returns Group details including counts, user role, admin info, next event and user's children
     * @throws Error if group not found or user is not a member
     */
    async getGroupDetail(userId: string, groupId: string): Promise<GroupDetailDTO> {
        // 1. Fetch group membership and basic group info
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select(
                `
				role,
				group:groups!inner (
					id,
					name,
					created_by,
					created_at,
					members:group_members(count),
					children:children(count)
				)
			`
            )
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || !membership) {
            throw new Error('Group not found or access denied');
        }

        // Cast joined data to our helper interface
        const group = membership.group as unknown as GroupWithCounts;

        const today = new Date().toISOString().split('T')[0];

        // 2. Double Safety: Get IDs of children belonging to the user in this group
        const { data: myChildrenInGroup } = await this.supabase
            .from('children')
            .select('id')
            .eq('group_id', groupId)
            .eq('parent_id', userId);
        const myChildrenIds = myChildrenInGroup?.map((c) => c.id) || [];

        // 3. Double Safety: Get event IDs where user's children are invited
        const { data: guestEntries } = await this.supabase
            .from('event_guests')
            .select('event_id')
            .in('child_id', myChildrenIds.length > 0 ? myChildrenIds : ['00000000-0000-0000-0000-000000000000']);
        const invitedEventIds = guestEntries?.map((ge) => ge.event_id) || [];

        // 4. Involvement filter for events
        const involvementFilters = [`organizer_id.eq.${userId}`];
        if (myChildrenIds.length > 0) {
            involvementFilters.push(`child_id.in.(${myChildrenIds.join(',')})`);
        }
        if (invitedEventIds.length > 0) {
            involvementFilters.push(`id.in.(${invitedEventIds.join(',')})`);
        }
        const involvementOrString = involvementFilters.join(',');

        // 5. Fetch additional data in parallel
        const [
            adminProfileData,
            adminChildrenData,
            nextEventData,
            myChildrenData,
            upcomingEventsCountData,
        ] = await Promise.all([
            // Fetch admin's profile (first_name)
            this.supabase
                .from('profiles')
                .select('first_name')
                .eq('id', group.created_by)
                .single(),

            // Fetch admin's children names in this group
            this.supabase
                .from('children')
                .select('display_name')
                .eq('group_id', groupId)
                .eq('parent_id', group.created_by),

            // Fetch nearest upcoming event (with involvement filter)
            this.supabase
                .from('events')
                .select(
                    `
					*,
					child:children!events_child_id_fkey(display_name),
					guests:event_guests(count)
				`
                )
                .eq('group_id', groupId)
                .gte('event_date', today)
                .or(involvementOrString)
                .order('event_date', { ascending: true })
                .limit(1)
                .maybeSingle(),

            // Fetch user's children in this group
            this.supabase
                .from('children')
                .select('*')
                .eq('group_id', groupId)
                .eq('parent_id', userId)
                .order('display_name', { ascending: true }),

            // Fetch count of upcoming events (with involvement filter)
            this.supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', groupId)
                .gte('event_date', today)
                .or(involvementOrString),
        ]);

        // Process admin name (now using first_name)
        const adminName = adminProfileData.data?.first_name || 'Administrator';

        if (nextEventData.error) {
            console.error(`[GroupsService.getGroupDetail] Error fetching nextEvent for group ${groupId}:`, nextEventData.error);
        }

        // Process next event
        let nextEvent: EventListItemDTO | null = null;
        if (nextEventData.data) {
            const e = nextEventData.data as unknown as EventWithDetails;
            nextEvent = {
                id: e.id,
                title: e.title,
                eventDate: e.event_date,
                description: e.description,
                childId: e.child_id,
                childName: e.child?.display_name || null,
                organizerId: e.organizer_id,
                isOrganizer: e.organizer_id === userId,
                guestCount: e.guests?.[0]?.count ?? 0,
                hasNewUpdates: new Date(e.updated_at) > new Date(Date.now() - 8 * 60 * 60 * 1000),
                createdAt: e.created_at,
                updatedAt: e.updated_at,
            };
        }

        // Process my children
        const myChildren: ChildListItemDTO[] = (myChildrenData.data || []).map(
            (c: ChildEntity) => ({
                id: c.id,
                displayName: c.display_name,
                bio: c.bio,
                birthDate: c.birth_date,
                parentId: c.parent_id,
                isOwner: true,
                createdAt: c.created_at,
            })
        );

        return {
            id: group.id,
            name: group.name,
            role: membership.role as 'admin' | 'member',
            memberCount: group.members?.[0]?.count ?? 0,
            childrenCount: group.children?.[0]?.count ?? 0,
            upcomingEventsCount: upcomingEventsCountData.count ?? 0,
            createdBy: group.created_by,
            createdAt: group.created_at,
            adminName,
            nextEvent,
            myChildren,
        };
    }

    /**
     * Retrieves the admin's contact information.
     *
     * @param userId - ID of the authenticated user (to verify membership)
     * @param groupId - ID of the group
     * @returns Admin contact information
     */
    async getAdminContact(userId: string, groupId: string): Promise<AdminContactDTO> {
        // First verify user is a member of the group
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || !membership) {
            throw new Error('Access denied or group not found');
        }

        // Fetch group and admin profile
        const { data: group, error: groupError } = await this.supabase
            .from('groups')
            .select(
                `
                created_by,
                admin_profile:profiles!groups_created_by_fkey (
                    id,
                    email,
                    first_name
                )
            `
            )
            .eq('id', groupId)
            .single();

        if (groupError || !group || !group.admin_profile || !group.created_by) {
            throw new Error('Admin contact not found');
        }

        // Fetch admin's children names
        const { data: children, error: childrenError } = await this.supabase
            .from('children')
            .select('display_name')
            .eq('group_id', groupId)
            .eq('parent_id', group.created_by);

        return {
            userId: group.admin_profile.id,
            firstName: group.admin_profile.first_name,
            email: group.admin_profile.email || '',
            childrenNames: (children || []).map((c) => c.display_name),
        };
    }

    /**
     * Retrieves a list of members for a specific group.
     *
     * @param userId - ID of the authenticated user (to verify membership)
     * @param groupId - ID of the group
     * @param params - Pagination parameters
     * @returns Paginated list of group members
     */
    async getGroupMembers(
        userId: string,
        groupId: string,
        params: PaginationParams
    ): Promise<PaginatedResponse<GroupMemberDTO>> {
        // First verify user is a member of the group
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || !membership) {
            throw new Error('Access denied or group not found');
        }

        const { data, error, count } = await this.supabase
            .from('group_members')
            .select(
                `
				user_id,
				role,
				joined_at,
				profile:profiles (
					first_name,
					children:children (
						display_name
					)
				)
			`,
                { count: 'exact' }
            )
            .eq('group_id', groupId)
            .order('joined_at', { ascending: true })
            .range(params.offset, params.offset + params.limit - 1);

        if (error) {
            throw new Error(`Failed to fetch members: ${error.message}`);
        }

        const mappedData: GroupMemberDTO[] = (
            (data as unknown as GroupMemberQueryResult[]) || []
        ).map((item) => ({
            userId: item.user_id,
            firstName: item.profile?.first_name || 'Użytkownik',
            role: item.role,
            joinedAt: item.joined_at,
            childrenNames: item.profile?.children?.map((c) => c.display_name) || [],
        }));

        return {
            data: mappedData,
            pagination: {
                total: count ?? 0,
                limit: params.limit,
                offset: params.offset,
            },
        };
    }

    /**
     * Retrieves a list of children for a specific group.
     *
     * @param userId - ID of the authenticated user (to verify membership)
     * @param groupId - ID of the group
     * @param params - Pagination parameters
     * @returns Paginated list of children in the group
     */
    async getGroupChildren(
        userId: string,
        groupId: string,
        params: PaginationParams
    ): Promise<PaginatedResponse<ChildListItemDTO>> {
        // First verify user is a member of the group
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || !membership) {
            throw new Error('Access denied or group not found');
        }

        const { data, error, count } = await this.supabase
            .from('children')
            .select('*', { count: 'exact' })
            .eq('group_id', groupId)
            .order('display_name', { ascending: true })
            .range(params.offset, params.offset + params.limit - 1);

        if (error) {
            throw new Error(`Failed to fetch children: ${error.message}`);
        }

        const mappedData: ChildListItemDTO[] = (data || []).map((item) => ({
            id: item.id,
            displayName: item.display_name,
            bio: item.bio,
            birthDate: item.birth_date,
            parentId: item.parent_id,
            isOwner: item.parent_id === userId,
            createdAt: item.created_at,
        }));

        return {
            data: mappedData,
            pagination: {
                total: count ?? 0,
                limit: params.limit,
                offset: params.offset,
            },
        };
    }

    /**
     * Updates group settings. Admin only.
     *
     * @param userId - ID of the authenticated user
     * @param groupId - ID of the group to update
     * @param command - Update command containing new settings
     * @returns Updated group data
     * @throws Error if group not found or user is not an admin
     */
    async updateGroup(
        userId: string,
        groupId: string,
        command: UpdateGroupCommand
    ): Promise<UpdateGroupResponseDTO> {
        // Verify user is an admin
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || membership?.role !== 'admin') {
            throw new Error('Forbidden: Only group admins can update group settings');
        }

        const updateData: Partial<Database['public']['Tables']['groups']['Update']> = {};
        if (command.name) updateData.name = command.name.trim();

        const { data, error } = await this.supabase
            .from('groups')
            .update(updateData)
            .eq('id', groupId)
            .select('id, name')
            .single();

        if (error || !data) {
            throw new Error(`Failed to update group: ${error?.message}`);
        }

        return {
            id: data.id,
            name: data.name,
            updatedAt: new Date().toISOString(),
        };
    }

    /**
     * Deletes a group and all related data. Admin only.
     *
     * @param userId - ID of the authenticated user
     * @param groupId - ID of the group to delete
     * @throws Error if group not found or user is not an admin
     */
    async deleteGroup(userId: string, groupId: string): Promise<void> {
        // Verify user is an admin
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || membership?.role !== 'admin') {
            throw new Error('Forbidden: Only group admins can delete the group');
        }

        const { error } = await this.supabase.from('groups').delete().eq('id', groupId);

        if (error) {
            throw new Error(`Failed to delete group: ${error.message}`);
        }
    }

    /**
     * Removes a member from a group and their associated children.
     * Can be performed by the user themselves or by a group admin.
     *
     * @param requesterId - ID of the user performing the request
     * @param groupId - ID of the group
     * @param targetUserId - ID of the user to be removed
     * @throws ForbiddenError if requester has no permission
     * @throws NotFoundError if group or member not found
     * @throws ConflictError if trying to remove the last admin
     */
    async removeMember(requesterId: string, groupId: string, targetUserId: string): Promise<void> {
        // 1. Get requester and target roles
        const { data: members, error: membersError } = await this.supabase
            .from('group_members')
            .select('user_id, role')
            .eq('group_id', groupId)
            .in('user_id', [requesterId, targetUserId]);

        if (membersError) {
            throw new Error(`Failed to fetch membership info: ${membersError.message}`);
        }

        const requester = members?.find((m) => m.user_id === requesterId);
        const target = members?.find((m) => m.user_id === targetUserId);

        if (!requester) {
            throw new ForbiddenError('Access denied or group not found');
        }

        if (!target) {
            throw new NotFoundError('Target user is not a member of this group');
        }

        // 2. Permission check: requester is admin OR requester is removing themselves
        const isAdmin = requester.role === 'admin';
        const isSelf = requesterId === targetUserId;

        if (!isAdmin && !isSelf) {
            throw new ForbiddenError('Only admins can remove other members');
        }

        // 3. Prevent removing the last admin
        if (target.role === 'admin') {
            const { count, error: countError } = await this.supabase
                .from('group_members')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', groupId)
                .eq('role', 'admin');

            if (countError) {
                throw new Error(`Failed to count admins: ${countError.message}`);
            }

            if (count === 1) {
                throw new ConflictError('Cannot remove the last administrator of the group');
            }
        }

        // 4. Cleanup and removal
        // Note: We don't have built-in transactions in the JS client, so we execute sequentially.
        // We delete children first to avoid orphaned records.

        // Delete children of the target user in this group
        const { error: childrenError } = await this.supabase
            .from('children')
            .delete()
            .eq('group_id', groupId)
            .eq('parent_id', targetUserId);

        if (childrenError) {
            throw new Error(`Failed to remove children: ${childrenError.message}`);
        }

        // Remove group membership
        const { error: memberError } = await this.supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', targetUserId);

        if (memberError) {
            throw new Error(`Failed to remove group member: ${memberError.message}`);
        }
    }

    /**
     * Generates a new invite code for a group. Admin only.
     *
     * @param userId - ID of the authenticated user
     * @param groupId - ID of the group
     * @returns Created invite details
     * @throws Error if group not found or user is not an admin
     */
    async createInvite(userId: string, groupId: string): Promise<GroupInviteDTO> {
        // Verify user is an admin
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || membership?.role !== 'admin') {
            throw new Error('Forbidden: Only group admins can generate invite codes');
        }

        // Check if there is already an active invite for this group
        const { data: activeInvite, error: activeInviteError } = await this.supabase
            .from('group_invites')
            .select('code')
            .eq('group_id', groupId)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (activeInvite) {
            throw new Error('Active invite code already exists for this group');
        }

        // Rate limit: max 5 codes per hour per group
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentInvitesCount, error: countError } = await this.supabase
            .from('group_invites')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', groupId)
            .gte('created_at', oneHourAgo);

        if (countError) {
            throw new Error(`Failed to check invite limit: ${countError.message}`);
        }

        if (recentInvitesCount !== null && recentInvitesCount >= 5) {
            throw new Error('Rate limit exceeded: Max 5 invite codes per hour');
        }

        // Generate random 8-character alphanumeric code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now

        const { data, error } = await this.supabase
            .from('group_invites')
            .insert({
                code,
                group_id: groupId,
                created_by: userId,
                expires_at: expiresAt,
            })
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Failed to create invite: ${error?.message}`);
        }

        return {
            code: data.code,
            groupId: data.group_id,
            expiresAt: data.expires_at,
            createdAt: data.created_at,
        };
    }

    /**
     * Retrieves active invite codes for a group. Admin only.
     *
     * @param userId - ID of the authenticated user
     * @param groupId - ID of the group
     * @returns List of active invites
     */
    async getInvites(userId: string, groupId: string): Promise<GroupInviteListItemDTO[]> {
        // Verify user is an admin
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || membership?.role !== 'admin') {
            throw new Error('Forbidden: Only group admins can view invitation codes');
        }

        const { data, error } = await this.supabase
            .from('group_invites')
            .select('code, expires_at, created_at')
            .eq('group_id', groupId)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch invites: ${error.message}`);
        }

        return (data || []).map((item) => ({
            code: item.code,
            expiresAt: item.expires_at,
            createdAt: item.created_at,
        }));
    }

    /**
     * Revokes an invite code. Admin only.
     *
     * @param userId - ID of the authenticated user
     * @param groupId - ID of the group
     * @param code - The invite code to revoke
     */
    async revokeInvite(userId: string, groupId: string, code: string): Promise<void> {
        // Verify user is an admin
        const { data: membership, error: membershipError } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (membershipError || membership?.role !== 'admin') {
            throw new Error('Forbidden: Only group admins can revoke invitation codes');
        }

        const { error } = await this.supabase
            .from('group_invites')
            .delete()
            .eq('code', code)
            .eq('group_id', groupId);

        if (error) {
            throw new Error(`Failed to revoke invite: ${error.message}`);
        }
    }

    /**
     * Joins a group using an invite code.
     *
     * @param userId - ID of the authenticated user
     * @param command - Join command containing the invite code
     * @returns Joined group details
     */
    async joinGroupByCode(
        userId: string,
        command: JoinGroupCommand
    ): Promise<JoinGroupResponseDTO> {
        const { code } = command;

        // 1. Look up code and check expiration
        const { data: invite, error: inviteError } = await this.supabase
            .from('group_invites')
            .select('group_id, expires_at, groups(name)')
            .eq('code', code)
            .single();

        if (inviteError || !invite) {
            throw new Error('Invalid or expired invite code');
        }

        if (new Date(invite.expires_at) < new Date()) {
            throw new Error('Invite code has expired');
        }

        const groupId = invite.group_id;
        const groupName = (invite as unknown as { groups: { name: string } }).groups.name;

        // 2. Check if already a member
        const { data: existingMember } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (existingMember) {
            throw new Error('Jesteś już członkiem tej grupy');
        }

        // 3. Join the group
        const { data: membership, error: joinError } = await this.supabase
            .from('group_members')
            .insert({
                group_id: groupId,
                user_id: userId,
                role: 'member',
            })
            .select('joined_at, role')
            .single();

        if (joinError || !membership) {
            throw new Error(`Failed to join group: ${joinError?.message}`);
        }

        return {
            groupId,
            groupName,
            role: membership.role as 'admin' | 'member',
            joinedAt: membership.joined_at,
        };
    }
}

/**
 * Factory function to create a GroupsService instance.
 *
 * @param supabase - The typed Supabase client instance
 * @returns A new GroupsService instance
 */
export const createGroupsService = (supabase: TypedSupabaseClient) => {
    return new GroupsService(supabase);
};
