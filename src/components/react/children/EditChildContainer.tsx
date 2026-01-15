import React from 'react';
import { useChildDetail } from '@/lib/hooks/useChildren';
import { useGroupDetail } from '@/lib/hooks/useGroupDetail';
import { ChildForm } from './ChildForm';
import { Loader2 } from 'lucide-react';
import { QueryProvider } from '../providers/QueryProvider';
import { ChildrenHeader } from './ChildrenHeader';

interface EditChildContainerProps {
    groupId: string;
    childId: string;
}

function EditChildContent({ groupId, childId }: EditChildContainerProps) {
    const { child, isLoadingChild, updateChild, isUpdatingChild } = useChildDetail(childId);
    const { data: group } = useGroupDetail(groupId);

    if (isLoadingChild) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Ładowanie danych do edycji...</p>
            </div>
        );
    }

    if (!child) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-4">Nie znaleziono profilu</h2>
                <button
                    onClick={() => (window.location.href = `/groups/${groupId}/children`)}
                    className="text-primary hover:underline"
                >
                    Powrót do listy
                </button>
            </div>
        );
    }

    const handleSubmit = async (values: any) => {
        try {
            await updateChild(values);
            window.location.href = `/groups/${groupId}/children/${childId}`;
        } catch (error) {
            // Error is handled by the hook
        }
    };

    return (
        <div className="py-6">
            <ChildrenHeader
                groupId={groupId}
                groupName={group?.name}
                title={`Edytuj profil: ${child.displayName}`}
                showBackButton
            />
            <ChildForm
                title="Zmień dane"
                submitLabel="Zapisz zmiany"
                initialValues={{
                    displayName: child.displayName,
                    birthDate: child.birthDate || '',
                    bio: child.bio || '',
                }}
                onSubmit={handleSubmit}
                isLoading={isUpdatingChild}
            />
        </div>
    );
}

export const EditChildContainer: React.FC<EditChildContainerProps> = ({ groupId, childId }) => {
    return (
        <QueryProvider>
            <EditChildContent groupId={groupId} childId={childId} />
        </QueryProvider>
    );
};
