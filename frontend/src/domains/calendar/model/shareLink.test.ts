import { describe, expect, it } from 'vitest'

import { parseCalendarJoinPath } from './shareLink'

describe('parseCalendarJoinPath', () => {
  const origin = 'https://moim.example'

  it.each([
    ['/c/calendar-slug', '/c/calendar-slug/join'],
    ['/c/calendar-slug/join', '/c/calendar-slug/join'],
    ['https://moim.example/calendar/calendar-slug', '/c/calendar-slug/join'],
  ])('서비스 공유 링크 %s를 참여 경로로 변환한다', (input, expected) => {
    expect(parseCalendarJoinPath(input, origin)).toBe(expected)
  })

  it('다른 서비스 주소나 일반 소개 경로는 거부한다', () => {
    expect(parseCalendarJoinPath('https://attacker.example/c/test', origin)).toBeNull()
    expect(parseCalendarJoinPath('/features', origin)).toBeNull()
  })
})
