import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { myCalendarsQuery } from '../../../../domains/calendar'
import { useAuth } from '../../../providers/AuthProvider'
import { LoginRequired, WorkspaceLayout } from '../../components/WorkspaceLayout'
import { CalendarCard } from './components/CalendarCard'
import { CalendarListAside } from './components/CalendarListAside'
import { CalendarListToolbar } from './components/CalendarListToolbar'
import { useCalendarListFilters } from './hooks/useCalendarListFilters'

export function CalendarListPage() {
  const { accessToken, status, user, userUuid } = useAuth()
  const calendarsQuery = useQuery({
    ...myCalendarsQuery(userUuid ?? '', accessToken ?? ''),
    enabled: status === 'authenticated' && Boolean(accessToken && userUuid),
  })

  const {
    filter,
    filteredCalendars,
    search,
    setFilter,
    setSearch,
    setSort,
    sort,
  } = useCalendarListFilters(calendarsQuery.data?.calendars ?? [])

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
        <CalendarListToolbar
          filter={filter}
          search={search}
          sort={sort}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          onSortChange={setSort}
        />

        {calendarsQuery.isPending ? (
          <div className="calendar-feedback">내 캘린더를 불러오는 중이에요.</div>
        ) : calendarsQuery.isError ? (
          <div className="calendar-feedback"><p>내 캘린더를 불러오지 못했어요.</p><button className="button button-secondary" type="button" onClick={() => void calendarsQuery.refetch()}>다시 시도</button></div>
        ) : filteredCalendars.length === 0 ? (
          <div className="calendar-feedback"><CalendarDays size={32} /><h2>표시할 캘린더가 없어요.</h2><p>새로운 모임을 만들고 사람들과 가능한 날짜를 모아보세요.</p><Link className="button button-primary" to="/calendars/new">첫 캘린더 만들기</Link></div>
        ) : (
          <div className="calendar-workspace-grid">
            {filteredCalendars.map((calendar) => <CalendarCard calendar={calendar} key={calendar.slug} />)}
            <Link className="calendar-create-card" to="/calendars/new"><Plus size={26} /><strong>새 캘린더 만들기</strong><span>새로운 일정을 시작해보세요.</span></Link>
          </div>
        )}
      </section>
    </WorkspaceLayout>
  )
}
