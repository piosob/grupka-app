import { ArrowLeft } from 'lucide-react';
import { useEventDetail } from '@/lib/hooks/useEvents';
import { EventHero } from './EventHero';
import { GuestList } from './GuestList';
import { CommentThread } from './CommentThread';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { QueryProvider } from '../providers/QueryProvider';

interface EventDetailContainerProps {
    eventId: string;
}

function EventDetailContent({ eventId }: EventDetailContainerProps) {
    const { event, isLoadingEvent, eventError, deleteEvent, isDeletingEvent } =
        useEventDetail(eventId);

    if (isLoadingEvent) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
                <div className="space-y-6 pt-4">
                    <Skeleton className="h-6 w-48" />
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-16 w-full rounded-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (eventError || !event) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <h2 className="text-2xl font-bold">Wystąpił błąd</h2>
                <p className="text-muted-foreground">
                    {eventError instanceof Error
                        ? eventError.message
                        : 'Nie udało się załadować wydarzenia'}
                </p>
                <Button asChild variant="outline" className="rounded-full">
                    <a href="javascript:history.back()">Wróć</a>
                </Button>
            </div>
        );
    }

    const handleDelete = () => {
        deleteEvent(undefined, {
            onSuccess: () => {
                window.location.href = `/groups/${event.groupId}/events`;
            },
        });
    };

    return (
        <div className="space-y-8 pb-20 max-w-2xl mx-auto">
            <header className="animate-in fade-in slide-in-from-left-4 duration-500">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 rounded-full text-muted-foreground hover:text-foreground mb-4"
                >
                    <a href={`/groups/${event.groupId}/events`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Wszystkie wydarzenia
                    </a>
                </Button>
            </header>

            <EventHero event={event} onDelete={handleDelete} isDeleting={isDeletingEvent} />

            <Separator className="bg-muted/50" />

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                <GuestList guests={event.guests} />
            </div>

            <Separator className="bg-muted/50" />

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
                <CommentThread eventId={eventId} isOrganizer={event.isOrganizer} />
            </div>
        </div>
    );
}

export function EventDetailContainer({ eventId }: EventDetailContainerProps) {
    return (
        <QueryProvider>
            <EventDetailContent eventId={eventId} />
        </QueryProvider>
    );
}
