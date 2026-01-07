import * as React from 'react';
import { useInvites } from '@/lib/hooks/useInvites';
import { PageHeader } from './PageHeader';
import { InviteCodeGenerator } from './InviteCodeGenerator';
import { ActiveInviteCodeList } from './ActiveInviteCodeList';
import { InviteEmptyState } from './InviteEmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { QueryProvider } from '../providers/QueryProvider';

interface InviteContainerProps {
    groupId: string;
}

function InviteContent({ groupId }: InviteContainerProps) {
    const {
        invites,
        isLoadingInvites,
        invitesError,
        generateInvite,
        isGeneratingInvite,
        revokeInvite,
        isRevokingInvite,
    } = useInvites(groupId);

    if (invitesError) {
        return (
            <div className="flex flex-col gap-4 py-8 items-center text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Wystąpił błąd</h3>
                    <p className="text-muted-foreground">
                        {invitesError.message || 'Nie udało się załadować kodów zaproszeń.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-4 flex flex-col gap-10">
            <PageHeader
                title="Kody zaproszenia"
                description="Generuj tymczasowe kody, aby bezpiecznie zapraszać nowych członków do swojej grupy."
            />

            <section className="space-y-6">
                <InviteCodeGenerator
                    onGenerateInvite={() => generateInvite()}
                    isGenerating={isGeneratingInvite}
                />
            </section>

            <section className="space-y-6">
                {isLoadingInvites ? (
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-32 px-1" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                ) : invites.length > 0 ? (
                    <ActiveInviteCodeList
                        invites={invites}
                        onDeleteInvite={revokeInvite}
                        isDeleting={isRevokingInvite}
                    />
                ) : (
                    <InviteEmptyState />
                )}
            </section>
        </div>
    );
}

export const InviteContainer: React.FC<InviteContainerProps> = ({ groupId }) => {
    return (
        <QueryProvider>
            <InviteContent groupId={groupId} />
        </QueryProvider>
    );
};
