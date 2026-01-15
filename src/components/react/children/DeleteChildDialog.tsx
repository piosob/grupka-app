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

interface DeleteChildDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    childName: string;
    isDeleting?: boolean;
}

export const DeleteChildDialog: React.FC<DeleteChildDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    childName,
    isDeleting = false,
}) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć profil?</AlertDialogTitle>
                    <AlertDialogDescription>
                        To działanie jest nieodwracalne. Profil dziecka <strong>{childName}</strong>{' '}
                        oraz wszystkie powiązane z nim informacje zostaną trwale usunięte.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Usuwanie...' : 'Usuń profil'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
