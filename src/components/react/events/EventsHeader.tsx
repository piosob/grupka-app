import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventsHeaderProps {
    groupId: string;
    groupName?: string;
}

export const EventsHeader = ({ groupId, groupName }: EventsHeaderProps) => {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center gap-3">
                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="-ml-2 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                >
                    <a href={`/groups/${groupId}`}>
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                </Button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full">
                            {groupName || 'Grupa'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Wydarzenia</h1>
                    <p className="text-muted-foreground">Planuj urodziny i wspólne prezenty.</p>
                </div>
            </div>

            <Button asChild className="rounded-full h-11 px-6 shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:scale-95">
                <a href={`/groups/${groupId}/events/new`}>
                    <Plus className="w-5 h-5 mr-2" />
                    Utwórz wydarzenie
                </a>
            </Button>
        </header>
    );
};
