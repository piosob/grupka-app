import type { APIRoute } from 'astro';
import { createGroupsService } from '../../../../lib/services/groups.service';

/**
 * GET /api/groups/:groupId/invites
 *
 * List active invite codes for a group. Admin only.
 *
 * Responses:
 * - 200 OK: Successfully retrieved list
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not an admin
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
        const {
            data: { user },
        } = await locals.supabase.auth.getUser();
        if (!user) return new Response(null, { status: 401 });

        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.getInvites(user.id, groupId);

        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        if (error.message.includes('Forbidden')) {
            return new Response(
                JSON.stringify({ error: { code: 'FORBIDDEN', message: error.message } }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return new Response(
            JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: error.message } }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

/**
 * POST /api/groups/:groupId/invites
 *
 * Generate a new invite code. Admin only.
 *
 * Responses:
 * - 201 Created: Successfully generated
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not an admin
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ params, locals }) => {
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
        const {
            data: { user },
        } = await locals.supabase.auth.getUser();
        if (!user) return new Response(null, { status: 401 });

        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.createInvite(user.id, groupId);

        return new Response(JSON.stringify({ data: result }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        if (error.message.includes('Forbidden')) {
            return new Response(
                JSON.stringify({ error: { code: 'FORBIDDEN', message: error.message } }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return new Response(
            JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: error.message } }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
