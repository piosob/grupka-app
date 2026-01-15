import { ArrowLeft } from 'lucide-react';
import { useEventDetail } from '@/lib/hooks/useEvents';
import { useChildren } from '@/lib/hooks/useChildren';
import { EventForm } from './EventForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryProvider } from '../providers/QueryProvider';

interface EditEventContainerProps {
    groupId: string;
    eventId: string;
}

function EditEventContent({ groupId, eventId }: EditEventContainerProps) {
    const { event, isLoadingEvent, eventError, updateEvent, isUpdatingEvent } =
        useEventDetail(eventId);
    const { children, isLoadingChildren } = useChildren(groupId, { limit: 100 });

    const handleSubmit = (data: any) => {
        // Handle childId="none" from Select
        const payload = {
            ...data,
            childId: data.childId === 'none' ? undefined : data.childId,
        };

        updateEvent(payload, {
            onSuccess: () => {
                window.location.href = `/groups/${groupId}/events/${eventId}`;
            },
        });
    };

    if (isLoadingEvent || isLoadingChildren) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-[300px] w-full rounded-2xl" />
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
                    <a href={`/groups/${groupId}/events`}>Wróć</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-2xl mx-auto">
            <header className="flex items-center gap-3">
                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="-ml-2 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                >
                    <a href={`/groups/${groupId}/events/${eventId}`}>
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edytuj wydarzenie</h1>
                    <p className="text-muted-foreground">Zmień szczegóły spotkania.</p>
                </div>
            </header>

            <EventForm
                groupId={groupId}
                childrenList={children}
                initialData={event}
                onSubmit={handleSubmit}
                isSubmitting={isUpdatingEvent}
                onCancel={() => (window.location.href = `/groups/${groupId}/events/${eventId}`)}
            />
        </div>
    );
}

export function EditEventContainer({ groupId, eventId }: EditEventContainerProps) {
    return (
        <QueryProvider>
            <EditEventContent groupId={groupId} eventId={eventId} />
        </QueryProvider>
    );
}
