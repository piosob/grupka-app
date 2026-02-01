import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
    ChildListItemDTO,
    CreateChildCommand,
    CreateChildResponseDTO,
    ChildDetailDTO,
    UpdateChildCommand,
    UpdateChildResponseDTO,
    PaginationParams,
} from '../schemas';
import type { PaginatedResponse } from '../../types';
import { AppError } from '../errors';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Service for managing child profiles.
 * Handles CRUD operations for children in groups.
 */
export class ChildrenService {
    constructor(private supabase: TypedSupabaseClient) {}

    /**
     * Retrieves all children belonging to the authenticated user.
     *
     * @param userId - ID of the authenticated user
     * @returns List of all children owned by the user
     */
    async getMyChildren(userId: string): Promise<ChildListItemDTO[]> {
        const { data, error } = await this.supabase
            .from('children')
            .select('*')
            .eq('parent_id', userId)
            .order('display_name', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch your children: ${error.message}`);
        }

        return (data || []).map((item) => ({
            id: item.id,
            displayName: item.display_name,
            bio: item.bio,
            birthDate: item.birth_date,
            parentId: item.parent_id,
            isOwner: true,
            createdAt: item.created_at,
        }));
    }

    /**
     * Verifies if a user is a member of a group.
     * @private
     */
    private async checkGroupMembership(userId: string, groupId: string): Promise<void> {
        const { data, error } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !data) {
            throw new AppError('FORBIDDEN', 'You must be a member of this group to access its children');
        }
    }

    /**
     * Retrieves a paginated list of children in a group.
     *
     * @param groupId - ID of the group
     * @param userId - ID of the authenticated user (to verify membership)
     * @param params - Pagination parameters (limit, offset)
     * @returns Paginated list of children
     */
    async listChildren(
        groupId: string,
        userId: string,
        params: PaginationParams
    ): Promise<PaginatedResponse<ChildListItemDTO>> {
        // Verify membership
        await this.checkGroupMembership(userId, groupId);

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
     * Checks if a child with the same display name already exists in a group.
     * @param groupId - ID of the group
     * @param displayName - Name to check
     * @param excludeChildId - Optional child ID to exclude from check (for updates)
     * @returns True if the name is unique, false otherwise
     */
    async isNameUnique(
        groupId: string,
        displayName: string,
        excludeChildId?: string
    ): Promise<boolean> {
        let query = this.supabase
            .from('children')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', groupId)
            .ilike('display_name', displayName.trim());

        if (excludeChildId) {
            query = query.neq('id', excludeChildId);
        }

        const { count, error } = await query;

        if (error) {
            throw new Error(`Failed to check name uniqueness: ${error.message}`);
        }

        return (count ?? 0) === 0;
    }

    /**
     * Creates a new child profile in a group.
     *
     * @param groupId - ID of the group
     * @param parentId - ID of the parent (creator)
     * @param command - Child creation command
     * @returns Created child data
     */
    async createChild(
        groupId: string,
        parentId: string,
        command: CreateChildCommand
    ): Promise<CreateChildResponseDTO> {
        // Verify membership before creating
        await this.checkGroupMembership(parentId, groupId);

        // Check name uniqueness
        const isUnique = await this.isNameUnique(groupId, command.displayName);
        if (!isUnique) {
            throw new Error(
                `${command.displayName.trim()} już istnieje w grupie. Proszę podaj pierwszą literę nazwiska (np. ${command.displayName.trim()}N) lub inny wyróżnik.`
            );
        }

        const { data: child, error } = await this.supabase
            .from('children')
            .insert({
                group_id: groupId,
                parent_id: parentId,
                display_name: command.displayName.trim(),
                bio: command.bio?.trim() || null,
                birth_date: command.birthDate || null,
            })
            .select('*')
            .single();

        if (error || !child) {
            throw new Error(`Failed to create child: ${error?.message}`);
        }

        return {
            id: child.id,
            displayName: child.display_name,
            bio: child.bio,
            birthDate: child.birth_date,
            groupId: child.group_id,
            parentId: child.parent_id,
            createdAt: child.created_at,
        };
    }

    /**
     * Retrieves detailed information about a specific child.
     *
     * @param childId - ID of the child
     * @param userId - ID of the authenticated user (to verify access via group membership)
     * @returns Child details
     */
    async getChild(childId: string, userId: string): Promise<ChildDetailDTO> {
        const { data: child, error } = await this.supabase
            .from('children')
            .select('*')
            .eq('id', childId)
            .single();

        if (error || !child) {
            throw new AppError('NOT_FOUND', 'Child not found');
        }

        // Verify user is a member of the child's group
        await this.checkGroupMembership(userId, child.group_id);

        return {
            id: child.id,
            displayName: child.display_name,
            bio: child.bio,
            birthDate: child.birth_date,
            groupId: child.group_id,
            parentId: child.parent_id,
            isOwner: child.parent_id === userId,
            createdAt: child.created_at,
        };
    }

    /**
     * Updates a child profile. Only the parent can update.
     *
     * @param childId - ID of the child
     * @param userId - ID of the authenticated user
     * @param command - Update command
     * @returns Updated child data
     */
    async updateChild(
        childId: string,
        userId: string,
        command: UpdateChildCommand
    ): Promise<UpdateChildResponseDTO> {
        // Check ownership first
        const { data: child, error: fetchError } = await this.supabase
            .from('children')
            .select('parent_id, group_id')
            .eq('id', childId)
            .single();

        if (fetchError || !child) {
            throw new AppError('NOT_FOUND', 'Child not found');
        }

        if (child.parent_id !== userId) {
            throw new AppError('FORBIDDEN', 'Only the parent can update the child profile');
        }

        // Check name uniqueness if name is changing
        if (command.displayName !== undefined) {
            const isUnique = await this.isNameUnique(
                child.group_id,
                command.displayName,
                childId
            );
            if (!isUnique) {
                throw new Error(
                    `${command.displayName.trim()} już istnieje w grupie. Proszę podaj pierwszą literę nazwiska (np. ${command.displayName.trim()}N) lub inny wyróżnik.`
                );
            }
        }

        const updateData: Partial<Database['public']['Tables']['children']['Update']> = {};
        if (command.displayName !== undefined) updateData.display_name = command.displayName.trim();
        if (command.bio !== undefined) updateData.bio = command.bio?.trim() || null;
        if (command.birthDate !== undefined) updateData.birth_date = command.birthDate;

        const { data: updatedChild, error: updateError } = await this.supabase
            .from('children')
            .update(updateData)
            .eq('id', childId)
            .select('*')
            .single();

        if (updateError || !updatedChild) {
            throw new Error(`Failed to update child: ${updateError?.message}`);
        }

        return {
            id: updatedChild.id,
            displayName: updatedChild.display_name,
            bio: updatedChild.bio,
            birthDate: updatedChild.birth_date,
            updatedAt: new Date().toISOString(), // DB has updated_at but DTO might expect ISO string from us
        };
    }

    /**
     * Deletes a child profile. Only the parent can delete.
     *
     * @param childId - ID of the child
     * @param userId - ID of the authenticated user
     */
    async deleteChild(childId: string, userId: string): Promise<void> {
        // Check ownership first
        const { data: child, error: fetchError } = await this.supabase
            .from('children')
            .select('parent_id')
            .eq('id', childId)
            .single();

        if (fetchError || !child) {
            throw new AppError('NOT_FOUND', 'Child not found');
        }

        if (child.parent_id !== userId) {
            throw new AppError('FORBIDDEN', 'Only the parent can delete the child profile');
        }

        const { error: deleteError } = await this.supabase
            .from('children')
            .delete()
            .eq('id', childId);

        if (deleteError) {
            throw new Error(`Failed to delete child: ${deleteError.message}`);
        }
    }
}

/**
 * Factory function to create a ChildrenService instance.
 */
export const createChildrenService = (supabase: TypedSupabaseClient) => {
    return new ChildrenService(supabase);
};
