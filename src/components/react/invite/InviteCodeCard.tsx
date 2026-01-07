import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCountdown } from '@/lib/hooks/useCountdown';
import type { GroupInviteListItemDTO } from '@/types';
import { Copy, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InviteCodeCardProps {
    invite: GroupInviteListItemDTO;
    onDeleteInvite: (code: string) => void;
    isDeleting?: boolean;
}

export const InviteCodeCard: React.FC<InviteCodeCardProps> = ({
    invite,
    onDeleteInvite,
    isDeleting = false,
}) => {
    const { countdownText, countdownColor, isExpired } = useCountdown(invite.expiresAt);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(invite.code);
            toast.success('Kod został skopiowany do schowka');

            // Haptic feedback
            if (window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        } catch (err) {
            toast.error('Nie udało się skopiować kodu');
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Zaproszenie do grupy Grupka',
            text: `Hej! Dołącz do naszej grupy w aplikacji Grupka, używając kodu: ${invite.code}`,
            url: window.location.origin + '/invites/join',
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    handleCopy(); // Fallback to copy
                }
            }
        } else {
            handleCopy(); // Fallback to copy
        }
    };

    if (isExpired) return null;

    const colorClasses = {
        green: 'text-green-600 dark:text-green-400',
        yellow: 'text-yellow-600 dark:text-yellow-400',
        red: 'text-red-600 dark:text-red-400',
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-2xl font-mono font-bold tracking-widest text-primary uppercase">
                            {invite.code}
                        </span>
                        <span className={cn('text-xs font-medium', colorClasses[countdownColor])}>
                            {countdownText}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={handleCopy}
                            title="Kopiuj kod"
                        >
                            <Copy className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={handleShare}
                            title="Udostępnij"
                        >
                            <Share2 className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteInvite(invite.code)}
                            disabled={isDeleting}
                            title="Usuń kod"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
