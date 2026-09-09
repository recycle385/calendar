import { apiRequest } from '../../../shared/api/httpClient'
import type { DefaultResponse } from '../../../shared/types/api'
import type {
  GoogleCallbackLoginResponse,
  GoogleCallbackPendingSignupResponse,
  GoogleSignupRequest,
  GoogleSignupResponse,
  RefreshTokenResponse,
} from '../model/types'

export function getGoogleLoginUrl() {
  return `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google`
}

export function handleGoogleCallback(code: string, state: string) {
  const query = new URLSearchParams({ code, state })

  return apiRequest<GoogleCallbackLoginResponse | GoogleCallbackPendingSignupResponse>(
    `/auth/google/callback?${query.toString()}`,
  )
}

export function signupWithGoogle(payload: GoogleSignupRequest) {
  return apiRequest<GoogleSignupResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export function refreshAccessToken() {
  return apiRequest<RefreshTokenResponse>('/auth/refresh', {
    method: 'POST',
  })
}

export function logout() {
  return apiRequest<DefaultResponse>('/auth/logout', {
    method: 'POST',
  })
}
