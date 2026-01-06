import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ForgotPasswordFormProps {
    action: string;
    error?: string;
    successMessage?: string;
}

export function ForgotPasswordForm({ action, error, successMessage }: ForgotPasswordFormProps) {
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

                    {error && (
                        <div
                            className="text-sm text-red-600 bg-red-50 p-3 rounded-md"
                            role="status"
                        >
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full">
                        Wyślij link resetujący
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
