import { describe, expect, it } from 'vitest'

import { getCalendarVoteState, getDaysUntilCalendarDate } from './voteState'

describe('캘린더 투표 상태', () => {
  it.each([
    ['2026-09-16T14:59:59.000Z', 1],
    ['2026-09-16T15:00:00.000Z', 0],
  ])('한국 날짜 경계에서 남은 날짜를 계산한다', (now, expected) => {
    expect(getDaysUntilCalendarDate('2026-09-17', new Date(now))).toBe(expected)
  })

  it('카드와 상세 화면에서 사용할 상태 텍스트와 색상을 함께 반환한다', () => {
    expect(getCalendarVoteState(false, 0)).toEqual({
      label: '오늘 마감',
      className: 'bg-[#ffe4e4] text-[#d83d3d]',
      accentClassName: 'text-[#d83d3d]',
    })
  })
})
