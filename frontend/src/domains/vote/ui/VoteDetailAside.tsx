import { Check, Sparkles } from 'lucide-react'

import type { VoteDraft } from '../model/editor'
import { rankVoteDates } from '../model/ranking'
import type { DateVoteStatus, VoteType } from '../model/types'

const voteLabel: Record<VoteType, string> = {
  available: '가능',
  maybe: '애매함',
  unavailable: '불가',
}
const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })

function formatKoreanDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const weekday = weekdayFormatter.format(date)
  return `${month}월 ${day}일 (${weekday})`
}

interface VoteDetailAsideProps {
  draft: VoteDraft
  participantsCount: number
  selectedDate: string
  voteStatus: DateVoteStatus[]
  onChooseAvailable: (date: string) => void
  onSelectDate: (date: string) => void
}

export function VoteDetailAside({ draft, participantsCount, selectedDate, voteStatus, onChooseAvailable, onSelectDate }: VoteDetailAsideProps) {
  const selectedStatus = voteStatus.find((item) => item.date_value.slice(0, 10) === selectedDate)
  const counts = selectedStatus?.votes.reduce<Record<VoteType, number>>((result, vote) => {
    result[vote.vote_type] += 1
    return result
  }, { available: 0, maybe: 0, unavailable: 0 }) ?? { available: 0, maybe: 0, unavailable: 0 }
  const availablePercent = participantsCount > 0 ? Math.round((counts.available / participantsCount) * 100) : 0
  const recommendations = rankVoteDates(voteStatus).slice(0, 3)

  return (
    <>
      <section className="workspace-aside-card vote-date-detail-card">
        {selectedStatus ? (
          <>
            <h2>{formatKoreanDate(selectedDate)}</h2>
            <strong>{participantsCount}명 중 {counts.available}명이 가능해요</strong>
            <div className="vote-date-progress"><div><i style={{ width: `${availablePercent}%` }} /></div><span>{availablePercent}%</span></div>
            <div className="vote-date-counts">
              <span className="is-available"><i />가능 <b>{counts.available}명</b></span>
              <span className="is-maybe"><i />애매함 <b>{counts.maybe}명</b></span>
              <span className="is-unavailable"><i />불가 <b>{counts.unavailable}명</b></span>
            </div>
            <div className="vote-date-participants">
              <div><strong>참여자</strong><span>{selectedStatus.votes.length}</span></div>
              {selectedStatus.votes.length > 0 ? selectedStatus.votes.map((vote) => (
                <div className="vote-date-participant" key={vote.participant_id}>
                  <span className="participant-avatar" style={{ backgroundColor: vote.participant_color }}>
                    {vote.participant_nickname.slice(0, 1)}
                  </span>
                  <strong>{vote.participant_nickname}</strong>
                  <small className={`is-${vote.vote_type}`}>{voteLabel[vote.vote_type]}</small>
                </div>
              )) : <p>아직 이 날짜에 응답한 참여자가 없어요.</p>}
            </div>
            <button
              className="button button-primary vote-date-choose-button"
              type="button"
              disabled={draft[selectedDate] === 'available'}
              onClick={() => onChooseAvailable(selectedDate)}
            >
              <Check size={16} /> {draft[selectedDate] === 'available' ? '가능으로 선택했어요' : '이 날짜를 가능으로 선택하기'}
            </button>
          </>
        ) : <p className="vote-date-empty">달력에서 날짜를 선택해주세요.</p>}
      </section>

      <section className="workspace-aside-card vote-recommendations-card">
        <header><h2><Sparkles size={16} /> 추천 날짜</h2></header>
        {recommendations.length > 0 ? recommendations.map(({ item, available }, index) => {
          const date = item.date_value.slice(0, 10)
          const percent = participantsCount > 0 ? Math.round((available / participantsCount) * 100) : 0
          return (
            <button type="button" key={date} onClick={() => onSelectDate(date)}>
              <span>{index + 1}</span>
              <div>
                <strong>{formatKoreanDate(date)}</strong>
                <small>{available}명 가능</small>
                <i><em style={{ width: `${percent}%` }} /></i>
              </div>
              <b>{percent}%</b>
            </button>
          )
        }) : <p>투표가 모이면 추천 날짜가 표시돼요.</p>}
      </section>
    </>
  )
}
