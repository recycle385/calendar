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
const heatClass = [
  'bg-white',
  'bg-[#f0faf5]',
  'bg-[#ddf5e8]',
  'bg-[#bcebd2]',
  'bg-[#91dfb8] text-[#0f6240]',
]
const ownVoteClass: Record<VoteType, string> = {
  available: 'shadow-[inset_0_-3px_#21ad70]',
  maybe: 'shadow-[inset_0_-3px_#e9ae27]',
  unavailable: 'shadow-[inset_0_-3px_#df6972]',
}
const ownVoteIndicatorClass: Record<VoteType, string> = {
  available: 'bg-[#20ae70]',
  maybe: 'bg-[#e9ae27]',
  unavailable: 'bg-[#df6972]',
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
    <div className="overflow-hidden rounded-[13px] border border-[#e2eaf4] bg-white">
      <div className="flex min-h-[58px] items-center justify-between border-b border-[#e8eef6] px-3.5 py-2.5 max-[520px]:px-[9px]">
        <div className="flex items-center gap-[5px]">
          <button className="grid size-[30px] place-items-center rounded-lg border border-[#e4ebf4] bg-white text-[#527099] disabled:opacity-35" type="button" aria-label="이전 달" disabled={currentMonthIndex <= 0} onClick={() => moveMonth(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button className="grid size-[30px] place-items-center rounded-lg border border-[#e4ebf4] bg-white text-[#527099] disabled:opacity-35" type="button" aria-label="다음 달" disabled={currentMonthIndex < 0 || currentMonthIndex >= months.length - 1} onClick={() => moveMonth(1)}>
            <ChevronRight size={18} />
          </button>
          <strong className="ml-2 text-base text-[#18365e] max-[520px]:ml-1 max-[520px]:text-sm">{year}년 {month}월</strong>
        </div>
        {months.length > 1 && <span className="text-xs font-extrabold text-[#8193aa]">{currentMonthIndex + 1} / {months.length}</span>}
      </div>

      <div className="grid grid-cols-7 border-b border-[#edf1f6] px-3 max-[520px]:px-[5px]" aria-hidden="true">
        {weekDays.map((day, index) => <span className={`px-0.5 py-[11px] text-center text-xs ${index === 0 ? 'text-[#df7474]' : 'text-[#8394aa]'}`} key={day}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 px-3 max-[520px]:px-[5px]">
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
              className={`relative grid min-h-16 min-w-0 content-center justify-items-center gap-[3px] border-0 border-r border-b border-[#edf1f6] text-[13px] text-[#526b8e] nth-[7n]:border-r-0 max-[520px]:min-h-[50px] ${heatClass[heatLevel]} ${cell.inMonth ? '' : '!bg-[#fbfcfe] !text-[#bcc7d5]'} ${enabled ? 'cursor-pointer hover:!bg-[#f4f8ff]' : ''} ${selectedDate === cell.date ? 'z-[1] rounded-lg outline-2 -outline-offset-2 outline-brand-500' : ''} ${selected ? ownVoteClass[selected] : ''}`}
              onClick={() => {
                onSelectDate(cell.date)
                dispatch({ type: 'SELECT', date: cell.date, voteType: tool })
              }}
            >
              <span className="font-extrabold">{cell.day}</span>
              {selected && <i className={`absolute top-[7px] right-[7px] grid size-[15px] place-items-center rounded-full text-white max-[520px]:top-1 max-[520px]:right-1 max-[520px]:size-[13px] ${ownVoteIndicatorClass[selected]}`}><Check size={10} /></i>}
              {enabled && availableCount > 0 && <small className="text-xs text-inherit max-[520px]:hidden">{availableCount}명 가능</small>}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3.5 px-[15px] py-[13px] text-xs text-[#8393a9] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px] [&_i]:size-[7px] [&_i]:rounded-full" aria-hidden="true">
        <span><i className="bg-[#70d5a2]" /> 많이 가능</span>
        <span><i className="bg-[#ccefdc]" /> 일부 가능</span>
        <span><i className="bg-[#e8edf4]" /> 의견 없음</span>
        <span className="ml-auto">숫자는 ‘가능’으로 선택한 인원입니다.</span>
      </div>
    </div>
  )
}
