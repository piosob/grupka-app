import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn, getInputClasses } from '../../lib/utils';

interface LoginFormProps {
    action: string;
    error?: string;
    inputErrors?: Record<string, string[] | undefined>;
}

export function LoginForm({ action, error, inputErrors }: LoginFormProps) {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Zaloguj się</CardTitle>
                <CardDescription>Wprowadź swoje dane, aby zalogować się do konta</CardDescription>
            </CardHeader>
            <CardContent>
                <form method="POST" action={action} className="space-y-4" noValidate>
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
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className={cn(getInputClasses(inputErrors?.password))}
                            required
                        />
                        {inputErrors?.password && (
                            <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                {inputErrors.password[0]}
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
                    >
                        Zaloguj się
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
