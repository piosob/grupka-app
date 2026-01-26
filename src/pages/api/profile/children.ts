import type { APIRoute } from 'astro';
import { createChildrenService } from '../../../lib/services/children.service';

/**
 * GET /api/profile/children
 * 
 * Retrieves all children profiles belonging to the authenticated user.
 */
export const GET: APIRoute = async ({ locals }) => {
    try {
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
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const childrenService = createChildrenService(locals.supabase);
        const children = await childrenService.getMyChildren(user.id);

        return new Response(JSON.stringify({ data: children }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[GET /api/profile/children] Unexpected error:', error);
        return new Response(
            JSON.stringify({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'An unexpected error occurred',
                },
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
