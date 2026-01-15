import React from 'react';
import { Calendar, User, Clock, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { EventDetailDTO } from '@/types';

interface EventHeroProps {
    event: EventDetailDTO;
    onDelete?: () => void;
    isDeleting?: boolean;
}

export const EventHero = ({ event, onDelete, isDeleting = false }: EventHeroProps) => {
    const formattedDate = new Date(event.eventDate).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {event.isOrganizer && (
                            <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary border-none"
                            >
                                Organizujesz
                            </Badge>
                        )}
                        {event.hasNewUpdates && (
                            <Badge
                                variant="secondary"
                                className="bg-blue-500/10 text-blue-500 border-none animate-pulse"
                            >
                                Nowe
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{event.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>
                                Dodano {new Date(event.createdAt).toLocaleDateString('pl-PL')}
                            </span>
                        </div>
                    </div>
                </div>

                {event.isOrganizer && (
                    <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                            <a href={`/groups/${event.groupId}/events/${event.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edytuj
                            </a>
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20"
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Usuń
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Ta akcja jest nieodwracalna. Wydarzenie "{event.title}"
                                        zostanie trwale usunięte wraz ze wszystkimi komentarzami.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-full">
                                        Anuluj
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onDelete}
                                        className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Tak, usuń wydarzenie
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            {event.description && (
                <div className="bg-muted/30 p-4 rounded-2xl border border-muted/50 transition-all hover:bg-muted/40">
                    <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                        {event.description}
                    </p>
                </div>
            )}

            {event.childName && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10 transition-transform hover:scale-[1.01]">
                    <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {event.childName.substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-xs text-primary/60 font-medium uppercase tracking-wider">
                            Solenizant
                        </p>
                        <p className="font-semibold">{event.childName}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
