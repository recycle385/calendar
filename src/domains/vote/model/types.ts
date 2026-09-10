import type { DefaultResponse } from '../../../shared/types/api'

export type VoteType = 'available' | 'unavailable' | 'maybe'

export interface VoteStatusItem {
  participant_id: number
  participant_nickname: string
  participant_color: string
  vote_type: VoteType
}

export interface DateVoteStatus {
  date_option_id: number
  date_value: string
  is_enabled: boolean
  votes: VoteStatusItem[]
}

export interface ParticipantVoteRecord {
  vote_id: number
  date_value: string
  vote_type: VoteType
  created_at: string
}

export interface VoteInput {
  date: string
  voteType: VoteType
}

export interface SubmitVoteRequest {
  votes: VoteInput[]
}

export interface SubmitVoteResponse extends DefaultResponse {
  votes: VoteInput[]
  votedCount: number
}

export interface VoteCalendarSummary {
  slug: string
  title: string
  start_date: string
  end_date: string
  is_closed: boolean
}

export interface VoteParticipantSummary {
  uuid: string
  nickname: string
  color_code: string
}

export interface GetVoteStatusResponse {
  calendar: VoteCalendarSummary
  voteStatus: DateVoteStatus[]
}

export interface GetParticipantVotesResponse {
  participant: VoteParticipantSummary
  votes: ParticipantVoteRecord[]
  voteCount: number
}
