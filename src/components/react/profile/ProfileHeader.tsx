import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ProfileHeaderProps {
    email: string;
    firstName?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ email, firstName }) => {
    const initials = firstName ? firstName.substring(0, 2).toUpperCase() : '';

    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-6">
                <Avatar className="h-16 w-16 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary">
                        {initials || <User className="h-8 w-8" />}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {firstName ? `Cześć, ${firstName}!` : 'Zalogowany jako'}
                    </span>
                    <span className="text-xl font-semibold truncate max-w-[200px] sm:max-w-md">
                        {email}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};
