import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import type { GroupInviteListItemDTO } from '../../types';
import { toast } from 'sonner';

/**
 * Hook to manage invite codes for a specific group.
 * Handles fetching, generating, and revoking invites.
 */
export const useInvites = (groupId: string) => {
    const queryClient = useQueryClient();

    // Fetch active invites
    const {
        data: invites = [],
        isLoading: isLoadingInvites,
        error: invitesError,
    } = useQuery({
        queryKey: queryKeys.invites.list(groupId),
        queryFn: async () => {
            const response = await fetch(`/api/groups/${groupId}/invites`);
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Brak uprawnień do zarządzania kodami zaproszeń');
                }
                throw new Error('Nie udało się pobrać kodów zaproszeń');
            }
            const json = await response.json();
            return json.data as GroupInviteListItemDTO[];
        },
    });

    // Generate new invite
    const { mutate: generateInvite, isPending: isGeneratingInvite } = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/groups/${groupId}/invites`, {
                method: 'POST',
            });
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Przekroczono limit generowania kodów. Spróbuj później.');
                }
                throw new Error('Nie udało się wygenerować kodu zaproszenia');
            }
            const json = await response.json();
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.invites.list(groupId) });
            toast.success('Kod zaproszenia został wygenerowany');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Revoke (delete) invite
    const { mutate: revokeInvite, isPending: isRevokingInvite } = useMutation({
        mutationFn: async (code: string) => {
            const response = await fetch(`/api/groups/${groupId}/invites/${code}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Kod zaproszenia nie istnieje lub już wygasł');
                }
                throw new Error('Nie udało się usunąć kodu zaproszenia');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.invites.list(groupId) });
            toast.success('Kod zaproszenia został usunięty');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        invites,
        isLoadingInvites,
        invitesError,
        generateInvite,
        isGeneratingInvite,
        revokeInvite,
        isRevokingInvite,
    };
};
