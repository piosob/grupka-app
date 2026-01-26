import { defineAction } from 'astro:actions';
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
    input: LoginCommandSchema,
    handler: async (input, context) => {
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        const result = await authService.login(input.email, input.password);

        if (!result.success) {
            throw new Error(result.error || 'Nie udało się zalogować');
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
    input: RegisterCommandSchema,
    handler: async (input, context) => {
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        const result = await authService.register(input.email, input.password, input.firstName);

        if (!result.success) {
            throw new Error(result.error || 'Nie udało się utworzyć konta');
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
            throw new Error(result.error || 'Nie udało się wylogować');
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
    input: RequestPasswordResetCommandSchema,
    handler: async (input, context) => {
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        const result = await authService.requestPasswordReset(input.email);

        if (!result.success) {
            throw new Error(result.error || 'Nie udało się wysłać linku resetującego');
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
    input: UpdatePasswordCommandSchema,
    handler: async (input, context) => {
        const supabase = context.locals.supabase;
        const authService = createAuthService(supabase);

        // Verify user is authenticated
        const user = await authService.getCurrentUser();
        if (!user) {
            throw new Error('Musisz być zalogowany, aby zmienić hasło');
        }

        const result = await authService.updatePassword(input.password);

        if (!result.success) {
            throw new Error(result.error || 'Nie udało się zmienić hasła');
        }

        return {
            success: true,
            message: 'Hasło zostało zmienione pomyślnie',
        };
    },
});
