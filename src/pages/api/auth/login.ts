import type { APIRoute } from 'astro';
import { LoginCommandSchema } from '../../../lib/schemas';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates user with email and password
 *
 * Request body (FormData):
 * - email (string): User email address
 * - password (string): User password
 *
 * Responses:
 * - 200 OK: Successfully authenticated
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Invalid credentials
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
        const input = LoginCommandSchema.parse(body);

        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.login(input.email, input.password);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: result.error || 'Nie udało się zalogować',
                    },
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // === Happy Path: Success ===
        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                    redirectTo: result.redirectTo || '/dashboard',
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/login]');
    }
};
