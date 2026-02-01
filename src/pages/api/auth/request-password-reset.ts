import type { APIRoute } from 'astro';
import { RequestPasswordResetCommandSchema } from '../../../lib/schemas';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/request-password-reset
 *
 * Sends password reset email to user
 *
 * Request body (FormData):
 * - email (string): User email address
 *
 * Responses:
 * - 200 OK: Email sent (or email doesn't exist - security)
 * - 400 Bad Request: Validation error
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // === GUARD: FormData Parsing ===
        let formData;
        try {
            formData = await request.formData();
        } catch {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid form data',
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Convert FormData to object
        const body = Object.fromEntries(formData);

        // === GUARD: Schema Validation ===
        const input = RequestPasswordResetCommandSchema.parse(body);

        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.requestPasswordReset(input.email);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'BAD_REQUEST',
                        message: result.error || 'Nie udało się wysłać linku resetującego',
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
                    message: 'Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła.',
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/request-password-reset]');
    }
};
