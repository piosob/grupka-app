// Corrected MembersContainer.tsx - removing broken Alert import
import React, { useState, useMemo } from 'react';
import { useMembers } from '@/lib/hooks/useMembers';
import { useGroupDetail } from '@/lib/hooks/useGroupDetail';
import { MembersHeader } from './MembersHeader';
import { MembersList } from './MembersList';
import { AdminContactDialog } from './AdminContactDialog';
import { DeleteMemberDialog } from './DeleteMemberDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { QueryProvider } from '../providers/QueryProvider';
import type { GroupMemberDTO, AdminContactDTO } from '@/types';
import type { MemberViewModel } from './MemberCard';

interface MembersContainerProps {
    groupId: string;
    currentUserId: string;
}

const mapMemberToViewModel = (member: GroupMemberDTO, currentUserId: string): MemberViewModel => {
    const childrenNames = member.childrenNames || [];
    const childrenLabel =
        childrenNames.length > 0
            ? `Rodzic: ${childrenNames.join(', ')}`
            : 'Rodzic (brak przypisanych dzieci)';

    // Generate initials from first_name
    const initials = (member.firstName || 'R').charAt(0).toUpperCase();

    return {
        ...member,
        initials,
        displayName: member.firstName || 'Użytkownik',
        childrenLabel,
        isSelf: member.userId === currentUserId,
    };
};

function MembersContent({ groupId, currentUserId }: MembersContainerProps) {
    const {
        members,
        totalCount,
        isLoadingMembers,
        membersError,
        refetchMembers,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        removeMember,
        isRemovingMember,
        getAdminContact,
    } = useMembers(groupId);

    const { data: group, isLoading: isLoadingGroup } = useGroupDetail(groupId);
    const isAdmin = group?.role === 'admin';

    // Dialog states
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Data states for dialogs
    const [selectedMember, setSelectedMember] = useState<MemberViewModel | null>(null);
    const [adminContact, setAdminContact] = useState<AdminContactDTO | null>(null);
    const [isLoadingContact, setIsLoadingContact] = useState(false);

    // Map members to view models
    const memberViewModels = useMemo(
        () => members.map((m) => mapMemberToViewModel(m, currentUserId)),
        [members, currentUserId]
    );

    const handleShowContact = async (member: MemberViewModel) => {
        setSelectedMember(member);
        setContactDialogOpen(true);
        setIsLoadingContact(true);
        setAdminContact(null);

        try {
            const contact = await getAdminContact();
            setAdminContact(contact);
        } catch (error) {
            console.error('Failed to fetch admin contact:', error);
            // Error handling is managed within the dialog via adminContact being null
        } finally {
            setIsLoadingContact(false);
        }
    };

    const handleDeleteClick = (member: MemberViewModel) => {
        setSelectedMember(member);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!selectedMember) return;

        removeMember(selectedMember.userId, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedMember(null);
            },
        });
    };

    if (isLoadingMembers || isLoadingGroup) {
        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (membersError) {
        return (
            <div className="p-6 bg-destructive/10 text-destructive rounded-3xl border border-destructive/20 text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-bold">Wystąpił błąd</h3>
                </div>
                <p className="text-sm">Nie udało się załadować listy członków.</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mx-auto gap-2 bg-background hover:bg-muted"
                    onClick={() => refetchMembers()}
                >
                    <RefreshCcw className="h-4 w-4" />
                    Spróbuj ponownie
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <MembersHeader groupId={groupId} groupName={group?.name} count={totalCount} />

            <MembersList
                groupId={groupId}
                members={memberViewModels}
                canManage={isAdmin}
                onShowContact={handleShowContact}
                onDelete={handleDeleteClick}
            />

            {hasNextPage && (
                <div className="mt-8 flex justify-center">
                    <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="rounded-full px-8"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                                Ładowanie...
                            </>
                        ) : (
                            'Pokaż więcej'
                        )}
                    </Button>
                </div>
            )}

            <AdminContactDialog
                isOpen={contactDialogOpen}
                onClose={() => setContactDialogOpen(false)}
                contact={adminContact}
                isLoading={isLoadingContact}
            />

            <DeleteMemberDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                member={selectedMember}
                isDeleting={isRemovingMember}
            />
        </div>
    );
}

export function MembersContainer(props: MembersContainerProps) {
    return (
        <QueryProvider>
            <MembersContent {...props} />
        </QueryProvider>
    );
}
