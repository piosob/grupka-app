import * as React from 'react';
import { InviteCodeCard } from './InviteCodeCard';
import type { GroupInviteListItemDTO } from '@/types';

interface ActiveInviteCodeListProps {
    invites: GroupInviteListItemDTO[];
    onDeleteInvite: (code: string) => void;
    isDeleting?: boolean;
}

export const ActiveInviteCodeList: React.FC<ActiveInviteCodeListProps> = ({
    invites,
    onDeleteInvite,
    isDeleting = false,
}) => {
    if (invites.length === 0) return null;

    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">
                Aktywne kody zaproszenia
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {invites.map((invite) => (
                    <InviteCodeCard
                        key={invite.code}
                        invite={invite}
                        onDeleteInvite={onDeleteInvite}
                        isDeleting={isDeleting}
                    />
                ))}
            </div>
        </div>
    );
};
