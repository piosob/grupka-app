import { useState } from 'react';
import { actions } from 'astro:actions';
import { navigate } from 'astro:transitions/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn, getInputClasses } from '../../lib/utils';

interface RegisterFormProps {
    // Te propsy mogą zostać dla initial state, ale będziemy zarządzać nimi też lokalnie
    error?: string;
    inputErrors?: Record<string, string[] | undefined>;
    success?: boolean;
    needsEmailConfirmation?: boolean;
}

export function RegisterForm({
    error: initialError,
    inputErrors: initialInputErrors,
    success: initialSuccess,
    needsEmailConfirmation: initialNeedsConfirmation,
}: RegisterFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(initialError);
    const [inputErrors, setInputErrors] = useState<Record<string, string[] | undefined> | undefined>(
        initialInputErrors
    );
    const [success, setSuccess] = useState(initialSuccess || false);
    const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(
        initialNeedsConfirmation || false
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(undefined);
        setInputErrors(undefined);

        const formData = new FormData(e.currentTarget);
        const { data, error: actionError } = await actions.auth.register(formData);

        setIsLoading(false);

        if (actionError) {
            // Safe check for input error without using isInputError helper which might use instanceof
            const isInputErr = (actionError as any).type === 'input' || (actionError as any).code === 'BAD_REQUEST';
            
            if (isInputErr && (actionError as any).fields) {
                setInputErrors((actionError as any).fields);
            } else {
                setError(actionError.message);
            }
            return;
        }

        if (data?.success) {
            if (data.needsEmailConfirmation) {
                setSuccess(true);
                setNeedsEmailConfirmation(true);
            } else {
                // Jeśli nie wymaga potwierdzenia, przekieruj
                navigate('/dashboard');
            }
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
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Imię</Label>
                        <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            placeholder="np. Kasia"
                            className={cn(getInputClasses(inputErrors?.firstName))}
                            required
                        />
                        {inputErrors?.firstName && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {inputErrors.firstName[0]}
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
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="twoj@email.pl"
                            className={cn(getInputClasses(inputErrors?.email))}
                            required
                        />
                        {inputErrors?.email && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {inputErrors.email[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Hasło</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className={cn(getInputClasses(inputErrors?.password))}
                            required
                        />
                        {inputErrors?.password && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {inputErrors.password[0]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">Minimum 8 znaków</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Powtórz hasło</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className={cn(getInputClasses(inputErrors?.confirmPassword))}
                            required
                        />
                        {inputErrors?.confirmPassword && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {inputErrors.confirmPassword[0]}
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
                        disabled={isLoading}
                    >
                        {isLoading ? 'Tworzenie konta...' : 'Utwórz konto'}
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
