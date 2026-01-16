import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Mail, Loader2, AlertTriangle } from 'lucide-react';
import type { AdminContactDTO } from '@/types';

interface AdminContactDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contact: AdminContactDTO | null;
    isLoading: boolean;
}

export const AdminContactDialog: React.FC<AdminContactDialogProps> = ({
    isOpen,
    onClose,
    contact,
    isLoading,
}) => {
    const [isCopying, setIsCopying] = useState(false);

    const handleCopyEmail = async () => {
        if (!contact?.email) return;

        try {
            setIsCopying(true);
            await navigator.clipboard.writeText(contact.email);
            toast.success('Email został skopiowany do schowka');
        } catch (err) {
            toast.error('Nie udało się skopiować emaila');
        } finally {
            setIsCopying(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Kontakt z administratorem</DialogTitle>
                    <DialogDescription>
                        Dane kontaktowe administratora grupy do bezpośredniej komunikacji.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="flex gap-3 p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20 text-xs leading-relaxed">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <p>
                            Używaj danych kontaktowych tylko w ważnych sprawach dotyczących grupy.
                            Szanuj prywatność innych rodziców.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Pobieranie danych...</p>
                        </div>
                    ) : contact ? (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted p-4 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Adres email
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-sm break-all">
                                        {contact.email}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={handleCopyEmail}
                                        disabled={isCopying}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                <p>
                                    Administrator reprezentuje:{' '}
                                    <strong>
                                        {contact.childrenNames?.join(', ') || 'brak danych'}
                                    </strong>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-destructive">
                            <p>Wystąpił błąd podczas pobierania danych.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Zamknij
                    </Button>
                    {contact && (
                        <Button
                            type="button"
                            className="gap-2"
                            onClick={() => (window.location.href = `mailto:${contact.email}`)}
                        >
                            <Mail className="h-4 w-4" />
                            Wyślij wiadomość
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
