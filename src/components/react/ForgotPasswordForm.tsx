import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequestPasswordResetCommandSchema, type RequestPasswordResetCommand } from '../../lib/schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn, getInputClasses } from '../../lib/utils';

interface ForgotPasswordFormProps {
    error?: string;
    successMessage?: string;
}

export function ForgotPasswordForm({
    error: initialError,
    successMessage: initialSuccessMessage,
}: ForgotPasswordFormProps) {
    const [error, setError] = useState<string | undefined>(initialError);
    const [successMessage, setSuccessMessage] = useState<string | undefined>(initialSuccessMessage);

    const {
        register,
        handleSubmit,
        formState: { errors: fieldErrors, isValid, isSubmitting },
    } = useForm<RequestPasswordResetCommand>({
        resolver: zodResolver(RequestPasswordResetCommandSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (data: RequestPasswordResetCommand) => {
        setError(undefined);

        const formData = new FormData();
        formData.append('email', data.email);

        try {
            const response = await fetch('/api/auth/request-password-reset', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || 'Nie udało się wysłać linku resetującego');
                return;
            }

            if (result.data?.success) {
                setSuccessMessage(result.data.message);
            }
        } catch (err) {
            setError('Wystąpił błąd połączenia z serwerem');
            console.error('Request password reset fetch error:', err);
        }
    };

    if (successMessage) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Sprawdź swoją skrzynkę email</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-sm text-green-600 bg-green-50 p-4 rounded-md">
                            <p>{successMessage}</p>
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
                <CardTitle>Resetuj hasło</CardTitle>
                <CardDescription>
                    Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="twoj@email.pl"
                            className={cn(getInputClasses(fieldErrors.email))}
                            {...register('email')}
                        />
                        {fieldErrors.email && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {fieldErrors.email.message}
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
                        {isSubmitting ? 'Wysyłanie...' : 'Wyślij link resetujący'}
                    </Button>

                    <div className="text-center text-sm">
                        <a
                            href="/login"
                            className="text-blue-400 hover:text-blue-600 hover:underline"
                        >
                            Powrót do logowania
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
