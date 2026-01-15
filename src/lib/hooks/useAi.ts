import { useMutation } from '@tanstack/react-query';
import type { MagicWandCommand, MagicWandResponseDTO } from '../../types';
import { toast } from 'sonner';

/**
 * Hook to manage AI-powered features.
 */
export const useAi = () => {
    // Magic Wand mutation
    const {
        mutateAsync: generateBio,
        isPending: isGeneratingBio,
        error: aiError,
    } = useMutation({
        mutationFn: async (command: MagicWandCommand): Promise<MagicWandResponseDTO> => {
            const response = await fetch('/api/ai/magic-wand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(
                        'Przekroczono limit użyć Magic Wand. Spróbuj ponownie za godzinę.'
                    );
                }
                const error = await response.json();
                throw new Error(error.error?.message || 'Nie udało się wygenerować opisu');
            }

            const json = await response.json();
            return json.data;
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        generateBio,
        isGeneratingBio,
        aiError,
    };
};
