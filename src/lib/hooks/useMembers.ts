import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import type { GroupMemberDTO, AdminContactDTO, PaginatedResponse } from '../../types';
import { toast } from 'sonner';

/**
 * Hook to manage members for a specific group.
 * Handles fetching and removing members with support for pagination.
 */
export const useMembers = (groupId: string, limit = 20) => {
    const queryClient = useQueryClient();

    // Fetch members list with infinite query
    const {
        data: membersData,
        isLoading: isLoadingMembers,
        error: membersError,
        refetch: refetchMembers,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: queryKeys.members.all(groupId),
        queryFn: async ({ pageParam = 0 }) => {
            const response = await fetch(
                `/api/groups/${groupId}/members?limit=${limit}&offset=${pageParam}`
            );
            if (!response.ok) {
                throw new Error('Nie udało się pobrać listy członków');
            }
            return response.json() as Promise<PaginatedResponse<GroupMemberDTO>>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            const nextOffset = lastPage.pagination.offset + lastPage.pagination.limit;
            return nextOffset < lastPage.pagination.total ? nextOffset : undefined;
        },
        enabled: !!groupId,
    });

    // Flatten all pages into a single array
    const members = membersData?.pages.flatMap((page) => page.data) ?? [];
    const totalCount = membersData?.pages[0]?.pagination.total ?? 0;

    // Remove member (or leave group)
    const { mutate: removeMember, isPending: isRemovingMember } = useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('Nie można usunąć ostatniego administratora grupy');
                }
                if (response.status === 403) {
                    throw new Error('Brak uprawnień do usunięcia tego członka');
                }
                throw new Error('Nie udało się usunąć członka z grupy');
            }
        },
        onSuccess: (_, userId) => {
            // Invalidate members list
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all(groupId) });
            // Also invalidate group detail since member count changed
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
            // If user removed themselves, we might want to invalidate their group list
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });

            toast.success('Członek został usunięty z grupy');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Fetch admin contact (on-demand)
    const getAdminContact = async (): Promise<AdminContactDTO> => {
        const response = await fetch(`/api/groups/${groupId}/members/admin-contact`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error(
                    'Tylko członkowie grupy mogą widzieć dane kontaktowe administratora'
                );
            }
            throw new Error('Nie udało się pobrać danych kontaktowych administratora');
        }
        const { data } = await response.json();
        return data as AdminContactDTO;
    };

    return {
        members,
        totalCount,
        isLoadingMembers,
        membersError,
        refetchMembers,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        removeMember,
        isRemovingMember,
        getAdminContact,
    };
};
