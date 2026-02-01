import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdatePasswordCommandSchema, type UpdatePasswordCommand } from '../../lib/schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn, getInputClasses } from '../../lib/utils';

interface ResetPasswordFormProps {
    error?: string;
    success?: boolean;
    message?: string;
}

export function ResetPasswordForm({
    error: initialError,
    success: initialSuccess,
    message: initialMessage,
}: ResetPasswordFormProps) {
    const [error, setError] = useState<string | undefined>(initialError);
    const [success, setSuccess] = useState(initialSuccess || false);
    const [message, setMessage] = useState<string | undefined>(initialMessage);

    const {
        register,
        handleSubmit,
        formState: { errors: fieldErrors, isValid, isSubmitting },
    } = useForm<UpdatePasswordCommand>({
        resolver: zodResolver(UpdatePasswordCommandSchema),
        mode: 'onBlur',
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: UpdatePasswordCommand) => {
        setError(undefined);

        try {
            const response = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || 'Nie udało się zmienić hasła');
                return;
            }

            if (result.data?.success) {
                setSuccess(true);
                setMessage(result.data.message);
            }
        } catch (err) {
            setError('Wystąpił błąd połączenia z serwerem');
            console.error('Update password fetch error:', err);
        }
    };

    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Hasło zmienione!</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-sm text-green-600 bg-green-50 p-4 rounded-md">
                            <p>{message ?? 'Twoje hasło zostało pomyślnie zmienione.'}</p>
                            <p className="mt-2">Możesz wrócić do logowania, gdy będziesz gotowy.</p>
                        </div>
                        <div className="text-center">
                            <a
                                href="/login"
                                className="text-sm text-blue-400 hover:text-blue-600 hover:underline"
                            >
                                Powrót do logowania
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Ustaw nowe hasło</CardTitle>
                <CardDescription>Wprowadź nowe hasło do swojego konta</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="password">Nowe hasło</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className={cn(getInputClasses(fieldErrors.password))}
                            {...register('password')}
                        />
                        {fieldErrors.password && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {fieldErrors.password.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">Minimum 8 znaków</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className={cn(getInputClasses(fieldErrors.confirmPassword))}
                            {...register('confirmPassword')}
                        />
                        {fieldErrors.confirmPassword && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {fieldErrors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    {error && (
                        <div
                            className="text-sm text-destructive bg-destructive/10 p-3 rounded-2xl border border-destructive/20 animate-in fade-in slide-in-from-top-1"
                            role="status"
                        >
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-full text-base font-semibold"
                        disabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? 'Zmienianie...' : 'Zmień hasło'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
