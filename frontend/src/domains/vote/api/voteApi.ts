import { apiRequest } from '../../../shared/api/httpClient'
import type {
  GetParticipantVotesResponse,
  GetVoteStatusResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
} from '../model/types'

export function submitVotes(slug: string, payload: SubmitVoteRequest, participantToken: string) {
  return apiRequest<SubmitVoteResponse>(`/calendars/${slug}/votes`, {
    method: 'POST',
    body: payload,
    token: participantToken,
    auth: 'participant',
  })
}

export function getVoteStatus(slug: string) {
  return apiRequest<GetVoteStatusResponse>(`/calendars/${slug}/votes`)
}

export function getParticipantVotes(slug: string, participantUuid: string) {
  return apiRequest<GetParticipantVotesResponse>(
    `/calendars/${slug}/votes/${participantUuid}`,
  )
}
