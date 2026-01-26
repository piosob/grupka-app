import React from 'react';
import { useMyChildren } from '@/lib/hooks/useMyChildren';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Baby, ChevronRight, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateAge } from '@/lib/utils';
import { EmptyState } from '../EmptyState';

export const MyChildrenSection: React.FC = () => {
    const { data: children, isLoading, isError } = useMyChildren();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Card>
                    <CardContent className="p-0">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border-b last:border-0">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isError || !children) {
        return null;
    }

    if (children.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Baby className="h-5 w-5" />
                        Moje dzieci
                    </h2>
                </div>
                <EmptyState
                    title="Brak dzieci"
                    description="Nie masz jeszcze przypisanych żadnych profili dzieci. Profile dzieci dodaje się wewnątrz konkretnej grupy."
                    icon={Baby}
                    actionLabel="Przejdź do grup"
                    onAction={() => window.location.href = '/dashboard'}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Baby className="h-5 w-5" />
                    Moje dzieci
                </h2>
                <Badge variant="secondary">{children.length}</Badge>
            </div>

            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col">
                        {children.map((child) => (
                            <div
                                key={child.id}
                                className="flex items-center justify-between p-4 border-b last:border-0"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-lg">{child.displayName}</span>
                                    {child.birthDate && (
                                        <span className="text-sm text-muted-foreground">
                                            Wiek: {calculateAge(child.birthDate)}
                                        </span>
                                    )}
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground px-1 text-center">
                Profile dzieci są powiązane z konkretnymi grupami.
            </p>
        </div>
    );
};
