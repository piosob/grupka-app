import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChildrenHeaderProps {
    groupId: string;
    groupName?: string;
    title: string;
    description?: string;
    showBackButton?: boolean;
    onActionClick?: () => void;
    actionLabel?: string;
    actionIcon?: React.ReactNode;
}

export const ChildrenHeader = ({
    groupId,
    groupName,
    title,
    description,
    showBackButton = false,
    onActionClick,
    actionLabel,
    actionIcon = <Plus className="w-5 h-5 mr-2" />,
}: ChildrenHeaderProps) => {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center gap-3">
                {showBackButton && (
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="-ml-2 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                    >
                        <a href={title === 'Dzieci' ? `/groups/${groupId}` : `/groups/${groupId}/children`}>
                            <ArrowLeft className="w-5 h-5" />
                        </a>
                    </Button>
                )}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full">
                            {groupName || 'Grupa'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    {description && <p className="text-muted-foreground">{description}</p>}
                </div>
            </div>

            {onActionClick && actionLabel && (
                <Button 
                    onClick={onActionClick}
                    className="rounded-full h-11 px-6 shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:scale-95"
                >
                    {actionIcon}
                    {actionLabel}
                </Button>
            )}
        </header>
    );
};
