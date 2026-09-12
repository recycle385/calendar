import { queryOptions } from '@tanstack/react-query'

import { getParticipants } from '../api/participantApi'

export const participantKeys = {
  all: ['participant'] as const,
  calendar: (slug: string) => ['participant', 'calendar', slug] as const,
  list: (slug: string) => ['participant', 'calendar', slug, 'list'] as const,
}

export function participantsQuery(slug: string) {
  return queryOptions({
    queryKey: participantKeys.list(slug),
    queryFn: () => getParticipants(slug),
  })
}
