import React from 'react';
import { useGroupDetail } from '@/lib/hooks/useGroupDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsShortcuts } from './SettingsShortcuts';
import { DangerousZone } from './DangerousZone';
import { GroupEditForm } from './GroupEditForm';
import { QueryProvider } from '../providers/QueryProvider';
import { EmptyState } from '../EmptyState';
import { ShieldAlert } from 'lucide-react';

interface SettingsContainerProps {
    groupId: string;
}

const SettingsContent: React.FC<SettingsContainerProps> = ({ groupId }) => {
    const { data: group, isLoading, isError, error } = useGroupDetail(groupId);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-1/4" />
                    </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Card className="border-destructive/50">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-1/3" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isError || !group) {
        return (
            <div className="py-10">
                <EmptyState
                    title="Błąd ładowania"
                    description={error instanceof Error ? error.message : 'Wystąpił błąd podczas ładowania ustawień.'}
                    icon={ShieldAlert}
                    actionLabel="Wróć do grupy"
                    onAction={() => window.location.href = `/groups/${groupId}`}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <GroupEditForm group={group} />
            <SettingsShortcuts groupId={groupId} />
            <DangerousZone group={group} />
        </div>
    );
};

export const SettingsContainer: React.FC<SettingsContainerProps> = ({ groupId }) => {
    return (
        <QueryProvider>
            <SettingsContent groupId={groupId} />
        </QueryProvider>
    );
};
