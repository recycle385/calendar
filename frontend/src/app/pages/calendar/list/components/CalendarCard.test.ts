import { describe, expect, it } from 'vitest'

import { formatVoteEndDate, getVoteState } from './CalendarCard'

describe('캘린더 투표 마감 상태', () => {
  it.each([
    [4, '진행 중'],
    [3, '마감 임박'],
    [2, '마감 임박'],
    [1, '내일 마감'],
    [0, '오늘 마감'],
    [-1, '마감'],
  ])('마감까지 %i일이면 %s으로 표시한다', (daysLeft, expected) => {
    expect(getVoteState(false, daysLeft).label).toBe(expected)
  })

  it('수동 마감은 남은 기간과 관계없이 마감으로 표시한다', () => {
    expect(getVoteState(true, 10).label).toBe('마감')
  })

  it('단계별 상태 색상을 서로 구분한다', () => {
    const colors = [4, 3, 1, 0, -1].map((daysLeft) => getVoteState(false, daysLeft).className)
    expect(new Set(colors).size).toBe(5)
  })

  it.each([
    [0, '오늘 (9월 14일)'],
    [1, '내일 (9월 14일)'],
    [-1, '어제 (9월 14일)'],
  ])('종료일이 오늘·내일·어제이면 상대 날짜로 표시한다', (daysLeft, expected) => {
    expect(formatVoteEndDate('2026-09-14', daysLeft)).toBe(expected)
  })

  it('그 외 날짜는 기존 날짜와 요일 형식을 유지한다', () => {
    expect(formatVoteEndDate('2026-09-14', 4)).toBe('9월 14일 (월)')
  })
})
