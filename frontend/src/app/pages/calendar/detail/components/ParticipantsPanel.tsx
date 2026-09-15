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
import { buttonClass, panelClass, secondaryButtonClass } from '../../../../../shared/ui/styles'
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
}: ParticipantsPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const leaveMutation = useMutation({
    mutationFn: () => runParticipantRequest({
      slug,
      session,
      currentUserUuid,
      mainAccessToken: accessToken,
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
    <section className={`${panelClass} p-[25px] max-[800px]:p-5`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[21px] font-black tracking-[-0.04em] text-[#19365e]">참여자 ({participants.length})</h2>
          <p className="mt-1.5 mb-0 text-xs text-[#7b8da8]">함께 일정을 맞추고 있는 사람들이에요.</p>
        </div>
        {session.participantUuid !== hostUuid && (
          <button
            className={`${buttonClass} ${secondaryButtonClass} border-[#f0bbbb] text-[#d76565]`}
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
      <div className="grid">
        {participants.map((participant) => (
          <article className="flex items-center gap-[11px] border-t border-[#e9eff6] py-[13px] first:border-t-0" key={participant.uuid}>
            <span className="grid size-[35px] shrink-0 place-items-center rounded-full border-2 border-white text-[13px] font-black text-white shadow-[0_2px_6px_#b7c8df]" style={{ backgroundColor: participant.color_code }}>
              {participant.nickname.slice(0, 1)}
            </span>
            <div>
              <h3 className="m-0 flex items-center gap-1 text-sm font-black text-[#2b486f] [&>svg]:text-[#f4a224]">
                {participant.nickname} {participant.uuid === hostUuid && <Crown size={15} />}
                <span className={`ml-[5px] inline-flex items-center gap-1 text-xs font-bold ${connectionState === 'connected' && onlineUuids.has(participant.uuid) ? 'text-[#168b58]' : 'text-[#8b9ab0]'}`}>
                  <i className={`inline-block size-[7px] rounded-full ${connectionState === 'connected' && onlineUuids.has(participant.uuid) ? 'bg-[#1fc275] shadow-[0_0_0_3px_rgba(31,194,117,0.12)]' : 'bg-[#aab8ca]'}`} />
                  {connectionState !== 'connected' ? '확인 중' : onlineUuids.has(participant.uuid) ? '온라인' : '오프라인'}
                </span>
              </h3>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${participant.vote_count > 0 ? 'bg-[#e2f8eb] text-[#168a57]' : 'bg-[#edf2f7] text-[#71839c]'}`}>
                {participant.vote_count > 0 ? '투표 완료' : '미투표'}
              </span>
            </div>
            {isHost && participant.uuid !== hostUuid && (
              <button
                type="button"
                className="ml-auto grid size-[33px] place-items-center rounded-lg border-0 bg-[#fff0f0] text-[#e26b6b] disabled:opacity-60"
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
        <p className="mt-3 mb-0 text-[13px] font-bold text-[#df4d4d]">캘린더에서 나가지 못했어요. 다시 참여한 뒤 시도해주세요.</p>
      )}
      {kickMutation.isError && (
        <p className="mt-3 mb-0 text-[13px] font-bold text-[#df4d4d]">참여자를 내보내지 못했어요. 다시 시도해주세요.</p>
      )}
    </section>
  )
}
