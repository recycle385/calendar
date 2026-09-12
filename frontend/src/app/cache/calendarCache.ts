import type { QueryClient } from '@tanstack/react-query'

import { calendarKeys } from '../../domains/calendar'
import { participantKeys } from '../../domains/participant'
import { voteKeys } from '../../domains/vote'

export function refreshVoteData(queryClient: QueryClient, slug: string, participantUuid: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: voteKeys.status(slug) }),
    queryClient.invalidateQueries({ queryKey: voteKeys.participant(slug, participantUuid) }),
    queryClient.invalidateQueries({ queryKey: participantKeys.list(slug) }),
  ])
}

export function refreshParticipantData(queryClient: QueryClient, slug: string, participantUuid: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: participantKeys.list(slug) }),
    queryClient.invalidateQueries({ queryKey: voteKeys.status(slug) }),
    queryClient.invalidateQueries({ queryKey: voteKeys.participant(slug, participantUuid) }),
  ])
}

export function refreshCalendarData(queryClient: QueryClient, slug: string, participantUuid: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: calendarKeys.detail(slug) }),
    queryClient.invalidateQueries({ queryKey: calendarKeys.myRoot() }),
    queryClient.invalidateQueries({ queryKey: participantKeys.list(slug) }),
    queryClient.invalidateQueries({ queryKey: voteKeys.status(slug) }),
    queryClient.invalidateQueries({ queryKey: voteKeys.participant(slug, participantUuid) }),
  ])
}

export function clearParticipantPrivateData(
  queryClient: QueryClient,
  sessions: Array<{ slug: string; participantUuid: string }>,
) {
  for (const session of sessions) {
    queryClient.removeQueries({ queryKey: voteKeys.participant(session.slug, session.participantUuid), exact: true })
  }
}

export function clearDeletedCalendarData(queryClient: QueryClient, slug: string) {
  queryClient.removeQueries({ queryKey: calendarKeys.detail(slug), exact: true })
  queryClient.removeQueries({ queryKey: participantKeys.calendar(slug) })
  queryClient.removeQueries({ queryKey: voteKeys.calendar(slug) })
  return queryClient.invalidateQueries({ queryKey: calendarKeys.myRoot() })
}
