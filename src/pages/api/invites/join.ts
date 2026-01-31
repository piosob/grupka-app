import type { APIRoute } from 'astro';
import { JoinGroupCommandSchema } from '../../../lib/schemas';
import { createGroupsService } from '../../../lib/services/groups.service';
import { handleApiError } from '../../../lib/api-utils';

/**
 * POST /api/invites/join
 *
 * Join a group using an invite code.
 *
 * Request body:
 * - code (string, max 10 characters)
 *
 * Responses:
 * - 200 OK: Successfully joined
 * - 400 Bad Request: Invalid input or expired code
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 409 Conflict: Already a member
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const {
            data: { user },
        } = await locals.supabase.auth.getUser();
        if (!user) {
            return new Response(
                JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
                }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return new Response(
                JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON' } }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const command = JoinGroupCommandSchema.parse(body);

        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.joinGroupByCode(user.id, command);

        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        if (
            error.message === 'Invalid or expired invite code' ||
            error.message === 'Invite code has expired'
        ) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Nieprawidłowy lub wygasły kod zaproszenia',
                    },
                }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (error.message === 'Jesteś już członkiem tej grupy') {
            return new Response(
                JSON.stringify({ error: { code: 'CONFLICT', message: error.message } }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return handleApiError(error, '[POST /api/invites/join]');
    }
};
