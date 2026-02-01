import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';

import {
    LoginCommandSchema,
    RegisterCommandSchema,
    RequestPasswordResetCommandSchema,
    UpdatePasswordCommandSchema,
} from '../lib/schemas';
import type { LoginCommand } from '../lib/schemas';

import { createAuthService } from '../lib/services/auth.service';

/**
 * Login action
 * Authenticates user with email and passwordpac
 */
export const login = defineAction({
    accept: 'form',
    handler: async (input, context) => {
        const validated = LoginCommandSchema.safeParse(input);
        if (!validated.success) {
            throw new ActionError({
                code: 'BAD_REQUEST',
                message: 'Nieprawidłowe dane logowania',
            });
        }
        const data = validated.data;
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        const result = await authService.login(data.email, data.password);

        if (!result.success) {
            throw new ActionError({
                code: 'UNAUTHORIZED',
                message: result.error || 'Nie udało się zalogować',
            });
        }

        return {
            success: true,
            redirectTo: result.redirectTo || '/dashboard',
        };
    },
});

/**
 * Register action
 * Creates new user account with email and password
 */
export const register = defineAction({
    accept: 'form',
    handler: async (input, context) => {
        const validated = RegisterCommandSchema.safeParse(input);
        if (!validated.success) {
            throw new ActionError({
                code: 'BAD_REQUEST',
                message: 'Nieprawidłowe dane rejestracji',
            });
        }
        const data = validated.data;
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        const result = await authService.register(data.email, data.password, data.firstName);

        if (!result.success) {
            throw new ActionError({
                code: 'BAD_REQUEST',
                message: result.error || 'Nie udało się utworzyć konta',
            });
        }

        return {
            success: true,
            needsEmailConfirmation: result.needsEmailConfirmation,
        };
    },
});

/**
 * Logout action
 * Signs out current user
 */
export const logout = defineAction({
    accept: 'form',
    input: z.object({}),
    handler: async (input, context) => {
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        const result = await authService.logout();
        if (!result.success) {
            throw new ActionError({
                code: 'INTERNAL_SERVER_ERROR',
                message: result.error || 'Nie udało się wylogować',
            });
        }

        return {
            success: true,
        };
    },
});

/**
 * Request password reset action
 * Sends password reset email to user
 */
export const requestPasswordReset = defineAction({
    accept: 'form',
    handler: async (input, context) => {
        const validated = RequestPasswordResetCommandSchema.safeParse(input);
        if (!validated.success) {
            throw new ActionError({
                code: 'BAD_REQUEST',
                message: 'Nieprawidłowy adres email',
            });
        }
        const data = validated.data;
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        const result = await authService.requestPasswordReset(data.email);

        if (!result.success) {
            throw new ActionError({
                code: 'BAD_REQUEST',
                message: result.error || 'Nie udało się wysłać linku resetującego',
            });
        }

        return {
            success: true,
            message:
                'Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła.',
        };
    },
});

/**
 * Update password action
 * Updates user password (requires authenticated session)
 */
export const updatePassword = defineAction({
    handler: async (input, context) => {
        const validated = UpdatePasswordCommandSchema.safeParse(input);
        if (!validated.success) {
            throw new ActionError({
                code: 'BAD_REQUEST',
                message: 'Nieprawidłowe hasło',
            });
        }
        const data = validated.data;
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        // Verify user is authenticated
        const user = await authService.getCurrentUser();
        if (!user) {
            throw new ActionError({
                code: 'UNAUTHORIZED',
                message: 'Musisz być zalogowany, aby zmienić hasło',
            });
        }

        const result = await authService.updatePassword(data.password);

        if (!result.success) {
            throw new ActionError({
                code: 'BAD_REQUEST',
                message: result.error || 'Nie udało się zmienić hasła',
            });
        }

        return {
            success: true,
            message: 'Hasło zostało zmienione pomyślnie',
        };
    },
});
