import { queryOptions } from '@tanstack/react-query'

import { getParticipantVotes, getVoteStatus } from '../api/voteApi'

export const voteKeys = {
  all: ['vote'] as const,
  calendar: (slug: string) => ['vote', 'calendar', slug] as const,
  status: (slug: string) => ['vote', 'calendar', slug, 'status'] as const,
  participant: (slug: string, participantUuid: string) => ['vote', 'calendar', slug, 'participant', participantUuid] as const,
}

export function voteStatusQuery(slug: string) {
  return queryOptions({
    queryKey: voteKeys.status(slug),
    queryFn: () => getVoteStatus(slug),
  })
}

export function participantVotesQuery(slug: string, participantUuid: string) {
  return queryOptions({
    queryKey: voteKeys.participant(slug, participantUuid),
    queryFn: () => getParticipantVotes(slug, participantUuid),
  })
}
