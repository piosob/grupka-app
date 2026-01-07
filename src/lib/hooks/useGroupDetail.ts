import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import type { GroupDetailDTO } from '../schemas';

export function useGroupDetail(groupId: string) {
    return useQuery<GroupDetailDTO>({
        queryKey: queryKeys.groups.detail(groupId),
        queryFn: async () => {
            const response = await fetch(`/api/groups/${groupId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Nie udało się pobrać szczegółów grupy');
            }
            const { data } = await response.json();
            return data;
        },
        enabled: !!groupId,
    });
}

