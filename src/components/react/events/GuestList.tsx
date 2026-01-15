import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EventGuestDTO } from '@/types';
import { Button } from '@/components/ui/button';

interface GuestListProps {
    guests: EventGuestDTO[];
}

export const GuestList = ({ guests }: GuestListProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (guests.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 font-semibold">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Lista gości</span>
                    <Badge
                        variant="secondary"
                        className="rounded-full bg-muted text-muted-foreground px-2"
                    >
                        {guests.length}
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 p-0 rounded-full"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="sr-only">Przełącz listę gości</span>
                </Button>
            </div>

            {!isOpen && (
                <div className="px-1 text-sm text-muted-foreground line-clamp-1">
                    {guests.map((g) => g.displayName).join(', ')}
                </div>
            )}

            {isOpen && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-2xl border border-muted/50">
                        {guests.map((guest) => (
                            <Badge
                                key={guest.childId}
                                variant="outline"
                                className="bg-background/50 border-muted-foreground/20 py-1 px-3 rounded-full"
                            >
                                {guest.displayName}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
