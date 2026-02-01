import { z } from 'astro/zod';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from './errors';

/**
 * Common error handler for API routes.
 * Maps business errors and validation errors to appropriate HTTP responses.
 */
export function handleApiError(error: unknown, context: string): Response {
    console.log(`[handleApiError] Context: ${context}`, {
        hasZod: !!z,
        hasZodError: !!(z as any)?.ZodError,
        hasForbiddenError: !!ForbiddenError,
        hasNotFoundError: !!NotFoundError,
        hasValidationError: !!ValidationError,
        hasConflictError: !!ConflictError,
        errorType: typeof error,
        errorIsObject: error !== null && typeof error === 'object',
        errorName: (error as any)?.name,
        errorConstructorName: (error as any)?.constructor?.name
    });

    if (error && typeof error === 'object' && ((error as any).name === 'ZodError' || (z.ZodError && error instanceof z.ZodError))) {
        const zodError = error as z.ZodError;
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: zodError.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (error instanceof ForbiddenError) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'FORBIDDEN',
                    message: error.message,
                },
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (error instanceof NotFoundError) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'NOT_FOUND',
                    message: error.message,
                },
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (error instanceof ValidationError) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.message,
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (error instanceof ConflictError) {
        return new Response(
            JSON.stringify({
                error: {
                    code: 'CONFLICT',
                    message: error.message,
                },
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Unexpected errors
    const errorMessage =
        error instanceof Error || (error && typeof error === 'object' && 'message' in error)
            ? (error as any).message
            : 'An unexpected error occurred';
    console.error(`${context} Unexpected error:`, error);

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
