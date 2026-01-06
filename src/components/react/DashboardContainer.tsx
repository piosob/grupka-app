import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import { Skeleton } from '../ui/skeleton';
import type { PaginatedResponse, GroupListItemDTO } from '../../types';
import { QueryProvider } from './providers/QueryProvider';

/**
 * DashboardContent (Internal)
 *
 * Handles the actual data fetching and rendering.
 * Must be wrapped in a QueryProvider.
 */
function DashboardContent() {
    const { data, isLoading, error } = useQuery<PaginatedResponse<GroupListItemDTO>>({
        queryKey: queryKeys.groups.list({ limit: 20 }),
        queryFn: async () => {
            const response = await fetch('/api/groups?limit=20');
            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }
            return response.json();
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                Wystąpił błąd podczas ładowania grup.
            </div>
        );
    }

    const groups = data?.data || [];

    if (groups.length === 0) {
        return (
            <div className="text-center py-12 border rounded-xl bg-card">
                <p className="text-muted-foreground">Nie należysz jeszcze do żadnej grupy.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
                <div
                    key={group.id}
                    className="p-6 border rounded-xl bg-card hover:border-primary/50 transition-colors"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{group.name}</h3>
                        {group.role === 'admin' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                Admin
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">{group.memberCount} członków</p>
                </div>
            ))}
        </div>
    );
}

/**
 * DashboardContainer (Client-side entry point)
 *
 * Wraps the content in QueryProvider to ensure TanStack Query context is available.
 */
export function DashboardContainer() {
    return (
        <QueryProvider>
            <DashboardContent />
        </QueryProvider>
    );
}
