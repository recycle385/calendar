import { z } from 'zod'

import { isValidCalendarRange } from '../../calendarHelpers'

export const calendarSettingsSchema = z
  .object({
    title: z.string().trim().min(1, '캘린더 제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.'),
    description: z.string().trim().max(500, '설명은 500자 이내로 입력해주세요.'),
    vote_start_date: z.string().min(1, '투표 시작일을 선택해주세요.'),
    vote_end_date: z.string().min(1, '투표 종료일을 선택해주세요.'),
    start_date: z.string().min(1, '후보 시작일을 선택해주세요.'),
    end_date: z.string().min(1, '후보 종료일을 선택해주세요.'),
  })
  .refine(({ vote_start_date, vote_end_date }) => isValidCalendarRange(vote_start_date, vote_end_date), {
    message: '투표 시작일부터 종료일까지 최대 366일 안에서 올바른 날짜를 선택해주세요.',
    path: ['vote_end_date'],
  })
  .refine(({ start_date, end_date }) => isValidCalendarRange(start_date, end_date), {
    message: '후보 시작일부터 종료일까지 최대 366일 안에서 올바른 날짜를 선택해주세요.',
    path: ['end_date'],
  })

export type CalendarSettingsForm = z.infer<typeof calendarSettingsSchema>
