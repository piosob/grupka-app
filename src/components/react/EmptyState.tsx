import React from 'react';
import { Plus, Link as LinkIcon, Search, type LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export function EmptyState({
    title,
    description,
    icon: Icon = Search,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-3xl bg-muted/30">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-primary/60" />
            </div>

            <h2 className="text-2xl font-bold mb-3">{title}</h2>
            <p className="text-muted-foreground max-w-sm mb-8">{description}</p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4">
                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-semibold"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        {actionLabel}
                    </Button>
                )}
                {secondaryActionLabel && onSecondaryAction && (
                    <Button
                        onClick={onSecondaryAction}
                        variant="outline"
                        className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-semibold"
                    >
                        <LinkIcon className="mr-2 h-5 w-5" />
                        {secondaryActionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
