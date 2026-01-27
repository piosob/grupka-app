import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'astro/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Info, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const months = [
    { value: '01', label: 'Styczeń' },
    { value: '02', label: 'Luty' },
    { value: '03', label: 'Marzec' },
    { value: '04', label: 'Kwiecień' },
    { value: '05', label: 'Maj' },
    { value: '06', label: 'Czerwiec' },
    { value: '07', label: 'Lipiec' },
    { value: '08', label: 'Sierpień' },
    { value: '09', label: 'Wrzesień' },
    { value: '10', label: 'Październik' },
    { value: '11', label: 'Listopad' },
    { value: '12', label: 'Grudzień' },
];

const days = Array.from({ length: 31 }, (_, i) => {
    const d = (i + 1).toString().padStart(2, '0');
    return { value: d, label: (i + 1).toString() };
});

const createChildFormSchema = (existingNames: string[], initialDisplayName?: string) =>
    z
        .object({
            displayName: z
                .string()
                .min(1, 'Imię jest wymagane')
                .max(50, 'Imię może mieć maksymalnie 50 znaków')
                .refine((val) => !val.trim().includes(' '), {
                    message: 'Proszę podać tylko imię (bez nazwiska) - nie trzymamy danych o nazwiskach - keep your data safe!',
                })
                .refine(
                    (val) => {
                        const name = val.trim().toLowerCase();
                        // If it's the initial name, it's fine (for edits)
                        if (
                            initialDisplayName &&
                            name === initialDisplayName.trim().toLowerCase()
                        ) {
                            return true;
                        }
                        return !existingNames.some((n) => n.toLowerCase() === name);
                    },
                    (val) => ({
                        message: `${val} już istnieje w grupie. Proszę podaj pierwszą literę nazwiska (np. ${val}N) lub inny wyróżnik.`,
                    })
                ),
            birthDay: z.string().min(1, 'Data urodzenia jest wymagana'),
            birthMonth: z.string().min(1, 'Data urodzenia jest wymagana'),
            birthYear: z
                .string()
                .optional()
                .refine(
                    (val) => {
                        if (!val) return true;
                        const year = parseInt(val);
                        const currentYear = new Date().getFullYear();
                        return year >= 1900 && year <= currentYear;
                    },
                    { message: 'Nieprawidłowy rok' }
                ),
            bio: z.string().max(1000, 'Opis może mieć maksymalnie 1000 znaków').optional(),
        })
        .refine(
            (data) => {
                // Walidacja czy data nie jest z przyszłości (jeśli podano rok)
                if (data.birthDay && data.birthMonth && data.birthYear) {
                    const date = new Date(
                        parseInt(data.birthYear),
                        parseInt(data.birthMonth) - 1,
                        parseInt(data.birthDay)
                    );
                    return date <= new Date();
                }
                return true;
            },
            {
                message: 'Data urodzenia nie może być z przyszłości',
                path: ['birthYear'],
            }
        );

type ChildFormValues = z.infer<ReturnType<typeof createChildFormSchema>>;

interface ChildFormProps {
    initialValues?: {
        displayName: string;
        birthDate: string | null;
        bio: string;
    };
    existingNames?: string[];
    onSubmit: (values: any) => void;
    isLoading?: boolean;
    title: string;
    submitLabel: string;
}

export const ChildForm: React.FC<ChildFormProps> = ({
    initialValues,
    existingNames = [],
    onSubmit,
    isLoading = false,
    title,
    submitLabel,
}) => {
    // Parse initial date string (YYYY-MM-DD)
    const parseInitialDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return { day: '', month: '', year: '' };
        const [y, m, d] = dateStr.split('-');
        return {
            day: d,
            month: m,
            year: y === '1000' ? '' : y,
        };
    };

    const initialDate = parseInitialDate(initialValues?.birthDate);

    const formSchema = React.useMemo(
        () => createChildFormSchema(existingNames, initialValues?.displayName),
        [existingNames, initialValues?.displayName]
    );

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ChildFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            displayName: initialValues?.displayName || '',
            birthDay: initialDate.day,
            birthMonth: initialDate.month,
            birthYear: initialDate.year,
            bio: initialValues?.bio || '',
        },
    });

    const bioValue = watch('bio');
    const displayNameValue = watch('displayName');
    const birthMonthValue = watch('birthMonth');
    const birthDayValue = watch('birthDay');

    const handleInternalSubmit = (data: ChildFormValues) => {
        let birthDate = null;
        if (data.birthDay && data.birthMonth) {
            const year = data.birthYear || '1000';
            birthDate = `${year}-${data.birthMonth}-${data.birthDay}`;
        }

        onSubmit({
            displayName: data.displayName,
            bio: data.bio,
            birthDate,
        });
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit(handleInternalSubmit)}>
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

                    <div className="space-y-3">
                        <Label>Data urodzenia</Label>
                        <div className="grid grid-cols-[0.8fr_1.4fr_1fr] gap-2">
                            <div className="space-y-1">
                                <Select
                                    value={birthDayValue}
                                    onValueChange={(val) => setValue('birthDay', val)}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            'px-2 sm:px-3',
                                            errors.birthDay && 'border-destructive'
                                        )}
                                    >
                                        <SelectValue placeholder="Dzień" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {days.map((d) => (
                                            <SelectItem key={d.value} value={d.value}>
                                                {d.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Select
                                    value={birthMonthValue}
                                    onValueChange={(val) => setValue('birthMonth', val)}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            'px-2 sm:px-3',
                                            errors.birthMonth && 'border-destructive'
                                        )}
                                    >
                                        <SelectValue placeholder="Miesiąc" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Input
                                    placeholder="Rok"
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    {...register('birthYear')}
                                    className={cn(
                                        'px-2 sm:px-3',
                                        errors.birthYear && 'border-destructive'
                                    )}
                                />
                            </div>
                        </div>
                        {errors.birthDay || errors.birthMonth ? (
                            <p className="text-sm text-destructive">
                                {errors.birthDay?.message || errors.birthMonth?.message}
                            </p>
                        ) : errors.birthYear ? (
                            <p className="text-sm text-destructive">{errors.birthYear.message}</p>
                        ) : (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0" />
                                Podaj dzień i miesiąc, oraz opcjonalnie rok.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="bio" className="truncate">
                                O dziecku (zainteresowania, prezenty)
                            </Label>
                        </div>
                        <Textarea
                            id="bio"
                            placeholder="Wpisz kilka słów o dziecku (np. co lubi, czym się interesuje)"
                            rows={6}
                            {...register('bio')}
                            className={cn(
                                'resize-none min-h-[120px]',
                                errors.bio && 'border-destructive'
                            )}
                        />
                        <div className="flex justify-between items-start gap-4">
                            {errors.bio ? (
                                <p className="text-sm text-destructive">{errors.bio.message}</p>
                            ) : (
                                <p className="text-[11px] text-muted-foreground leading-tight">
                                    Ten opis będzie widoczny dla innych rodziców w grupie.
                                </p>
                            )}
                            <span
                                className={cn(
                                    'text-[10px] tabular-nums shrink-0 mt-0.5',
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
                <CardFooter className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => window.history.back()}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        Anuluj
                    </Button>
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
