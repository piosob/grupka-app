import { z } from 'astro/zod';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from './errors';

/**
 * Common error handler for API routes.
 * Maps business errors and validation errors to appropriate HTTP responses.
 * Uses error.code property for reliable error type checking across different
 * execution contexts (avoids instanceof issues on Vercel).
 * https://vercel.com/docs/conformance/rules/NO_INSTANCEOF_ERROR
 */
export function handleApiError(error: unknown, context: string): Response {
    // Check if it's a ZodError (validation error from schema)
    if (error && typeof error === 'object' && (error as any).name === 'ZodError') {
        const zodError = error as z.ZodError;
        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: zodError.issues.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Check for custom business errors by their code property
    if (error && typeof error === 'object' && 'code' in error) {
        const err = error as { code: string; message: string };

        switch (err.code) {
            case 'FORBIDDEN':
                return new Response(
                    JSON.stringify({
                        error: {
                            code: 'FORBIDDEN',
                            message: err.message,
                        },
                    }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );

            case 'NOT_FOUND':
                return new Response(
                    JSON.stringify({
                        error: {
                            code: 'NOT_FOUND',
                            message: err.message,
                        },
                    }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );

            case 'VALIDATION_ERROR':
                return new Response(
                    JSON.stringify({
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: err.message,
                        },
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );

            case 'CONFLICT':
                return new Response(
                    JSON.stringify({
                        error: {
                            code: 'CONFLICT',
                            message: err.message,
                        },
                    }),
                    { status: 409, headers: { 'Content-Type': 'application/json' } }
                );
        }
    }

    // Unexpected errors
    const errorMessage =
        error && typeof error === 'object' && 'message' in error
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
