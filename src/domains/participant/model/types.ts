import type { DefaultResponse } from '../../../shared/types/api'

export type ParticipantRole = 'host' | 'guest'

export interface Participant {
  uuid: string
  nickname: string
  color_code: string
  joined_at: string
  vote_count: number
  total_dates: number
  vote_rate: number
}

export interface ParticipantSummary {
  uuid: string
  nickname: string
  color_code: string
  joined_at: string
}

export interface ParticipantWithRole extends ParticipantSummary {
  role: ParticipantRole
}

export interface RegisterParticipantRequest {
  nickname: string
  password?: string
}

export interface LoginParticipantRequest {
  nickname?: string
  password?: string
}

export interface RegisterParticipantResponse extends DefaultResponse {
  participant: ParticipantWithRole
  participantToken: string
}

export interface LoginParticipantResponse extends DefaultResponse {
  participant: ParticipantSummary
  participantToken: string
}

export interface GetParticipantsResponse {
  participants: Participant[]
  count: number
}
