import { useState } from 'react';
import { actions } from 'astro:actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function ResetPasswordForm() {
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
            formData.append('password', password);
            formData.append('confirmPassword', confirmPassword);

            const { data, error: actionError } = await actions.auth.updatePassword(formData);

            if (actionError) {
                setError(actionError.message);
                setIsLoading(false);
                return;
            }

            setSuccess(true);
            setIsLoading(false);

            // Redirect to login after successful password reset
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd');
            setIsLoading(false);
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
                            <p>Twoje hasło zostało pomyślnie zmienione.</p>
                            <p className="mt-2">Za chwilę zostaniesz przekierowany do logowania.</p>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nowe hasło</Label>
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
                        <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
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
                        {isLoading ? 'Zmiana hasła...' : 'Zmień hasło'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
