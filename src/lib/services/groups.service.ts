import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { CreateGroupCommand, CreateGroupResponseDTO } from '../schemas';

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
		const { error: memberError } = await this.supabase
			.from('group_members')
			.insert({
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

