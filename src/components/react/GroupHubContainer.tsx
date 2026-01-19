import React from 'react';
import { Calendar, Users, Baby, Settings, UserPlus, Crown, ArrowLeft } from 'lucide-react';
import { useGroupDetail } from '../../lib/hooks/useGroupDetail';
import { LaunchpadTile } from './LaunchpadTile';
import { AdminContactCard } from './AdminContactCard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { QueryProvider } from './providers/QueryProvider';

interface GroupHubContainerProps {
    groupId: string;
}

function GroupHubContent({ groupId }: GroupHubContainerProps) {
    const { data: group, isLoading, error } = useGroupDetail(groupId);


    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full bg-destructive/10 text-destructive">
                    <Users className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Wystąpił błąd</h2>
                    <p className="text-muted-foreground">
                        Nie udało się załadować danych grupy
                    </p>
                </div>
                <Button asChild variant="outline">
                    <a href="/dashboard">Wróć do pulpitu</a>
                </Button>
            </div>
        );
    }

    const isAdmin = group.role === 'admin';

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="-ml-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        >
                            <a href="/dashboard">
                                <ArrowLeft className="w-4 h-4" />
                            </a>
                        </Button>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                            {group.name}
                        </h1>
                        {isAdmin && (
                            <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 border-none shrink-0"
                            >
                                <Crown className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Admin</span>
                            </Badge>
                        )}
                    </div>
                </div>

                <AdminContactCard adminName={group.adminName} groupId={groupId} />
            </div>

            {/* Launchpad Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <LaunchpadTile
                    title="Wydarzenia"
                    icon={<Calendar />}
                    href={`/groups/${groupId}/events`}
                    badge={
                        group.upcomingEventsCount > 0
                            ? `${group.upcomingEventsCount} nadchodzące`
                            : undefined
                    }
                    summaryText={
                        group.nextEvent
                            ? `Najbliższe: ${group.nextEvent.title} (${new Date(group.nextEvent.eventDate).toLocaleDateString('pl-PL')})`
                            : 'Brak zaplanowanych wydarzeń'
                    }
                />

                <LaunchpadTile
                    title="Dzieci"
                    icon={<Baby />}
                    href={`/groups/${groupId}/children`}
                    summaryText={`W grupie jest zarejestrowanych ${group.childrenCount} dzieci`}
                    alertText={
                        group.myChildren.length === 0
                            ? 'Kliknij, aby dodać swoje dziecko do grupy!'
                            : undefined
                    }
                />

                <LaunchpadTile
                    title="Członkowie"
                    icon={<Users />}
                    href={`/groups/${groupId}/members`}
                    summaryText={`W grupie jest ${group.memberCount} rodziców`}
                />
            </div>

            {/* Admin Actions */}
            {isAdmin && (
                <div className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Zarządzanie grupą</h2>
                        <Badge variant="outline">Tylko dla administratora</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button asChild variant="outline" className="h-16 flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-3 sm:gap-1 px-4 sm:px-2">
                            <a href={`/groups/${groupId}/invite`} className="flex items-center sm:flex-col gap-3 sm:gap-1 w-full">
                                <UserPlus className="w-5 h-5 shrink-0" />
                                <span className="font-semibold">Zaproś osoby</span>
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="h-16 flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-3 sm:gap-1 px-4 sm:px-2">
                            <a href={`/groups/${groupId}/settings`} className="flex items-center sm:flex-col gap-3 sm:gap-1 w-full">
                                <Settings className="w-5 h-5 shrink-0" />
                                <span className="font-semibold">Ustawienia</span>
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function GroupHubContainer({ groupId }: GroupHubContainerProps) {
    return (
        <QueryProvider>
            <GroupHubContent groupId={groupId} />
        </QueryProvider>
    );
}
