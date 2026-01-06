import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { UpdateGroupCommandSchema } from '../../../lib/schemas';
import { createGroupsService } from '../../../lib/services/groups.service';

/**
 * GET /api/groups/:groupId
 *
 * Retrieves detailed information about a specific group.
 *
 * Path Parameters:
 * - groupId (uuid): The ID of the group
 *
 * Responses:
 * - 200 OK: Successfully retrieved details
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not a member of the group
 * - 404 Not Found: Group does not exist
 * - 500 Internal Server Error: Unexpected server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
    const { groupId } = params;

    if (!groupId) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Group ID is required',
                },
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

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

        // === Business Logic ===
        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.getGroupDetail(user.id, groupId);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        // === Error Handling ===

        if (error.message === 'Group not found or access denied') {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'NOT_FOUND',
                        message: error.message,
                    },
                }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Unexpected errors
        console.error(`[GET /api/groups/${groupId}] Unexpected error:`, error);
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
 * PATCH /api/groups/:groupId
 *
 * Updates group settings. Admin only.
 *
 * Request body:
 * - name (string, 3-100 characters, optional)
 *
 * Responses:
 * - 200 OK: Successfully updated
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not an admin
 * - 404 Not Found: Group does not exist
 * - 500 Internal Server Error: Unexpected server error
 */
export const PATCH: APIRoute = async ({ request, params, locals }) => {
    const { groupId } = params;

    if (!groupId) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Group ID is required',
                },
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

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
        const command = UpdateGroupCommandSchema.parse(body);

        // === Business Logic ===
        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.updateGroup(user.id, groupId, command);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        // === Error Handling ===

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

        if (error.message.includes('Forbidden')) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'FORBIDDEN',
                        message: error.message,
                    },
                }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Unexpected errors
        console.error(`[PATCH /api/groups/${groupId}] Unexpected error:`, error);
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
 * DELETE /api/groups/:groupId
 *
 * Deletes a group and all related data. Admin only.
 *
 * Responses:
 * - 204 No Content: Successfully deleted
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not an admin
 * - 404 Not Found: Group does not exist
 * - 500 Internal Server Error: Unexpected server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
    const { groupId } = params;

    if (!groupId) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Group ID is required',
                },
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

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

        // === Business Logic ===
        const groupsService = createGroupsService(locals.supabase);
        await groupsService.deleteGroup(user.id, groupId);

        // === Happy Path: Success ===
        return new Response(null, { status: 204 });
    } catch (error: any) {
        // === Error Handling ===

        if (error.message.includes('Forbidden')) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'FORBIDDEN',
                        message: error.message,
                    },
                }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Unexpected errors
        console.error(`[DELETE /api/groups/${groupId}] Unexpected error:`, error);
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
