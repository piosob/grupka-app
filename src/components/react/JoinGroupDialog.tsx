import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { cn, getInputClasses } from '../../lib/utils';

interface JoinGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (groupId: string) => void;
}

export function JoinGroupDialog({ open, onOpenChange, onSuccess }: JoinGroupDialogProps) {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setCode(val);
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
            setError('Kod zaproszenia jest wymagany');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/invites/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: cleanCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Specific handling for common join errors
                const message =
                    data.error?.code === 'NOT_FOUND'
                        ? 'Nieprawidłowy kod zaproszenia'
                        : data.error?.message || 'Wystąpił błąd podczas dołączania';
                throw new Error(message);
            }

            toast.success(`Dołączono do grupy: ${data.data.groupName}`);
            setCode('');
            onOpenChange(false);
            onSuccess(data.data.groupId);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Dołącz do grupy</DialogTitle>
                        <DialogDescription>
                            Wprowadź kod otrzymany od administratora grupy.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="code" className="text-base">
                                Kod zaproszenia
                            </Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={handleInputChange}
                                placeholder="NP. AB12CD34"
                                className={cn(
                                    getInputClasses(error),
                                    "h-14 text-2xl font-mono text-center tracking-[0.5em] uppercase"
                                )}
                                maxLength={20}
                                disabled={isLoading}
                                autoFocus
                            />
                            {error && (
                                <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-full text-base font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Dołączanie...' : 'Dołącz do grupy'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
