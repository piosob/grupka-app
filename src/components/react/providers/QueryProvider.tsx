import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * TanStack Query Provider for React components.
 *
 * Uses lazy initialization via useState to ensure that each SSR request
 * gets its own QueryClient instance, preventing cross-request cache bleeding.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // In a Mobile First app, we want to balance data freshness and battery/data usage.
                        staleTime: 60 * 1000, // 1 minute
                        gcTime: 1000 * 60 * 60 * 24, // 24 hours
                        retry: 1,
                        refetchOnWindowFocus: false, // Less aggressive on mobile
                    },
                },
            })
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
