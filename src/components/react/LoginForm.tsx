import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigate } from 'astro:transitions/client';
import { LoginCommandSchema, type LoginCommand } from '../../lib/schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn, getInputClasses } from '../../lib/utils';

interface LoginFormProps {
    error?: string;
}

export function LoginForm({ error: initialError }: LoginFormProps) {
    const [error, setError] = useState<string | undefined>(initialError);

    const {
        register,
        handleSubmit,
        formState: { errors: fieldErrors, isValid, isSubmitting },
    } = useForm<LoginCommand>({
        resolver: zodResolver(LoginCommandSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginCommand) => {
        setError(undefined);

        const formData = new FormData();
        formData.append('email', data.email);
        formData.append('password', data.password);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || 'Nie udało się zalogować');
                return;
            }

            if (result.data?.success) {
                navigate(result.data.redirectTo || '/dashboard');
            }
        } catch (err) {
            setError('Wystąpił błąd połączenia z serwerem');
            console.error('Login fetch error:', err);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Zaloguj się</CardTitle>
                <CardDescription>Wprowadź swoje dane, aby zalogować się do konta</CardDescription>
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

                    <div className="space-y-2">
                        <Label htmlFor="password">Hasło</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className={cn(getInputClasses(fieldErrors.password))}
                            {...register('password')}
                        />
                        {fieldErrors.password && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {fieldErrors.password.message}
                            </p>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-full text-base font-semibold"
                        disabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
                    </Button>

                    <div className="text-center text-sm">
                        <a
                            href="/forgot-password"
                            className="text-blue-400 hover:text-blue-600 hover:underline"
                        >
                            Zapomniałeś hasła?
                        </a>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                        Nie masz konta?{' '}
                        <a
                            href="/register"
                            className="text-blue-400 hover:text-blue-600 hover:underline"
                        >
                            Zarejestruj się
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
