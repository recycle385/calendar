import { Search, SlidersHorizontal } from 'lucide-react'

import type { CalendarFilter, SortOrder } from '../hooks/useCalendarListFilters'

interface CalendarListToolbarProps {
  filter: CalendarFilter
  search: string
  sort: SortOrder
  onFilterChange: (filter: CalendarFilter) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: SortOrder) => void
}

export function CalendarListToolbar({
  filter,
  search,
  sort,
  onFilterChange,
  onSearchChange,
  onSortChange,
}: CalendarListToolbarProps) {
  return (
    <div className="calendar-list-toolbar">
      <div className="filter-pills" role="tablist" aria-label="캘린더 상태">
        {([
          ['all', '전체'],
          ['ongoing', '진행 중'],
          ['closed', '마감'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'is-active' : ''}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="workspace-search">
        <Search size={17} />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="제목 또는 설명 검색"
        />
      </label>
      <label className="workspace-sort">
        <SlidersHorizontal size={16} />
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOrder)}
          aria-label="정렬 기준"
        >
          <option value="newest">최신 생성순</option>
          <option value="startDate">시작일순</option>
        </select>
      </label>
    </div>
  )
}
