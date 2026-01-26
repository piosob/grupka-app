import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { GroupDetailDTO } from '@/lib/schemas';
import { queryKeys } from '@/lib/query-keys';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


interface DangerousZoneProps {
    group: GroupDetailDTO;
}

export const DangerousZone: React.FC<DangerousZoneProps> = ({ group }) => {
    const queryClient = useQueryClient();
    const [confirmName, setConfirmName] = useState('');
    const [confirmError, setConfirmError] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const deleteGroupMutation = useMutation({
        mutationFn: async () => {
            if (confirmName !== group.name) {
                setConfirmError(true);
                throw new Error('Wpisana nazwa grupy jest niepoprawna');
            }
            const response = await fetch(`/api/groups/${group.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Nie udało się usunąć grupy');
            }

            if (response.status === 204) {
                return;
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success('Grupa została usunięta');
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
            window.location.href = '/dashboard';
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const isMatch = confirmName === group.name;

    return (
        <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Strefa niebezpieczna
                </CardTitle>
                <CardDescription>
                    Poniższe akcje są nieodwracalne. Prosimy o rozwagę.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="space-y-1">
                        <p className="font-medium">Usuń grupę</p>
                        <p className="text-sm text-muted-foreground">
                            Wszystkie dane, wydarzenia i członkowie zostaną trwale usunięci.
                        </p>
                    </div>
                    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full sm:w-auto">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Usuń grupę
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Czy na pewno chcesz usunąć grupę?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ta operacja jest nieodwracalna. Spowoduje to trwałe usunięcie grupy
                                    <span className="font-bold text-foreground mx-1">"{group.name}"</span>
                                    oraz wszystkich powiązanych z nią danych.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                                    <div className="space-y-1 text-left">
                                        <p className="font-medium text-destructive text-sm">Uwaga</p>
                                        <p className="text-xs text-destructive/80">Nie będzie można cofnąć tej operacji.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-name">
                                        Wpisz nazwę grupy, aby potwierdzić:
                                    </Label>
                                    <Input
                                        id="confirm-name"
                                        value={confirmName}
                                        onChange={(e) => {
                                            setConfirmName(e.target.value);
                                            setConfirmError(false);
                                        }}
                                        placeholder={group.name}
                                        className={cn(
                                            "h-12 text-lg rounded-xl",
                                            confirmError && "border-destructive ring-destructive"
                                        )}
                                        autoComplete="off"
                                    />
                                    {confirmError && (
                                        <p className="text-xs text-destructive font-medium">
                                            Nazwa grupy musi być identyczna jak "{group.name}"
                                        </p>
                                    )}
                                </div>
                            </div>
                            <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                                <AlertDialogCancel className="h-12 rounded-xl sm:flex-1">Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        deleteGroupMutation.mutate();
                                    }}
                                    disabled={!isMatch || deleteGroupMutation.isPending}
                                    className="h-12 rounded-xl sm:flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {deleteGroupMutation.isPending ? 'Usuwanie...' : 'Usuń na zawsze'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
};
