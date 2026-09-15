import { Info } from 'lucide-react'

import { selectLeadingVoteDates } from '../model/ranking'
import type { DateVoteStatus } from '../model/types'
import { panelClass } from '../../../shared/ui/styles'

const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })

function formatCandidateDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${month}월 ${day}일 (${weekdayFormatter.format(date)})`
}

interface VoteStatusPanelProps {
  voteStatus: DateVoteStatus[]
  participantsCount: number
  loading: boolean
}

export function VoteStatusPanel({ voteStatus, participantsCount, loading }: VoteStatusPanelProps) {
  const leadingCandidates = selectLeadingVoteDates(voteStatus)

  if (loading) {
    return (
      <section className={`${panelClass} grid min-h-[250px] place-content-center text-[#69809f]`}>
        유력 후보를 불러오는 중이에요.
      </section>
    )
  }

  return (
    <section className={`${panelClass} p-[25px] max-[800px]:p-5 max-[520px]:p-4`}>
      <header className="mb-5">
        <h2 className="m-0 text-[22px] font-black tracking-[-0.04em] text-[#19365e]">유력 날짜 후보</h2>
        <p className="mt-1.5 mb-0 text-sm text-[#7185a2]">참여자들이 가능한 날짜를 순위별로 확인해보세요.</p>
      </header>

      {leadingCandidates.length === 0 ? (
        <div className="grid min-h-[250px] place-content-center text-[#69809f]">아직 표시할 후보 날짜가 없어요.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e1eaf5]">
          <div className="grid grid-cols-[52px_minmax(140px,0.9fr)_minmax(220px,1.35fr)_minmax(260px,1.2fr)] items-center bg-[#edf5ff] px-3 py-3 text-[13px] font-black text-[#52719a] max-[800px]:hidden">
            <span className="text-center">순위</span>
            <span>날짜</span>
            <span>가능 비율</span>
            <span>투표 수 (명)</span>
          </div>

          <div className="divide-y divide-[#e5edf6]">
            {leadingCandidates.map(({ item, available, maybe, unavailable }, index) => {
              const availablePercent = participantsCount > 0
                ? Math.round((available / participantsCount) * 100)
                : 0

              return (
                <article
                  className="grid grid-cols-[52px_minmax(140px,0.9fr)_minmax(220px,1.35fr)_minmax(260px,1.2fr)] items-center px-3 py-3.5 max-[800px]:grid-cols-[42px_1fr] max-[800px]:gap-x-2 max-[800px]:gap-y-3 max-[800px]:px-3 max-[800px]:py-4"
                  key={item.date_option_id}
                >
                  <span className="grid size-8 place-items-center justify-self-center rounded-full bg-[#e8f2ff] text-sm font-black text-[#2879e8] max-[800px]:row-span-3 max-[800px]:self-start">
                    {index + 1}
                  </span>
                  <h3 className="m-0 text-base font-black text-[#183762]">
                    {formatCandidateDate(item.date_value)}
                  </h3>
                  <div className="flex items-center gap-3 max-[800px]:col-start-2">
                    <strong className="w-10 shrink-0 text-sm font-black text-[#50729d]">{availablePercent}%</strong>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e5ebf3]">
                      <i
                        className="block h-full rounded-full bg-[linear-gradient(90deg,#3c8cff,#2580ef)] transition-[width] duration-300"
                        style={{ width: `${availablePercent}%` }}
                      />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-[800px]:col-start-2">
                    <span className="rounded-full bg-[#e2f8eb] px-3 py-1.5 text-[13px] font-black text-[#168a57]">가능 {available}</span>
                    <span className="rounded-full bg-[#fff5d8] px-3 py-1.5 text-[13px] font-black text-[#a97300]">애매 {maybe}</span>
                    <span className="rounded-full bg-[#ffebeb] px-3 py-1.5 text-[13px] font-black text-[#dc5058]">불가 {unavailable}</span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-4 mb-0 flex items-start gap-2 rounded-xl bg-[#f1f7ff] px-4 py-3 text-[13px] font-medium leading-5 text-[#6c83a2]">
        <Info className="mt-0.5 shrink-0 text-[#6d91c4]" aria-hidden="true" size={17} />
        전원이 가능한 날짜가 없으면 가능 응답과 애매 응답이 많은 후보를 기준으로 조율해보세요.
      </p>
    </section>
  )
}
