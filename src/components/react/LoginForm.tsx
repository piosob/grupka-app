import { useState } from 'react';
import { actions } from 'astro:actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const { data, error: actionError } = await actions.auth.login(formData);

            if (actionError) {
                setError(actionError.message);
                setIsLoading(false);
                return;
            }

            // Redirect on success
            if (data?.redirectTo) {
                window.location.href = data.redirectTo;
            }
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd');
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Zaloguj się</CardTitle>
                <CardDescription>Wprowadź swoje dane, aby zalogować się do konta</CardDescription>
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
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                    </Button>

                    <div className="text-center text-sm">
                        <a
                            href="/forgot-password"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Zapomniałeś hasła?
                        </a>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                        Nie masz konta?{' '}
                        <a
                            href="/register"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Zarejestruj się
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
