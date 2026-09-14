import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { myCalendarsQuery } from '../../../../domains/calendar'
import { useAuth } from '../../../providers/AuthProvider'
import { buttonClass, panelClass, primaryButtonClass, secondaryButtonClass } from '../../../../shared/ui/styles'
import { LoginRequired, WorkspaceLayout } from '../../components/WorkspaceLayout'
import { CalendarCard } from './components/CalendarCard'
import { CalendarListAside } from './components/CalendarListAside'
import { CalendarPagination } from './components/CalendarPagination'
import { CalendarListToolbar } from './components/CalendarListToolbar'
import { useCalendarListFilters } from './hooks/useCalendarListFilters'
import { paginateCalendars } from './model/calendarPagination'

export function CalendarListPage() {
  const [requestedPage, setRequestedPage] = useState(1)
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
  const {
    currentPage,
    emptySlotCount,
    totalPages,
    visibleItems: visibleCalendars,
  } = paginateCalendars(filteredCalendars, requestedPage)
  const isLastPage = currentPage === totalPages
  const shouldShowCreateCard = isLastPage && filter !== 'closed'
  const remainingEmptySlotCount = Math.max(0, emptySlotCount - (shouldShowCreateCard ? 1 : 0))

  if (status === 'restoring') {
    return <WorkspaceLayout><section className="grid min-h-[250px] place-content-center text-[#69809f]">로그인 상태를 확인하고 있어요.</section></WorkspaceLayout>
  }

  if (status !== 'authenticated' || !accessToken) {
    return <WorkspaceLayout><LoginRequired /></WorkspaceLayout>
  }

  return (
    <WorkspaceLayout
      title="내 캘린더"
      description="내가 만든 일정의 진행 상태를 확인하고, 참여자와 시간을 맞춰보세요."
      action={<Link className={`${buttonClass} ${primaryButtonClass} max-[520px]:w-full`} to="/calendars/new"><Plus size={18} /> 캘린더 만들기</Link>}
      sideContent={<CalendarListAside />}
    >
      <section className={`${panelClass} p-[18px] max-[520px]:p-3`} aria-label="내 캘린더 목록">
        <CalendarListToolbar
          filter={filter}
          search={search}
          sort={sort}
          onFilterChange={(nextFilter) => {
            setFilter(nextFilter)
            setRequestedPage(1)
          }}
          onSearchChange={(nextSearch) => {
            setSearch(nextSearch)
            setRequestedPage(1)
          }}
          onSortChange={(nextSort) => {
            setSort(nextSort)
            setRequestedPage(1)
          }}
        />

        {calendarsQuery.isPending ? (
          <div className="grid min-h-[250px] place-content-center justify-items-center gap-3 p-9 text-center text-[#69809f]">내 캘린더를 불러오는 중이에요.</div>
        ) : calendarsQuery.isError ? (
          <div className="grid min-h-[250px] place-content-center justify-items-center gap-3 p-9 text-center text-[#69809f]"><p>내 캘린더를 불러오지 못했어요.</p><button className={`${buttonClass} ${secondaryButtonClass}`} type="button" onClick={() => void calendarsQuery.refetch()}>다시 시도</button></div>
        ) : filteredCalendars.length === 0 ? (
          <div className="grid min-h-[250px] place-content-center justify-items-center gap-3 p-9 text-center text-[#69809f]"><CalendarDays size={32} /><h2 className="m-0 text-[22px] font-black text-[#19345d]">표시할 캘린더가 없어요.</h2><p className="m-0 max-w-[430px] leading-[1.65]">새로운 모임을 만들고 사람들과 가능한 날짜를 모아보세요.</p><Link className={`${buttonClass} ${primaryButtonClass}`} to="/calendars/new">첫 캘린더 만들기</Link></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5 max-[1180px]:grid-cols-1">
              {visibleCalendars.map((calendar) => <CalendarCard calendar={calendar} key={calendar.slug} />)}
              {shouldShowCreateCard ? (
                <Link className="grid min-h-[190px] place-content-center justify-items-center gap-[7px] rounded-2xl border border-dashed border-[#a9c9f6] bg-[linear-gradient(140deg,#fbfdff,#f1f7ff)] text-brand-500 transition hover:border-brand-400 hover:bg-[#edf5ff] active:scale-[0.99] [&>svg]:box-content [&>svg]:rounded-full [&>svg]:bg-[#e5f0ff] [&>svg]:p-2" to="/calendars/new">
                  <Plus size={26} />
                  <strong>새 캘린더 만들기</strong>
                  <span className="text-[13px] text-[#7489a6]">새로운 일정을 시작해보세요.</span>
                </Link>
              ) : null}
              {Array.from({ length: remainingEmptySlotCount }, (_, index) => (
                <div className="invisible min-h-[190px]" key={`empty-calendar-slot-${index}`} aria-hidden="true" />
              ))}
            </div>
            <CalendarPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setRequestedPage}
            />
          </>
        )}
      </section>
    </WorkspaceLayout>
  )
}
