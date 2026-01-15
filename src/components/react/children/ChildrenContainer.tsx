import React, { useState } from 'react';
import { useChildren } from '@/lib/hooks/useChildren';
import { useGroupDetail } from '@/lib/hooks/useGroupDetail';
import { ChildProfileCard } from './ChildProfileCard';
import { Button } from '@/components/ui/button';
import { Plus, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryProvider } from '../providers/QueryProvider';
import { ChildrenHeader } from './ChildrenHeader';

interface ChildrenContainerProps {
    groupId: string;
}

function ChildrenContent({ groupId }: ChildrenContainerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { children, isLoadingChildren } = useChildren(groupId);
    const { data: group } = useGroupDetail(groupId);

    const filteredChildren = children.filter((child) =>
        child.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasChildren = children.length > 0;

    return (
        <div className="space-y-6">
            <ChildrenHeader
                groupId={groupId}
                groupName={group?.name}
                title="Dzieci"
                description="Lista dzieci w Twojej grupie. Kliknij w profil, aby dowiedzieć się więcej."
                showBackButton
                onActionClick={() => (window.location.href = `/groups/${groupId}/children/new`)}
                actionLabel="Dodaj dziecko"
            />

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Szukaj dziecka..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isLoadingChildren ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
                    ))}
                </div>
            ) : !hasChildren ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-3xl bg-muted/30">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Users className="w-8 h-8 text-primary/60" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Brak dzieci w grupie</h2>
                    <p className="text-muted-foreground max-w-xs mb-6">
                        Nie dodano jeszcze żadnych dzieci do tej grupy. Bądź pierwszy i stwórz
                        profil swojego dziecka!
                    </p>
                    <Button
                        onClick={() => (window.location.href = `/groups/${groupId}/children/new`)}
                        variant="outline"
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Dodaj pierwsze dziecko
                    </Button>
                </div>
            ) : filteredChildren.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        Nie znaleziono dziecka o imieniu "{searchQuery}"
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredChildren.map((child) => (
                        <ChildProfileCard key={child.id} child={child} groupId={groupId} />
                    ))}
                </div>
            )}
        </div>
    );
}

export const ChildrenContainer: React.FC<ChildrenContainerProps> = ({ groupId }) => {
    return (
        <QueryProvider>
            <ChildrenContent groupId={groupId} />
        </QueryProvider>
    );
};
