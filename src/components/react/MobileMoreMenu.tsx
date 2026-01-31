import { useState } from 'react';
import { actions } from 'astro:actions';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useGroupDetail } from '@/lib/hooks/useGroupDetail';
import {
    UserPlus,
    Settings,
    User,
    LogOut,
} from 'lucide-react';

import { QueryProvider } from './providers/QueryProvider';

interface MobileMoreMenuProps {
    groupId: string;
}

export function MobileMoreMenu({ groupId }: MobileMoreMenuProps) {
    return (
        <QueryProvider>
            <MobileMoreMenuContent groupId={groupId} />
        </QueryProvider>
    );
}

function MobileMoreMenuContent({ groupId }: MobileMoreMenuProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { data: group } = useGroupDetail(groupId);
    const isAdmin = group?.role === 'admin';

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

            window.location.href = '/';
        } catch (err) {
            console.error('Logout exception:', err);
            setIsLoggingOut(false);
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center text-xs h-full w-full">
                    <span className="text-lg leading-none mb-1">⋯</span>
                    <span>Więcej</span>
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[20px] px-4 pb-10 border-t">
                <SheetHeader className="mb-6 pt-2">
                    <SheetTitle className="text-left text-xl font-bold">Opcje grupy</SheetTitle>
                </SheetHeader>
                <div className="grid gap-3">
                    {isAdmin && (
                        <>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-lg rounded-2xl border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                                onClick={() => window.location.href = `/groups/${groupId}/invite`}
                            >
                                <UserPlus className="mr-3 h-5 w-5 text-primary" />
                                Generuj kod zaproszenia
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-lg rounded-2xl border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                                onClick={() => window.location.href = `/groups/${groupId}/settings`}
                            >
                                <Settings className="mr-3 h-5 w-5 text-primary" />
                                Ustawienia grupy
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        className="w-full justify-start h-14 text-lg rounded-2xl hover:bg-muted"
                        onClick={() => window.location.href = "/profile"}
                    >
                        <User className="mr-3 h-5 w-5" />
                        Twój profil
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start h-14 text-lg rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
