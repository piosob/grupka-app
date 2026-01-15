import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import type {
    ChildListItemDTO,
    ChildDetailDTO,
    CreateChildCommand,
    UpdateChildCommand,
    PaginatedResponse,
    PaginationParams,
} from '../../types';
import { toast } from 'sonner';

/**
 * Hook to manage children for a specific group.
 * Handles fetching list and creating new children profiles.
 */
export const useChildren = (groupId: string, params: Partial<PaginationParams> = {}) => {
    const queryClient = useQueryClient();

    const queryParams: PaginationParams = {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
    };

    // Fetch children list
    const {
        data: childrenData,
        isLoading: isLoadingChildren,
        error: childrenError,
    } = useQuery<PaginatedResponse<ChildListItemDTO>>({
        queryKey: queryKeys.children.list(groupId, queryParams),
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            searchParams.set('limit', queryParams.limit.toString());
            searchParams.set('offset', queryParams.offset.toString());

            const response = await fetch(
                `/api/groups/${groupId}/children?${searchParams.toString()}`
            );
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się pobrać listy dzieci');
            }
            return response.json();
        },
        enabled: !!groupId,
    });

    // Create child mutation
    const { mutate: createChild, isPending: isCreatingChild } = useMutation({
        mutationFn: async (command: CreateChildCommand) => {
            const response = await fetch(`/api/groups/${groupId}/children`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się dodać profilu dziecka');
            }
            const json = await response.json();
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.children.all(groupId) });
            // Also invalidate group detail because childrenCount might have changed
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
            toast.success('Profil dziecka został dodany');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        children: childrenData?.data || [],
        pagination: childrenData?.pagination,
        isLoadingChildren,
        childrenError,
        createChild,
        isCreatingChild,
    };
};

/**
 * Hook to manage a single child's details and operations.
 */
export const useChildDetail = (childId: string) => {
    const queryClient = useQueryClient();

    // Fetch child detail
    const {
        data: child,
        isLoading: isLoadingChild,
        error: childError,
    } = useQuery<ChildDetailDTO>({
        queryKey: queryKeys.children.detail(childId),
        queryFn: async () => {
            const response = await fetch(`/api/children/${childId}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error?.message || 'Nie udało się pobrać szczegółów profilu dziecka'
                );
            }
            const json = await response.json();
            return json.data;
        },
        enabled: !!childId,
    });

    // Update child mutation
    const { mutate: updateChild, isPending: isUpdatingChild } = useMutation({
        mutationFn: async (command: UpdateChildCommand) => {
            const response = await fetch(`/api/children/${childId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error?.message || 'Nie udało się zaktualizować profilu dziecka'
                );
            }
            const json = await response.json();
            return json.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.children.detail(childId) });
            // Also invalidate list since child data might have changed
            if (child?.groupId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.children.all(child.groupId) });
            }
            toast.success('Profil dziecka został zaktualizowany');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Delete child mutation
    const { mutate: deleteChild, isPending: isDeletingChild } = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/children/${childId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się usunąć profilu dziecka');
            }
        },
        onSuccess: () => {
            if (child?.groupId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.children.all(child.groupId) });
                // Also invalidate group detail because childrenCount might have changed
                queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(child.groupId) });
            }
            toast.success('Profil dziecka został usunięty');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        child,
        isLoadingChild,
        childError,
        updateChild,
        isUpdatingChild,
        deleteChild,
        isDeletingChild,
    };
};
