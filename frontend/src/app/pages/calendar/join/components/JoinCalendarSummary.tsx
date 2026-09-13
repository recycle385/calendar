import { CalendarDays, KeyRound } from 'lucide-react'

import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { formatDate } from '../../../../../shared/utils/format'
import { PLACEHOLDER_IMAGE_PATH } from '../../calendarHelpers'

interface JoinCalendarSummaryProps {
  slug: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  isClosed: boolean
}

export function JoinCalendarSummary({
  slug,
  title,
  description,
  startDate,
  endDate,
  isClosed,
}: JoinCalendarSummaryProps) {
  return (
    <>
      <section className="workspace-aside-card join-summary-card">
        <img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt={`${title} 대표 이미지`} onError={hideUnavailableAsset} />
        <span className={isClosed ? 'workspace-status is-closed' : 'workspace-status'}>
          {isClosed ? '마감됨' : '참여 가능'}
        </span>
        <h2>{title}</h2>
        <p>{description || '함께 가능한 시간을 찾아보세요.'}</p>
        <dl>
          <div><dt><CalendarDays size={16} /> 기간</dt><dd>{formatDate(startDate)} — {formatDate(endDate)}</dd></div>
          <div><dt><KeyRound size={16} /> 참여 코드</dt><dd>{slug}</dd></div>
        </dl>
      </section>
      <section className="workspace-aside-card join-info-card">
        <h2>참여 전에 확인해주세요</h2>
        <ol>
          <li>참여한 뒤 바로 날짜 투표를 할 수 있어요.</li>
          <li>게스트는 비밀번호를 기억해두세요.</li>
          <li>마감된 캘린더는 새 참여가 제한돼요.</li>
        </ol>
      </section>
    </>
  )
}
