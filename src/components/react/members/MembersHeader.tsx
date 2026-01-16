import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users } from 'lucide-react';

interface MembersHeaderProps {
    groupId: string;
    count: number;
}

export const MembersHeader: React.FC<MembersHeaderProps> = ({ groupId, count }) => {
    return (
        <div className="space-y-4 mb-6">
            <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground hover:text-primary"
                onClick={() => (window.location.href = `/groups/${groupId}`)}
            >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Powrót do grupy
            </Button>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Członkowie</h1>
                        <p className="text-sm text-muted-foreground">
                            {count}{' '}
                            {count === 1 ? 'osoba' : count > 1 && count < 5 ? 'osoby' : 'osób'} w
                            tej grupie
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
