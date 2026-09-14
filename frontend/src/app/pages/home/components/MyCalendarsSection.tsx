import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'

import { myCalendarsQuery, type Calendar } from '../../../../domains/calendar'
import { assetUrl, hideUnavailableAsset } from '../../../../shared/assets/assetUrl'
import { formatDate } from '../../../../shared/utils/format'
import { eyebrowClass, shellClass } from '../../../../shared/ui/styles'
import { useAuth } from '../../../providers/AuthProvider'

const calendarImageUrl = assetUrl('edit/calendar-3d.webp')

function CalendarCard({ calendar }: { calendar: Calendar }) {
  return (
    <Link className="grid min-w-0 grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-[14px] border border-[#e1eaf5] bg-white text-inherit shadow-[0_8px_22px_rgba(65,104,153,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#a9cdfc] hover:shadow-[0_12px_26px_rgba(36,100,180,0.11)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-500/30 max-sm:grid-cols-[92px_minmax(0,1fr)]" to={`/c/${calendar.slug}`} aria-label={`${calendar.title} 캘린더 열기`}>
      <div className="relative grid min-h-[142px] place-items-center overflow-hidden bg-[#edf5ff] text-brand-500">
        <CalendarDays className="opacity-20" aria-hidden="true" size={34} />
        <img className="absolute inset-0 size-full object-contain" src={calendarImageUrl} alt="" aria-hidden="true" onError={hideUnavailableAsset} />
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-3 p-4">
        <div>
          <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-black ${calendar.is_closed ? 'bg-[#edf1f6] text-[#667993]' : 'bg-[#ddf7e8] text-[#178753]'}`}>
            {calendar.is_closed ? '마감' : '진행 중'}
          </span>
          <h3 className="mt-2 mb-1 truncate text-lg font-black tracking-[-0.04em] text-[#122c52]">{calendar.title}</h3>
          <p className="m-0 line-clamp-2 text-[13px] leading-5 text-[#6f829e]">{calendar.description || '설명 없이 만든 캘린더예요.'}</p>
        </div>
        <span className="text-xs font-bold text-[#6981a1]">
          {formatDate(calendar.start_date)} — {formatDate(calendar.end_date)}
        </span>
      </div>
    </Link>
  )
}

export function MyCalendarsSection() {
  const { accessToken, status, user, userUuid } = useAuth()
  const calendarsQuery = useQuery({
    ...myCalendarsQuery(userUuid ?? '', accessToken ?? ''),
    enabled: status === 'authenticated' && Boolean(accessToken && userUuid),
  })

  if (status === 'restore-failed') {
    return (
      <section className="bg-[#fff8e7] py-3 text-sm font-bold text-[#825b0c]" aria-live="polite">
        <div className={shellClass}>
          로그인 상태를 확인하지 못했어요. 네트워크를 확인한 뒤 새로고침해주세요.
        </div>
      </section>
    )
  }

  if (status !== 'authenticated') return null

  const calendars = calendarsQuery.data?.calendars ?? []
  const activeCount = calendars.filter((calendar) => !calendar.is_closed).length

  return (
    <section className="py-16 max-md:py-11" id="my-calendars" aria-labelledby="my-calendars-title">
      <div className={shellClass}>
        <div className="mb-6 flex items-end justify-between gap-5 max-sm:items-start">
          <div>
            <p className={eyebrowClass}>MY CALENDARS</p>
            <h2 className="mt-2 mb-0 text-[30px] font-black tracking-[-0.05em] text-ink-900 max-sm:text-[25px]" id="my-calendars-title">{user?.nickname ?? '회원'}님이 만든 캘린더</h2>
          </div>
          <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1.5 text-xs font-black text-brand-500">
            {calendarsQuery.isPending ? '불러오는 중' : `진행 중 ${activeCount}개`}
          </span>
        </div>

        {calendarsQuery.isPending ? (
          <div className="grid min-h-36 place-items-center rounded-[14px] border border-[#e1eaf5] bg-white text-sm text-[#7183a0]">내 캘린더를 불러오는 중이에요.</div>
        ) : calendarsQuery.isError ? (
          <div className="grid min-h-36 place-items-center gap-2 rounded-[14px] border border-[#e1eaf5] bg-white text-sm text-[#7183a0]">
            <p>내 캘린더를 불러오지 못했어요.</p>
            <button className="font-extrabold text-brand-500" type="button" onClick={() => void calendarsQuery.refetch()}>
              다시 시도
            </button>
          </div>
        ) : calendars.length === 0 ? (
          <div className="grid min-h-36 place-items-center rounded-[14px] border border-[#e1eaf5] bg-white text-sm text-[#7183a0]">아직 만든 캘린더가 없어요. 첫 일정을 만들어보세요.</div>
        ) : (
          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
            {calendars
              .slice()
              .sort((left, right) => right.created_at.localeCompare(left.created_at))
              .slice(0, 3)
              .map((calendar) => (
                <CalendarCard calendar={calendar} key={calendar.slug} />
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
