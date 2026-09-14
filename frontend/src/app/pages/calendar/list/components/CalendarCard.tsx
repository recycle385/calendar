import { CalendarClock, CalendarDays, ChevronRight, Clock3, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Calendar } from '../../../../../domains/calendar'
import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { formatDate, formatDateTime } from '../../../../../shared/utils/format'
import {
  calendarStateLabel,
  getCalendarImageAlt,
  PLACEHOLDER_IMAGE_PATH,
} from '../../calendarHelpers'

export function CalendarCard({ calendar }: { calendar: Calendar }) {
  return (
    <Link className="relative grid min-h-[230px] grid-cols-[140px_minmax(0,1fr)] overflow-hidden rounded-[14px] border border-[#e1eaf5] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#bcd8ff] hover:shadow-[0_12px_24px_rgba(30,100,192,0.1)] max-[520px]:grid-cols-[105px_minmax(0,1fr)]" to={`/c/${calendar.slug}`}>
      <div className="relative overflow-hidden bg-[#edf5ff]">
        <img
          className="size-full bg-[#eaf4ff] object-contain"
          src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
          alt={getCalendarImageAlt(calendar.title)}
          onError={hideUnavailableAsset}
        />
        <span className={`absolute top-2.5 right-2 inline-flex w-fit rounded-full px-[9px] py-[5px] text-xs font-black ${calendar.is_closed ? 'bg-[#edf1f6] text-[#667993]' : 'bg-[#ddf7e8] text-[#178753]'}`}>
          {calendarStateLabel(calendar)}
        </span>
      </div>
      <div className="min-w-0 px-4 pt-[18px] pr-7 pb-3.5 max-[520px]:px-[13px] max-[520px]:pt-3.5 max-[520px]:pr-6 max-[520px]:pb-3">
        <h2 className="my-1 mb-[7px] truncate text-lg font-black tracking-[-0.04em] text-[#122c52] max-[520px]:text-base">{calendar.title}</h2>
        <p className="m-0 line-clamp-2 text-[13px] leading-[1.55] text-[#6f829e]">{calendar.description || '설명 없이 만든 캘린더예요. 참여자와 가능한 시간을 모아보세요.'}</p>
        <div className="mt-[13px] grid gap-2 text-[13px] font-bold text-[#6981a1] [&>span]:flex [&>span]:items-start [&>span]:gap-[6px] [&_svg]:mt-0.5 [&_svg]:shrink-0">
          <span><Clock3 size={16} /> 투표 기간 {formatDate(calendar.vote_start_date)} — {formatDate(calendar.vote_end_date)}</span>
          <span><CalendarDays size={16} /> 후보 날짜 {formatDate(calendar.start_date)} — {formatDate(calendar.end_date)}</span>
          <span><Users size={16} /> 현재 참여 인원 {calendar.participant_count ?? 0}명</span>
          <span><CalendarClock size={16} /> 생성일 {formatDateTime(calendar.created_at)}</span>
        </div>
      </div>
      <ChevronRight className="absolute top-[17px] right-3 text-[#98a9c0]" size={19} />
    </Link>
  )
}
