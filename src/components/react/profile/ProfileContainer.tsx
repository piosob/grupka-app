import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProfileHeader } from './ProfileHeader';
import { MyGroupsSection } from './MyGroupsSection';
import { MyChildrenSection } from './MyChildrenSection';
import { LogoutSection } from './LogoutSection';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { QueryProvider } from '../providers/QueryProvider';

interface ProfileContainerProps {
    userEmail: string | undefined;
    firstName?: string;
}

const ProfileContent: React.FC<ProfileContainerProps> = ({ userEmail, firstName }) => {
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    return (
        <div className="space-y-6 pb-20">
            <ProfileHeader email={userEmail || ''} firstName={firstName} />

            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <Button
                        variant="ghost"
                        className="w-full justify-between h-14 px-6 rounded-none border-b"
                        onClick={() => setIsPasswordDialogOpen(true)}
                    >
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-5 w-5 text-muted-foreground" />
                            <span>Zmień hasło</span>
                        </div>
                    </Button>
                </CardContent>
            </Card>

            <MyGroupsSection />
            <MyChildrenSection />
            <LogoutSection />

            <ChangePasswordDialog
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
            />
        </div>
    );
};

export const ProfileContainer: React.FC<ProfileContainerProps> = ({ userEmail, firstName }) => {
    return (
        <QueryProvider>
            <ProfileContent userEmail={userEmail} firstName={firstName} />
        </QueryProvider>
    );
};
