import { formatDate } from '../../../shared/utils/format'
import { rankVoteDates } from '../model/ranking'
import type { DateVoteStatus } from '../model/types'

export function VoteRecommendations({ voteStatus }: { voteStatus: DateVoteStatus[] }) {
  const top = rankVoteDates(voteStatus).slice(0, 3)
  return <section className="workspace-aside-card recommendation-card"><h2>추천 날짜 TOP 3</h2>{top.length ? top.map(({ item, available }, index) => <div key={item.date_value}><span>{index + 1}</span><strong>{formatDate(item.date_value)}</strong><small>가능 {available}명</small></div>) : <p>투표가 모이면 추천 날짜가 표시돼요.</p>}</section>
}
