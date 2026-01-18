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

    // === Authorization: Group Membership ===
    // Check if path is a group-specific path: /groups/[groupId]... or /api/groups/[groupId]...
    const groupPathMatch = context.url.pathname.match(/^\/(api\/)?groups\/([^\/]+)/);

    if (groupPathMatch && user) {
        const isApi = !!groupPathMatch[1];
        const groupId = groupPathMatch[2];

        // We only check membership if it looks like a group sub-page
        // and NOT the main list or creation (though these are currently not at /groups/[something])
        const { data: membership, error } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (error || !membership) {
            console.warn(`[Middleware] Access denied to group ${groupId} for user ${user.id}`);
            if (isApi) {
                return new Response(
                    JSON.stringify({
                        error: {
                            code: 'FORBIDDEN',
                            message: 'You are not a member of this group',
                        },
                    }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            } else {
                return context.redirect('/dashboard?error=access_denied');
            }
        }
    }

    // If user is logged in and tries to access auth pages, redirect to dashboard
    const authPages = ['/login', '/register', '/forgot-password'];
    const isAuthPage = authPages.some((path) => context.url.pathname === path);

    if (isAuthPage && user) {
        return context.redirect('/dashboard');
    }

    return next();
});
