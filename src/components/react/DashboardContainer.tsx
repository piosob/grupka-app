import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, AlertTriangle, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import { useGroups } from '../../lib/hooks/useGroups';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import type { GroupListItemDTO } from '../../types';
import { GroupCard } from './GroupCard';
import { EmptyState } from './EmptyState';
import { CreateGroupDialog } from './CreateGroupDialog';
import { JoinGroupDialog } from './JoinGroupDialog';
import { QueryProvider } from './providers/QueryProvider';

/**
 * Skeleton loading state for the group list
 */
function SkeletonGroupList() {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
        </div>
    );
}

/**
 * DashboardContent (Internal)
 *
 * Handles the actual data fetching and rendering.
 * Must be wrapped in a QueryProvider.
 */
interface DashboardContentProps {
    errorType?: string | null;
}

function DashboardContent({ errorType }: DashboardContentProps) {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [showAccessDenied, setShowAccessDenied] = useState(errorType === 'access_denied');

    const { data, isLoading, error } = useGroups(20);

    useEffect(() => {
        if (errorType) {
            // Clear the error parameter from URL without refreshing
            const url = new URL(window.location.href);
            url.searchParams.delete('error');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, [errorType]);

    const refreshGroups = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    };

    const handleJoinSuccess = (_groupId: string) => {
        // Refresh the groups list and stay on dashboard
        refreshGroups();
        // The user specifically wants to be on the new group
        window.location.href = `/groups/${_groupId}`;
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48 rounded-lg" />
                        <Skeleton className="h-5 w-64 rounded-lg" />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Skeleton className="h-10 flex-1 md:w-32 rounded-full" />
                        <Skeleton className="h-10 flex-1 md:w-32 rounded-full" />
                    </div>
                </div>
                <SkeletonGroupList />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-destructive/10 text-destructive rounded-3xl border border-destructive/20 text-center">
                <h3 className="font-bold mb-2">Wystąpił błąd</h3>
                <p className="text-sm">{(error as Error).message}</p>
                <Button
                    variant="outline"
                    className="mt-4 rounded-full"
                    onClick={() => refreshGroups()}
                >
                    Spróbuj ponownie
                </Button>
            </div>
        );
    }

    const groups = data?.data || [];

    return (
        <div className="space-y-8">
            {showAccessDenied && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                            Brak dostępu
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Nie masz uprawnień do przeglądania tej grupy lub grupa nie istnieje. Jeśli
                            uważasz, że to błąd, skontaktuj się z administratorem grupy.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAccessDenied(false)}
                        className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Twoje Grupy</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Zarządzaj wydarzeniami i prezentami w swoich grupach.
                    </p>
                </div>

                {groups.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Button
                            onClick={() => setIsJoinOpen(true)}
                            variant="outline"
                            className="w-full sm:w-auto rounded-full cursor-pointer"
                        >
                            <LinkIcon className="w-4 h-4 mr-1.5" />
                            Dołącz do grupy
                        </Button>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="w-full sm:w-auto rounded-full cursor-pointer"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Utwórz nową grupę
                        </Button>
                    </div>
                )}
            </header>

            {groups.length === 0 ? (
                <EmptyState
                    onCreateGroup={() => setIsCreateOpen(true)}
                    onJoinGroup={() => setIsJoinOpen(true)}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {groups.map((group) => (
                        <GroupCard key={group.id} group={group} />
                    ))}
                </div>
            )}

            <CreateGroupDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={refreshGroups}
            />

            <JoinGroupDialog
                open={isJoinOpen}
                onOpenChange={setIsJoinOpen}
                onSuccess={handleJoinSuccess}
            />
        </div>
    );
}

/**
 * DashboardContainer (Client-side entry point)
 *
 * Wraps the content in QueryProvider to ensure TanStack Query context is available.
 */
export function DashboardContainer({ errorType }: { errorType?: string | null }) {
    return (
        <QueryProvider>
            <DashboardContent errorType={errorType} />
        </QueryProvider>
    );
}
