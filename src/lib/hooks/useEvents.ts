import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import type {
    EventListItemDTO,
    EventDetailDTO,
    CreateEventCommand,
    UpdateEventCommand,
    PaginatedResponse,
    EventsQueryParams,
} from '../../types';
import { toast } from 'sonner';

/**
 * Hook to manage events for a specific group.
 * Handles fetching, creating, updating, and deleting events.
 */
export const useEvents = (groupId: string, params: Partial<EventsQueryParams> = {}) => {
    const queryClient = useQueryClient();

    // Default pagination and sorting
    const queryParams: EventsQueryParams = {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        upcoming: params.upcoming ?? false,
        sortBy: params.sortBy ?? 'eventDate',
        sortOrder: params.sortOrder ?? 'asc',
    };

    // Fetch events list
    const {
        data: eventsData,
        isLoading: isLoadingEvents,
        error: eventsError,
    } = useQuery<PaginatedResponse<EventListItemDTO>>({
        queryKey: queryKeys.events.list(groupId, queryParams),
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            searchParams.set('limit', queryParams.limit.toString());
            searchParams.set('offset', queryParams.offset.toString());
            if (queryParams.upcoming) searchParams.set('upcoming', 'true');
            searchParams.set('sortBy', queryParams.sortBy);
            searchParams.set('sortOrder', queryParams.sortOrder);

            const response = await fetch(`/api/groups/${groupId}/events?${searchParams.toString()}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się pobrać listy wydarzeń');
            }
            return response.json();
        },
        enabled: !!groupId,
    });

    // Create event mutation
    const { mutate: createEvent, isPending: isCreatingEvent } = useMutation({
        mutationFn: async (command: CreateEventCommand) => {
            const response = await fetch(`/api/groups/${groupId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się utworzyć wydarzenia');
            }
            const json = await response.json();
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.events.all(groupId) });
            toast.success('Wydarzenie zostało utworzone');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        events: eventsData?.data || [],
        pagination: eventsData?.pagination,
        isLoadingEvents,
        eventsError,
        createEvent,
        isCreatingEvent,
    };
};

/**
 * Hook to manage a single event's details and operations.
 */
export const useEventDetail = (eventId: string) => {
    const queryClient = useQueryClient();

    // Fetch event detail
    const {
        data: event,
        isLoading: isLoadingEvent,
        error: eventError,
    } = useQuery<EventDetailDTO>({
        queryKey: queryKeys.events.detail(eventId),
        queryFn: async () => {
            const response = await fetch(`/api/events/${eventId}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się pobrać szczegółów wydarzenia');
            }
            const json = await response.json();
            return json.data;
        },
        enabled: !!eventId,
    });

    // Update event mutation
    const { mutate: updateEvent, isPending: isUpdatingEvent } = useMutation({
        mutationFn: async (command: UpdateEventCommand) => {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się zaktualizować wydarzenia');
            }
            const json = await response.json();
            return json.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
            // Also invalidate list since event data might have changed
            if (event?.groupId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.events.all(event.groupId) });
            }
            toast.success('Wydarzenie zostało zaktualizowane');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Delete event mutation
    const { mutate: deleteEvent, isPending: isDeletingEvent } = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się usunąć wydarzenia');
            }
        },
        onSuccess: () => {
            if (event?.groupId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.events.all(event.groupId) });
            }
            toast.success('Wydarzenie zostało usunięte');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        event,
        isLoadingEvent,
        eventError,
        updateEvent,
        isUpdatingEvent,
        deleteEvent,
        isDeletingEvent,
    };
};

