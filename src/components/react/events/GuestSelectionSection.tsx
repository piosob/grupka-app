import { useState, useMemo } from 'react';
import { Search, CheckCircle2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ChildListItemDTO } from '@/types';
import { cn } from '@/lib/utils';

interface GuestSelectionSectionProps {
    children: ChildListItemDTO[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export const GuestSelectionSection = ({
    children,
    selectedIds,
    onChange,
}: GuestSelectionSectionProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChildren = useMemo(() => {
        if (!children) return [];
        return children.filter((child) =>
            child.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [children, searchQuery]);

    const { filteredIds, allFilteredSelected } = useMemo(() => {
        const ids = filteredChildren.map((c) => c.id);
        const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
        return { filteredIds: ids, allFilteredSelected: allSelected };
    }, [filteredChildren, selectedIds]);

    const handleToggleChild = (childId: string) => {
        const isSelected = selectedIds.includes(childId);
        if (isSelected) {
            onChange(selectedIds.filter((id) => id !== childId));
        } else {
            onChange([...selectedIds, childId]);
        }
    };

    const handleToggleAll = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (allFilteredSelected) {
            // Unselect all currently filtered
            onChange(selectedIds.filter((id) => !filteredIds.includes(id)));
        } else {
            // Select all currently filtered (add to existing selection)
            const newSelection = Array.from(new Set([...selectedIds, ...filteredIds]));
            onChange(newSelection);
        }
    };

    const selectedCount = selectedIds.length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">Wybierz gości</Label>
                    <Badge
                        variant="secondary"
                        className="rounded-full bg-primary/10 text-primary border-none"
                    >
                        {selectedCount} / {children.length}
                    </Badge>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleAll}
                    className="text-xs text-primary hover:text-primary hover:bg-primary/5"
                >
                    {allFilteredSelected ? 'Odznacz wszystkich' : 'Zaznacz wszystkich'}
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Szukaj dzieci..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20"
                />
            </div>

            <div className="border border-muted-foreground/20 rounded-2xl overflow-hidden bg-muted/5">
                <div className="h-[300px] w-full overflow-y-auto custom-scrollbar">
                    <div className="p-1">
                        {filteredChildren.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                Nie znaleziono dzieci o tej nazwie.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 divide-y divide-muted/50">
                                {filteredChildren.map((child) => {
                                    const isSelected = selectedIds.includes(child.id);
                                    return (
                                        <div
                                            key={child.id}
                                            className="flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors cursor-pointer group"
                                            onClick={() => handleToggleChild(child.id)}
                                        >
                                            {/* Simple Custom Checkbox to avoid Radix Ref loops */}
                                            <div
                                                className={cn(
                                                    'size-5 shrink-0 rounded-full border flex items-center justify-center transition-all duration-200',
                                                    isSelected
                                                        ? 'bg-primary border-primary text-primary-foreground shadow-sm scale-110'
                                                        : 'border-muted-foreground/30 bg-background group-hover:border-primary/50'
                                                )}
                                            >
                                                {isSelected && (
                                                    <Check className="size-3 h-3 stroke-[3]" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium block truncate group-hover:text-primary transition-colors">
                                                    {child.displayName}
                                                </span>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {child.isOwner
                                                        ? 'Twoje dziecko'
                                                        : 'Dziecko z grupy'}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="w-4 h-4 text-primary/40" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
