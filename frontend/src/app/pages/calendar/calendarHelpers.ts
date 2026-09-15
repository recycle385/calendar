import type { Calendar } from '../../../domains/calendar'

export const PLACEHOLDER_IMAGE_PATH = 'edit/calendar-3d.webp'

export function calendarStateLabel(calendar: Calendar) {
  return calendar.is_closed ? '마감' : '진행 중'
}

export function isValidCalendarRange(startDate: string, endDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return false
  }

  const start = new Date(`${startDate}T00:00:00`).getTime()
  const end = new Date(`${endDate}T00:00:00`).getTime()
  const maxRange = 365 * 24 * 60 * 60 * 1000
  return Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start <= maxRange
}

export function getCalendarImageAlt(title: string) {
  return `${title} 대표 이미지`
}
