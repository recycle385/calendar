import { apiRequest } from '../../../shared/api/httpClient'
import type { AnalyzeVoteRequest, AnalyzeVoteResponse } from '../model/types'

export function analyzeVoteResult(
  slug: string,
  payload: AnalyzeVoteRequest,
  participantToken: string,
) {
  return apiRequest<AnalyzeVoteResponse>(`/calendars/${slug}/analysis`, {
    method: 'POST',
    body: payload,
    token: participantToken,
    auth: 'participant',
  })
}
