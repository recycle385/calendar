import { useMemo, useState } from 'react'

import type { Calendar } from '../../../../../domains/calendar'

export type CalendarFilter = 'all' | 'ongoing' | 'closed'
export type SortOrder = 'name' | 'newest' | 'oldest' | 'updated' | 'deadline'

export function compareCalendars(left: Calendar, right: Calendar, sort: SortOrder) {
  let compared = 0

  switch (sort) {
    case 'name':
      compared = left.title.localeCompare(right.title, 'ko-KR', { sensitivity: 'base' })
      break
    case 'oldest':
      compared = left.created_at.localeCompare(right.created_at)
      break
    case 'updated':
      compared = right.updated_at.localeCompare(left.updated_at)
      break
    case 'deadline':
      compared = Number(left.is_closed) - Number(right.is_closed)
        || left.vote_end_date.localeCompare(right.vote_end_date)
      break
    case 'newest':
      compared = right.created_at.localeCompare(left.created_at)
      break
  }

  return compared || left.slug.localeCompare(right.slug)
}

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
      .sort((left, right) => compareCalendars(left, right, sort))
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
