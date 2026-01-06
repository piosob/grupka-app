import { createGroupsService } from '@/lib/services/groups.service';
import type { APIRoute } from 'astro';

/**
 * DELETE /api/groups/:groupId/invites/:code
 *
 * Revoke an invite code. Admin only.
 *
 * Responses:
 * - 204 No Content: Successfully revoked
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not an admin
 * - 500 Internal Server Error: Unexpected server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
    const { groupId, code } = params;

    if (!groupId || !code) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Group ID and Code are required',
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
        await groupsService.revokeInvite(user.id, groupId, code);

        return new Response(null, { status: 204 });
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
