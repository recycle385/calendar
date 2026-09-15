import { apiRequest } from '../../../shared/api/httpClient'
import type { DefaultResponse } from '../../../shared/types/api'
import type {
  GetParticipantsResponse,
  LoginParticipantRequest,
  LoginParticipantResponse,
  ParticipantReconciliationAction,
  ParticipantReconciliationPreview,
  ReconcileParticipantResponse,
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

export function getParticipantReconciliation(
  slug: string,
  guestParticipantToken: string,
  accessToken: string,
) {
  return apiRequest<ParticipantReconciliationPreview>(
    `/calendars/${slug}/participants/reconciliation`,
    {
      token: accessToken,
      auth: 'main',
      headers: { 'X-Participant-Token': guestParticipantToken },
    },
  )
}

export function reconcileParticipant(
  slug: string,
  guestParticipantToken: string,
  accessToken: string,
  action: ParticipantReconciliationAction,
) {
  return apiRequest<ReconcileParticipantResponse>(
    `/calendars/${slug}/participants/reconciliation`,
    {
      method: 'POST',
      body: { action },
      token: accessToken,
      auth: 'main',
      headers: { 'X-Participant-Token': guestParticipantToken },
    },
  )
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
