import { z } from 'astro/zod';

// ============================================================================
// Common DTOs
// ============================================================================

/** Pagination metadata returned with list responses */
export const PaginationDTOSchema = z.object({
    total: z.number().int().min(0),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
});

export type PaginationDTO = z.infer<typeof PaginationDTOSchema>;

/** Generic paginated response wrapper */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: z.array(dataSchema),
        pagination: PaginationDTOSchema,
    });

/** Single item response wrapper */
export const SingleResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: dataSchema,
    });

/** Error detail for validation errors */
export const ErrorDetailDTOSchema = z.object({
    field: z.string(),
    message: z.string(),
});

export type ErrorDetailDTO = z.infer<typeof ErrorDetailDTOSchema>;

/** Standard error object */
export const ErrorDTOSchema = z.object({
    code: z.enum([
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'VALIDATION_ERROR',
        'CONFLICT',
        'RATE_LIMITED',
        'SERVICE_UNAVAILABLE',
    ]),
    message: z.string(),
    details: z.array(ErrorDetailDTOSchema).optional(),
});

export type ErrorDTO = z.infer<typeof ErrorDTOSchema>;

/** API error response format */
export const ApiErrorResponseSchema = z.object({
    error: ErrorDTOSchema,
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ============================================================================
// Groups DTOs & Commands
// ============================================================================

/**
 * Group list item DTO
 * Used in: GET /api/groups
 * Combines group data with membership info and computed counts
 */
export const GroupListItemDTOSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(100),
    role: z.enum(['admin', 'member']),
    memberCount: z.number().int().min(0),
    createdAt: z.string().datetime(),
    joinedAt: z.string().datetime(),
});

export type GroupListItemDTO = z.infer<typeof GroupListItemDTOSchema>;

/**
 * Command for creating a new group
 * Used in: POST /api/groups
 */
export const CreateGroupCommandSchema = z.object({
    name: z.string().min(3).max(100),
});

export type CreateGroupCommand = z.infer<typeof CreateGroupCommandSchema>;

/**
 * Response after creating a group
 * Used in: POST /api/groups
 */
export const CreateGroupResponseDTOSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(100),
    role: z.enum(['admin', 'member']),
    createdAt: z.string().datetime(),
});

export type CreateGroupResponseDTO = z.infer<typeof CreateGroupResponseDTOSchema>;

/**
 * Command for updating a group
 * Used in: PATCH /api/groups/:groupId
 */
export const UpdateGroupCommandSchema = z.object({
    name: z.string().min(3).max(100).optional(),
});

export type UpdateGroupCommand = z.infer<typeof UpdateGroupCommandSchema>;

/**
 * Response after updating a group
 * Used in: PATCH /api/groups/:groupId
 * */
export const UpdateGroupResponseDTOSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(100),
    updatedAt: z.string().datetime(),
});

export type UpdateGroupResponseDTO = z.infer<typeof UpdateGroupResponseDTOSchema>;

// ============================================================================
// Group Members DTOs
// ============================================================================

/**
 * Group member list item DTO
 * Used in: GET /api/groups/:groupId/members
 * Combines member info with their children's names
 */
export const GroupMemberDTOSchema = z.object({
    userId: z.string().uuid(),
    firstName: z.string(),
    role: z.enum(['admin', 'member']),
    joinedAt: z.string().datetime(),
    childrenNames: z.array(z.string()),
});

export type GroupMemberDTO = z.infer<typeof GroupMemberDTOSchema>;

/**
 * Admin contact information DTO
 * Used in: GET /api/groups/:groupId/members/admin-contact
 * Reveals admin's email for emergency contact
 */
export const AdminContactDTOSchema = z.object({
    userId: z.string().uuid(),
    firstName: z.string(),
    email: z.string().email(),
    childrenNames: z.array(z.string()),
});

export type AdminContactDTO = z.infer<typeof AdminContactDTOSchema>;

// ============================================================================
// Group Invites DTOs & Commands
// ============================================================================

/**
 * Full invite information DTO
 * Used in: POST /api/groups/:groupId/invites (response)
 */
export const GroupInviteDTOSchema = z.object({
    code: z.string().max(50),
    groupId: z.string().uuid(),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime(),
});

export type GroupInviteDTO = z.infer<typeof GroupInviteDTOSchema>;

/**
 * Invite list item DTO (without groupId)
 * Used in: GET /api/groups/:groupId/invites
 */
export const GroupInviteListItemDTOSchema = z.object({
    code: z.string().max(50),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime(),
});

export type GroupInviteListItemDTO = z.infer<typeof GroupInviteListItemDTOSchema>;

/**
 * Command for joining a group via invite code
 * Used in: POST /api/invites/join
 */
export const JoinGroupCommandSchema = z.object({
    code: z.string().max(50),
});

export type JoinGroupCommand = z.infer<typeof JoinGroupCommandSchema>;

/**
 * Response after joining a group
 * Used in: POST /api/invites/join
 */
export const JoinGroupResponseDTOSchema = z.object({
    groupId: z.string().uuid(),
    groupName: z.string().min(3).max(100),
    role: z.enum(['admin', 'member']),
    joinedAt: z.string().datetime(),
});

export type JoinGroupResponseDTO = z.infer<typeof JoinGroupResponseDTOSchema>;

// ============================================================================
// Children DTOs & Commands
// ============================================================================

/**
 * Child list item DTO
 * Used in: GET /api/groups/:groupId/children
 */
export const ChildListItemDTOSchema = z.object({
    id: z.string().uuid(),
    displayName: z.string().min(1).max(50),
    bio: z.string().max(1000).nullable(),
    birthDate: z.string().date().nullable(),
    parentId: z.string().uuid(),
    isOwner: z.boolean(),
    createdAt: z.string().datetime(),
});

export type ChildListItemDTO = z.infer<typeof ChildListItemDTOSchema>;

/**
 * Command for creating a child profile
 * Used in: POST /api/groups/:groupId/children
 */
export const CreateChildCommandSchema = z.object({
    displayName: z.string().min(1).max(50),
    bio: z.string().max(1000).optional(),
    birthDate: z.string().date().optional(),
});

export type CreateChildCommand = z.infer<typeof CreateChildCommandSchema>;

/**
 * Response after creating a child
 * Used in: POST /api/groups/:groupId/children
 */
export const CreateChildResponseDTOSchema = z.object({
    id: z.string().uuid(),
    displayName: z.string().min(1).max(50),
    bio: z.string().max(1000).nullable(),
    birthDate: z.string().date().nullable(),
    groupId: z.string().uuid(),
    parentId: z.string().uuid(),
    createdAt: z.string().datetime(),
});

export type CreateChildResponseDTO = z.infer<typeof CreateChildResponseDTOSchema>;

/**
 * Full child detail DTO
 * Used in: GET /api/children/:childId
 */
export const ChildDetailDTOSchema = z.object({
    id: z.string().uuid(),
    displayName: z.string().min(1).max(50),
    bio: z.string().max(1000).nullable(),
    birthDate: z.string().date().nullable(),
    groupId: z.string().uuid(),
    parentId: z.string().uuid(),
    isOwner: z.boolean(),
    createdAt: z.string().datetime(),
});

export type ChildDetailDTO = z.infer<typeof ChildDetailDTOSchema>;

/**
 * Command for updating a child profile
 * Used in: PATCH /api/children/:childId
 */
export const UpdateChildCommandSchema = z.object({
    displayName: z.string().min(1).max(50).optional(),
    bio: z.string().max(1000).optional(),
    birthDate: z.string().date().nullable().optional(),
});

export type UpdateChildCommand = z.infer<typeof UpdateChildCommandSchema>;

/**
 * Response after updating a child
 * Used in: PATCH /api/children/:childId
 */
export const UpdateChildResponseDTOSchema = z.object({
    id: z.string().uuid(),
    displayName: z.string().min(1).max(50),
    bio: z.string().max(1000).nullable(),
    birthDate: z.string().date().nullable(),
    updatedAt: z.string().datetime(),
});

export type UpdateChildResponseDTO = z.infer<typeof UpdateChildResponseDTOSchema>;

// ============================================================================
// Events DTOs & Commands
// ============================================================================

/**
 * Event list item DTO
 * Used in: GET /api/groups/:groupId/events
 */
export const EventListItemDTOSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    eventDate: z.string().date(),
    description: z.string().nullable(),
    childId: z.string().uuid().nullable(),
    childName: z.string().nullable(),
    organizerId: z.string().uuid(),
    isOrganizer: z.boolean(),
    guestCount: z.number().int().min(0),
    hasNewUpdates: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type EventListItemDTO = z.infer<typeof EventListItemDTOSchema>;

/**
 * Command for creating an event
 * Used in: POST /api/groups/:groupId/events
 */
export const CreateEventCommandSchema = z.object({
    title: z.string().min(1).max(100),
    eventDate: z.string().date(),
    description: z.string().optional(),
    childId: z.string().uuid().or(z.literal('none')).optional(),
    guestChildIds: z.array(z.string().uuid()).optional(),
});

export type CreateEventCommand = z.infer<typeof CreateEventCommandSchema>;

/**
 * Response after creating an event
 * Used in: POST /api/groups/:groupId/events
 */
export const CreateEventResponseDTOSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    eventDate: z.string().date(),
    description: z.string().nullable(),
    childId: z.string().uuid().nullable(),
    organizerId: z.string().uuid(),
    guestCount: z.number().int().min(0),
    createdAt: z.string().datetime(),
});

export type CreateEventResponseDTO = z.infer<typeof CreateEventResponseDTOSchema>;

/**
 * Event guest DTO
 * Used in: GET /api/events/:eventId (nested)
 */
export const EventGuestDTOSchema = z.object({
    childId: z.string().uuid(),
    displayName: z.string().min(1).max(50),
});

export type EventGuestDTO = z.infer<typeof EventGuestDTOSchema>;

/**
 * Full event detail DTO
 * Used in: GET /api/events/:eventId
 */
export const EventDetailDTOSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    eventDate: z.string().date(),
    description: z.string().nullable(),
    childId: z.string().uuid().nullable(),
    childName: z.string().nullable(),
    childBio: z.string().nullable(),
    organizerId: z.string().uuid(),
    isOrganizer: z.boolean(),
    groupId: z.string().uuid(),
    guests: z.array(EventGuestDTOSchema),
    hasNewUpdates: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type EventDetailDTO = z.infer<typeof EventDetailDTOSchema>;

/**
 * Command for updating an event
 * Used in: PATCH /api/events/:eventId
 */
export const UpdateEventCommandSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    eventDate: z.string().date().optional(),
    description: z.string().optional(),
    guestChildIds: z.array(z.string().uuid()).optional(),
});

export type UpdateEventCommand = z.infer<typeof UpdateEventCommandSchema>;

/**
 * Response after updating an event
 * Used in: PATCH /api/events/:eventId
 */
export const UpdateEventResponseDTOSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    eventDate: z.string().date(),
    updatedAt: z.string().datetime(),
});

export type UpdateEventResponseDTO = z.infer<typeof UpdateEventResponseDTOSchema>;

/**
 * Detailed group information
 * Used in: GET /api/groups/:groupId (Group Hub)
 */
export const GroupDetailDTOSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(100),
    role: z.enum(['admin', 'member']),
    memberCount: z.number().int().min(0),
    childrenCount: z.number().int().min(0),
    upcomingEventsCount: z.number().int().min(0),
    createdBy: z.string().uuid(),
    createdAt: z.string().datetime(),
    adminName: z.string().nullable(),
    nextEvent: EventListItemDTOSchema.nullable(),
    myChildren: z.array(ChildListItemDTOSchema),
});

export type GroupDetailDTO = z.infer<typeof GroupDetailDTOSchema>;

// ============================================================================
// Event Comments DTOs & Commands
// ============================================================================

/**
 * Event comment DTO
 * Used in: GET /api/events/:eventId/comments
 * Note: Hidden from event organizers (surprise protection)
 */
export const EventCommentDTOSchema = z.object({
    id: z.string().uuid(),
    content: z.string().min(1).max(2000),
    authorId: z.string().uuid(),
    authorLabel: z.string(),
    isPinned: z.boolean(),
    isAuthor: z.boolean(),
    createdAt: z.string().datetime(),
});

export type EventCommentDTO = z.infer<typeof EventCommentDTOSchema>;

/**
 * Command for creating an event comment
 * Used in: POST /api/events/:eventId/comments
 */
export const CreateEventCommentCommandSchema = z.object({
    content: z.string().min(1).max(2000),
});

export type CreateEventCommentCommand = z.infer<typeof CreateEventCommentCommandSchema>;

/**
 * Command for updating an event comment (e.g. pinning)
 * Used in: PATCH /api/events/:eventId/comments/:commentId
 */
export const UpdateEventCommentCommandSchema = z.object({
    isPinned: z.boolean().optional(),
});

export type UpdateEventCommentCommand = z.infer<typeof UpdateEventCommentCommandSchema>;

// ============================================================================
// Internal Query Result Schemas (for complex joins)
// ============================================================================

/**
 * Internal schema for event comment query result
 * matches the join in EventCommentsService.listComments
 */
export const EventCommentQueryResultSchema = z.object({
    id: z.string().uuid(),
    event_id: z.string().uuid(),
    author_id: z.string().uuid(),
    content: z.string(),
    is_pinned: z.boolean(),
    created_at: z.string(),
    author_profile: z
        .object({
            first_name: z.string(),
            children: z.array(
                z.object({
                    display_name: z.string(),
                })
            ),
        })
        .nullable(),
});

export type EventCommentQueryResult = z.infer<typeof EventCommentQueryResultSchema>;

// ============================================================================
// AI (Magic Wand) DTOs & Commands
// ============================================================================

/**
 * Command for AI-powered bio generation
 * Used in: POST /api/ai/magic-wand
 */
export const MagicWandCommandSchema = z.object({
    notes: z.string().min(1).max(1000),
    childDisplayName: z.string().optional(),
});

export type MagicWandCommand = z.infer<typeof MagicWandCommandSchema>;

/**
 * Response from AI bio generation
 * Used in: POST /api/ai/magic-wand
 */
export const MagicWandResponseDTOSchema = z.object({
    generatedBio: z.string(),
});

export type MagicWandResponseDTO = z.infer<typeof MagicWandResponseDTOSchema>;

// ============================================================================
// Query Parameters Types
// ============================================================================

/** Common pagination query parameters */
export const PaginationParamsSchema = z.object({
    limit: z.preprocess(Number, z.number().pipe(z.number().int().positive().max(100)).default(20)),
    offset: z.preprocess(Number, z.number().pipe(z.number().int().min(0)).default(0)),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/** Query parameters for GET /api/groups/:groupId/events */
export const EventsQueryParamsSchema = PaginationParamsSchema.extend({
    upcoming: z.preprocess(Boolean, z.boolean().optional()),
    sortBy: z.enum(['eventDate', 'createdAt']).default('eventDate'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type EventsQueryParams = z.infer<typeof EventsQueryParamsSchema>;

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Login command schema
 * Used in: Astro Action login
 */
export const LoginCommandSchema = z.object({
    email: z
        .string({
            required_error: 'Email jest wymagany',
            invalid_type_error: 'Email jest wymagany',
        })
        .min(1, 'Email jest wymagany')
        .email('Nieprawidłowy format adresu email'),
    password: z
        .string({
            required_error: 'Hasło jest wymagane',
            invalid_type_error: 'Hasło jest wymagane',
        })
        .min(1, 'Hasło jest wymagane'),
});

export type LoginCommand = z.infer<typeof LoginCommandSchema>;

/**
 * Register command schema
 * Used in: Astro Action register
 */
export const RegisterCommandSchema = z
    .object({
        firstName: z
            .string({
                required_error: 'Imię jest wymagane',
                invalid_type_error: 'Imię jest wymagane',
            })
            .min(1, 'Imię jest wymagane'),
        email: z
            .string({
                required_error: 'Email jest wymagany',
                invalid_type_error: 'Email jest wymagany',
            })
            .min(1, 'Email jest wymagany')
            .email('Nieprawidłowy format adresu email'),
        password: z
            .string({
                required_error: 'Hasło jest wymagane',
                invalid_type_error: 'Hasło jest wymagane',
            })
            .min(8, 'Hasło musi mieć co najmniej 8 znaków'),
        confirmPassword: z
            .string({
                required_error: 'Powtórzenie hasła jest wymagane',
                invalid_type_error: 'Powtórzenie hasła jest wymagane',
            })
            .min(1, 'Powtórzenie hasła jest wymagane'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Hasła muszą być identyczne',
        path: ['confirmPassword'],
    });

export type RegisterCommand = z.infer<typeof RegisterCommandSchema>;

/**
 * Request password reset command schema
 * Used in: Astro Action requestPasswordReset
 */
export const RequestPasswordResetCommandSchema = z.object({
    email: z
        .string({
            required_error: 'Email jest wymagany',
            invalid_type_error: 'Email jest wymagany',
        })
        .min(1, 'Email jest wymagany')
        .email('Nieprawidłowy format adresu email'),
});

export type RequestPasswordResetCommand = z.infer<typeof RequestPasswordResetCommandSchema>;

/**
 * Update password command schema
 * Used in: Astro Action updatePassword
 */
export const UpdatePasswordCommandSchema = z
    .object({
        password: z
            .string({
                required_error: 'Hasło jest wymagane',
                invalid_type_error: 'Hasło jest wymagane',
            })
            .min(8, 'Hasło musi mieć co najmniej 8 znaków'),
        confirmPassword: z
            .string({
                required_error: 'Powtórzenie hasła jest wymagane',
                invalid_type_error: 'Powtórzenie hasła jest wymagane',
            })
            .min(1, 'Powtórzenie hasła jest wymagane'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Hasła muszą być identyczne',
        path: ['confirmPassword'],
    });

export type UpdatePasswordCommand = z.infer<typeof UpdatePasswordCommandSchema>;
