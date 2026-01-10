import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
    EventListItemDTO,
    CreateEventCommand,
    CreateEventResponseDTO,
    EventDetailDTO,
    UpdateEventCommand,
    UpdateEventResponseDTO,
    EventsQueryParams,
    EventGuestDTO,
} from '../schemas';
import type { PaginatedResponse, EventEntity } from '../../types';

export type TypedSupabaseClient = SupabaseClient<Database>;

// ============================================================================
// Custom Error Types
// ============================================================================

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

// ============================================================================
// Internal helper types for database query results
// ============================================================================

/**
 * Service for managing event operations.
 * Handles CRUD operations for events and related guests.
 */
export class EventsService {
    constructor(private supabase: TypedSupabaseClient) {}

    /**
     * Checks if a user is a member of a group.
     */
    private async isUserGroupMember(groupId: string, userId: string): Promise<boolean> {
        const { count, error } = await this.supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) return false;
        return count !== null && count > 0;
    }

    /**
     * Checks if a user is the organizer of an event.
     */
    private async isUserEventOrganizer(eventId: string, userId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('events')
            .select('organizer_id')
            .eq('id', eventId)
            .single();

        if (error || !data) return false;
        return data.organizer_id === userId;
    }

    /**
     * Validates that all provided child IDs belong to the specified group.
     */
    private async validateGuestChildren(groupId: string, guestChildIds: string[]): Promise<void> {
        if (guestChildIds.length === 0) return;

        const { data, error } = await this.supabase
            .from('children')
            .select('id')
            .in('id', guestChildIds)
            .eq('group_id', groupId);

        if (error) {
            throw new Error(`Failed to validate guest children: ${error.message}`);
        }

        if (data.length !== guestChildIds.length) {
            throw new ValidationError('One or more children are not in this group');
        }
    }

    /**
     * Calculates if an event has new updates (within last 8 hours).
     */
    private calculateHasNewUpdates(updatedAt: string): boolean {
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
        return new Date(updatedAt) >= eightHoursAgo;
    }

    /**
     * Retrieves a paginated list of events for a group.
     */
    async listEvents(
        groupId: string,
        userId: string,
        params: EventsQueryParams
    ): Promise<PaginatedResponse<EventListItemDTO>> {
        // 1. Verify membership
        const isMember = await this.isUserGroupMember(groupId, userId);
        if (!isMember) {
            throw new ForbiddenError('Not a member of this group');
        }

        // 2. Build query
        let query = this.supabase
            .from('events')
            .select(
                `
                *,
                child:children(display_name),
                guests:event_guests(count)
            `,
                { count: 'exact' }
            )
            .eq('group_id', groupId);

        if (params.upcoming) {
            const today = new Date().toISOString().split('T')[0];
            query = query.gte('event_date', today);
        }

        query = query
            .order(params.sortBy === 'eventDate' ? 'event_date' : 'created_at', {
                ascending: params.sortOrder === 'asc',
            })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        // 3. Map to DTOs
        const mappedData: EventListItemDTO[] = (data || []).map((event: any) => ({
            id: event.id,
            title: event.title,
            eventDate: event.event_date,
            description: event.description,
            childId: event.child_id,
            childName: event.child?.display_name ?? null,
            organizerId: event.organizer_id,
            isOrganizer: event.organizer_id === userId,
            guestCount: event.guests?.[0]?.count ?? 0,
            hasNewUpdates: this.calculateHasNewUpdates(event.updated_at),
            createdAt: event.created_at,
            updatedAt: event.updated_at,
        }));

        return {
            data: mappedData,
            pagination: {
                total: count ?? 0,
                limit: params.limit,
                offset: params.offset,
            },
        };
    }

    /**
     * Creates a new event.
     */
    async createEvent(
        groupId: string,
        userId: string,
        command: CreateEventCommand
    ): Promise<CreateEventResponseDTO> {
        // 1. Verify membership
        const isMember = await this.isUserGroupMember(groupId, userId);
        if (!isMember) {
            throw new ForbiddenError('Not a member of this group');
        }

        // 2. Validate childId if provided
        if (command.childId) {
            const { count, error } = await this.supabase
                .from('children')
                .select('*', { count: 'exact', head: true })
                .eq('id', command.childId)
                .eq('group_id', groupId);

            if (error || count === 0) {
                throw new ValidationError('Child not in this group OR Child does not exist');
            }
        }

        // 3. Validate guestChildIds if provided
        if (command.guestChildIds && command.guestChildIds.length > 0) {
            await this.validateGuestChildren(groupId, command.guestChildIds);
        }

        // 4. Create event
        const { data: event, error: eventError } = await this.supabase
            .from('events')
            .insert({
                group_id: groupId,
                organizer_id: userId,
                title: command.title,
                event_date: command.eventDate,
                description: command.description ?? null,
                child_id: command.childId ?? null,
            })
            .select()
            .single();

        if (eventError || !event) {
            throw new Error(`Failed to create event: ${eventError?.message}`);
        }

        // 5. Add guests if provided
        if (command.guestChildIds && command.guestChildIds.length > 0) {
            const guestsToInsert = command.guestChildIds.map((childId) => ({
                event_id: event.id,
                child_id: childId,
            }));

            const { error: guestError } = await this.supabase
                .from('event_guests')
                .insert(guestsToInsert);

            if (guestError) {
                // We should probably delete the event if guest insertion fails,
                // but Supabase doesn't support multi-table transactions easily in the client.
                // For now, we'll just throw the error.
                console.error('Failed to add event guests:', guestError);
            }
        }

        return {
            id: event.id,
            title: event.title,
            eventDate: event.event_date,
            description: event.description,
            childId: event.child_id,
            organizerId: event.organizer_id,
            guestCount: command.guestChildIds?.length ?? 0,
            createdAt: event.created_at,
        };
    }

    /**
     * Retrieves detailed information about a specific event.
     */
    async getEventDetail(eventId: string, userId: string): Promise<EventDetailDTO> {
        // RLS will handle basic access, but we need to check group membership for details
        const { data, error } = await this.supabase
            .from('events')
            .select(
                `
                *,
                child:children(display_name, bio),
                event_guests(
                    child_id,
                    children(display_name)
                )
            `
            )
            .eq('id', eventId)
            .single();

        if (error || !data) {
            throw new NotFoundError('Event does not exist');
        }

        const event = data as any;

        // Verify membership (RLS should have caught this, but extra check)
        const isMember = await this.isUserGroupMember(event.group_id, userId);
        if (!isMember) {
            throw new ForbiddenError('Not a member of this group');
        }

        const guests: EventGuestDTO[] = (event.event_guests || []).map((eg: any) => ({
            childId: eg.child_id,
            displayName: eg.children?.display_name || 'Nieznane dziecko',
        }));

        return {
            id: event.id,
            title: event.title,
            eventDate: event.event_date,
            description: event.description,
            childId: event.child_id,
            childName: event.child?.display_name ?? null,
            childBio: event.child?.bio ?? null,
            organizerId: event.organizer_id,
            isOrganizer: event.organizer_id === userId,
            groupId: event.group_id,
            guests,
            hasNewUpdates: this.calculateHasNewUpdates(event.updated_at),
            createdAt: event.created_at,
            updatedAt: event.updated_at,
        };
    }

    /**
     * Updates an existing event.
     */
    async updateEvent(
        eventId: string,
        userId: string,
        command: UpdateEventCommand
    ): Promise<UpdateEventResponseDTO> {
        // 1. Fetch event and check ownership
        const { data: event, error: fetchError } = await this.supabase
            .from('events')
            .select('group_id, organizer_id')
            .eq('id', eventId)
            .single();

        if (fetchError || !event) {
            throw new NotFoundError('Event does not exist');
        }

        if (event.organizer_id !== userId) {
            throw new ForbiddenError('Not the organizer of this event');
        }

        // 2. Validate guests if provided
        if (command.guestChildIds && command.guestChildIds.length > 0) {
            await this.validateGuestChildren(event.group_id, command.guestChildIds);
        }

        // 3. Update event fields
        const updateData: Database['public']['Tables']['events']['Update'] = {
            updated_at: new Date().toISOString(),
        };
        if (command.title !== undefined) updateData.title = command.title;
        if (command.eventDate !== undefined) updateData.event_date = command.eventDate;
        if (command.description !== undefined) updateData.description = command.description;

        const { data: updatedEvent, error: updateError } = await this.supabase
            .from('events')
            .update(updateData)
            .eq('id', eventId)
            .select()
            .single();

        if (updateError || !updatedEvent) {
            throw new Error(`Failed to update event: ${updateError?.message}`);
        }

        // 4. Update guests if provided
        if (command.guestChildIds !== undefined) {
            // Replace all guests: delete then insert
            const { error: deleteError } = await this.supabase
                .from('event_guests')
                .delete()
                .eq('event_id', eventId);

            if (deleteError) {
                throw new Error(`Failed to update guests (delete): ${deleteError.message}`);
            }

            if (command.guestChildIds.length > 0) {
                const guestsToInsert = command.guestChildIds.map((childId) => ({
                    event_id: eventId,
                    child_id: childId,
                }));

                const { error: insertError } = await this.supabase
                    .from('event_guests')
                    .insert(guestsToInsert);

                if (insertError) {
                    throw new Error(`Failed to update guests (insert): ${insertError.message}`);
                }
            }
        }

        return {
            id: updatedEvent.id,
            title: updatedEvent.title,
            eventDate: updatedEvent.event_date,
            updatedAt: updatedEvent.updated_at,
        };
    }

    /**
     * Deletes an event.
     */
    async deleteEvent(eventId: string, userId: string): Promise<void> {
        // 1. Fetch event and check ownership
        const { data: event, error: fetchError } = await this.supabase
            .from('events')
            .select('organizer_id')
            .eq('id', eventId)
            .single();

        if (fetchError || !event) {
            throw new NotFoundError('Event does not exist');
        }

        if (event.organizer_id !== userId) {
            throw new ForbiddenError('Not the organizer of this event');
        }

        // 2. Delete event (cascade will handle event_guests and event_comments)
        const { error: deleteError } = await this.supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (deleteError) {
            throw new Error(`Failed to delete event: ${deleteError.message}`);
        }
    }
}

/**
 * Factory function to create an EventsService instance.
 */
export const createEventsService = (supabase: TypedSupabaseClient) => {
    return new EventsService(supabase);
};
