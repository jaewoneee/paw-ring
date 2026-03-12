/** TanStack Query key factory */
export const queryKeys = {
  schedules: {
    all: ['schedules'] as const,
    month: (petId: string, year: number, month: number) =>
      ['schedules', 'month', petId, year, month] as const,
    upcoming: (petId: string) =>
      ['schedules', 'upcoming', petId] as const,
    detail: (id: string) =>
      ['schedules', 'detail', id] as const,
  },
  pets: {
    all: ['pets'] as const,
    own: (userId: string) => ['pets', 'own', userId] as const,
    shared: (userId: string) => ['pets', 'shared', userId] as const,
  },
  categories: {
    all: ['categories'] as const,
    byUser: (userId: string) => ['categories', userId] as const,
  },
  calendarMembers: {
    byPet: (petId: string) => ['calendar-members', petId] as const,
  },
  sharedCalendars: {
    byUser: (userId: string) => ['shared-calendars', userId] as const,
  },
  pendingInvites: {
    byUser: (userId: string) => ['pending-invites', userId] as const,
  },
  invites: {
    detail: (inviteId: string) => ['invites', inviteId] as const,
  },
} as const;
