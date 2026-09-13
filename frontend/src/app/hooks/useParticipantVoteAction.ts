import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { runParticipantRequest, type ParticipantSession } from '../../domains/participant'
import { submitVotes, type VoteInput } from '../../domains/vote'
import { refreshVoteData } from '../cache/calendarCache'

interface ParticipantVoteActionOptions {
  slug: string
  session: ParticipantSession | null
  currentUserUuid: string | null
  mainAccessToken: string | null
}

export function useParticipantVoteAction({
  slug,
  session,
  currentUserUuid,
  mainAccessToken,
}: ParticipantVoteActionOptions) {
  const queryClient = useQueryClient()

  return useCallback(async (votes: VoteInput[]) => {
    if (!session) throw new Error('Participant session is required to submit votes.')

    const result = await runParticipantRequest({
      slug,
      session,
      currentUserUuid,
      mainAccessToken,
      request: (participantToken) => submitVotes(slug, { votes }, participantToken),
    })
    await refreshVoteData(queryClient, slug, session.participantUuid)
    return result
  }, [currentUserUuid, mainAccessToken, queryClient, session, slug])
}
