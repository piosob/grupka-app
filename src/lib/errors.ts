/**
 * Custom error types for business logic and API responses.
 */

export type ErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'SERVICE_UNAVAILABLE';

export class AppError extends Error {
    public readonly code: ErrorCode;

    constructor(code: ErrorCode, message: string) {
        super(message);
        this.name = 'AppError';
        this.code = code;

        // Maintain proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }

    /**
     * Helper to check if an unknown error is an AppError with a specific code
     */
    static isCode(error: unknown, code: ErrorCode): boolean {
        return (
            error !== null &&
            typeof error === 'object' &&
            (error as any).name === 'AppError' &&
            (error as any).code === code
        );
    }
}
