import * as React from 'react';
import { Ticket } from 'lucide-react';

export const InviteEmptyState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-3xl bg-muted/20">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                <Ticket className="w-8 h-8 text-primary/30" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Brak aktywnych kodów</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
                Nie masz obecnie żadnych aktywnych kodów zaproszenia. Wygeneruj nowy kod, aby
                zaprosić rodziców do grupy.
            </p>
        </div>
    );
};
