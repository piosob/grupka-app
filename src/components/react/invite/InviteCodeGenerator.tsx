import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

interface InviteCodeGeneratorProps {
    onGenerateInvite: () => void;
    isGenerating: boolean;
    disabled?: boolean;
}

export const InviteCodeGenerator: React.FC<InviteCodeGeneratorProps> = ({
    onGenerateInvite,
    isGenerating,
    disabled = false,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <Button
                onClick={onGenerateInvite}
                disabled={isGenerating || disabled}
                className="w-full sm:w-auto h-12 text-base font-semibold"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="mr-2 size-5 animate-spin" />
                        Generowanie...
                    </>
                ) : (
                    <>
                        <Plus className="mr-2 size-5" />
                        {disabled ? 'Kod już istnieje' : 'Generuj nowy kod'}
                    </>
                )}
            </Button>
            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                {disabled
                    ? 'Dla każdej grupy może istnieć tylko jeden aktywny kod zaproszenia.'
                    : 'Każdy kod jest ważny przez 30 minut i umożliwia dołączenie do grupy nowym osobom.'}
            </p>
        </div>
    );
};
