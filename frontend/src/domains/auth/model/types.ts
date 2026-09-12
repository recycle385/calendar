import type { DefaultResponse } from '../../../shared/types/api'

export interface AuthUser {
  user_uuid: string
  email: string
  oauth_provider: 'google' | 'kakao'
  nickname: string | null
  profile_image_url: string | null
  isTermsAgreed: boolean
  created_at: string
}

export interface GoogleCallbackPendingSignupResponse extends DefaultResponse {
  signupToken: string
}

export interface GoogleCallbackLoginResponse extends DefaultResponse {
  isNewUser: boolean
  accessToken: string
  user: AuthUser
}

export interface GoogleSignupRequest {
  signupToken: string
  isTermsAgreed: boolean
}

export interface GoogleSignupResponse extends DefaultResponse {
  accessToken: string
  user: AuthUser
}

export interface RefreshTokenResponse extends DefaultResponse {
  accessToken: string
}
