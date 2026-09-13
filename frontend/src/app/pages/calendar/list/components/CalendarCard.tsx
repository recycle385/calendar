import { CalendarDays, ChevronRight, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Calendar } from '../../../../../domains/calendar'
import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { formatDate } from '../../../../../shared/utils/format'
import {
  calendarStateLabel,
  getCalendarImageAlt,
  PLACEHOLDER_IMAGE_PATH,
} from '../../calendarHelpers'

export function CalendarCard({ calendar }: { calendar: Calendar }) {
  return (
    <Link className="calendar-workspace-card" to={`/c/${calendar.slug}`}>
      <div className="calendar-workspace-card-image">
        <img
          src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
          alt={getCalendarImageAlt(calendar.title)}
          onError={hideUnavailableAsset}
        />
        <span className={calendar.is_closed ? 'workspace-status is-closed' : 'workspace-status'}>
          {calendarStateLabel(calendar)}
        </span>
      </div>
      <div className="calendar-workspace-card-body">
        <h2>{calendar.title}</h2>
        <p>{calendar.description || '설명 없이 만든 캘린더예요. 참여자와 가능한 시간을 모아보세요.'}</p>
        <div className="calendar-workspace-card-meta">
          <span><CalendarDays size={15} /> {formatDate(calendar.start_date)} — {formatDate(calendar.end_date)}</span>
          <span><Users size={15} /> 참여 현황 보기</span>
        </div>
      </div>
      <ChevronRight className="calendar-workspace-card-arrow" size={19} />
    </Link>
  )
}
