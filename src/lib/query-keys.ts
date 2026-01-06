/**
 * Query Key Factory for TanStack Query
 *
 * Hierarchy:
 * - resource
 * - type (all | lists | details)
 * - context (e.g. groupId)
 * - parameters (filters, pagination)
 */

export const queryKeys = {
    // Authentication & Profile
    auth: {
        me: ['auth', 'me'] as const,
    },

    // Groups
    groups: {
        all: ['groups'] as const,
        lists: () => [...queryKeys.groups.all, 'list'] as const,
        list: (params: Record<string, any> = {}) => [...queryKeys.groups.lists(), params] as const,
        details: () => [...queryKeys.groups.all, 'detail'] as const,
        detail: (groupId: string) => [...queryKeys.groups.details(), groupId] as const,
    },

    // Group Members
    members: {
        all: (groupId: string) => [...queryKeys.groups.detail(groupId), 'members'] as const,
        list: (groupId: string, params: Record<string, any> = {}) =>
            [...queryKeys.members.all(groupId), 'list', params] as const,
        adminContact: (groupId: string) =>
            [...queryKeys.members.all(groupId), 'admin-contact'] as const,
    },

    // Children
    children: {
        all: (groupId: string) => [...queryKeys.groups.detail(groupId), 'children'] as const,
        list: (groupId: string, params: Record<string, any> = {}) =>
            [...queryKeys.children.all(groupId), 'list', params] as const,
        detail: (childId: string) => ['children', 'detail', childId] as const,
    },

    // Events
    events: {
        all: (groupId: string) => [...queryKeys.groups.detail(groupId), 'events'] as const,
        list: (groupId: string, params: Record<string, any> = {}) =>
            [...queryKeys.events.all(groupId), 'list', params] as const,
        detail: (eventId: string) => ['events', 'detail', eventId] as const,
        comments: (eventId: string) => [...queryKeys.events.detail(eventId), 'comments'] as const,
    },

    // Invites
    invites: {
        all: (groupId: string) => [...queryKeys.groups.detail(groupId), 'invites'] as const,
        list: (groupId: string) => [...queryKeys.invites.all(groupId), 'list'] as const,
    },
} as const;
