import type { Calendar } from '../../../../../domains/calendar'
import type { Participant } from '../../../../../domains/participant'
import { VoteRecommendations, type DateVoteStatus } from '../../../../../domains/vote'
import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { PLACEHOLDER_IMAGE_PATH } from '../../calendarHelpers'
import type { OnlineCalendarUser, RealtimeConnectionState } from '../hooks/useCalendarRealtime'

interface DetailAsideProps {
  calendar?: Calendar
  participants: Participant[]
  voteStatus: DateVoteStatus[]
  onlineUsers: OnlineCalendarUser[] | null
  connectionState: RealtimeConnectionState
}

export function DetailAside({
  calendar,
  participants,
  voteStatus,
  onlineUsers,
  connectionState,
}: DetailAsideProps) {
  const onlineUuids = new Set(onlineUsers?.map((user) => user.sub) ?? [])

  return (
    <>
      {calendar && (
        <section className="workspace-aside-card detail-aside-image">
          <img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt="캘린더 이미지" onError={hideUnavailableAsset} />
          <p className="eyebrow">CALENDAR STATUS</p>
          <strong>{calendar.is_closed ? '투표가 마감되었어요.' : '참여자의 응답을 기다리고 있어요.'}</strong>
        </section>
      )}
      <section className="workspace-aside-card participant-summary-card">
        <h2>참여자 ({participants.length})</h2>
        {participants.slice(0, 5).map((participant) => (
          <div key={participant.uuid}>
            <span className="participant-avatar" style={{ backgroundColor: participant.color_code }}>
              {participant.nickname.slice(0, 1)}
            </span>
            <strong>{participant.nickname}</strong>
            <i
              className={connectionState === 'connected' && onlineUuids.has(participant.uuid) ? 'is-online' : ''}
              title={connectionState === 'connected' && onlineUuids.has(participant.uuid) ? '온라인' : '오프라인 또는 확인 중'}
            />
          </div>
        ))}
      </section>
      <VoteRecommendations voteStatus={voteStatus} />
    </>
  )
}
