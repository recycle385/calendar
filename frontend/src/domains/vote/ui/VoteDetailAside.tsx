import { ChevronDown, ChevronRight, Sparkles, Users } from 'lucide-react'

import { rankVoteDates } from '../model/ranking'
import type { DateVoteStatus, VoteType } from '../model/types'
import { panelClass } from '../../../shared/ui/styles'

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
  participants: Array<{
    uuid: string
    nickname: string
    color_code: string
  }>
  participantsCount: number
  selectedDate: string
  voteStatus: DateVoteStatus[]
  onSelectDate: (date: string) => void
  onViewParticipants: () => void
}

export function VoteDetailAside({
  participants,
  participantsCount,
  selectedDate,
  voteStatus,
  onSelectDate,
  onViewParticipants,
}: VoteDetailAsideProps) {
  const selectedStatus = voteStatus.find((item) => item.date_value.slice(0, 10) === selectedDate)
  const counts = selectedStatus?.votes.reduce<Record<VoteType, number>>((result, vote) => {
    result[vote.vote_type] += 1
    return result
  }, { available: 0, maybe: 0, unavailable: 0 }) ?? { available: 0, maybe: 0, unavailable: 0 }
  const availablePercent = participantsCount > 0 ? Math.round((counts.available / participantsCount) * 100) : 0
  const recommendations = rankVoteDates(voteStatus).slice(0, 3)
  const visibleParticipants = participants.slice(0, 5)

  return (
    <div className="sticky top-[94px] grid max-h-[calc(100vh-118px)] gap-3.5 overflow-y-auto pr-1 max-[1180px]:static max-[1180px]:max-h-none max-[1180px]:grid-cols-[repeat(auto-fit,minmax(230px,1fr))] max-[1180px]:overflow-visible max-[1180px]:p-0 max-[800px]:grid-cols-1">
      <section className={`${panelClass} grid gap-3.5 overflow-hidden p-5 max-[800px]:block`}>
        {selectedStatus ? (
          <>
            <h2 className="m-0 text-xl font-black tracking-[-0.04em] text-[#132e55]">{formatKoreanDate(selectedDate)}</h2>
            <strong className="text-sm text-[#29486f]">{participantsCount}명 중 {counts.available}명이 가능해요</strong>
            <div className="flex items-center gap-2.5"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8eef5]"><i className="block h-full rounded-full bg-[#28b879]" style={{ width: `${availablePercent}%` }} /></div><span className="text-xs font-black text-[#55708f]">{availablePercent}%</span></div>
            <div className="grid grid-cols-3 gap-1.5">
              <span className="grid justify-items-center gap-1 rounded-lg bg-[#effbf5] p-2 text-xs text-[#168a57]"><i className="size-1.5 rounded-full bg-current" />가능 <b>{counts.available}명</b></span>
              <span className="grid justify-items-center gap-1 rounded-lg bg-[#fff9e8] p-2 text-xs text-[#a97300]"><i className="size-1.5 rounded-full bg-current" />애매함 <b>{counts.maybe}명</b></span>
              <span className="grid justify-items-center gap-1 rounded-lg bg-[#fff3f3] p-2 text-xs text-[#dc6060]"><i className="size-1.5 rounded-full bg-current" />불가 <b>{counts.unavailable}명</b></span>
            </div>
            <details className="group border-t border-[#e6edf5] pt-3" open>
              <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <span><strong>투표 참여자</strong><b>{selectedStatus.votes.length}</b></span>
                <ChevronDown className="transition-transform group-open:rotate-180" aria-hidden="true" size={18} />
              </summary>
              <div className="mt-3 grid gap-2">
                {selectedStatus.votes.length > 0 ? selectedStatus.votes.map((vote) => (
                  <div className="flex items-center gap-2" key={vote.participant_id}>
                    <span className="grid size-[31px] shrink-0 place-items-center rounded-full border-2 border-white text-xs font-black text-white shadow-[0_2px_6px_#b7c8df]" style={{ backgroundColor: vote.participant_color }}>
                      {vote.participant_nickname.slice(0, 1)}
                    </span>
                    <strong className="min-w-0 flex-1 truncate text-[13px] text-[#324d70]">{vote.participant_nickname}</strong>
                    <small className={`rounded-full px-2 py-1 text-xs font-bold ${vote.vote_type === 'available' ? 'bg-[#e2f8eb] text-[#168a57]' : vote.vote_type === 'maybe' ? 'bg-[#fff5d8] text-[#a97300]' : 'bg-[#ffebeb] text-[#dc6060]'}`}>{voteLabel[vote.vote_type]}</small>
                  </div>
                )) : <p className="m-0 text-xs text-[#8192a9]">아직 이 날짜에 응답한 참여자가 없어요.</p>}
              </div>
            </details>
          </>
        ) : <p className="m-0 grid min-h-40 place-items-center text-sm text-[#8192a9]">달력에서 날짜를 선택해주세요.</p>}
      </section>

      <section className={`${panelClass} grid gap-3 overflow-hidden p-5 max-[800px]:block`}>
        <header className="flex items-center justify-between gap-3">
          <h2 className="m-0 flex items-center gap-1.5 text-base font-black text-[#183762] [&>svg]:text-brand-500 [&>span]:text-brand-500"><Users aria-hidden="true" size={18} /> 캘린더 참여자 <span>{participantsCount}</span></h2>
          <button className="inline-flex items-center gap-0.5 border-0 bg-transparent text-xs font-extrabold text-brand-500" type="button" onClick={onViewParticipants}>
            전체보기 <ChevronRight aria-hidden="true" size={15} />
          </button>
        </header>
        <div className="grid gap-2 max-[800px]:mt-3">
          {visibleParticipants.length > 0 ? visibleParticipants.map((participant) => (
            <div className="flex min-w-0 items-center gap-2" key={participant.uuid}>
              <span className="grid size-[31px] shrink-0 place-items-center rounded-full border-2 border-white text-xs font-black text-white shadow-[0_2px_6px_#b7c8df]" style={{ backgroundColor: participant.color_code }}>
                {participant.nickname.slice(0, 1)}
              </span>
              <strong className="truncate text-[13px] text-[#324d70]">{participant.nickname}</strong>
            </div>
          )) : <p className="m-0 text-xs text-[#8192a9]">아직 참여자가 없어요.</p>}
        </div>
        {participants.length > visibleParticipants.length && (
          <p className="m-0 border-t border-[#edf1f6] pt-2 text-xs text-[#8192a9]">외 {participants.length - visibleParticipants.length}명이 함께하고 있어요.</p>
        )}
      </section>

      <section className={`${panelClass} grid gap-2.5 overflow-hidden p-5 max-[800px]:block`}>
        <header><h2 className="m-0 flex items-center gap-1.5 text-base font-black text-[#183762] [&>svg]:text-[#f4ae20]"><Sparkles size={16} /> 추천 날짜</h2></header>
        {recommendations.length > 0 ? recommendations.map(({ item, available }, index) => {
          const date = item.date_value.slice(0, 10)
          const percent = participantsCount > 0 ? Math.round((available / participantsCount) * 100) : 0
          return (
            <button className="grid grid-cols-[26px_1fr_auto] items-center gap-2 rounded-[9px] border-0 bg-[#f8fbff] p-[9px] text-left max-[800px]:mt-2" type="button" key={date} onClick={() => onSelectDate(date)}>
              <span className="grid size-6 place-items-center rounded-full bg-[#e8f2ff] text-xs font-black text-[#2879e8]">{index + 1}</span>
              <div className="min-w-0">
                <strong className="block text-xs text-[#314c70]">{formatKoreanDate(date)}</strong>
                <small className="mt-[3px] block text-xs text-[#31a36e]">{available}명 가능</small>
                <i className="mt-[5px] block h-1 overflow-hidden rounded-full bg-[#e8eef5]"><em className="block h-full rounded-[inherit] bg-[#28b879]" style={{ width: `${percent}%` }} /></i>
              </div>
              <b className="text-xs text-[#7588a2]">{percent}%</b>
            </button>
          )
        }) : <p className="m-0 text-xs text-[#8494aa]">투표가 모이면 추천 날짜가 표시돼요.</p>}
      </section>
    </div>
  )
}
