# REST API Plan

## 1. Resources

| Resource         | Database Table(s)           | Description                                    |
| ---------------- | --------------------------- | ---------------------------------------------- |
| 1 Auth           | `auth.users`, `profiles`    | Authentication via Supabase Auth SDK           |
| 2 Groups         | `groups`                    | Preschool/school parent groups (tenants)       |
| 3 Group Members  | `group_members`, `profiles` | User membership and roles in groups            |
| 4 Group Invites  | `group_invites`             | Temporary invitation codes (30 min TTL)        |
| 5 Children       | `children`                  | Child profiles within groups                   |
| 6 Events         | `events`                    | Birthday parties and fundraisers               |
| 7 Event Guests   | `event_guests`              | Children invited to events                     |
| 8 Event Comments | `event_comments`            | Hidden discussion thread (surprise protection) |
| 9 AI             | `ai_usage_logs`             | AI-powered bio generation                      |

---

## 2. Endpoints

### 2.1 Authentication

Authentication is handled by Supabase Auth SDK on the client side. The API uses JWT tokens from Supabase for authorization. Profile creation is automatic via database trigger on `auth.users` insert.

**Registration:**
Client must provide `first_name` in the `options.data` object during `signUp`. This metadata is used by the trigger to populate the `profiles` table.

**Note:** All endpoints below require `Authorization: Bearer <supabase_access_token>` header unless otherwise specified.

---

### 2.2 Groups

#### GET /api/groups

List all groups the current user is a member of.

**Query Parameters (`PaginationParams`):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Max results (default: 20, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response (200 OK - `PaginatedResponse<GroupListItemDTO>`):**

```json
{
    "data": [
        {
            "id": "uuid",
            "name": "Przedszkole Słoneczko - Motylki",
            "role": "admin",
            "memberCount": 15,
            "createdAt": "2025-01-15T10:30:00Z",
            "joinedAt": "2025-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "total": 3,
        "limit": 20,
        "offset": 0
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token

---

#### POST /api/groups

Create a new group. The creator automatically becomes an admin.

**Request Body (`CreateGroupCommand`):**

```json
{
    "name": "Przedszkole Słoneczko - Motylki"
}
```

**Validation:**

- `name`: Required, string, 3-100 characters

**Response (201 Created - `SingleResponse<CreateGroupResponseDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "name": "Przedszkole Słoneczko - Motylki",
        "role": "admin",
        "createdAt": "2025-01-15T10:30:00Z"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token

---

#### GET /api/groups/:groupId

Get group details (Group Hub summary).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | uuid | Group ID |

**Response (200 OK - `SingleResponse<GroupDetailDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "name": "Przedszkole Słoneczko - Motylki",
        "role": "admin",
        "memberCount": 15,
        "childrenCount": 18,
        "upcomingEventsCount": 3, // Tylko nadchodzące wydarzenia, w które użytkownik jest zaangażowany
        "createdBy": "uuid",
        "createdAt": "2025-01-15T10:30:00Z",
        "adminName": "Anna",
        "nextEvent": { // Najbliższe nadchodzące wydarzenie (organizer/gość/rodzic)
            "id": "uuid",
            "title": "Urodziny Stasia",
            "eventDate": "2025-05-15",
            "description": "Zapraszamy na urodziny!",
            "childId": "uuid",
            "childName": "Krzyś",
            "organizerId": "uuid",
            "isOrganizer": true,
            "guestCount": 12,
            "hasNewUpdates": true,
            "createdAt": "2025-01-15T10:30:00Z",
            "updatedAt": "2025-01-15T10:30:00Z"
        },
        "myChildren": [
            {
                "id": "uuid",
                "displayName": "Krzyś",
                "bio": "Loves dinosaurs...",
                "birthDate": "2019-05-15",
                "parentId": "uuid",
                "isOwner": true,
                "createdAt": "2025-01-15T10:30:00Z"
            }
        ]
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of this group
- `404 Not Found` - Group does not exist

---

#### PATCH /api/groups/:groupId

Update group settings. Admin only.

**Request Body (`UpdateGroupCommand`):**

```json
{
    "name": "Przedszkole Słoneczko - Biedronki"
}
```

**Validation:**

- `name`: Optional, string, 3-100 characters

**Response (200 OK - `SingleResponse<UpdateGroupResponseDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "name": "Przedszkole Słoneczko - Biedronki",
        "updatedAt": "2025-01-15T11:00:00Z"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not an admin of this group
- `404 Not Found` - Group does not exist

---

#### DELETE /api/groups/:groupId

Delete a group. Admin only. Cascades to all related data.

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not an admin of this group
- `404 Not Found` - Group does not exist

---

### 2.3 Group Members

#### GET /api/groups/:groupId/members

List all members of a group.

**Query Parameters (`PaginationParams`):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Max results (default: 50, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response (200 OK - `PaginatedResponse<GroupMemberDTO>`):**

```json
{
    "data": [
        {
            "userId": "uuid",
            "firstName": "Anna",
            "role": "admin",
            "joinedAt": "2025-01-15T10:30:00Z",
            "childrenNames": ["Krzyś", "Ania"]
        }
    ],
    "pagination": {
        "total": 15,
        "limit": 50,
        "offset": 0
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of this group
- `404 Not Found` - Group does not exist

---

#### GET /api/groups/:groupId/members/admin-contact

Get admin's email address (reveal feature for emergency contact).

**Response (200 OK - `SingleResponse<AdminContactDTO>`):**

```json
{
    "data": {
        "userId": "uuid",
        "email": "admin@example.com",
        "childrenNames": ["Krzyś"]
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of this group
- `404 Not Found` - Group does not exist

---

#### DELETE /api/groups/:groupId/members/:userId

Remove a member from the group. Admin only, or self-removal (leave group).

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not authorized (must be admin or self)
- `404 Not Found` - Group or member does not exist
- `409 Conflict` - Cannot remove last admin

---

### 2.4 Group Invites

#### POST /api/groups/:groupId/invites

Generate a new invite code. Admin only.

**Response (201 Created - `SingleResponse<GroupInviteDTO>`):**

```json
{
    "data": {
        "code": "ABC123XY",
        "groupId": "uuid",
        "expiresAt": "2025-01-15T11:30:00Z",
        "createdAt": "2025-01-15T10:30:00Z"
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not an admin of this group
- `404 Not Found` - Group does not exist

---

#### GET /api/groups/:groupId/invites

List active invite codes. Admin only.

**Response (200 OK - `PaginatedResponse<GroupInviteListItemDTO>`):**

```json
{
    "data": [
        {
            "code": "ABC123XY",
            "expiresAt": "2025-01-15T11:30:00Z",
            "createdAt": "2025-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "total": 1,
        "limit": 20,
        "offset": 0
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not an admin of this group
- `404 Not Found` - Group does not exist

---

#### DELETE /api/groups/:groupId/invites/:code

Revoke an invite code. Admin only.

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not an admin of this group
- `404 Not Found` - Group or invite code does not exist

---

#### POST /api/invites/join

Join a group using an invite code.

**Request Body (`JoinGroupCommand`):**

```json
{
    "code": "ABC123XY"
}
```

**Validation:**

- `code`: Required, string, max 10 characters

**Response (200 OK - `SingleResponse<JoinGroupResponseDTO>`):**

```json
{
    "data": {
        "groupId": "uuid",
        "groupName": "Przedszkole Słoneczko - Motylki",
        "role": "member",
        "joinedAt": "2025-01-15T10:45:00Z"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid code format
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Invalid or expired invite code
- `409 Conflict` - Jesteś już członkiem tej grupy

---

### 2.5 Children

#### GET /api/groups/:groupId/children

List all children in a group.

**Query Parameters (`PaginationParams`):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Max results (default: 50, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response (200 OK - `PaginatedResponse<ChildListItemDTO>`):**

```json
{
    "data": [
        {
            "id": "uuid",
            "displayName": "Krzyś",
            "bio": "Loves dinosaurs and building with LEGO...",
            "birthDate": "2019-05-15",
            "parentId": "uuid",
            "isOwner": true,
            "createdAt": "2025-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "total": 18,
        "limit": 50,
        "offset": 0
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of this group
- `404 Not Found` - Group does not exist

---

#### POST /api/groups/:groupId/children

Add a child to the group.

**Request Body (`CreateChildCommand`):**

```json
{
    "displayName": "Krzyś",
    "bio": "Loves dinosaurs and building with LEGO",
    "birthDate": "2019-05-15"
}
```

**Validation:**

- `displayName`: Required, string, 1-50 characters
- `bio`: Optional, string, max 1000 characters
- `birthDate`: Optional, date (YYYY-MM-DD format)

**Response (201 Created - `SingleResponse<CreateChildResponseDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "displayName": "Krzyś",
        "bio": "Loves dinosaurs and building with LEGO",
        "birthDate": "2019-05-15",
        "groupId": "uuid",
        "parentId": "uuid",
        "createdAt": "2025-01-15T10:30:00Z"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of this group
- `404 Not Found` - Group does not exist

---

#### GET /api/children/:childId

Get child details.

**Response (200 OK - `SingleResponse<ChildDetailDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "displayName": "Krzyś",
        "bio": "Loves dinosaurs and building with LEGO...",
        "birthDate": "2019-05-15",
        "groupId": "uuid",
        "parentId": "uuid",
        "isOwner": true,
        "createdAt": "2025-01-15T10:30:00Z"
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of the child's group
- `404 Not Found` - Child does not exist

---

#### PATCH /api/children/:childId

Update child profile. Parent only.

**Request Body (`UpdateChildCommand`):**

```json
{
    "displayName": "Krzyś od Kasi",
    "bio": "Updated interests description...",
    "birthDate": "2019-05-15"
}
```

**Validation:**

- `displayName`: Optional, string, 1-50 characters
- `bio`: Optional, string, max 1000 characters
- `birthDate`: Optional, date (YYYY-MM-DD format) or null to clear

**Response (200 OK - `SingleResponse<UpdateChildResponseDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "displayName": "Krzyś od Kasi",
        "bio": "Updated interests description...",
        "birthDate": "2019-05-15",
        "updatedAt": "2025-01-15T11:00:00Z"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not the parent of this child
- `404 Not Found` - Child does not exist

---

#### DELETE /api/children/:childId

Delete child profile. Parent only.

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not the parent of this child
- `404 Not Found` - Child does not exist

---

### 2.6 Events

#### GET /api/groups/:groupId/events

List events in a group.

**Query Parameters (`EventsQueryParams`):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Max results (default: 20, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |
| `upcoming` | boolean | No | Filter to future events only (default: false) |
| `sortBy` | string | No | Sort field: `eventDate`, `createdAt` (default: `eventDate`) |
| `sortOrder` | string | No | Sort order: `asc`, `desc` (default: `asc`) |

**Response (200 OK - `PaginatedResponse<EventListItemDTO>`):**

```json
{
    "data": [
        {
            "id": "uuid",
            "title": "Urodziny Stasia",
            "eventDate": "2025-05-15",
            "description": "Zapraszamy na urodziny!",
            "childId": "uuid",
            "childName": "Krzyś",
            "organizerId": "uuid",
            "isOrganizer": false,
            "guestCount": 12,
            "hasNewUpdates": true,
            "createdAt": "2025-01-15T10:30:00Z",
            "updatedAt": "2025-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "total": 5,
        "limit": 20,
        "offset": 0
    }
}
```

**Notes:**

- `hasNewUpdates`: true if `updatedAt` is within the last 8 hours (passive update indicator)
- **Privacy**: Zwracane są tylko wydarzenia, w których użytkownik jest zaangażowany (organizator, rodzic solenizanta lub rodzic gościa).

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of this group
- `404 Not Found` - Group does not exist

---

#### POST /api/groups/:groupId/events

Create a new event.

**Request Body (`CreateEventCommand`):**

```json
{
    "title": "Urodziny Stasia",
    "eventDate": "2025-05-15",
    "description": "Zapraszamy na urodziny w sali zabaw!",
    "childId": "uuid",
    "guestChildIds": ["uuid", "uuid", "uuid"]
}
```

**Validation:**

- `title`: Required, string, 1-100 characters
- `eventDate`: Required, date (YYYY-MM-DD format)
- `description`: Optional, text
- `childId`: Optional, uuid (birthday child)
- `guestChildIds`: Optional, array of uuids (must be children in the same group)

**Response (201 Created - `SingleResponse<CreateEventResponseDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "title": "Urodziny Stasia",
        "eventDate": "2025-05-15",
        "description": "Zapraszamy na urodziny w sali zabaw!",
        "childId": "uuid",
        "organizerId": "uuid",
        "guestCount": 12,
        "createdAt": "2025-01-15T10:30:00Z"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of this group
- `404 Not Found` - Group or referenced child does not exist

---

#### GET /api/events/:eventId

Get event details.

**Response (200 OK - `SingleResponse<EventDetailDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "title": "Urodziny Stasia",
        "eventDate": "2025-05-15",
        "description": "Zapraszamy na urodziny w sali zabaw!",
        "childId": "uuid",
        "childName": "Krzyś",
        "childBio": "Loves dinosaurs...",
        "organizerId": "uuid",
        "isOrganizer": false,
        "groupId": "uuid",
        "guests": [
            {
                "childId": "uuid",
                "displayName": "Ania"
            }
        ],
        "hasNewUpdates": true,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z"
    }
}
```

**Notes:**

- `childBio` is included for gift idea inspiration when viewing as guest

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of the event's group
- `404 Not Found` - Event does not exist

---

#### PATCH /api/events/:eventId

Update event. Organizer only.

**Request Body (`UpdateEventCommand`):**

```json
{
    "title": "Urodziny Stasia - nowy termin!",
    "eventDate": "2025-05-20",
    "description": "Zmiana terminu!",
    "guestChildIds": ["uuid", "uuid"]
}
```

**Validation:**

- `title`: Optional, string, 1-100 characters
- `eventDate`: Optional, date (YYYY-MM-DD format)
- `description`: Optional, text
- `guestChildIds`: Optional, array of uuids (replaces entire guest list)

**Response (200 OK - `SingleResponse<UpdateEventResponseDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "title": "Urodziny Stasia - nowy termin!",
        "eventDate": "2025-05-20",
        "updatedAt": "2025-01-15T11:00:00Z"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not the organizer of this event
- `404 Not Found` - Event does not exist

---

#### DELETE /api/events/:eventId

Delete event. Organizer only.

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not the organizer of this event
- `404 Not Found` - Event does not exist

---

### 2.7 Event Comments (Hidden Thread)

#### GET /api/events/:eventId/comments

List comments in an event's hidden thread. **Not accessible to event organizer** (RLS enforced).

**Query Parameters (`PaginationParams`):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Max results (default: 50, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response (200 OK - `PaginatedResponse<EventCommentDTO>`):**

```json
{
    "data": [
        {
            "id": "uuid",
            "content": "Proponuję złożyć się na zestaw LEGO Dinosaury!",
            "authorId": "uuid",
            "authorLabel": "Anna (mama Ani)",
            "isPinned": false,
            "isAuthor": true,
            "createdAt": "2025-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "total": 8,
        "limit": 50,
        "offset": 0
    }
}
```

**Notes:**

- `authorLabel` is derived from the author's child's display name in the group
- Comments are sorted by: `isPinned` DESC, `createdAt` DESC
- `isAuthor` is true if the current user is the author of the comment

---

#### PATCH /api/events/:eventId/comments/:commentId

Pin or unpin a comment. Any member of the group (except organizer) can pin/unpin.

**Request Body:**

```json
{
    "isPinned": true
}
```

**Response (200 OK - `SingleResponse<EventCommentDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "content": "Proponuję złożyć się na zestaw LEGO Dinosaury!",
        "authorId": "uuid",
        "authorLabel": "Anna (mama Ani)",
        "isPinned": true,
        "isAuthor": false,
        "createdAt": "2025-01-15T10:30:00Z"
    }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of the event's group OR is the event organizer
- `404 Not Found` - Comment does not exist

---

#### POST /api/events/:eventId/comments

Add a comment to the hidden thread. **Not accessible to event organizer** (RLS enforced).

**Request Body (`CreateEventCommentCommand`):**

```json
{
    "content": "Proponuję złożyć się na zestaw LEGO Dinosaury!"
}
```

**Validation:**

- `content`: Required, string, 1-2000 characters

**Response (201 Created - `SingleResponse<EventCommentDTO>`):**

```json
{
    "data": {
        "id": "uuid",
        "content": "Proponuję złożyć się na zestaw LEGO Dinosaury!",
        "authorId": "uuid",
        "authorLabel": "Mama Ani",
        "createdAt": "2025-01-15T10:45:00Z"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not a member of the event's group OR is the event organizer
- `404 Not Found` - Event does not exist

---

#### DELETE /api/events/:eventId/comments/:commentId

Delete own comment. Author only.

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Not the author of this comment
- `404 Not Found` - Comment does not exist

---

### 2.8 AI (Magic Wand)

#### POST /api/ai/magic-wand

Transform rough notes into a formatted gift ideas list for a child's bio.

**Request Body (`MagicWandCommand`):**

```json
{
    "notes": "dinozaury, lego, kolorowanki, nie lubi puzzli",
    "childDisplayName": "Krzyś"
}
```

**Validation:**

- `notes`: Required, string, 1-1000 characters
- `childDisplayName`: Optional, string (for personalization)

**Response (200 OK - `SingleResponse<MagicWandResponseDTO>`):**

```json
{
    "data": {
        "generatedBio": "🦖 **Zainteresowania:**\n- Uwielbia dinozaury i wszystko z nimi związane\n- Fan klocków LEGO - szczególnie zestawy konstrukcyjne\n- Lubi kolorowanki i zajęcia plastyczne\n\n⚠️ **Uwaga:** Nie przepada za układankami i puzzlami"
    }
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token
- `429 Too Many Requests` - Rate limit exceeded (max 10 requests per hour per user)
- `503 Service Unavailable` - AI service temporarily unavailable

**Rate Limiting:**

- 10 requests per hour per authenticated user
- Usage is logged in `ai_usage_logs` table

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Auth** with JWT tokens:

1. **Client-side Authentication**: Users authenticate directly with Supabase Auth SDK using email/password
2. **Token Passing**: Client includes `Authorization: Bearer <access_token>` header with each API request
3. **Token Verification**: API middleware validates JWT signature and extracts user identity
4. **Profile Creation**: Automatic via database trigger when new user is created in `auth.users`

### 3.2 Authorization Levels

| Level              | Description                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| **Authenticated**  | Valid JWT token required                                                            |
| **Group Member**   | User must be a member of the referenced group                                       |
| **Group Admin**    | User must have `role = 'admin'` in the group                                        |
| **Resource Owner** | User must own the resource (parent of child, organizer of event, author of comment) |

### 3.3 Row Level Security (RLS)

Database-level security enforces authorization rules:

- **Group Isolation**: Users can only access data from groups they belong to
- **Event Privacy**: Users only see events they organize, or where their child is the birthday child/guest.
- **Surprise Protection**: Event organizers cannot access `event_comments` on their own events
- **Ownership Enforcement**: Only parents can modify their children's profiles

### 3.4 Middleware Implementation

```typescript
// src/middleware/index.ts
import { createServerClient } from '@supabase/ssr';

export async function onRequest({ request, locals }, next) {
    const supabase = createServerClient(/* config */);

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    locals.user = user;
    locals.supabase = supabase;

    return next();
}
```

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Groups

| Field  | Rules                      |
| ------ | -------------------------- |
| `name` | Required, 3-100 characters |

#### Children

| Field         | Rules                                                  |
| ------------- | ------------------------------------------------------ |
| `displayName` | Required, 1-50 characters                              |
| `bio`         | Optional, max 1000 characters                          |
| `birthDate`   | Optional, valid date (YYYY-MM-DD), must be in the past. If year is unknown, use 1000 as sentinel year (e.g. 1000-05-15). |

#### Events

| Field           | Rules                                  |
| --------------- | -------------------------------------- |
| `title`         | Required, 1-100 characters             |
| `eventDate`     | Required, valid date (YYYY-MM-DD)      |
| `description`   | Optional, text                         |
| `childId`       | Optional, must exist in same group     |
| `guestChildIds` | Optional, all must exist in same group |

#### Event Comments

| Field     | Rules                       |
| --------- | --------------------------- |
| `content` | Required, 1-2000 characters |

#### Group Invites

| Field       | Rules                                     |
| ----------- | ----------------------------------------- |
| `code`      | Auto-generated, 8 alphanumeric characters |
| `expiresAt` | Auto-set to 30 minutes from creation      |

### 4.2 Business Logic Implementation

#### Group Creation (US-002)

1. Create group record with `created_by = auth.uid()`
2. Insert into `group_members` with `role = 'admin'`
3. Return combined response with group data and role

#### Invite Code Generation (US-003)

1. Verify user is admin of group
2. Check if there is already an active (not expired) invite for the group
3. Generate random 8-character code
4. Set `expires_at = NOW() + INTERVAL '30 minutes'`
5. Return code with expiration time

#### Join via Invite (US-003)

1. Look up code in `group_invites`
2. Validate `expires_at > NOW()`
3. Check user is not already a member
4. Insert into `group_members` with `role = 'member'`
5. Delete or keep invite code (configurable)

#### Group Hub Details (GET /api/groups/:groupId)

1. Verify user is a member of the group
2. Fetch basic group info and counts (members, children, upcoming involved events)
3. Fetch admin identification (imiona dzieci administratora)
4. Fetch nearest upcoming involved event for the group
5. Fetch user's children belonging to this group
6. Return aggregated response for the Hub view

#### Admin Contact Reveal (US-005)

1. Query `group_members` for `role = 'admin'`
2. Join with `profiles` to get email
3. Join with `children` to get child names for identification
4. Return email with child context

#### Magic Wand AI (US-006)

1. Validate input notes
2. Construct prompt with notes and optional child name
3. Call OpenRouter API with selected model
4. Log usage in `ai_usage_logs`
5. Return formatted bio suggestion

#### Event Guest Management (US-007)

1. On create/update, accept `guestChildIds` array
2. Delete existing entries in `event_guests` for this event
3. Insert new entries for each child ID
4. Validate all children belong to same group

#### Hidden Thread Protection (US-008)

1. RLS policy blocks SELECT on `event_comments` where `events.organizer_id = auth.uid()`
2. API returns 403 if organizer attempts access (additional safety layer)
3. Frontend hides comments section for organizers

#### Comment Author Label (US-009)

1. Join `event_comments` with `children` via `author_id = parent_id`
2. Filter children to same group as event
3. Format as "{firstName} (rodzic {childName})" or just "{firstName}"

### 4.3 Update Badge Logic

The "passive update indicator" (8-hour badge) is computed at query time:

```sql
SELECT
  *,
  (updated_at > NOW() - INTERVAL '8 hours') AS has_new_updates
FROM events
WHERE group_id = :groupId
```

### 4.4 Error Response Format

All error responses follow a consistent format:

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [
            {
                "field": "name",
                "message": "Name must be at least 3 characters"
            }
        ]
    }
}
```

**Standard Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Resource conflict (duplicate, etc.) |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable |
