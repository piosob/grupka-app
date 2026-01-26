import React from 'react';
import { Users, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SettingsShortcutsProps {
    groupId: string;
}

export const SettingsShortcuts: React.FC<SettingsShortcutsProps> = ({ groupId }) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <a href={`/groups/${groupId}/members`}>
                <Card className="transition-colors hover:bg-muted/50 active:scale-95">
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Członkowie</span>
                    </CardContent>
                </Card>
            </a>
            <a href={`/groups/${groupId}/invite`}>
                <Card className="transition-colors hover:bg-muted/50 active:scale-95">
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Mail className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Zaproszenia</span>
                    </CardContent>
                </Card>
            </a>
        </div>
    );
};
