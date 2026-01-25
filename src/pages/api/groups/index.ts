import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { CreateGroupCommandSchema, PaginationParamsSchema } from '../../../lib/schemas';
import { createGroupsService } from '../../../lib/services/groups.service';
import { ConflictError } from '../../../lib/errors';

/**
 * GET /api/groups
 *
 * Retrieves a paginated list of groups for the authenticated user.
 *
 * Query parameters:
 * - limit (number, default 20, max 100): Maximum number of results
 * - offset (number, default 0): Number of results to skip
 *
 * Responses:
 * - 200 OK: Successfully retrieved list
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 500 Internal Server Error: Unexpected server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
    try {
        // === GUARD: Authentication ===
        const {
            data: { user },
            error: authError,
        } = await locals.supabase.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Extract and Validate Query Parameters ===
        const url = new URL(request.url);
        const queryLimit = url.searchParams.get('limit');
        const queryOffset = url.searchParams.get('offset');

        const params = PaginationParamsSchema.parse({
            limit: queryLimit === null ? undefined : queryLimit,
            offset: queryOffset === null ? undefined : queryOffset,
        });

        // === Business Logic ===
        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.getGroupsForUser(user.id, params);

        // === Happy Path: Success ===
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        // === Error Handling ===

        // Zod validation errors
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
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Unexpected errors
        console.error('[GET /api/groups] Unexpected error:', error);
        return new Response(
            JSON.stringify({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'An unexpected error occurred',
                },
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

/**
 * POST /api/groups
 *
 * Creates a new group and assigns the authenticated user as admin.
 *
 * Request body:
 * - name (string, 3-100 characters): The name of the group
 *
 * Responses:
 * - 201 Created: Group successfully created
 * - 400 Bad Request: Invalid input or JSON parsing error
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // === GUARD: Authentication ===
        const {
            data: { user },
            error: authError,
        } = await locals.supabase.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === GUARD: JSON Parsing ===
        let body;
        try {
            body = await request.json();
        } catch {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid JSON in request body',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === GUARD: Schema Validation ===
        const command = CreateGroupCommandSchema.parse(body);

        // === Business Logic ===
        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.createGroup(user.id, command);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                Location: `/api/groups/${result.id}`,
            },
        });
    } catch (error) {
        // === Error Handling ===

        // Handle business logic errors
        if (error instanceof ConflictError) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'CONFLICT',
                        message: error.message,
                    },
                }),
                {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Zod validation errors
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
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Unexpected errors
        console.error('[POST /api/groups] Unexpected error:', error);
        return new Response(
            JSON.stringify({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'An unexpected error occurred',
                },
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
