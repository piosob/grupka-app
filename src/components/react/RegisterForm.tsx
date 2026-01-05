import { useState } from 'react';
import { actions } from 'astro:actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setIsLoading(true);

        // Client-side validation
        if (password !== confirmPassword) {
            setError('Hasła muszą być identyczne');
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Hasło musi mieć co najmniej 8 znaków');
            setIsLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            formData.append('confirmPassword', confirmPassword);

            const { data, error: actionError } = await actions.auth.register(formData);

            if (actionError) {
                setError(actionError.message);
                setIsLoading(false);
                return;
            }

            // Show success message
            setSuccess(true);
            setIsLoading(false);

            if (data?.needsEmailConfirmation) {
                // Email confirmation required
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                // Auto-login successful
                window.location.href = '/groups';
            }
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd');
            setIsLoading(false);
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
                            <p>
                                Sprawdź swoją skrzynkę email i kliknij w link aktywacyjny, aby
                                potwierdzić swoje konto.
                            </p>
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            Przekierowanie do strony logowania...
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

                    <div className="space-y-2">
                        <Label htmlFor="password">Hasło</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">Minimum 8 znaków</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Powtórz hasło</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Tworzenie konta...' : 'Utwórz konto'}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                        Masz już konto?{' '}
                        <a
                            href="/login"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Zaloguj się
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
