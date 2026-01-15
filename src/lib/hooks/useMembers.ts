import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import type { GroupMemberDTO, PaginatedResponse } from '../../types';
import { toast } from 'sonner';

/**
 * Hook to manage members for a specific group.
 * Handles fetching and removing members.
 */
export const useMembers = (groupId: string, limit = 50, offset = 0) => {
    const queryClient = useQueryClient();

    // Fetch members list
    const {
        data: membersData,
        isLoading: isLoadingMembers,
        error: membersError,
    } = useQuery({
        queryKey: queryKeys.members.list(groupId, { limit, offset }),
        queryFn: async () => {
            const response = await fetch(`/api/groups/${groupId}/members?limit=${limit}&offset=${offset}`);
            if (!response.ok) {
                throw new Error('Nie udało się pobrać listy członków');
            }
            return response.json() as Promise<PaginatedResponse<GroupMemberDTO>>;
        },
        enabled: !!groupId,
    });

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

    return {
        members: membersData?.data ?? [],
        pagination: membersData?.pagination,
        isLoadingMembers,
        membersError,
        removeMember,
        isRemovingMember,
    };
};
