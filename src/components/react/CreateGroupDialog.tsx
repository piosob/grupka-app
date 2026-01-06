import React, { useState } from 'react';
import { Plus, Info } from 'lucide-react';
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

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (name.trim().length < 3) {
            setError('Nazwa grupy musi mieć co najmniej 3 znaki');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Błąd podczas tworzenia grupy');
            }

            toast.success('Grupa została utworzona pomyślnie!');
            setName('');
            onOpenChange(false);
            onSuccess();
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
                        <DialogTitle className="text-2xl font-bold">Utwórz nową grupę</DialogTitle>
                        <DialogDescription>
                            Nazwij swoją grupę (np. Klasa 2A, Przedszkole Słoneczko)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-base">
                                Nazwa grupy
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={handleNameChange}
                                placeholder="np. Zerówka pod dębem"
                                className="h-12 text-lg rounded-xl"
                                disabled={isLoading}
                                autoFocus
                            />
                            {error && (
                                <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 p-4 rounded-2xl bg-muted/50 text-sm text-muted-foreground leading-relaxed">
                            <div className="mt-0.5">
                                <Info className="w-4 h-4 text-primary" />
                            </div>
                            <p>
                                Twój adres email będzie widoczny dla członków grupy jako kanał
                                awaryjny (domyślnie ukryty, widoczny po kliknięciu).
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-full text-base font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Tworzenie...' : 'Utwórz grupę'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
