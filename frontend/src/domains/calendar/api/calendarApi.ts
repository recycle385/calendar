import { apiRequest } from '../../../shared/api/httpClient'
import type { DefaultResponse } from '../../../shared/types/api'
import type {
  CalendarResponse,
  CreateCalendarRequest,
  CreateCalendarResponse,
  GetMyCalendarsResponse,
  GetJoinedCalendarsResponse,
  UpdateCalendarRequest,
} from '../model/types'

export function createCalendar(payload: CreateCalendarRequest, accessToken: string) {
  return apiRequest<CreateCalendarResponse>('/calendars', {
    method: 'POST',
    body: payload,
    token: accessToken,
    auth: 'main',
  })
}

export function getMyCalendars(accessToken: string) {
  return apiRequest<GetMyCalendarsResponse>('/calendars/my', {
    token: accessToken,
    auth: 'main',
  })
}

export function getJoinedCalendars(accessToken: string) {
  return apiRequest<GetJoinedCalendarsResponse>('/calendars/joined', {
    token: accessToken,
    auth: 'main',
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
    auth: 'main',
  })
}

export function deleteCalendar(slug: string, accessToken: string) {
  return apiRequest<DefaultResponse>(`/calendars/${slug}`, {
    method: 'DELETE',
    token: accessToken,
    auth: 'main',
  })
}

export function closeCalendar(slug: string, accessToken: string) {
  return apiRequest<CalendarResponse>(`/calendars/${slug}/close`, {
    method: 'POST',
    token: accessToken,
    auth: 'main',
  })
}
