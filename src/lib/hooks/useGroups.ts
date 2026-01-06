import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import type { PaginatedResponse, GroupListItemDTO } from '../../types';

export function useGroups(limit = 20, offset = 0) {
    return useQuery<PaginatedResponse<GroupListItemDTO>>({
        queryKey: queryKeys.groups.list({ limit, offset }),
        queryFn: async () => {
            const response = await fetch(`/api/groups?limit=${limit}&offset=${offset}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Nie udało się pobrać listy grup');
            }
            return response.json();
        },
    });
}
