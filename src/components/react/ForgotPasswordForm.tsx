import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ForgotPasswordFormProps {
    error?: string;
    inputErrors?: Record<string, string[] | undefined>;
    successMessage?: string;
}

export function ForgotPasswordForm({
    error: initialError,
    inputErrors: initialInputErrors,
    successMessage: initialSuccessMessage,
}: ForgotPasswordFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(initialError);
    const [inputErrors, setInputErrors] = useState<Record<string, string[] | undefined> | undefined>(
        initialInputErrors
    );
    const [successMessage, setSuccessMessage] = useState<string | undefined>(initialSuccessMessage);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(undefined);
        setInputErrors(undefined);

        const formData = new FormData(e.currentTarget);
        
        try {
            const response = await fetch('/api/auth/request-password-reset', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            setIsLoading(false);

            if (!response.ok) {
                if (result.error?.code === 'VALIDATION_ERROR' && result.error?.details) {
                    // Convert validation errors to input errors format
                    const fieldErrors: Record<string, string[]> = {};
                    result.error.details.forEach((detail: { field: string; message: string }) => {
                        fieldErrors[detail.field] = [detail.message];
                    });
                    setInputErrors(fieldErrors);
                } else {
                    setError(result.error?.message || 'Nie udało się wysłać linku resetującego');
                }
                return;
            }

            const data = result.data;
            if (data?.success) {
                setSuccessMessage(data.message);
            }
        } catch (err) {
            setIsLoading(false);
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
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="twoj@email.pl"
                            required
                        />
                        {inputErrors?.email && (
                            <p className="text-sm text-red-600">{inputErrors.email[0]}</p>
                        )}
                    </div>

                    {error && (
                        <div
                            className="text-sm text-red-600 bg-red-50 p-3 rounded-md"
                            role="status"
                        >
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
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
