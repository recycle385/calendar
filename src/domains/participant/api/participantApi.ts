import { apiRequest } from '../../../shared/api/httpClient'
import type { DefaultResponse } from '../../../shared/types/api'
import type {
  GetParticipantsResponse,
  LoginParticipantRequest,
  LoginParticipantResponse,
  RegisterParticipantRequest,
  RegisterParticipantResponse,
} from '../model/types'

export function registerParticipant(
  slug: string,
  payload: RegisterParticipantRequest,
  accessToken?: string | null,
) {
  return apiRequest<RegisterParticipantResponse>(`/calendars/${slug}/participants`, {
    method: 'POST',
    body: payload,
    token: accessToken,
    auth: accessToken ? 'main' : 'none',
  })
}

export function loginParticipant(
  slug: string,
  payload: LoginParticipantRequest,
  accessToken?: string | null,
) {
  return apiRequest<LoginParticipantResponse>(`/calendars/${slug}/participants/login`, {
    method: 'POST',
    body: payload,
    token: accessToken,
    auth: accessToken ? 'main' : 'none',
  })
}

export function getParticipants(slug: string) {
  return apiRequest<GetParticipantsResponse>(`/calendars/${slug}/participants`)
}

export function deleteParticipantSelf(slug: string, participantToken: string) {
  return apiRequest<DefaultResponse>(`/calendars/${slug}/participants/self`, {
    method: 'DELETE',
    token: participantToken,
    auth: 'participant',
  })
}

export function deleteParticipantByHost(
  slug: string,
  participantUuid: string,
  accessToken: string,
) {
  return apiRequest<DefaultResponse>(`/calendars/${slug}/participants/${participantUuid}`, {
    method: 'DELETE',
    token: accessToken,
    auth: 'main',
  })
}
