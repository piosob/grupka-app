import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon, Loader2, Save, X } from 'lucide-react';
import {
    CreateEventCommandSchema,
    type CreateEventCommand,
    type ChildListItemDTO,
    type EventDetailDTO,
} from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { GuestSelectionSection } from './GuestSelectionSection';
import { cn } from '@/lib/utils';

interface EventFormProps {
    groupId: string;
    childrenList: ChildListItemDTO[];
    initialData?: EventDetailDTO;
    onSubmit: (data: CreateEventCommand) => void;
    isSubmitting?: boolean;
    onCancel?: () => void;
}

export const EventForm = ({
    childrenList,
    initialData,
    onSubmit,
    isSubmitting = false,
    onCancel,
}: EventFormProps) => {
    const isEdit = !!initialData;

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        watch,
        setValue,
    } = useForm<CreateEventCommand>({
        resolver: zodResolver(CreateEventCommandSchema),
        defaultValues: initialData
            ? {
                  title: initialData.title,
                  eventDate: initialData.eventDate,
                  description: initialData.description || '',
                  childId: initialData.childId || undefined,
                  guestChildIds: initialData.guests.map((g) => g.childId),
              }
            : {
                  title: '',
                  eventDate: new Date().toISOString().split('T')[0],
                  description: '',
                  guestChildIds: [],
              },
    });

    const selectedGuestIds = watch('guestChildIds') || [];

    const handleFormSubmit = (data: CreateEventCommand) => {
        onSubmit(data);
    };

    return (
        <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 delay-100 fill-mode-both">
                    <div className="space-y-2">
                        <Label
                            htmlFor="title"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                            Tytuł wydarzenia
                        </Label>
                        <Input
                            id="title"
                            placeholder="np. 5 urodziny Adasia"
                            {...register('title')}
                            className={cn(
                                'rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20 h-12 text-lg font-medium',
                                errors.title &&
                                    'border-destructive focus-visible:ring-destructive/20'
                            )}
                        />
                        {errors.title && (
                            <p className="text-xs text-destructive font-medium ml-1 animate-in fade-in slide-in-from-left-1">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="eventDate"
                                className="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                            >
                                Data wydarzenia
                            </Label>
                            <div className="relative group">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="eventDate"
                                    type="date"
                                    {...register('eventDate')}
                                    className={cn(
                                        'pl-9 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20 h-12',
                                        errors.eventDate &&
                                            'border-destructive focus-visible:ring-destructive/20'
                                    )}
                                />
                            </div>
                            {errors.eventDate && (
                                <p className="text-xs text-destructive font-medium ml-1 animate-in fade-in slide-in-from-left-1">
                                    {errors.eventDate.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="childId"
                                className="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                            >
                                Solenizant (opcjonalnie)
                            </Label>
                            <Controller
                                name="childId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <SelectTrigger className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20 h-12">
                                            <SelectValue placeholder="Wybierz dziecko" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="none">
                                                Brak (wydarzenie ogólne)
                                            </SelectItem>
                                            {childrenList
                                                .filter((c) => c.isOwner)
                                                .map((child) => (
                                                    <SelectItem key={child.id} value={child.id}>
                                                        {child.displayName}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="description"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                            Opis i szczegóły
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Gdzie, o której, co przynieść..."
                            {...register('description')}
                            className="min-h-[120px] rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20 bg-muted/5 transition-colors focus:bg-background"
                        />
                    </div>
                </div>

                {/* Guest Selection */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                    <GuestSelectionSection
                        children={childrenList}
                        selectedIds={selectedGuestIds}
                        onChange={(ids) => setValue('guestChildIds', ids)}
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-muted/50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
                <Button
                    type="submit"
                    className="flex-1 rounded-full h-12 shadow-lg shadow-primary/10"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Zapisywanie...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            {isEdit ? 'Zapisz zmiany' : 'Utwórz wydarzenie'}
                        </>
                    )}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-full h-12"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Anuluj
                    </Button>
                )}
            </div>
        </form>
    );
};
