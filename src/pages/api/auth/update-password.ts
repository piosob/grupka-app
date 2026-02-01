import type { APIRoute } from 'astro';
import { UpdatePasswordCommandSchema } from '../../../lib/schemas';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/update-password
 *
 * Updates user password (requires authenticated session)
 *
 * Request body (JSON):
 * - password (string): New password
 * - confirmPassword (string): Password confirmation
 *
 * Responses:
 * - 200 OK: Password updated successfully
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
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
                        message: 'Musisz być zalogowany, aby zmienić hasło',
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
        const input = UpdatePasswordCommandSchema.parse(body);

        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.updatePassword(input.password);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'BAD_REQUEST',
                        message: result.error || 'Nie udało się zmienić hasła',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Happy Path: Success ===
        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                    message: 'Hasło zostało zmienione pomyślnie',
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/update-password]');
    }
};
