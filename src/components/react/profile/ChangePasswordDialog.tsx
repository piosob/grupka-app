import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { actions } from 'astro:actions';
import { toast } from 'sonner';
import { UpdatePasswordCommandSchema, type UpdatePasswordCommand } from '@/lib/schemas';
import { cn, getInputClasses } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ChangePasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<UpdatePasswordCommand>({
        resolver: zodResolver(UpdatePasswordCommandSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: UpdatePasswordCommand) => {
        try {
            const { error } = await actions.auth.updatePassword(data);
            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success('Hasło zostało zmienione');
            onOpenChange(false);
            reset();
        } catch (error) {
            toast.error('Wystąpił nieoczekiwany błąd');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Zmień hasło</DialogTitle>
                    <DialogDescription>
                        Wprowadź nowe hasło dla swojego konta.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nowe hasło</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password')}
                            className={cn(getInputClasses(errors.password))}
                            placeholder="Min. 8 znaków"
                        />
                        {errors.password && (
                            <p className="text-sm font-medium text-destructive">
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            {...register('confirmPassword')}
                            className={cn(getInputClasses(errors.confirmPassword))}
                            placeholder="Powtórz hasło"
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm font-medium text-destructive">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>
                    <DialogFooter className="pt-4 flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-12 rounded-xl sm:flex-1"
                        >
                            Anuluj
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-12 rounded-xl sm:flex-1"
                        >
                            {isSubmitting ? 'Zapisywanie...' : 'Zapisz hasło'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
