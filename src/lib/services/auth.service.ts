import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

export interface AuthServiceResult {
    success: boolean;
    error?: string;
}

export interface LoginResult extends AuthServiceResult {
    redirectTo?: string;
}

export interface RegisterResult extends AuthServiceResult {
    needsEmailConfirmation?: boolean;
}

/**
 * Auth Service
 * Handles all authentication-related operations with Supabase
 */
export class AuthService {
    constructor(private supabase: SupabaseClient<Database>) {}

    /**
     * Sign in with email and password
     */
    async login(email: string, password: string): Promise<LoginResult> {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return {
                    success: false,
                    error: this.translateAuthError(error.message),
                };
            }

            if (!data.user) {
                return {
                    success: false,
                    error: 'Nie udało się zalogować',
                };
            }

            return {
                success: true,
                redirectTo: '/dashboard',
            };
        } catch (err) {
            console.error('Login error:', err);
            return {
                success: false,
                error: 'Wystąpił błąd podczas logowania',
            };
        }
    }

    /**
     * Register new user with email and password
     */
    async register(email: string, password: string, firstName: string): Promise<RegisterResult> {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${this.getBaseUrl()}/api/auth/callback`,
                    data: {
                        first_name: firstName,
                    },
                },
            });

            if (error) {
                return {
                    success: false,
                    error: this.translateAuthError(error.message),
                };
            }

            if (!data.user) {
                return {
                    success: false,
                    error: 'Nie udało się utworzyć konta',
                };
            }

            // Check if email confirmation is required
            const needsConfirmation = !data.session;

            return {
                success: true,
                needsEmailConfirmation: needsConfirmation,
            };
        } catch (err) {
            console.error('Register error:', err);
            return {
                success: false,
                error: 'Wystąpił błąd podczas rejestracji',
            };
        }
    }

    /**
     * Sign out current user
     */
    async logout(): Promise<AuthServiceResult> {
        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) {
                return {
                    success: false,
                    error: this.translateAuthError(error.message),
                };
            }

            return {
                success: true,
            };
        } catch (err) {
            console.error('Logout error:', err);
            return {
                success: false,
                error: 'Wystąpił błąd podczas wylogowywania',
            };
        }
    }

    /**
     * Request password reset email
     */
    async requestPasswordReset(email: string): Promise<AuthServiceResult> {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${this.getBaseUrl()}/api/auth/callback?type=recovery`,
            });

            if (error) {
                return {
                    success: false,
                    error: this.translateAuthError(error.message),
                };
            }

            return {
                success: true,
            };
        } catch (err) {
            console.error('Request password reset error:', err);
            return {
                success: false,
                error: 'Wystąpił błąd podczas wysyłania linku resetującego',
            };
        }
    }

    /**
     * Update user password
     */
    async updatePassword(password: string): Promise<AuthServiceResult> {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password,
            });

            if (error) {
                return {
                    success: false,
                    error: this.translateAuthError(error.message),
                };
            }

            return {
                success: true,
            };
        } catch (err) {
            console.error('Update password error:', err);
            return {
                success: false,
                error: 'Wystąpił błąd podczas zmiany hasła',
            };
        }
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser() {
        try {
            const { data, error } = await this.supabase.auth.getUser();

            if (error || !data.user) {
                return null;
            }

            return data.user;
        } catch (err) {
            console.error('Get current user error:', err);
            return null;
        }
    }

    /**
     * Translate Supabase auth errors to user-friendly Polish messages
     */
    private translateAuthError(error: string): string {
        // Log original error for debugging on server/client
        console.error('[Supabase Auth Error]:', error);

        const errorMap: Record<string, string> = {
            'Invalid login credentials': 'Nieprawidłowy email lub hasło',
            'Email not confirmed': 'Email nie został potwierdzony',
            'User already registered': 'Użytkownik z tym adresem email już istnieje',
            'Password should be at least 6 characters': 'Hasło musi mieć co najmniej 6 znaków',
            'Unable to validate email address: invalid format': 'Nieprawidłowy format adresu email',
            'Signups not allowed for this instance': 'Rejestracja jest obecnie niedostępna',
            'Email rate limit exceeded': 'Zbyt wiele prób. Spróbuj ponownie później',
            'For security purposes, you can only request this once every 60 seconds':
                'Ze względów bezpieczeństwa, możesz wysłać prośbę raz na 60 sekund',
        };

        return errorMap[error] || 'Wystąpił nieoczekiwany błąd';
    }

    /**
     * Get base URL for redirects
     */
    private getBaseUrl(): string {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        // Fallback for SSR
        return import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    }
}

/**
 * Factory function to create AuthService instance
 */
export function createAuthService(supabase: SupabaseClient<Database>): AuthService {
    return new AuthService(supabase);
}
