import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { MemberViewModel } from './MemberCard';

interface DeleteMemberDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    member: MemberViewModel | null;
    isDeleting: boolean;
}

export const DeleteMemberDialog: React.FC<DeleteMemberDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    member,
    isDeleting,
}) => {
    if (!member) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć członka?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Usunięcie członka <strong>{member.displayName}</strong> spowoduje również
                        usunięcie wszystkich danych powiązanych z jego dziećmi (
                        {member.childrenNames.join(', ')}) w tej grupie. Tej operacji nie można
                        cofnąć.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Usuwanie...
                            </>
                        ) : (
                            'Usuń z grupy'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
