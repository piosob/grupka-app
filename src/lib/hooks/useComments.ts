import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import type {
    EventCommentDTO,
    CreateEventCommentCommand,
    PaginatedResponse,
    PaginationParams,
} from '../../types';
import { toast } from 'sonner';

/**
 * Hook to manage comments for a specific event (hidden thread).
 */
export const useComments = (eventId: string, params: Partial<PaginationParams> = {}) => {
    const queryClient = useQueryClient();

    // Default pagination
    const queryParams: PaginationParams = {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
    };

    // Fetch comments list
    const {
        data: commentsData,
        isLoading: isLoadingComments,
        error: commentsError,
    } = useQuery<PaginatedResponse<EventCommentDTO>>({
        queryKey: queryKeys.events.comments(eventId),
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            searchParams.set('limit', queryParams.limit.toString());
            searchParams.set('offset', queryParams.offset.toString());

            const response = await fetch(
                `/api/events/${eventId}/comments?${searchParams.toString()}`
            );
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się pobrać komentarzy');
            }
            return response.json();
        },
        enabled: !!eventId,
    });

    // Add comment mutation
    const { mutate: addComment, isPending: isAddingComment } = useMutation({
        mutationFn: async (command: CreateEventCommentCommand) => {
            const response = await fetch(`/api/events/${eventId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się dodać komentarza');
            }
            const json = await response.json();
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.events.comments(eventId) });
            toast.success('Komentarz został dodany');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Delete comment mutation
    const { mutate: deleteComment, isPending: isDeletingComment } = useMutation({
        mutationFn: async (commentId: string) => {
            const response = await fetch(`/api/events/${eventId}/comments/${commentId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się usunąć komentarza');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.events.comments(eventId) });
            toast.success('Komentarz został usunięty');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        comments: commentsData?.data || [],
        pagination: commentsData?.pagination,
        isLoadingComments,
        commentsError,
        addComment,
        isAddingComment,
        deleteComment,
        isDeletingComment,
    };
};
