import type { APIRoute } from 'astro';
import { CreateChildCommandSchema, PaginationParamsSchema } from '../../../../lib/schemas';
import { createChildrenService } from '../../../../lib/services/children.service';
import { handleApiError } from '../../../../lib/api-utils';

export const prerender = false;

/**
 * GET /api/groups/:groupId/children
 *
 * Retrieves a paginated list of children in a specific group.
 *
 * Path Parameters:
 * - groupId (uuid): The ID of the group
 *
 * Query Parameters:
 * - limit (number): Number of items to return (default 20, max 100)
 * - offset (number): Number of items to skip (default 0)
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
    const { groupId } = params;

    if (!groupId) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Group ID is required',
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

        // === GUARD: Query Validation ===
        const url = new URL(request.url);
        const queryParams = PaginationParamsSchema.parse({
            limit: url.searchParams.get('limit'),
            offset: url.searchParams.get('offset'),
        });

        // === Business Logic ===
        const childrenService = createChildrenService(locals.supabase);
        const result = await childrenService.listChildren(groupId, user.id, queryParams);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, `GET /api/groups/${groupId}/children`);
    }
};

/**
 * POST /api/groups/:groupId/children
 *
 * Creates a new child profile in a specific group.
 *
 * Path Parameters:
 * - groupId (uuid): The ID of the group
 *
 * Request Body:
 * - displayName (string, 1-50): Child's display name
 * - bio (string, max 1000, optional): Optional bio/notes
 * - birthDate (string, YYYY-MM-DD, optional): Optional birth date
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
    const { groupId } = params;

    if (!groupId) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Group ID is required',
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
        const command = CreateChildCommandSchema.parse(body);

        // === Business Logic ===
        const childrenService = createChildrenService(locals.supabase);
        const result = await childrenService.createChild(groupId, user.id, command);

        return new Response(JSON.stringify({ data: result }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, `POST /api/groups/${groupId}/children`);
    }
};
