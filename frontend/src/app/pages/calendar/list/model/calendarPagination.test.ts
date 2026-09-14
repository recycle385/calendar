import { describe, expect, it } from 'vitest'

import { paginateCalendars } from './calendarPagination'

describe('내 캘린더 페이지네이션', () => {
  const calendars = Array.from({ length: 13 }, (_, index) => index + 1)

  it.each([
    [1, [1, 2, 3, 4, 5, 6]],
    [2, [7, 8, 9, 10, 11, 12]],
    [3, [13]],
  ])('%i페이지에 최대 6개를 표시한다', (page, expected) => {
    const result = paginateCalendars(calendars, page)
    expect(result.visibleItems).toEqual(expected)
    expect(result.emptySlotCount).toBe(6 - expected.length)
  })

  it('존재하지 않는 페이지는 마지막 페이지로 보정한다', () => {
    expect(paginateCalendars(calendars, 10)).toEqual({
      currentPage: 3,
      emptySlotCount: 5,
      totalPages: 3,
      visibleItems: [13],
    })
  })
})
