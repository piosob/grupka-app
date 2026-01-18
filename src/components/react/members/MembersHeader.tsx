import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

interface MembersHeaderProps {
    groupId: string;
    groupName?: string;
    count: number;
}

export const MembersHeader: React.FC<MembersHeaderProps> = ({ groupId, groupName, count }) => {
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
                    <h1 className="text-3xl font-bold tracking-tight">Członkowie</h1>
                    <p className="text-muted-foreground">
                        {count}{' '}
                        {count === 1 ? 'osoba' : count > 1 && count < 5 ? 'osoby' : 'osób'} w tej grupie
                    </p>
                </div>
            </div>
        </header>
    );
};
