import { useMemo, useState } from 'react'

import type { Calendar } from '../../../../../domains/calendar'

export type CalendarFilter = 'all' | 'ongoing' | 'closed'
export type SortOrder = 'newest' | 'startDate'

export function useCalendarListFilters(calendars: Calendar[]) {
  const [filter, setFilter] = useState<CalendarFilter>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOrder>('newest')

  const filteredCalendars = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ko-KR')
    return calendars
      .filter((calendar) => filter === 'all' || (filter === 'ongoing' ? !calendar.is_closed : calendar.is_closed))
      .filter((calendar) => !query || `${calendar.title} ${calendar.description ?? ''}`.toLocaleLowerCase('ko-KR').includes(query))
      .slice()
      .sort((left, right) => {
        const compared = sort === 'newest'
          ? right.created_at.localeCompare(left.created_at)
          : left.start_date.localeCompare(right.start_date)
        return compared || left.slug.localeCompare(right.slug)
      })
  }, [calendars, filter, search, sort])

  return {
    filter,
    filteredCalendars,
    search,
    setFilter,
    setSearch,
    setSort,
    sort,
  }
}
