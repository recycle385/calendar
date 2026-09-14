import { describe, expect, it } from 'vitest'

import { calendarSchema } from './calendarForm'

const validForm = {
  title: '가을 모임',
  description: '일정을 골라주세요.',
  hostNickname: '방장',
  vote_start_date: '2026-09-14',
  vote_end_date: '2026-09-20',
  start_date: '2026-10-01',
  end_date: '2026-10-03',
}

describe('캘린더 생성 폼', () => {
  it('투표 기간과 후보 날짜 기간을 서로 독립적으로 받는다', () => {
    expect(calendarSchema.safeParse(validForm).success).toBe(true)
  })

  it('투표 종료일이 시작일보다 빠르면 거부한다', () => {
    const result = calendarSchema.safeParse({
      ...validForm,
      vote_end_date: '2026-09-13',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['vote_end_date'],
          }),
        ]),
      )
    }
  })

  it('후보 날짜 종료일이 시작일보다 빠르면 거부한다', () => {
    const result = calendarSchema.safeParse({
      ...validForm,
      end_date: '2026-09-30',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['end_date'],
          }),
        ]),
      )
    }
  })
})
