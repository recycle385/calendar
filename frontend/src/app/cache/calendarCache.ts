import type { QueryClient } from '@tanstack/react-query'

import { calendarKeys } from '../../domains/calendar'
import { participantKeys } from '../../domains/participant'
import { voteKeys, type DateVoteStatus, type GetVoteStatusResponse } from '../../domains/vote'

export function refreshVoteData(queryClient: QueryClient, slug: string, participantUuid: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: voteKeys.status(slug) }),
    queryClient.invalidateQueries({ queryKey: voteKeys.participant(slug, participantUuid) }),
    queryClient.invalidateQueries({ queryKey: participantKeys.list(slug) }),
  ])
}

export function refreshParticipantData(queryClient: QueryClient, slug: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: participantKeys.list(slug) }),
    queryClient.invalidateQueries({ queryKey: voteKeys.status(slug) }),
  ])
}

export function applyRealtimeVoteData(
  queryClient: QueryClient,
  slug: string,
  voteStatus: DateVoteStatus[],
) {
  const statusKey = voteKeys.status(slug)
  const currentStatus = queryClient.getQueryData<GetVoteStatusResponse>(statusKey)

  if (currentStatus) {
    queryClient.setQueryData<GetVoteStatusResponse>(statusKey, {
      ...currentStatus,
      voteStatus,
    })
  }

  return Promise.all([
    queryClient.invalidateQueries({ queryKey: participantKeys.list(slug) }),
    ...(currentStatus
      ? []
      : [queryClient.invalidateQueries({ queryKey: statusKey })]),
  ])
}

export function refreshCalendarData(queryClient: QueryClient, slug: string, participantUuid: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: calendarKeys.detail(slug) }),
    queryClient.invalidateQueries({ queryKey: calendarKeys.myRoot() }),
    queryClient.invalidateQueries({ queryKey: calendarKeys.joinedRoot() }),
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
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: calendarKeys.myRoot() }),
    queryClient.invalidateQueries({ queryKey: calendarKeys.joinedRoot() }),
  ])
}
