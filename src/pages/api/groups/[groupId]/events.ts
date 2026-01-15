import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { EventsQueryParamsSchema, CreateEventCommandSchema } from '../../../../lib/schemas';
import { createEventsService } from '../../../../lib/services/events.service';
import { handleApiError } from '../../../../lib/api-utils';

export const prerender = false;

/**
 * GET /api/groups/:groupId/events
 *
 * Retrieves a paginated list of events for a specific group.
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
    try {
        const { groupId } = params;
        if (!groupId || !z.string().uuid().safeParse(groupId).success) {
            return new Response(
                JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid groupId format' },
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
        const queryParams = {
            limit: url.searchParams.get('limit') ?? undefined,
            offset: url.searchParams.get('offset') ?? undefined,
            upcoming: url.searchParams.get('upcoming') === 'true',
            sortBy: url.searchParams.get('sortBy') ?? undefined,
            sortOrder: url.searchParams.get('sortOrder') ?? undefined,
        };

        const validatedParams = EventsQueryParamsSchema.parse(queryParams);

        // === Business Logic ===
        const eventsService = createEventsService(locals.supabase);
        const result = await eventsService.listEvents(groupId, user.id, validatedParams);

        // === Happy Path: Success ===
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, '[GET /api/groups/:groupId/events]');
    }
};

/**
 * POST /api/groups/:groupId/events
 *
 * Creates a new event for a specific group.
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
    try {
        const { groupId } = params;
        if (!groupId || !z.string().uuid().safeParse(groupId).success) {
            return new Response(
                JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid groupId format' },
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
        const command = CreateEventCommandSchema.parse(body);

        // === Business Logic ===
        const eventsService = createEventsService(locals.supabase);
        const result = await eventsService.createEvent(groupId, user.id, command);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                Location: `/api/events/${result.id}`,
            },
        });
    } catch (error) {
        return handleApiError(error, '[POST /api/groups/:groupId/events]');
    }
};
