import { useQuery } from '@tanstack/react-query';
import type { ChildListItemDTO } from '../schemas';

export function useMyChildren() {
    return useQuery<ChildListItemDTO[]>({
        queryKey: ['profile', 'children'],
        queryFn: async () => {
            const response = await fetch('/api/profile/children');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Nie udało się pobrać listy dzieci');
            }
            const { data } = await response.json();
            return data;
        },
    });
}
