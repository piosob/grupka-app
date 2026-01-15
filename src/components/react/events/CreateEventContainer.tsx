import { ArrowLeft } from 'lucide-react';
import { useEvents } from '@/lib/hooks/useEvents';
import { useChildren } from '@/lib/hooks/useChildren';
import { EventForm } from './EventForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryProvider } from '../providers/QueryProvider';

interface CreateEventContainerProps {
    groupId: string;
}

function CreateEventContent({ groupId }: CreateEventContainerProps) {
    const { createEvent, isCreatingEvent } = useEvents(groupId);
    const { children, isLoadingChildren } = useChildren(groupId, { limit: 100 });

    const handleSubmit = (data: any) => {
        // Handle childId="none" from Select
        const payload = {
            ...data,
            childId: data.childId === 'none' ? undefined : data.childId,
        };

        createEvent(payload, {
            onSuccess: (event) => {
                window.location.href = `/groups/${groupId}/events/${event.id}`;
            },
        });
    };

    if (isLoadingChildren) {
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

    return (
        <div className="space-y-8 pb-20 max-w-2xl mx-auto">
            <header className="flex items-center gap-3">
                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="-ml-2 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                >
                    <a href={`/groups/${groupId}/events`}>
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nowe wydarzenie</h1>
                    <p className="text-muted-foreground">Zaplanuj spotkanie dla grupy.</p>
                </div>
            </header>

            <EventForm
                groupId={groupId}
                childrenList={children}
                onSubmit={handleSubmit}
                isSubmitting={isCreatingEvent}
                onCancel={() => (window.location.href = `/groups/${groupId}/events`)}
            />
        </div>
    );
}

export function CreateEventContainer({ groupId }: CreateEventContainerProps) {
    return (
        <QueryProvider>
            <CreateEventContent groupId={groupId} />
        </QueryProvider>
    );
}
