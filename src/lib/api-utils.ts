import { z } from 'astro/zod';
import { AppError } from './errors';

/**
 * Common error handler for API routes.
 * Maps business errors and validation errors to appropriate HTTP responses.
 */
export function handleApiError(error: unknown, context: string): Response {
    // Handle Zod validation errors
    if (error && typeof error === 'object' && (error as any).name === 'ZodError') {
        const zodErrors = (error as any).errors;
        const details = Array.isArray(zodErrors)
            ? zodErrors.map((e: any) => ({
                  field: Array.isArray(e.path) ? e.path.join('.') : 'unknown',
                  message: e.message || 'Validation error',
              }))
            : [];

        return new Response(
            JSON.stringify({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details,
                },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Handle AppError and duck-typed errors with .code
    if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string') {
        const code = (error as any).code;
        const message = (error as any).message || 'An error occurred';

        const statusMap: Record<string, number> = {
            UNAUTHORIZED: 401,
            FORBIDDEN: 403,
            NOT_FOUND: 404,
            VALIDATION_ERROR: 400,
            CONFLICT: 409,
            RATE_LIMITED: 429,
            SERVICE_UNAVAILABLE: 503,
        };

        const status = statusMap[code] || 500;

        return new Response(
            JSON.stringify({
                error: {
                    code,
                    message,
                },
            }),
            { status, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Handle standard Error and other objects with .message
    const errorMessage =
        error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'An unexpected error occurred';

    console.error(`${context} Unexpected error:`, error);

    return new Response(
        JSON.stringify({
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: errorMessage,
            },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
}
