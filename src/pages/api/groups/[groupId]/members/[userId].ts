import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { createGroupsService } from '../../../../../lib/services/groups.service';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../../../lib/errors';

export const prerender = false;

/**
 * DELETE /api/groups/:groupId/members/:userId
 *
 * Removes a member from the group. Can be performed by the user themselves
 * (leaving the group) or by a group admin.
 *
 * Path Parameters:
 * - groupId (uuid): The ID of the group
 * - userId (uuid): The ID of the user to remove
 *
 * Responses:
 * - 204 No Content: Successfully removed
 * - 400 Bad Request: Invalid input parameters
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Group or member not found
 * - 409 Conflict: Cannot remove the last administrator
 * - 500 Internal Server Error: Unexpected server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
    const { groupId, userId: targetUserId } = params;

    // === GUARD: Parameter Validation ===
    const uuidSchema = z.string().uuid();
    const groupValidation = uuidSchema.safeParse(groupId);
    const userValidation = uuidSchema.safeParse(targetUserId);

    if (!groupValidation.success || !userValidation.success) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid Group ID or User ID format',
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
        await groupsService.removeMember(user.id, groupValidation.data, userValidation.data);

        // === Happy Path: Success ===
        return new Response(null, { status: 204 });
    } catch (error: any) {
        // === Error Handling ===
        // Use error.code property for reliable error type checking
        // (avoids instanceof issues on Vercel serverless functions)

        if (error?.code === 'FORBIDDEN') {
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

        if (error?.code === 'NOT_FOUND') {
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

        if (error?.code === 'CONFLICT') {
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

        // Unexpected errors
        console.error(
            `[DELETE /api/groups/${groupId}/members/${targetUserId}] Unexpected error:`,
            error
        );
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
