import React from 'react';
import { MemberCard, type MemberViewModel } from './MemberCard';
import { Separator } from '@/components/ui/separator';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MembersListProps {
    groupId: string;
    members: MemberViewModel[];
    canManage: boolean;
    onShowContact: (member: MemberViewModel) => void;
    onDelete: (member: MemberViewModel) => void;
}

export const MembersList: React.FC<MembersListProps> = ({
    groupId,
    members,
    canManage,
    onShowContact,
    onDelete,
}) => {
    const admins = members.filter((m) => m.role === 'admin');
    const regularMembers = members.filter((m) => m.role !== 'admin');

    return (
        <div className="space-y-6">
            {admins.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                        Administratorzy ({admins.length})
                    </h3>
                    <div className="grid gap-3">
                        {admins.map((admin) => (
                            <MemberCard
                                key={admin.userId}
                                member={admin}
                                canManage={canManage}
                                onShowContact={onShowContact}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </section>
            )}

            {admins.length > 0 && regularMembers.length > 0 && <Separator className="opacity-50" />}

            {regularMembers.length > 0 ? (
                <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                        Członkowie ({regularMembers.length})
                    </h3>
                    <div className="grid gap-3">
                        {regularMembers.map((member) => (
                            <MemberCard
                                key={member.userId}
                                member={member}
                                canManage={canManage}
                                onShowContact={onShowContact}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </section>
            ) : (
                members.length > 0 && (
                    <div className="text-center py-10 px-4 bg-muted/20 rounded-2xl border-2 border-dashed border-muted/50 space-y-4">
                        <div className="p-3 bg-background rounded-full w-fit mx-auto shadow-sm">
                            <UserPlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Jesteś tu sam(a)!</p>
                            <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                                Zaproś innych rodziców, aby wspólnie organizować wydarzenia.
                            </p>
                        </div>
                        {canManage && (
                            <Button asChild variant="outline" size="sm" className="rounded-full">
                                <a href={`/groups/${groupId}/invite`}>Zaproś osoby</a>
                            </Button>
                        )}
                    </div>
                )
            )}

            {members.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">Brak członków w tej grupie.</p>
                </div>
            )}
        </div>
    );
};
