import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigate } from 'astro:transitions/client';
import { RegisterCommandSchema, type RegisterCommand } from '../../lib/schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn, getInputClasses } from '../../lib/utils';

interface RegisterFormProps {
    error?: string;
    success?: boolean;
    needsEmailConfirmation?: boolean;
}

export function RegisterForm({
    error: initialError,
    success: initialSuccess,
    needsEmailConfirmation: initialNeedsConfirmation,
}: RegisterFormProps) {
    const [error, setError] = useState<string | undefined>(initialError);
    const [success, setSuccess] = useState(initialSuccess || false);
    const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(
        initialNeedsConfirmation || false
    );

    const {
        register,
        handleSubmit,
        formState: { errors: fieldErrors, isValid, isSubmitting },
    } = useForm<RegisterCommand>({
        resolver: zodResolver(RegisterCommandSchema),
        mode: 'onBlur',
        defaultValues: {
            firstName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: RegisterCommand) => {
        setError(undefined);

        const formData = new FormData();
        formData.append('firstName', data.firstName);
        formData.append('email', data.email);
        formData.append('password', data.password);
        formData.append('confirmPassword', data.confirmPassword);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || 'Nie udało się utworzyć konta');
                return;
            }

            if (result.data?.success) {
                if (result.data.needsEmailConfirmation) {
                    setSuccess(true);
                    setNeedsEmailConfirmation(true);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            setError('Wystąpił błąd połączenia z serwerem');
            console.error('Register fetch error:', err);
        }
    };

    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Konto utworzone!</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-sm text-green-600 bg-green-50 p-4 rounded-md">
                            <p className="font-semibold mb-2">Rejestracja zakończona sukcesem!</p>
                            {needsEmailConfirmation ? (
                                <p>
                                    Sprawdź swoją skrzynkę email i kliknij w link aktywacyjny, aby
                                    potwierdzić swoje konto.
                                </p>
                            ) : (
                                <p className="text-sm text-gray-600">
                                    Twoje konto zostało utworzone. Zalogujemy Cię automatycznie po
                                    zakończeniu procesu.
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            Możesz teraz{' '}
                            <a
                                href="/login"
                                className="text-blue-400 hover:text-blue-600 hover:underline"
                            >
                                przejść do logowania
                            </a>
                            .
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Utwórz konto</CardTitle>
                <CardDescription>
                    Wypełnij formularz, aby założyć nowe konto w Grupka
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Imię</Label>
                        <Input
                            id="firstName"
                            type="text"
                            placeholder="np. Kasia"
                            className={cn(getInputClasses(fieldErrors.firstName))}
                            {...register('firstName')}
                        />
                        {fieldErrors.firstName && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {fieldErrors.firstName.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Szanujemy Twoją prywatność. Podaj tylko imię - to wystarczy, by inni
                            rodzice Cię rozpoznali.
                        </p>
                    </div>

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

                    <div className="space-y-2">
                        <Label htmlFor="password">Hasło</Label>
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
                        <Label htmlFor="confirmPassword">Powtórz hasło</Label>
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
                        {isSubmitting ? 'Tworzenie konta...' : 'Utwórz konto'}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                        Masz już konto?{' '}
                        <a
                            href="/login"
                            className="text-blue-400 hover:text-blue-600 hover:underline"
                        >
                            Zaloguj się
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
