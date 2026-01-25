import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ResetPasswordFormProps {
    action: string;
    error?: string;
    inputErrors?: Record<string, string[] | undefined>;
    success?: boolean;
    message?: string;
}

export function ResetPasswordForm({
    action,
    error,
    inputErrors,
    success,
    message,
}: ResetPasswordFormProps) {
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
                <form method="POST" action={action} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="password">Nowe hasło</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                        {inputErrors?.password && (
                            <p className="text-sm text-red-600">{inputErrors.password[0]}</p>
                        )}
                        <p className="text-xs text-gray-500">Minimum 8 znaków</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                        {inputErrors?.confirmPassword && (
                            <p className="text-sm text-red-600">{inputErrors.confirmPassword[0]}</p>
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

                    <Button type="submit" className="w-full">
                        Zmień hasło
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
