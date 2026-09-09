import { useMemo } from 'react'

import { cn } from '../../../shared/utils/cn'
import './VoteCalendar.css'

interface VoteCalendarProps {
  availableDates: string[]
  selectedDates: string[]
  onToggle: (date: string) => void
  disabled?: boolean
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function toDateOnly(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function VoteCalendar({
  availableDates,
  selectedDates,
  onToggle,
  disabled = false,
}: VoteCalendarProps) {
  const normalizedDates = useMemo(
    () => [...new Set(availableDates.map((date) => date.slice(0, 10)))].sort(),
    [availableDates],
  )
  const availableSet = useMemo(() => new Set(normalizedDates), [normalizedDates])
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates])

  if (normalizedDates.length === 0) {
    return <p>선택 가능한 날짜가 없습니다.</p>
  }

  const firstDate = parseDateOnly(normalizedDates[0])
  const lastDate = parseDateOnly(normalizedDates.at(-1)!)
  const gridStart = new Date(firstDate)
  gridStart.setDate(firstDate.getDate() - firstDate.getDay())
  const gridEnd = new Date(lastDate)
  gridEnd.setDate(lastDate.getDate() + (6 - lastDate.getDay()))

  const days: Date[] = []
  for (const cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
    days.push(new Date(cursor))
  }

  return (
    <section className="vote-calendar" aria-label="날짜 투표">
      <div className="vote-calendar__weekdays" aria-hidden="true">
        {DAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="vote-calendar__grid">
        {days.map((day) => {
          const date = toDateOnly(day)
          const available = availableSet.has(date)
          const selected = selectedSet.has(date)

          return (
            <button
              key={date}
              type="button"
              disabled={disabled || !available}
              aria-pressed={selected}
              onClick={() => onToggle(date)}
              className={cn(
                'vote-calendar__day',
                available && 'vote-calendar__day--available',
                selected && 'vote-calendar__day--selected',
              )}
            >
              <span className="vote-calendar__date">{day.getDate()}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
