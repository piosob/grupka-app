import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
    CreateGroupCommand,
    CreateGroupResponseDTO,
    GroupListItemDTO,
    GroupDetailDTO,
    GroupMemberDTO,
    ChildListItemDTO,
    UpdateGroupCommand,
    UpdateGroupResponseDTO,
    GroupInviteDTO,
    GroupInviteListItemDTO,
    JoinGroupCommand,
    JoinGroupResponseDTO,
    PaginationParams,
} from '../schemas';
import type { PaginatedResponse } from '../../types';

type TypedSupabaseClient = SupabaseClient<Database>;

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
        const mappedData: GroupListItemDTO[] = (data || []).map((item: any) => ({
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
     * Retrieves detailed information about a specific group.
     *
     * @param userId - ID of the authenticated user
     * @param groupId - ID of the group to retrieve
     * @returns Group details including counts and user role
     * @throws Error if group not found or user is not a member
     */
    async getGroupDetail(userId: string, groupId: string): Promise<GroupDetailDTO> {
        const { data, error } = await this.supabase
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
					children:children(count),
					events:events(count)
				)
			`
            )
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            throw new Error('Group not found or access denied');
        }

        const group = data.group as any;

        return {
            id: group.id,
            name: group.name,
            role: data.role as 'admin' | 'member',
            memberCount: group.members?.[0]?.count ?? 0,
            childrenCount: group.children?.[0]?.count ?? 0,
            // upcomingEventsCount logic: for now returning total events
            // TODO: Filter events by date if needed in the query
            upcomingEventsCount: group.events?.[0]?.count ?? 0,
            createdBy: group.created_by,
            createdAt: group.created_at,
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

        const mappedData: GroupMemberDTO[] = (data || []).map((item: any) => ({
            userId: item.user_id,
            role: item.role,
            joinedAt: item.joined_at,
            childrenNames: item.profile?.children?.map((c: any) => c.display_name) || [],
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

        const mappedData: ChildListItemDTO[] = (data || []).map((item: any) => ({
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

        const updateData: any = {};
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

        // Generate random 8-character alphanumeric code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes from now

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
        const groupName = (invite as any).groups.name;

        // 2. Check if already a member
        const { data: existingMember } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (existingMember) {
            throw new Error('Already a member of this group');
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
