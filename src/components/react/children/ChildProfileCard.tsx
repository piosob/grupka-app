import React from 'react';
import type { ChildListItemDTO } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, ChevronRight, User } from 'lucide-react';
import { calculateAge, cn, getInitials, stringToColor } from '@/lib/utils';

interface ChildProfileCardProps {
    child: ChildListItemDTO;
    groupId: string;
}

export const ChildProfileCard: React.FC<ChildProfileCardProps> = ({ child, groupId }) => {
    const age = calculateAge(child.birthDate);
    const initials = getInitials(child.displayName);
    const avatarColor = stringToColor(child.displayName);

    return (
        <Card
            className={cn(
                'group relative overflow-hidden transition-all hover:shadow-md cursor-pointer',
                child.isOwner && 'border-primary/50 bg-primary/5'
            )}
            onClick={() => (window.location.href = `/groups/${groupId}/children/${child.id}`)}
        >
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                    <AvatarFallback
                        style={{ backgroundColor: avatarColor }}
                        className="text-white font-bold"
                    >
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg truncate">{child.displayName}</h3>
                        {child.isOwner && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                Moje
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-col text-sm text-muted-foreground">
                        <span>{age ? `${age}` : 'Wiek nieznany'}</span>
                        {child.isOwner && (
                            <span className="flex items-center gap-1 text-[11px] opacity-70">
                                <User className="h-3 w-3" />
                                Ty jesteś rodzicem
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {child.isOwner && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/groups/${groupId}/children/${child.id}/edit`;
                            }}
                        >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edytuj</span>
                        </Button>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                </div>
            </CardContent>

            {/* Optional: Bio preview on hover or expansion can be added here if needed */}
        </Card>
    );
};
