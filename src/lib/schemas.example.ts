/**
 * Example usage of Zod schemas for validation
 *
 * This file demonstrates how to use the schemas defined in schemas.ts
 * for runtime validation in API endpoints and forms.
 */

import {
    CreateGroupCommandSchema,
    CreateChildCommandSchema,
    CreateEventCommandSchema,
    UpdateGroupCommandSchema,
    PaginationParamsSchema,
    EventsQueryParamsSchema,
    type CreateGroupCommand,
    type CreateChildCommand,
    type ErrorDTO,
} from './schemas';

// ============================================================================
// Example 1: Validating incoming POST request body
// ============================================================================

function handleCreateGroup(requestBody: unknown) {
    // Validate and parse the request body
    const result = CreateGroupCommandSchema.safeParse(requestBody);

    if (!result.success) {
        // Handle validation errors
        const errors: ErrorDTO = {
            code: 'VALIDATION_ERROR',
            message: 'Invalid group data',
            details: result.error.issues.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            })),
        };
        return { success: false, error: errors };
    }

    // Type-safe data from Zod
    const validData: CreateGroupCommand = result.data;


    return { success: true, data: validData };
}

// ============================================================================
// Example 2: Validating with strict parsing (throws on error)
// ============================================================================

function handleCreateChildStrict(requestBody: unknown) {
    try {
        // .parse() will throw ZodError if validation fails
        const validData = CreateChildCommandSchema.parse(requestBody);

     
        return { success: true, data: validData };
    } catch (error) {
        // Handle ZodError
        return { success: false, error: 'Validation failed' };
    }
}

// ============================================================================
// Example 3: Validating query parameters with URL SearchParams
// ============================================================================

function handleEventsQuery(searchParams: URLSearchParams) {
    // Convert URLSearchParams to object
    const params = Object.fromEntries(searchParams.entries());

    // Zod will coerce strings to proper types (number, boolean)
    const result = EventsQueryParamsSchema.safeParse(params);

    if (!result.success) {
        return { success: false, error: 'Invalid query parameters' };
    }

    // All query params are now properly typed

    return { success: true, data: result.data };
}

// ============================================================================
// Example 4: Partial validation for PATCH requests
// ============================================================================

function handleUpdateGroup(requestBody: unknown) {
    // UpdateGroupCommandSchema allows optional fields
    const result = UpdateGroupCommandSchema.safeParse(requestBody);

    if (!result.success) {
        return { success: false, error: 'Invalid update data' };
    }

    // Only provided fields will be present
    if (result.data.name) {

    }

    return { success: true, data: result.data };
}

// ============================================================================
// Example 5: Using in Astro API endpoint
// ============================================================================

// Example Astro API endpoint structure
export async function POST_Example({ request }: { request: Request }) {
    try {
        const body = await request.json();
        const validData = CreateEventCommandSchema.parse(body);

        // Now work with type-safe, validated data
        // validData.title is guaranteed to be 1-100 chars
        // validData.eventDate is guaranteed to be in YYYY-MM-DD format
        // validData.guestChildIds is guaranteed to be UUID[] or undefined

        return new Response(JSON.stringify({ success: true, data: validData }), { status: 200 });
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request body',
                },
            }),
            { status: 400 }
        );
    }
}

// ============================================================================
// Example 6: Using in React form validation
// ============================================================================

function CreateChildForm() {
    const handleSubmit = async (formData: FormData) => {
        const data = {
            displayName: formData.get('displayName'),
            bio: formData.get('bio') || undefined,
            birthDate: formData.get('birthDate') || undefined,
        };

        const result = CreateChildCommandSchema.safeParse(data);

        if (!result.success) {
            // Show validation errors to user
            console.error('Validation errors:', result.error.flatten());
            return;
        }

        // Submit valid data to API
        await fetch('/api/children', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.data),
        });
    };

    return null; // React component would render form here
}

// ============================================================================
// Example 7: Extending schemas for custom validation
// ============================================================================

import { z } from 'astro/zod';

// You can extend existing schemas with additional validation
const CreateGroupWithCustomValidation = CreateGroupCommandSchema.extend({
    // Add additional fields or override validations
}).refine((data) => !data.name.toLowerCase().includes('test'), {
    message: "Group name cannot contain 'test'",
});
