import { Search } from 'lucide-react'

import type { CalendarFilter, SortOrder } from '../hooks/useCalendarListFilters'
import { CalendarSortDropdown } from './CalendarSortDropdown'

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
    <div className="mb-5 flex items-center gap-3 max-[800px]:flex-wrap">
      <div className="flex gap-[5px] max-[520px]:w-full max-[520px]:overflow-x-auto" role="tablist" aria-label="캘린더 상태">
        {([
          ['all', '전체'],
          ['ongoing', '진행 중'],
          ['closed', '마감'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-[9px] border-0 px-[13px] py-2.5 text-[13px] font-extrabold ${filter === value ? 'bg-brand-100 text-brand-500' : 'bg-transparent text-[#6c7f9c]'}`}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="flex min-w-[130px] flex-1 items-center gap-2 rounded-[10px] border border-[#dce6f3] px-3 text-[#8aa0bb] max-[800px]:order-3 max-[800px]:basis-full">
        <Search size={17} />
        <input className="h-[38px] w-full border-0 bg-transparent text-[13px] text-[#263d61] outline-0"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="제목 또는 설명 검색"
        />
      </label>
      <CalendarSortDropdown value={sort} onChange={onSortChange} />
    </div>
  )
}
