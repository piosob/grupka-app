/**
 * Custom error types for business logic and API responses.
 * Each error has a unique code property for reliable error handling
 * across different execution contexts (e.g., Vercel serverless functions).
 * https://vercel.com/docs/conformance/rules/NO_INSTANCEOF_ERROR
 */

export class NotFoundError extends Error {
    public readonly code = 'NOT_FOUND' as const;
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ForbiddenError extends Error {
    public readonly code = 'FORBIDDEN' as const;
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class ValidationError extends Error {
    public readonly code = 'VALIDATION_ERROR' as const;
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class ConflictError extends Error {
    public readonly code = 'CONFLICT' as const;
    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}
