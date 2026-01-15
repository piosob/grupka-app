# API Implementation Status

This document tracks the implementation progress of the REST API endpoints defined in `.ai/api-plan.md`.

## Legend

- ✅ **Implemented**: Service logic and API route completed.
- ⏳ **In Progress**: Currently being worked on.
- ❌ **Missing**: Not yet started.

---

## 2.2 Groups

- ✅ `GET /api/groups` - List user groups
- ✅ `POST /api/groups` - Create new group
- ✅ `GET /api/groups/:groupId` - Get group details
- ✅ `PATCH /api/groups/:groupId` - Update group settings (Admin only)
- ✅ `DELETE /api/groups/:groupId` - Delete group (Admin only)

## 2.3 Group Members

- ✅ `GET /api/groups/:groupId/members` - List group members
- ✅ `GET /api/groups/:groupId/members/admin-contact` - Admin contact reveal
- ❌ `DELETE /api/groups/:groupId/members/:userId` - Remove member / Leave group

## 2.4 Group Invites

- ✅ `POST /api/groups/:groupId/invites` - Generate invite code (Admin only)
- ✅ `GET /api/groups/:groupId/invites` - List active invites (Admin only)
- ✅ `DELETE /api/groups/:groupId/invites/:code` - Revoke invite (Admin only)
- ✅ `POST /api/invites/join` - Join group via code

## 2.5 Children

- ✅ `GET /api/groups/:groupId/children` - List children in group
- ✅ `POST /api/groups/:groupId/children` - Add child to group
- ✅ `GET /api/children/:childId` - Get child details
- ✅ `PATCH /api/children/:childId` - Update child profile (Parent only)
- ✅ `DELETE /api/children/:childId` - Delete child profile (Parent only)

## 2.6 Events

- ✅ `GET /api/groups/:groupId/events` - List group events
- ✅ `POST /api/groups/:groupId/events` - Create new event
- ✅ `GET /api/events/:eventId` - Get event details
- ✅ `PATCH /api/events/:eventId` - Update event (Organizer only)
- ✅ `DELETE /api/events/:eventId` - Delete event (Organizer only)

## 2.7 Event Comments

- ✅ `GET /api/events/:eventId/comments` - List comments (Surprise protection)
- ✅ `POST /api/events/:eventId/comments` - Add comment
- ✅ `DELETE /api/events/:eventId/comments/:commentId` - Delete comment (Author only)

## 2.8 AI (Magic Wand)

- ❌ `POST /api/ai/magic-wand` - AI bio generation
