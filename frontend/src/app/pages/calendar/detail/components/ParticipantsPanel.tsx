import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Crown, LogOut, UserMinus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  deleteParticipantByHost,
  deleteParticipantSelf,
  removeParticipantToken,
  runParticipantRequest,
  type Participant,
  type ParticipantSession,
} from '../../../../../domains/participant'
import { formatPercent } from '../../../../../shared/utils/format'
import {
  clearParticipantPrivateData,
  refreshParticipantData,
} from '../../../../cache/calendarCache'
import type { OnlineCalendarUser, RealtimeConnectionState } from '../hooks/useCalendarRealtime'

interface ParticipantsPanelProps {
  slug: string
  participants: Participant[]
  session: ParticipantSession
  currentUserUuid: string | null
  hostUuid: string
  isHost: boolean
  accessToken: string | null
  onlineUsers: OnlineCalendarUser[] | null
  connectionState: RealtimeConnectionState
  onSessionChanged: (session: ParticipantSession | null) => void
}

export function ParticipantsPanel({
  slug,
  participants,
  session,
  currentUserUuid,
  hostUuid,
  isHost,
  accessToken,
  onlineUsers,
  connectionState,
  onSessionChanged,
}: ParticipantsPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const leaveMutation = useMutation({
    mutationFn: () => runParticipantRequest({
      slug,
      session,
      currentUserUuid,
      mainAccessToken: accessToken,
      onSessionChanged,
      request: (token) => deleteParticipantSelf(slug, token),
    }),
    onSuccess: () => {
      removeParticipantToken(slug)
      clearParticipantPrivateData(queryClient, [{ slug, participantUuid: session.participantUuid }])
      navigate(`/c/${slug}/join`, { replace: true })
    },
  })
  const kickMutation = useMutation({
    mutationFn: (uuid: string) => deleteParticipantByHost(slug, uuid, accessToken!),
    onSuccess: () => void refreshParticipantData(queryClient, slug, session.participantUuid),
  })
  const onlineUuids = new Set(onlineUsers?.map((user) => user.sub) ?? [])

  return (
    <section className="workspace-panel participants-panel">
      <div className="detail-panel-heading">
        <div>
          <h2>참여자 ({participants.length})</h2>
          <p>함께 일정을 맞추고 있는 사람들이에요.</p>
        </div>
        {session.participantUuid !== hostUuid && (
          <button
            className="button button-secondary danger-outline"
            type="button"
            disabled={leaveMutation.isPending}
            onClick={() => {
              if (window.confirm('이 캘린더에서 나갈까요?')) leaveMutation.mutate()
            }}
          >
            <LogOut size={16} /> 나가기
          </button>
        )}
      </div>
      <div className="participants-list">
        {participants.map((participant) => (
          <article key={participant.uuid}>
            <span className="participant-avatar" style={{ backgroundColor: participant.color_code }}>
              {participant.nickname.slice(0, 1)}
            </span>
            <div>
              <h3>
                {participant.nickname} {participant.uuid === hostUuid && <Crown size={15} />}
                <span className={`participant-presence${connectionState === 'connected' && onlineUuids.has(participant.uuid) ? ' is-online' : ''}`}>
                  <i />
                  {connectionState !== 'connected' ? '확인 중' : onlineUuids.has(participant.uuid) ? '온라인' : '오프라인'}
                </span>
              </h3>
              <p>투표 참여율 {formatPercent(participant.vote_rate)} · {participant.vote_count}/{participant.total_dates}일</p>
            </div>
            {isHost && participant.uuid !== hostUuid && (
              <button
                type="button"
                className="participant-kick"
                aria-label={`${participant.nickname} 내보내기`}
                disabled={kickMutation.isPending}
                onClick={() => {
                  if (window.confirm(`${participant.nickname}님을 내보낼까요?`)) {
                    kickMutation.mutate(participant.uuid)
                  }
                }}
              >
                <UserMinus size={18} />
              </button>
            )}
          </article>
        ))}
      </div>
      {leaveMutation.isError && (
        <p className="form-error workspace-request-error">캘린더에서 나가지 못했어요. 다시 참여한 뒤 시도해주세요.</p>
      )}
      {kickMutation.isError && (
        <p className="form-error workspace-request-error">참여자를 내보내지 못했어요. 다시 시도해주세요.</p>
      )}
    </section>
  )
}
