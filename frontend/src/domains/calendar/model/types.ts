import type { DefaultResponse } from '../../../shared/types/api'

export interface Calendar {
  slug: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  vote_start_date: string
  vote_end_date: string
  is_closed: boolean
  hostParticipantUuid: string
  created_at: string
  updated_at: string
  expired_at: string | null
  participant_count?: number
}

export interface CreateCalendarRequest {
  title: string
  start_date: string
  end_date: string
  vote_start_date: string
  vote_end_date: string
  description?: string
  hostNickname: string
}

export interface UpdateCalendarRequest {
  title?: string
  description?: string | null
  start_date?: string
  end_date?: string
  vote_start_date?: string
  vote_end_date?: string
}

export interface CreateCalendarResponse extends DefaultResponse {
  calendar: Calendar
  shareUrl: string
  participantToken: string
}

export interface GetMyCalendarsResponse {
  calendars: Calendar[]
  count: number
}

export interface CalendarResponse extends DefaultResponse {
  calendar: Calendar
}
