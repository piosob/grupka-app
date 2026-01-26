import React from 'react';
import { useGroups } from '@/lib/hooks/useGroups';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '../EmptyState';

export const MyGroupsSection: React.FC = () => {
    const { data, isLoading, isError } = useGroups();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Card>
                    <CardContent className="p-0">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border-b last:border-0">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isError || !data) {
        return null;
    }

    const groups = data.data;

    if (groups.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Moje grupy
                    </h2>
                </div>
                <EmptyState
                    title="Brak grup"
                    description="Nie należysz jeszcze do żadnej grupy. Dołącz do istniejącej grupy lub utwórz nową."
                    icon={Users}
                    actionLabel="Utwórz grupę"
                    onAction={() => window.location.href = '/dashboard?action=create'}
                    secondaryActionLabel="Dołącz do grupy"
                    onSecondaryAction={() => window.location.href = '/dashboard?action=join'}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Moje grupy
                </h2>
                <Badge variant="secondary">{groups.length}</Badge>
            </div>

            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col">
                        {groups.map((group) => (
                            <a
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50 active:bg-muted border-b last:border-0"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-lg">{group.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {group.role === 'admin' ? 'Administrator' : 'Członek'} • {group.memberCount} członków
                                    </span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
