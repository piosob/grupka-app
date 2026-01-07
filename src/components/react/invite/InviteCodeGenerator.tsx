import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

interface InviteCodeGeneratorProps {
    onGenerateInvite: () => void;
    isGenerating: boolean;
}

export const InviteCodeGenerator: React.FC<InviteCodeGeneratorProps> = ({
    onGenerateInvite,
    isGenerating,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <Button
                onClick={onGenerateInvite}
                disabled={isGenerating}
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
                        Generuj nowy kod
                    </>
                )}
            </Button>
            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                Każdy kod jest ważny przez 60 minut i umożliwia dołączenie do grupy nowym osobom.
            </p>
        </div>
    );
};
