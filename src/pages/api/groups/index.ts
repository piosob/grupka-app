import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { CreateGroupCommandSchema } from '../../../lib/schemas';
import { createGroupsService } from '../../../lib/services/groups.service';

export const prerender = false;

/**
 * POST /api/groups
 *
 * Creates a new group and assigns the authenticated user as admin.
 *
 * Request body:
 * - name (string, 3-100 characters): The name of the group
 *
 * Responses:
 * - 201 Created: Group successfully created
 * - 400 Bad Request: Invalid input or JSON parsing error
 * - 401 Unauthorized: Missing or invalid authentication token
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
                        message: 'Authentication required',
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
        const command = CreateGroupCommandSchema.parse(body);

        // === Business Logic ===
        const groupsService = createGroupsService(locals.supabase);
        const result = await groupsService.createGroup(user.id, command);

        // === Happy Path: Success ===
        return new Response(JSON.stringify({ data: result }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                Location: `/api/groups/${result.id}`,
            },
        });
    } catch (error) {
        // === Error Handling ===

        // Zod validation errors
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: error.errors.map((e) => ({
                            field: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Unexpected errors
        console.error('[POST /api/groups] Unexpected error:', error);
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
