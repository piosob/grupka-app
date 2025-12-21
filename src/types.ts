import type { Tables, Enums } from "./db/database.types";

// ============================================================================
// Base Entity Types (derived from database)
// ============================================================================

/** Database row types for reference */
export type GroupEntity = Tables<"groups">;
export type GroupMemberEntity = Tables<"group_members">;
export type GroupInviteEntity = Tables<"group_invites">;
export type ChildEntity = Tables<"children">;
export type EventEntity = Tables<"events">;
export type EventGuestEntity = Tables<"event_guests">;
export type EventCommentEntity = Tables<"event_comments">;
export type ProfileEntity = Tables<"profiles">;
export type AiUsageLogEntity = Tables<"ai_usage_logs">;

/** Group role enum from database */
export type GroupRole = Enums<"group_role">;

// ============================================================================
// Common DTOs
// ============================================================================

/** Pagination metadata returned with list responses */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/** Generic paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationDTO;
}

/** Single item response wrapper */
export interface SingleResponse<T> {
  data: T;
}

/** Error detail for validation errors */
export interface ErrorDetailDTO {
  field: string;
  message: string;
}

/** Standard error object */
export interface ErrorDTO {
  code:
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "CONFLICT"
    | "RATE_LIMITED"
    | "SERVICE_UNAVAILABLE";
  message: string;
  details?: ErrorDetailDTO[];
}

/** API error response format */
export interface ApiErrorResponse {
  error: ErrorDTO;
}

// ============================================================================
// Groups DTOs & Commands
// ============================================================================

/**
 * Group list item DTO
 * Used in: GET /api/groups
 * Combines group data with membership info and computed counts
 */
export interface GroupListItemDTO {
  id: GroupEntity["id"];
  name: GroupEntity["name"];
  role: GroupRole;
  memberCount: number;
  createdAt: GroupEntity["created_at"];
  joinedAt: GroupMemberEntity["joined_at"];
}

/**
 * Command for creating a new group
 * Used in: POST /api/groups
 */
export interface CreateGroupCommand {
  /** Group name, 3-100 characters */
  name: string;
}

/**
 * Response after creating a group
 * Used in: POST /api/groups
 */
export interface CreateGroupResponseDTO {
  id: GroupEntity["id"];
  name: GroupEntity["name"];
  role: GroupRole;
  createdAt: GroupEntity["created_at"];
}

/**
 * Detailed group information
 * Used in: GET /api/groups/:groupId
 */
export interface GroupDetailDTO {
  id: GroupEntity["id"];
  name: GroupEntity["name"];
  role: GroupRole;
  memberCount: number;
  childrenCount: number;
  upcomingEventsCount: number;
  createdBy: GroupEntity["created_by"];
  createdAt: GroupEntity["created_at"];
}

/**
 * Command for updating a group
 * Used in: PATCH /api/groups/:groupId
 */
export interface UpdateGroupCommand {
  /** Group name, 3-100 characters */
  name?: string;
}

/**
 * Response after updating a group
 * Used in: PATCH /api/groups/:groupId
 */
export interface UpdateGroupResponseDTO {
  id: GroupEntity["id"];
  name: GroupEntity["name"];
  updatedAt: string;
}

// ============================================================================
// Group Members DTOs
// ============================================================================

/**
 * Group member list item DTO
 * Used in: GET /api/groups/:groupId/members
 * Combines member info with their children's names
 */
export interface GroupMemberDTO {
  userId: GroupMemberEntity["user_id"];
  role: GroupRole;
  joinedAt: GroupMemberEntity["joined_at"];
  /** Display names of member's children in this group */
  childrenNames: string[];
}

/**
 * Admin contact information DTO
 * Used in: GET /api/groups/:groupId/members/admin-contact
 * Reveals admin's email for emergency contact
 */
export interface AdminContactDTO {
  userId: ProfileEntity["id"];
  email: ProfileEntity["email"];
  /** Admin's children names for identification */
  childrenNames: string[];
}

// ============================================================================
// Group Invites DTOs & Commands
// ============================================================================

/**
 * Full invite information DTO
 * Used in: POST /api/groups/:groupId/invites (response)
 */
export interface GroupInviteDTO {
  code: GroupInviteEntity["code"];
  groupId: GroupInviteEntity["group_id"];
  expiresAt: GroupInviteEntity["expires_at"];
  createdAt: GroupInviteEntity["created_at"];
}

/**
 * Invite list item DTO (without groupId)
 * Used in: GET /api/groups/:groupId/invites
 */
export interface GroupInviteListItemDTO {
  code: GroupInviteEntity["code"];
  expiresAt: GroupInviteEntity["expires_at"];
  createdAt: GroupInviteEntity["created_at"];
}

/**
 * Command for joining a group via invite code
 * Used in: POST /api/invites/join
 */
export interface JoinGroupCommand {
  /** Invite code, max 10 characters */
  code: string;
}

/**
 * Response after joining a group
 * Used in: POST /api/invites/join
 */
export interface JoinGroupResponseDTO {
  groupId: GroupEntity["id"];
  groupName: GroupEntity["name"];
  role: GroupRole;
  joinedAt: GroupMemberEntity["joined_at"];
}

// ============================================================================
// Children DTOs & Commands
// ============================================================================

/**
 * Child list item DTO
 * Used in: GET /api/groups/:groupId/children
 */
export interface ChildListItemDTO {
  id: ChildEntity["id"];
  displayName: ChildEntity["display_name"];
  bio: ChildEntity["bio"];
  birthDate: ChildEntity["birth_date"];
  parentId: ChildEntity["parent_id"];
  /** Whether the current user is the parent of this child */
  isOwner: boolean;
  createdAt: ChildEntity["created_at"];
}

/**
 * Command for creating a child profile
 * Used in: POST /api/groups/:groupId/children
 */
export interface CreateChildCommand {
  /** Display name, 1-50 characters */
  displayName: string;
  /** Bio/interests, max 1000 characters */
  bio?: string;
  /** Birth date in YYYY-MM-DD format */
  birthDate?: string;
}

/**
 * Response after creating a child
 * Used in: POST /api/groups/:groupId/children
 */
export interface CreateChildResponseDTO {
  id: ChildEntity["id"];
  displayName: ChildEntity["display_name"];
  bio: ChildEntity["bio"];
  birthDate: ChildEntity["birth_date"];
  groupId: ChildEntity["group_id"];
  parentId: ChildEntity["parent_id"];
  createdAt: ChildEntity["created_at"];
}

/**
 * Full child detail DTO
 * Used in: GET /api/children/:childId
 */
export interface ChildDetailDTO {
  id: ChildEntity["id"];
  displayName: ChildEntity["display_name"];
  bio: ChildEntity["bio"];
  birthDate: ChildEntity["birth_date"];
  groupId: ChildEntity["group_id"];
  parentId: ChildEntity["parent_id"];
  /** Whether the current user is the parent of this child */
  isOwner: boolean;
  createdAt: ChildEntity["created_at"];
}

/**
 * Command for updating a child profile
 * Used in: PATCH /api/children/:childId
 */
export interface UpdateChildCommand {
  /** Display name, 1-50 characters */
  displayName?: string;
  /** Bio/interests, max 1000 characters */
  bio?: string;
  /** Birth date in YYYY-MM-DD format, null to clear */
  birthDate?: string | null;
}

/**
 * Response after updating a child
 * Used in: PATCH /api/children/:childId
 */
export interface UpdateChildResponseDTO {
  id: ChildEntity["id"];
  displayName: ChildEntity["display_name"];
  bio: ChildEntity["bio"];
  birthDate: ChildEntity["birth_date"];
  updatedAt: string;
}

// ============================================================================
// Events DTOs & Commands
// ============================================================================

/**
 * Event list item DTO
 * Used in: GET /api/groups/:groupId/events
 */
export interface EventListItemDTO {
  id: EventEntity["id"];
  title: EventEntity["title"];
  eventDate: EventEntity["event_date"];
  description: EventEntity["description"];
  childId: EventEntity["child_id"];
  /** Display name of the birthday child (if any) */
  childName: string | null;
  organizerId: EventEntity["organizer_id"];
  /** Whether the current user is the organizer */
  isOrganizer: boolean;
  /** Number of invited children */
  guestCount: number;
  /** True if updatedAt is within the last 8 hours */
  hasNewUpdates: boolean;
  createdAt: EventEntity["created_at"];
  updatedAt: EventEntity["updated_at"];
}

/**
 * Command for creating an event
 * Used in: POST /api/groups/:groupId/events
 */
export interface CreateEventCommand {
  /** Event title, 1-100 characters */
  title: string;
  /** Event date in YYYY-MM-DD format */
  eventDate: string;
  /** Event description */
  description?: string;
  /** Birthday child ID (optional) */
  childId?: string;
  /** IDs of children to invite as guests */
  guestChildIds?: string[];
}

/**
 * Response after creating an event
 * Used in: POST /api/groups/:groupId/events
 */
export interface CreateEventResponseDTO {
  id: EventEntity["id"];
  title: EventEntity["title"];
  eventDate: EventEntity["event_date"];
  description: EventEntity["description"];
  childId: EventEntity["child_id"];
  organizerId: EventEntity["organizer_id"];
  guestCount: number;
  createdAt: EventEntity["created_at"];
}

/**
 * Event guest DTO
 * Used in: GET /api/events/:eventId (nested)
 */
export interface EventGuestDTO {
  childId: EventGuestEntity["child_id"];
  displayName: ChildEntity["display_name"];
}

/**
 * Full event detail DTO
 * Used in: GET /api/events/:eventId
 */
export interface EventDetailDTO {
  id: EventEntity["id"];
  title: EventEntity["title"];
  eventDate: EventEntity["event_date"];
  description: EventEntity["description"];
  childId: EventEntity["child_id"];
  /** Display name of the birthday child (if any) */
  childName: string | null;
  /** Bio of the birthday child for gift inspiration */
  childBio: string | null;
  organizerId: EventEntity["organizer_id"];
  /** Whether the current user is the organizer */
  isOrganizer: boolean;
  groupId: EventEntity["group_id"];
  /** List of invited children */
  guests: EventGuestDTO[];
  /** True if updatedAt is within the last 8 hours */
  hasNewUpdates: boolean;
  createdAt: EventEntity["created_at"];
  updatedAt: EventEntity["updated_at"];
}

/**
 * Command for updating an event
 * Used in: PATCH /api/events/:eventId
 */
export interface UpdateEventCommand {
  /** Event title, 1-100 characters */
  title?: string;
  /** Event date in YYYY-MM-DD format */
  eventDate?: string;
  /** Event description */
  description?: string;
  /** IDs of children to invite (replaces entire guest list) */
  guestChildIds?: string[];
}

/**
 * Response after updating an event
 * Used in: PATCH /api/events/:eventId
 */
export interface UpdateEventResponseDTO {
  id: EventEntity["id"];
  title: EventEntity["title"];
  eventDate: EventEntity["event_date"];
  updatedAt: EventEntity["updated_at"];
}

// ============================================================================
// Event Comments DTOs & Commands
// ============================================================================

/**
 * Event comment DTO
 * Used in: GET /api/events/:eventId/comments
 * Note: Hidden from event organizers (surprise protection)
 */
export interface EventCommentDTO {
  id: EventCommentEntity["id"];
  content: EventCommentEntity["content"];
  authorId: EventCommentEntity["author_id"];
  /** Derived label like "Mama Ani" based on author's child */
  authorLabel: string;
  createdAt: EventCommentEntity["created_at"];
}

/**
 * Command for creating an event comment
 * Used in: POST /api/events/:eventId/comments
 */
export interface CreateEventCommentCommand {
  /** Comment content, 1-2000 characters */
  content: string;
}

// ============================================================================
// AI (Magic Wand) DTOs & Commands
// ============================================================================

/**
 * Command for AI-powered bio generation
 * Used in: POST /api/ai/magic-wand
 */
export interface MagicWandCommand {
  /** Rough notes about child's interests, 1-1000 characters */
  notes: string;
  /** Child's display name for personalization */
  childDisplayName?: string;
}

/**
 * Response from AI bio generation
 * Used in: POST /api/ai/magic-wand
 */
export interface MagicWandResponseDTO {
  /** Formatted bio suggestion with emojis and structure */
  generatedBio: string;
}

// ============================================================================
// Query Parameters Types
// ============================================================================

/** Common pagination query parameters */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/** Query parameters for GET /api/groups/:groupId/events */
export interface EventsQueryParams extends PaginationParams {
  /** Filter to future events only */
  upcoming?: boolean;
  /** Sort field */
  sortBy?: "eventDate" | "createdAt";
  /** Sort order */
  sortOrder?: "asc" | "desc";
}

