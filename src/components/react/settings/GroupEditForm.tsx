import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UpdateGroupCommandSchema, type UpdateGroupCommand, type GroupDetailDTO, type UpdateGroupResponseDTO } from '@/lib/schemas';
import { queryKeys } from '@/lib/query-keys';
import { cn, getInputClasses } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface GroupEditFormProps {
    group: GroupDetailDTO;
}

export const GroupEditForm: React.FC<GroupEditFormProps> = ({ group }) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting },
        reset,
    } = useForm<UpdateGroupCommand>({
        resolver: zodResolver(UpdateGroupCommandSchema),
        defaultValues: {
            name: group.name,
        },
    });

    // Keep form in sync with external data updates
    useEffect(() => {
        reset({ name: group.name });
    }, [group.name, reset]);

    const updateGroupMutation = useMutation({
        mutationFn: async (command: UpdateGroupCommand) => {
            const response = await fetch(`/api/groups/${group.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(command),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Nie udało się zaktualizować grupy');
            }

            return response.json();
        },
        onSuccess: (response: { data: UpdateGroupResponseDTO }) => {
            toast.success('Nazwa grupy została zaktualizowana');
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(group.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
            reset({ name: response.data.name }); 
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const onSubmit = (data: UpdateGroupCommand) => {
        updateGroupMutation.mutate(data);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Podstawowe informacje</CardTitle>
                <CardDescription>Zmień nazwę swojej grupy.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nazwa grupy</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            className={cn(getInputClasses(errors.name))}
                            placeholder="Wpisz nazwę grupy..."
                        />
                        {errors.name && (
                            <p className="text-sm font-medium text-destructive">
                                {errors.name.message}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-4">
                    <Button 
                        type="submit" 
                        disabled={!isDirty || isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
