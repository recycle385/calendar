import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'

import { myCalendarsQuery, type Calendar } from '../../../../domains/calendar'
import { assetUrl, hideUnavailableAsset } from '../../../../shared/assets/assetUrl'
import { formatDate } from '../../../../shared/utils/format'
import { useAuth } from '../../../providers/AuthProvider'

const calendarImageUrl = assetUrl('edit/calendar-3d.webp')

function CalendarCard({ calendar }: { calendar: Calendar }) {
  return (
    <Link className="home-calendar-card" to={`/c/${calendar.slug}`} aria-label={`${calendar.title} 캘린더 열기`}>
      <div className="home-calendar-card-image">
        <CalendarDays aria-hidden="true" size={34} />
        <img src={calendarImageUrl} alt="" aria-hidden="true" onError={hideUnavailableAsset} />
      </div>
      <div className="home-calendar-card-body">
        <div>
          <span className={calendar.is_closed ? 'calendar-status is-closed' : 'calendar-status'}>
            {calendar.is_closed ? '마감' : '진행 중'}
          </span>
          <h3>{calendar.title}</h3>
          <p>{calendar.description || '설명 없이 만든 캘린더예요.'}</p>
        </div>
        <span className="calendar-period">
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
      <section className="home-session-notice" aria-live="polite">
        <div className="shell">
          로그인 상태를 확인하지 못했어요. 네트워크를 확인한 뒤 새로고침해주세요.
        </div>
      </section>
    )
  }

  if (status !== 'authenticated') return null

  const calendars = calendarsQuery.data?.calendars ?? []
  const activeCount = calendars.filter((calendar) => !calendar.is_closed).length

  return (
    <section className="my-calendars-section" id="my-calendars" aria-labelledby="my-calendars-title">
      <div className="shell">
        <div className="my-calendars-heading">
          <div>
            <p className="eyebrow">MY CALENDARS</p>
            <h2 id="my-calendars-title">{user?.nickname ?? '회원'}님이 만든 캘린더</h2>
          </div>
          <span className="active-calendar-count">
            {calendarsQuery.isPending ? '불러오는 중' : `진행 중 ${activeCount}개`}
          </span>
        </div>

        {calendarsQuery.isPending ? (
          <div className="home-calendar-state">내 캘린더를 불러오는 중이에요.</div>
        ) : calendarsQuery.isError ? (
          <div className="home-calendar-state">
            <p>내 캘린더를 불러오지 못했어요.</p>
            <button type="button" onClick={() => void calendarsQuery.refetch()}>
              다시 시도
            </button>
          </div>
        ) : calendars.length === 0 ? (
          <div className="home-calendar-state">아직 만든 캘린더가 없어요. 첫 일정을 만들어보세요.</div>
        ) : (
          <div className="home-calendar-list">
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
