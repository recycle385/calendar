import {
  AlarmClock,
  ArrowDownAZ,
  Check,
  ChevronDown,
  Clock3,
  FilePenLine,
  History,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { SortOrder } from '../hooks/useCalendarListFilters'

interface SortOption {
  value: SortOrder
  label: string
  description: string
  icon: LucideIcon
}

const SORT_OPTIONS: SortOption[] = [
  {
    value: 'newest',
    label: '최신순',
    description: '가장 최근에 생성한 캘린더부터',
    icon: Clock3,
  },
  {
    value: 'deadline',
    label: '마감 임박순',
    description: '투표 마감일이 가까운 캘린더부터',
    icon: AlarmClock,
  },
  {
    value: 'oldest',
    label: '오래된순',
    description: '가장 오래전에 생성한 캘린더부터',
    icon: History,
  },
  {
    value: 'name',
    label: '이름순',
    description: '캘린더 이름을 기준으로 오름차순',
    icon: ArrowDownAZ,
  },
  {
    value: 'updated',
    label: '최근 수정순',
    description: '최근에 수정한 캘린더부터',
    icon: FilePenLine,
  },
]

interface CalendarSortDropdownProps {
  value: SortOrder
  onChange: (value: SortOrder) => void
}

export function CalendarSortDropdown({ value, onChange }: CalendarSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedOption = SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0]
  const SelectedIcon = selectedOption.icon

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="relative ml-auto shrink-0" ref={rootRef}>
      <button
        className={`flex h-11 min-w-[128px] cursor-pointer items-center gap-2 rounded-[11px] border bg-white px-3.5 text-sm font-extrabold transition active:scale-[0.98] ${isOpen ? 'border-brand-400 bg-[#f6faff] text-brand-600 shadow-[0_0_0_3px_rgba(32,123,255,0.08)]' : 'border-[#d6e2f0] text-[#183760] hover:border-[#9fc4f6] hover:bg-[#f9fbff]'}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="calendar-sort-options"
        onClick={() => setIsOpen((open) => !open)}
      >
        <SelectedIcon className="text-brand-500" size={18} />
        <span>{selectedOption.label}</span>
        <ChevronDown className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} size={17} />
      </button>

      {isOpen ? (
        <div
          className="absolute top-[calc(100%+8px)] right-0 z-30 w-[270px] rounded-xl border border-[#dce6f2] bg-white p-2.5 shadow-[0_15px_38px_rgba(24,61,108,0.16)] max-[360px]:w-[calc(100vw-32px)]"
          id="calendar-sort-options"
          role="listbox"
          aria-label="정렬 기준"
        >
          <p className="m-0 px-2 pt-1 pb-2 text-xs font-extrabold text-[#758aa6]">정렬 기준</p>
          <div className="grid gap-1">
            {SORT_OPTIONS.map((option) => {
              const OptionIcon = option.icon
              const isSelected = option.value === value

              return (
                <button
                  className={`grid cursor-pointer grid-cols-[22px_minmax(0,1fr)_18px] items-center gap-2 rounded-[9px] border-0 px-2.5 py-2.5 text-left transition active:scale-[0.99] ${isSelected ? 'bg-[#edf5ff] text-brand-600' : 'bg-transparent text-[#17365f] hover:bg-[#f4f7fb]'}`}
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                >
                  <OptionIcon className={isSelected ? 'text-brand-500' : 'text-[#476b9c]'} size={19} />
                  <span className="min-w-0">
                    <strong className="block text-sm font-black">{option.label}</strong>
                    <small className="mt-0.5 block truncate text-xs font-medium text-[#7890af]">{option.description}</small>
                  </span>
                  {isSelected ? <Check className="text-brand-500" size={18} /> : <span />}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
