import React from 'react';
import { useChildren } from '@/lib/hooks/useChildren';
import { useGroupDetail } from '@/lib/hooks/useGroupDetail';
import { ChildForm } from './ChildForm';
import { QueryProvider } from '../providers/QueryProvider';
import { ChildrenHeader } from './ChildrenHeader';

interface CreateChildContainerProps {
    groupId: string;
}

function CreateChildContent({ groupId }: CreateChildContainerProps) {
    const { children, createChild, isCreatingChild } = useChildren(groupId);
    const { data: group } = useGroupDetail(groupId);

    const existingNames = children.map((c) => c.displayName);

    const handleSubmit = async (values: any) => {
        try {
            await createChild(values);
            window.location.href = `/groups/${groupId}/children`;
        } catch (error) {
            // Error is handled by the hook
        }
    };

    return (
        <div className="py-6">
            <ChildrenHeader
                groupId={groupId}
                groupName={group?.name}
                title="Dodaj profil dziecka"
                showBackButton
            />
            <ChildForm
                title="Dane dziecka"
                submitLabel="Dodaj dziecko"
                onSubmit={handleSubmit}
                isLoading={isCreatingChild}
                existingNames={existingNames}
            />
        </div>
    );
}

export const CreateChildContainer: React.FC<CreateChildContainerProps> = ({ groupId }) => {
    return (
        <QueryProvider>
            <CreateChildContent groupId={groupId} />
        </QueryProvider>
    );
};
