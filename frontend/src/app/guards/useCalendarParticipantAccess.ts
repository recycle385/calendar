import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  isLinkedMemberParticipantSession,
  isParticipantSessionUsable,
  removeParticipantToken,
  useParticipantSession,
} from '../../domains/participant'
import { clearParticipantPrivateData } from '../cache/calendarCache'
import { useAuth } from '../providers/AuthProvider'

export function useCalendarParticipantAccess(slug: string) {
  const queryClient = useQueryClient()
  const { accessToken, status, userUuid } = useAuth()
  const storedSession = useParticipantSession(slug)
  const currentUserUuid = status === 'authenticated' ? userUuid : null
  const memberIdentityUnavailable = isLinkedMemberParticipantSession(storedSession)
    && (status === 'restoring' || status === 'restore-failed')
  const participantSession = !memberIdentityUnavailable
    && isParticipantSessionUsable(storedSession, currentUserUuid)
    ? storedSession
    : null

  useEffect(() => {
    if (status === 'restoring' || status === 'restore-failed' || !storedSession || participantSession) return
    removeParticipantToken(slug)
    clearParticipantPrivateData(queryClient, [{ slug, participantUuid: storedSession.participantUuid }])
  }, [participantSession, queryClient, slug, status, storedSession])

  return {
    accessToken,
    authStatus: status,
    currentUserUuid,
    memberIdentityUnavailable,
    participantSession,
  }
}
