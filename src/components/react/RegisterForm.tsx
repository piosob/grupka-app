import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface RegisterFormProps {
    action: string;
    error?: string;
    success?: boolean;
    needsEmailConfirmation?: boolean;
}

export function RegisterForm({
    action,
    error,
    success,
    needsEmailConfirmation,
}: RegisterFormProps) {
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
                                className="text-blue-600 hover:text-blue-800 hover:underline"
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
                <form method="POST" action={action} className="space-y-4">
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Hasło</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                        <p className="text-xs text-gray-500">Minimum 8 znaków</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Powtórz hasło</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
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
                        Utwórz konto
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
