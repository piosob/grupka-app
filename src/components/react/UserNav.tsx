import { useState } from 'react';
import { actions } from 'astro:actions';
import { LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface UserNavProps {
    userEmail?: string | null;
}

export function UserNav({ userEmail }: UserNavProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);

        try {
            const formData = new FormData();
            const { error } = await actions.auth.logout(formData);

            if (error) {
                console.error('Logout error:', error);
                setIsLoggingOut(false);
                return;
            }

            // Redirect to home page after logout
            window.location.href = '/';
        } catch (err) {
            console.error('Logout exception:', err);
            setIsLoggingOut(false);
        }
    };

    // If user is not logged in, show login/register buttons
    if (!userEmail) {
        return (
            <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                    <a href="/login">Zaloguj</a>
                </Button>
                <Button asChild>
                    <a href="/register">Zarejestruj</a>
                </Button>
            </div>
        );
    }

    // Get initials from email (first letter)
    const initials = userEmail.charAt(0).toUpperCase();

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex rounded-full gap-2">
                <a href="/dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    Moje grupy
                </a>
            </Button>
            <Button variant="ghost" size="icon" asChild className="sm:hidden rounded-full">
                <a href="/dashboard" title="Moje grupy">
                    <LayoutDashboard className="w-5 h-5" />
                </a>
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Twoje konto</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {userEmail}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <a href="/dashboard" className="cursor-pointer">
                            Moje grupy
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a href="/profile" className="cursor-pointer">
                            Profil
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="cursor-pointer text-destructive focus:text-destructive"
                    >
                        {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
