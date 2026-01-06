import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Link as LinkIcon } from 'lucide-react';
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
function DashboardContent() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);

    const { data, isLoading, error } = useGroups(20);

    const refreshGroups = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    };

    const handleJoinSuccess = (groupId: string) => {
        // Redirect to the new group's events page
        window.location.href = `/groups/${groupId}/events`;
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48 rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-10 sm:w-32 rounded-full" />
                        <Skeleton className="h-10 w-10 sm:w-32 rounded-full" />
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
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Twoje Grupy</h1>
                    <p className="text-muted-foreground">
                        Zarządzaj wydarzeniami i prezentami w swoich grupach.
                    </p>
                </div>

                {groups.length > 0 && (
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => setIsJoinOpen(true)}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none rounded-full"
                        >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            <span className="hidden xs:inline">Dołącz</span>
                        </Button>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            size="sm"
                            className="flex-1 sm:flex-none rounded-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="hidden xs:inline">Utwórz</span>
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
export function DashboardContainer() {
    return (
        <QueryProvider>
            <DashboardContent />
        </QueryProvider>
    );
}
