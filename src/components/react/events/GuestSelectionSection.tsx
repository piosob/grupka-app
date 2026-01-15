import { useState, useMemo } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ChildListItemDTO } from '@/types';

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
        return children.filter((child) =>
            child.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [children, searchQuery]);

    const handleToggleChild = (childId: string) => {
        const isSelected = selectedIds.includes(childId);
        if (isSelected) {
            onChange(selectedIds.filter((id) => id !== childId));
        } else {
            onChange([...selectedIds, childId]);
        }
    };

    const handleToggleAll = () => {
        const filteredIds = filteredChildren.map((c) => c.id);
        const allFilteredSelected = filteredIds.every((id) => selectedIds.includes(id));

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
    const filteredIds = filteredChildren.map((c) => c.id);
    const allFilteredSelected =
        filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

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
                <ScrollArea className="h-[300px] w-full">
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
                                            <Checkbox
                                                id={`child-${child.id}`}
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleChild(child.id)}
                                                // Prevent double toggle when clicking the checkbox itself (which would bubble to div)
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <Label
                                                    // Remove htmlFor to prevent Label from triggering Checkbox click
                                                    // which would then bubble to div, causing double toggle
                                                    className="text-sm font-medium cursor-pointer block truncate group-hover:text-primary transition-colors"
                                                >
                                                    {child.displayName}
                                                </Label>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {child.isOwner
                                                        ? 'Twoje dziecko'
                                                        : 'Dziecko z grupy'}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in duration-300" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};
