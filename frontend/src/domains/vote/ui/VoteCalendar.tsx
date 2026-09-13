import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useMemo, useState, type Dispatch } from 'react'

import type { VoteDraft, VoteEditorAction } from '../model/editor'
import { getAvailabilityHeatLevel } from '../model/heatmap'
import type { DateVoteStatus, VoteType } from '../model/types'

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const voteTypeLabel: Record<VoteType, string> = {
  available: '가능',
  maybe: '애매함',
  unavailable: '불가',
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createMonthCells(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const gridStart = new Date(year, month - 1, 1 - firstDay.getDay())
  const visibleDays = Math.ceil((firstDay.getDay() + lastDay.getDate()) / 7) * 7

  return Array.from({ length: visibleDays }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return { date: toDateKey(date), day: date.getDate(), inMonth: date.getMonth() === month - 1 }
  })
}

interface VoteCalendarProps {
  disabled: boolean
  draft: VoteDraft
  enabledDates: DateVoteStatus[]
  participantsCount: number
  selectedDate: string
  tool: VoteType
  dispatch: Dispatch<VoteEditorAction>
  onSelectDate: (date: string) => void
}

export function VoteCalendar({ disabled, draft, enabledDates, participantsCount, selectedDate, tool, dispatch, onSelectDate }: VoteCalendarProps) {
  const months = useMemo(
    () => [...new Set(enabledDates.map((item) => item.date_value.slice(0, 7)))].sort(),
    [enabledDates],
  )
  const [selectedMonth, setSelectedMonth] = useState('')
  const visibleMonth = months.includes(selectedMonth) ? selectedMonth : months[0] ?? ''

  const statusByDate = useMemo(
    () => new Map(enabledDates.map((item) => [item.date_value.slice(0, 10), item])),
    [enabledDates],
  )
  const cells = useMemo(() => visibleMonth ? createMonthCells(visibleMonth) : [], [visibleMonth])
  const currentMonthIndex = months.indexOf(visibleMonth)
  const [year, month] = visibleMonth.split('-').map(Number)

  function moveMonth(offset: number) {
    const nextMonth = months[currentMonthIndex + offset]
    if (nextMonth) setSelectedMonth(nextMonth)
  }

  return (
    <div className="vote-calendar">
      <div className="vote-calendar-toolbar">
        <div>
          <button type="button" aria-label="이전 달" disabled={currentMonthIndex <= 0} onClick={() => moveMonth(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="다음 달" disabled={currentMonthIndex < 0 || currentMonthIndex >= months.length - 1} onClick={() => moveMonth(1)}>
            <ChevronRight size={18} />
          </button>
          <strong>{year}년 {month}월</strong>
        </div>
        {months.length > 1 && <span>{currentMonthIndex + 1} / {months.length}</span>}
      </div>

      <div className="vote-calendar-weekdays" aria-hidden="true">
        {weekDays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="vote-calendar-grid">
        {cells.map((cell) => {
          const status = statusByDate.get(cell.date)
          const selected = draft[cell.date]
          const availableCount = status?.votes.filter((vote) => vote.vote_type === 'available').length ?? 0
          const enabled = Boolean(cell.inMonth && status)
          const heatLevel = getAvailabilityHeatLevel(availableCount, participantsCount)

          return (
            <button
              type="button"
              key={cell.date}
              disabled={disabled || !enabled}
              aria-label={`${cell.date}${selected ? ` ${voteTypeLabel[selected]}` : ''}`}
              aria-pressed={Boolean(selected)}
              className={`vote-calendar-day heat-${heatLevel}${cell.inMonth ? '' : ' is-outside'}${enabled ? ' is-enabled' : ''}${selectedDate === cell.date ? ' is-focused' : ''}${selected ? ` has-own-vote own-${selected}` : ''}`}
              onClick={() => {
                onSelectDate(cell.date)
                dispatch({ type: 'SELECT', date: cell.date, voteType: tool })
              }}
            >
              <span>{cell.day}</span>
              {selected && <i><Check size={10} /></i>}
              {enabled && availableCount > 0 && <small>{availableCount}명 가능</small>}
            </button>
          )
        })}
      </div>
      <div className="vote-calendar-legend" aria-hidden="true">
        <span><i className="heat-4" /> 많이 가능</span>
        <span><i className="heat-2" /> 일부 가능</span>
        <span><i className="heat-0" /> 의견 없음</span>
        <span className="vote-calendar-legend-note">숫자는 ‘가능’으로 선택한 인원입니다.</span>
      </div>
    </div>
  )
}
