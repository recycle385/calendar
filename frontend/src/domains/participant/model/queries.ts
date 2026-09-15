import { queryOptions } from '@tanstack/react-query'

import { getParticipantReconciliation, getParticipants } from '../api/participantApi'

export const participantKeys = {
  all: ['participant'] as const,
  calendar: (slug: string) => ['participant', 'calendar', slug] as const,
  list: (slug: string) => ['participant', 'calendar', slug, 'list'] as const,
  reconciliation: (slug: string, participantUuid: string, userUuid: string) =>
    ['participant', 'calendar', slug, 'reconciliation', participantUuid, userUuid] as const,
}

export function participantReconciliationQuery(
  slug: string,
  participantUuid: string,
  guestParticipantToken: string,
  accessToken: string,
  userUuid: string,
) {
  return queryOptions({
    queryKey: participantKeys.reconciliation(slug, participantUuid, userUuid),
    queryFn: () => getParticipantReconciliation(slug, guestParticipantToken, accessToken),
    retry: false,
  })
}

export function participantsQuery(slug: string) {
  return queryOptions({
    queryKey: participantKeys.list(slug),
    queryFn: () => getParticipants(slug),
  })
}
