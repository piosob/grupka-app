import { createEventCommentsService } from '@/lib/services/event_comments.service';
import { handleApiError } from '@/lib/api-utils';
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';

export const prerender = false;

/**
 * DELETE /api/events/:eventId/comments/:commentId
 *
 * Deletes a comment from an event's hidden thread.
 * Only the author of the comment can perform this action.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
    const { eventId, commentId } = params;

    try {
        // === GUARD: Parameter Validation ===
        if (!eventId || !z.string().uuid().safeParse(eventId).success) {
            return new Response(
                JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid eventId format' },
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!commentId || !z.string().uuid().safeParse(commentId).success) {
            return new Response(
                JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid commentId format' },
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // === GUARD: Authentication ===
        const {
            data: { user },
            error: authError,
        } = await locals.supabase.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
                }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // === Business Logic ===
        const service = createEventCommentsService(locals.supabase);
        await service.deleteComment(eventId, commentId, user.id);

        // === Happy Path: Success (No Content) ===
        return new Response(null, { status: 204 });
    } catch (error) {
        return handleApiError(error, `[DELETE /api/events/${eventId}/comments/${commentId}]`);
    }
};
