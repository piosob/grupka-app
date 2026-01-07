import type { Tables, Enums } from './db/database.types';
import type { GroupInviteListItemDTO } from './lib/schemas';

// ============================================================================
// Base Entity Types (derived from database)
// ============================================================================

/** Database row types for reference */
export type GroupEntity = Tables<'groups'>;
export type GroupMemberEntity = Tables<'group_members'>;
export type GroupInviteEntity = Tables<'group_invites'>;
export type ChildEntity = Tables<'children'>;
export type EventEntity = Tables<'events'>;
export type EventGuestEntity = Tables<'event_guests'>;
export type EventCommentEntity = Tables<'event_comments'>;
export type ProfileEntity = Tables<'profiles'>;
export type AiUsageLogEntity = Tables<'ai_usage_logs'>;

/** Group role enum from database */
export type GroupRole = Enums<'group_role'>;

// ============================================================================
// Zod-validated DTOs & Commands
// ============================================================================

// All DTOs and Commands are now defined in src/lib/schemas.ts with Zod validation
// Import them from there for type-safe validation and inference
export type {
    // Common DTOs
    PaginationDTO,
    ErrorDetailDTO,
    ErrorDTO,
    ApiErrorResponse,
    // Groups DTOs & Commands
    GroupListItemDTO,
    CreateGroupCommand,
    CreateGroupResponseDTO,
    GroupDetailDTO,
    UpdateGroupCommand,
    UpdateGroupResponseDTO,
    // Group Members DTOs
    GroupMemberDTO,
    AdminContactDTO,
    // Group Invites DTOs & Commands
    GroupInviteDTO,
    GroupInviteListItemDTO,
    JoinGroupCommand,
    JoinGroupResponseDTO,
    // Children DTOs & Commands
    ChildListItemDTO,
    CreateChildCommand,
    CreateChildResponseDTO,
    ChildDetailDTO,
    UpdateChildCommand,
    UpdateChildResponseDTO,
    // Events DTOs & Commands
    EventListItemDTO,
    CreateEventCommand,
    CreateEventResponseDTO,
    EventGuestDTO,
    EventDetailDTO,
    UpdateEventCommand,
    UpdateEventResponseDTO,
    // Event Comments DTOs & Commands
    EventCommentDTO,
    CreateEventCommentCommand,
    // AI DTOs & Commands
    MagicWandCommand,
    MagicWandResponseDTO,
    // Query Parameters
    PaginationParams,
    EventsQueryParams,
} from './lib/schemas';

// ============================================================================
// View Models
// ============================================================================

/**
 * View model for displaying invite codes with dynamic countdown
 */
export interface GroupInviteViewModel extends GroupInviteListItemDTO {
    remainingSeconds: number;
    isExpired: boolean;
    countdownText: string;
    countdownColor: 'green' | 'yellow' | 'red';
}

// ============================================================================
// Generic Response Wrappers (Type-level only)
// ============================================================================

/** Generic paginated response wrapper */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}

/** Single item response wrapper */
export interface SingleResponse<T> {
    data: T;
}

/** Minimal shape for server action responses rendered by Astro pages */
export interface ServerActionResult<T = unknown> {
    data?: T;
    error?: {
        message?: string;
    };
}
