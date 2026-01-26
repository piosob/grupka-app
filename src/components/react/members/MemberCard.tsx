import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, UserMinus } from 'lucide-react';
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
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => onShowContact(member)}
                            title="Pokaż kontakt"
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                    )}

                    {canManage && !member.isSelf && (

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(member)}
                                >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    <span>Usuń z grupy</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
