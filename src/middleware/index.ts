import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Protected paths that require authentication
const protectedPaths = ['/dashboard', '/profile', '/groups'];

export const onRequest = defineMiddleware(async (context, next) => {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return parseCookieHeader(context.request.headers.get('Cookie') ?? '')
                    .filter((cookie) => cookie.value !== undefined) // Filter out undefined values
                    .map((cookie) => ({ name: cookie.name, value: cookie.value as string })); // Type assertion;
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) =>
                    context.cookies.set(name, value, options)
                );
            },
        },
    });

    // Make supabase client available in context
    context.locals.supabase = supabase;

    // Get authenticated user
    const {
        data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user || null;

    // Check if current path is protected
    const isProtectedPath = protectedPaths.some((path) => context.url.pathname.startsWith(path));

    // Redirect to login if accessing protected path without authentication
    if (isProtectedPath && !user) {
        return context.redirect('/login');
    }

    // If user is logged in and tries to access auth pages, redirect to dashboard
    const authPages = ['/login', '/register', '/forgot-password'];
    const isAuthPage = authPages.some((path) => context.url.pathname === path);

    if (isAuthPage && user) {
        return context.redirect('/dashboard');
    }

    return next();
});
