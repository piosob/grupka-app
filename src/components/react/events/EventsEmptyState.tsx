import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventsEmptyStateProps {
    groupId: string;
}

export const EventsEmptyState = ({ groupId }: EventsEmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold mb-2">Brak wydarzeń</h3>
            <p className="text-muted-foreground max-w-[300px] mb-8">
                W tej grupie nie ma jeszcze żadnych wydarzeń. Bądź pierwszym, który coś zorganizuje!
            </p>
            <Button asChild className="rounded-full px-8">
                <a href={`/groups/${groupId}/events/new`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Utwórz pierwsze wydarzenie
                </a>
            </Button>
        </div>
    );
};
