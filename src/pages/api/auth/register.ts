import type { APIRoute } from 'astro';
import { RegisterCommandSchema } from '../../../lib/schemas';
import { createAuthService } from '../../../lib/services/auth.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * POST /api/auth/register
 *
 * Creates new user account with email and password
 *
 * Request body (FormData):
 * - firstName (string): User first name
 * - email (string): User email address
 * - password (string): User password
 * - confirmPassword (string): Password confirmation
 *
 * Responses:
 * - 201 Created: Successfully registered
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
        const input = RegisterCommandSchema.parse(body);

        // === Business Logic ===
        const authService = createAuthService(locals.supabase);
        const result = await authService.register(input.email, input.password, input.firstName);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'BAD_REQUEST',
                        message: result.error || 'Nie udało się utworzyć konta',
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
                    needsEmailConfirmation: result.needsEmailConfirmation,
                },
            }),
            {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return handleApiError(error, '[POST /api/auth/register]');
    }
};
