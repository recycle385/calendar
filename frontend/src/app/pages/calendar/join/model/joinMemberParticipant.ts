import {
  loginParticipant,
  registerParticipant,
  type LoginParticipantResponse,
  type RegisterParticipantResponse,
} from '../../../../../domains/participant'
import { isApiError } from '../../../../../shared/api/httpClient'

type MemberParticipantResponse = LoginParticipantResponse | RegisterParticipantResponse

export async function joinMemberParticipant(
  slug: string,
  nickname: string,
  accessToken: string | null,
): Promise<MemberParticipantResponse> {
  try {
    return await loginParticipant(slug, {}, accessToken)
  } catch (error) {
    if (!isApiError(error) || error.status !== 404) throw error
  }

  return registerParticipant(slug, { nickname: nickname.trim() }, accessToken)
}
