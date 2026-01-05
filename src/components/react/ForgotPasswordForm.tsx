import { useState } from 'react';
import { actions } from 'astro:actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('email', email);

            const { data, error: actionError } = await actions.auth.requestPasswordReset(formData);

            if (actionError) {
                setError(actionError.message);
                setIsLoading(false);
                return;
            }

            setSuccess(true);
            setIsLoading(false);
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd');
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Sprawdź swoją skrzynkę email</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-sm text-green-600 bg-green-50 p-4 rounded-md">
                            <p>
                                Jeśli konto z tym adresem email istnieje, wysłaliśmy link do
                                resetowania hasła.
                            </p>
                            <p className="mt-2">
                                Sprawdź swoją skrzynkę email i postępuj zgodnie z instrukcjami.
                            </p>
                        </div>
                        <div className="text-center">
                            <a
                                href="/login"
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="twoj@email.pl"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
                    </Button>

                    <div className="text-center text-sm">
                        <a
                            href="/login"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Powrót do logowania
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
