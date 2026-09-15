import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  loginParticipant,
  participantKeys,
  participantReconciliationQuery,
  reconcileParticipant,
  removeParticipantToken,
  setParticipantSession,
  type ParticipantReconciliationAction,
  type ParticipantSession,
} from '../../domains/participant'
import { clearParticipantPrivateData, refreshCalendarData } from '../cache/calendarCache'
import type { AuthStatus } from '../providers/AuthProvider'

interface UseParticipantReconciliationInput {
  slug: string
  authStatus: AuthStatus
  accessToken: string | null
  currentUserUuid: string | null
  session: ParticipantSession | null
}

export function useParticipantReconciliation({
  slug,
  authStatus,
  accessToken,
  currentUserUuid,
  session,
}: UseParticipantReconciliationInput) {
  const queryClient = useQueryClient()
  const isRequired = Boolean(
    slug
      && authStatus === 'authenticated'
      && accessToken
      && currentUserUuid
      && session
      && session.linkedUserUuid === null,
  )
  const guestParticipantUuid = session?.participantUuid ?? ''
  const guestParticipantToken = session?.participantToken ?? ''
  const previewQuery = useQuery({
    ...participantReconciliationQuery(
      slug,
      guestParticipantUuid,
      guestParticipantToken,
      accessToken ?? '',
      currentUserUuid ?? '',
    ),
    enabled: isRequired,
  })

  const finishReconciliation = (nextSession: ParticipantSession) => {
    if (session) {
      clearParticipantPrivateData(queryClient, [{ slug, participantUuid: session.participantUuid }])
      queryClient.removeQueries({
        queryKey: participantKeys.reconciliation(
          slug,
          session.participantUuid,
          currentUserUuid ?? '',
        ),
        exact: true,
      })
    }
    setParticipantSession(slug, nextSession)
    void refreshCalendarData(queryClient, slug, nextSession.participantUuid)
  }

  const reconciliationMutation = useMutation({
    mutationFn: (action: ParticipantReconciliationAction) => {
      if (!accessToken || !currentUserUuid || !session) {
        throw new Error('로그인 또는 게스트 참여 정보를 확인할 수 없습니다.')
      }
      return reconcileParticipant(
        slug,
        session.participantToken,
        accessToken,
        action,
      )
    },
    onSuccess: (response) => {
      if (!currentUserUuid) return
      finishReconciliation({
        participantToken: response.participantToken,
        participantUuid: response.participant.uuid,
        linkedUserUuid: currentUserUuid,
      })
    },
  })

  const recoveryMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) throw new Error('로그인 정보를 확인할 수 없습니다.')
      return loginParticipant(slug, {}, accessToken)
    },
    onSuccess: (response) => {
      if (!currentUserUuid) return
      finishReconciliation({
        participantToken: response.participantToken,
        participantUuid: response.participant.uuid,
        linkedUserUuid: currentUserUuid,
      })
    },
  })

  const discardGuestSession = () => {
    if (session) {
      clearParticipantPrivateData(queryClient, [{ slug, participantUuid: session.participantUuid }])
    }
    removeParticipantToken(slug)
  }

  return {
    isRequired,
    preview: previewQuery.data,
    isLoading: previewQuery.isPending,
    loadError: recoveryMutation.error ?? previewQuery.error,
    actionError: reconciliationMutation.error,
    isSubmitting: reconciliationMutation.isPending || recoveryMutation.isPending,
    resolve: reconciliationMutation.mutateAsync,
    retry: () => {
      recoveryMutation.reset()
      return previewQuery.refetch()
    },
    recoverAccountSession: recoveryMutation.mutateAsync,
    discardGuestSession,
  }
}
