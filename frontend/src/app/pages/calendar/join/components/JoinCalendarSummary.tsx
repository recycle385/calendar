import { CalendarDays, KeyRound } from 'lucide-react'

import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { formatDate } from '../../../../../shared/utils/format'
import { panelClass } from '../../../../../shared/ui/styles'
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
      <section className={`${panelClass} relative overflow-hidden p-5 max-[800px]:[&:not(:first-child)]:hidden`}>
        <img className="mb-3.5 h-28 w-full rounded-[10px] bg-[#eaf4ff] object-contain" src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt={`${title} 대표 이미지`} onError={hideUnavailableAsset} />
        <span className={`absolute top-8 right-[31px] inline-flex w-fit rounded-full px-[9px] py-[5px] text-xs font-black ${isClosed ? 'bg-[#edf1f6] text-[#667993]' : 'bg-[#ddf7e8] text-[#178753]'}`}>
          {isClosed ? '마감됨' : '참여 가능'}
        </span>
        <h2 className="mt-[9px] mb-[7px] text-xl font-black text-[#17345c]">{title}</h2>
        <p className="m-0 text-xs leading-6 text-[#7185a2]">{description || '함께 가능한 시간을 찾아보세요.'}</p>
        <dl className="mt-[17px] mb-0 grid gap-2.5 border-t border-[#e6edf6] pt-3.5 [&>div]:grid [&>div]:gap-1">
          <div><dt className="flex items-center gap-[5px] text-xs text-[#7690af]"><CalendarDays size={16} /> 기간</dt><dd className="m-0 text-xs font-bold text-[#355378] [overflow-wrap:anywhere]">{formatDate(startDate)} — {formatDate(endDate)}</dd></div>
          <div><dt className="flex items-center gap-[5px] text-xs text-[#7690af]"><KeyRound size={16} /> 참여 코드</dt><dd className="m-0 text-xs font-bold text-[#355378] [overflow-wrap:anywhere]">{slug}</dd></div>
        </dl>
      </section>
      <section className={`${panelClass} overflow-hidden p-5 max-[800px]:hidden`}>
        <h2 className="mt-0 mb-4 text-base font-black text-[#183762]">참여 전에 확인해주세요</h2>
        <ol className="m-0 grid gap-[11px] pl-5 text-xs leading-[1.45] text-[#68809e]">
          <li>참여한 뒤 바로 날짜 투표를 할 수 있어요.</li>
          <li>게스트는 비밀번호를 기억해두세요.</li>
          <li>마감된 캘린더는 새 참여가 제한돼요.</li>
        </ol>
      </section>
    </>
  )
}
