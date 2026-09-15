import { describe, expect, it } from 'vitest'

import { calendarSettingsSchema } from './calendarSettingsForm'

const validSettings = {
  title: '가을 모임',
  description: '가능한 날짜를 골라주세요.',
  vote_start_date: '2026-09-15',
  vote_end_date: '2026-09-20',
  start_date: '2026-10-01',
  end_date: '2026-10-03',
}

describe('calendarSettingsSchema', () => {
  it('투표 기간과 후보 날짜 기간을 각각 검증한다', () => {
    expect(calendarSettingsSchema.safeParse(validSettings).success).toBe(true)
  })

  it('종료일이 시작일보다 빠른 투표 기간을 거부한다', () => {
    const result = calendarSettingsSchema.safeParse({
      ...validSettings,
      vote_end_date: '2026-09-14',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: ['vote_end_date'] }),
      ]))
    }
  })

  it('366일을 초과하는 후보 날짜 기간을 거부한다', () => {
    const result = calendarSettingsSchema.safeParse({
      ...validSettings,
      start_date: '2026-01-01',
      end_date: '2027-01-02',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: ['end_date'] }),
      ]))
    }
  })
})
