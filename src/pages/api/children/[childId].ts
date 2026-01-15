import type { APIRoute } from 'astro';
import { UpdateChildCommandSchema } from '../../../lib/schemas';
import { createChildrenService } from '../../../lib/services/children.service';
import { handleApiError } from '../../../lib/api-utils';

export const prerender = false;

/**
 * GET /api/children/:childId
 *
 * Retrieves detailed information about a specific child.
 *
 * Path Parameters:
 * - childId (uuid): The ID of the child
 */
export const GET: APIRoute = async ({ params, locals }) => {
    const { childId } = params;

    if (!childId) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Child ID is required',
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

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
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // === Business Logic ===
        const childrenService = createChildrenService(locals.supabase);
        const result = await childrenService.getChild(childId, user.id);

        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, `GET /api/children/${childId}`);
    }
};

/**
 * PATCH /api/children/:childId
 *
 * Updates a child's profile. Only the parent can update.
 *
 * Path Parameters:
 * - childId (uuid): The ID of the child
 *
 * Request Body:
 * - displayName (string, 1-50, optional)
 * - bio (string, max 1000, optional)
 * - birthDate (string, YYYY-MM-DD, optional/null)
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
    const { childId } = params;

    if (!childId) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Child ID is required',
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

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
                { status: 401, headers: { 'Content-Type': 'application/json' } }
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
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // === GUARD: Schema Validation ===
        const command = UpdateChildCommandSchema.parse(body);

        // === Business Logic ===
        const childrenService = createChildrenService(locals.supabase);
        const result = await childrenService.updateChild(childId, user.id, command);

        return new Response(JSON.stringify({ data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, `PATCH /api/children/${childId}`);
    }
};

/**
 * DELETE /api/children/:childId
 *
 * Deletes a child profile. Only the parent can delete.
 *
 * Path Parameters:
 * - childId (uuid): The ID of the child
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
    const { childId } = params;

    if (!childId) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Child ID is required',
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

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
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // === Business Logic ===
        const childrenService = createChildrenService(locals.supabase);
        await childrenService.deleteChild(childId, user.id);

        return new Response(null, { status: 204 });
    } catch (error) {
        return handleApiError(error, `DELETE /api/children/${childId}`);
    }
};
