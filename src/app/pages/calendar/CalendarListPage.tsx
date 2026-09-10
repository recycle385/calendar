import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronRight, Plus, Search, SlidersHorizontal, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getMyCalendars, type Calendar } from '../../../domains/calendar'
import { assetUrl } from '../../../shared/assets/assetUrl'
import { formatDate } from '../../../shared/utils/format'
import { useAuth } from '../../providers/AuthProvider'
import { LoginRequired, WorkspaceLayout } from '../components/WorkspaceLayout'
import { calendarStateLabel, getCalendarImageAlt, PLACEHOLDER_IMAGE_PATH } from './calendarHelpers'

type CalendarFilter = 'all' | 'ongoing' | 'closed'
type SortOrder = 'newest' | 'startDate'

function CalendarCard({ calendar }: { calendar: Calendar }) {
  return (
    <Link className="calendar-workspace-card" to={`/c/${calendar.slug}`}>
      <div className="calendar-workspace-card-image">
        <img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt={getCalendarImageAlt(calendar.title)} />
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

export function CalendarListPage() {
  const { accessToken, status, user } = useAuth()
  const [filter, setFilter] = useState<CalendarFilter>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOrder>('newest')
  const calendarsQuery = useQuery({
    queryKey: ['calendar', 'my', user?.user_uuid ?? 'restored-session'],
    queryFn: () => getMyCalendars(accessToken!),
    enabled: status === 'authenticated' && Boolean(accessToken),
  })

  const calendars = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ko-KR')
    return (calendarsQuery.data?.calendars ?? [])
      .filter((calendar) => filter === 'all' || (filter === 'ongoing' ? !calendar.is_closed : calendar.is_closed))
      .filter((calendar) => !query || `${calendar.title} ${calendar.description ?? ''}`.toLocaleLowerCase('ko-KR').includes(query))
      .slice()
      .sort((left, right) => {
        const compared = sort === 'newest'
          ? right.created_at.localeCompare(left.created_at)
          : left.start_date.localeCompare(right.start_date)
        return compared || left.slug.localeCompare(right.slug)
      })
  }, [calendarsQuery.data?.calendars, filter, search, sort])

  if (status === 'restoring') {
    return <WorkspaceLayout><section className="workspace-empty-state">로그인 상태를 확인하고 있어요.</section></WorkspaceLayout>
  }

  if (status !== 'authenticated' || !accessToken) {
    return <WorkspaceLayout><LoginRequired /></WorkspaceLayout>
  }

  return (
    <WorkspaceLayout
      title="내 캘린더"
      description="내가 만든 일정의 진행 상태를 확인하고, 참여자와 시간을 맞춰보세요."
      action={<Link className="button button-primary" to="/calendars/new"><Plus size={18} /> 캘린더 만들기</Link>}
      sideContent={<CalendarListAside />}
    >
      <section className="workspace-panel calendar-list-panel" aria-label="내 캘린더 목록">
        <div className="calendar-list-toolbar">
          <div className="filter-pills" role="tablist" aria-label="캘린더 상태">
            {([
              ['all', '전체'],
              ['ongoing', '진행 중'],
              ['closed', '마감'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>
                {label}
              </button>
            ))}
          </div>
          <label className="workspace-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="제목 또는 설명 검색" />
          </label>
          <label className="workspace-sort">
            <SlidersHorizontal size={16} />
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} aria-label="정렬 기준">
              <option value="newest">최신 생성순</option>
              <option value="startDate">시작일순</option>
            </select>
          </label>
        </div>

        {calendarsQuery.isPending ? (
          <div className="calendar-feedback">내 캘린더를 불러오는 중이에요.</div>
        ) : calendarsQuery.isError ? (
          <div className="calendar-feedback"><p>내 캘린더를 불러오지 못했어요.</p><button className="button button-secondary" type="button" onClick={() => void calendarsQuery.refetch()}>다시 시도</button></div>
        ) : calendars.length === 0 ? (
          <div className="calendar-feedback"><CalendarDays size={32} /><h2>표시할 캘린더가 없어요.</h2><p>새로운 모임을 만들고 사람들과 가능한 날짜를 모아보세요.</p><Link className="button button-primary" to="/calendars/new">첫 캘린더 만들기</Link></div>
        ) : (
          <div className="calendar-workspace-grid">
            {calendars.map((calendar) => <CalendarCard calendar={calendar} key={calendar.slug} />)}
            <Link className="calendar-create-card" to="/calendars/new"><Plus size={26} /><strong>새 캘린더 만들기</strong><span>새로운 일정을 시작해보세요.</span></Link>
          </div>
        )}
      </section>
    </WorkspaceLayout>
  )
}

function CalendarListAside() {
  return (
    <>
      <section className="workspace-aside-card workspace-aside-image">
        <img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt="모임 캘린더 안내 이미지" />
        <div><p className="eyebrow">ONE LINK, TOGETHER</p><strong>링크 하나로<br />일정을 시작하세요.</strong></div>
      </section>
      <section className="workspace-aside-card aside-tip-card">
        <span className="aside-number">01</span>
        <div><strong>참여 링크를 공유해보세요.</strong><p>참여자는 로그인 없이도 가능한 날짜를 표시할 수 있어요.</p></div>
      </section>
    </>
  )
}
