import type { APIRoute } from 'astro';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Signs out current user
 *
 * Responses:
 * - 200 OK: Successfully logged out
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ locals }) => {
    try {
        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.logout();

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: result.error || 'Nie udało się wylogować',
                    },
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Happy Path: Success ===
        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/logout]');
    }
};
