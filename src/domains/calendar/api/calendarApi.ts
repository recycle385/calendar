import { apiRequest } from '../../../shared/api/httpClient'
import type { DefaultResponse } from '../../../shared/types/api'
import type {
  CalendarResponse,
  CreateCalendarRequest,
  CreateCalendarResponse,
  GetMyCalendarsResponse,
  UpdateCalendarRequest,
} from '../model/types'

export function createCalendar(payload: CreateCalendarRequest, accessToken: string) {
  return apiRequest<CreateCalendarResponse>('/calendars', {
    method: 'POST',
    body: payload,
    token: accessToken,
  })
}

export function getMyCalendars(accessToken: string) {
  return apiRequest<GetMyCalendarsResponse>('/calendars/my', {
    token: accessToken,
  })
}

export function getCalendarBySlug(slug: string) {
  return apiRequest<CalendarResponse>(`/calendars/${slug}`)
}

export function updateCalendar(
  slug: string,
  payload: UpdateCalendarRequest,
  accessToken: string,
) {
  return apiRequest<DefaultResponse | CalendarResponse>(`/calendars/${slug}`, {
    method: 'PATCH',
    body: payload,
    token: accessToken,
  })
}

export function deleteCalendar(slug: string, accessToken: string) {
  return apiRequest<DefaultResponse>(`/calendars/${slug}`, {
    method: 'DELETE',
    token: accessToken,
  })
}

export function closeCalendar(slug: string, accessToken: string) {
  return apiRequest<CalendarResponse>(`/calendars/${slug}/close`, {
    method: 'POST',
    token: accessToken,
  })
}
