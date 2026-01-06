import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { PaginationParamsSchema } from '../../../../lib/schemas';
import { createGroupsService } from '../../../../lib/services/groups.service';

/**
 * GET /api/groups/:groupId/children
 *
 * Retrieves a list of children for a specific group.
 *
 * Path Parameters:
 * - groupId (uuid): The ID of the group
 *
 * Query parameters:
 * - limit (number, default 50, max 100): Maximum number of results
 * - offset (number, default 0): Number of results to skip
 *
 * Responses:
 * - 200 OK: Successfully retrieved list
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not a member of the group
 * - 500 Internal Server Error: Unexpected server error
 */
export const GET: APIRoute = async ({ request, params, locals }) => {
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

        // === Extract and Validate Query Parameters ===
        const url = new URL(request.url);
        const queryLimit = url.searchParams.get('limit');
        const queryOffset = url.searchParams.get('offset');

        const paginationParams = PaginationParamsSchema.parse({
            limit: queryLimit === null ? undefined : queryLimit,
            offset: queryOffset === null ? undefined : queryOffset,
        });

        // === Business Logic ===
        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.getGroupChildren(user.id, groupId, paginationParams);

        // === Happy Path: Success ===
        return new Response(JSON.stringify(result), {
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

        if (error.message === 'Access denied or group not found') {
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
        console.error(`[GET /api/groups/${groupId}/children] Unexpected error:`, error);
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
