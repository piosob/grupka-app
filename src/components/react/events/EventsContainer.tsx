import { useState } from 'react';
import { useEvents } from '@/lib/hooks/useEvents';
import { EventsHeader } from './EventsHeader';
import { EventCard } from './EventCard';
import { EventsEmptyState } from './EventsEmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryProvider } from '../providers/QueryProvider';
import { cn } from '@/lib/utils';

interface EventsContainerProps {
    groupId: string;
}

type FilterType = 'upcoming' | 'all' | 'past';

function EventsContent({ groupId }: EventsContainerProps) {
    const [filter, setFilter] = useState<FilterType>('upcoming');

    const { events, isLoadingEvents, eventsError } = useEvents(groupId, {
        upcoming: filter === 'upcoming' ? true : false,
        // We might need to adjust the API/Service to handle 'past' specifically
        // if the upcoming=false isn't enough to distinguish 'all' vs 'past'.
        // For now, let's stick to 'upcoming' and 'all'.
    });

    // Simple filtering for 'past' if needed on client side,
    // but better handled by API. For now 'all' will show everything.
    const filteredEvents =
        filter === 'past' ? events.filter((e) => new Date(e.eventDate) < new Date()) : events;

    if (eventsError) {
        return (
            <div className="p-6 bg-destructive/10 text-destructive rounded-3xl border border-destructive/20 text-center">
                <h3 className="font-bold mb-2">Wystąpił błąd</h3>
                <p className="text-sm">{(eventsError as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            <EventsHeader groupId={groupId} />

            {/* Filter Tabs */}
            <div className="flex p-1 bg-muted/50 rounded-full w-full max-w-sm sticky top-4 z-10 backdrop-blur-md shadow-sm border border-muted/50">
                {(['upcoming', 'all', 'past'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'flex-1 py-2 text-sm font-medium rounded-full transition-all duration-300',
                            filter === f
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/30'
                        )}
                    >
                        {f === 'upcoming' ? 'Nadchodzące' : f === 'all' ? 'Wszystkie' : 'Minione'}
                    </button>
                ))}
            </div>

            {isLoadingEvents ? (
                <div className="grid gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-card/30 border border-muted/20"
                        >
                            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : filteredEvents.length === 0 ? (
                <EventsEmptyState groupId={groupId} />
            ) : (
                <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                    {filteredEvents.map((event, idx) => (
                        <div
                            key={event.id}
                            className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <EventCard event={event} groupId={groupId} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function EventsContainer({ groupId }: EventsContainerProps) {
    return (
        <QueryProvider>
            <EventsContent groupId={groupId} />
        </QueryProvider>
    );
}
