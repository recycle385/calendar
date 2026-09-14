import { queryOptions } from '@tanstack/react-query'

import { getCalendarBySlug, getJoinedCalendars, getMyCalendars } from '../api/calendarApi'

export const calendarKeys = {
  all: ['calendar'] as const,
  detail: (slug: string) => ['calendar', 'detail', slug] as const,
  myRoot: () => ['calendar', 'my'] as const,
  my: (userUuid: string) => ['calendar', 'my', userUuid] as const,
  joinedRoot: () => ['calendar', 'joined'] as const,
  joined: (userUuid: string) => ['calendar', 'joined', userUuid] as const,
}

export function calendarDetailQuery(slug: string) {
  return queryOptions({
    queryKey: calendarKeys.detail(slug),
    queryFn: () => getCalendarBySlug(slug),
  })
}

export function myCalendarsQuery(userUuid: string, accessToken: string) {
  return queryOptions({
    queryKey: calendarKeys.my(userUuid),
    queryFn: () => getMyCalendars(accessToken),
  })
}

export function joinedCalendarsQuery(userUuid: string, accessToken: string) {
  return queryOptions({
    queryKey: calendarKeys.joined(userUuid),
    queryFn: () => getJoinedCalendars(accessToken),
  })
}
