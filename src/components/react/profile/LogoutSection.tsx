import React from 'react';
import { actions } from 'astro:actions';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
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

export const LogoutSection: React.FC = () => {
    const handleLogout = async () => {
        try {
            const formData = new FormData();
            const { error } = await actions.auth.logout(formData);
            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success('Wylogowano pomyślnie');
            window.location.href = '/';
        } catch (error) {
            toast.error('Wystąpił błąd podczas wylogowywania');
        }
    };

    return (
        <div className="pt-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 h-14 rounded-xl border border-destructive/20">
                        <LogOut className="mr-2 h-5 w-5" />
                        Wyloguj się
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz się wylogować?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Twoja sesja zostanie zakończona. Będziesz musiał zalogować się ponownie, aby uzyskać dostęp do swoich grup.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                        <AlertDialogCancel className="h-12 rounded-xl sm:flex-1">Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLogout}
                            className="h-12 rounded-xl sm:flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Wyloguj się
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
