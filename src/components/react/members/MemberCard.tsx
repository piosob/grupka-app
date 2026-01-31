import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, UserMinus } from 'lucide-react';
import type { GroupMemberDTO } from '@/types';

export interface MemberViewModel extends GroupMemberDTO {
    initials: string;
    displayName: string;
    childrenLabel: string;
    isSelf: boolean;
}

interface MemberCardProps {
    member: MemberViewModel;
    canManage: boolean;
    onShowContact: (member: MemberViewModel) => void;
    onDelete: (member: MemberViewModel) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
    member,
    canManage,
    onShowContact,
    onDelete,
}) => {
    const isOwner = member.role === 'admin';

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {member.initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                                {member.displayName}
                                {member.isSelf && (
                                    <span className="ml-1 text-lg font-normal text-muted-foreground">
                                        (Ty)
                                    </span>
                                )}
                            </span>
                            {isOwner && (
                                <Badge
                                    variant="secondary"
                                    className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    Admin
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                            {member.childrenLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 truncate">
                            Dołączył(a) {new Date(member.joinedAt).toLocaleDateString('pl-PL')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {isOwner && !member.isSelf && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer"
                            onClick={() => onShowContact(member)}
                            title="Pokaż kontakt"
                        >
                            <Mail className="h-4 w-4" />
                            <span className="text-xs font-medium">Pokaż kontakt</span>
                        </Button>
                    )}

                    {canManage && !member.isSelf && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 flex items-center gap-2 text-destructive hover:text-destructive cursor-pointer"
                            title="Usuń z grupy"
                            onClick={() => onDelete(member)}
                        >
                            <UserMinus className="h-4 w-4 mr-2" />
                            <span className="text-xs font-medium">Usuń</span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
