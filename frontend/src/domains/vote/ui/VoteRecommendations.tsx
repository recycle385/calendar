import { formatDate } from '../../../shared/utils/format'
import { rankVoteDates } from '../model/ranking'
import type { DateVoteStatus } from '../model/types'
import { panelClass } from '../../../shared/ui/styles'

export function VoteRecommendations({ voteStatus }: { voteStatus: DateVoteStatus[] }) {
  const top = rankVoteDates(voteStatus).slice(0, 3)
  return <section className={`${panelClass} grid gap-[9px] overflow-hidden p-5 max-[800px]:hidden`}><h2 className="m-0 mb-0.5 text-base font-black text-[#183762]">추천 날짜 TOP 3</h2>{top.length ? top.map(({ item, available }, index) => <div className="grid grid-cols-[26px_1fr_auto] items-center gap-2 rounded-[9px] bg-[#f8fbff] p-[9px]" key={item.date_value}><span className="grid size-6 place-items-center rounded-full bg-[#e8f2ff] text-xs font-black text-[#2879e8]">{index + 1}</span><strong className="text-xs text-[#3a5679]">{formatDate(item.date_value)}</strong><small className="text-xs font-extrabold text-[#23915c]">가능 {available}명</small></div>) : <p className="m-0 text-xs leading-6 text-[#8494aa]">투표가 모이면 추천 날짜가 표시돼요.</p>}</section>
}
