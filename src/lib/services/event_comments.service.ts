import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import type { EventCommentDTO, CreateEventCommentCommand, PaginationParams } from '@/lib/schemas';
import type { PaginatedResponse, EventCommentQueryResult } from '@/types';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Service for managing event comments (hidden thread).
 */
export class EventCommentsService {
    constructor(private supabase: TypedSupabaseClient) {}

    /**
     * Checks if a user is a member of a group.
     */
    private async isUserGroupMember(groupId: string, userId: string): Promise<boolean> {
        const { count, error } = await this.supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) return false;
        return count !== null && count > 0;
    }

    /**
     * Gets event details to check group_id and organizer_id.
     */
    private async getEventBasicInfo(eventId: string) {
        const { data, error } = await this.supabase
            .from('events')
            .select('group_id, organizer_id')
            .eq('id', eventId)
            .single();

        if (error || !data) {
            throw new NotFoundError('Event does not exist');
        }

        return data;
    }

    /**
     * Retrieves a paginated list of comments for an event.
     * Hidden from the event organizer.
     */
    async listComments(
        eventId: string,
        userId: string,
        params: PaginationParams
    ): Promise<PaginatedResponse<EventCommentDTO>> {
        // 1. Get event info
        const event = await this.getEventBasicInfo(eventId);

        // 2. Verify membership
        const isMember = await this.isUserGroupMember(event.group_id, userId);
        if (!isMember) {
            throw new ForbiddenError('Not a member of this group');
        }

        // 3. Surprise Protection: Organizer cannot see comments
        if (event.organizer_id === userId) {
            throw new ForbiddenError('Organizers cannot view the hidden thread');
        }

        // 4. Fetch comments with author children names (filtered by group)
        // Use !inner to allow filtering by nested group_id
        const { data, error, count } = await this.supabase
            .from('event_comments')
            .select(
                `
                *,
                author_profile:profiles!event_comments_author_id_fkey!inner (
                    first_name,
                    children:children!inner (
                        display_name
                    )
                )
            `,
                { count: 'exact' }
            )
            .eq('event_id', eventId)
            .eq('author_profile.children.group_id', event.group_id)
            .order('created_at', { ascending: true })
            .range(params.offset, params.offset + params.limit - 1);

        if (error) {
            throw new Error(`Failed to fetch comments: ${error.message}`);
        }

        // 5. Map to DTOs
        const mappedData: EventCommentDTO[] = (
            (data as unknown as EventCommentQueryResult[]) || []
        ).map((comment) => {
            const firstName = comment.author_profile?.first_name || 'Rodzic';
            const childrenNames =
                comment.author_profile?.children?.map((c) => c.display_name) || [];

            const authorLabel =
                childrenNames.length > 0
                    ? `${firstName} (rodzic ${childrenNames.join(', ')})`
                    : firstName;

            return {
                id: comment.id,
                content: comment.content,
                authorId: comment.author_id,
                authorLabel,
                createdAt: comment.created_at,
            };
        });

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
     * Adds a new comment to an event's hidden thread.
     * Hidden from the event organizer.
     */
    async addComment(
        eventId: string,
        userId: string,
        command: CreateEventCommentCommand
    ): Promise<EventCommentDTO> {
        // 1. Get event info
        const event = await this.getEventBasicInfo(eventId);

        // 2. Verify membership
        const isMember = await this.isUserGroupMember(event.group_id, userId);
        if (!isMember) {
            throw new ForbiddenError('Not a member of this group');
        }

        // 3. Surprise Protection: Organizer cannot add comments
        if (event.organizer_id === userId) {
            throw new ForbiddenError('Organizers cannot add comments to the hidden thread');
        }

        // 4. Insert comment
        const { data, error } = await this.supabase
            .from('event_comments')
            .insert({
                event_id: eventId,
                author_id: userId,
                content: command.content,
            })
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Failed to add comment: ${error?.message}`);
        }

        // 5. Fetch author info for the response
        const [profileData, childrenData] = await Promise.all([
            this.supabase.from('profiles').select('first_name').eq('id', userId).single(),
            this.supabase
                .from('children')
                .select('display_name')
                .eq('parent_id', userId)
                .eq('group_id', event.group_id),
        ]);

        const firstName = profileData.data?.first_name || 'Rodzic';
        const childrenNames = childrenData.data?.map((c) => c.display_name) || [];

        const authorLabel =
            childrenNames.length > 0
                ? `${firstName} (rodzic ${childrenNames.join(', ')})`
                : firstName;

        return {
            id: data.id,
            content: data.content,
            authorId: data.author_id,
            authorLabel,
            createdAt: data.created_at,
        };
    }

    /**
     * Deletes a comment. Only the author can delete their own comment.
     */
    async deleteComment(eventId: string, commentId: string, userId: string): Promise<void> {
        // 1. Fetch comment to check ownership
        const { data: comment, error: fetchError } = await this.supabase
            .from('event_comments')
            .select('author_id')
            .eq('id', commentId)
            .eq('event_id', eventId)
            .single();

        if (fetchError || !comment) {
            throw new NotFoundError('Comment does not exist');
        }

        // 2. Verify ownership
        if (comment.author_id !== userId) {
            throw new ForbiddenError('You can only delete your own comments');
        }

        // 3. Delete comment
        const { error: deleteError } = await this.supabase
            .from('event_comments')
            .delete()
            .eq('id', commentId);

        if (deleteError) {
            throw new Error(`Failed to delete comment: ${deleteError.message}`);
        }
    }
}

/**
 * Factory function to create an EventCommentsService instance.
 */
export const createEventCommentsService = (supabase: TypedSupabaseClient) => {
    return new EventCommentsService(supabase);
};
