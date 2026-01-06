import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Auth callback endpoint
 * Handles PKCE code exchange and password recovery flows
 */
export const GET: APIRoute = async ({ url, locals, redirect, cookies }) => {
    const code = url.searchParams.get('code');
    const type = url.searchParams.get('type'); // 'recovery' for password reset
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle errors from Supabase
    if (error) {
        console.error('Auth callback error:', error, errorDescription);
        return redirect(`/login?error=${encodeURIComponent(errorDescription || error)}`);
    }

    // If no code, redirect to login
    if (!code) {
        return redirect('/login?error=missing_code');
    }

    try {
        const supabase = locals.supabase;

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            return redirect(`/login?error=${encodeURIComponent(exchangeError.message)}`);
        }

        if (!data.session) {
            return redirect('/login?error=no_session');
        }

        // Handle different callback types
        if (type === 'recovery') {
            // Password recovery - redirect to reset password page
            return redirect('/reset-password');
        }

        // Email confirmation or regular login - redirect to groups
        return redirect('/groups');
    } catch (err) {
        console.error('Auth callback exception:', err);
        return redirect('/login?error=unexpected_error');
    }
};
