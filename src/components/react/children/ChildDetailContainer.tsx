import React, { useState } from 'react';
import { useChildDetail } from '@/lib/hooks/useChildren';
import { useGroupDetail } from '@/lib/hooks/useGroupDetail';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Edit2, Trash2, ChevronLeft, Calendar, Info, Loader2, Baby, Users, User } from 'lucide-react';
import { calculateAge, getInitials, stringToColor, formatBirthDate } from '@/lib/utils';
import { DeleteChildDialog } from './DeleteChildDialog';
import { QueryProvider } from '../providers/QueryProvider';

interface ChildDetailContainerProps {
    groupId: string;
    childId: string;
}

function ChildDetailContent({ groupId, childId }: ChildDetailContainerProps) {
    const { child, isLoadingChild, deleteChild, isDeletingChild, childError } = useChildDetail(childId);
    const { data: group } = useGroupDetail(groupId);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    if (isLoadingChild) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Ładowanie profilu dziecka...</p>
            </div>
        );
    }
if (childError) {
   return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full bg-destructive/10 text-destructive">
                    <User className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Wystąpił błąd</h2>
                    <p className="text-muted-foreground">
                      Nie udało się załadować profilu dziecka
                    </p>
                </div>
                <Button asChild variant="outline">
                    <a href="/dashboard">Wróć do pulpitu</a>
                </Button>
            </div>
        );
}
    if (!child) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-4">Nie znaleziono profilu</h2>
                <Button onClick={() => (window.location.href = `/groups/${groupId}/children`)}>
                    Powrót do listy
                </Button>
            </div>
        );
    }

    const age = calculateAge(child.birthDate);
    const initials = getInitials(child.displayName);
    const avatarColor = stringToColor(child.displayName);

    const handleDelete = async () => {
        try {
            await deleteChild();
            window.location.href = `/groups/${groupId}/children`;
        } catch (error) {
            // Error is handled by the hook
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 -ml-2 text-muted-foreground w-fit"
                    onClick={() => (window.location.href = `/groups/${groupId}/children`)}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Powrót do listy
                </Button>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full">
                        {group?.name || 'Grupa'}
                    </span>
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-8">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                            <AvatarFallback
                                style={{ backgroundColor: avatarColor }}
                                className="text-2xl text-white font-bold"
                            >
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    {child.displayName}
                                </h1>
                                {child.isOwner && <Badge variant="secondary">Moje dziecko</Badge>}
                            </div>
                            <div className="flex items-center justify-center gap-4 text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Baby className="h-4 w-4" />
                                    {age ? age : 'Wiek nieznany'}
                                </span>
                                {child.birthDate && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        {formatBirthDate(child.birthDate)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4" />O dziecku i zainteresowaniach
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-invert max-w-none">
                                {child.bio ? (
                                    <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                        {child.bio}
                                    </p>
                                ) : (
                                    <p className="italic text-muted-foreground">
                                        Rodzic nie dodał jeszcze opisu zainteresowań.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions for owner */}
                    {child.isOwner && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                className="flex-1 gap-2"
                                onClick={() =>
                                    (window.location.href = `/groups/${groupId}/children/${child.id}/edit`)
                                }
                            >
                                <Edit2 className="h-4 w-4" />
                                Edytuj profil
                            </Button>
                            <Button
                                variant="destructive"
                                className="gap-2"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Usuń profil
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DeleteChildDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                childName={child.displayName}
                isDeleting={isDeletingChild}
            />
        </div>
    );
}

export const ChildDetailContainer: React.FC<ChildDetailContainerProps> = ({ groupId, childId }) => {
    return (
        <QueryProvider>
            <ChildDetailContent groupId={groupId} childId={childId} />
        </QueryProvider>
    );
};
