import React from 'react';
import { Plus, Link as LinkIcon, Search } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
    onCreateGroup: () => void;
    onJoinGroup: () => void;
}

export function EmptyState({ onCreateGroup, onJoinGroup }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-3xl bg-muted/30">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-primary/60" />
            </div>

            <h2 className="text-2xl font-bold mb-3">Nie należysz do żadnej grupy</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
                Grupka pomaga rodzicom w organizacji prezentów i wydarzeń. Utwórz nową grupę dla
                swojej klasy lub dołącz do istniejącej.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4">
                <Button
                    onClick={onCreateGroup}
                    className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-semibold"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Utwórz grupę
                </Button>
                <Button
                    onClick={onJoinGroup}
                    variant="outline"
                    className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-semibold"
                >
                    <LinkIcon className="mr-2 h-5 w-5" />
                    Dołącz do grupy
                </Button>
            </div>
        </div>
    );
}
