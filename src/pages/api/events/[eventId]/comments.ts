import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { CreateEventCommentCommandSchema, PaginationParamsSchema } from '../../../../lib/schemas';
import { createEventCommentsService } from '../../../../lib/services/event_comments.service';
import { handleApiError } from '../../../../lib/api-utils';

export const prerender = false;

/**
 * GET /api/events/:eventId/comments
 *
 * Retrieves a paginated list of comments for an event's hidden thread.
 * Hidden from the event organizer.
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
    try {
        const { eventId } = params;
        if (!eventId || !z.string().uuid().safeParse(eventId).success) {
            return new Response(
                JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid eventId format' },
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

        // === Extract and Validate Query Parameters ===
        const url = new URL(request.url);
        const queryLimit = url.searchParams.get('limit');
        const queryOffset = url.searchParams.get('offset');

        const paginationParams = PaginationParamsSchema.parse({
            limit: queryLimit === null ? undefined : queryLimit,
            offset: queryOffset === null ? undefined : queryOffset,
        });

        // === Business Logic ===
        const service = createEventCommentsService(locals.supabase);
        const result = await service.listComments(eventId, user.id, paginationParams);

        // === Happy Path: Success ===
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, `[GET /api/events/${params.eventId}/comments]`);
    }
};

/**
 * POST /api/events/:eventId/comments
 *
 * Adds a new comment to an event's hidden thread.
 * Hidden from the event organizer.
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
    try {
        const { eventId } = params;
        if (!eventId || !z.string().uuid().safeParse(eventId).success) {
            return new Response(
                JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid eventId format' },
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

        // === GUARD: JSON Parsing ===
        let body;
        try {
            body = await request.json();
        } catch {
            return new Response(
                JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON in request body' },
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // === GUARD: Schema Validation ===
        const command = CreateEventCommentCommandSchema.parse(body);

        // === Business Logic ===
        const service = createEventCommentsService(locals.supabase);
        const result = await service.addComment(eventId, user.id, command);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, `[POST /api/events/${params.eventId}/comments]`);
    }
};
