import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { UpdateEventCommandSchema } from '../../../lib/schemas';
import {
    createEventsService,
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from '../../../lib/services/events.service';

export const prerender = false;

/**
 * GET /api/events/:eventId
 *
 * Retrieves detailed information about a specific event.
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

        // === Business Logic ===
        const eventsService = createEventsService(locals.supabase);
        const result = await eventsService.getEventDetail(eventId, user.id);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, `[GET /api/events/${params.eventId}]`);
    }
};

/**
 * PATCH /api/events/:eventId
 *
 * Updates an existing event. Only the organizer can perform this action.
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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
        const command = UpdateEventCommandSchema.parse(body);

        // === Business Logic ===
        const eventsService = createEventsService(locals.supabase);
        const result = await eventsService.updateEvent(eventId, user.id, command);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, `[PATCH /api/events/${params.eventId}]`);
    }
};

/**
 * DELETE /api/events/:eventId
 *
 * Deletes an event. Only the organizer can perform this action.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

        // === Business Logic ===
        const eventsService = createEventsService(locals.supabase);
        await eventsService.deleteEvent(eventId, user.id);

        // === Happy Path: Success (No Content) ===
        return new Response(null, { status: 204 });
    } catch (error) {
        return handleApiError(error, `[DELETE /api/events/${params.eventId}]`);
    }
};

/**
 * Common error handler for API routes.
 */
function handleApiError(error: unknown, context: string): Response {
    if (error instanceof z.ZodError) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (error instanceof ForbiddenError) {
        return new Response(
            JSON.stringify({ error: { code: 'FORBIDDEN', message: error.message } }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (error instanceof NotFoundError) {
        return new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message: error.message } }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (error instanceof ValidationError) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.message,
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    console.error(`${context} Unexpected error:`, error);
    return new Response(
        JSON.stringify({
            error: { code: 'SERVICE_UNAVAILABLE', message: 'An unexpected error occurred' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
}

