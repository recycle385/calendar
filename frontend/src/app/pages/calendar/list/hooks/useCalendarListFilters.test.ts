import { describe, expect, it } from 'vitest'

import type { Calendar } from '../../../../../domains/calendar'
import { compareCalendars, type SortOrder } from './useCalendarListFilters'

function calendar(overrides: Partial<Calendar>): Calendar {
  return {
    slug: 'calendar-a',
    title: '가나다',
    description: null,
    start_date: '2026-10-01',
    end_date: '2026-10-03',
    vote_start_date: '2026-09-01',
    vote_end_date: '2026-09-20',
    is_closed: false,
    hostParticipantUuid: 'host-a',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-02T00:00:00.000Z',
    expired_at: '2026-10-20T00:00:00.000Z',
    participant_count: 1,
    ...overrides,
  }
}

describe('내 캘린더 정렬', () => {
  const older = calendar({
    slug: 'older',
    title: '나 모임',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-09-10T00:00:00.000Z',
  })
  const newer = calendar({
    slug: 'newer',
    title: '가 모임',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-05T00:00:00.000Z',
  })

  it.each([
    ['name', ['newer', 'older']],
    ['newest', ['newer', 'older']],
    ['oldest', ['older', 'newer']],
    ['updated', ['older', 'newer']],
  ] satisfies Array<[SortOrder, string[]]>)('%s 기준으로 정렬한다', (sort, expected) => {
    expect([older, newer].sort((left, right) => compareCalendars(left, right, sort)).map(({ slug }) => slug)).toEqual(expected)
  })

  it('정렬 값이 같으면 slug로 결과를 안정화한다', () => {
    const second = calendar({ slug: 'b' })
    const first = calendar({ slug: 'a' })
    expect([second, first].sort((left, right) => compareCalendars(left, right, 'newest')).map(({ slug }) => slug)).toEqual(['a', 'b'])
  })

  it('마감 임박순은 진행 중인 캘린더의 투표 종료일이 가까운 순서로 정렬한다', () => {
    const later = calendar({ slug: 'later', vote_end_date: '2026-09-20' })
    const sooner = calendar({ slug: 'sooner', vote_end_date: '2026-09-16' })
    const closed = calendar({ slug: 'closed', vote_end_date: '2026-09-15', is_closed: true })

    expect(
      [closed, later, sooner]
        .sort((left, right) => compareCalendars(left, right, 'deadline'))
        .map(({ slug }) => slug),
    ).toEqual(['sooner', 'later', 'closed'])
  })
})
