import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'astro/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Info } from 'lucide-react';
import { useAi } from '@/lib/hooks/useAi';
import { cn } from '@/lib/utils';

const childFormSchema = z.object({
    displayName: z
        .string()
        .min(1, 'Imię jest wymagane')
        .max(50, 'Imię może mieć maksymalnie 50 znaków')
        .refine((val) => !val.trim().includes(' '), {
            message: 'Proszę podać tylko imię (bez nazwiska)',
        }),
    birthDate: z
        .string()
        .optional()
        .refine((val) => !val || new Date(val) <= new Date(), {
            message: 'Data urodzenia nie może być z przyszłości',
        }),
    bio: z.string().max(1000, 'Opis może mieć maksymalnie 1000 znaków').optional(),
});

type ChildFormValues = z.infer<typeof childFormSchema>;

interface ChildFormProps {
    initialValues?: Partial<ChildFormValues>;
    onSubmit: (values: ChildFormValues) => void;
    isLoading?: boolean;
    title: string;
    submitLabel: string;
}

export const ChildForm: React.FC<ChildFormProps> = ({
    initialValues,
    onSubmit,
    isLoading = false,
    title,
    submitLabel,
}) => {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ChildFormValues>({
        resolver: zodResolver(childFormSchema),
        defaultValues: {
            displayName: initialValues?.displayName || '',
            birthDate: initialValues?.birthDate || '',
            bio: initialValues?.bio || '',
        },
    });

    const { generateBio, isGeneratingBio } = useAi();
    const bioValue = watch('bio');
    const displayNameValue = watch('displayName');

    const handleMagicWand = async () => {
        if (!bioValue || bioValue.trim().length < 3) return;

        try {
            const result = await generateBio({
                notes: bioValue,
                childDisplayName: displayNameValue,
            });
            if (result.generatedBio) {
                setValue('bio', result.generatedBio, { shouldDirty: true });
            }
        } catch (error) {
            // Error is handled by the hook (toast)
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Imię dziecka</Label>
                        <Input
                            id="displayName"
                            placeholder="np. Krzysio"
                            {...register('displayName')}
                            className={cn(errors.displayName && 'border-destructive')}
                        />
                        {errors.displayName ? (
                            <p className="text-sm text-destructive">{errors.displayName.message}</p>
                        ) : (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Tylko imię, bez nazwiska dla zachowania prywatności.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="birthDate">Data urodzenia (opcjonalnie)</Label>
                        <Input
                            id="birthDate"
                            type="date"
                            {...register('birthDate')}
                            className={cn(errors.birthDate && 'border-destructive')}
                        />
                        {errors.birthDate && (
                            <p className="text-sm text-destructive">{errors.birthDate.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="bio">O dziecku (zainteresowania, prezenty)</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleMagicWand}
                                disabled={isGeneratingBio || !bioValue || bioValue.length < 3}
                                className="h-8 gap-1.5 text-xs font-medium border-primary/20 hover:bg-primary/5"
                            >
                                {isGeneratingBio ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Wand2 className="h-3.5 w-3.5" />
                                )}
                                Magic Wand
                            </Button>
                        </div>
                        <Textarea
                            id="bio"
                            placeholder="Wpisz kilka słów o dziecku (np. co lubi, czym się interesuje) i użyj Magic Wand, aby stworzyć piękny opis!"
                            rows={6}
                            {...register('bio')}
                            className={cn('resize-none', errors.bio && 'border-destructive')}
                        />
                        <div className="flex justify-between items-center">
                            {errors.bio ? (
                                <p className="text-sm text-destructive">{errors.bio.message}</p>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">
                                    Ten opis będzie widoczny dla innych rodziców w grupie.
                                </p>
                            )}
                            <span
                                className={cn(
                                    'text-[10px]',
                                    (bioValue?.length || 0) > 900
                                        ? 'text-orange-500'
                                        : 'text-muted-foreground'
                                )}
                            >
                                {bioValue?.length || 0}/1000
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => window.history.back()}
                        disabled={isLoading}
                    >
                        Anuluj
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
