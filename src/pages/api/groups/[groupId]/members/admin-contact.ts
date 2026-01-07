import { createGroupsService } from '@/lib/services/groups.service';
import type { APIRoute } from 'astro';

/**
 * GET /api/groups/:groupId/members/admin-contact
 *
 * Retrieves the admin's contact information (email and children names).
 * Used for the "Reveal logic" in Group Hub to show emergency contact.
 *
 * Path Parameters:
 * - groupId (uuid): The ID of the group
 *
 * Responses:
 * - 200 OK: Successfully retrieved contact info (AdminContactDTO)
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not a member of the group
 * - 404 Not Found: Group or admin not found
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
        const result = await groupsService.getAdminContact(user.id, groupId);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        // === Error Handling ===

        if (
            error.message === 'Access denied or group not found' ||
            error.message.includes('Forbidden')
        ) {
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

        if (error.message === 'Admin contact not found') {
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
        console.error(
            `[GET /api/groups/${groupId}/members/admin-contact] Unexpected error:`,
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
