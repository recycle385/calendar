import type { DefaultResponse } from '../../../shared/types/api'

export type ParticipantRole = 'host' | 'guest'
export type ParticipantProfileType = 'account' | 'alias'

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
  profileType?: ParticipantProfileType
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

export type EnterGuestParticipantResponse = RegisterParticipantResponse

export interface GetParticipantsResponse {
  participants: Participant[]
  count: number
}

export type ParticipantReconciliationAction =
  | 'keep-account'
  | 'use-guest-votes'
  | 'claim-account'
  | 'claim-alias'

export type ParticipantReconciliationState =
  | 'host-conflict'
  | 'participant-conflict'
  | 'claimable'

export interface ParticipantReconciliationPreview {
  state: ParticipantReconciliationState
  accountNickname: string
  voteChangesAllowed: boolean
  guest: {
    uuid: string
    nickname: string
    voteCount: number
  }
  accountParticipant: {
    uuid: string
    nickname: string
    role: ParticipantRole
    profileType: ParticipantProfileType
    voteCount: number
  } | null
}

export interface ReconcileParticipantResponse extends DefaultResponse {
  participant: ParticipantWithRole & { profileType: ParticipantProfileType }
  participantToken: string
  removedGuestUuid: string
}
