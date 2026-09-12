import { rankVoteDates } from '../model/ranking'
import type { DateVoteStatus } from '../model/types'
import { formatDate } from '../../../shared/utils/format'

export function VoteStatusPanel({ voteStatus, participantsCount, loading }: { voteStatus: DateVoteStatus[]; participantsCount: number; loading: boolean }) {
  const ranked = rankVoteDates(voteStatus)
  if (loading) return <section className="workspace-panel calendar-feedback">투표 현황을 불러오는 중이에요.</section>
  return <section className="workspace-panel status-panel"><div className="detail-panel-heading"><div><h2>투표 현황</h2><p>가능 응답이 많은 순서로 날짜를 추천해요.</p></div></div>{ranked.length === 0 ? <div className="calendar-feedback">아직 표시할 날짜가 없어요.</div> : <div className="status-list">{ranked.map(({ item, available, maybe, unavailable }, index) => <article key={item.date_option_id}><span className="status-rank">{index + 1}</span><div><h3>{formatDate(item.date_value)}</h3><p>아직 응답하지 않음 {Math.max(0, participantsCount - item.votes.length)}명</p></div><div className="status-counts"><span className="is-available">가능 {available}</span><span className="is-maybe">애매 {maybe}</span><span className="is-unavailable">불가 {unavailable}</span></div></article>)}</div>}</section>
}
