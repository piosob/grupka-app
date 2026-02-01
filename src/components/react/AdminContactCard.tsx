import React, { useState } from 'react';
import { Mail, Shield, User, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import type { AdminContactDTO } from '../../lib/schemas';

interface AdminContactCardProps {
    adminName: string | null;
    groupId: string;
}

export function AdminContactCard({ adminName, groupId }: AdminContactCardProps) {
    const [contact, setContact] = useState<AdminContactDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAdminContact = async () => {
        if (contact) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/groups/${groupId}/members/admin-contact`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Nie udało się pobrać danych kontaktowych');
            }
            const { data } = await response.json();
            setContact(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border shadow-sm">
                        <Shield className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-none">Administrator</p>
                        <p className="text-xs text-muted-foreground">
                            {adminName ? `Rodzic: ${adminName}` : 'Brak danych'}
                        </p>
                    </div>
                </div>

                <Dialog onOpenChange={(open) => open && fetchAdminContact()}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            Pokaż kontakt
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Kontakt do administratora</DialogTitle>
                            <DialogDescription>
                                Informacje kontaktowe administratora grupy oraz jego dzieci.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Pobieranie danych...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-4">
                                    <p className="text-sm text-destructive">{error}</p>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={fetchAdminContact}
                                        className="mt-2"
                                    >
                                        Spróbuj ponownie
                                    </Button>
                                </div>
                            ) : contact ? (
                                <>
                                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                                        <Mail className="w-5 h-5 text-primary mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Adres e-mail</p>
                                            <a
                                                href={`mailto:${contact.email}`}
                                                className="text-sm text-primary hover:underline font-semibold break-all"
                                            >
                                                {contact.email}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                                        <User className="w-5 h-5 text-primary mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Dzieci administratora</p>
                                            <p className="text-sm text-muted-foreground">
                                                {contact.childrenNames.join(', ') || 'Nie podano'}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-muted-foreground text-center px-4">
                                        Używaj danych kontaktowych tylko w ważnych sprawach dotyczących grupy.
                                        Szanuj prywatność innych rodziców.
                                    </p>
                                </>
                            ) : null}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

